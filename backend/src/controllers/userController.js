const { User, ExamClassification } = require('../../models');
const { sendVerificationEmail } = require('../utils/emailService');
const crypto = require('crypto');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// --- Mevcut Admin Fonksiyonlarınız ---
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken', 'emailVerificationTokenExpires', 'passwordResetTokenExpires'] }
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Kullanıcıları listelerken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Kullanıcılar listelenemedi.' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken', 'emailVerificationTokenExpires', 'passwordResetTokenExpires'] }
    });
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Kullanıcı getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Kullanıcı getirilemedi.' });
  }
};

const updateUserRole = async (req, res) => {
  const { role } = req.body;
  const allowedRoles = ['user', 'admin'];

  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Geçersiz rol belirtildi.' });
  }
  try {
    const userToUpdate = await User.findByPk(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }
    if (req.user.id === parseInt(req.params.id, 10) && userToUpdate.role === 'admin' && role !== 'admin') {
        return res.status(403).json({ message: 'Admin kendi rolünü düşüremez.' });
    }
    userToUpdate.role = role;
    await userToUpdate.save();
    const { password, ...userResponse } = userToUpdate.toJSON();
    res.status(200).json(userResponse);
  } catch (error) {
    console.error('Kullanıcı rolü güncellenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Kullanıcı rolü güncellenemedi.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userToDelete = await User.findByPk(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }
    if (req.user.id === parseInt(req.params.id, 10)) {
        return res.status(403).json({ message: 'Kendinizi silemezsiniz.' });
    }
    await userToDelete.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Kullanıcı silinirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Kullanıcı silinemedi.' });
  }
};
    
const getMyProfile = async (req, res) => {
  try {
    // req.user middleware'den geldiği için zaten güncel olmalı, ama DB'den çekmek en garantisi.
    const userProfile = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken', 'emailVerificationTokenExpires', 'passwordResetTokenExpires'] }
    });
    if (!userProfile) {
      return res.status(404).json({ message: 'Kullanıcı profili bulunamadı.' });
    }
    res.status(200).json(userProfile);
  } catch (error) {
    console.error('Profil bilgileri getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Profil bilgileri getirilemedi.' });
  }
};

const updateMyProfile = async (req, res) => {
  const userId = req.user.id; // Bu, protect middleware'inden gelir ve güvenilirdir.
  const { username, email, specialization, defaultClassificationId } = req.body;
  console.log(`[UserController] updateMyProfile isteği (Kullanıcı ID: ${userId}):`, req.body);

  try {
    const userToUpdate = await User.findByPk(userId); // Değişken adını userToUpdate olarak değiştirdim.
    if (!userToUpdate) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    let emailChangedRequiresVerification = false;
    let oldEmailForNotification = userToUpdate.email; // Eski e-postayı sakla (opsiyonel)

    // Kullanıcı adı değişikliği
    if (username && username !== userToUpdate.username) {
      const existingUserByUsername = await User.findOne({ where: { username, id: { [Op.ne]: userId } } });
      if (existingUserByUsername) {
        return res.status(409).json({ message: 'Bu kullanıcı adı zaten başka bir hesap tarafından kullanılıyor.' });
      }
      userToUpdate.username = username;
    }

    // E-posta değişikliği
    if (email && email !== userToUpdate.email) {
      const existingUserByEmail = await User.findOne({ where: { email, id: { [Op.ne]: userId } } });
      if (existingUserByEmail) {
        return res.status(409).json({ message: 'Bu e-posta adresi zaten başka bir hesap tarafından kullanılıyor.' });
      }
      userToUpdate.email = email; // Yeni e-postayı ata
      userToUpdate.isEmailVerified = false; 
      userToUpdate.emailVerificationToken = crypto.randomBytes(32).toString('hex');
      userToUpdate.emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); 
      emailChangedRequiresVerification = true;
    }

    if (specialization !== undefined) userToUpdate.specialization = specialization === '' ? null : specialization;
    
    if (defaultClassificationId !== undefined) {
        if (defaultClassificationId === '' || defaultClassificationId === null) {
            userToUpdate.defaultClassificationId = null;
        } else {
            const parsedId = parseInt(defaultClassificationId, 10);
            if (isNaN(parsedId)) {
                return res.status(400).json({ message: 'Geçersiz varsayılan sınav sınıflandırma ID formatı.' });
            }
            const classificationExists = await ExamClassification.findByPk(parsedId);
            if (!classificationExists) {
                return res.status(400).json({ message: `Geçersiz varsayılan sınav sınıflandırma ID'si: ${parsedId}` });
            }
            userToUpdate.defaultClassificationId = parsedId;
        }
    }

    await userToUpdate.save(); // Tüm değişiklikleri kaydet

    // E-posta değiştiyse ve doğrulama gerekiyorsa, doğrulama e-postasını GÖNDER
    if (emailChangedRequiresVerification) {
      try {
        // process.env.FRONTEND_URL'in backend .env dosyanızda doğru tanımlandığından emin olun!
        if (!process.env.FRONTEND_URL) {
            console.error("[UserController] HATA: FRONTEND_URL ortam değişkeni tanımlanmamış. E-posta doğrulama linki oluşturulamıyor.");
            // Bu durumda kullanıcıya bir hata mesajı dönülebilir veya sadece loglanabilir.
            // throw new Error("Sunucu yapılandırma hatası: Doğrulama linki oluşturulamadı."); // İsteğe bağlı
        }
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${userToUpdate.emailVerificationToken}`;
        await sendVerificationEmail(userToUpdate.email, userToUpdate.username, verificationUrl);
        console.log(`[UserController] Kullanıcı ${userId} için yeni e-posta (${userToUpdate.email}) doğrulama maili gönderildi. URL: ${verificationUrl}`);
      } catch (emailError) {
        console.error('[UserController] E-posta değişikliği sonrası doğrulama e-postası gönderilirken hata:', emailError.message);
        // E-posta gönderimi başarısız olsa bile profil güncellemesi başarılı olabilir.
        // Bu durumu kullanıcıya bildirmek isteyebilirsiniz.
      }
    }
    
    const { password, ...updatedUserResponse } = userToUpdate.toJSON();
    let message = 'Profiliniz başarıyla güncellendi.';
    if (emailChangedRequiresVerification) { // E-posta değiştiyse mesajı güncelle
        message += ' Yeni e-posta adresinizi doğrulamak için lütfen gelen kutunuzu kontrol edin.';
    }
    
    res.status(200).json({ message, user: updatedUserResponse });

  } catch (error) {
    console.error(`[UserController] Profil güncellenirken hata (Kullanıcı ID: ${userId}):`, error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const messages = error.errors.map(e => e.message).join('. ');
        return res.status(400).json({ message: `Doğrulama hatası: ${messages}`});
    }
    res.status(500).json({ message: 'Sunucu hatası. Profil güncellenemedi.' });
  }
};

module.exports = {
  getAllUsers, getUserById, updateUserRole, deleteUser,
  getMyProfile, updateMyProfile
};
