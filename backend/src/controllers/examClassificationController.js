const { ExamClassification, Question, Lecture, Topic, User } = require('../../models');
const { Op } = require("sequelize");

// Yeni bir Sınav Sınıflandırması oluşturur
const createClassification = async (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Sınıflandırma adı zorunludur.' });
    }
    try {
        const existingClassification = await ExamClassification.findOne({ where: { name } });
        if (existingClassification) {
            return res.status(409).json({ message: 'Bu sınıflandırma adı zaten mevcut.' });
        }
        const newClassification = await ExamClassification.create({ name, description });
        res.status(201).json(newClassification);
    } catch (error) {
        console.error('Sınav Sınıflandırması oluşturulurken hata:', error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const messages = error.errors.map(e => e.message).join('. ');
            return res.status(400).json({ message: `Doğrulama hatası: ${messages}` });
        }
        res.status(500).json({ message: 'Sunucu hatası. Sınıflandırma oluşturulamadı.' });
    }
};

// Tüm Sınav Sınıflandırmalarını listeler
const getAllClassifications = async (req, res) => {
    try {
        const classifications = await ExamClassification.findAll({
            order: [['name', 'ASC']] // İsimlerine göre sıralı
        });
        res.status(200).json(classifications);
    } catch (error) {
        console.error('Sınav Sınıflandırmaları getirilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası. Sınıflandırmalar getirilemedi.' });
    }
};

// ID ile belirli bir Sınav Sınıflandırmasını getirir
const getClassificationById = async (req, res) => {
    const { id } = req.params;
    try {
        const classification = await ExamClassification.findByPk(id);
        if (!classification) {
            return res.status(404).json({ message: 'Sınav Sınıflandırması bulunamadı.' });
        }
        res.status(200).json(classification);
    } catch (error) {
        console.error(`Sınıflandırma ID ${id} getirilirken hata:`, error);
        res.status(500).json({ message: 'Sunucu hatası. Sınıflandırma getirilemedi.' });
    }
};

// Belirli bir Sınav Sınıflandırmasını günceller
const updateClassification = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Sınıflandırma adı zorunludur.' });
    }
    try {
        const classification = await ExamClassification.findByPk(id);
        if (!classification) {
            return res.status(404).json({ message: 'Güncellenecek Sınav Sınıflandırması bulunamadı.' });
        }

        // Eğer isim değiştiriliyorsa, yeni ismin başka bir kayıtta kullanılmadığından emin ol
        if (name !== classification.name) {
            const existingName = await ExamClassification.findOne({ where: { name, id: { [Op.ne]: id } } });
            if (existingName) {
                return res.status(409).json({ message: 'Bu sınıflandırma adı zaten başka bir kayıtta kullanılıyor.' });
            }
        }

        classification.name = name;
        classification.description = description || null; // Açıklama boşsa null yap
        await classification.save();
        res.status(200).json(classification);
    } catch (error) {
        console.error(`Sınıflandırma ID ${id} güncellenirken hata:`, error);
         if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const messages = error.errors.map(e => e.message).join('. ');
            return res.status(400).json({ message: `Doğrulama hatası: ${messages}` });
        }
        res.status(500).json({ message: 'Sunucu hatası. Sınıflandırma güncellenemedi.' });
    }
};

// Belirli bir Sınav Sınıflandırmasını siler
const deleteClassification = async (req, res) => {
    const { id } = req.params;
    try {
        const classification = await ExamClassification.findByPk(id);
        if (!classification) {
            return res.status(404).json({ message: 'Silinecek Sınav Sınıflandırması bulunamadı.' });
        }

        // İLİŞKİLİ VERİ KONTROLÜ (ÖNEMLİ)
        // Bu sınıflandırmayı kullanan Question, Lecture, Topic veya User var mı?
        // Eğer varsa ve foreign key'lerde ON DELETE: RESTRICT (varsayılan) ise silme işlemi hata verir.
        // ON DELETE: CASCADE ise ilişkili kayıtlar da silinir.
        // ON DELETE: SET NULL ise ilişkili kayıtlardaki foreign key null olur (sütun allowNull:true ise).
        // Bu kontrolleri burada yapabilir veya veritabanı seviyesindeki kısıtlamalara güvenebilirsiniz.
        // Şimdilik doğrudan silme işlemini deniyoruz.
        const relatedQuestions = await Question.count({ where: { examClassificationId: id } });
        const relatedLectures = await Lecture.count({ where: { examClassificationId: id } });
        // const relatedTopics = await Topic.count({ where: { examClassificationId: id } }); // Topic modelinde bu FK yoktu
        const relatedUsers = await User.count({ where: { defaultClassificationId: id } });

        if (relatedQuestions > 0 || relatedLectures > 0 || relatedUsers > 0) {
            return res.status(400).json({ message: 'Bu sınıflandırma başka kayıtlarla (sorular, dersler, kullanıcılar) ilişkili olduğu için silinemez. Önce ilişkili kayıtları düzenleyin veya silin.' });
        }

        await classification.destroy();
        res.status(204).send(); // Başarılı silme, içerik yok
    } catch (error) {
        console.error(`Sınıflandırma ID ${id} silinirken hata:`, error);
        res.status(500).json({ message: 'Sunucu hatası. Sınıflandırma silinemedi.' });
    }
};

module.exports = {
    createClassification,
    getAllClassifications,
    getClassificationById,
    updateClassification,
    deleteClassification
};