import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spinner, Flex } from '@chakra-ui/react';

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
import ResetPasswordPage from './pages/ResetPasswordPage'; // Yeni sayfa import edildi

import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';

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
    const { isAuthenticated, authLoading } = useAuth();
    if (authLoading) return <LoadingIndicator />;
    if (!isAuthenticated) { return <Navigate to="/login" replace />; }
    return children;
}

function AdminRoute({ children }) {
    const { isAuthenticated, user, authLoading } = useAuth();
    if (authLoading) return <LoadingIndicator />;
    if (!isAuthenticated || user?.role !== 'admin') { return <Navigate to="/browse" replace />; }
    return children;
}

function PublicRoute({ children }) {
    const { isAuthenticated, authLoading } = useAuth();
    if (authLoading) return <LoadingIndicator />;
    if (isAuthenticated) { return <Navigate to="/browse" replace />; }
    return children;
}

function App() {
  return (
      <Routes>
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
                element={ <ProtectedRoute> <DashboardPage /> </ProtectedRoute> }
            />
             <Route
               path="/wordle-game"
               element={ <ProtectedRoute> <WordPracticePage /> </ProtectedRoute> }
             />
              <Route
                path="/dashboard"
                element={ <ProtectedRoute> <DashboardPage /> </ProtectedRoute> }
              />
            <Route path="/" element={<Navigate to="/browse" replace />} />
        </Route>

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
            element={<VerifyEmailPage />}
        />
        <Route
            path="/request-password-reset"
            element={ <PublicRoute> <RequestPasswordResetPage /> </PublicRoute> }
        />
        {/* YENİ ROUTE: Şifre sıfırlama sayfası */}
        <Route
            path="/reset-password/:token"
            element={<ResetPasswordPage />} // PublicRoute'a sarmaya gerek yok, token kontrolü içeride
        />

        <Route path="*" element={<Navigate to="/browse" replace />} />
      </Routes>
  );
}

export default App;