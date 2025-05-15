const { Announcement, Notification, User, UserPushSubscription } = require('../../models');
const webpush = require('web-push');
const { Op } = require('sequelize');

// VAPID anahtarlarını ayarla (eğer ortam değişkenleri mevcutsa)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  // getVapidDetails kontrolü kaldırıldı, setVapidDetails doğrudan çağrılıyor.
  // Birden fazla çağrılmasında bir sakınca yoktur, son ayar geçerli olur.
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log("Duyuru Controller: VAPID details set for web-push (eğer daha önce ayarlanmadıysa veya güncelleniyorsa).");
} else {
  console.warn("DUYURU CONTROLLER UYARISI: VAPID anahtarları .env dosyasında tam olarak tanımlanmamış. Push bildirimleri gönderilemeyebilir.");
}

const createAnnouncement = async (req, res) => {
  const { title, content, targetAudience, isActive, scheduledAt } = req.body;
  const adminUserId = req.user?.id; 

  if (!adminUserId) {
    console.error('createAnnouncement: Admin kullanıcı ID\'si bulunamadı.');
    return res.status(401).json({ message: 'Yetkilendirme hatası: Kullanıcı bilgisi eksik.' });
  }
  if (!title || !content) {
    return res.status(400).json({ message: 'Başlık ve içerik alanları zorunludur.' });
  }
  console.log('[AnnouncementController] Yeni duyuru oluşturma isteği:', req.body);
  try {
    const newAnnouncement = await Announcement.create({
      title,
      content,
      targetAudience: targetAudience || 'all',
      isActive: isActive !== undefined ? isActive : true,
      scheduledAt: scheduledAt || null,
      authorId: adminUserId 
    });
    console.log('[AnnouncementController] Duyuru başarıyla oluşturuldu:', newAnnouncement.id);
    if (newAnnouncement.isActive && (!newAnnouncement.scheduledAt || new Date(newAnnouncement.scheduledAt) <= new Date())) {
      console.log(`[AnnouncementController] "${newAnnouncement.title}" için bildirim gönderme işlemi başlatılıyor...`);
      sendNotificationsForAnnouncement(newAnnouncement).catch(notificationError => {
        console.error(`[NotificationSender] "${newAnnouncement.title}" için bildirim gönderirken arka plan hatası:`, notificationError);
      });
    }
    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error('[AnnouncementController] Duyuru oluşturulurken veritabanı veya genel hata:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message);
      return res.status(400).json({ message: 'Doğrulama hatası', errors: messages });
    }
    res.status(500).json({ message: 'Sunucu hatası: Duyuru oluşturulamadı.', error: error.message });
  }
};

const getAllAnnouncements = async (req, res) => {
  console.log('[AnnouncementController] getAllAnnouncements isteği');
  try {
    const announcements = await Announcement.findAll({
      order: [['createdAt', 'DESC']], 
      include: [{ model: User, as: 'author', attributes: ['id', 'username'] }]
    });
    res.status(200).json(announcements);
  } catch (error) {
    console.error('[AnnouncementController] Tüm duyurular getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası: Duyurular getirilemedi.' });
  }
};

const getAnnouncementById = async (req, res) => {
  const { id } = req.params;
  console.log(`[AnnouncementController] getAnnouncementById isteği, ID: ${id}`);
  try {
    const announcement = await Announcement.findByPk(id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'username'] }]
    });
    if (!announcement) return res.status(404).json({ message: 'Duyuru bulunamadı.' });
    res.status(200).json(announcement);
  } catch (error) {
    console.error(`[AnnouncementController] Duyuru ID ${id} getirilirken hata:`, error);
    res.status(500).json({ message: 'Sunucu hatası: Duyuru getirilemedi.' });
  }
};

const updateAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { title, content, targetAudience, isActive, scheduledAt } = req.body;
  const adminUserId = req.user?.id;
  if (!adminUserId) return res.status(401).json({ message: 'Yetkilendirme hatası.' });

  console.log(`[AnnouncementController] updateAnnouncement isteği, ID: ${id}, Body:`, req.body);
  try {
    const announcement = await Announcement.findByPk(id);
    if (!announcement) return res.status(404).json({ message: 'Güncellenecek duyuru bulunamadı.' });

    const wasActiveBefore = announcement.isActive;
    const scheduledBefore = announcement.scheduledAt;

    announcement.title = title || announcement.title;
    announcement.content = content || announcement.content;
    announcement.targetAudience = targetAudience || announcement.targetAudience;
    if (isActive !== undefined) announcement.isActive = isActive;
    if (scheduledAt !== undefined) announcement.scheduledAt = scheduledAt; 

    await announcement.save();
    console.log(`[AnnouncementController] Duyuru güncellendi: ID ${id}`);

    const isNowActive = announcement.isActive;
    const isNowScheduledToPublish = !announcement.scheduledAt || new Date(announcement.scheduledAt) <= new Date();
    const shouldSendNotificationNow = isNowActive && isNowScheduledToPublish && 
                                       (!wasActiveBefore || (wasActiveBefore && scheduledBefore && new Date(scheduledBefore) > new Date()));

    if (shouldSendNotificationNow) {
      console.log(`[AnnouncementController] Güncellenen ve yayınlanan "${announcement.title}" için bildirimler...`);
      sendNotificationsForAnnouncement(announcement).catch(err => console.error("Arka plan bildirim hatası (güncelleme):", err));
    }
    res.status(200).json(announcement);
  } catch (error) {
    console.error(`[AnnouncementController] Duyuru ID ${id} güncellenirken hata:`, error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Doğrulama hatası', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Sunucu hatası: Duyuru güncellenemedi.' });
  }
};

