import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Heading,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  IconButton,
  VStack,
  HStack,
  Icon,
  Alert,
  AlertIcon,
  Progress,
  Text,
  useColorModeValue,
  FormErrorMessage
} from '@chakra-ui/react';
import { FaKey, FaSave, FaTimesCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

// RegisterPage'deki şifre gücü hesaplama fonksiyonunu burada da kullanabiliriz
const calculatePasswordStrength = (password) => {
  let strength = 0;
  if (!password) return 0;
  if (password.length >= 6) strength += 20; // Temel uzunluk
  if (password.length >= 8) strength += 20; // Daha iyi uzunluk
  if (/[A-Z]/.test(password)) strength += 15; // Büyük harf
  if (/[a-z]/.test(password)) strength += 15; // Küçük harf
  if (/[0-9]/.test(password)) strength += 15; // Rakam
  if (/[^A-Za-z0-9]/.test(password)) strength += 15; // Özel karakter
  return Math.min(100, strength);
};

function ChangePasswordForm({ 
    onSubmit, 
    onCancel, 
    isLoading, 
    formError // ProfilePage'den gelen genel form hatası
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if(formError) setLocalError(formError); // Dışarıdan gelen hatayı göster
  }, [formError]);

  const handleNewPasswordChange = (e) => {
    const newPass = e.target.value;
    setNewPassword(newPass);
    setPasswordStrength(calculatePasswordStrength(newPass));
    setLocalError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setLocalError("Lütfen tüm şifre alanlarını doldurun.");
      return;
    }
    if (newPassword.length < 6) {
      setLocalError("Yeni şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setLocalError("Yeni şifreler eşleşmiyor!");
      return;
    }
    onSubmit({ currentPassword, newPassword, confirmNewPassword });
    // Başarılı olursa formu temizlemek ProfilePage'in sorumluluğunda olabilir
    // veya burada işlem sonrası bir prop ile tetiklenebilir.
    // Şimdilik form temizlenmiyor, işlem sonucuna göre ProfilePage karar verir.
  };

  const strengthColor = useMemo(() => {
    if (passwordStrength < 40) return 'red';
    if (passwordStrength < 70) return 'orange';
    return 'green';
  }, [passwordStrength]);

  const cardBg = useColorModeValue("white", "gray.750");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const headingColor = useColorModeValue("gray.700", "gray.100");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const inputSelectBg = useColorModeValue("white", "gray.600");

  return (
    <Card variant="outline" bg={cardBg} borderColor={borderColor} boxShadow="lg" borderRadius="xl" p={6} mt={8}>
      <Heading as="h2" size="lg" color={headingColor} mb={6} display="flex" alignItems="center">
        <Icon as={FaKey} mr={3} color="brand.500" /> Şifre Değiştir
      </Heading>
      <Box as="form" onSubmit={handleSubmit}>
        <VStack spacing={5} align="stretch">
          {localError && (
            <Alert status="error" borderRadius="md" variant="subtle">
              <AlertIcon />
              {localError}
            </Alert>
          )}

          <FormControl id="currentPassword" isRequired isInvalid={!!localError && localError.toLowerCase().includes('mevcut')}>
            <FormLabel fontSize="sm" color={textColor} fontWeight="medium">Mevcut Şifre</FormLabel>
            <InputGroup size="md">
              <Input
                name="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setLocalError(''); }}
                bg={inputSelectBg} borderColor={borderColor}
                _hover={{ borderColor: useColorModeValue("gray.300", "gray.500") }}
                _focus={{ borderColor: "brand.400", boxShadow: `0 0 0 1px var(--chakra-colors-brand-400)` }}
              />
              <InputRightElement>
                <IconButton
                  size="sm" variant="ghost"
                  icon={showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label={showCurrentPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
                />
              </InputRightElement>
            </InputGroup>
            {!!localError && localError.toLowerCase().includes('mevcut') && <FormErrorMessage>{localError}</FormErrorMessage>}
          </FormControl>

          <FormControl id="newPassword" isRequired isInvalid={!!localError && (localError.toLowerCase().includes('yeni şifre') || localError.toLowerCase().includes('eşleşmiyor'))}>
            <FormLabel fontSize="sm" color={textColor} fontWeight="medium">Yeni Şifre</FormLabel>
            <InputGroup size="md">
              <Input
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={handleNewPasswordChange}
                placeholder="En az 6 karakter"
                bg={inputSelectBg} borderColor={borderColor}
                _hover={{ borderColor: useColorModeValue("gray.300", "gray.500") }}
                _focus={{ borderColor: "brand.400", boxShadow: `0 0 0 1px var(--chakra-colors-brand-400)` }}
              />
              <InputRightElement>
                <IconButton
                  size="sm" variant="ghost"
                  icon={showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Yeni Şifreyi Gizle" : "Yeni Şifreyi Göster"}
                />
              </InputRightElement>
            </InputGroup>
            {newPassword.length > 0 && (
              <Progress colorScheme={strengthColor} size="xs" value={passwordStrength} mt={2} borderRadius="sm" />
            )}
             {!!localError && (localError.toLowerCase().includes('yeni şifre') || localError.toLowerCase().includes('6 karakter')) && <FormErrorMessage>{localError}</FormErrorMessage>}
          </FormControl>

          <FormControl id="confirmNewPassword" isRequired isInvalid={!!localError && localError.toLowerCase().includes('eşleşmiyor')}>
            <FormLabel fontSize="sm" color={textColor} fontWeight="medium">Yeni Şifre (Tekrar)</FormLabel>
            <InputGroup size="md">
              <Input
                name="confirmNewPassword"
                type={showConfirmNewPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => { setConfirmNewPassword(e.target.value); setLocalError(''); }}
                bg={inputSelectBg} borderColor={borderColor}
                _hover={{ borderColor: useColorModeValue("gray.300", "gray.500") }}
                _focus={{ borderColor: "brand.400", boxShadow: `0 0 0 1px var(--chakra-colors-brand-400)` }}
              />
              <InputRightElement>
                <IconButton
                  size="sm" variant="ghost"
                  icon={showConfirmNewPassword ? <FaEyeSlash /> : <FaEye />}
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  aria-label={showConfirmNewPassword ? "Yeni Şifreyi Gizle" : "Yeni Şifreyi Göster"}
                />
              </InputRightElement>
            </InputGroup>
            {newPassword !== confirmNewPassword && confirmNewPassword.length > 0 && <FormErrorMessage fontSize="xs">Yeni şifreler eşleşmiyor!</FormErrorMessage>}
          </FormControl>
          
          <HStack spacing={4} mt={4} justifyContent="flex-end">
            <Button 
                variant="ghost" 
                onClick={onCancel} 
                leftIcon={<Icon as={FaTimesCircle}/>}
                isDisabled={isLoading}
            >
              İptal
            </Button>
            <Button 
                type="submit" 
                colorScheme="brand" 
                isLoading={isLoading} 
                loadingText="Değiştiriliyor..."
                leftIcon={<Icon as={FaSave}/>}
            >
              Şifreyi Değiştir
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Card>
  );
}

export default ChangePasswordForm;
