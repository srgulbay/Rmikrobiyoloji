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
    delete API.defaults.headers.common['Authorization']; // Also remove from the instance
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
          console.log("AuthContext: Token expired.");
          // Clear invalid token from storage immediately
          localStorage.removeItem('rmikro_token');
          // Call logout logic without navigate if already unauthenticated
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
          delete axios.defaults.headers.common['Authorization'];
          delete API.defaults.headers.common['Authorization'];
        } else {
          if (!token || token !== currentToken) {
            setToken(currentToken);
          }
          // Set Authorization header for both default axios and the instance
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
        // Clear invalid token from storage immediately
        localStorage.removeItem('rmikro_token');
        // Call logout logic without navigate if already unauthenticated
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        delete axios.defaults.headers.common['Authorization'];
        delete API.defaults.headers.common['Authorization'];
      }
    } else {
      // Ensure states are cleared if no token found
      if (token) setToken(null);
      if (user) setUser(null);
      if (isAuthenticated) setIsAuthenticated(false);
      delete axios.defaults.headers.common['Authorization'];
      delete API.defaults.headers.common['Authorization'];
    }
    setAuthLoading(false);
  }, [token]); // Removed logout from dependencies to avoid potential loops

  const login = async (username, password) => {
    setError(null);
    setLoading(true);
    const startTime = Date.now();
    const MIN_LOADING_TIME = 300; // Reduced min loading time

    try {
      const response = await API.post('/api/auth/login', { username, password });
      if (response.data.token) {
        localStorage.setItem('rmikro_token', response.data.token);
        setToken(response.data.token); // Trigger useEffect to update user and headers
        navigate('/browse', { replace: true }); // Navigate after successful login attempt
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

  const register = async (username, password, specialization) => {
    setLoading(true);
    setError(null);
    try {
      // Use the API instance and correct endpoint
      await API.post('/api/auth/register', { username, password, specialization });
      navigate('/login');
      // Optionally show a success toast here
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Kayıt sırasında bir hata oluştu.';
      setError(errorMsg);
      console.error("AuthContext: Register error:", errorMsg, err.response?.data || err.message);
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

  // Render children only after initial auth check is complete
  // This prevents rendering protected routes with incorrect auth state briefly
  if (authLoading) {
     // You might want a better loading indicator here, e.g., using Chakra's Spinner
     return null; // Or a loading component
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;