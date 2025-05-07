// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// jwt-decode kütüphanesini import et
import { jwtDecode } from "jwt-decode"; // Named import olarak kullan

// Axios instance (baseURL'i kontrol et, VITE_API_BASE_URL yerine VITE_API_URL kullanılmış olabilir)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
console.log(">>> API BASE:", API_BASE_URL); // Kontrol logu
const API = axios.create({
  baseURL: API_BASE_URL
});

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Başlangıçta localStorage'dan token'ı al
  const [token, setToken] = useState(() => localStorage.getItem('rmikro_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!token); // Başlangıç durumunu token varlığına göre ayarla
  const [loading, setLoading] = useState(false); // Auth işlemleri için yükleme durumu
  const [authLoading, setAuthLoading] = useState(true); // Başlangıç token kontrolü için yükleme durumu
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Logout fonksiyonunu useCallback ile tanımla, useEffect içinde kullanılacak
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('rmikro_token');
    delete axios.defaults.headers.common['Authorization'];
    // Login sayfasına yönlendirirken replace: true kullanmak daha iyi olabilir
    navigate('/login', { replace: true });
  }, [navigate]); // navigate bağımlılığını ekle

  // Token değiştiğinde veya component ilk yüklendiğinde çalışacak useEffect
  useEffect(() => {
    const currentToken = localStorage.getItem('rmikro_token'); // Her zaman localStorage'ı kontrol et
    setAuthLoading(true); // Kontrol başlarken yüklemeyi başlat

    if (currentToken) {
      try {
        const decoded = jwtDecode(currentToken); // jwtDecode kullan
        const now = Date.now() / 1000; // Şu anki zaman (saniye cinsinden)

        // Token süresi dolmuş mu kontrol et
        if (decoded.exp < now) {
          console.log("AuthContext: Token expired.");
          logout(); // Süresi dolmuşsa çıkış yap
        } else {
          // Token geçerli ve süresi dolmamış
          if (!token || token !== currentToken) {
              setToken(currentToken); // State'i güncelle (eğer farklıysa)
          }
          axios.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
          setIsAuthenticated(true);
          // Kullanıcı bilgilerini state'e set et
          setUser({
            id: decoded.id,
            username: decoded.username,
            role: decoded.role,
            specialization: decoded.specialization
          });
        }
      } catch (e) {
        // Token decode edilemiyorsa (bozuksa)
        console.error("AuthContext: Invalid token.", e);
        logout(); // Çıkış yap
      }
    } else {
      // Token yoksa state'leri temizle (logout fonksiyonu bunu zaten yapıyor ama burada da olabilir)
       if (token) setToken(null); // State'de token varsa temizle
       if (user) setUser(null);
       if (isAuthenticated) setIsAuthenticated(false);
       delete axios.defaults.headers.common['Authorization'];
    }
    setAuthLoading(false); // Kontrol bittiğinde yüklemeyi bitir
  }, [token, logout]); // token ve logout bağımlılıkları

  // Login fonksiyonu
  const login = async (username, password) => {
    setError(null);
    setLoading(true); // API isteği için yükleme durumu
    const startTime = Date.now();
    const MIN_LOADING_TIME = 500;

    try {
      const response = await API.post('/api/auth/login', { username, password });
      if (response.data.token) {
        localStorage.setItem('rmikro_token', response.data.token); // Önce localStorage'a yaz
        setToken(response.data.token); // Sonra state'i güncelle (bu useEffect'i tetikleyecek)
        // navigate('/browse'); // Yönlendirme useEffect içinde token set edilince yapılabilir
      } else {
        throw new Error("Sunucudan geçersiz yanıt alındı.");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Giriş sırasında bir hata oluştu.';
      setError(errorMsg);
      console.error("AuthContext: Login error:", errorMsg, err.response?.data || err.message);
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = MIN_LOADING_TIME - elapsedTime;
      setTimeout(() => {
        setLoading(false);
      }, remainingTime > 0 ? remainingTime : 0);
    }
  };

  // Register fonksiyonu
  const register = async (username, password, specialization) => {
    setLoading(true); // API isteği için yükleme durumu
    setError(null);
    try {
      // API_URL yerine API_BASE_URL kullanılmalı ve axios instance (API) kullanılmalı
      await API.post('/api/auth/register', { username, password, specialization });
      // Kayıt başarılıysa login sayfasına yönlendirip bilgi mesajı gösterilebilir
      navigate('/login');
      // Başarı mesajı için toast kullanılabilir
      // toast({ title: "Kayıt Başarılı", description: "Şimdi giriş yapabilirsiniz.", status: "success" });
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Kayıt sırasında bir hata oluştu.';
      setError(errorMsg);
      console.error("AuthContext: Register error:", errorMsg, err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Context değeri
  const value = {
    user,
    token,
    isAuthenticated,
    loading, // API işlemleri için yükleme durumu
    authLoading, // Başlangıç kontrolü için yükleme durumu
    error,
    login,
    register,
    logout,
    setError
  };

  // Başlangıç yüklemesi bitene kadar içeriği gösterme (opsiyonel)
  // if (authLoading) {
  //    return <Center h="100vh"><Spinner size="xl" color="brand.500" /></Center>;
  // }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;