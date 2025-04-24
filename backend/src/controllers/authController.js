const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');

const registerUser = async (req, res) => {
  const { username, password, role, specialization } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Kullanıcı adı ve şifre zorunludur.' });
  }

  try {
    const existingUser = await User.findOne({ where: { username: username } });
    if (existingUser) {
      return res.status(409).json({ message: 'Bu kullanıcı adı zaten kullanılıyor.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      username: username,
      password: hashedPassword,
      role: role || 'user',
      specialization: specialization || null
    });

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu.',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        specialization: newUser.specialization,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error('Kayıt sırasında hata:', error);
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

    const token = jwt.sign(payload, secret, options);

    res.status(200).json({
      message: 'Giriş başarılı.',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        specialization: user.specialization
      }
    });

  } catch (error) {
    console.error('Giriş sırasında hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Giriş yapılamadı.' });
  }
};

module.exports = {
  registerUser,
  loginUser
};
