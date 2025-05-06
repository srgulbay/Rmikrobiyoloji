import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
// İkonları import edelim
import { FaSignInAlt, FaExclamationTriangle } from 'react-icons/fa';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    // login fonksiyonunu, error state'ini ve setter'ını, loading ve isAuthenticated durumlarını context'ten al
    const { login, error, setError, loading, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Eğer zaten giriş yapmışsa anasayfaya (/browse) yönlendir
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/browse', { replace: true }); // Ana sayfa /browse olarak güncellendi
        }
        // Component unmount olurken hata mesajını temizle (Best practice)
        return () => setError(null);
    }, [isAuthenticated, navigate, setError]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Form gönderildiğinde önceki hatayı temizle
        if (!username || !password) {
            setError("Lütfen kullanıcı adı ve şifreyi girin.");
            return;
        }
        await login(username, password);
        // Başarılı giriş sonrası yönlendirme AuthContext içinde yapılıyor olmalı (navigate('/') veya navigate('/browse'))
    };

    return (
        // Sayfayı ortalamak için auth-page sınıfı
        <div className="auth-page">
            {/* Formu kart içinde göstermek için auth-form-container */}
            <div className="auth-form-container">
                {/* Başlık */}
                <h2 className="text-center mb-6">Giriş Yap</h2>

                {/* Giriş Formu */}
                <form onSubmit={handleSubmit}>
                    {/* Hata Mesajı Alanı */}
                    {error && (
                        <div className="alert alert-danger mb-4" role="alert">
                            <FaExclamationTriangle className='alert-icon mr-2' /> {/* Hata ikonu */}
                            {error}
                        </div>
                    )}

                    {/* Kullanıcı Adı Alanı */}
                    <div className="form-group">
                        <label htmlFor="username" className='form-label'>Kullanıcı Adı:</label>
                        <input
                            type="text"
                            id="username"
                            className='form-input' // Stil sınıfı
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={loading} // Yüklenme sırasında disable et
                            placeholder='Kullanıcı adınızı girin'
                        />
                    </div>

                    {/* Şifre Alanı */}
                    <div className="form-group">
                        <label htmlFor="password" className='form-label'>Şifre:</label>
                        <input
                            type="password"
                            id="password"
                            className='form-input' // Stil sınıfı
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading} // Yüklenme sırasında disable et
                            placeholder='Şifrenizi girin'
                        />
                        {/* Şifremi unuttum linki (opsiyonel) */}
                        {/* <div className="text-right mt-2">
                            <Link to="/forgot-password" className="text-sm link-discreet">Şifremi Unuttum?</Link>
                        </div> */}
                    </div>

                    {/* Gönderme Butonu */}
                    {/* Tam genişlik için w-full, büyük buton için btn-lg */}
                    <button type="submit" className='btn btn-primary btn-lg w-full mt-6' disabled={loading}>
                        {loading ? (
                            // Yüklenme durumunda spinner göster
                            <div className='spinner spinner-sm' role="status" aria-hidden="true"></div>
                        ) : (
                            // Normal durumda ikon ve metin
                            <>
                                <FaSignInAlt className='btn-icon' /> Giriş Yap
                            </>
                        )}
                    </button>
                </form>

                {/* Kayıt Sayfasına Link */}
                {/* auth-switch-link sınıfı ile stil */}
                <p className="auth-switch-link mt-6">
                    Hesabınız yok mu? <Link to="/register" className='font-semibold'>Kayıt Olun</Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
