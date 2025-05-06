const { Lecture, Topic, sequelize } = require('../../models');
const { Op } = require("sequelize");

const getDescendantTopicIds = async (topicId) => {
    const topicIdInt = parseInt(topicId, 10);
    if (isNaN(topicIdInt)) {
        throw new Error('Geçersiz topicId'); // Hata yönetimi eklendi
    }
    const descendants = new Set([topicIdInt]);
    let currentLevelIds = [topicIdInt];
    while (currentLevelIds.length > 0) {
        const children = await Topic.findAll({
            where: { parentId: { [Op.in]: currentLevelIds } },
            attributes: ['id'],
            raw: true,
            logging: false // Çok fazla log üretmemesi için
        });
        if (!children || children.length === 0) {
            break; // Çocuk yoksa döngüden çık
        }
        currentLevelIds = children.map(t => t.id);
        currentLevelIds.forEach(id => descendants.add(id));
    }
    return Array.from(descendants);
};


const getAllLectures = async (req, res) => {
  const { topicId, includeSubtopics } = req.query;

  try {
    const queryOptions = {
      include: [{
          model: Topic,
          as: 'topic',
          attributes: ['id', 'name']
      }],
      attributes: { exclude: ['topicId', 'createdAt', 'updatedAt'] },
      order: [['id', 'ASC']] // Veya title'a göre: [['title', 'ASC']]
    };

    if (topicId) {
      let topicIdsToFilter;
      // Frontend'den includeSubtopics=true geldiğinde veya HER ZAMAN alt konuları dahil etmek istersen
      // if (includeSubtopics === 'true') { // Frontend'in gönderdiği parametreye bağlı kalmak için
      // VEYA her zaman dahil etmek için bu if'i kaldır:
      try {
          topicIdsToFilter = await getDescendantTopicIds(topicId);
          console.log(`Filtering lectures for topic IDs: ${topicIdsToFilter.join(',')}`); // Debug
      } catch (descendantError) {
          console.error('Alt konu IDleri getirilirken hata:', descendantError);
          return res.status(400).json({ message: descendantError.message || 'Alt konular getirilirken bir sorun oluştu.' });
      }
      // } else {
      //    topicIdsToFilter = [parseInt(topicId, 10)];
      //    if (isNaN(topicIdsToFilter[0])) throw new Error('Geçersiz topicId');
      // }

      queryOptions.where = {
         topicId: { [Op.in]: topicIdsToFilter }
      };
    }

    const lectures = await Lecture.findAll(queryOptions);
    res.status(200).json(lectures);

  } catch (error) {
    console.error('Konu anlatımlarını getirirken hata:', error);
    // Daha spesifik hata kontrolü
    if (error.name === 'SequelizeDatabaseError' || error.message === 'Geçersiz topicId') {
         res.status(400).json({ message: 'Geçersiz istek veya parametre.' });
    } else {
         res.status(500).json({ message: 'Sunucu hatası. Konu anlatımları getirilemedi.' });
    }
  }
};

const getLectureById = async (req, res) => {
    const { id } = req.params;
    try {
        const lecture = await Lecture.findByPk(id, {
            include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }]
        });
        if (!lecture) {
            return res.status(404).json({ message: 'Konu anlatımı bulunamadı.' });
        }
        res.status(200).json(lecture);
    } catch (error) {
        console.error(`ID ${id} olan konu anlatımı getirilirken hata:`, error);
        res.status(500).json({ message: 'Sunucu hatası. Konu anlatımı getirilemedi.' });
    }
};

const createLecture = async (req, res) => {
  const { title, content, topicId, imageUrl } = req.body;
  if (!title || !content || !topicId) {
      return res.status(400).json({ message: 'Lütfen başlık, içerik ve konu ID alanlarını doldurun.' });
  }
  try {
    const topicExists = await Topic.findByPk(topicId);
    if (!topicExists) {
        return res.status(400).json({ message: `Geçersiz konu ID'si: ${topicId}. Bu ID'ye sahip bir konu bulunamadı.` });
    }
    const newLecture = await Lecture.create({
        title,
        content,
        topicId,
        imageUrl: imageUrl || null
    });
    res.status(201).json(newLecture);
  } catch (error) {
    console.error('Konu anlatımı oluştururken hata:', error);
    // Veritabanı kısıtlama hatası kontrolü (örneğin unique constraint)
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: 'Bu başlıkta bir konu anlatımı zaten mevcut olabilir.' });
    }
    res.status(500).json({ message: 'Sunucu hatası. Konu anlatımı oluşturulamadı.' });
  }
};

const updateLecture = async (req, res) => {
  const { title, content, topicId, imageUrl } = req.body;
  const { id } = req.params;

  // Güncellenecek veri var mı kontrolü
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (topicId !== undefined) updateData.topicId = topicId; // null olabilir
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null; // Boş string ise null yap

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: 'Güncellenecek en az bir alan gereklidir (title, content, topicId, imageUrl).' });
  }

  try {
    // topicId güncelleniyorsa ve null değilse varlığını kontrol et
    if (updateData.topicId !== undefined && updateData.topicId !== null) {
        const topicExists = await Topic.findByPk(updateData.topicId);
        if (!topicExists) {
            return res.status(400).json({ message: `Geçersiz konu ID'si: ${updateData.topicId}` });
        }
    }

    const [numberOfAffectedRows] = await Lecture.update(updateData, {
        where: { id: id },
        // returning: true // PostgreSQL veya MSSQL kullanıyorsanız güncellenmiş kaydı döndürebilir
    });

    if (numberOfAffectedRows === 0) {
        return res.status(404).json({ message: 'Güncellenecek konu anlatımı bulunamadı veya veri aynı.' });
    }

    // Güncellenmiş veriyi çekip döndür (isteğe bağlı)
    const updatedLecture = await Lecture.findByPk(id, {
         include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }]
    });
    res.status(200).json(updatedLecture);

  } catch (error) {
    console.error(`ID ${id} olan konu anlatımı güncellenirken hata:`, error);
     if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: 'Bu başlıkta bir konu anlatımı zaten mevcut olabilir.' });
    }
    res.status(500).json({ message: 'Sunucu hatası. Konu anlatımı güncellenemedi.' });
  }
};

const deleteLecture = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedRowCount = await Lecture.destroy({
            where: { id: id }
        });
        if (deletedRowCount === 0) {
            return res.status(404).json({ message: 'Silinecek konu anlatımı bulunamadı.' });
        }
        res.status(204).send(); // Başarılı silmede içerik dönme
    } catch (error) {
        console.error(`ID ${id} olan konu anlatımı silinirken hata:`, error);
        res.status(500).json({ message: 'Sunucu hatası. Konu anlatımı silinemedi.' });
    }
};

module.exports = {
  getAllLectures,
  getLectureById,
  createLecture,
  updateLecture,
  deleteLecture
};