import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Flex,
  Container,
  Heading,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement, // Eksik import eklendi
  InputRightElement,
  Button,
  IconButton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  VStack,
  Text,
  Icon,
  ScaleFade,
  Progress,
  FormErrorMessage
} from '@chakra-ui/react';
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const calculatePasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 6) strength += 25;
  if (password.length >= 8) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[a-z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[^A-Za-z0-9]/.test(password)) strength += 15;
  return Math.min(100, strength);
};

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Geçersiz veya eksik şifre sıfırlama tokenı.");
      setResetSuccess(false);
    }
  }, [token]);

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(calculatePasswordStrength(newPassword));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    if (!password || !confirmPassword) {
      setError('Lütfen yeni şifrenizi girin ve onaylayın.');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Girilen şifreler eşleşmiyor!');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalıdır.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/reset-password/${token}`, { password });
      setMessage(response.data.message || 'Şifreniz başarıyla sıfırlandı!');
      setResetSuccess(true);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Şifre sıfırlama sırasında bir hata oluştu.');
      setResetSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordVisibility = () => setShowPassword(!showPassword);
  const handleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const isPasswordMismatch = password !== confirmPassword && confirmPassword !== '';

  const strengthColor = useMemo(() => {
    if (passwordStrength < 40) return 'red';
    if (passwordStrength < 70) return 'orange';
    return 'green';
  }, [passwordStrength]);

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
        <Heading as="h1" size="lg" textAlign="center" mb={8} color="brand.500">
          Yeni Şifre Belirle
        </Heading>

        {resetSuccess ? (
          <Alert status="success" borderRadius="md" flexDirection="column" alignItems="center" textAlign="center" py={6}>
            <AlertIcon as={FaCheckCircle} boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={2} fontSize="lg">Şifre Sıfırlandı!</AlertTitle>
            <AlertDescription maxWidth="sm" mb={6}>{message}</AlertDescription>
            <Button as={RouterLink} to="/login" colorScheme="brand">
              Giriş Yap Sayfasına Git
            </Button>
          </Alert>
        ) : (
          <Box as="form" onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <ScaleFade initialScale={0.9} in={!!error} unmountOnExit>
                {error && (
                  <Alert status="error" borderRadius="md" width="full" variant="subtle">
                    <AlertIcon />
                    <AlertDescription fontSize="sm">{error}</AlertDescription>
                  </Alert>
                )}
              </ScaleFade>
               <ScaleFade initialScale={0.9} in={!!message && !error && !resetSuccess} unmountOnExit>
                  {message && !error && !resetSuccess && (
                    <Alert status="info" borderRadius="md" width="full" variant="subtle">
                        <AlertIcon />
                        <AlertDescription fontSize="sm">{message}</AlertDescription>
                    </Alert>
                  )}
              </ScaleFade>


              <FormControl id="passwordReset" isRequired isDisabled={loading} isInvalid={isPasswordMismatch || (!!error && typeof error === 'string' && error.toLowerCase().includes('şifre'))}>
                <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Yeni Şifre</FormLabel>
                <InputGroup size="md">
                  <InputLeftElement pointerEvents="none">
                      <Icon as={FaLock} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    pr="4.5rem"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder='En az 6 karakter'
                  />
                  <InputRightElement width="4.5rem">
                    <IconButton
                      h="1.75rem" size="sm" variant="ghost"
                      onClick={handlePasswordVisibility}
                      aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                      icon={showPassword ? <Icon as={FaEyeSlash} /> : <Icon as={FaEye} />}
                    />
                  </InputRightElement>
                </InputGroup>
                {password.length > 0 && (
                  <Progress colorScheme={strengthColor} size="xs" value={passwordStrength} mt={2} borderRadius="sm" />
                )}
                {error && typeof error === 'string' && error.toLowerCase().includes('6 karakter') && <FormErrorMessage fontSize="xs">{error}</FormErrorMessage>}
              </FormControl>

              <FormControl id="confirmPasswordReset" isRequired isDisabled={loading} isInvalid={isPasswordMismatch}>
                <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Yeni Şifre Tekrar</FormLabel>
                <InputGroup size="md">
                  <InputLeftElement pointerEvents="none">
                      <Icon as={FaLock} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    pr="4.5rem"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder='Yeni şifrenizi tekrar girin'
                  />
                  <InputRightElement width="4.5rem">
                    <IconButton
                      h="1.75rem" size="sm" variant="ghost"
                      onClick={handleConfirmPasswordVisibility}
                      aria-label={showConfirmPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                      icon={showConfirmPassword ? <Icon as={FaEyeSlash} /> : <Icon as={FaEye} />}
                    />
                  </InputRightElement>
                </InputGroup>
                {isPasswordMismatch && (
                  <FormErrorMessage fontSize="xs">Girilen şifreler eşleşmiyor!</FormErrorMessage>
                )}
              </FormControl>

              <Button
                type="submit"
                colorScheme="brand"
                size="lg"
                width="full"
                mt={4}
                isLoading={loading}
                loadingText="Şifre Sıfırlanıyor..."
              >
                Şifreyi Güncelle
              </Button>
            </VStack>
          </Box>
        )}
      </Container>
    </Flex>
  );
}

export default ResetPasswordPage;