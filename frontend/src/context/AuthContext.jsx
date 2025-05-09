// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API = axios.create({
  baseURL: API_BASE_URL
});

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('rmikro_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('rmikro_token');
    delete axios.defaults.headers.common['Authorization'];
    delete API.defaults.headers.common['Authorization'];
    navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const currentToken = localStorage.getItem('rmikro_token');
    setAuthLoading(true);

    if (currentToken) {
      try {
        const decoded = jwtDecode(currentToken);
        const now = Date.now() / 1000;

        if (decoded.exp < now) {
          localStorage.removeItem('rmikro_token');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
          delete axios.defaults.headers.common['Authorization'];
          delete API.defaults.headers.common['Authorization'];
        } else {
          if (!token || token !== currentToken) {
            setToken(currentToken);
          }
          axios.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
          API.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
          setIsAuthenticated(true);
          setUser({
            id: decoded.id,
            username: decoded.username,
            role: decoded.role,
            specialization: decoded.specialization
          });
        }
      } catch (e) {
        console.error("AuthContext: Invalid token.", e);
        localStorage.removeItem('rmikro_token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        delete axios.defaults.headers.common['Authorization'];
        delete API.defaults.headers.common['Authorization'];
      }
    } else {
      if (token) setToken(null);
      if (user) setUser(null);
      if (isAuthenticated) setIsAuthenticated(false);
      delete axios.defaults.headers.common['Authorization'];
      delete API.defaults.headers.common['Authorization'];
    }
    setAuthLoading(false);
  }, [token]);

  const login = async (username, password) => {
    setError(null);
    setLoading(true);
    const startTime = Date.now();
    const MIN_LOADING_TIME = 300;

    try {
      const response = await API.post('/api/auth/login', { username, password });
      if (response.data.token) {
        localStorage.setItem('rmikro_token', response.data.token);
        setToken(response.data.token);
        navigate('/browse', { replace: true });
      } else {
        // Backend'den token gelmediyse ama hata da yoksa genel bir hata fırlat
        setError({ message: response.data.message || "Sunucudan geçersiz yanıt alındı." });
        // throw new Error(response.data.message || "Sunucudan geçersiz yanıt alındı.");
      }
    } catch (err) {
      const errorData = err.response?.data;
      const errorMsg = errorData?.message || 'Giriş sırasında bir hata oluştu.';
      setError({
        message: errorMsg,
        needsVerification: errorData?.needsVerification,
        email: errorData?.email
      });
      console.error("AuthContext: Login error:", errorMsg, errorData || err.message);
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = MIN_LOADING_TIME - elapsedTime;
      setTimeout(() => {
        setLoading(false);
      }, remainingTime > 0 ? remainingTime : 0);
    }
  };

  // GÜNCELLENDİ: register fonksiyon imzası ve payload düzeltildi
  const register = async (username, email, password, specialization) => {
    setLoading(true);
    setError(null);
    let responseMessage = null;
    try {
      // Backend'e gönderilecek payload'un doğru alanları içerdiğinden emin ol
      const payload = { username, email, password, specialization };
      console.log("AuthContext -> register -> Backend'e gönderilen payload:", payload); // Kontrol logu
      const response = await API.post('/api/auth/register', payload);
      // Kayıt başarılıysa, backend'den gelen mesajı alıp RegisterPage'e döndür
      responseMessage = response.data.message || 'Kayıt başarılı. Lütfen e-postanızı kontrol edin.';
      // navigate('/login'); // Hemen login'e yönlendirmek yerine mesaj gösterilecek RegisterPage'de
    } catch (err) {
      const errorData = err.response?.data;
      const errorMsg = errorData?.message || 'Kayıt sırasında bir hata oluştu.';
      setError({ message: errorMsg, details: errorData }); // Hata objesini setError'a ver
      console.error("AuthContext: Register error:", errorMsg, errorData || err.message);
    } finally {
      setLoading(false);
    }
    return responseMessage; // RegisterPage'in mesajı işlemesi için döndür
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    authLoading,
    error,
    login,
    register,
    logout,
    setError
  };

  if (authLoading) {
     return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;