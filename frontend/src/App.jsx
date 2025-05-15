import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'; // Outlet import edildi
import { Spinner, Flex, Heading, Center, Text } from '@chakra-ui/react'; // Center ve Text importları eklendi (404 için)

// Sayfa importları
import TopicBrowserPage from './pages/TopicBrowserPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import SolvePage from './pages/SolvePage';
import DashboardPage from './pages/DashboardPage'; // Dijital Mentor / İstatistiklerim
import LectureViewPage from './pages/LectureViewPage';
import WordPracticePage from './pages/WordPracticePage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import RequestPasswordResetPage from './pages/RequestPasswordResetPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage'; // YENİ: ProfilePage import edildi

// Layout ve Auth importları
import Layout from './components/Layout';
import { useAuth, AuthProvider } from './context/AuthContext'; // AuthProvider da buradan export ediliyor olmalı

// Yükleme Göstergesi Component'i
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

// Korumalı Rota Component'i
function ProtectedRoute({ children }) {
    const { isAuthenticated, authLoading } = useAuth();
    if (authLoading) return <LoadingIndicator />;
    if (!isAuthenticated) { return <Navigate to="/login" replace />; }
    return children;
}

// Admin Rotası Component'i
function AdminRoute({ children }) {
    const { isAuthenticated, user, authLoading } = useAuth();
    if (authLoading) return <LoadingIndicator />;
    // Giriş yapılmamışsa veya kullanıcı admin değilse yönlendir
    if (!isAuthenticated) { return <Navigate to="/login" replace />; }
    if (user?.role !== 'admin') { return <Navigate to="/browse" replace />; } // Admin değilse browse'a
    return children;
}

// Herkese Açık Rota Component'i (Giriş yapmış kullanıcıları yönlendirir)
function PublicRoute({ children }) {
    const { isAuthenticated, authLoading } = useAuth();
    if (authLoading) return <LoadingIndicator />;
    if (isAuthenticated) { return <Navigate to="/dashboard" replace />; } // Giriş yapmışsa dashboard'a
    return children;
}

// 404 Sayfası Component'i
function NotFoundPage() {
    return (
        <Center minH="60vh" flexDirection="column">
            <Heading size="2xl" mb={4}>404</Heading>
            <Text fontSize="xl">Sayfa Bulunamadı</Text>
            <Button as={RouterLink} to="/" colorScheme="brand" mt={6}>
                Ana Sayfaya Dön
            </Button>
        </Center>
    );
}


function AppRoutes() { // App fonksiyonunu AppRoutes olarak değiştirdim, AuthProvider dışarıda kalabilir
  return (
      <Routes>
        {/* Layout ile sarmalanmış rotalar (Navbar, Footer vb. içerir) */}
        <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/browse" replace />} /> {/* Ana yol /browse'a yönlendirsin */}
            <Route
                path="browse"
                element={ <ProtectedRoute> <TopicBrowserPage /> </ProtectedRoute> }
            />
            <Route
                path="admin"
                element={ <AdminRoute> <AdminPage /> </AdminRoute> }
            />
            <Route
                path="solve" // Genel soru çözme
                element={ <ProtectedRoute> <SolvePage /> </ProtectedRoute> }
            />
            {/* URL'den topicId vs. ile gelindiğinde de SolvePage'i kullanıyorduk, bu genel /solve ile birleşebilir.
                SolvePage içindeki query param okuma mantığı bunu zaten yönetir.
            <Route
                path="/solve/:topicId" 
                element={ <ProtectedRoute> <SolvePage /> </ProtectedRoute> }
            /> */}
            <Route
                path="lectures/topic/:topicId"
                element={ <ProtectedRoute> <LectureViewPage /> </ProtectedRoute> }
            />
            <Route
                path="dashboard" // Dijital Mentor için ana yol
                element={ <ProtectedRoute> <DashboardPage /> </ProtectedRoute> }
            />
             {/* my-stats yolunu /dashboard'a yönlendirebiliriz veya kaldırabiliriz, çünkü aynı component */}
            <Route path="my-stats" element={<Navigate to="/dashboard" replace />} />
            
            <Route
               path="wordle-game"
               element={ <ProtectedRoute> <WordPracticePage /> </ProtectedRoute> }
             />
            
            {/* YENİ: Profil Sayfası Rotası */}
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
             {/* Henüz oluşturulmamış Ayarlar sayfası için örnek */}
            <Route path="settings" element={<ProtectedRoute><Center><Heading size="md">Ayarlar Sayfası (Yapım Aşamasında)</Heading></Center></ProtectedRoute>} />
            <Route path="notifications" element={<ProtectedRoute><Center><Heading size="md">Tüm Bildirimler Sayfası (Yapım Aşamasında)</Heading></Center></ProtectedRoute>} />
            <Route path="announcements-view/:announcementId" element={<ProtectedRoute><Center><Heading size="md">Duyuru Detay Sayfası (Yapım Aşamasında)</Heading></Center></ProtectedRoute>} />


            {/* Layout içindeki diğer tüm yollar için 404 */}
            <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Layout dışında kalan, tam sayfa rotalar */}
        <Route
            path="/login"
            element={ <PublicRoute> <LoginPage /> </PublicRoute> }
        />
         <Route
            path="/register"
            element={ <PublicRoute> <RegisterPage /> </PublicRoute> }
        />
        <Route
            path="/verify-email/:token"
            element={<VerifyEmailPage />} // Bu public olabilir veya kullanıcıyı login'e yönlendirebilir
        />
        <Route
            path="/request-password-reset"
            element={ <PublicRoute> <RequestPasswordResetPage /> </PublicRoute> }
        />
        <Route
            path="/reset-password/:token"
            element={<ResetPasswordPage />} // Token kontrolü sayfa içinde olduğu için PublicRoute'a gerek yok
        />
        
        {/* Genel 404 (Layout dışı yakalanamayanlar için, ama genellikle Layout içindeki * yeterli olur) */}
        {/* <Route path="*" element={<NotFoundPage />} /> */} 
      </Routes>
  );
}

// AuthProvider'ı en dışa sarmak daha doğru bir prattiktir.
// Eğer BrowserRouter main.jsx'teyse, App direkt AppRoutes'u export edebilir.
// Şimdilik App.jsx'in tamamını güncelliyoruz.
function App(){
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    )
}

export default App;
