const { Topic, Lecture, Question, FlashCard, UserFlashBox, ExamClassification, Branch, User } = require('../../models');
const { Op } = require('sequelize');

// Yardımcı fonksiyon: Bir konunun ve tüm alt konularının ID'lerini toplar (önceki srsController'dan alınabilir)
const getAllDescendantIdsRecursive = async (topicId, allTopicsArray) => {
    const descendants = new Set();
    const queue = [parseInt(topicId, 10)];
    descendants.add(parseInt(topicId, 10)); // Kendisini de ekle (opsiyonel, silme için gerekli olabilir)

    // Eğer tüm konuları her seferinde çekmek yerine önceden yüklenmiş bir liste varsa onu kullan
    // Bu fonksiyonun çağrıldığı yerde tüm konuları çekip map olarak vermek daha performanslı olabilir.
    // Şimdilik basit bir findAll ile gidiyoruz.
    const allTopics = allTopicsArray || await Topic.findAll({ attributes: ['id', 'parentId'] });

    const topicMap = new Map();
    allTopics.forEach(t => {
        if (!topicMap.has(t.parentId)) {
            topicMap.set(t.parentId, []);
        }
        topicMap.get(t.parentId).push(t.id);
    });

    let head = 0;
    while(head < queue.length){
        const currentId = queue[head++];
        const children = topicMap.get(currentId) || [];
        for(const childId of children){
            if(!descendants.has(childId)){ // Döngüye girmemek için
                descendants.add(childId);
                queue.push(childId);
            }
        }
    }
    return Array.from(descendants);
};


// Yeni konu oluştur
const createTopic = async (req, res) => {
  const { name, description, parentId, examClassificationId, branchId } = req.body;
  const authorId = req.user?.id; // Varsayılan olarak admin veya giriş yapmış kullanıcı

  if (!name || !examClassificationId || !branchId) {
    return res.status(400).json({ message: 'Konu adı, sınav tipi ve branş zorunludur.' });
  }

  try {
    // Gerekli ID'lerin varlığını kontrol et
    const ec = await ExamClassification.findByPk(examClassificationId);
    if (!ec) return res.status(400).json({ message: 'Geçersiz Sınav Tipi ID.' });
    const branch = await Branch.findByPk(branchId);
    if (!branch) return res.status(400).json({ message: 'Geçersiz Branş ID.' });
    if (parentId) {
      const parent = await Topic.findByPk(parentId);
      if (!parent) return res.status(400).json({ message: 'Geçersiz Üst Konu ID.' });
    }

    const newTopic = await Topic.create({
      name,
      description,
      parentId: parentId || null,
      examClassificationId: parseInt(examClassificationId),
      branchId: parseInt(branchId),
      authorId // Eğer modelinizde authorId varsa
    });
    res.status(201).json(newTopic);
  } catch (error) {
    console.error('[TopicController] Konu oluşturulurken hata:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: error.errors.map(e => e.message).join(', ') });
    }
    res.status(500).json({ message: 'Sunucu hatası: Konu oluşturulamadı.' });
  }
};

// Tüm konuları hiyerarşik olarak getir (veya filtreli)
const getAllTopics = async (req, res) => {
  const { examClassificationId, branchId, flat } = req.query;
  let whereClause = {};
  if (examClassificationId) whereClause.examClassificationId = examClassificationId;
  if (branchId) whereClause.branchId = branchId;

  try {
    if (flat === 'true') { // Düz liste istendiğinde
        const topics = await Topic.findAll({
            where: whereClause, // Filtreleri uygula
            order: [['name', 'ASC']],
            include: [ // İsimleri almak için
                { model: ExamClassification, as: 'examClassification', attributes: ['name'] },
                { model: Branch, as: 'branch', attributes: ['name'] }
            ]
        });
        res.status(200).json(topics);
    } else { // Hiyerarşik liste (varsayılan)
        const topics = await Topic.findAll({
            where: { ...whereClause, parentId: null }, // Sadece ana konuları çek
            include: [
                { model: ExamClassification, as: 'examClassification', attributes: ['name'] },
                { model: Branch, as: 'branch', attributes: ['name'] },
                {
                    model: Topic,
                    as: 'children',
                    include: [ // İç içe include'lar ile tüm hiyerarşiyi çekebiliriz
                        { model: ExamClassification, as: 'examClassification', attributes: ['name'] },
                        { model: Branch, as: 'branch', attributes: ['name'] },
                        { model: Topic, as: 'children', /* ... daha derin seviyeler ... */ }
                    ]
                }
            ],
            order: [['name', 'ASC']],
        });
        // Not: Çok derin hiyerarşiler için bu include yapısı yerine ayrı bir recursive fonksiyonla
        // tüm ağacı oluşturmak daha performanslı olabilir. Şimdilik 2 seviye örneklenmiştir.
        // Ya da tümünü çekip client'ta hiyerarşi oluşturmak (TopicManagement'taki gibi)
        // Bu endpoint TopicManagement.jsx'in fetchAllData'sında kullanılıyor, o tümünü çekip client'ta işliyor.
        // Bu yüzden burada basitçe tümünü dönelim, client tarafı halletsin.
        const allTopicsForHierarchy = await Topic.findAll({
             order: [['parentId', 'ASC NULLS FIRST'],['name', 'ASC']], // Düzgün sıralama için
             include: [
                { model: ExamClassification, as: 'examClassification', attributes: ['id','name'] },
                { model: Branch, as: 'branch', attributes: ['id','name'] }
             ]
        });
        // Client-side'da hiyerarşi oluşturmak için düz liste gönder
        // Veya backend'de hiyerarşi oluşturup gönder. Şimdilik düz liste.
        // TopicManagement.jsx zaten backend'den gelen düz listeyi client'ta hiyerarşiye çeviriyor.
         const allTopicsRaw = await Topic.findAll({
            order: [['name', 'ASC']],
            // include: [ // TopicManagement bu bilgileri zaten EC ve Branch listelerinden alıyor
            //     { model: ExamClassification, as: 'examClassification', attributes: ['id', 'name'] },
            //     { model: Branch, as: 'branch', attributes: ['id', 'name'] }
            // ]
        });
        res.status(200).json(allTopicsRaw); // TopicManagement'in beklediği format
    }
  } catch (error) {
    console.error('[TopicController] Konular getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası: Konular getirilemedi.' });
  }
};

