import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
// İkonları import edelim
import { FaUserPlus, FaExclamationTriangle } from 'react-icons/fa';

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [specialization, setSpecialization] = useState('');
    // register fonksiyonunu, error state'ini ve setter'ını, loading ve isAuthenticated durumlarını context'ten al
    const { register, error, setError, loading, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Eğer zaten giriş yapmışsa anasayfaya (/browse) yönlendir
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/browse', { replace: true }); // Ana sayfa /browse
        }
        // Component unmount olurken hata mesajını temizle
        return () => setError(null);
    }, [isAuthenticated, navigate, setError]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Önceki hatayı temizle

        // Şifre eşleşme kontrolü
        if (password !== confirmPassword) {
            setError('Girilen şifreler eşleşmiyor!');
            return;
        }
        // Zorunlu alan kontrolü
        if (!username || !password) {
            setError('Kullanıcı adı ve şifre alanları zorunludur.');
            return;
        }
        // Şifre uzunluğu kontrolü (örnek)
        if (password.length < 6) {
             setError('Şifre en az 6 karakter olmalıdır.');
             return;
        }

        // Specialization boşsa null gönder
        const specToSend = specialization.trim() === '' ? null : specialization;
        await register(username, password, specToSend);
        // Başarılı kayıt sonrası yönlendirme AuthContext içinde yapılıyor (genellikle login'e)
    };

    return (
        // Sayfayı ortalamak için auth-page sınıfı
        <div className="auth-page">
            {/* Formu kart içinde göstermek için auth-form-container */}
            <div className="auth-form-container">
                {/* Başlık */}
                <h2 className="text-center mb-6">Kayıt Ol</h2>

                {/* Kayıt Formu */}
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
                        <label htmlFor="usernameReg" className='form-label'>Kullanıcı Adı:</label> {/* id'yi değiştirdik (LoginPage ile çakışmasın) */}
                        <input
                            type="text"
                            id="usernameReg"
                            className='form-input' // Stil sınıfı
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={loading}
                            placeholder='Bir kullanıcı adı belirleyin'
                        />
                    </div>

                    {/* Şifre Alanı */}
                    <div className="form-group">
                        <label htmlFor="passwordReg" className='form-label'>Şifre:</label> {/* id'yi değiştirdik */}
                        <input
                            type="password"
                            id="passwordReg"
                            className='form-input' // Stil sınıfı
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            placeholder='En az 6 karakter'
                            aria-describedby="passwordHelp" // Şifre gereksinimleri için açıklama (opsiyonel)
                        />
                         {/* Opsiyonel: Şifre gereksinimleri için yardımcı metin */}
                         {/* <p id="passwordHelp" className="form-text">Şifreniz en az 6 karakter olmalıdır.</p> */}
                    </div>

                     {/* Şifre Tekrar Alanı */}
                    <div className="form-group">
                        <label htmlFor="confirmPasswordReg" className='form-label'>Şifre Tekrar:</label> {/* id'yi değiştirdik */}
                        <input
                            type="password"
                            id="confirmPasswordReg"
                            className='form-input' // Stil sınıfı
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                            placeholder='Şifrenizi tekrar girin'
                            // Şifreler eşleşmiyorsa invalid stili uygula (opsiyonel)
                            aria-invalid={password !== confirmPassword && confirmPassword !== ''}
                         />
                         {password !== confirmPassword && confirmPassword !== '' && (
                              <p className="invalid-feedback">Şifreler eşleşmiyor!</p>
                          )}
                    </div>

                     {/* Uzmanlık Alanı */}
                    <div className="form-group">
                        <label htmlFor="specialization" className='form-label'>Uzmanlık Alanı (İsteğe Bağlı):</label>
                        <select
                            id="specialization"
                            className='form-select' // Stil sınıfı
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">-- Alan Seçiniz --</option>
                            <option value="YDUS">YDUS</option>
                            <option value="TUS">TUS</option>
                            <option value="DUS">DUS</option>
                            <option value="Tıp Fakültesi Dersleri">Tıp Fakültesi Dersleri</option>
                            <option value="Diş Hekimliği Fakültesi Dersleri">Diş Hekimliği Fakültesi Dersleri</option>
                            <option value="Diğer">Diğer</option>
                        </select>
                    </div>

                    {/* Gönderme Butonu */}
                    <button type="submit" className='btn btn-primary btn-lg w-full mt-6' disabled={loading}>
                        {loading ? (
                            <div className='spinner spinner-sm' role="status" aria-hidden="true"></div>
                        ) : (
                            <>
                                <FaUserPlus className='btn-icon' /> Kayıt Ol
                            </>
                        )}
                    </button>
                </form>

                {/* Giriş Sayfasına Link */}
                <p className="auth-switch-link mt-6">
                    Zaten hesabınız var mı? <Link to="/login" className='font-semibold'>Giriş Yapın</Link>
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;
