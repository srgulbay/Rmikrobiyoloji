// backend/src/utils/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config(); // .env dosyasındaki değişkenleri yüklemek için

// E-posta gönderici ayarları (Gmail için)
// BU BİLGİLERİ .env DOSYANIZDAN ÇEKMELİSİNİZ!
const transporter = nodemailer.createTransport({
  service: 'gmail', // Veya başka bir servis (Outlook365 vb.)
  auth: {
    user: process.env.EMAIL_USER, // Gmail e-posta adresiniz
    pass: process.env.EMAIL_PASS, // Gmail uygulama şifreniz veya normal şifreniz (güvenlik ayarları önemli)
  },
  // Eğer TLS/SSL ile ilgili sorun yaşarsanız (özellikle lokalde):
  // tls: {
  //   rejectUnauthorized: false // Sadece lokal testler için, production'da önermem
  // }
});

// Aktivasyon e-postası gönderme fonksiyonu
const sendVerificationEmail = async (toEmail, username, verificationUrl) => {
  const mailOptions = {
    from: `"Rmikrobiyoloji Platformu" <${process.env.EMAIL_USER}>`, // Gönderici adı ve adresi
    to: toEmail, // Alıcı e-posta adresi
    subject: 'Hesabınızı Aktive Edin - Rmikrobiyoloji Platformu', // E-posta konusu
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Merhaba ${username},</h2>
        <p>Rmikrobiyoloji Platformu'na başarıyla kaydoldunuz!</p>
        <p>Hesabınızı aktive etmek ve platformu kullanmaya başlamak için lütfen aşağıdaki linke tıklayın:</p>
        <p style="text-align: center;">
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 12px 25px; margin: 20px 0; font-size: 16px; color: white; background-color: #007bff; text-decoration: none; border-radius: 5px;">
            Hesabımı Aktive Et
          </a>
        </p>
        <p>Eğer bu link çalışmazsa, aşağıdaki adresi tarayıcınızın adres çubuğuna yapıştırabilirsiniz:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>Eğer bu kaydı siz yapmadıysanız, lütfen bu e-postayı dikkate almayın.</p>
        <br>
        <p>Teşekkürler,<br>Rmikrobiyoloji Platformu Ekibi</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Doğrulama e-postası ${toEmail} adresine gönderildi.`);
  } catch (error) {
    console.error(`E-posta gönderilirken hata oluştu (${toEmail}):`, error);
    // Burada daha detaylı hata yönetimi yapılabilir (örn: kullanıcıya bilgi vermek)
    // Production ortamında, e-posta gönderilememesi kritik olabilir.
    throw new Error('Doğrulama e-postası gönderilemedi.');
  }
};

// Şifre sıfırlama e-postası gönderme fonksiyonu (ileride eklenecek)
const sendPasswordResetEmail = async (toEmail, username, resetUrl) => {
  // ... (Benzer şekilde oluşturulacak)
  console.log(`Şifre sıfırlama linki ${toEmail} adresine gönderildi (simüle edildi): ${resetUrl}`);
};


module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};