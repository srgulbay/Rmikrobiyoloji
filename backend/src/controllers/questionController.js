const { Question, Topic, sequelize } = require('../../models'); // sequelize eklendi
const { Op } = require("sequelize"); // Op import edildiğinden emin olun

// YARDIMCI FONKSİYON: Verilen topicId ve tüm alt konu ID'lerini döndürür
const getDescendantTopicIds = async (topicId) => {
    const descendants = new Set([parseInt(topicId, 10)]);
    let currentLevelIds = [parseInt(topicId, 10)];
    while (currentLevelIds.length > 0) {
        const children = await Topic.findAll({
            where: { parentId: { [Op.in]: currentLevelIds } },
            attributes: ['id'],
            raw: true
        });
        currentLevelIds = children.map(t => t.id);
        currentLevelIds.forEach(id => descendants.add(id));
    }
    return Array.from(descendants);
};

// GET ALL QUESTIONS (Filtreleme ve Rastgele Sıralama Eklendi)
const getAllQuestions = async (req, res) => {
  const { topicId, includeSubtopics } = req.query;
  try {
    const queryOptions = {
      include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }],
      attributes: { exclude: ['topicId', 'createdAt', 'updatedAt'] },
      order: sequelize.random() // Rastgele sırala
    };
    if (topicId) {
      let topicIdsToFilter = [parseInt(topicId, 10)];
      if (includeSubtopics === 'true') {
         topicIdsToFilter = await getDescendantTopicIds(topicId);
      }
      queryOptions.where = {
         topicId: { [Op.in]: topicIdsToFilter }
      };
    }
    const questions = await Question.findAll(queryOptions);
    res.status(200).json(questions);
  } catch (error) {
    console.error('Soruları getirirken hata:', error);
    if (error instanceof TypeError || error instanceof SyntaxError || error.name === 'SequelizeDatabaseError') {
         res.status(400).json({ message: 'Geçersiz filtre parametresi veya veritabanı hatası.' });
    } else {
         res.status(500).json({ message: 'Sunucu hatası. Sorular getirilemedi.' });
    }
  }
};

// --- DİĞER MEVCUT FONKSİYONLARINIZ ---
const getQuestionById = async (req, res) => {
    try {
        const question = await Question.findByPk(req.params.id, { include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }] });
        if (!question) { return res.status(404).json({ message: 'Soru bulunamadı.' }); }
        res.status(200).json(question);
    } catch (error) {
        console.error('Soru getirilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası. Soru getirilemedi.' });
    }
};

const createQuestion = async (req, res) => {
  const { text, optionA, optionB, optionC, optionD, optionE, correctAnswer, topicId, imageUrl, classification } = req.body;
  if (!text || !optionA || !optionB || !optionC || !optionD || !optionE || !correctAnswer || !topicId) { return res.status(400).json({ message: 'Lütfen tüm zorunlu alanları doldurun (text, optionA-E, correctAnswer, topicId).' }); }
  try {
    const topicExists = await Topic.findByPk(topicId);
    if (!topicExists) { return res.status(400).json({ message: `Geçersiz konu ID'si: ${topicId}.` }); }
    const newQuestion = await Question.create({ text, optionA, optionB, optionC, optionD, optionE, correctAnswer, difficulty: 'medium', topicId, imageUrl: imageUrl || null, classification: classification || 'Çalışma Sorusu' });
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Soru oluştururken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Soru oluşturulamadı.' });
  }
};

const updateQuestion = async (req, res) => {
  const { id } = req.params;
  const { text, optionA, optionB, optionC, optionD, optionE, correctAnswer, topicId, imageUrl, classification } = req.body;
  try {
    const question = await Question.findByPk(id);
    if (!question) { return res.status(404).json({ message: 'Güncellenecek soru bulunamadı.' }); }
    if (topicId !== undefined) { if(topicId !== null) { const topicExists = await Topic.findByPk(topicId); if (!topicExists) { return res.status(400).json({ message: `Geçersiz konu ID'si: ${topicId}` }); } } question.topicId = topicId; }
    if (text !== undefined) question.text = text;
    if (optionA !== undefined) question.optionA = optionA;
    if (optionB !== undefined) question.optionB = optionB;
    if (optionC !== undefined) question.optionC = optionC;
    if (optionD !== undefined) question.optionD = optionD;
    if (optionE !== undefined) question.optionE = optionE;
    if (correctAnswer !== undefined) question.correctAnswer = correctAnswer;
    if (classification !== undefined) question.classification = classification;
    if (imageUrl !== undefined) question.imageUrl = imageUrl || null;
    await question.save();
    res.status(200).json(question);
  } catch (error) {
    console.error('Soru güncellenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Soru güncellenemedi.' });
  }
};

const deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findByPk(req.params.id);
        if (!question) { return res.status(404).json({ message: 'Silinecek soru bulunamadı.' }); }
        await question.destroy();
        res.status(204).send();
    } catch (error) {
        console.error('Soru silinirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası. Soru silinemedi.' });
    }
};

const createBulkQuestions = async (req, res) => {
    const questionsData = req.body;
    if (!Array.isArray(questionsData) || questionsData.length === 0) { return res.status(400).json({ message: 'Lütfen eklenecek soruları bir dizi formatında gönderin.' }); }
    const questionsToCreate = []; const errors = []; const topicIds = new Set();
    questionsData.forEach(q => { if (q.topicId) topicIds.add(q.topicId); });
    let existingTopics = new Map();
    if (topicIds.size > 0) { try { const topics = await Topic.findAll({ where: { id: { [Op.in]: Array.from(topicIds) } } }); topics.forEach(t => existingTopics.set(t.id, true)); } catch(err) { console.error("Toplu ekleme sırasında konu kontrol hatası:", err); return res.status(500).json({ message: 'Konu kontrolü sırasında bir sunucu hatası oluştu.' }); } }
    for (let i = 0; i < questionsData.length; i++) {
        const q = questionsData[i];
        if (!q.text || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.optionE || !q.correctAnswer || !q.topicId) { errors.push(`Sıra ${i + 1}: Zorunlu alanlar eksik.`); continue; }
        if (!existingTopics.has(parseInt(q.topicId, 10))) { errors.push('Sıra ' + (i + 1) + ': Geçersiz konu ID\'si (' + q.topicId + ').'); continue; }
        questionsToCreate.push({ text: q.text, optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD, optionE: q.optionE, correctAnswer: q.correctAnswer, difficulty: 'medium', topicId: parseInt(q.topicId, 10), imageUrl: q.imageUrl || null, classification: q.classification || 'Çalışma Sorusu' });
    }
    if (questionsToCreate.length === 0) { return res.status(400).json({ message: 'Eklenecek geçerli soru bulunamadı.', validationErrors: errors }); }
    try {
        const createdQuestions = await Question.bulkCreate(questionsToCreate);
        res.status(201).json({ message: `${createdQuestions.length} soru başarıyla eklendi.`, addedCount: createdQuestions.length, validationErrors: errors });
    } catch (error) { console.error('Toplu soru eklenirken hata:', error); res.status(500).json({ message: 'Sunucu hatası. Sorular eklenemedi.', validationErrors: errors }); }
 };

// --- TÜM FONKSİYONLAR EXPORT EDİLİYOR ---
module.exports = {
  getAllQuestions, // Filtreleme eklenmiş hali
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createBulkQuestions
};