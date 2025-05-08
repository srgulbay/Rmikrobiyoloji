const { LectureView, Lecture, User } = require('../../models'); // Gerekli modeller

// Yeni bir ders görüntüleme kaydı oluşturur
const recordLectureView = async (req, res) => {
  const { lectureId, duration } = req.body;
  const userId = req.user.id; // protect middleware'inden gelir

  // Gelen veriyi doğrula
  if (lectureId === undefined || duration === undefined) {
    return res.status(400).json({ message: 'Eksik veri: lectureId ve duration zorunludur.' });
  }

  const parsedLectureId = parseInt(lectureId, 10);
  const parsedDuration = parseInt(duration, 10);

  if (isNaN(parsedLectureId) || isNaN(parsedDuration) || parsedDuration < 0) {
    return res.status(400).json({ message: 'Geçersiz veri: lectureId ve duration pozitif sayı olmalıdır.' });
  }

  try {
    // İsteğe bağlı: lectureId ve userId'nin veritabanında var olup olmadığını kontrol et
    // const lectureExists = await Lecture.findByPk(parsedLectureId);
    // const userExists = await User.findByPk(userId);
    // if (!lectureExists || !userExists) {
    //   return res.status(404).json({ message: 'Geçersiz Kullanıcı veya Ders ID.' });
    // }

    // Yeni kaydı oluştur
    const newView = await LectureView.create({
      userId,
      lectureId: parsedLectureId,
      duration: parsedDuration,
      // viewedAt ve diğer zaman damgaları modelde varsayılan olarak ayarlanır
    });

    res.status(201).json(newView);

  } catch (error) {
    console.error('Ders görüntüleme kaydı oluşturulurken hata:', error);
    if (error.name === 'SequelizeValidationError') {
       const messages = error.errors.map(err => err.message).join('. ');
       return res.status(400).json({ message: `Doğrulama hatası: ${messages}` });
    }
    res.status(500).json({ message: 'Sunucu hatası. Görüntüleme kaydedilemedi.' });
  }
};

module.exports = {
  recordLectureView,
  // İleride başka lectureView ile ilgili endpointler (örn: get total view time) eklenebilir
};
