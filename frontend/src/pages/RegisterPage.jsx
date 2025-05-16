import React, { useState, useEffect, useMemo } from 'react';
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
  Spinner,
  useColorModeValue,
  Divider // Divider eklendi
} from '@chakra-ui/react';
import { FaUserPlus, FaUser, FaLock, FaEye, FaEyeSlash, FaGraduationCap, FaEnvelope, FaTasks, FaCheckCircle } from 'react-icons/fa'; // FaCheckCircle eklendi
import { FiUserPlus } from 'react-icons/fi'; // Daha modern bir kayıt ikonu

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const specializations = [
    "YDUS", "TUS", "DUS", "Tıp Fakültesi Dersleri", "Diş Hekimliği Fakültesi Dersleri", "Diğer"
];

const calculatePasswordStrength = (password) => {
  let strength = 0;
  if (!password || password.length === 0) return 0;
  if (password.length >= 6) strength += 20;
  if (password.length >= 8) strength += 15; // 6 karakterden sonraki her karakter için değil, 8'e ulaşınca ek bonus
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[a-z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[^A-Za-z0-9\s]/.test(password)) strength += 20; // Boşluk hariç özel karakterler için daha fazla puan
  return Math.min(100, strength);
};

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [defaultClassificationId, setDefaultClassificationId] = useState('');
    const [examClassifications, setExamClassifications] = useState([]);
    const [loadingClassifications, setLoadingClassifications] = useState(true);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [registrationMessage, setRegistrationMessage] = useState('');

    const { register, error, setError, loading, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Layout ile tutarlı stil değişkenleri
    const pageBg = useColorModeValue('gray.100', 'gray.900');
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const headingColor = useColorModeValue('brand.600', 'brand.300');
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
            setRegistrationMessage('');
        }
    }, [isAuthenticated, navigate, setError]);

    useEffect(() => {
        const fetchClassifications = async () => {
            setLoadingClassifications(true);
            try {
                const response = await axios.get(`${API_BASE_URL}/api/exam-classifications`);
                setExamClassifications(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                setError(prevError => ({ ...prevError, message: "Sınav türleri yüklenemedi. Lütfen daha sonra tekrar deneyin." }));
            } finally {
                setLoadingClassifications(false);
            }
        };
        fetchClassifications();
    }, [setError]); // setError eklendi


    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setPasswordStrength(calculatePasswordStrength(newPassword));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setRegistrationMessage('');

        if (!username || !email || !password || !defaultClassificationId) {
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
        const result = await register(username, email, password, specToSend, defaultClassificationId);

        if (result && result.success && result.message) {
            setRegistrationMessage(result.message);
        }
        // Hata durumunda AuthContext'teki error state'i zaten register fonksiyonu tarafından set ediliyor.
    };

    const handlePasswordVisibility = () => setShowPassword(!showPassword);
    const handleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

    const isPasswordMismatch = password !== confirmPassword && confirmPassword.length > 0; // Sadece confirmPassword boş değilken mismatch kontrolü

    const strengthColor = useMemo(() => {
        if (passwordStrength < 30) return 'red';
        if (passwordStrength < 60) return 'orange';
        if (passwordStrength < 85) return 'yellow';
        return 'green';
    }, [passwordStrength]);

    return (
        <Flex minH="100vh" align="center" justify="center" px={4} py={12} bg={pageBg}>
            <Container
                maxW="lg" // Biraz daha genişletildi
                bg={cardBg}
                p={{ base: 6, sm: 8, md: 10 }}
                borderRadius="xl"
                boxShadow="2xl"
                borderWidth={1}
                borderColor={borderColor}
            >
                <VStack spacing={2} mb={8} textAlign="center">
                    <Icon as={FiUserPlus} boxSize={12} color={headingColor} />
                    <Heading as="h1" size="xl" color={headingColor} fontWeight="bold">
                        Yeni Hesap Oluşturun
                    </Heading>
                    <Text color={textMutedColor} fontSize="md">
                        Platformumuza katılarak öğrenmeye başlayın!
                    </Text>
                </VStack>


                {registrationMessage ? (
                    <Alert 
                        status="success" 
                        borderRadius="lg" 
                        flexDirection="column" 
                        alignItems="center" 
                        textAlign="center" 
                        py={8} 
                        bg={useColorModeValue("green.50", "green.800")}
                        borderColor={useColorModeValue("green.200", "green.600")}
                        borderWidth="1px"
                        boxShadow="md"
                    >
                        <AlertIcon as={FaCheckCircle} boxSize="40px" color={useColorModeValue("green.500", "green.200")} />
                        <AlertTitle mt={4} mb={2} fontSize="xl" fontWeight="bold" color={useColorModeValue("green.700", "green.100")}>Kayıt Başarılı!</AlertTitle>
                        <AlertDescription maxWidth="sm" color={textColor}>{registrationMessage}</AlertDescription>
                        <Button as={RouterLink} to="/login" colorScheme="brand" mt={6} size="lg" py={6} borderRadius="lg">
                            Giriş Yap Sayfasına Git
                        </Button>
                    </Alert>
                ) : (
                    <Box as="form" onSubmit={handleSubmit}>
                        <VStack spacing={5}> {/* Form elemanları arası boşluk artırıldı */}
                            <ScaleFade initialScale={0.95} in={!!error} unmountOnExit style={{width: '100%'}}>
                               {error && (
                                 <Alert status="error" borderRadius="lg" width="full" variant="subtle" bg={useColorModeValue("red.50", "red.800")}>
                                   <AlertIcon color="red.400"/>
                                   <AlertDescription fontSize="sm" color={useColorModeValue("red.700", "red.100")}>{error.message}</AlertDescription>
                                 </Alert>
                               )}
                            </ScaleFade>

                            <FormControl id="usernameReg" isRequired isDisabled={loading || loadingClassifications}>
                                <FormLabel fontSize="sm" fontWeight="medium" color={textMutedColor}>Kullanıcı Adı</FormLabel>
                                <InputGroup size="lg">
                                    <InputLeftElement pointerEvents="none" children={<Icon as={FaUser} color={useColorModeValue("gray.400", "gray.500")} />} />
                                    <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder='Kullanıcı adınızı belirleyin' bg={inputBg} borderColor={borderColor} borderRadius="md" _focus={{borderColor: inputFocusBorderColor, boxShadow: `0 0 0 1px ${inputFocusBorderColor}`}}/>
                                </InputGroup>
                            </FormControl>

                            <FormControl id="emailReg" isRequired isDisabled={loading || loadingClassifications}>
                                <FormLabel fontSize="sm" fontWeight="medium" color={textMutedColor}>E-posta Adresi</FormLabel>
                                <InputGroup size="lg">
                                    <InputLeftElement pointerEvents="none" children={<Icon as={FaEnvelope} color={useColorModeValue("gray.400", "gray.500")} />} />
                                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder='E-posta adresiniz' bg={inputBg} borderColor={borderColor} borderRadius="md" _focus={{borderColor: inputFocusBorderColor, boxShadow: `0 0 0 1px ${inputFocusBorderColor}`}}/>
                                </InputGroup>
                            </FormControl>

                            <FormControl id="passwordReg" isRequired isDisabled={loading || loadingClassifications} isInvalid={isPasswordMismatch || (error?.message && error.message.toLowerCase().includes('şifre'))}>
                                <FormLabel fontSize="sm" fontWeight="medium" color={textMutedColor}>Şifre</FormLabel>
                                <InputGroup size="lg">
                                    <InputLeftElement pointerEvents="none" children={<Icon as={FaLock} color={useColorModeValue("gray.400", "gray.500")} />} />
                                    <Input pr="3.5rem" type={showPassword ? 'text' : 'password'} value={password} onChange={handlePasswordChange} placeholder='En az 6 karakter' bg={inputBg} borderColor={borderColor} borderRadius="md" _focus={{borderColor: inputFocusBorderColor, boxShadow: `0 0 0 1px ${inputFocusBorderColor}`}}/>
                                    <InputRightElement width="3.5rem">
                                        <IconButton h="1.75rem" size="sm" variant="ghost" onClick={handlePasswordVisibility} icon={showPassword ? <Icon as={FaEyeSlash} boxSize={5}/> : <Icon as={FaEye} boxSize={5}/>} aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'} color={textMutedColor}/>
                                    </InputRightElement>
                                </InputGroup>
                                {password.length > 0 && (<Progress colorScheme={strengthColor} size="sm" value={passwordStrength} mt={2} borderRadius="md" />)}
                                {error?.message && error.message.toLowerCase().includes('6 karakter') && <FormErrorMessage fontSize="xs">{error.message}</FormErrorMessage>}
                            </FormControl>

                            <FormControl id="confirmPasswordReg" isRequired isDisabled={loading || loadingClassifications} isInvalid={isPasswordMismatch}>
                                <FormLabel fontSize="sm" fontWeight="medium" color={textMutedColor}>Şifre Tekrar</FormLabel>
                                <InputGroup size="lg">
                                     <InputLeftElement pointerEvents="none" children={<Icon as={FaLock} color={useColorModeValue("gray.400", "gray.500")} />} />
                                    <Input pr="3.5rem" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder='Şifrenizi tekrar girin' bg={inputBg} borderColor={borderColor} borderRadius="md" _focus={{borderColor: inputFocusBorderColor, boxShadow: `0 0 0 1px ${inputFocusBorderColor}`}}/>
                                    <InputRightElement width="3.5rem">
                                        <IconButton h="1.75rem" size="sm" variant="ghost" onClick={handleConfirmPasswordVisibility} icon={showConfirmPassword ? <Icon as={FaEyeSlash} boxSize={5}/> : <Icon as={FaEye} boxSize={5}/>} aria-label={showConfirmPassword ? 'Şifreyi gizle' : 'Şifreyi göster'} color={textMutedColor}/>
                                    </InputRightElement>
                                </InputGroup>
                                {isPasswordMismatch && (<FormErrorMessage fontSize="xs">Girilen şifreler eşleşmiyor!</FormErrorMessage>)}
                            </FormControl>

                            <FormControl id="defaultClassificationId" isRequired isDisabled={loading || loadingClassifications}>
                                 <FormLabel fontSize="sm" fontWeight="medium" color={textMutedColor}>Hedef Sınav Türü</FormLabel>
                                 <InputGroup size="lg">
                                     <InputLeftElement pointerEvents='none' children={<Icon as={FaTasks} color={useColorModeValue("gray.400", "gray.500")} />} />
                                     <Select placeholder={loadingClassifications ? "Yükleniyor..." : "-- Sınav Türü Seçiniz --"} value={defaultClassificationId} onChange={(e) => setDefaultClassificationId(e.target.value)} isDisabled={loadingClassifications} bg={inputBg} borderColor={borderColor} borderRadius="md" _focus={{borderColor: inputFocusBorderColor, boxShadow: `0 0 0 1px ${inputFocusBorderColor}`}}>
                                        {!loadingClassifications && examClassifications.map(ec => (
                                            <option key={ec.id} value={ec.id}>{ec.name}</option>
                                        ))}
                                    </Select>
                                </InputGroup>
                            </FormControl>

                            <FormControl id="specialization" isDisabled={loading || loadingClassifications}>
                                 <FormLabel fontSize="sm" fontWeight="medium" color={textMutedColor}>Uzmanlık Alanı (İsteğe Bağlı)</FormLabel>
                                 <InputGroup size="lg">
                                     <InputLeftElement pointerEvents='none' children={<Icon as={FaGraduationCap} color={useColorModeValue("gray.400", "gray.500")} />} />
                                     <Select placeholder="-- Alan Seçiniz --" value={specialization} onChange={(e) => setSpecialization(e.target.value)} bg={inputBg} borderColor={borderColor} borderRadius="md" _focus={{borderColor: inputFocusBorderColor, boxShadow: `0 0 0 1px ${inputFocusBorderColor}`}}>
                                        {specializations.map(spec => ( <option key={spec} value={spec}>{spec}</option>))}
                                    </Select>
                                </InputGroup>
                            </FormControl>

                            <Button
                                type="submit" 
                                bg={inputFocusBorderColor}
                                color={buttonTextColor}
                                _hover={{bg: useColorModeValue('brand.600', 'brand.400')}}
                                _active={{bg: useColorModeValue('brand.700', 'brand.500')}}
                                size="lg" width="full" mt={4} py={6}
                                isLoading={loading || loadingClassifications} loadingText="Kayıt Olunuyor..."
                                spinnerPlacement="start"
                                leftIcon={!(loading || loadingClassifications) ? <Icon as={FiUserPlus} /> : undefined}
                                borderRadius="lg" boxShadow="lg" fontWeight="bold" letterSpacing="wide"
                            >
                                HESAP OLUŞTUR
                            </Button>
                        </VStack>
                    </Box>
                )}

                {!registrationMessage && (
                  <>
                    <Divider my={6} borderColor={borderColor}/>
                    <Text textAlign="center" fontSize="sm" color={textColor}>
                        Zaten hesabınız var mı?{' '}
                        <ChakraLink as={RouterLink} to="/login" fontWeight="semibold" color={inputFocusBorderColor} _hover={{textDecoration:"underline"}}>
                            Giriş Yapın
                        </ChakraLink>
                    </Text>
                  </>
                )}
            </Container>
        </Flex>
    );
}

export default RegisterPage;
