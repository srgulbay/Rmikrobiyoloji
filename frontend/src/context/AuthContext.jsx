import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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

  const API_URL = `${import.meta.env.VITE_API_URL}/api/auth`;

  useEffect(() => {
    if (token) {
      localStorage.setItem('rmikro_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      // Token içindeki kullanıcı bilgisi parse edilip state'e konulabilir
      try {
         const decodedUser = JSON.parse(atob(token.split('.')[1])); // Basit decode, idealde kütüphane kullanılır
         setUser({ id: decodedUser.id, username: decodedUser.username, role: decodedUser.role, specialization: decodedUser.specialization });
      } catch (e) {
         console.error("Error decoding token for user state:", e);
         // Belki burada logout çağrılabilir veya /me endpoint'i ile kullanıcı bilgisi çekilebilir
         setUser(null); // Hata durumunda user'ı temizle
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
    if (storedToken) {
       setToken(storedToken);
    }
  }, []);


  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/login`, { username, password });
      if (response.data.token) {
        setToken(response.data.token);
        setUser(response.data.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Giriş sırasında bir hata oluştu.');
      console.error("Login error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, password, specialization) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/register`, { username, password, specialization });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Kayıt sırasında bir hata oluştu.');
      console.error("Register error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
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
