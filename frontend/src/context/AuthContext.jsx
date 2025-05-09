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
  const [error, setError] = useState(null); // Hata artık bir obje olabilir: { message, needsVerification, email }
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
          setToken(null); setUser(null); setIsAuthenticated(false);
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
        console.error("AuthContext: Invalid token on load.", e);
        localStorage.removeItem('rmikro_token');
        setToken(null); setUser(null); setIsAuthenticated(false);
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
        return { success: true, user: response.data.user }; // Başarılı giriş bilgisini döndür
      } else {
        // Backend'den token gelmedi ama 2xx yanıtı geldiyse (beklenmedik durum)
        const errorMsg = response.data.message || "Sunucudan geçersiz yanıt alındı.";
        setError({ message: errorMsg });
        return { success: false, message: errorMsg };
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
      return { success: false, message: errorMsg, needsVerification: errorData?.needsVerification, email: errorData?.email };
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = MIN_LOADING_TIME - elapsedTime;
      setTimeout(() => {
        setLoading(false);
      }, remainingTime > 0 ? remainingTime : 0);
    }
  };

  const register = async (username, email, password, specialization) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { username, email, password, specialization };
      console.log("AuthContext -> register -> Backend'e gönderilen payload:", payload);
      const response = await API.post('/api/auth/register', payload);
      // navigate('/login'); // YÖNLENDİRME KALDIRILDI
      return { success: true, message: response.data.message || 'Kayıt başarılı. Lütfen e-postanızı kontrol edin.' };
    } catch (err) {
      const errorData = err.response?.data;
      const errorMsg = errorData?.message || 'Kayıt sırasında bir hata oluştu.';
      setError({ message: errorMsg, details: errorData });
      console.error("AuthContext: Register error:", errorMsg, errorData || err.message);
      return { success: false, message: errorMsg }; // Hata durumunda mesajı döndür
    } finally {
      setLoading(false);
    }
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