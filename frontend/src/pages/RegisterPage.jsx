// src/pages/RegisterPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
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
  Select,
  Icon,
  VStack,
  Text,
  FormErrorMessage,
  ScaleFade,
  Progress, // Şifre gücü için
  useColorModeValue,
  Center
} from '@chakra-ui/react';
// İkonlar
import { FaUserPlus, FaUser, FaLock, FaEye, FaEyeSlash, FaGraduationCap } from 'react-icons/fa';

// Uzmanlık Alanları
const specializations = [
    "YDUS", "TUS", "DUS", "Tıp Fakültesi Dersleri", "Diş Hekimliği Fakültesi Dersleri", "Diğer"
];

// Basit şifre gücü hesaplama (örnek)
const calculatePasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 6) strength += 25;
  if (password.length >= 8) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15; // Büyük harf
  if (/[a-z]/.test(password)) strength += 15; // Küçük harf
  if (/[0-9]/.test(password)) strength += 15; // Rakam
  if (/[^A-Za-z0-9]/.test(password)) strength += 15; // Özel karakter
  return Math.min(100, strength); // Max 100
};

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const { register, error, setError, loading, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/browse', { replace: true });
        }
        return () => setError(null);
    }, [isAuthenticated, navigate, setError]);

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setPasswordStrength(calculatePasswordStrength(newPassword));
    };

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

    const handlePasswordVisibility = () => setShowPassword(!showPassword);
    const handleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

    const isPasswordMismatch = password !== confirmPassword && confirmPassword !== '';

    // Tema renkleri
    const bgColor = useColorModeValue('gray.50', 'gray.900');
    const cardBgColor = useColorModeValue('white', 'gray.800');
    const inputBgColor = useColorModeValue('white', 'gray.700'); // Input için farklı arka plan

    // Şifre gücü rengi
    const strengthColor = useMemo(() => {
        if (passwordStrength < 40) return 'red';
        if (passwordStrength < 70) return 'orange';
        return 'green';
    }, [passwordStrength]);

    return (
        // Sayfayı ortala
        <Flex minH="100vh" align="center" justify="center" bg={bgColor} px={4} py={12}>
             {/* Form container */}
            <Container
                maxW="md"
                bg={cardBgColor}
                p={{ base: 6, md: 8 }}
                borderRadius="xl"
                boxShadow="xl"
                borderWidth={1}
                borderColor={useColorModeValue('gray.200', 'gray.700')}
            >
                <Heading as="h1" size="xl" textAlign="center" mb={8} color="brand.500">
                    Yeni Hesap Oluştur
                </Heading>

                <Box as="form" onSubmit={handleSubmit}>
                    <VStack spacing={4}> {/* Spacing biraz azaltıldı */}
                        {/* Hata Mesajı */}
                        <ScaleFade initialScale={0.9} in={!!error} unmountOnExit>
                           {error && (
                             <Alert status="error" borderRadius="md" width="full" variant="subtle">
                               <AlertIcon />
                               <AlertDescription fontSize="sm">{error}</AlertDescription>
                             </Alert>
                           )}
                        </ScaleFade>

                        <FormControl id="usernameReg" isRequired isDisabled={loading}>
                            <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Kullanıcı Adı</FormLabel>
                            <InputGroup>
                                <InputLeftElement pointerEvents="none">
                                    <Icon as={FaUser} color="gray.400" />
                                </InputLeftElement>
                                <Input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder='Kullanıcı adınızı belirleyin'
                                    bg={inputBgColor}
                                    _placeholder={{ color: useColorModeValue('gray.500', 'gray.400') }}
                                />
                            </InputGroup>
                        </FormControl>

                        <FormControl id="passwordReg" isRequired isDisabled={loading} isInvalid={isPasswordMismatch || (!!error && error.toLowerCase().includes('şifre'))}>
                            <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Şifre</FormLabel>
                            <InputGroup size="md">
                                <InputLeftElement pointerEvents="none">
                                    <Icon as={FaLock} color="gray.400" />
                                </InputLeftElement>
                                <Input
                                    pr="4.5rem"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={handlePasswordChange} // Şifre gücü için özel handler
                                    placeholder='En az 6 karakter'
                                    bg={inputBgColor}
                                    _placeholder={{ color: useColorModeValue('gray.500', 'gray.400') }}
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
                            {/* Şifre Gücü Göstergesi */}
                            {password.length > 0 && (
                                <Progress colorScheme={strengthColor} size="xs" value={passwordStrength} mt={2} borderRadius="sm" />
                            )}
                            {/* Şifre uzunluğu hatası */}
                             {error && error.toLowerCase().includes('6 karakter') && <FormErrorMessage fontSize="xs">{error}</FormErrorMessage>}
                        </FormControl>

                        <FormControl id="confirmPasswordReg" isRequired isDisabled={loading} isInvalid={isPasswordMismatch}>
                            <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Şifre Tekrar</FormLabel>
                            <InputGroup size="md">
                                 <InputLeftElement pointerEvents="none">
                                    <Icon as={FaLock} color="gray.400" />
                                 </InputLeftElement>
                                <Input
                                    pr="4.5rem"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder='Şifrenizi tekrar girin'
                                    bg={inputBgColor}
                                    _placeholder={{ color: useColorModeValue('gray.500', 'gray.400') }}
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
                             {/* Şifre eşleşme hatası */}
                            {isPasswordMismatch && (
                                <FormErrorMessage fontSize="xs">Girilen şifreler eşleşmiyor!</FormErrorMessage>
                            )}
                        </FormControl>

                        <FormControl id="specialization" isDisabled={loading}>
                             <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Uzmanlık Alanı (İsteğe Bağlı)</FormLabel>
                             <InputGroup>
                                 <InputLeftElement pointerEvents='none'>
                                     <Icon as={FaGraduationCap} color='gray.400' />
                                 </InputLeftElement>
                                 <Select
                                    placeholder="-- Alan Seçiniz --"
                                    value={specialization}
                                    onChange={(e) => setSpecialization(e.target.value)}
                                    bg={inputBgColor}
                                    // İkonla hizalamak için paddingLeft gerekebilir
                                    // pl="2.5rem" // InputLeftElement genişliğine göre ayarlayın
                                >
                                    {specializations.map(spec => (
                                        <option key={spec} value={spec}>{spec}</option>
                                    ))}
                                </Select>
                            </InputGroup>
                        </FormControl>

                        <Button
                            type="submit"
                            colorScheme="brand"
                            size="lg"
                            width="full"
                            mt={4}
                            isLoading={loading}
                            loadingText="Kayıt Olunuyor..."
                            spinnerPlacement="start"
                            leftIcon={!loading ? <Icon as={FaUserPlus} /> : undefined}
                            _hover={{ transform: 'scale(1.02)', boxShadow: 'md' }}
                            _active={{ transform: 'scale(0.98)' }}
                        >
                            Kayıt Ol
                        </Button>
                    </VStack>
                </Box>

                <Text textAlign="center" mt={8} fontSize="sm">
                    Zaten hesabınız var mı?{' '}
                    <ChakraLink as={RouterLink} to="/login" fontWeight="medium" color="brand.500" _hover={{ textDecoration: 'underline' }}>
                        Giriş Yapın
                    </ChakraLink>
                </Text>
            </Container>
        </Flex>
    );
}

export default RegisterPage;