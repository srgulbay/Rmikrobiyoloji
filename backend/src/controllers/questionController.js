// backend/src/controllers/questionController.js
const { Question, Topic, sequelize, QuestionAttempt } = require('../../models'); // ../../ olarak düzeltildiconst { Op } = require("sequelize");
const { Op } = require('sequelize');
const getDescendantTopicIds = async (topicId) => {
    if (!topicId) return [];
    const parsedTopicId = parseInt(topicId, 10);
    if (isNaN(parsedTopicId)) return [];
    const descendants = new Set([parsedTopicId]);
    let currentLevelIds = [parsedTopicId];
    try {
        while (currentLevelIds.length > 0) {
            const children = await Topic.findAll({ where: { parentId: { [Op.in]: currentLevelIds } }, attributes: ['id'], raw: true });
            if (!children || children.length === 0) break;
            currentLevelIds = children.map(t => t.id);
            currentLevelIds.forEach(id => descendants.add(id));
        }
    } catch (error) {
        console.error("Alt konu ID'leri alınırken hata:", error);
        return Array.from(descendants);
    }
    return Array.from(descendants);
};

const getAllQuestions = async (req, res) => {
    const { topicId } = req.query;
    try {
        const queryOptions = {
          include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }],
          attributes: { exclude: ['createdAt', 'updatedAt'] },
          order: !topicId ? sequelize.random() : [['id', 'ASC']]
        };

        if (topicId) {
          const topicIdsToFilter = await getDescendantTopicIds(topicId);
          if (topicIdsToFilter.length > 0) {
              queryOptions.where = { topicId: { [Op.in]: topicIdsToFilter } };
          } else {
               return res.status(200).json([]);
          }
        }

        const questions = await Question.findAll(queryOptions);
        res.status(200).json(questions);
    } catch (error) {
        console.error('Soruları getirirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası. Sorular getirilemedi.' });
    }
};

const getQuestionById = async (req, res) => {
    try {
        const question = await Question.findByPk(req.params.id, {
            include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }],
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        });
        if (!question) { return res.status(404).json({ message: 'Soru bulunamadı.' }); }
        res.status(200).json(question);
    } catch (error) {
        console.error('Soru getirilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası. Soru getirilemedi.' });
    }
};

const createQuestion = async (req, res) => {
  const {
      text, optionA, optionB, optionC, optionD, optionE,
      correctAnswer, topicId, imageUrl, classification, explanation
  } = req.body;

  if (!text || !optionA || !optionB || !optionC || !optionD || !optionE || !correctAnswer || !topicId) {
      return res.status(400).json({ message: 'Lütfen tüm zorunlu alanları doldurun (text, optionA-E, correctAnswer, topicId).' });
  }

  try {
    const topicExists = await Topic.findByPk(topicId);
    if (!topicExists) {
        return res.status(400).json({ message: `Geçersiz konu ID'si: ${topicId}.` });
    }

    const newQuestion = await Question.create({
        text,
        optionA,
        optionB,
        optionC,
        optionD,
        optionE,
        correctAnswer: String(correctAnswer).toUpperCase(),
        difficulty: 'medium',
        topicId: parseInt(topicId, 10),
        imageUrl: imageUrl || null,
        classification: classification || 'Çalışma Sorusu',
        explanation: explanation || null
    });

    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Soru oluştururken hata:', error);
    if (error.name === 'SequelizeValidationError') {
       const messages = error.errors.map(err => err.message).join('. ');
       return res.status(400).json({ message: `Doğrulama hatası: ${messages}` });
    }
    res.status(500).json({ message: 'Sunucu hatası. Soru oluşturulamadı.' });
  }
};

