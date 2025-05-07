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
  // useColorModeValue kaldırıldı, semantic token'lar veya tema stilleri kullanılacak
  // Center kaldırıldı, Flex zaten ortalama yapıyor
} from '@chakra-ui/react';
import { FaSignInAlt, FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, error, setError, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Yönlendirme ve hata temizleme (Aynı kalır)
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/browse', { replace: true });
    }
    return () => setError(null);
  }, [isAuthenticated, navigate, setError]);

  const handleSubmit = async (e) => {
    // ... (Aynı kalır)
    e.preventDefault();
    setError(null);
    if (!username || !password) {
      setError("Lütfen kullanıcı adı ve şifreyi girin.");
      return;
    }
    await login(username, password);
  };

  const handlePasswordVisibility = () => setShowPassword(!showPassword);

  // KALDIRILDI: Tema renklerini al (artık tema/semantic token'lar kullanılacak)
  // const bgColor = useColorModeValue('gray.50', 'gray.900');
  // const cardBgColor = useColorModeValue('white', 'gray.800');
  // const inputBgColor = useColorModeValue('gray.100', 'gray.700');

  return (
    // Sayfayı tam ekran kaplayacak şekilde ortala
    <Flex
      minH="100vh"
      align="center"
      justify="content"
      // KALDIRILDI: bg={bgColor} - Bu artık styles.global'deki body'den gelmeli
      px={4}
    >
      {/* Container tema stillerini kullanacak */}
      <Container
        maxW="md"
        bg="bgPrimary" // Semantic Token kullanıldı
        p={{ base: 6, md: 8 }}
        borderRadius="xl" // Temadan radii.xl
        boxShadow="xl" // Temadan shadows.xl
        borderWidth={1}
        borderColor="borderPrimary" // Semantic Token kullanıldı
      >
        {/* Heading tema rengini (brand.500) ve boyutunu (xl) kullanır */}
        <Heading as="h1" size="xl" textAlign="center" mb={8} color="brand.500">
          Platforma Giriş Yap
        </Heading>

        <Box as="form" onSubmit={handleSubmit}>
          {/* VStack tema boşluklarını (spacing={5}) kullanır */}
          <VStack spacing={5}>
            {/* Alert tema stilini (subtle, error) kullanır */}
            <ScaleFade initialScale={0.9} in={!!error} unmountOnExit>
              {error && (
                <Alert status="error" borderRadius="md" width="full" variant="subtle">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">{error}</AlertDescription>
                </Alert>
              )}
            </ScaleFade>

            {/* Kullanıcı Adı Alanı */}
            <FormControl id="usernameLogin" isRequired isDisabled={loading}>
              {/* FormLabel tema stilini (sm, medium, textSecondary) kullanır */}
              <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Kullanıcı Adı</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaUser} color="gray.400" /> {/* İkon rengi şimdilik sabit */}
                </InputLeftElement>
                {/* Input tema stilini (varsayılan: outline, md) kullanır */}
                {/* KALDIRILDI: bg={inputBgColor} */}
                {/* KALDIRILDI: _placeholder={{ color: ... }} */}
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder='Kullanıcı adınız'
                />
              </InputGroup>
            </FormControl>

            {/* Şifre Alanı */}
            <FormControl id="passwordLogin" isRequired isDisabled={loading}>
              {/* FormLabel tema stilini kullanır */}
              <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Şifre</FormLabel>
              <InputGroup size="md"> {/* InputGroup boyutu Input ile uyumlu */}
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaLock} color="gray.400" /> {/* İkon rengi şimdilik sabit */}
                </InputLeftElement>
                {/* Input tema stilini kullanır */}
                {/* KALDIRILDI: bg={inputBgColor} */}
                {/* KALDIRILDI: _placeholder={{ color: ... }} */}
                <Input
                  pr="4.5rem"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Şifreniz'
                />
                <InputRightElement width="4.5rem">
                  {/* IconButton tema stilini (ghost, sm) kullanır */}
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
            {/* Button tema stilini (solid, lg, brand) ve hover/active efektlerini kullanır */}
            {/* KALDIRILDI: _hover={{ transform: ..., boxShadow: ... }} */}
            {/* KALDIRILDI: _active={{ transform: ... }} */}
            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              width="full"
              mt={4}
              isLoading={loading}
              loadingText="Giriş Yapılıyor..."
              spinnerPlacement="start"
              leftIcon={!loading ? <Icon as={FaSignInAlt} /> : undefined}
            >
              Giriş Yap
            </Button>
          </VStack>
        </Box>

        {/* Kayıt Sayfasına Link */}
        {/* Text tema stilini (sm) kullanır */}
        <Text textAlign="center" mt={8} fontSize="sm">
          Hesabınız yok mu?{' '}
          {/* ChakraLink tema stilini (varsayılan: inline, blue) kullanır */}
          {/* Özel renk ve hover korunuyor (varsayılan linkten farklı) */}
          {/* KALDIRILDI: _hover={{ textDecoration: 'underline' }} */}
          <ChakraLink as={RouterLink} to="/register" fontWeight="medium" color="brand.500">
            Hemen Kayıt Olun
          </ChakraLink>
        </Text>
      </Container>
    </Flex>
  );
}

export default LoginPage;