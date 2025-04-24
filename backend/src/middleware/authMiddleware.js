const jwt = require('jsonwebtoken');
const { User } = require('../../models');

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      console.error('Token doğrulama hatası:', error.message);
      return res.status(401).json({ message: 'Yetkisiz erişim: Geçersiz token' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Yetkisiz erişim: Token bulunamadı' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Yetkisiz erişim: Yönetici yetkisi gerekli.' });
  }
};

module.exports = { protect, isAdmin };
