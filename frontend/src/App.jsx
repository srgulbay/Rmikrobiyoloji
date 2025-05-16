import React from 'react';
import { Routes, Route, Navigate, Outlet, Link as RouterLink } from 'react-router-dom';
import { Spinner, Flex, Heading, Center, Text, Button, Icon, Link as ChakraLink, useColorModeValue, Box, VStack } from '@chakra-ui/react'; // useColorModeValue, Box, VStack eklendi

// Sayfa importları
import TopicBrowserPage from './pages/TopicBrowserPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import SolvePage from './pages/SolvePage';
import DashboardPage from './pages/DashboardPage';
import LectureViewPage from './pages/LectureViewPage';
import WordPracticePage from './pages/WordPracticePage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import RequestPasswordResetPage from './pages/RequestPasswordResetPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import DigitalCoachPage from './pages/DigitalCoachPage';
import SRSReviewSessionPage from './pages/SRSReviewSessionPage';
import SRSQuestionReviewPage from './pages/SRSQuestionReviewPage';

// Layout ve Auth importları
import Layout from './components/Layout';
import { useAuth, AuthProvider } from './context/AuthContext';
import { FaHome, FaRobot } from 'react-icons/fa'; // FaRobot eklendi
import { FiLoader, FiAlertTriangle } from 'react-icons/fi'; // Modern ikonlar

function LoadingIndicator() {
    const mainBg = useColorModeValue('gray.100', 'gray.900');
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
    const textMutedColor = useColorModeValue('gray.500', 'gray.400');
    const accentColor = useColorModeValue('brand.500', 'brand.300');

    return (
        <Flex 
            minH="100vh" 
            align="center" 
            justify="center" 
            direction="column" 
            bg={mainBg} 
            p={4}
        >
            <VStack
              spacing={6}
              p={{base: 8, md: 12}}
              bg={cardBg}
              borderRadius="xl"
              boxShadow="xl"
              borderWidth="1px"
              borderColor={borderColor}
              textAlign="center"
              w="full"
              maxW="sm"
            >
                <Box animation="spin 2s linear infinite">
                    <Icon as={FiLoader} boxSize={{base:"48px", md:"60px"}} color={accentColor} />
                </Box>
                <Heading size="md" color={headingColor} fontWeight="semibold">
                    Yükleniyor...
                </Heading>
                <Text color={textMutedColor} fontSize="md">
                    Lütfen bekleyin, verileriniz hazırlanıyor.
                </Text>
            </VStack>
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </Flex>
    );
}

function ProtectedRoute({ children }) {
    const { isAuthenticated, authLoading } = useAuth();
    if (authLoading) return <LoadingIndicator />;
    if (!isAuthenticated) { return <Navigate to="/login" replace />; }
    return children;
}

function AdminRoute({ children }) {
    const { isAuthenticated, user, authLoading } = useAuth();
    if (authLoading) return <LoadingIndicator />;
    if (!isAuthenticated) { return <Navigate to="/login" replace />; }
    if (user?.role !== 'admin') { return <Navigate to="/dashboard" replace />; } // Admin değilse dashboard'a
    return children;
}

function PublicRoute({ children }) {
    const { isAuthenticated, authLoading } = useAuth();
    if (authLoading) return <LoadingIndicator />;
    if (isAuthenticated) { return <Navigate to="/dashboard" replace />; }
    return children;
}

