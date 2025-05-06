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
  Button,
  Alert,
  AlertIcon,
  AlertDescription,
  Link as ChakraLink,
  Icon,
  VStack,
  Text,
  ScaleFade // Hata mesajı geçişi için eklendi
} from '@chakra-ui/react';
// İkon
import { FaSignInAlt } from 'react-icons/fa';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    // Context'ten gerekli fonksiyon ve state'leri al
    const { login, error, setError, loading, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Yönlendirme ve hata temizleme
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/browse', { replace: true });
        }
        return () => setError(null);
    }, [isAuthenticated, navigate, setError]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!username || !password) {
            setError("Lütfen kullanıcı adı ve şifreyi girin.");
            return;
        }
        await login(username, password);
    };

    return (
        // Sayfayı ortala
        <Flex className="auth-page" minH="80vh" py={8} align="center" justify="center">
            {/* Form container */}
            <Container
                maxW="md"
                py={8}
                px={6}
                bg="bgSecondary" // Temadan semantic token
                borderWidth="1px"
                borderColor="borderPrimary" // Temadan semantic token
                borderRadius="lg" // Temadan radius
                boxShadow="lg" // Temadan gölge
            >
                <Heading as="h2" size="xl" textAlign="center" mb={6}>
                    Giriş Yap
                </Heading>

                <Box as="form" onSubmit={handleSubmit}>
                    <VStack spacing={5}>
                        {/* Hata Mesajı (ScaleFade ile yumuşak geçiş) */}
                        <ScaleFade initialScale={0.9} in={!!error} unmountOnExit>
                           {/* unmountOnExit={true} error yokken DOM'dan kaldırır */}
                           {error && ( // Hata varsa render et
                             <Alert status="error" borderRadius="md" width="full">
                               <AlertIcon />
                               <AlertDescription fontSize="sm">{error}</AlertDescription>
                             </Alert>
                           )}
                        </ScaleFade>

                        <FormControl id="usernameLogin" isRequired isDisabled={loading}>
                            <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Kullanıcı Adı:</FormLabel>
                            <Input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder='Kullanıcı adınızı girin'
                                // Chakra stilleri temadan gelir
                            />
                        </FormControl>

                        <FormControl id="passwordLogin" isRequired isDisabled={loading}>
                            <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Şifre:</FormLabel>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder='Şifrenizi girin'
                            />
                        </FormControl>

                        {/* Butona loadingText eklendi */}
                        <Button
                            type="submit"
                            colorScheme="brand" // Tema'daki brand rengini kullanır
                            size="lg"          // Büyük buton
                            width="full"        // Tam genişlik
                            mt={6}              // Üstten boşluk (space.6)
                            isLoading={loading} // Yüklenme durumunu yönetir
                            loadingText="Giriş Yapılıyor..." // <-- Yüklenirken gösterilecek metin
                            // Yüklenirken ikonu gizleyebiliriz (isteğe bağlı)
                            leftIcon={!loading ? <Icon as={FaSignInAlt} /> : undefined}
                        >
                           Giriş Yap {/* isLoading=true ise bu metin görünmez, loadingText gösterilir */}
                        </Button>
                    </VStack>
                </Box>

                <Text textAlign="center" mt={6} fontSize="sm">
                    Hesabınız yok mu?{' '}
                    <ChakraLink as={RouterLink} to="/register" fontWeight="medium" color="accent">
                        Kayıt Olun
                    </ChakraLink>
                </Text>
            </Container>
        </Flex>
    );
}

export default LoginPage;