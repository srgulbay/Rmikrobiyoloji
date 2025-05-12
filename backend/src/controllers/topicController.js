'use strict';
const { Topic, Branch, ExamClassification, Question, Lecture } = require('../../models');
const { Op } = require("sequelize");

const buildTopicTree = (topics) => {
    const topicMap = {};
    const tree = [];
    topics.forEach(topicInstance => {
        const topic = topicInstance.get({ plain: true });
        topicMap[topic.id] = { ...topic, children: [] };
    });
    Object.values(topicMap).forEach(node => {
        if (node.parentId === null || !topicMap[node.parentId]) {
            tree.push(node);
        } else {
             if(topicMap[node.parentId]) {
                 topicMap[node.parentId].children.push(node);
             } else {
                  tree.push(node);
             }
        }
    });
     const sortChildren = (node) => {
         if (node.children && node.children.length > 0) {
             node.children.sort((a, b) => a.name.localeCompare(b.name));
             node.children.forEach(sortChildren);
         }
     };
     tree.sort((a, b) => a.name.localeCompare(b.name));
     tree.forEach(sortChildren);
    return tree;
};

const getAllTopics = async (req, res) => {
  const { examClassificationId, branchId } = req.query;
  try {
    const whereClause = {};
    if (examClassificationId) {
        const parsedEcId = parseInt(examClassificationId, 10);
        if (!isNaN(parsedEcId)) {
            whereClause.examClassificationId = parsedEcId;
        } else {
            return res.status(400).json({ message: 'Geçersiz sınav sınıflandırma ID formatı.' });
        }
    }
    if (branchId) {
        const parsedBId = parseInt(branchId, 10);
        if (!isNaN(parsedBId)) {
            whereClause.branchId = parsedBId;
        } else {
            return res.status(400).json({ message: 'Geçersiz branş ID formatı.' });
        }
    }

    const allTopicsFlat = await Topic.findAll({
       where: Object.keys(whereClause).length > 0 ? whereClause : undefined, // Filtreleri uygula (varsa)
       include: [
           { model: Branch, as: 'branch', attributes: ['id', 'name'], required: !!branchId }, // branchId filtresi varsa join'i zorunlu yap
           { model: ExamClassification, as: 'examClassification', attributes: ['id', 'name'], required: !!examClassificationId } // examClassificationId filtresi varsa join'i zorunlu yap
       ],
       order: [['name', 'ASC']]
    });
    const topicTree = buildTopicTree(allTopicsFlat);
    res.status(200).json(topicTree);
  } catch (error) {
    console.error('Konuları listelerken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Konular listelenemedi.' });
  }
};

const getTopicById = async (req, res) => {
  try {
    const topic = await Topic.findByPk(req.params.id, {
        include: [
            { model: Branch, as: 'branch', attributes: ['id', 'name'] },
            { model: ExamClassification, as: 'examClassification', attributes: ['id', 'name'] },
            { model: Topic, as: 'parent', attributes: ['id', 'name'] },
            { model: Topic, as: 'children', attributes: ['id', 'name'] },
            { model: Question, as: 'questions', attributes: ['id', 'text'] },
            { model: Lecture, as: 'lectures', attributes: ['id', 'title'] }
        ]
    });
    if (!topic) {
      return res.status(404).json({ message: 'Konu bulunamadı.' });
    }
    res.status(200).json(topic);
  } catch (error) {
    console.error('Konu getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Konu getirilemedi.' });
  }
};

const createTopic = async (req, res) => {
  const { name, description, parentId, branchId, examClassificationId } = req.body;
  if (!name) { return res.status(400).json({ message: 'Konu adı zorunludur.' }); }

  try {
    if (parentId) {
      const parsedParentId = parseInt(parentId, 10);
      if(isNaN(parsedParentId)) return res.status(400).json({message: 'Geçersiz üst konu ID formatı.'});
      const parentExists = await Topic.findByPk(parsedParentId);
      if (!parentExists) { return res.status(400).json({ message: `Geçersiz üst konu ID'si: ${parsedParentId}` }); }
    }
    if (branchId) {
        const parsedBranchId = parseInt(branchId, 10);
        if(isNaN(parsedBranchId)) return res.status(400).json({message: 'Geçersiz branş ID formatı.'});
        const branchExists = await Branch.findByPk(parsedBranchId);
        if (!branchExists) { return res.status(400).json({ message: `Geçersiz branş ID'si: ${parsedBranchId}` }); }
    }
    if (examClassificationId) {
        const parsedEcId = parseInt(examClassificationId, 10);
        if(isNaN(parsedEcId)) return res.status(400).json({message: 'Geçersiz sınav sınıflandırma ID formatı.'});
        const classificationExists = await ExamClassification.findByPk(parsedEcId);
        if (!classificationExists) { return res.status(400).json({ message: `Geçersiz sınav sınıflandırma ID'si: ${parsedEcId}` }); }
    }

    const newTopic = await Topic.create({
        name,
        description: description || null,
        parentId: parentId ? parseInt(parentId, 10) : null,
        branchId: branchId ? parseInt(branchId, 10) : null,
        examClassificationId: examClassificationId ? parseInt(examClassificationId, 10) : null
    });
    res.status(201).json(newTopic);
  } catch (error) {
    console.error('Konu oluştururken hata:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const messages = error.errors.map(e => e.message).join('. ');
        return res.status(400).json({ message: `Doğrulama hatası: ${messages}`});
    }
    res.status(500).json({ message: 'Sunucu hatası. Konu oluşturulamadı.' });
  }
};

