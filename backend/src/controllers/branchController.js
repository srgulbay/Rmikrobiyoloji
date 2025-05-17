const { Branch, Topic, ExamClassification } = require('../../models'); // Topic modelini de import ettik (ileride lazım olabilir)
const { Op } = require('sequelize');

// Yeni branş oluştur
const createBranch = async (req, res) => {
  const { name, description, examClassificationId } = req.body;
  if (!name || !examClassificationId) {
    return res.status(400).json({ message: 'Branş adı ve bağlı olduğu sınav tipi zorunludur.' });
  }
  try {
    // Sınav tipinin varlığını kontrol et
    const ec = await ExamClassification.findByPk(examClassificationId);
    if (!ec) {
      return res.status(400).json({ message: 'Belirtilen sınav tipi bulunamadı.' });
    }
    const newBranch = await Branch.create({ name, description, examClassificationId: parseInt(examClassificationId,10) });
    res.status(201).json(newBranch);
  } catch (error) {
    console.error('[BranchController] Branş oluşturulurken hata:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: error.errors.map(e => e.message).join(', ') });
    }
    res.status(500).json({ message: 'Sunucu hatası: Branş oluşturulamadı.' });
  }
};

// Tüm branşları getir
const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.findAll({
      include: [{ model: ExamClassification, as: 'examClassification', attributes: ['id', 'name'] }],
      order: [['name', 'ASC']]
    });
    res.status(200).json(branches);
  } catch (error) {
    console.error('[BranchController] Branşlar getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası: Branşlar getirilemedi.' });
  }
};

// ID ile belirli bir branşı getir
const getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id, {
      include: [{ model: ExamClassification, as: 'examClassification', attributes: ['id', 'name'] }]
    });
    if (!branch) {
      return res.status(404).json({ message: 'Branş bulunamadı.' });
    }
    res.status(200).json(branch);
  } catch (error) {
    console.error('[BranchController] Branş getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası: Branş getirilemedi.' });
  }
};

// Mevcut bir branşı güncelle
const updateBranch = async (req, res) => {
  const { id } = req.params;
  const { name, description, examClassificationId } = req.body;
  try {
    const branch = await Branch.findByPk(id);
    if (!branch) {
      return res.status(404).json({ message: 'Güncellenecek branş bulunamadı.' });
    }
    if (examClassificationId) {
      const ec = await ExamClassification.findByPk(examClassificationId);
      if (!ec) return res.status(400).json({ message: 'Belirtilen sınav tipi bulunamadı.'});
      branch.examClassificationId = parseInt(examClassificationId,10);
    }
    branch.name = name || branch.name;
    branch.description = description !== undefined ? description : branch.description;
    await branch.save();
    res.status(200).json(branch);
  } catch (error) {
    console.error(`[BranchController] Branş (ID: ${id}) güncellenirken hata:`, error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: error.errors.map(e => e.message).join(', ') });
    }
    res.status(500).json({ message: 'Sunucu hatası: Branş güncellenemedi.' });
  }
};

// Bir branşı sil
const deleteBranch = async (req, res) => {
  const { id } = req.params;
  console.log(`[BranchController] deleteBranch isteği, ID: ${id}`);
  try {
    const branch = await Branch.findByPk(id);
    if (!branch) {
      return res.status(404).json({ message: 'Silinecek branş bulunamadı.' });
    }
    // ON DELETE CASCADE ayarı veritabanı seviyesinde olduğu için,
    // burada Topic'leri ayrıca kontrol etmeye veya silmeye gerek YOKTUR.
    // Sadece branch.destroy() çağrısı yeterli olacaktır.
    await branch.destroy();
    console.log(`[BranchController] Branş silindi: ID ${id}`);
    res.status(204).send(); // Başarılı silme, içerik yok
  } catch (error) {
    // Eğer ON DELETE CASCADE doğru ayarlanmamışsa, veritabanı burada bir
    // ForeignKeyConstraintError fırlatabilir.
    console.error(`[BranchController] Branş (ID: ${id}) silinirken hata:`, error);
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ message: 'Bu branş başka kayıtlarla (muhtemelen konularla) ilişkili olduğu için silinemedi. Lütfen önce ilişkili kayıtları silin veya CASCADE ayarlarını kontrol edin.' });
    }
    res.status(500).json({ message: 'Sunucu hatası: Branş silinemedi.' });
  }
};

module.exports = {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch
};