const deleteAnnouncement = async (req, res) => {
  const { id } = req.params;
  console.log(`[AnnouncementController] deleteAnnouncement isteği, ID: ${id}`);
  try {
    const announcement = await Announcement.findByPk(id);
    if (!announcement) return res.status(404).json({ message: 'Silinecek duyuru bulunamadı.' });
    await announcement.destroy();
    console.log(`[AnnouncementController] Duyuru silindi: ID ${id}`);
    res.status(204).send();
  } catch (error) {
    console.error(`[AnnouncementController] Duyuru ID ${id} silinirken hata:`, error);
    res.status(500).json({ message: 'Sunucu hatası: Duyuru silinemedi.' });
  }
};

async function sendNotificationsForAnnouncement(announcement) {
  console.log(`[NotificationSender] "${announcement.title}" (ID: ${announcement.id}) için bildirimler hazırlanıyor.`);
  let targetUsers = [];
  try {
    const validAllUserTargets = ['all', 'all_users', 'registered_users'];
    if (validAllUserTargets.includes(announcement.targetAudience)) {
      targetUsers = await User.findAll({ where: {} }); 
      console.log(`[NotificationSender] User.findAll sonucu (${targetUsers.length} kullanıcı)`);
    }
  } catch (userError) {
    console.error('[NotificationSender] Hedef kullanıcılar çekilirken hata:', userError);
    return; 
  }
  if (!targetUsers || targetUsers.length === 0) {
    console.log('[NotificationSender] Bildirim gönderilecek hedef kullanıcı bulunamadı.');
    return;
  }
  console.log(`[NotificationSender] ${targetUsers.length} kullanıcıya bildirim gönderilecek.`);
  const notificationLink = `/announcements/${announcement.id}`; 
  const notificationCreationPromises = targetUsers.map(async (user) => {
    try {
      await Notification.create({
        userId: user.id, type: 'announcement', title: announcement.title,
        message: `Yeni duyuru: "${announcement.title.substring(0, 100)}${announcement.title.length > 100 ? '...' : ''}"`,
        link: notificationLink 
      });
    } catch (inAppError) {
      console.error(`[NotificationSender] Kullanıcı ${user.id} için in-app bildirim oluşturulurken hata:`, inAppError.name, inAppError.message);
    }
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) { return; }
    try {
      const userSubscriptions = await UserPushSubscription.findAll({ where: { userId: user.id } });
      if (userSubscriptions.length > 0) {
        const payload = JSON.stringify({
          title: announcement.title, body: `Yeni duyuru: ${announcement.title.substring(0, 50)}...`,
          icon: '/pwa-192x192.png', badge: '/pwa-badge-96x96.png', data: { url: notificationLink }
        });
        const pushPromises = userSubscriptions.map(subscription => {
          const subAsJson = { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } };
          return webpush.sendNotification(subAsJson, payload)
            .catch(pushError => {
              console.error(`[NotificationSender] Push hatası (K: ${user.id}, E: ${subscription.endpoint.substring(0,20)}...): ${pushError.statusCode} - ${pushError.body || pushError.message}`);
              if (pushError.statusCode === 404 || pushError.statusCode === 410) {
                return subscription.destroy().catch(delErr => console.error("Geçersiz abonelik silinirken hata:", delErr));
              }
            });
        });
        await Promise.allSettled(pushPromises);
      }
    } catch (pushSetupError) {
      console.error(`[NotificationSender] Kullanıcı ${user.id} için push abonelikleri/gönderim hatası:`, pushSetupError);
    }
  });
  await Promise.allSettled(notificationCreationPromises);
  console.log(`[NotificationSender] "${announcement.title}" için bildirim gönderme denemeleri tamamlandı.`);
}

module.exports = {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
};
