// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Context oluşturma
const AuthContext = createContext(null);

// Context'i kullanmak için özel bir hook
export const useAuth = () => {
  return useContext(AuthContext);
};

// Context Sağlayıcı Bileşeni
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Giriş yapan kullanıcı bilgisi
  const [token, setToken] = useState(localStorage.getItem('rmikro_token') || null); // JWT token
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('rmikro_token')); // Giriş durumu
  const [loading, setLoading] = useState(false); // API istekleri için yüklenme durumu
  const [error, setError] = useState(null); // Hata mesajları
  const navigate = useNavigate(); // Yönlendirme için

  // Backend API URL'si (environment variable'dan alınır)
  const API_URL = `${import.meta.env.VITE_API_URL}/api/auth`;

  // Token değiştiğinde veya ilk yüklendiğinde çalışacak effect
  useEffect(() => {
    if (token) {
      // Token varsa localStorage'a kaydet ve axios header'larına ekle
      localStorage.setItem('rmikro_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);

      // Token'dan kullanıcı bilgisini decode et (Basit yöntem - İyileştirme: /me endpoint)
      try {
        // Token'ın payload kısmını (ikinci kısım) alıp decode et
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const decodedUser = JSON.parse(jsonPayload);
        // Gelen bilgiden user state'ini oluştur
        setUser({
            id: decodedUser.id,
            username: decodedUser.username,
            role: decodedUser.role,
            specialization: decodedUser.specialization
        });
        console.log("AuthContext: User state set from token:", decodedUser); // Log
      } catch (e) {
        // Decode hatası olursa veya token geçersizse
        console.error("AuthContext: Error decoding token for user state:", e);
        // Token'ı temizle ve çıkış yap (güvenlik için)
        setToken(null); // Bu tekrar useEffect'i tetikleyip logout benzeri işlem yapar
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('rmikro_token');
        delete axios.defaults.headers.common['Authorization'];
      }
    } else {
      // Token yoksa localStorage ve axios header'larını temizle
      localStorage.removeItem('rmikro_token');
      delete axios.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
      setUser(null);
      console.log("AuthContext: No token found, user logged out."); // Log
    }
  }, [token]); // Sadece token değiştiğinde çalışır

  // Sayfa ilk yüklendiğinde localStorage'dan token'ı almayı dene
  // Bu effect zaten yukarıdaki token bağımlı effect tarafından kapsanıyor gibi,
  // ama zararı yok, ilk token'ı state'e set etmek için kalabilir.
  useEffect(() => {
    const storedToken = localStorage.getItem('rmikro_token');
    if (storedToken && !token) { // Sadece state'te token yoksa set et
       setToken(storedToken);
       console.log("AuthContext: Initial token loaded from localStorage."); // Log
    }
  }, []); // Sadece component mount edildiğinde çalışır


  // Giriş Fonksiyonu
  const login = async (username, password) => {
    setError(null);
    setLoading(true); // <<< Yüklenmeyi BAŞLAT
    console.log("AuthContext: Login attempt started, loading set to true."); // Log

    // Asenkron işlemi bir sonraki event loop tick'ine ertele (Spinner'ın görünmesi için test)
    setTimeout(async () => {
      try {
        console.log("AuthContext: Starting API call for login..."); // Log
        // --- TEST İÇİN YAPAY GECİKME (GERÇEK KULLANIMDA SİLİN!) ---
         // console.log("AuthContext: Simulating network delay for testing...");
         // await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 saniye bekle
        // --- TEST İÇİN YAPAY GECİKME SONU ---

        const response = await axios.post(`${API_URL}/login`, { username, password });
        console.log("AuthContext: API call finished for login."); // Log

        if (response.data.token) {
          // Başarılı ise token'ı state'e set et (bu useEffect'i tetikler)
          setToken(response.data.token);
          // setUser state'i token'a bağlı useEffect içinde ayarlanacak
          console.log("AuthContext: Token received, navigating to /browse..."); // Log
          navigate('/browse'); // Anasayfaya yönlendir
        } else {
           // Beklenmedik durum: token gelmedi
           throw new Error("Sunucudan geçersiz yanıt alındı.");
        }
      } catch (err) {
        // Hata durumunda hatayı state'e set et
        const errorMsg = err.response?.data?.message || 'Giriş sırasında bir hata oluştu.';
        setError(errorMsg);
        console.error("AuthContext: Login error:", errorMsg, err.response?.data || err.message);
      } finally {
        setLoading(false); // <<< İşlem bitince yüklenmeyi BİTİR
        console.log("AuthContext: Loading set to false in finally block."); // Log
      }
    }, 0); // Sıfır gecikme ile bir sonraki tick'e ertele
  };

  // Kayıt Fonksiyonu
  const register = async (username, password, specialization) => {
    setLoading(true); // <<< Yüklenmeyi BAŞLAT
    setError(null);
    console.log("AuthContext: Register attempt started."); // Log
    try {
       // API isteğini yap
      const response = await axios.post(`${API_URL}/register`, { username, password, specialization });
      console.log("AuthContext: Registration successful:", response.data); // Log
      // Başarılı kayıt sonrası login sayfasına yönlendir (kullanıcı giriş yapmalı)
      navigate('/login');
      // Opsiyonel: Başarı mesajı gösterilebilir (örn: toast ile login sayfasında)
      // navigate('/login', { state: { registrationSuccess: true } });
    } catch (err) {
       // Hata durumunda hatayı state'e set et
      const errorMsg = err.response?.data?.message || 'Kayıt sırasında bir hata oluştu.';
      setError(errorMsg);
      console.error("AuthContext: Register error:", errorMsg, err.response?.data || err.message);
    } finally {
      setLoading(false); // <<< İşlem bitince yüklenmeyi BİTİR
      console.log("AuthContext: Loading set to false after registration attempt."); // Log
    }
  };

  // Çıkış Fonksiyonu
  const logout = () => {
    console.log("AuthContext: Logging out."); // Log
    // State'leri ve localStorage'ı temizle
    setToken(null);
    setUser(null);
    setIsAuthenticated(false); // Bunu da false yapalım hemen
    localStorage.removeItem('rmikro_token');
    delete axios.defaults.headers.common['Authorization'];
    // Login sayfasına yönlendir
    navigate('/login');
  };

  // Context üzerinden paylaşılacak değerler
  const value = {
    user,
    token,
    isAuthenticated,
    loading, // Bu state bileşenler tarafından kullanılacak
    error,
    login,
    register,
    logout,
    setError // Hata mesajını dışarıdan temizlemek için (opsiyonel)
  };

  // Sağlayıcıyı döndür
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Context'i export et (kullanılacaksa)
export default AuthContext;