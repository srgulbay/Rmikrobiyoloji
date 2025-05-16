const { UserFlashBox, FlashCard, Question, Topic, User, sequelize } = require('../../models');
const { Op } = require('sequelize');

const LEITNER_BOX_INTERVALS = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };
const MAX_BOX_NUMBER = 5;

const calculateNextReviewDate = (currentBoxNumber, isCorrect) => {
  const now = new Date();
  let nextBox = currentBoxNumber;
  if (isCorrect) {
    nextBox = Math.min(currentBoxNumber + 1, MAX_BOX_NUMBER + 1);
  } else {
    nextBox = 1;
  }
  if (nextBox > MAX_BOX_NUMBER) {
    const masteredDate = new Date(now);
    masteredDate.setDate(now.getDate() + (LEITNER_BOX_INTERVALS[MAX_BOX_NUMBER] || 30) * 2.5);
    return { nextBoxNumber: MAX_BOX_NUMBER, nextReviewAt: masteredDate, isMasteredUpdate: true };
  }
  const intervalDays = LEITNER_BOX_INTERVALS[nextBox] || LEITNER_BOX_INTERVALS[1];
  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(now.getDate() + intervalDays);
  nextReviewDate.setHours(5, 0, 0, 0); // Sabah 05:00'e ayarla
  return { nextBoxNumber: nextBox, nextReviewAt: nextReviewDate, isMasteredUpdate: false };
};

const getReviewItems = async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 10; // Frontend'den gelen type'a göre REVIEW_BATCH_SIZE kullanılacak
  const itemTypeFilter = req.query.type;

  console.log(`[SRSController getReviewItems] Fetching for userId: ${userId}, limit: ${limit}, itemTypeFilter: ${itemTypeFilter}`);

  try {
    const whereConditions = {
      userId,
      isMastered: false,
      nextReviewAt: { [Op.lte]: new Date() }
    };

    if (itemTypeFilter === 'question') {
      whereConditions.questionId = { [Op.ne]: null };
      whereConditions.flashCardId = null;
      whereConditions.topicId = null;
      whereConditions.sourceContext = 'INDIVIDUAL'; // Sadece bireysel eklenen sorular
    } else if (itemTypeFilter === 'flashcard') {
      whereConditions.flashCardId = { [Op.ne]: null };
      whereConditions.questionId = null;
      whereConditions.topicId = null;
      // Şimdilik tüm flashkartları getir, gerekirse sourceContext: 'INDIVIDUAL' eklenebilir
    } else if (itemTypeFilter === 'topic_summary') {
      whereConditions.topicId = { [Op.ne]: null };
      whereConditions.questionId = null;
      whereConditions.flashCardId = null;
      // Konu özetleri INDIVIDUAL veya BRANCH_DERIVED olabilir
      whereConditions.sourceContext = { [Op.in]: ['INDIVIDUAL', 'BRANCH_DERIVED'] };
    }
    // itemTypeFilter yoksa, tüm türleri ve kaynakları getirir (bu durum pek kullanılmayacak)

    const itemsToReview = await UserFlashBox.findAll({
      where: whereConditions,
      include: [
        { model: FlashCard, as: 'flashCard', required: false },
        { model: Question, as: 'question', required: false },
        { model: Topic, as: 'topic', required: false }
      ],
      order: [ ['boxNumber', 'ASC'], ['nextReviewAt', 'ASC'] ],
      limit: limit
    });

    console.log('[SRSController DEBUG getReviewItems] Fetched itemsToReview RAW:', JSON.stringify(itemsToReview, null, 2));

    if (!itemsToReview || itemsToReview.length === 0) {
      return res.status(200).json({ message: `Tebrikler! Şu an tekrar etmeniz gereken ${itemTypeFilter ? itemTypeFilter.replace('_', ' ') + ' türünde' : ''} bir öğe bulunmuyor.`, items: [] });
    }

    const formattedItems = itemsToReview.map(item => {
        let content = null;
        let actualItemType = null;

        if (item.flashCardId && item.flashCard) {
            actualItemType = 'flashcard'; content = item.flashCard;
        } else if (item.questionId && item.question) {
            actualItemType = 'question'; content = item.question;
        } else if (item.topicId && item.topic) {
            actualItemType = 'topic_summary'; content = item.topic;
        } else {
            console.warn(`[SRSController WARN getReviewItems] UserFlashBox ID: ${item.id} için ilişki eksik.`);
            return null;
        }
        return {
            userFlashBoxId: item.id, boxNumber: item.boxNumber,
            lastReviewedAt: item.lastReviewedAt, nextReviewAt: item.nextReviewAt,
            itemType: actualItemType, item: content ? content.toJSON() : null,
        };
    }).filter(Boolean);

    console.log('[SRSController DEBUG getReviewItems] Formatted items to send:', JSON.stringify(formattedItems, null, 2));
    res.status(200).json({ items: formattedItems, message: formattedItems.length > 0 ? undefined : `Uygun formatta ${itemTypeFilter ? itemTypeFilter.replace('_', ' ') + ' türünde' : ''} tekrar öğesi bulunamadı.` });

  } catch (error) {
    console.error('[SRSController getReviewItems] Hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Tekrar öğeleri getirilemedi.' });
  }
};

