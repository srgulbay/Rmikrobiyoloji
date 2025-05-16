import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // App.jsx, AuthProvider'ı kendi içinde barındırıyor
import './index.css';
import { BrowserRouter } from 'react-router-dom';
// AuthProvider artık App.jsx içinde olduğu için buradan kaldırıldı.
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme'; // "Yapay Zeka Havası" için kritik olan özel temanız

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* ChakraProvider, uygulamanızın genel görünümünü ve "AI hissini" belirleyen temanızı uygular */}
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        {/* AuthProvider, App bileşeni içinde AppRoutes'u sarıyor.
          Bu, kimlik doğrulama bağlamının tüm rotalarda erişilebilir olmasını sağlar.
        */}
        <App />
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>
);

// PWA: Service Worker kaydı, modern ve hızlı bir uygulama deneyimi sunar.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker başarıyla kaydedildi:', reg))
      .catch(err => console.error('Service Worker kaydı başarısız oldu:', err));
  });
}
