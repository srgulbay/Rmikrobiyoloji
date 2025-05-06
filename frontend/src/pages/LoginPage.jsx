// src/pages/LoginPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Flex,
  Container,
  Heading,
  FormControl,
  FormLabel,
  Input,
  InputGroup, // İkon eklemek için
  InputLeftElement, // Sol ikon için
  InputRightElement, // Sağ ikon (şifre göster/gizle) için
  Button,
  IconButton, // Şifre göster/gizle butonu için
  Alert,
  AlertIcon,
  AlertDescription,
  Link as ChakraLink,
  Icon,
  VStack, // Dikey yığınlama
  Text,
  ScaleFade,
  useColorModeValue, // Açık/Koyu moda göre renk seçimi için
  Center // Tam ortalama için
} from '@chakra-ui/react';
import { FaSignInAlt, FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'; // Gerekli ikonlar

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Şifre görünürlüğü state'i
  const { login, error, setError, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Yönlendirme ve hata temizleme (aynı kalabilir)
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/browse', { replace: true });
    }
    // Sayfadan ayrılırken hatayı temizle
    return () => setError(null);
  }, [isAuthenticated, navigate, setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!username || !password) {
      setError("Lütfen kullanıcı adı ve şifreyi girin.");
      return;
    }
    // login fonksiyonu AuthContext içinde setLoading(true/false) yapmalı
    await login(username, password);
  };

  const handlePasswordVisibility = () => setShowPassword(!showPassword);

  // Tema renklerini al (açık/koyu moda göre değişen)
  const bgColor = useColorModeValue('gray.50', 'gray.900'); // Ana arka plan
  const cardBgColor = useColorModeValue('white', 'gray.800'); // Kart arka planı
  const inputBgColor = useColorModeValue('gray.100', 'gray.700'); // Input arka planı

  console.log('Login Page Loading State:', loading); // <-- BU SATIRI EKLEYİN

  return (
    // Sayfayı tam ekran kaplayacak şekilde ortala
    <Flex
      minH="100vh" // Tam yükseklik
      align="center"
      justify="center"
      bg={bgColor} // Açık/Koyu moda uygun arka plan
      px={4} // Kenar boşlukları
    >
      {/* Eski .auth-form-container yerine daha belirgin Container veya Box */}
      <Container
        maxW="md"
        bg={cardBgColor}
        p={{ base: 6, md: 8 }} // İç boşluk (responsive)
        borderRadius="xl" // Daha yuvarlak köşeler
        boxShadow="xl" // Daha belirgin gölge
        borderWidth={1}
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <Heading as="h1" size="xl" textAlign="center" mb={8} color="brand.500">
          Platforma Giriş Yap
        </Heading>

        <Box as="form" onSubmit={handleSubmit}>
          <VStack spacing={5}>
            {/* Hata Mesajı */}
            <ScaleFade initialScale={0.9} in={!!error} unmountOnExit>
              {error && (
                <Alert status="error" borderRadius="md" width="full" variant="subtle">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">{error}</AlertDescription>
                </Alert>
              )}
            </ScaleFade>

            {/* Kullanıcı Adı Alanı (İkonlu) */}
            <FormControl id="usernameLogin" isRequired isDisabled={loading}>
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
                  bg={inputBgColor} // Farklı input arka planı
                  _placeholder={{ color: useColorModeValue('gray.500', 'gray.400') }}
                />
              </InputGroup>
            </FormControl>

            {/* Şifre Alanı (İkonlu ve Göster/Gizle Butonlu) */}
            <FormControl id="passwordLogin" isRequired isDisabled={loading}>
              <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Şifre</FormLabel>
              <InputGroup size="md">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaLock} color="gray.400" />
                </InputLeftElement>
                <Input
                  pr="4.5rem" // Sağdaki buton için yer aç
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Şifreniz'
                  bg={inputBgColor}
                  _placeholder={{ color: useColorModeValue('gray.500', 'gray.400') }}
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

            {/* Giriş Butonu */}
            <Button
              type="submit"
              colorScheme="brand" // Temadaki ana renk
              size="lg"
              width="full"
              mt={4} // VStack spacing'den sonra ek boşluk
              isLoading={loading}
              loadingText="Giriş Yapılıyor..." // Yüklenirken gösterilecek metin
              spinnerPlacement="start" // Spinner başta görünsün
              leftIcon={!loading ? <Icon as={FaSignInAlt} /> : undefined} // İkon
              _hover={{ transform: 'scale(1.02)', boxShadow: 'md' }} // Hover efekti
              _active={{ transform: 'scale(0.98)' }} // Tıklama efekti
            >
              Giriş Yap
            </Button>
          </VStack>
        </Box>

        {/* Kayıt Sayfasına Link */}
        <Text textAlign="center" mt={8} fontSize="sm">
          Hesabınız yok mu?{' '}
          <ChakraLink as={RouterLink} to="/register" fontWeight="medium" color="brand.500" _hover={{ textDecoration: 'underline' }}>
            Hemen Kayıt Olun
          </ChakraLink>
        </Text>
      </Container>
    </Flex>
  );
}

export default LoginPage;