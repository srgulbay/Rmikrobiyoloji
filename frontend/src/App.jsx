import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spinner, Flex } from '@chakra-ui/react'; // Center kaldırıldı, Flex ile ortalama yapılabilir

// Sayfaları import et
import TopicBrowserPage from './pages/TopicBrowserPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import SolvePage from './pages/SolvePage';
// MyStatsPage yerine DashboardPage kullanılıyor (kullanıcı zaten güncellemiş)
import DashboardPage from './pages/DashboardPage';
import LectureViewPage from './pages/LectureViewPage';
import WordPracticePage from './pages/WordPracticePage';
import VerifyEmailPage from './pages/VerifyEmailPage'; // Yeni sayfa import edildi

// Layout component'ini import et
import Layout from './components/Layout';

// Auth Context Hook'unu import et
import { useAuth } from './context/AuthContext';

// Route Koruma Componentleri
function LoadingIndicator() {
    return (
        <Flex minH="100vh" align="center" justify="center">
            <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="brand.500"
                size="xl"
            />
        </Flex>
    );
}

function ProtectedRoute({ children }) {
    const { isAuthenticated, authLoading } = useAuth(); // loading -> authLoading olarak güncellendi AuthContext'e göre
    if (authLoading) return <LoadingIndicator />;
    if (!isAuthenticated) { return <Navigate to="/login" replace />; }
    return children;
}

function AdminRoute({ children }) {
    const { isAuthenticated, user, authLoading } = useAuth(); // loading -> authLoading
    if (authLoading) return <LoadingIndicator />;
    if (!isAuthenticated || user?.role !== 'admin') { return <Navigate to="/browse" replace />; }
    return children;
}

function PublicRoute({ children }) {
    const { isAuthenticated, authLoading } = useAuth(); // loading -> authLoading
    if (authLoading) return <LoadingIndicator />;
    if (isAuthenticated) { return <Navigate to="/browse" replace />; }
    return children;
}

// Ana App Component'i
function App() {
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
                path="/my-stats" // Bu yol /dashboard olarak değiştirilebilir veya kalabilir
                element={ <ProtectedRoute> <DashboardPage /> </ProtectedRoute> }
            />
             <Route
               path="/wordle-game"
               element={ <ProtectedRoute> <WordPracticePage /> </ProtectedRoute> }
             />
              <Route
                path="/dashboard" // Dashboard için yeni veya alternatif yol
                element={ <ProtectedRoute> <DashboardPage /> </ProtectedRoute> }
              />
            <Route path="/" element={<Navigate to="/browse" replace />} />
        </Route>

        {/* Layout Dışında Kalan Route'lar */}
        <Route
            path="/login"
            element={ <PublicRoute> <LoginPage /> </PublicRoute> }
        />
         <Route
            path="/register"
            element={ <PublicRoute> <RegisterPage /> </PublicRoute> }
        />
        {/* YENİ ROUTE: E-posta doğrulama sayfası */}
        <Route
            path="/verify-email/:token" // URL parametresi olarak :token
            element={<VerifyEmailPage />} // PublicRoute'a sarmaya gerek yok
        />

        <Route path="*" element={<Navigate to="/browse" replace />} />
      </Routes>
  );
}

export default App;