function NotFoundPage() {
    const mainBg = useColorModeValue('gray.100', 'gray.900');
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const headingColor = useColorModeValue('brand.500', 'brand.300'); // Vurgu rengi
    const textColor = useColorModeValue('gray.700', 'gray.300');
    const buttonTextColor = useColorModeValue("white", "gray.900");

    return (
        <Flex minH="100vh" align="center" justify="center" direction="column" bg={mainBg} p={4}>
            <VStack
              spacing={8}
              p={{base: 8, md: 12}}
              bg={cardBg}
              borderRadius="2xl" // Daha yuvarlak
              boxShadow="2xl"
              borderWidth="1px"
              borderColor={borderColor}
              textAlign="center"
              w="full"
              maxW="lg" // Biraz daha geniş
            >
                <Icon as={FiAlertTriangle} boxSize={{base:"60px", md:"80px"}} color={headingColor} />
                <Heading as="h1" size={{base:"2xl", md:"3xl"}} color={headingColor} fontWeight="bold">
                    404
                </Heading>
                <Heading as="h2" size={{base:"lg", md:"xl"}} color={textColor} fontWeight="semibold">
                    Sayfa Bulunamadı
                </Heading>
                <Text fontSize={{base:"md", md:"lg"}} color={textColor} maxW="md">
                    Aradığınız sayfa mevcut değil, taşınmış veya hiç var olmamış olabilir.
                </Text>
                <Button
                  as={RouterLink}
                  to="/"
                  bg={headingColor} // Vurgu rengi
                  color={useColorModeValue("white", "gray.900")} // Kontrast metin rengi
                  _hover={{bg: useColorModeValue('brand.600', 'brand.400')}}
                  size="lg"
                  py={6} // Dikey padding
                  px={10} // Yatay padding
                  leftIcon={<Icon as={FaHome} />}
                  borderRadius="lg"
                  boxShadow="lg"
                  fontWeight="bold"
                  letterSpacing="wide"
                >
                    Ana Sayfaya Dön
                </Button>
            </VStack>
        </Flex>
    );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
      <Routes>
        <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to={isAuthenticated ? "/dashboard" : "/browse"} replace />} />
            <Route path="browse" element={ <ProtectedRoute> <TopicBrowserPage /> </ProtectedRoute> } />
            <Route path="admin" element={ <AdminRoute> <AdminPage /> </AdminRoute> } />
            <Route path="solve" element={ <ProtectedRoute> <SolvePage /> </ProtectedRoute> } />
            <Route path="lectures/topic/:topicId" element={ <ProtectedRoute> <LectureViewPage /> </ProtectedRoute> } />
            <Route path="dashboard" element={ <ProtectedRoute> <DashboardPage /> </ProtectedRoute> } />
            <Route path="my-stats" element={<Navigate to="/dashboard" replace />} /> {/* my-stats dashboard'a yönlendiriyor */}
            <Route path="wordle-game" element={ <ProtectedRoute> <WordPracticePage /> </ProtectedRoute> } />
            <Route path="profile" element={ <ProtectedRoute> <ProfilePage /> </ProtectedRoute> } />
            <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="digital-coach" element={ <ProtectedRoute> <DigitalCoachPage /> </ProtectedRoute> } />
            <Route path="srs-session" element={ <ProtectedRoute> <SRSReviewSessionPage /> </ProtectedRoute> } />
            {/* SRS Soru Tekrar Sayfası Layout içinde olmalı mı? Şimdilik dışında bırakıyorum, odaklanmış arayüz için. */}
            {/* Eğer Layout içinde olacaksa, aşağıdaki satırı yukarıdaki Route grubunun içine taşıyın. */}
            {/* <Route path="srs-question-review" element={ <ProtectedRoute> <SRSQuestionReviewPage /> </ProtectedRoute> } /> */}
            <Route path="*" element={<NotFoundPage />} />
        </Route>
        
        {/* Layout dışında kalan rotalar */}
        <Route path="srs-question-review" element={ <ProtectedRoute> <SRSQuestionReviewPage /> </ProtectedRoute> } />
        <Route path="/login" element={ <PublicRoute> <LoginPage /> </PublicRoute> } />
        <Route path="/register" element={ <PublicRoute> <RegisterPage /> </PublicRoute> } />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} /> {/* Bu public olmalı */}
        <Route path="/request-password-reset" element={ <PublicRoute> <RequestPasswordResetPage /> </PublicRoute> } />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} /> {/* Bu public olmalı */}
      </Routes>
  );
}

function App(){
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;