// ID ile konu getir
const getTopicById = async (req, res) => {
    const { id } = req.params;
    try {
        const topic = await Topic.findByPk(id, {
            include: [
                { model: ExamClassification, as: 'examClassification' },
                { model: Branch, as: 'branch' },
                { model: Topic, as: 'parentTopic' },
                { model: Topic, as: 'children' } 
            ]
        });
        if(!topic) return res.status(404).json({ message: "Konu bulunamadı."});
        res.status(200).json(topic);
    } catch (error) {
        console.error(`[TopicController] Konu ID ${id} getirilirken hata:`, error);
        res.status(500).json({ message: 'Sunucu hatası: Konu getirilemedi.' });
    }
};

// Konu güncelle
const updateTopic = async (req, res) => {
    const { id } = req.params;
    const { name, description, parentId, examClassificationId, branchId } = req.body;
    try {
        const topic = await Topic.findByPk(id);
        if(!topic) return res.status(404).json({ message: "Güncellenecek konu bulunamadı."});

        if (parentId === '') topic.parentId = null;
        else if (parentId) topic.parentId = parseInt(parentId);

        if (examClassificationId) topic.examClassificationId = parseInt(examClassificationId);
        if (branchId) topic.branchId = parseInt(branchId);
        if (name) topic.name = name;
        if (description !== undefined) topic.description = description;

        await topic.save();
        res.status(200).json(topic);
    } catch (error) {
        console.error(`[TopicController] Konu ID ${id} güncellenirken hata:`, error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: error.errors.map(e => e.message).join(', ') });
        }
        res.status(500).json({ message: 'Sunucu hatası: Konu güncellenemedi.' });
    }
};

// Konu sil
const deleteTopic = async (req, res) => {
  const { id } = req.params;
  console.log(`[TopicController] deleteTopic isteği, ID: ${id}`);
  try {
    const topic = await Topic.findByPk(id);
    if (!topic) {
      return res.status(404).json({ message: 'Silinecek konu bulunamadı.' });
    }

    // Eğer model ve migration'larda ON DELETE CASCADE doğru ayarlandıysa,
    // topic.destroy() çağrısı ilişkili tüm alt öğeleri (alt konular, sorular, dersler vb.)
    // otomatik olarak silmelidir. Uygulama seviyesinde ek bir kontrol yapmaya gerek yoktur.
    await topic.destroy(); 
    console.log(`[TopicController] Konu (ID: ${id}) ve ilişkili öğeler (CASCADE ile) silindi.`);
    res.status(204).send(); // Başarılı silme, içerik yok
  } catch (error) {
    console.error(`[TopicController] Konu (ID: ${id}) silinirken hata:`, error);
    // ForeignKeyConstraintError, genellikle ON DELETE CASCADE'in düzgün çalışmadığı
    // veya bazı ilişkilerde ayarlanmadığı anlamına gelir.
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ message: 'Bu konu başka kayıtlarla (alt konular, sorular, dersler vb.) ilişkili olduğu için silinemez. Lütfen veritabanı CASCADE ayarlarınızı kontrol edin veya önce ilişkili öğeleri silin/düzenleyin.' });
    }
    res.status(500).json({ message: 'Sunucu hatası: Konu silinemedi.' });
  }
};

module.exports = {
  createTopic,
  getAllTopics,
  getTopicById,
  updateTopic,
  deleteTopic
};
