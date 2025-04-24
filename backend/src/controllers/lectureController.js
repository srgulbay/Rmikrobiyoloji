const { Lecture, Topic } = require('../../models'); // Topic modelini de alalım
const { Op } = require("sequelize"); // Op import

// YARDIMCI FONKSİYON: Verilen topicId ve tüm alt konu ID'lerini döndürür
// Bu fonksiyon başka bir yerde (örn. utils) tanımlanıp import edilebilir
// Şimdilik tekrar buraya kopyalıyoruz (questionController'daki ile aynı)
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


// GET ALL LECTURES (Filtreleme Eklendi)
const getAllLectures = async (req, res) => {
  const { topicId, includeSubtopics } = req.query; // Query parametrelerini al

  try {
    const queryOptions = {
      include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }],
      attributes: { exclude: ['topicId', 'createdAt', 'updatedAt'] },
      order: [['title', 'ASC']] // Başlığa göre sırala (isteğe bağlı)
    };

    // Eğer topicId geldiyse filtreleme yap
    if (topicId) {
      let topicIdsToFilter = [parseInt(topicId, 10)];
      if (includeSubtopics === 'true') {
         topicIdsToFilter = await getDescendantTopicIds(topicId);
      }
      queryOptions.where = {
         topicId: { [Op.in]: topicIdsToFilter }
      };
    }

    const lectures = await Lecture.findAll(queryOptions);
    res.status(200).json(lectures);

  } catch (error) {
    console.error('Konu anlatımlarını getirirken hata:', error);
    if (error instanceof TypeError || error instanceof SyntaxError || error.name === 'SequelizeDatabaseError') {
         res.status(400).json({ message: 'Geçersiz filtre parametresi veya veritabanı hatası.' });
    } else {
         res.status(500).json({ message: 'Sunucu hatası. Konu anlatımları getirilemedi.' });
    }
  }
};

// --- Diğer Mevcut Fonksiyonlar (GetByID, Create, Update, Delete) ---
const getLectureById = async (req, res) => { try { const lecture = await Lecture.findByPk(req.params.id, { include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }] }); if (!lecture) { return res.status(404).json({ message: 'Konu anlatımı bulunamadı.' }); } res.status(200).json(lecture); } catch (error) { console.error('Konu anlatımı getirilirken hata:', error); res.status(500).json({ message: 'Sunucu hatası. Konu anlatımı getirilemedi.' }); } };
const createLecture = async (req, res) => { const { title, content, topicId, imageUrl } = req.body; if (!title || !content || !topicId) { return res.status(400).json({ message: 'Lütfen başlık, içerik ve konu ID alanlarını doldurun.' }); } try { const topicExists = await Topic.findByPk(topicId); if (!topicExists) { return res.status(400).json({ message: `Geçersiz konu ID'si: ${topicId}. Bu ID'ye sahip bir konu bulunamadı.` }); } const newLecture = await Lecture.create({ title, content, topicId, imageUrl: imageUrl || null }); res.status(201).json(newLecture); } catch (error) { console.error('Konu anlatımı oluştururken hata:', error); res.status(500).json({ message: 'Sunucu hatası. Konu anlatımı oluşturulamadı.' }); } };
const updateLecture = async (req, res) => { const { title, content, topicId, imageUrl } = req.body; const { id } = req.params; if (!title && !content && topicId === undefined && imageUrl === undefined) { return res.status(400).json({ message: 'Güncellenecek en az bir alan gereklidir.' }); } try { const lecture = await Lecture.findByPk(id); if (!lecture) { return res.status(404).json({ message: 'Güncellenecek konu anlatımı bulunamadı.' }); } if (topicId !== undefined) { if(topicId !== null) { const topicExists = await Topic.findByPk(topicId); if (!topicExists) { return res.status(400).json({ message: `Geçersiz konu ID'si: ${topicId}` }); } } lecture.topicId = topicId; } if (title) lecture.title = title; if (content) lecture.content = content; if (imageUrl !== undefined) lecture.imageUrl = imageUrl || null; await lecture.save(); res.status(200).json(lecture); } catch (error) { console.error('Konu anlatımı güncellenirken hata:', error); res.status(500).json({ message: 'Sunucu hatası. Konu anlatımı güncellenemedi.' }); } };
const deleteLecture = async (req, res) => { try { const lecture = await Lecture.findByPk(req.params.id); if (!lecture) { return res.status(404).json({ message: 'Silinecek konu anlatımı bulunamadı.' }); } await lecture.destroy(); res.status(204).send(); } catch (error) { console.error('Konu anlatımı silinirken hata:', error); res.status(500).json({ message: 'Sunucu hatası. Konu anlatımı silinemedi.' }); } };

module.exports = {
  getAllLectures, // Filtreleme eklenmiş hali
  getLectureById,
  createLecture,
  updateLecture,
  deleteLecture
};