const submitReviewResult = async (req, res) => {
  const userId = req.user.id;
  const { userFlashBoxId } = req.params;
  const { wasCorrect } = req.body;
  if (wasCorrect === undefined) return res.status(400).json({ message: 'Tekrar sonucu (wasCorrect) gönderilmedi.' });
  try {
    const userFlashBoxItem = await UserFlashBox.findOne({ where: { id: userFlashBoxId, userId: userId } });
    if (!userFlashBoxItem) return res.status(404).json({ message: 'Güncellenecek tekrar öğesi bulunamadı.' });
    const { nextBoxNumber, nextReviewAt, isMasteredUpdate } = calculateNextReviewDate(userFlashBoxItem.boxNumber, wasCorrect);
    userFlashBoxItem.boxNumber = nextBoxNumber <= MAX_BOX_NUMBER ? nextBoxNumber : userFlashBoxItem.boxNumber;
    userFlashBoxItem.lastReviewedAt = new Date();
    userFlashBoxItem.nextReviewAt = nextReviewAt;
    userFlashBoxItem.isMastered = userFlashBoxItem.isMastered || isMasteredUpdate;
    await userFlashBoxItem.save();
    res.status(200).json({
        message: 'Tekrar sonucu kaydedildi.',
        updatedItemInfo: { /* ... */ }
    });
  } catch (error) {
    console.error(`[SRSController submitReviewResult] Hata (ID: ${userFlashBoxId}):`, error);
    res.status(500).json({ message: 'Sunucu hatası. Tekrar sonucu kaydedilemedi.' });
  }
};

const getAllTopicIdsIncludingDescendants = async (topicId) => {
    const parsedTopicId = parseInt(topicId, 10);
    if (isNaN(parsedTopicId)) return [];
    const topicIds = new Set([parsedTopicId]);
    const queue = [parsedTopicId];
    while (queue.length > 0) {
        const currentId = queue.shift();
        const children = await Topic.findAll({ where: { parentId: currentId }, attributes: ['id'], raw: true });
        children.forEach(child => { topicIds.add(child.id); queue.push(child.id);});
    }
    return Array.from(topicIds);
};

