import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// Chakra UI Bileşenlerini Yükleme Göstergesi için Import Et
import { Spinner, Flex, Center } from '@chakra-ui/react';

// Sayfaları import et
import TopicBrowserPage from './pages/TopicBrowserPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import SolvePage from './pages/SolvePage';
import MyStatsPage from './pages/MyStatsPage';
import DashboardPage from './pages/DashboardPage'; // Yeni satır
import LectureViewPage from './pages/LectureViewPage';
import WordPracticePage from './pages/WordPracticePage';

// Layout component'ini import et
import Layout from './components/Layout';

// Auth Context Hook'unu import et
import { useAuth } from './context/AuthContext';

// Route Koruma Componentleri (Chakra UI Spinner ile Güncellendi)
function LoadingIndicator() {
    // Tam sayfa kaplayan, ortalanmış bir yükleme göstergesi
    return (
        <Flex minH="100vh" align="center" justify="center">
             {/* Spinner tema renklerini (colorScheme="brand" gibi) ve boyutunu alır */}
            <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200" // Tema 'colors.gray.200'
                color="brand.500" // Tema 'colors.brand.500'
                size="xl" // Tema 'components.Spinner.sizes.xl'
            />
        </Flex>
    );
}

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <LoadingIndicator />; // Chakra UI Yükleme Göstergesi
    if (!isAuthenticated) { return <Navigate to="/login" replace />; }
    return children;
}

function AdminRoute({ children }) {
    const { isAuthenticated, user, loading } = useAuth();
    if (loading) return <LoadingIndicator />; // Chakra UI Yükleme Göstergesi
    // Giriş yapılmamışsa veya rol admin değilse ana sayfaya yönlendir
    if (!isAuthenticated || user?.role !== 'admin') { return <Navigate to="/browse" replace />; }
    return children;
}

function PublicRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <LoadingIndicator />; // Chakra UI Yükleme Göstergesi
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
            {/* /solve/:topicId için ayrı route gerekebilir veya SolvePage içinde topicId'yi opsiyonel alabilir */}
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
             <Route
               path="/wordle-game"
               element={ <ProtectedRoute> <WordPracticePage /> </ProtectedRoute> }
             />
              <Route
                path="/dashboard" // veya "/dashboard" gibi yeni bir yol da tanımlayabilirsiniz
                element={ <ProtectedRoute> <DashboardPage /> </ProtectedRoute> } // Yeni satır
              />
            {/* Ana sayfa yönlendirmesi */}
            <Route path="/" element={<Navigate to="/browse" replace />} />
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

export default App;