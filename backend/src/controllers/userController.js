const { User } = require('../../models');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
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
      attributes: { exclude: ['password'] }
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
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    user.role = role;
    await user.save();

    const updatedUserResponse = user.toJSON();
    delete updatedUserResponse.password;

    res.status(200).json(updatedUserResponse);
  } catch (error) {
    console.error('Kullanıcı rolü güncellenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Kullanıcı rolü güncellenemedi.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    await user.destroy();
    res.status(204).send();

  } catch (error) {
    console.error('Kullanıcı silinirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Kullanıcı silinemedi.' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser
};
