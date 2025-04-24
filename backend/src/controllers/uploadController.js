const path = require('path');

const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Lütfen bir dosya seçin.' });
  }

  // Dosya başarıyla yüklendi (multer tarafından).
  // Şimdi dosyanın sunucudaki URL'sini oluşturup geri gönderelim.
  // Örn: /uploads/1745412345678-benimresmim.jpg
  const fileUrl = `/uploads/${req.file.filename}`;

  // TinyMCE'nin 'images_upload_handler' fonksiyonu 'location' adında bir alan bekler.
  res.status(200).json({ location: fileUrl });
};

module.exports = {
  uploadImage,
};