const updateQuestion = async (req, res) => {
  const { id } = req.params;
  const {
      text, optionA, optionB, optionC, optionD, optionE,
      correctAnswer, topicId, imageUrl, classification, explanation // explanation eklendi
  } = req.body;

  try {
    const question = await Question.findByPk(id);
    if (!question) {
        return res.status(404).json({ message: 'Güncellenecek soru bulunamadı.' });
    }

    if (topicId !== undefined) {
        if (topicId !== null) {
             // Topic ID null değilse varlığını kontrol et
             const topicExists = await Topic.findByPk(topicId);
             if (!topicExists) {
                 return res.status(400).json({ message: `Geçersiz konu ID'si: ${topicId}` });
             }
             question.topicId = parseInt(topicId, 10);
        } else {
             // Topic ID null gelirse, null olarak set et (eğer model izin veriyorsa)
             // question.topicId = null; // Modelde allowNull: false olduğu için bu genelde istenmez
        }
    }

    // Diğer alanları güncelle (undefined değilse)
    if (text !== undefined) question.text = text;
    if (optionA !== undefined) question.optionA = optionA;
    if (optionB !== undefined) question.optionB = optionB;
    if (optionC !== undefined) question.optionC = optionC;
    if (optionD !== undefined) question.optionD = optionD;
    if (optionE !== undefined) question.optionE = optionE;
    if (correctAnswer !== undefined) question.correctAnswer = String(correctAnswer).toUpperCase();
    if (classification !== undefined) question.classification = classification;
    if (imageUrl !== undefined) question.imageUrl = imageUrl || null;
    // explanation alanını güncelle (undefined değilse)
    if (explanation !== undefined) {
        question.explanation = explanation || null; // Boş string gelirse null yap
    }

    await question.save();
    res.status(200).json(question);
  } catch (error) {
    console.error('Soru güncellenirken hata:', error);
     if (error.name === 'SequelizeValidationError') {
       const messages = error.errors.map(err => err.message).join('. ');
       return res.status(400).json({ message: `Doğrulama hatası: ${messages}` });
    }
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
     questionsData.forEach(q => { if (q.topicId) topicIds.add(parseInt(q.topicId, 10)); }); // ID'leri number olarak ekle
     let existingTopics = new Map();
     if (topicIds.size > 0) { try { const topics = await Topic.findAll({ where: { id: { [Op.in]: Array.from(topicIds) } } }); topics.forEach(t => existingTopics.set(t.id, true)); } catch(err) { console.error("Toplu ekleme sırasında konu kontrol hatası:", err); return res.status(500).json({ message: 'Konu kontrolü sırasında bir sunucu hatası oluştu.' }); } }

     for (let i = 0; i < questionsData.length; i++) {
         const q = questionsData[i];
         const currentTopicId = parseInt(q.topicId, 10); // topicId'yi integer yap

         if (!q.text || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.optionE || !q.correctAnswer || !q.topicId) {
             errors.push({ index: i, error: `Zorunlu alanlar eksik.` }); continue;
         }
         if (isNaN(currentTopicId) || !existingTopics.has(currentTopicId)) { // Integer kontrolü ve map kontrolü
             errors.push({ index: i, error: `Geçersiz konu ID'si (${q.topicId}).` }); continue;
         }
         questionsToCreate.push({
             text: q.text, optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD, optionE: q.optionE,
             correctAnswer: String(q.correctAnswer).toUpperCase(), difficulty: 'medium', topicId: currentTopicId,
             imageUrl: q.imageUrl || null, classification: q.classification || 'Çalışma Sorusu',
             explanation: q.explanation || null // explanation alanını ekle
         });
     }

     if (questionsToCreate.length === 0 && errors.length > 0) { return res.status(400).json({ message: 'Eklenecek geçerli soru bulunamadı.', validationErrors: errors }); }

     try {
         const createdQuestions = await Question.bulkCreate(questionsToCreate);
         // Başarılı eklenenlerin yanında hataları da döndür
         res.status(201).json({ message: `${createdQuestions.length} soru başarıyla eklendi.`, addedCount: createdQuestions.length, validationErrors: errors });
     } catch (error) {
         console.error('Toplu soru eklenirken hata:', error);
         // Hata durumunda da validationErrors'u (eğer varsa) döndürelim
         res.status(500).json({ message: 'Sunucu hatası. Sorular eklenemedi.', validationErrors: errors });
     }
};

const getWordPracticeQuestions = async (req, res) => {
     try {
        const allQuestions = await Question.findAll({
            attributes: ['id', 'text', 'optionA', 'optionB', 'optionC', 'optionD', 'optionE', 'correctAnswer'],
        });
        const suitableQuestions = [];
        allQuestions.forEach(question => {
            const correctAnswerLetter = question.correctAnswer?.toUpperCase();
            if (!correctAnswerLetter || !['A', 'B', 'C', 'D', 'E'].includes(correctAnswerLetter)) { return; }
            const potentialAnswer = question[`option${correctAnswerLetter}`];
            if ( potentialAnswer && typeof potentialAnswer === 'string' && potentialAnswer.trim().length > 0 && potentialAnswer.trim().length <= 9 && !potentialAnswer.includes(' ') && !potentialAnswer.toUpperCase().endsWith('LER') && !potentialAnswer.toUpperCase().endsWith('LAR')) {
                suitableQuestions.push({ id: question.id, text: question.text, answerWord: potentialAnswer.trim().toUpperCase() });
            }
        });
        res.status(200).json(suitableQuestions.sort(() => Math.random() - 0.5));
    } catch (error) {
        console.error('Kelime pratiği soruları getirilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası. Sorular getirilemedi.' });
    }
};

module.exports = {
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createBulkQuestions,
  getWordPracticeQuestions
};