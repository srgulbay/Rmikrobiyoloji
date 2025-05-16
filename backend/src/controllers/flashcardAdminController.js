const { FlashCard, Topic, ExamClassification, User } = require('../../models');
const { Op } = require('sequelize');

// Tüm flash kartları getir (admin için, filtreleme eklenebilir)
const getAllFlashCards = async (req, res) => {
  try {
    const flashcards = await FlashCard.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        { model: Topic, as: 'topic', attributes: ['id', 'name'] },
        { model: ExamClassification, as: 'examClassification', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'username'] }
      ]
    });
    res.status(200).json(flashcards);
  } catch (error) {
    console.error('[FlashCardAdminCtrl] Tüm flash kartlar getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası: Flash kartlar getirilemedi.', error: error.message });
  }
};

// ID ile belirli bir flash kartı getir
const getFlashCardById = async (req, res) => {
  const { id } = req.params;
  try {
    const flashcard = await FlashCard.findByPk(id, {
      include: [
        { model: Topic, as: 'topic', attributes: ['id', 'name'] },
        { model: ExamClassification, as: 'examClassification', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'username'] }
      ]
    });
    if (!flashcard) {
      return res.status(404).json({ message: 'Flash kart bulunamadı.' });
    }
    res.status(200).json(flashcard);
  } catch (error) {
    console.error(`[FlashCardAdminCtrl] Flash kart (ID: ${id}) getirilirken hata:`, error);
    res.status(500).json({ message: 'Sunucu hatası: Flash kart getirilemedi.', error: error.message });
  }
};

// Yeni bir flash kart oluştur
const createFlashCard = async (req, res) => {
  const { frontText, backText, topicId, examClassificationId, difficulty, source, isActive } = req.body;
  const creatorId = req.user?.id; // Adminin ID'si

  if (!frontText || !backText) {
    return res.status(400).json({ message: 'Ön yüz (frontText) ve arka yüz (backText) zorunludur.' });
  }

  try {
    // Gelen topicId ve examClassificationId'nin geçerli olup olmadığını kontrol et (opsiyonel ama önerilir)
    if (topicId) {
      const topicExists = await Topic.findByPk(topicId);
      if (!topicExists) return res.status(400).json({ message: `Geçersiz Konu ID: ${topicId}` });
    }
    if (examClassificationId) {
      const ecExists = await ExamClassification.findByPk(examClassificationId);
      if (!ecExists) return res.status(400).json({ message: `Geçersiz Sınav Tipi ID: ${examClassificationId}` });
    }

    const newFlashCard = await FlashCard.create({
      frontText,
      backText,
      topicId: topicId || null,
      examClassificationId: examClassificationId || null,
      difficulty: difficulty || null,
      source: source || 'admin_created',
      isActive: isActive !== undefined ? isActive : true,
      creatorId
    });
    res.status(201).json(newFlashCard);
  } catch (error) {
    console.error('[FlashCardAdminCtrl] Flash kart oluşturulurken hata:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Doğrulama hatası', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Sunucu hatası: Flash kart oluşturulamadı.', error: error.message });
  }
};

// Mevcut bir flash kartı güncelle
const updateFlashCard = async (req, res) => {
  const { id } = req.params;
  const { frontText, backText, topicId, examClassificationId, difficulty, source, isActive } = req.body;

  try {
    const flashcard = await FlashCard.findByPk(id);
    if (!flashcard) {
      return res.status(404).json({ message: 'Güncellenecek flash kart bulunamadı.' });
    }

    // Gelen topicId ve examClassificationId'nin geçerli olup olmadığını kontrol et (opsiyonel ama önerilir)
    if (topicId !== undefined) { // Eğer topicId güncellenmek isteniyorsa
        if (topicId === null || topicId === '') {
            flashcard.topicId = null;
        } else {
            const topicExists = await Topic.findByPk(topicId);
            if (!topicExists) return res.status(400).json({ message: `Geçersiz Konu ID: ${topicId}` });
            flashcard.topicId = topicId;
        }
    }
    if (examClassificationId !== undefined) { // Eğer examClassificationId güncellenmek isteniyorsa
        if (examClassificationId === null || examClassificationId === '') {
            flashcard.examClassificationId = null;
        } else {
            const ecExists = await ExamClassification.findByPk(examClassificationId);
            if (!ecExists) return res.status(400).json({ message: `Geçersiz Sınav Tipi ID: ${examClassificationId}` });
            flashcard.examClassificationId = examClassificationId;
        }
    }
    
    flashcard.frontText = frontText || flashcard.frontText;
    flashcard.backText = backText || flashcard.backText;
    flashcard.difficulty = difficulty !== undefined ? difficulty : flashcard.difficulty;
    flashcard.source = source !== undefined ? source : flashcard.source;
    if (isActive !== undefined) {
      flashcard.isActive = isActive;
    }

    await flashcard.save();
    res.status(200).json(flashcard);
  } catch (error) {
    console.error(`[FlashCardAdminCtrl] Flash kart (ID: ${id}) güncellenirken hata:`, error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Doğrulama hatası', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Sunucu hatası: Flash kart güncellenemedi.', error: error.message });
  }
};

// Bir flash kartı sil
const deleteFlashCard = async (req, res) => {
  const { id } = req.params;
  try {
    const flashcard = await FlashCard.findByPk(id);
    if (!flashcard) {
      return res.status(404).json({ message: 'Silinecek flash kart bulunamadı.' });
    }

    // ÖNEMLİ: Bu flash kart UserFlashBox tablosunda kullanılıyorsa ne olacak?
    // Model tanımında onDelete: 'CASCADE' ayarlandıysa, ilgili UserFlashBox kayıtları da silinir.
    // Eğer SET NULL ise, UserFlashBox'taki flashCardId null olur.
    // Bu durumu burada ayrıca ele almak isteyebilirsiniz (örn: silmeden önce uyarı ver).
    await flashcard.destroy();
    res.status(204).send(); // Başarılı silme, içerik yok
  } catch (error) {
    console.error(`[FlashCardAdminCtrl] Flash kart (ID: ${id}) silinirken hata:`, error);
    res.status(500).json({ message: 'Sunucu hatası: Flash kart silinemedi.', error: error.message });
  }
};

module.exports = {
  getAllFlashCards,
  getFlashCardById,
  createFlashCard,
  updateFlashCard,
  deleteFlashCard
};