const addItemToSRS = async (req, res) => {
    const userId = req.user.id;
    const { itemId, itemType, examClassificationId } = req.body;
    console.log(`[SRSController addItemToSRS] Request: userId=${userId}, itemId=${itemId}, itemType=${itemType}, ecId=${examClassificationId}`);

    if (!itemId || !itemType) return res.status(400).json({ message: 'Öğe ID ve türü zorunludur.' });
    const lowerItemType = itemType.toLowerCase();
    if (!['flashcard', 'question', 'topic', 'branch'].includes(lowerItemType)) return res.status(400).json({ message: 'Geçersiz öğe türü.' });

    const itemsToCreateOrUpdate = [];
    try {
        if (lowerItemType === 'flashcard') {
            itemsToCreateOrUpdate.push({ foreignKeyField: 'flashCardId', id: parseInt(itemId), sourceContext: 'INDIVIDUAL' });
        } else if (lowerItemType === 'question') {
            itemsToCreateOrUpdate.push({ foreignKeyField: 'questionId', id: parseInt(itemId), sourceContext: 'INDIVIDUAL' });
        } else if (lowerItemType === 'topic') {
            const targetTopicId = parseInt(itemId);
            itemsToCreateOrUpdate.push({ foreignKeyField: 'topicId', id: targetTopicId, sourceContext: 'INDIVIDUAL' });
            const allRelatedTopicIds = await getAllTopicIdsIncludingDescendants(targetTopicId);
            if (allRelatedTopicIds.length > 0) {
                const questions = await Question.findAll({ where: { topicId: { [Op.in]: allRelatedTopicIds } }, attributes: ['id'] });
                questions.forEach(q => itemsToCreateOrUpdate.push({ foreignKeyField: 'questionId', id: q.id, sourceContext: 'TOPIC_DERIVED' }));
                const flashcards = await FlashCard.findAll({ where: { topicId: { [Op.in]: allRelatedTopicIds } }, attributes: ['id'] });
                flashcards.forEach(fc => itemsToCreateOrUpdate.push({ foreignKeyField: 'flashCardId', id: fc.id, sourceContext: 'TOPIC_DERIVED' }));
            }
        } else if (lowerItemType === 'branch') {
            if (!examClassificationId) return res.status(400).json({ message: 'Branş için sınav tipi zorunludur.' });
            const targetBranchId = parseInt(itemId);
            const targetEcId = parseInt(examClassificationId);
            const rootTopics = await Topic.findAll({ where: { branchId: targetBranchId, examClassificationId: targetEcId, parentId: null }, attributes: ['id'] });
            for (const rootTopic of rootTopics) {
                itemsToCreateOrUpdate.push({ foreignKeyField: 'topicId', id: rootTopic.id, sourceContext: 'BRANCH_DERIVED' });
                const allRelatedTopicIds = await getAllTopicIdsIncludingDescendants(rootTopic.id);
                if (allRelatedTopicIds.length > 0) {
                    const questions = await Question.findAll({ where: { topicId: { [Op.in]: allRelatedTopicIds } }, attributes: ['id'] });
                    questions.forEach(q => itemsToCreateOrUpdate.push({ foreignKeyField: 'questionId', id: q.id, sourceContext: 'TOPIC_DERIVED' })); // Branch'tan gelen topic'in alt soruları TOPIC_DERIVED
                    const flashcards = await FlashCard.findAll({ where: { topicId: { [Op.in]: allRelatedTopicIds } }, attributes: ['id'] });
                    flashcards.forEach(fc => itemsToCreateOrUpdate.push({ foreignKeyField: 'flashCardId', id: fc.id, sourceContext: 'TOPIC_DERIVED' }));
                }
            }
        }

        let addedCount = 0, updatedCount = 0, failedCount = 0;
        console.log(`[SRSController addItemToSRS] Items to process in DB: ${itemsToCreateOrUpdate.length}`);
        for (const item of itemsToCreateOrUpdate) {
            try {
                const defaults = {
                    userId, boxNumber: 1, nextReviewAt: new Date(), isMastered: false, lastReviewedAt: null,
                    sourceContext: item.sourceContext,
                    flashCardId: item.foreignKeyField === 'flashCardId' ? item.id : null,
                    questionId: item.foreignKeyField === 'questionId' ? item.id : null,
                    topicId: item.foreignKeyField === 'topicId' ? item.id : null,
                };
                const [ufbEntry, created] = await UserFlashBox.findOrCreate({
                    where: { userId, [item.foreignKeyField]: item.id },
                    defaults: defaults
                });
                if (created) {
                    addedCount++;
                    console.log(`[SRS addItemToSRS] CREATED: ${item.foreignKeyField}=${item.id}, context=${item.sourceContext}`);
                } else if (!ufbEntry.isMastered) {
                    ufbEntry.boxNumber = 1; ufbEntry.lastReviewedAt = null;
                    ufbEntry.nextReviewAt = new Date(); ufbEntry.isMastered = false;
                    // Eğer kaynak değişmişse (örn: önce TOPIC_DERIVED sonra INDIVIDUAL), sourceContext'i güncelle
                    if (ufbEntry.sourceContext !== item.sourceContext && item.sourceContext === 'INDIVIDUAL') {
                        ufbEntry.sourceContext = 'INDIVIDUAL';
                    }
                    await ufbEntry.save(); updatedCount++;
                    console.log(`[SRS addItemToSRS] UPDATED: ${item.foreignKeyField}=${item.id}, new_context=${ufbEntry.sourceContext}`);
                } else {
                     console.log(`[SRS addItemToSRS] SKIPPED (mastered): ${item.foreignKeyField}=${item.id}`);
                }
            } catch (dbError) {
                failedCount++; console.error(`[SRS addItemToSRS] DBError for ${item.foreignKeyField}:${item.id}`, dbError.message);
            }
        }
        res.status(201).json({ message: `İşlem tamamlandı: ${addedCount} yeni eklendi, ${updatedCount} güncellendi/sıfırlandı, ${failedCount} hata.`, summary: { added: addedCount, updated: updatedCount, failed: failedCount } });
    } catch (error) {
        console.error('[SRSController addItemToSRS] Genel Hata:', error);
        res.status(500).json({ message: 'Öğeler SRS\'e eklenirken sunucu hatası.' });
    }
};

