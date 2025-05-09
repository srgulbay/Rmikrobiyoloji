const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../../models');
const { sendVerificationEmail } = require('../utils/emailService');

const registerUser = async (req, res) => {
  console.log("authController -> registerUser -> Gelen req.body:", req.body);
  const { username, email, password, role, specialization } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: 'Kullanıcı adı, e-posta ve şifre zorunludur.' });
  }

  try {
    let existingUser = await User.findOne({ where: { username: username } });
    if (existingUser) {
      return res.status(409).json({ message: 'Bu kullanıcı adı zaten kullanılıyor.' });
    }
    existingUser = await User.findOne({ where: { email: email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Bu e-posta adresi zaten kayıtlı.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUser = await User.create({
      username: username,
      email: email,
      password: hashedPassword,
      role: role || 'user',
      specialization: specialization || null,
      isEmailVerified: false,
      emailVerificationToken: emailVerificationToken,
      emailVerificationTokenExpires: emailVerificationTokenExpires
    });

    try {
      console.log("CANLI ORTAM registerUser - FRONTEND_URL:", process.env.FRONTEND_URL);
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${emailVerificationToken}`;
      await sendVerificationEmail(newUser.email, newUser.username, verificationUrl);
    } catch (emailError) {
      console.error('Doğrulama e-postası gönderilirken hata (kullanıcı oluşturuldu):', emailError.message);
    }

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu. Hesabınızı aktive etmek için lütfen e-postanızı kontrol edin.',
      userId: newUser.id
    });

  } catch (error) {
    console.error('Kayıt sırasında hata:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const messages = error.errors.map(e => e.message).join('. ');
        return res.status(400).json({ message: `Doğrulama hatası: ${messages}`});
    }
    res.status(500).json({ message: 'Sunucu hatası. Kullanıcı kaydedilemedi.' });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Kullanıcı adı ve şifre zorunludur.' });
  }

  try {
    const user = await User.findOne({ where: { username: username } });

    if (!user) {
      return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre.' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: 'Lütfen önce e-posta adresinizi doğrulayın. Aktivasyon linki e-postanıza gönderilmiştir.',
        needsVerification: true,
        email: user.email
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre.' });
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      specialization: user.specialization
    };

    const secret = process.env.JWT_SECRET;
    const options = {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    };

    if (!secret) {
        console.error("JWT_SECRET tanımlanmamış!");
        return res.status(500).json({ message: 'Sunucu yapılandırma hatası.' });
    }

    const token = jwt.sign(payload, secret, options);

    res.status(200).json({
      message: 'Giriş başarılı.',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        specialization: user.specialization,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.error('Giriş sırasında hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Giriş yapılamadı.' });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ message: 'Doğrulama tokenı eksik.' });
  }

  try {
    const user = await User.findOne({
      where: {
        emailVerificationToken: token,
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş doğrulama tokenı.' });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({ message: 'E-posta adresiniz zaten doğrulanmış.' });
    }

    if (user.emailVerificationTokenExpires < new Date()) {
      user.emailVerificationToken = null;
      user.emailVerificationTokenExpires = null;
      await user.save();
      return res.status(400).json({ message: 'Doğrulama tokenının süresi dolmuş. Lütfen yeni bir doğrulama e-postası isteyin.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpires = null;
    await user.save();

    res.status(200).json({ message: 'E-posta adresiniz başarıyla doğrulandı! Artık giriş yapabilirsiniz.' });

  } catch (error) {
    console.error('E-posta doğrulama sırasında hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. E-posta doğrulanamadı.' });
  }
};

const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'E-posta adresi zorunludur.' });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(200).json({ message: 'Eğer bu e-posta adresi sistemimizde kayıtlıysa, doğrulama linki gönderilmiştir.' });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({ message: 'Bu e-posta adresi zaten doğrulanmış.' });
    }

    const newEmailVerificationToken = crypto.randomBytes(32).toString('hex');
    const newEmailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = newEmailVerificationToken;
    user.emailVerificationTokenExpires = newEmailVerificationTokenExpires;
    await user.save();

    try {
      console.log("CANLI ORTAM resendVerificationEmail - FRONTEND_URL:", process.env.FRONTEND_URL);
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${newEmailVerificationToken}`;
      await sendVerificationEmail(user.email, user.username, verificationUrl);
    } catch (emailError) {
      console.error('Doğrulama e-postası yeniden gönderilirken hata:', emailError.message);
      return res.status(500).json({ message: 'Doğrulama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin.' });
    }

    res.status(200).json({ message: 'Yeni bir doğrulama linki e-posta adresinize gönderildi.' });

  } catch (error) {
    console.error('Doğrulama e-postası yeniden gönderiminde hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. İşlem gerçekleştirilemedi.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationEmail
};