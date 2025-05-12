const { Branch, Topic } = require('../../models'); // Topic modelini de alalım (silme kontrolü için)
const { Op } = require("sequelize");

// Yeni bir Branş oluşturur
const createBranch = async (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Branş adı zorunludur.' });
    }
    try {
        const existingBranch = await Branch.findOne({ where: { name } });
        if (existingBranch) {
            return res.status(409).json({ message: 'Bu branş adı zaten mevcut.' });
        }
        const newBranch = await Branch.create({ name, description });
        res.status(201).json(newBranch);
    } catch (error) {
        console.error('Branş oluşturulurken hata:', error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const messages = error.errors.map(e => e.message).join('. ');
            return res.status(400).json({ message: `Doğrulama hatası: ${messages}` });
        }
        res.status(500).json({ message: 'Sunucu hatası. Branş oluşturulamadı.' });
    }
};

// Tüm Branşları listeler
const getAllBranches = async (req, res) => {
    try {
        const branches = await Branch.findAll({
            order: [['name', 'ASC']] // İsimlerine göre sıralı
        });
        res.status(200).json(branches);
    } catch (error) {
        console.error('Branşlar getirilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası. Branşlar getirilemedi.' });
    }
};

// ID ile belirli bir Branşı getirir
const getBranchById = async (req, res) => {
    const { id } = req.params;
    try {
        const branch = await Branch.findByPk(id);
        if (!branch) {
            return res.status(404).json({ message: 'Branş bulunamadı.' });
        }
        res.status(200).json(branch);
    } catch (error) {
        console.error(`Branş ID ${id} getirilirken hata:`, error);
        res.status(500).json({ message: 'Sunucu hatası. Branş getirilemedi.' });
    }
};

// Belirli bir Branşı günceller
const updateBranch = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Branş adı zorunludur.' });
    }
    try {
        const branch = await Branch.findByPk(id);
        if (!branch) {
            return res.status(404).json({ message: 'Güncellenecek Branş bulunamadı.' });
        }
        if (name !== branch.name) {
            const existingName = await Branch.findOne({ where: { name, id: { [Op.ne]: id } } });
            if (existingName) {
                return res.status(409).json({ message: 'Bu branş adı zaten başka bir kayıtta kullanılıyor.' });
            }
        }
        branch.name = name;
        branch.description = description || null;
        await branch.save();
        res.status(200).json(branch);
    } catch (error) {
        console.error(`Branş ID ${id} güncellenirken hata:`, error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const messages = error.errors.map(e => e.message).join('. ');
            return res.status(400).json({ message: `Doğrulama hatası: ${messages}` });
        }
        res.status(500).json({ message: 'Sunucu hatası. Branş güncellenemedi.' });
    }
};

// Belirli bir Branşı siler
const deleteBranch = async (req, res) => {
    const { id } = req.params;
    try {
        const branch = await Branch.findByPk(id);
        if (!branch) {
            return res.status(404).json({ message: 'Silinecek Branş bulunamadı.' });
        }
        // Bu branşı kullanan Konu (Topic) var mı kontrol et
        const relatedTopics = await Topic.count({ where: { branchId: id } });
        if (relatedTopics > 0) {
            return res.status(400).json({ message: 'Bu branş konularla ilişkili olduğu için silinemez. Önce ilişkili konuları düzenleyin veya silin.' });
        }
        // İleride bu branşı kullanan Kurs, Deneme, Kitap vb. varsa onlar da kontrol edilebilir.

        await branch.destroy();
        res.status(204).send();
    } catch (error) {
        console.error(`Branş ID ${id} silinirken hata:`, error);
        res.status(500).json({ message: 'Sunucu hatası. Branş silinemedi.' });
    }
};

module.exports = {
    createBranch,
    getAllBranches,
    getBranchById,
    updateBranch,
    deleteBranch
};