const getSrsSummary = async (req, res) => {
  const userId = req.user.id;
  try {
    const commonDueWhere = { userId, isMastered: false, nextReviewAt: { [Op.lte]: new Date() } };

    const dueQuestionCount = await UserFlashBox.count({ where: { ...commonDueWhere, questionId: { [Op.ne]: null }, sourceContext: 'INDIVIDUAL' } });
    const dueFlashcardCount = await UserFlashBox.count({ where: { ...commonDueWhere, flashCardId: { [Op.ne]: null } /*, sourceContext: 'INDIVIDUAL' (gerekirse)*/ } });
    const dueTopicSummaryCount = await UserFlashBox.count({ where: { ...commonDueWhere, topicId: { [Op.ne]: null }, sourceContext: { [Op.in]: ['INDIVIDUAL', 'BRANCH_DERIVED'] } } });
    
    // Genel reviewItemsCount, tüm due item'ların toplamı
    const reviewItemsCount = await UserFlashBox.count({ where: commonDueWhere });

    const masteredItemsCount = await UserFlashBox.count({ where: { userId, isMastered: true } });
    const totalSrsItems = await UserFlashBox.count({ where: { userId } });
    const itemsInBoxesCounts = await UserFlashBox.findAll({
      where: { userId, isMastered: false },
      attributes: ['boxNumber', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['boxNumber'], raw: true
    });
    const itemsInBoxes = {};
    for (let i = 1; i <= MAX_BOX_NUMBER; i++) { itemsInBoxes[i] = 0; }
    itemsInBoxesCounts.forEach(item => {
      if (item.boxNumber >= 1 && item.boxNumber <= MAX_BOX_NUMBER) {
        itemsInBoxes[item.boxNumber] = parseInt(item.count, 10);
      }
    });

    res.status(200).json({
      reviewItemsCount, // Toplam tekrar edilecek (tüm türler)
      dueQuestionCount, // Sadece bireysel eklenen ve zamanı gelen sorular
      dueFlashcardCount, // Zamanı gelen tüm flashkartlar (şimdilik)
      dueTopicSummaryCount, // Zamanı gelen tüm konu özetleri (bireysel veya branştan)
      masteredItemsCount,
      totalSrsItems,
      itemsInBoxes
    });
  } catch (error) {
    console.error('[SRSController getSrsSummary] Hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. SRS özet bilgileri getirilemedi.' });
  }
};

module.exports = {
  getReviewItems,
  submitReviewResult,
  addItemToSRS,
  getSrsSummary
};