const updateTopic = async (req, res) => {
  const { name, description, parentId, branchId, examClassificationId } = req.body;
  const { id } = req.params;

  if (name === undefined && description === undefined && parentId === undefined && branchId === undefined && examClassificationId === undefined) {
    return res.status(400).json({ message: 'Güncellenecek en az bir alan gereklidir.' });
  }

  try {
    const topic = await Topic.findByPk(id);
    if (!topic) { return res.status(404).json({ message: 'Güncellenecek konu bulunamadı.' }); }

    if (parentId !== undefined) {
      const parsedParentId = parentId === null ? null : parseInt(parentId, 10);
      if (parentId !== null && isNaN(parsedParentId)) return res.status(400).json({message: 'Geçersiz üst konu ID formatı.'});
      if (parsedParentId !== null) {
         if (parseInt(id, 10) === parsedParentId) { return res.status(400).json({ message: 'Bir konu kendisinin üst konusu olamaz.' }); }
         const parentExists = await Topic.findByPk(parsedParentId);
         if (!parentExists) { return res.status(400).json({ message: `Geçersiz üst konu ID'si: ${parsedParentId}` }); }
      }
      topic.parentId = parsedParentId;
    }
    if (branchId !== undefined) {
        const parsedBranchId = branchId === null ? null : parseInt(branchId, 10);
        if (branchId !== null && isNaN(parsedBranchId)) return res.status(400).json({message: 'Geçersiz branş ID formatı.'});
        if (parsedBranchId !== null) {
            const branchExists = await Branch.findByPk(parsedBranchId);
            if (!branchExists) { return res.status(400).json({ message: `Geçersiz branş ID'si: ${parsedBranchId}` }); }
        }
        topic.branchId = parsedBranchId;
    }
    if (examClassificationId !== undefined) {
        const parsedEcId = examClassificationId === null ? null : parseInt(examClassificationId, 10);
        if (examClassificationId !== null && isNaN(parsedEcId)) return res.status(400).json({message: 'Geçersiz sınav sınıflandırma ID formatı.'});
        if (parsedEcId !== null) {
            const classificationExists = await ExamClassification.findByPk(parsedEcId);
            if (!classificationExists) { return res.status(400).json({ message: `Geçersiz sınav sınıflandırma ID'si: ${parsedEcId}` }); }
        }
        topic.examClassificationId = parsedEcId;
    }

    if (name !== undefined) topic.name = name;
    if (description !== undefined) topic.description = description === '' ? null : description;


    await topic.save();
    const updatedTopic = await Topic.findByPk(id, {
        include: [
            { model: Branch, as: 'branch', attributes: ['id', 'name'] },
            { model: ExamClassification, as: 'examClassification', attributes: ['id', 'name'] }
        ]
    });
    res.status(200).json(updatedTopic);
  } catch (error) {
    console.error('Konu güncellenirken hata:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const messages = error.errors.map(e => e.message).join('. ');
        return res.status(400).json({ message: `Doğrulama hatası: ${messages}`});
    }
    res.status(500).json({ message: 'Sunucu hatası. Konu güncellenemedi.' });
  }
};

const deleteTopic = async (req, res) => {
  const { id } = req.params;
  try {
    const topic = await Topic.findByPk(id);
    if (!topic) { return res.status(404).json({ message: 'Silinecek konu bulunamadı.' }); }

    const relatedQuestions = await Question.count({ where: { topicId: id } });
    const relatedLectures = await Lecture.count({ where: { topicId: id } });
    const childTopics = await Topic.count({where: { parentId: id }});

    if (relatedQuestions > 0 || relatedLectures > 0 || childTopics > 0) {
      return res.status(400).json({ message: 'Bu konu başka kayıtlarla (alt konular, sorular, dersler) ilişkili olduğu için silinemez.' });
    }

    await topic.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Konu silinirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Konu silinemedi.' });
  }
};

module.exports = {
  getAllTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic
};