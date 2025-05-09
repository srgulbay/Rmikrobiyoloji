import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios'; // axios import edildi
import {
  Box,
  Flex,
  Container,
  Heading,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Button,
  IconButton,
  Alert,
  AlertIcon,
  AlertDescription,
  Link as ChakraLink,
  Icon,
  VStack,
  Text,
  ScaleFade,
  Spinner // Yeniden gönderme sırasında buton için
} from '@chakra-ui/react';
import { FaSignInAlt, FaUser, FaLock, FaEye, FaEyeSlash, FaPaperPlane } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // AuthContext'ten error, setError, loading, isAuthenticated ve login'i al
  const { login, error, setError, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Yeniden gönderme için state'ler
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendStatus, setResendStatus] = useState(''); // 'success' or 'error'

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/browse', { replace: true });
    }
    return () => {
        setError(null); // Sayfadan ayrılırken AuthContext'teki hatayı temizle
        setResendMessage(''); // Yerel mesajı da temizle
        setResendStatus('');
    }
  }, [isAuthenticated, navigate, setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResendMessage('');
    setResendStatus('');
    if (!username || !password) {
      setError({ message: "Lütfen kullanıcı adı ve şifreyi girin." }); // Hata objesi olarak set et
      return;
    }
    await login(username, password); // login fonksiyonu AuthContext'ten geliyor ve error'u set ediyor
  };

  const handlePasswordVisibility = () => setShowPassword(!showPassword);

  const handleResendVerificationEmail = async () => {
    if (!error || !error.email) {
        setResendMessage('E-posta adresi bulunamadı.');
        setResendStatus('error');
        return;
    }
    setIsResending(true);
    setResendMessage('');
    setResendStatus('');
    try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/resend-verification-email`, { email: error.email });
        setResendMessage(response.data.message || 'Yeni bir doğrulama e-postası gönderildi.');
        setResendStatus('success');
    } catch (err) {
        setResendMessage(err.response?.data?.message || 'E-posta gönderilirken bir hata oluştu.');
        setResendStatus('error');
    } finally {
        setIsResending(false);
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" px={4} py={12}>
      <Container
        maxW="md"
        bg="bgPrimary"
        p={{ base: 6, md: 8 }}
        borderRadius="xl"
        boxShadow="xl"
        borderWidth={1}
        borderColor="borderPrimary"
      >
        <Heading as="h1" size="xl" textAlign="center" mb={8} color="brand.500">
          Platforma Giriş Yap
        </Heading>

        <Box as="form" onSubmit={handleSubmit}>
          <VStack spacing={5}>
            <ScaleFade initialScale={0.9} in={!!error || !!resendMessage} unmountOnExit>
              {error && !error.needsVerification && (
                <Alert status="error" borderRadius="md" width="full" variant="subtle">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">{error.message}</AlertDescription>
                </Alert>
              )}
              {error && error.needsVerification && (
                <Alert status="warning" borderRadius="md" width="full" variant="subtle" flexDirection="column" alignItems="flex-start">
                  <Flex w="full">
                    <AlertIcon />
                    <AlertDescription fontSize="sm" flex="1">{error.message}</AlertDescription>
                  </Flex>
                  <Button
                    mt={3}
                    size="sm"
                    variant="link"
                    colorScheme="blue"
                    onClick={handleResendVerificationEmail}
                    isLoading={isResending}
                    loadingText="Gönderiliyor..."
                    leftIcon={<Icon as={FaPaperPlane} />}
                  >
                    Doğrulama E-postasını Yeniden Gönder
                  </Button>
                </Alert>
              )}
              {resendMessage && resendStatus && !error?.needsVerification && (
                 <Alert status={resendStatus === 'success' ? 'success' : 'error'} borderRadius="md" width="full" variant="subtle">
                    <AlertIcon />
                    <AlertDescription fontSize="sm">{resendMessage}</AlertDescription>
                 </Alert>
              )}
            </ScaleFade>

            <FormControl id="usernameLogin" isRequired isDisabled={loading || isResending}>
              <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Kullanıcı Adı</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaUser} color="gray.400" />
                </InputLeftElement>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder='Kullanıcı adınız'
                />
              </InputGroup>
            </FormControl>

            <FormControl id="passwordLogin" isRequired isDisabled={loading || isResending}>
              <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Şifre</FormLabel>
              <InputGroup size="md">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaLock} color="gray.400" />
                </InputLeftElement>
                <Input
                  pr="4.5rem"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Şifreniz'
                />
                <InputRightElement width="4.5rem">
                  <IconButton
                    h="1.75rem"
                    size="sm"
                    variant="ghost"
                    onClick={handlePasswordVisibility}
                    aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    icon={showPassword ? <Icon as={FaEyeSlash} /> : <Icon as={FaEye} />}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              width="full"
              mt={4}
              isLoading={loading}
              isDisabled={isResending}
              loadingText="Giriş Yapılıyor..."
              spinnerPlacement="start"
              leftIcon={!loading ? <Icon as={FaSignInAlt} /> : undefined}
            >
              Giriş Yap
            </Button>
          </VStack>
        </Box>

        <Text textAlign="center" mt={8} fontSize="sm">
          Hesabınız yok mu?{' '}
          <ChakraLink as={RouterLink} to="/register" fontWeight="medium" color="brand.500">
            Hemen Kayıt Olun
          </ChakraLink>
        </Text>
        {/* Şifremi Unuttum linki buraya eklenebilir */}
         <Text textAlign="center" mt={4} fontSize="xs">
             <ChakraLink as={RouterLink} to="/request-password-reset" color="textMuted" _hover={{ color: "brand.500" }}>
                 Şifremi Unuttum
             </ChakraLink>
         </Text>
      </Container>
    </Flex>
  );
}

export default LoginPage;