import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [specialization, setSpecialization] = useState(''); // Uzmanlık alanı state'i
  const { register, error, setError, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Eğer zaten giriş yapmışsa anasayfaya yönlendir
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
     // Component unmount olurken hata mesajını temizle
     return () => setError(null);
  }, [isAuthenticated, navigate, setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor!');
      return;
    }
    if (!username || !password) {
       setError('Kullanıcı adı ve şifre zorunludur.');
       return;
    }
    // Eğer specialization boşsa null gönderelim veya hiç göndermeyelim
    const specToSend = specialization.trim() === '' ? null : specialization;
    await register(username, password, specToSend);
     // Başarılı olursa AuthContext içindeki navigate çalışacak (login'e)
  };

  return (
    <div>
      <h2>Kayıt Ol</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Kullanıcı Adı:</label>
          <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <br />
        <div>
          <label htmlFor="password">Şifre:</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <br />
        <div>
          <label htmlFor="confirmPassword">Şifre Tekrar:</label>
          <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </div>
        <br />
        <div>
          <label htmlFor="specialization">Uzmanlık Alanı (İsteğe Bağlı):</label>
          <select id="specialization" value={specialization} onChange={(e) => setSpecialization(e.target.value)}>
            <option value="">Seçiniz...</option>
            <option value="YDUS">YDUS</option>
            <option value="TUS">TUS</option>
            <option value="DUS">DUS</option>
            <option value="Tıp Fakültesi Dersleri">Tıp Fakültesi Dersleri</option>
            <option value="Diş Hekimliği Fakültesi Dersleri">Diş Hekimliği Fakültesi Dersleri</option>
            <option value="Diğer">Diğer</option>
          </select>
        </div>
        <br />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
        </button>
      </form>
      <p>
        Zaten hesabınız var mı? <Link to="/login">Giriş Yapın</Link>
      </p>
    </div>
  );
}

export default RegisterPage;
