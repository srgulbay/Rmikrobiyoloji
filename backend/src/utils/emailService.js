// backend/src/utils/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (toEmail, username, verificationUrl) => {
  const mailOptions = {
    from: `"Rmikrobiyoloji Platformu" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Hesabınızı Aktive Edin - Rmikrobiyoloji Platformu',
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
        <p>Bu link 24 saat geçerlidir.</p>
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
    throw new Error('Doğrulama e-postası gönderilemedi.');
  }
};

const sendPasswordResetEmail = async (toEmail, username, resetUrl) => {
  const mailOptions = {
    from: `"Rmikrobiyoloji Platformu" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Şifre Sıfırlama İsteği - Rmikrobiyoloji Platformu',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Merhaba ${username},</h2>
        <p>Hesabınız için bir şifre sıfırlama isteğinde bulundunuz.</p>
        <p>Yeni bir şifre belirlemek için lütfen aşağıdaki linke tıklayın. Bu link 1 saat geçerlidir:</p>
        <p style="text-align: center;">
          <a href="${resetUrl}"
             style="display: inline-block; padding: 12px 25px; margin: 20px 0; font-size: 16px; color: white; background-color: #28a745; text-decoration: none; border-radius: 5px;">
            Şifremi Sıfırla
          </a>
        </p>
        <p>Eğer bu link çalışmazsa, aşağıdaki adresi tarayıcınızın adres çubuğuna yapıştırabilirsiniz:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Eğer bu şifre sıfırlama isteğini siz yapmadıysanız, lütfen bu e-postayı dikkate almayın. Şifreniz güvende kalacaktır.</p>
        <br>
        <p>Teşekkürler,<br>Rmikrobiyoloji Platformu Ekibi</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Şifre sıfırlama e-postası ${toEmail} adresine gönderildi.`);
  } catch (error) {
    console.error(`Şifre sıfırlama e-postası gönderilirken hata oluştu (${toEmail}):`, error);
    throw new Error('Şifre sıfırlama e-postası gönderilemedi.');
  }
};


module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};