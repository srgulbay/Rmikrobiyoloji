import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  Spinner,
  useColorModeValue,
  Divider // Divider eklendi
} from '@chakra-ui/react';
import { FaSignInAlt, FaUser, FaLock, FaEye, FaEyeSlash, FaPaperPlane, FaKey } from 'react-icons/fa'; // FaKey eklendi
import { FiLogIn } from 'react-icons/fi'; // Daha modern bir giriş ikonu

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, error, setError, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendStatus, setResendStatus] = useState('');

  // Layout ile tutarlı stil değişkenleri
  const pageBg = useColorModeValue('gray.100', 'gray.900'); // Sayfa arkaplanı
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('brand.600', 'brand.300'); // Marka rengi başlık için
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const textMutedColor = useColorModeValue('gray.500', 'gray.400');
  const inputBg = useColorModeValue('white', 'gray.700');
  const inputFocusBorderColor = useColorModeValue('brand.500', 'brand.300');
  const buttonTextColor = useColorModeValue('white', 'gray.900');


  useEffect(() => {
    if (isAuthenticated) {
      navigate('/browse', { replace: true });
    }
    return () => {
        setError(null);
        setResendMessage('');
        setResendStatus('');
    }
  }, [isAuthenticated, navigate, setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResendMessage('');
    setResendStatus('');
    if (!username || !password) {
      setError({ message: "Lütfen kullanıcı adı ve şifreyi girin." });
      return;
    }
    await login(username, password);
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
    <Flex minH="100vh" align="center" justify="center" px={4} py={12} bg={pageBg}>
      <Container
        maxW="md"
        bg={cardBg}
        p={{ base: 6, sm: 8, md: 10 }} // Artırılmış padding
        borderRadius="xl" // Daha yuvarlak köşeler
        boxShadow="2xl" // Daha belirgin gölge
        borderWidth={1}
        borderColor={borderColor}
      >
        <VStack spacing={2} mb={8} textAlign="center">
            <Icon as={FiLogIn} boxSize={12} color={headingColor} />
            <Heading as="h1" size="xl" color={headingColor} fontWeight="bold">
            Platforma Giriş Yap
            </Heading>
            <Text color={textMutedColor} fontSize="md">
                Devam etmek için bilgilerinizi girin.
            </Text>
        </VStack>


        <Box as="form" onSubmit={handleSubmit}>
          <VStack spacing={5}>
            <ScaleFade initialScale={0.95} in={!!error || !!resendMessage} unmountOnExit style={{width: '100%'}}>
              {error && !error.needsVerification && (
                <Alert status="error" borderRadius="lg" width="full" variant="subtle" bg={useColorModeValue("red.50", "red.800")}>
                  <AlertIcon color="red.400"/>
                  <AlertDescription fontSize="sm" color={useColorModeValue("red.700", "red.100")}>{error.message}</AlertDescription>
                </Alert>
              )}
              {error && error.needsVerification && (
                <Alert status="warning" borderRadius="lg" width="full" variant="subtle" flexDirection="column" alignItems="flex-start" bg={useColorModeValue("yellow.50", "yellow.800")}>
                  <Flex w="full" alignItems="center">
                    <AlertIcon color="yellow.400"/>
                    <AlertDescription fontSize="sm" flex="1" color={useColorModeValue("yellow.700", "yellow.100")}>{error.message}</AlertDescription>
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
                 <Alert status={resendStatus === 'success' ? 'success' : 'error'} borderRadius="lg" width="full" variant="subtle" bg={resendStatus === 'success' ? useColorModeValue("green.50", "green.800") : useColorModeValue("red.50", "red.800")}>
                    <AlertIcon color={resendStatus === 'success' ? "green.400" : "red.400"}/>
                    <AlertDescription fontSize="sm" color={resendStatus === 'success' ? useColorModeValue("green.700", "green.100") : useColorModeValue("red.700", "red.100")}>{resendMessage}</AlertDescription>
                 </Alert>
              )}
            </ScaleFade>

            <FormControl id="usernameLogin" isRequired isDisabled={loading || isResending}>
              <FormLabel fontSize="sm" fontWeight="medium" color={textMutedColor}>Kullanıcı Adı</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaUser} color={useColorModeValue("gray.400", "gray.500")} />
                </InputLeftElement>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder='Kullanıcı adınız'
                  bg={inputBg}
                  borderColor={borderColor}
                  borderRadius="md"
                  _focus={{borderColor: inputFocusBorderColor, boxShadow: `0 0 0 1px ${inputFocusBorderColor}`}}
                  size="lg" // Daha büyük input
                />
              </InputGroup>
            </FormControl>

            <FormControl id="passwordLogin" isRequired isDisabled={loading || isResending}>
              <FormLabel fontSize="sm" fontWeight="medium" color={textMutedColor}>Şifre</FormLabel>
              <InputGroup size="lg"> {/* InputGroup size da lg */}
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaLock} color={useColorModeValue("gray.400", "gray.500")} />
                </InputLeftElement>
                <Input
                  pr="3.5rem" // InputRightElement için yer
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Şifreniz'
                  bg={inputBg}
                  borderColor={borderColor}
                  borderRadius="md"
                  _focus={{borderColor: inputFocusBorderColor, boxShadow: `0 0 0 1px ${inputFocusBorderColor}`}}
                />
                <InputRightElement width="3.5rem">
                  <IconButton
                    h="1.75rem" // Boyut ayarlandı
                    size="sm"
                    variant="ghost"
                    onClick={handlePasswordVisibility}
                    aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    icon={showPassword ? <Icon as={FaEyeSlash} boxSize={5}/> : <Icon as={FaEye} boxSize={5}/>}
                    color={textMutedColor}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <Button
              type="submit"
              bg={inputFocusBorderColor} // Marka rengi (inputFocusBorderColor accentColor ile aynı olmalı)
              color={buttonTextColor}
              _hover={{bg: useColorModeValue('brand.600', 'brand.400')}}
              _active={{bg: useColorModeValue('brand.700', 'brand.500')}}
              size="lg"
              width="full"
              mt={4} // Üst boşluk
              py={6} // Dikey padding
              isLoading={loading}
              isDisabled={isResending}
              loadingText="Giriş Yapılıyor..."
              spinnerPlacement="start"
              leftIcon={!loading ? <Icon as={FiLogIn} /> : undefined}
              borderRadius="lg" // Köşe yuvarlaklığı
              boxShadow="lg"
              fontWeight="bold"
              letterSpacing="wide"
            >
              GİRİŞ YAP
            </Button>
          </VStack>
        </Box>
        <Divider my={6} borderColor={borderColor} />
        <VStack spacing={3} textAlign="center">
            <Text fontSize="sm" color={textColor}>
            Hesabınız yok mu?{' '}
            <ChakraLink as={RouterLink} to="/register" fontWeight="semibold" color={inputFocusBorderColor} _hover={{textDecoration:"underline"}}>
                Hemen Kayıt Olun
            </ChakraLink>
            </Text>
            <Text fontSize="sm">
                <ChakraLink as={RouterLink} to="/request-password-reset" color={textMutedColor} _hover={{ color: inputFocusBorderColor, textDecoration:"underline" }} display="flex" alignItems="center" justifyContent="center">
                    <Icon as={FaKey} mr={1.5} /> Şifremi Unuttum
                </ChakraLink>
            </Text>
        </VStack>
      </Container>
    </Flex>
  );
}

export default LoginPage;
