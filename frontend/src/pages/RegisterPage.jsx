import React, { useState, useEffect, useMemo } from 'react';
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
  AlertTitle,
  AlertDescription,
  Link as ChakraLink,
  Select,
  Icon,
  VStack,
  Text,
  FormErrorMessage,
  ScaleFade,
  Progress,
  Spinner, // Sınıflandırma yüklenirken
} from '@chakra-ui/react';
import { FaUserPlus, FaUser, FaLock, FaEye, FaEyeSlash, FaGraduationCap, FaEnvelope, FaTasks } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const specializations = [
    "YDUS", "TUS", "DUS", "Tıp Fakültesi Dersleri", "Diş Hekimliği Fakültesi Dersleri", "Diğer"
];

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

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [defaultClassificationId, setDefaultClassificationId] = useState(''); // Yeni state
    const [examClassifications, setExamClassifications] = useState([]); // Sınav sınıflandırmaları için
    const [loadingClassifications, setLoadingClassifications] = useState(true);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [registrationMessage, setRegistrationMessage] = useState('');

    const { register, error, setError, loading, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/browse', { replace: true });
        }
        return () => {
            setError(null);
            setRegistrationMessage('');
        }
    }, [isAuthenticated, navigate, setError]);

    // Sınav Sınıflandırmalarını Çek
    useEffect(() => {
        const fetchClassifications = async () => {
            setLoadingClassifications(true);
            try {
                // Bu endpoint'in public olması veya token gerektirmemesi gerekebilir.
                // Şimdilik token olmadan deniyoruz, gerekirse AuthContext'ten token alınabilir veya endpoint public yapılabilir.
                const response = await axios.get(`${API_BASE_URL}/api/exam-classifications`);
                setExamClassifications(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                console.error("Sınav sınıflandırmaları çekilirken hata:", err);
                setError({ message: "Sınav türleri yüklenemedi. Lütfen daha sonra tekrar deneyin." });
            } finally {
                setLoadingClassifications(false);
            }
        };
        fetchClassifications();
    }, []);


    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setPasswordStrength(calculatePasswordStrength(newPassword));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setRegistrationMessage('');

        if (!username || !email || !password || !defaultClassificationId) { // defaultClassificationId kontrolü eklendi
            setError({ message: 'Kullanıcı adı, e-posta, şifre ve hedef sınav türü alanları zorunludur.' });
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError({ message: 'Lütfen geçerli bir e-posta adresi girin.' });
            return;
        }
        if (password !== confirmPassword) {
            setError({ message: 'Girilen şifreler eşleşmiyor!' });
            return;
        }
        if (password.length < 6) {
             setError({ message: 'Şifre en az 6 karakter olmalıdır.' });
             return;
        }

        const specToSend = specialization.trim() === '' ? null : specialization;
        // AuthContext'teki register fonksiyonuna defaultClassificationId parametresini gönder
        const result = await register(username, email, password, specToSend, defaultClassificationId);

        if (result && result.success && result.message) {
            setRegistrationMessage(result.message);
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
                <Heading as="h1" size="xl" textAlign="center" mb={8} color="brand.500">
                    Yeni Hesap Oluştur
                </Heading>

                {registrationMessage ? (
                    <Alert status="success" borderRadius="md" flexDirection="column" alignItems="center" textAlign="center" py={6}>
                        <AlertIcon boxSize="40px" mr={0} />
                        <AlertTitle mt={4} mb={2} fontSize="lg">Kayıt Başarılı!</AlertTitle>
                        <AlertDescription maxWidth="sm">{registrationMessage}</AlertDescription>
                        <Button as={RouterLink} to="/login" colorScheme="brand" mt={6}>
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
                                   <AlertDescription fontSize="sm">{error.message}</AlertDescription>
                                 </Alert>
                               )}
                            </ScaleFade>

                            <FormControl id="usernameReg" isRequired isDisabled={loading || loadingClassifications}>
                                <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Kullanıcı Adı</FormLabel>
                                <InputGroup>
                                    <InputLeftElement pointerEvents="none" children={<Icon as={FaUser} color="gray.400" />} />
                                    <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder='Kullanıcı adınızı belirleyin'/>
                                </InputGroup>
                            </FormControl>

                            <FormControl id="emailReg" isRequired isDisabled={loading || loadingClassifications}>
                                <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">E-posta Adresi</FormLabel>
                                <InputGroup>
                                    <InputLeftElement pointerEvents="none" children={<Icon as={FaEnvelope} color="gray.400" />} />
                                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder='E-posta adresiniz'/>
                                </InputGroup>
                            </FormControl>

                            <FormControl id="passwordReg" isRequired isDisabled={loading || loadingClassifications} isInvalid={isPasswordMismatch || (error?.message && error.message.toLowerCase().includes('şifre'))}>
                                <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Şifre</FormLabel>
                                <InputGroup size="md">
                                    <InputLeftElement pointerEvents="none" children={<Icon as={FaLock} color="gray.400" />} />
                                    <Input pr="4.5rem" type={showPassword ? 'text' : 'password'} value={password} onChange={handlePasswordChange} placeholder='En az 6 karakter'/>
                                    <InputRightElement width="4.5rem">
                                        <IconButton h="1.75rem" size="sm" variant="ghost" onClick={handlePasswordVisibility} icon={showPassword ? <Icon as={FaEyeSlash} /> : <Icon as={FaEye} />} aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}/>
                                    </InputRightElement>
                                </InputGroup>
                                {password.length > 0 && (<Progress colorScheme={strengthColor} size="xs" value={passwordStrength} mt={2} borderRadius="sm" />)}
                                {error?.message && error.message.toLowerCase().includes('6 karakter') && <FormErrorMessage fontSize="xs">{error.message}</FormErrorMessage>}
                                {error?.message && error.message.toLowerCase().includes('eşleşmiyor') && isPasswordMismatch && <FormErrorMessage fontSize="xs">{error.message}</FormErrorMessage>}
                            </FormControl>

                            <FormControl id="confirmPasswordReg" isRequired isDisabled={loading || loadingClassifications} isInvalid={isPasswordMismatch}>
                                <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Şifre Tekrar</FormLabel>
                                <InputGroup size="md">
                                     <InputLeftElement pointerEvents="none" children={<Icon as={FaLock} color="gray.400" />} />
                                    <Input pr="4.5rem" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder='Şifrenizi tekrar girin'/>
                                    <InputRightElement width="4.5rem">
                                        <IconButton h="1.75rem" size="sm" variant="ghost" onClick={handleConfirmPasswordVisibility} icon={showConfirmPassword ? <Icon as={FaEyeSlash} /> : <Icon as={FaEye} />} aria-label={showConfirmPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}/>
                                    </InputRightElement>
                                </InputGroup>
                                {isPasswordMismatch && (<FormErrorMessage fontSize="xs">Girilen şifreler eşleşmiyor!</FormErrorMessage>)}
                            </FormControl>

                            <FormControl id="defaultClassificationId" isRequired isDisabled={loading || loadingClassifications}>
                                 <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Hedef Sınav Türü</FormLabel>
                                 <InputGroup>
                                     <InputLeftElement pointerEvents='none' children={<Icon as={FaTasks} color='gray.400' />} />
                                     <Select placeholder="-- Sınav Türü Seçiniz --" value={defaultClassificationId} onChange={(e) => setDefaultClassificationId(e.target.value)} isDisabled={loadingClassifications}>
                                        {loadingClassifications ? <option>Yükleniyor...</option> : examClassifications.map(ec => (
                                            <option key={ec.id} value={ec.id}>{ec.name}</option>
                                        ))}
                                    </Select>
                                </InputGroup>
                            </FormControl>

                            <FormControl id="specialization" isDisabled={loading || loadingClassifications}>
                                 <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">Uzmanlık Alanı (İsteğe Bağlı)</FormLabel>
                                 <InputGroup>
                                     <InputLeftElement pointerEvents='none' children={<Icon as={FaGraduationCap} color='gray.400' />} />
                                     <Select placeholder="-- Alan Seçiniz --" value={specialization} onChange={(e) => setSpecialization(e.target.value)}>
                                        {specializations.map(spec => ( <option key={spec} value={spec}>{spec}</option>))}
                                    </Select>
                                </InputGroup>
                            </FormControl>

                            <Button
                                type="submit" colorScheme="brand" size="lg" width="full" mt={4}
                                isLoading={loading || loadingClassifications} loadingText="Kayıt Olunuyor..."
                                spinnerPlacement="start"
                                leftIcon={!(loading || loadingClassifications) ? <Icon as={FaUserPlus} /> : undefined}
                            >
                                Kayıt Ol
                            </Button>
                        </VStack>
                    </Box>
                )}

                {!registrationMessage && (
                    <Text textAlign="center" mt={8} fontSize="sm">
                        Zaten hesabınız var mı?{' '}
                        <ChakraLink as={RouterLink} to="/login" fontWeight="medium" color="brand.500">
                            Giriş Yapın
                        </ChakraLink>
                    </Text>
                )}
            </Container>
        </Flex>
    );
}

export default RegisterPage;