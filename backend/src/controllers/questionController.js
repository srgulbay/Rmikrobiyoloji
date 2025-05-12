const { Question, Topic, ExamClassification, sequelize, QuestionAttempt } = require('../../models');
const { Op, fn, col, literal } = require("sequelize");

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
    const { topicId, examClassificationId } = req.query;
    try {
        const queryOptions = {
          include: [
            { model: Topic, as: 'topic', attributes: ['id', 'name'] },
            { model: ExamClassification, as: 'examClassification', attributes: ['id', 'name'] }
          ],
          attributes: { exclude: ['createdAt', 'updatedAt'] },
          order: !topicId && !examClassificationId ? sequelize.random() : [['id', 'ASC']]
        };

        queryOptions.where = {};

        if (topicId) {
          const topicIdsToFilter = await getDescendantTopicIds(topicId);
          if (topicIdsToFilter.length > 0) {
              queryOptions.where.topicId = { [Op.in]: topicIdsToFilter };
          } else {
               return res.status(200).json([]);
          }
        }

        if (examClassificationId) {
            const parsedEcId = parseInt(examClassificationId, 10);
            if (!isNaN(parsedEcId)) {
                queryOptions.where.examClassificationId = parsedEcId;
            } else {
                 return res.status(400).json({ message: 'Geçersiz sınav sınıflandırma ID formatı.' });
            }
        }

        if (Object.keys(queryOptions.where).length === 0) {
            delete queryOptions.where;
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
            include: [
                { model: Topic, as: 'topic', attributes: ['id', 'name'] },
                { model: ExamClassification, as: 'examClassification', attributes: ['id', 'name'] }
            ],
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
      correctAnswer, topicId, imageUrl, classification, explanation, examClassificationId
  } = req.body;

  if (!text || !optionA || !optionB || !optionC || !optionD || !optionE || !correctAnswer || !topicId || !examClassificationId) {
      return res.status(400).json({ message: 'Lütfen tüm zorunlu alanları doldurun (text, seçenekler, doğru cevap, konu ID ve sınav sınıflandırma ID).' });
  }

  try {
    const parsedTopicId = parseInt(topicId, 10);
    const parsedEcId = parseInt(examClassificationId, 10);

    if (isNaN(parsedTopicId)) return res.status(400).json({message: 'Geçersiz konu ID formatı.'});
    if (isNaN(parsedEcId)) return res.status(400).json({message: 'Geçersiz sınav sınıflandırma ID formatı.'});

    const topicExists = await Topic.findByPk(parsedTopicId);
    if (!topicExists) {
        return res.status(400).json({ message: `Geçersiz konu ID'si: ${parsedTopicId}.` });
    }
    const classificationExists = await ExamClassification.findByPk(parsedEcId);
    if (!classificationExists) {
        return res.status(400).json({ message: `Geçersiz sınav sınıflandırma ID'si: ${parsedEcId}.` });
    }

    const newQuestion = await Question.create({
        text, optionA, optionB, optionC, optionD, optionE,
        correctAnswer: String(correctAnswer).toUpperCase(),
        difficulty: 'medium',
        topicId: parsedTopicId,
        imageUrl: imageUrl || null,
        classification: classification || 'Çalışma Sorusu',
        explanation: explanation || null,
        examClassificationId: parsedEcId
    });

    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Soru oluştururken hata:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
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
      correctAnswer, topicId, imageUrl, classification, explanation, examClassificationId
  } = req.body;

  try {
    const question = await Question.findByPk(id);
    if (!question) {
        return res.status(404).json({ message: 'Güncellenecek soru bulunamadı.' });
    }

    if (topicId !== undefined) {
        const parsedTopicId = parseInt(topicId, 10);
        if (isNaN(parsedTopicId) && topicId !== null) return res.status(400).json({message: 'Geçersiz konu ID formatı.'});
        if (topicId !== null) {
             const topicExists = await Topic.findByPk(parsedTopicId);
             if (!topicExists) return res.status(400).json({ message: `Geçersiz konu ID'si: ${parsedTopicId}` });
        }
        question.topicId = topicId === null ? null : parsedTopicId; // Modelde allowNull: false olduğu için null olamaz.
    }
    if (examClassificationId !== undefined) {
        const parsedEcId = parseInt(examClassificationId, 10);
        if (isNaN(parsedEcId)) return res.status(400).json({message: 'Geçersiz sınav sınıflandırma ID formatı.'});
        const classificationExists = await ExamClassification.findByPk(parsedEcId);
        if (!classificationExists) return res.status(400).json({ message: `Geçersiz sınav sınıflandırma ID'si: ${parsedEcId}` });
        question.examClassificationId = parsedEcId;
    }
    if (text !== undefined) question.text = text;
    if (optionA !== undefined) question.optionA = optionA;
    if (optionB !== undefined) question.optionB = optionB;
    if (optionC !== undefined) question.optionC = optionC;
    if (optionD !== undefined) question.optionD = optionD;
    if (optionE !== undefined) question.optionE = optionE;
    if (correctAnswer !== undefined) question.correctAnswer = String(correctAnswer).toUpperCase();
    if (classification !== undefined) question.classification = classification;
    if (imageUrl !== undefined) question.imageUrl = imageUrl || null;
    if (explanation !== undefined) question.explanation = explanation || null;

    await question.save();
    const updatedQuestion = await Question.findByPk(id, {
        include: [
            { model: Topic, as: 'topic', attributes: ['id', 'name'] },
            { model: ExamClassification, as: 'examClassification', attributes: ['id', 'name'] }
        ]
    });
    res.status(200).json(updatedQuestion);
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

     const questionsToCreate = [];
     const validationErrors = [];
     const topicIdsSet = new Set();
     const classificationIdsSet = new Set();

     questionsData.forEach(q => {
         if (q.topicId) topicIdsSet.add(parseInt(q.topicId, 10));
         if (q.examClassificationId) classificationIdsSet.add(parseInt(q.examClassificationId, 10));
     });

     let existingTopicsMap = new Map();
     let existingClassificationsMap = new Map();

     try {
        if (topicIdsSet.size > 0) {
            const topics = await Topic.findAll({ where: { id: { [Op.in]: Array.from(topicIdsSet) } } });
            topics.forEach(t => existingTopicsMap.set(t.id, true));
        }
        if (classificationIdsSet.size > 0) {
            const classifications = await ExamClassification.findAll({ where: { id: { [Op.in]: Array.from(classificationIdsSet) } } });
            classifications.forEach(c => existingClassificationsMap.set(c.id, true));
        }
     } catch (dbError) {
         console.error("Toplu ekleme sırasında ID kontrol hatası:", dbError);
         return res.status(500).json({ message: 'ID kontrolü sırasında bir sunucu hatası oluştu.' });
     }


     for (let i = 0; i < questionsData.length; i++) {
         const q = questionsData[i];
         const currentTopicId = parseInt(q.topicId, 10);
         const currentEcId = parseInt(q.examClassificationId, 10);

         if (!q.text || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.optionE || !q.correctAnswer || !q.topicId || !q.examClassificationId) {
             validationErrors.push({ index: i, error: `Zorunlu alanlar eksik (Sınav Sınıflandırma ID dahil).` }); continue;
         }
         if (isNaN(currentTopicId) || !existingTopicsMap.has(currentTopicId)) {
             validationErrors.push({ index: i, error: `Geçersiz konu ID'si (${q.topicId}).` }); continue;
         }
         if (isNaN(currentEcId) || !existingClassificationsMap.has(currentEcId)) {
            validationErrors.push({ index: i, error: `Geçersiz sınav sınıflandırma ID'si (${q.examClassificationId}).`}); continue;
         }

         questionsToCreate.push({
             text: q.text, optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD, optionE: q.optionE,
             correctAnswer: String(q.correctAnswer).toUpperCase(), difficulty: q.difficulty || 'medium', topicId: currentTopicId,
             imageUrl: q.imageUrl || null, classification: q.classification || 'Çalışma Sorusu',
             explanation: q.explanation || null,
             examClassificationId: currentEcId
         });
     }

     if (questionsToCreate.length === 0 && validationErrors.length > 0) {
         return res.status(400).json({ message: 'Eklenecek geçerli soru bulunamadı.', validationErrors });
     }
     if (questionsToCreate.length === 0 && validationErrors.length === 0) { // Hiç soru gelmediyse
        return res.status(400).json({ message: 'Eklenecek soru bulunmuyor.' });
    }


     try {
         const createdQuestions = await Question.bulkCreate(questionsToCreate, { validate: true });
         res.status(201).json({ message: `${createdQuestions.length} soru başarıyla eklendi.`, addedCount: createdQuestions.length, validationErrors });
     } catch (error) {
         console.error('Toplu soru eklenirken hata:', error);
         if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => `[${e.instance.text.substring(0,20)}...]: ${e.message}`).join(', ');
            validationErrors.push({index: -1, error: 'Veritabanı doğrulama hatası: ' + messages});
         }
         res.status(500).json({ message: 'Sunucu hatası. Sorular eklenemedi.', validationErrors });
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
            const potentialAnswer = question['option' + correctAnswerLetter];
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