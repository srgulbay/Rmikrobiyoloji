import React from 'react';
// Kullanılmayan ChakraProvider ve BrowserRouter importları kaldırıldı.
import { Routes, Route, Navigate } from 'react-router-dom';

// Sayfaları import et
import TopicBrowserPage from './pages/TopicBrowserPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import SolvePage from './pages/SolvePage';
import MyStatsPage from './pages/MyStatsPage';
import LectureViewPage from './pages/LectureViewPage';
import WordPracticePage from './pages/WordPracticePage'; // Import et

// Layout component'ini import et
import Layout from './components/Layout';

// AuthProvider burada kullanılmıyor, kaldırıldı. useAuth route koruyucular için gerekli.
import { useAuth } from './context/AuthContext';

// Route Koruma Componentleri App component'inin DIŞINA taşındı
function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    // Yüklenme durumu için gösterge
    if (loading) return <div className='loading-indicator'><div className='spinner spinner-lg'></div></div>;
    // Giriş yapılmamışsa Login'e yönlendir
    if (!isAuthenticated) { return <Navigate to="/login" replace />; }
    // Giriş yapılmışsa çocuk component'i render et
    return children;
}

function AdminRoute({ children }) {
    const { isAuthenticated, user, loading } = useAuth();
    // Yüklenme durumu için gösterge
    if (loading) return <div className='loading-indicator'><div className='spinner spinner-lg'></div></div>;
    // Giriş yapılmamışsa veya rol admin değilse ana sayfaya yönlendir
    if (!isAuthenticated || user?.role !== 'admin') { return <Navigate to="/browse" replace />; }
    // Yetkiliyse çocuk component'i render et
    return children;
}

function PublicRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
     // Yüklenme durumu için gösterge
    if (loading) return <div className='loading-indicator'><div className='spinner spinner-lg'></div></div>;
    // Giriş yapmışsa ana sayfaya yönlendir
    if (isAuthenticated) { return <Navigate to="/browse" replace />; }
    // Giriş yapmamışsa çocuk component'i (Login/Register) render et
    return children;
}

// Ana App Component'i
function App() {
  // Header ile ilgili state ve fonksiyonlar zaten Layout'a taşınmıştı

  return (
      <Routes>
        {/* Ana Layout'u kullanan Route'lar */}
        <Route element={<Layout />}>
            <Route
                path="/browse"
                element={ <ProtectedRoute> <TopicBrowserPage /> </ProtectedRoute> }
            />
            <Route
                path="/admin"
                element={ <AdminRoute> <AdminPage /> </AdminRoute> }
            />
            <Route
                path="/solve"
                element={ <ProtectedRoute> <SolvePage /> </ProtectedRoute> }
            />
            <Route
                path="/solve/:topicId"
                element={ <ProtectedRoute> <SolvePage /> </ProtectedRoute> }
            />
            <Route
                path="/lectures/topic/:topicId"
                element={ <ProtectedRoute> <LectureViewPage /> </ProtectedRoute> }
            />
            <Route
                path="/my-stats"
                element={ <ProtectedRoute> <MyStatsPage /> </ProtectedRoute> }
            />
            {/* Ana sayfa yönlendirmesi */}
            <Route path="/" element={<Navigate to="/browse" replace />} />
            <Route
               path="/wordle-game" // Veya istediğin başka bir yol
               element={ <ProtectedRoute> <WordPracticePage /> </ProtectedRoute> }
             />
        </Route>

        {/* Layout Dışında Kalan Route'lar (Giriş/Kayıt) */}
        <Route
            path="/login"
            element={ <PublicRoute> <LoginPage /> </PublicRoute> }
        />
         <Route
            path="/register"
            element={ <PublicRoute> <RegisterPage /> </PublicRoute> }
        />

        {/* Eşleşmeyen tüm yolları ana sayfaya yönlendir */}
        <Route path="*" element={<Navigate to="/browse" replace />} />
      </Routes>
  );
}

// main.jsx'te sarmalanacak ana export
export default App;
