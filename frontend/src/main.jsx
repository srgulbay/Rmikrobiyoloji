import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Stil dosyamız
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChakraProvider } from '@chakra-ui/react' // ChakraProvider import edildi

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ChakraProvider'ı en dışa veya uygun bir yere ekle */}
    <ChakraProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>,
)
