import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, setError, loading, isAuthenticated } = useAuth();
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
    setError(null); // Önceki hatayı temizle
    if (!username || !password) {
      setError("Lütfen kullanıcı adı ve şifreyi girin.");
      return;
    }
    await login(username, password);
    // Başarılı olursa AuthContext içindeki navigate çalışacak
  };

  return (
    <div>
      <h2>Giriş Yap</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Kullanıcı Adı:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <br />
        <div>
          <label htmlFor="password">Şifre:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <br />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>
      <p>
        Hesabınız yok mu? <Link to="/register">Kayıt Olun</Link>
      </p>
    </div>
  );
}

export default LoginPage;
