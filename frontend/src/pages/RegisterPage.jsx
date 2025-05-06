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
  Select, // Select bileşeni eklendi
  Icon,
  VStack,
  Text,
  FormErrorMessage // Hata mesajı için
} from '@chakra-ui/react';
// İkonlar
import { FaUserPlus } from 'react-icons/fa'; // FaExclamationTriangle AlertIcon tarafından sağlanır

// Uzmanlık Alanları (bileşen içinde veya dışarıda tanımlanabilir)
const specializations = [
    "YDUS", "TUS", "DUS", "Tıp Fakültesi Dersleri", "Diş Hekimliği Fakültesi Dersleri", "Diğer"
];

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [specialization, setSpecialization] = useState('');
    // Context'ten gerekli fonksiyon ve state'leri al
    const { register, error, setError, loading, isAuthenticated } = useAuth();
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

        if (password !== confirmPassword) {
            setError('Girilen şifreler eşleşmiyor!');
            return;
        }
        if (!username || !password) {
            setError('Kullanıcı adı ve şifre alanları zorunludur.');
            return;
        }
        if (password.length < 6) {
             setError('Şifre en az 6 karakter olmalıdır.');
             return;
        }

        const specToSend = specialization.trim() === '' ? null : specialization;
        await register(username, password, specToSend);
    };

    // Şifre eşleşmeme durumunu kontrol etmek için state
    const isPasswordMismatch = password !== confirmPassword && confirmPassword !== '';

    return (
        // Sayfayı ortala
        <Flex className="auth-page" minH="80vh" py={8} align="center" justify="center">
            {/* Form container */}
            <Container
                maxW="md"
                py={8}
                px={6}
                bg="bgSecondary"
                borderWidth="1px"
                borderColor="borderPrimary"
                borderRadius="lg"
                boxShadow="lg"
            >
                <Heading as="h2" size="xl" textAlign="center" mb={6}>
                    Kayıt Ol
                </Heading>

                <Box as="form" onSubmit={handleSubmit}>
                    <VStack spacing={4}> {/* Boşluğu 4'e düşürdük */}
                        {error && (
                            <Alert status="error" borderRadius="md">
                                <AlertIcon />
                                <AlertDescription fontSize="sm">{error}</AlertDescription>
                            </Alert>
                        )}

                        <FormControl id="usernameReg" isRequired isDisabled={loading} isInvalid={!!error && error.toLowerCase().includes('kullanıcı adı')}>
                            <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Kullanıcı Adı:</FormLabel>
                            <Input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder='Bir kullanıcı adı belirleyin'
                            />
                            {/* İsteğe bağlı: Spesifik alan hatası */}
                            {/* {error && error.toLowerCase().includes('kullanıcı adı') && <FormErrorMessage fontSize="xs">{error}</FormErrorMessage>} */}
                        </FormControl>

                        <FormControl id="passwordReg" isRequired isDisabled={loading} isInvalid={!!error && error.toLowerCase().includes('şifre')}>
                            <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Şifre:</FormLabel>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder='En az 6 karakter'
                            />
                             {/* İsteğe bağlı: Şifre uzunluğu hatası */}
                             {error && error.toLowerCase().includes('şifre') && !error.toLowerCase().includes('eşleşmiyor') && <FormErrorMessage fontSize="xs">{error}</FormErrorMessage>}
                        </FormControl>

                        <FormControl id="confirmPasswordReg" isRequired isDisabled={loading} isInvalid={isPasswordMismatch}>
                            <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Şifre Tekrar:</FormLabel>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder='Şifrenizi tekrar girin'
                            />
                            {/* Şifre eşleşme hatası için FormErrorMessage */}
                            {isPasswordMismatch && (
                                <FormErrorMessage fontSize="xs">Girilen şifreler eşleşmiyor!</FormErrorMessage>
                            )}
                        </FormControl>

                        <FormControl id="specialization" isDisabled={loading}>
                             <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Uzmanlık Alanı (İsteğe Bağlı):</FormLabel>
                             {/* Eski select yerine Chakra Select */}
                             <Select
                                placeholder="-- Alan Seçiniz --"
                                value={specialization}
                                onChange={(e) => setSpecialization(e.target.value)}
                                // Stil temadan gelir
                             >
                                {specializations.map(spec => (
                                    <option key={spec} value={spec}>{spec}</option>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            type="submit"
                            colorScheme="brand"
                            size="lg"
                            width="full"
                            mt={4} // Boşluğu VStack yönettiği için biraz azalttık
                            isLoading={loading}
                            leftIcon={<Icon as={FaUserPlus} />}
                        >
                            Kayıt Ol
                        </Button>
                    </VStack>
                </Box>

                <Text textAlign="center" mt={6} fontSize="sm">
                    Zaten hesabınız var mı?{' '}
                    <ChakraLink as={RouterLink} to="/login" fontWeight="medium" color="accent">
                        Giriş Yapın
                    </ChakraLink>
                </Text>
            </Container>
        </Flex>
    );
}

export default RegisterPage;