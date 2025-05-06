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
  AlertDescription, // Açıklama için daha uygun
  Link as ChakraLink, // Chakra'nın Link'i RouterLink ile kullanılacak
  Spinner,          // Chakra'nın Spinner'ı (gerekirse)
  Icon,             // react-icons kullanımı için
  VStack,           // Dikey yığınlama için
  Text,             // Metin için
} from '@chakra-ui/react';
// İkonları import etmeye devam ediyoruz (FaExclamationTriangle AlertIcon içinde kullanılabilir)
import { FaSignInAlt } from 'react-icons/fa';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    // Context'ten gerekli fonksiyon ve state'leri al
    const { login, error, setError, loading, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Yönlendirme ve hata temizleme (aynı kalabilir)
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

    // PublicRoute içindeki loading indicator yeterli olabilir,
    // ama form bazında da gösterilebilir. Button'un isLoading prop'u daha iyi.

    return (
        // Eski .auth-page yerine Flex ile ortalama
        <Flex className="auth-page" minH="80vh" py={8} align="center" justify="center">
            {/* Eski .auth-form-container yerine Container */}
            <Container
                maxW="md" // Orta boyutta bir container
                py={8}
                px={6}
                bg="bgSecondary" // Temadan semantic token
                borderWidth="1px"
                borderColor="borderPrimary" // Temadan semantic token
                borderRadius="lg" // Temadan radius
                boxShadow="lg" // Temadan gölge
            >
                 {/* Eski h2 yerine Heading */}
                <Heading as="h2" size="xl" textAlign="center" mb={6}>
                    Giriş Yap
                </Heading>

                {/* Eski form yerine Box ve VStack */}
                <Box as="form" onSubmit={handleSubmit}>
                    <VStack spacing={5}> {/* Form elemanları arası boşluk */}
                        {/* Eski alert div yerine Chakra Alert */}
                        {error && (
                            <Alert status="error" borderRadius="md">
                                <AlertIcon />
                                <AlertDescription fontSize="sm">{error}</AlertDescription>
                                {/* Kapatma butonu eklenebilir: <CloseButton position="absolute" right="8px" top="8px" /> */}
                            </Alert>
                        )}

                        {/* Eski div.form-group yerine FormControl */}
                        <FormControl id="usernameLogin" isRequired isDisabled={loading}>
                            {/* Eski label yerine FormLabel */}
                            <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Kullanıcı Adı:</FormLabel>
                            {/* Eski input yerine Input */}
                            <Input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder='Kullanıcı adınızı girin'
                                // Chakra varsayılan stillerini kullanır, bg, border vb. temadan gelir
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
                            {/* Şifremi unuttum linki (opsiyonel) */}
                             {/*
                             <Flex justify="flex-end" mt={1}>
                                 <ChakraLink as={RouterLink} to="/forgot-password" fontSize="xs" color="accent">
                                     Şifremi Unuttum?
                                 </ChakraLink>
                             </Flex>
                             */}
                        </FormControl>

                        {/* Eski button yerine Chakra Button */}
                        <Button
                            type="submit"
                            colorScheme="brand" // Temadaki brand rengini kullanır
                            size="lg"          // Büyük buton
                            width="full"        // Tam genişlik
                            mt={6}              // Üstten boşluk (space.6)
                            isLoading={loading} // Yüklenme durumunu yönetir (içine spinner ekler)
                            leftIcon={<Icon as={FaSignInAlt} />} // react-icons kullanımı
                        >
                            Giriş Yap
                        </Button>
                    </VStack>
                </Box>

                {/* Eski p.auth-switch-link yerine Text ve ChakraLink */}
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