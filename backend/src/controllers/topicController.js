const { Topic } = require('../../models');

// Yardımcı fonksiyon: Düz listeyi ağaç yapısına çevirir
const buildTopicTree = (topics) => {
    const topicMap = {};
    const tree = [];

    // Önce tüm konuları bir haritaya alalım ve children dizisi ekleyelim
    topics.forEach(topic => {
        // topic bir Sequelize instance olduğu için plain object'e çevirelim
        topicMap[topic.id] = { ...topic.get({ plain: true }), children: [] };
    });

    // Şimdi her konuyu parent'ının children dizisine ekleyelim
    Object.values(topicMap).forEach(node => { // Map üzerinden gidelim
        if (node.parentId === null || !topicMap[node.parentId]) {
            // Eğer parentId null ise veya parent map'te bulunamazsa, kök seviyesine ekle
            tree.push(node);
        } else {
            // Parent varsa, parent'ın children dizisine ekle
            // Parent'ın map'te olduğundan emin olalım (ilk döngüde hepsi eklendi)
             if(topicMap[node.parentId]) {
                 topicMap[node.parentId].children.push(node);
             } else {
                  // Bu durum normalde olmamalı ama olursa köke ekleyelim
                  tree.push(node);
                  console.warn(`Topic ID ${node.id} için Parent ID ${node.parentId} bulunamadı.`);
             }
        }
    });

     // İsteğe bağlı: Çocukları isimlerine göre sırala
     const sortChildren = (node) => {
         if (node.children && node.children.length > 0) {
             node.children.sort((a, b) => a.name.localeCompare(b.name));
             node.children.forEach(sortChildren);
         }
     };
     tree.sort((a, b) => a.name.localeCompare(b.name)); // Kök seviyeyi sırala
     tree.forEach(sortChildren); // Çocukları recursive sırala

    return tree; // İç içe geçmiş ağaç yapısını döndür
};

// Konuları HİYERARŞİK olarak listeleyen fonksiyon
const getAllTopics = async (req, res) => {
  try {
    const allTopicsFlat = await Topic.findAll({
       // Belirli bir sıralama burada zorunlu değil, ağaç oluştururken sıralanabilir
    });
    const topicTree = buildTopicTree(allTopicsFlat);
    res.status(200).json(topicTree);
  } catch (error) {
    console.error('Konuları listelerken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Konular listelenemedi.' });
  }
};

// --- MEVCUT FONKSİYONLARINIZ (Değişiklik Yok) ---
const getTopicById = async (req, res) => {
  try {
    const topic = await Topic.findByPk(req.params.id);
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
  const { name, description, parentId } = req.body;
  if (!name) { return res.status(400).json({ message: 'Konu adı zorunludur.' }); }
  try {
    if (parentId) {
      const parentExists = await Topic.findByPk(parentId);
      if (!parentExists) { return res.status(400).json({ message: `Geçersiz üst konu ID'si: ${parentId}` }); }
    }
    const newTopic = await Topic.create({ name, description: description || null, parentId: parentId || null });
    res.status(201).json(newTopic);
  } catch (error) {
    console.error('Konu oluştururken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Konu oluşturulamadı.' });
  }
};

const updateTopic = async (req, res) => {
  const { name, description, parentId } = req.body;
  const { id } = req.params;
  if (!name && !description && parentId === undefined) { return res.status(400).json({ message: 'Güncellenecek en az bir alan (name, description, parentId) gereklidir.' }); }
  try {
    const topic = await Topic.findByPk(id);
    if (!topic) { return res.status(404).json({ message: 'Güncellenecek konu bulunamadı.' }); }
    if (parentId !== undefined) {
      if (parentId !== null) {
         if (parseInt(id, 10) === parseInt(parentId, 10)) { return res.status(400).json({ message: 'Bir konu kendisinin üst konusu olamaz.' }); }
         const parentExists = await Topic.findByPk(parentId);
         if (!parentExists) { return res.status(400).json({ message: `Geçersiz üst konu ID'si: ${parentId}` }); }
      }
      topic.parentId = parentId;
    }
    if (name) topic.name = name;
    if (description !== undefined) topic.description = description;
    await topic.save();
    res.status(200).json(topic);
  } catch (error) {
    console.error('Konu güncellenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Konu güncellenemedi.' });
  }
};

const deleteTopic = async (req, res) => {
  try {
    const topic = await Topic.findByPk(req.params.id);
    if (!topic) { return res.status(404).json({ message: 'Silinecek konu bulunamadı.' }); }
    await topic.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Konu silinirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Konu silinemedi.' });
  }
};
// --- MEVCUT FONKSİYONLARINIZ SONU ---

// Doğru Export Bloğu (Tüm fonksiyonları içerir)
module.exports = {
  getAllTopics, // Hiyerarşik listeyi döndüren güncel fonksiyon
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic
};