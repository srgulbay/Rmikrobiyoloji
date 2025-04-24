import React from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
// Sayfaları import et
import TopicBrowserPage from './pages/TopicBrowserPage'; // Eski HomePage yerine
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import SolvePage from './pages/SolvePage';
import MyStatsPage from './pages/MyStatsPage';
import LectureViewPage from './pages/LectureViewPage'; // LectureView import edildi
import './App.css';

function ProtectedRoute({ children }) { const { isAuthenticated } = useAuth(); if (!isAuthenticated) { return <Navigate to="/login" replace />; } return children; }
function AdminRoute({ children }) { const { isAuthenticated, user } = useAuth(); if (!isAuthenticated || user?.role !== 'admin') { return <Navigate to="/" replace />; } return children; }


function App() {
  const { isAuthenticated, user, logout } = useAuth();
  const handleLogout = () => { logout(); };

  return (
    <>
      <nav style={{ padding: '10px', background: '#eee', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <Link to="/browse">Konular</Link> {/* Anasayfa linki /browse oldu */}
        {isAuthenticated && user?.role === 'admin' && (<Link to="/admin">Yönetim Paneli</Link>)}
        {isAuthenticated && (<Link to="/solve">Soru Çöz (Rastgele)</Link>)}
        {isAuthenticated && (<Link to="/my-stats">İstatistiklerim</Link>)}
        {isAuthenticated ? ( <> <span style={{ marginLeft: 'auto' }}> Hoşgeldin, {user?.username || 'Kullanıcı'}! ({user?.role} - {user?.specialization || 'Belirtilmemiş'}) </span> <button onClick={handleLogout} >Çıkış Yap</button> </> )
         : ( <> <Link to="/login" style={{ marginLeft: 'auto' }}>Giriş Yap</Link> <Link to="/register">Kayıt Ol</Link> </> )}
      </nav>

      <div style={{padding: '0 20px'}}>
          <Routes>
             {/* Ana rota artık /browse */}
             <Route path="/browse" element={ <ProtectedRoute> <TopicBrowserPage /> </ProtectedRoute> } />
             <Route path="/admin" element={ <AdminRoute> <AdminPage /> </AdminRoute> } />
             {/* Solve rotaları: biri parametresiz (rastgele), biri parametreli (filtrelenmiş) */}
             <Route path="/solve" element={ <ProtectedRoute> <SolvePage /> </ProtectedRoute> } />
             <Route path="/solve/:topicId" element={ <ProtectedRoute> <SolvePage /> </ProtectedRoute> } />
             {/* Konu anlatımı rotası */}
             <Route path="/lectures/topic/:topicId" element={ <ProtectedRoute> <LectureViewPage /> </ProtectedRoute> } />
             <Route path="/my-stats" element={ <ProtectedRoute> <MyStatsPage /> </ProtectedRoute> } />
             <Route path="/login" element={<LoginPage />} />
             <Route path="/register" element={<RegisterPage />} />
             {/* Varsayılan olarak /browse'a yönlendir */}
             <Route path="/" element={<Navigate to="/browse" replace />} />
             <Route path="*" element={<Navigate to="/browse" replace />} /> {/* Eşleşmeyenler de browse'a */}
          </Routes>
      </div>
    </>
  );
}

export default App;