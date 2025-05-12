const { Lecture, Topic, ExamClassification, sequelize } = require('../../models'); // ExamClassification ve sequelize eklendi
const { Op } = require("sequelize");

// Yardımcı fonksiyon: getDescendantTopicIds (Bu controller'da da kullanılacaksa import edilebilir veya burada tanımlanabilir)
// Şimdilik topicController'daki versiyonu baz alalım ve burada da benzer bir mantık kuralım
// Ancak getAllLectures içinde bu fonksiyon zaten olduğu için direkt onu kullanacağız.
const getDescendantTopicIds = async (topicId) => {
    if (!topicId) return [];
    const topicIdInt = parseInt(topicId, 10);
    if (isNaN(topicIdInt)) {
        console.error('getDescendantTopicIds: Geçersiz topicId formatı:', topicId);
        return []; // Hata durumunda boş dizi
    }
    const descendants = new Set([topicIdInt]);
    let currentLevelIds = [topicIdInt];
    try {
        while (currentLevelIds.length > 0) {
            const children = await Topic.findAll({
                where: { parentId: { [Op.in]: currentLevelIds } },
                attributes: ['id'],
                raw: true,
            });
            if (!children || children.length === 0) {
                break;
            }
            currentLevelIds = children.map(t => t.id);
            currentLevelIds.forEach(id => descendants.add(id));
        }
    } catch (error) {
        console.error("getDescendantTopicIds içinde hata:", error);
        // Hata durumunda bile en azından başlangıç ID'sini içeren seti döndür
    }
    return Array.from(descendants);
};


