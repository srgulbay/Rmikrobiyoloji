// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Temizlenmiş index.css
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChakraProvider } from '@chakra-ui/react';
// GÜNCELLENDİ: Tema import yolu düzeltildi. './theme' genellikle './theme/index.js' dosyasını bulur.
import theme from './theme'; // Modüler tema yapısının ana dosyasını import edin

ReactDOM.createRoot(document.getElementById('root')).render(
  // ChakraProvider'a oluşturduğunuz temayı verin
  <React.StrictMode>
  <ChakraProvider theme={theme}>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </ChakraProvider>
  </React.StrictMode>  
);