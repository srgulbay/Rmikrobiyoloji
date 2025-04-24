import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'; // Router'ı import et
import { AuthProvider } from './context/AuthContext'; // AuthProvider'ı import et

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* Uygulamayı Router ile sarmala */}
      <AuthProvider> {/* Uygulamayı AuthProvider ile sarmala */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