const getAllLectures = async (req, res) => {
  const { topicId, examClassificationId } = req.query; // examClassificationId filtresi eklendi

  try {
    const queryOptions = {
      include: [
          { model: Topic, as: 'topic', attributes: ['id', 'name'] },
          { model: ExamClassification, as: 'examClassification', attributes: ['id', 'name'] } // Yeni include
      ],
      attributes: { exclude: ['createdAt', 'updatedAt'] }, // topicId ve examClassificationId zaten include ile geliyor
      order: [['id', 'ASC']]
    };

    queryOptions.where = {}; // Where objesini başlat

    if (topicId) {
      let topicIdsToFilter;
      try {
          topicIdsToFilter = await getDescendantTopicIds(topicId);
          if (topicIdsToFilter.length > 0) {
            queryOptions.where.topicId = { [Op.in]: topicIdsToFilter };
          } else {
            // Belirtilen topicId için alt konu bulunamadıysa veya topicId geçersizse
            // bu konuyla ilişkili dersleri getirmemesi için boş sonuç döndür
            return res.status(200).json([]);
          }
      } catch (descendantError) {
          console.error('Alt konu IDleri getirilirken hata:', descendantError);
          return res.status(400).json({ message: descendantError.message || 'Alt konular getirilirken bir sorun oluştu.' });
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
    // Eğer where objesi boş kaldıysa, tümünü getirmesi için sil
    if (Object.keys(queryOptions.where).length === 0) {
        delete queryOptions.where;
    }


    const lectures = await Lecture.findAll(queryOptions);
    res.status(200).json(lectures);

  } catch (error) {
    console.error('Konu anlatımlarını getirirken hata:', error);
    if (error.name === 'SequelizeDatabaseError') {
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
            include: [
                { model: Topic, as: 'topic', attributes: ['id', 'name'] },
                { model: ExamClassification, as: 'examClassification', attributes: ['id', 'name'] } // Yeni include
            ]
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
  const { title, content, topicId, imageUrl, examClassificationId } = req.body; // examClassificationId eklendi

  if (!title || !content || !topicId || !examClassificationId) {
      return res.status(400).json({ message: 'Lütfen başlık, içerik, konu ID ve sınav sınıflandırma ID alanlarını doldurun.' });
  }

  try {
    const parsedTopicId = parseInt(topicId, 10);
    const parsedEcId = parseInt(examClassificationId, 10);

    if (isNaN(parsedTopicId)) return res.status(400).json({message: 'Geçersiz konu ID formatı.'});
    if (isNaN(parsedEcId)) return res.status(400).json({message: 'Geçersiz sınav sınıflandırma ID formatı.'});


    const topicExists = await Topic.findByPk(parsedTopicId);
    if (!topicExists) {
        return res.status(400).json({ message: `Geçersiz konu ID'si: ${parsedTopicId}. Bu ID'ye sahip bir konu bulunamadı.` });
    }
    const classificationExists = await ExamClassification.findByPk(parsedEcId);
    if (!classificationExists) {
        return res.status(400).json({ message: `Geçersiz sınav sınıflandırma ID'si: ${parsedEcId}.` });
    }

    const newLecture = await Lecture.create({
        title,
        content,
        topicId: parsedTopicId,
        imageUrl: imageUrl || null,
        examClassificationId: parsedEcId
    });
    res.status(201).json(newLecture);
  } catch (error) {
    console.error('Konu anlatımı oluştururken hata:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const messages = error.errors.map(e => e.message).join('. ');
        return res.status(400).json({ message: `Doğrulama hatası: ${messages}`});
    }
    res.status(500).json({ message: 'Sunucu hatası. Konu anlatımı oluşturulamadı.' });
  }
};

const updateLecture = async (req, res) => {
  const { title, content, topicId, imageUrl, examClassificationId } = req.body; // examClassificationId eklendi
  const { id } = req.params;

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (topicId !== undefined) updateData.topicId = topicId === null ? null : parseInt(topicId, 10);
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
  if (examClassificationId !== undefined) updateData.examClassificationId = examClassificationId === null ? null : parseInt(examClassificationId, 10);


  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: 'Güncellenecek en az bir alan gereklidir.' });
  }

  try {
    const lecture = await Lecture.findByPk(id);
    if(!lecture) {
        return res.status(404).json({ message: 'Güncellenecek konu anlatımı bulunamadı.' });
    }

    if (updateData.topicId !== undefined && updateData.topicId !== null) {
        if(isNaN(updateData.topicId)) return res.status(400).json({message: 'Geçersiz konu ID formatı.'});
        const topicExists = await Topic.findByPk(updateData.topicId);
        if (!topicExists) {
            return res.status(400).json({ message: `Geçersiz konu ID'si: ${updateData.topicId}` });
        }
    }
    if (updateData.examClassificationId !== undefined && updateData.examClassificationId !== null) {
        if(isNaN(updateData.examClassificationId)) return res.status(400).json({message: 'Geçersiz sınav sınıflandırma ID formatı.'});
        const classificationExists = await ExamClassification.findByPk(updateData.examClassificationId);
        if (!classificationExists) {
            return res.status(400).json({ message: `Geçersiz sınav sınıflandırma ID'si: ${updateData.examClassificationId}` });
        }
    }


    const [numberOfAffectedRows] = await Lecture.update(updateData, {
        where: { id: id },
    });

    if (numberOfAffectedRows === 0) {
         // Hiçbir satır güncellenmedi, ya kayıt yok ya da veri aynı. Kaydın varlığını yukarıda kontrol ettik.
        const possiblyUnchangedLecture = await Lecture.findByPk(id, {
             include: [
                { model: Topic, as: 'topic', attributes: ['id', 'name'] },
                { model: ExamClassification, as: 'examClassification', attributes: ['id', 'name'] }
            ]
        });
        return res.status(200).json(possiblyUnchangedLecture); // Veri aynıysa güncellenmiş halini döndür
    }

    const updatedLecture = await Lecture.findByPk(id, {
         include: [
            { model: Topic, as: 'topic', attributes: ['id', 'name'] },
            { model: ExamClassification, as: 'examClassification', attributes: ['id', 'name'] }
        ]
    });
    res.status(200).json(updatedLecture);

  } catch (error) {
    console.error(`ID ${id} olan konu anlatımı güncellenirken hata:`, error);
     if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const messages = error.errors.map(e => e.message).join('. ');
        return res.status(400).json({ message: `Doğrulama hatası: ${messages}`});
    }
    res.status(500).json({ message: 'Sunucu hatası. Konu anlatımı güncellenemedi.' });
  }
};

const deleteLecture = async (req, res) => {
    const { id } = req.params;
    try {
        const lecture = await Lecture.findByPk(id);
        if (!lecture) {
            return res.status(404).json({ message: 'Silinecek konu anlatımı bulunamadı.' });
        }
        await lecture.destroy();
        res.status(204).send();
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