const { Notification, User } = require('../../models'); // User modelini de import edebiliriz, belki ileride lazım olur.
const { Op } = require('sequelize');

// Kullanıcının okunmamış ve son N okundu bildirimini getirir
const getMyNotifications = async (req, res) => {
  const userId = req.user.id; // protect middleware'inden gelir
  const limit = parseInt(req.query.limit) || 20; // Son kaç bildirim gösterilsin
  const offset = parseInt(req.query.offset) || 0;

  try {
    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: { userId: userId },
      order: [['createdAt', 'DESC']],
      limit: limit,
      offset: offset,
      // İleride bildirimle ilişkili duyuru gibi detayları da çekebiliriz:
      // include: [{ model: Announcement, as: 'announcement', attributes: ['id', 'title']}]
    });

    const unreadCount = await Notification.count({
      where: { 
        userId: userId,
        isRead: false 
      }
    });

    res.status(200).json({ 
      notifications, 
      unreadCount,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(count / limit),
      totalNotifications: count
    });
  } catch (error) {
    console.error('Bildirimler getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Bildirimler getirilemedi.' });
  }
};

// Tek bir bildirimi okundu olarak işaretler
const markNotificationAsRead = async (req, res) => {
  const userId = req.user.id;
  const notificationId = req.params.id;

  try {
    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId: userId // Sadece kendi bildirimini okuyabilsin
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Bildirim bulunamadı veya bu bildirime erişim yetkiniz yok.' });
    }

    if (notification.isRead) {
      return res.status(200).json({ message: 'Bildirim zaten okundu olarak işaretlenmiş.', notification });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ message: 'Bildirim okundu olarak işaretlendi.', notification });
  } catch (error) {
    console.error(`Bildirim (ID: ${notificationId}) okundu olarak işaretlenirken hata:`, error);
    res.status(500).json({ message: 'Sunucu hatası. Bildirim güncellenemedi.' });
  }
};

// Kullanıcının tüm bildirimlerini okundu olarak işaretler
const markAllNotificationsAsRead = async (req, res) => {
  const userId = req.user.id;

  try {
    const [updatedCount] = await Notification.update(
      { isRead: true },
      {
        where: {
          userId: userId,
          isRead: false // Sadece okunmamışları güncelle
        }
      }
    );

    res.status(200).json({ message: `${updatedCount} bildirim okundu olarak işaretlendi.` });
  } catch (error) {
    console.error('Tüm bildirimler okundu olarak işaretlenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Bildirimler güncellenemedi.' });
  }
};

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
