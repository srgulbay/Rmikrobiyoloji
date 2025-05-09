import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Spinner,
  Center,
  Text,
  Heading,
  VStack
} from '@chakra-ui/react';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function VerifyEmailPage() {
  const { token } = useParams(); // URL'den token'ı al
  const [verificationStatus, setVerificationStatus] = useState('pending'); // 'pending', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      const verifyUserEmail = async () => {
        setVerificationStatus('pending');
        try {
          const response = await axios.get(`${API_BASE_URL}/api/auth/verify-email/${token}`);
          setMessage(response.data.message || 'E-posta başarıyla doğrulandı!');
          setVerificationStatus('success');
        } catch (err) {
          setMessage(err.response?.data?.message || 'Doğrulama sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin veya yeni bir doğrulama linki isteyin.');
          setVerificationStatus('error');
        }
      };
      verifyUserEmail();
    } else {
      setMessage('Geçersiz doğrulama linki. Token bulunamadı.');
      setVerificationStatus('error');
    }
  }, [token]);

  if (verificationStatus === 'pending') {
    return (
      <Container centerContent py={20}>
        <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="brand.500" size="xl" />
        <Text mt={4} color="textSecondary">E-posta adresiniz doğrulanıyor...</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={10}>
      <Center>
        <VStack spacing={6} textAlign="center">
          {verificationStatus === 'success' && (
            <Alert
              status="success"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={10}
              borderRadius="lg"
            >
              <AlertIcon as={FaCheckCircle} boxSize="40px" mr={0} />
              <AlertTitle mt={4} mb={1} fontSize="xl">Doğrulama Başarılı!</AlertTitle>
              <AlertDescription maxWidth="sm" mb={6}>{message}</AlertDescription>
              <Button as={RouterLink} to="/login" colorScheme="brand">
                Giriş Yap
              </Button>
            </Alert>
          )}
          {verificationStatus === 'error' && (
            <Alert
              status="error"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={10}
              borderRadius="lg"
            >
              <AlertIcon as={FaExclamationTriangle} boxSize="40px" mr={0} />
              <AlertTitle mt={4} mb={1} fontSize="xl">Doğrulama Başarısız!</AlertTitle>
              <AlertDescription maxWidth="sm" mb={6}>{message}</AlertDescription>
              {/* Kullanıcıya 'Yeniden Gönder' seçeneği sunulabilir */}
              <Button as={RouterLink} to="/login" colorScheme="gray" variant="outline" mr={3}>
                Giriş Yapmayı Dene
              </Button>
              {/* <Button as={RouterLink} to="/resend-verification" colorScheme="blue">
                Yeniden Doğrulama Linki Gönder
              </Button> */}
            </Alert>
          )}
        </VStack>
      </Center>
    </Container>
  );
}

export default VerifyEmailPage;