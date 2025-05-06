// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Temizlenmiş index.css (veya tamamen kaldırılabilir)
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChakraProvider } from '@chakra-ui/react'
import theme from './theme' // Oluşturduğunuz tema dosyasını import edin

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ChakraProvider'a oluşturduğunuz temayı verin */}
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>,
)