// src/context/AuthContext.jsx
console.log(">>> API BASE:", import.meta.env.VITE_API_BASE_URL);
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});
const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('rmikro_token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('rmikro_token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();


  useEffect(() => {
    if (token) {
      localStorage.setItem('rmikro_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decodedUser = JSON.parse(jsonPayload);
        setUser({
            id: decodedUser.id,
            username: decodedUser.username,
            role: decodedUser.role,
            specialization: decodedUser.specialization
        });
      } catch (e) {
        console.error("AuthContext: Error decoding token for user state:", e);
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('rmikro_token');
        delete axios.defaults.headers.common['Authorization'];
      }
    } else {
      localStorage.removeItem('rmikro_token');
      delete axios.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    const storedToken = localStorage.getItem('rmikro_token');
    if (storedToken && !token) {
       setToken(storedToken);
    }
  }, []);


  const login = async (username, password) => {
    setError(null);
    const startTime = Date.now();
    setLoading(true);

    const MIN_LOADING_TIME = 500; // Minimum 500ms yükleme süresi

    try {
      const response = await API.post('/api/auth/login', { username, password });
      if (response.data.token) {
        setToken(response.data.token);
        navigate('/browse');
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

      if (remainingTime > 0) {
        setTimeout(() => {
          setLoading(false);
        }, remainingTime);
      } else {
        setLoading(false);
      }
    }
  };

  const register = async (username, password, specialization) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/register`, { username, password, specialization });
      navigate('/login');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Kayıt sırasında bir hata oluştu.';
      setError(errorMsg);
      console.error("AuthContext: Register error:", errorMsg, err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('rmikro_token');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;