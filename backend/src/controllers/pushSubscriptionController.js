const { UserPushSubscription } = require('../../models');
const webpush = require('web-push');

if (process.env.PUBLIC_VAPID_KEY && process.env.PRIVATE_VAPID_KEY && process.env.VAPID_SUBJECT) {
  // getVapidDetails kontrolü kaldırıldı
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.PUBLIC_VAPID_KEY,
    process.env.PRIVATE_VAPID_KEY
  );
  console.log("Push Subscription Controller: VAPID details set for web-push.");
} else {
  console.warn("PUSH CONTROLLER UYARISI: VAPID anahtarları .env dosyasında tam olarak tanımlanmamış. Push bildirimleri çalışmayacaktır.");
}

const subscribeToPush = async (req, res) => {
  const userId = req.user.id;
  const subscription = req.body;

  if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
    return res.status(400).json({ message: 'Geçersiz veya eksik abonelik bilgisi.' });
  }

  try {
    const [newSubscription, created] = await UserPushSubscription.findOrCreate({
      where: { endpoint: subscription.endpoint },
      defaults: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      }
    });

    if (!created) { // Kayıt zaten vardı, güncelleyebiliriz veya sadece bilgi verebiliriz
      if (newSubscription.userId !== userId) {
        // Bu endpoint başka bir kullanıcıya kayıtlı. Güvenlik nedeniyle hata döndür.
        console.warn(`Endpoint (${subscription.endpoint.substring(0,20)}...) zaten kullanıcı ${newSubscription.userId} için kayıtlı. İstek kullanıcı ${userId} tarafından yapıldı.`);
        return res.status(409).json({ message: 'Bu abonelik hedefi zaten başka bir kullanıcı için kayıtlı.' });
      }
      // Aynı kullanıcı, anahtarlar değişmiş olabilir. Güncelle.
      newSubscription.p256dh = subscription.keys.p256dh;
      newSubscription.auth = subscription.keys.auth;
      await newSubscription.save();
      console.log(`Kullanıcı ${userId} için mevcut abonelik güncellendi: ${newSubscription.endpoint.substring(0,20)}...`);
      return res.status(200).json({ message: 'Abonelik zaten mevcuttu ve güncellendi.', subscription: newSubscription });
    }

    console.log(`Kullanıcı ${userId} için yeni abonelik kaydedildi: ${newSubscription.endpoint.substring(0,20)}...`);
    res.status(201).json({ message: 'Push bildirimlerine başarıyla abone olundu.', subscription: newSubscription });

  } catch (error) {
    console.error('Push aboneliği kaydedilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Abonelik kaydedilemedi.', error: error.message });
  }
};

const unsubscribeFromPush = async (req, res) => {
  const userId = req.user.id;
  const { endpoint } = req.body; 

  if (!endpoint) {
    return res.status(400).json({ message: 'Silinecek abonelik için endpoint bilgisi gerekli.' });
  }

  try {
    const deletedCount = await UserPushSubscription.destroy({
      where: {
        userId: userId, 
        endpoint: endpoint,
      },
    });

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Silinecek abonelik bulunamadı veya zaten silinmiş.' });
    }

    console.log(`Kullanıcı ${userId} için abonelik silindi: ${endpoint.substring(0,20)}...`);
    res.status(200).json({ message: 'Push bildirim aboneliğinden başarıyla çıkıldı.' });
  } catch (error) {
    console.error('Push aboneliği silinirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Abonelik silinemedi.' });
  }
};

module.exports = {
  subscribeToPush,
  unsubscribeFromPush,
};
