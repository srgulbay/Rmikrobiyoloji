import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  // CardHeader, // CardHeader kullanılmıyor, Heading direkt Card içinde
  CardBody, // CardBody eklendi (VStack'i sarmak için)
  // CardFooter, // CardFooter kullanılmıyor, HStack direkt Card içinde
  Heading,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement, // InputLeftElement eklendi
  InputRightElement,
  Button,
  IconButton,
  VStack,
  HStack,
  Icon,
  Alert,
  AlertIcon,
  Progress,
  Text, // Kullanılmıyor gibi, kaldırılabilir
  useColorModeValue,
  FormErrorMessage,
  Divider // Divider eklendi
} from '@chakra-ui/react';
import { FaKey, FaSave, FaTimesCircle, FaEye, FaLock, FaEyeSlash, FaShieldAlt } from 'react-icons/fa'; // FaShieldAlt eklendi
import { FiKey } from 'react-icons/fi'; // Daha modern bir ikon

const calculatePasswordStrength = (password) => {
  let strength = 0;
  if (!password || password.length === 0) return 0;
  if (password.length >= 6) strength += 20;
  if (password.length >= 8) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[a-z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[^A-Za-z0-9\s]/.test(password)) strength += 20;
  return Math.min(100, strength);
};

function ChangePasswordForm({
    onSubmit,
    onCancel,
    isLoading,
    formError
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [localError, setLocalError] = useState('');

  // Layout ile tutarlı stil değişkenleri
  const cardBg = useColorModeValue("white", "gray.800"); // ProfilePage'den gelen cardBg kullanılacaksa bu kaldırılabilir
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("gray.700", "whiteAlpha.900");
  const textColor = useColorModeValue("gray.600", "gray.300"); // FormLabel için
  const textMutedColor = useColorModeValue("gray.500", "gray.400"); // İkonlar için
  const inputBg = useColorModeValue("white", "gray.700");
  const inputFocusBorderColor = useColorModeValue("brand.500", "brand.300");
  const accentColor = inputFocusBorderColor; // Başlık ikonu için

  useEffect(() => {
    if(formError) setLocalError(formError);
  }, [formError]);

  const handleNewPasswordChange = (e) => {
    const newPass = e.target.value;
    setNewPassword(newPass);
    setPasswordStrength(calculatePasswordStrength(newPass));
    setLocalError('');
  };

  const handleSubmitForm = (e) => { // Fonksiyon adı handleSubmit ile çakışmaması için değiştirildi
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
  };

  const strengthColorScheme = useMemo(() => {
    if (passwordStrength < 30) return 'red';
    if (passwordStrength < 60) return 'orange';
    if (passwordStrength < 85) return 'yellow';
    return 'green';
  }, [passwordStrength]);

  return (
    <Card 
        variant="outline" 
        bg={cardBg} 
        borderColor={borderColor} 
        boxShadow="xl" // Daha belirgin gölge
        borderRadius="xl" 
        p={{base: 5, md: 8}} // Padding artırıldı
        mt={8} // Üst boşluk ProfilePage'den yönetiliyor olabilir, burada da olabilir
    >
      <Heading 
        as="h2" 
        size="lg" 
        color={headingColor} 
        mb={8} // Alt boşluk artırıldı
        display="flex" 
        alignItems="center"
        fontWeight="semibold" // Daha yumuşak başlık
      >
        <Icon as={FiKey} mr={3} color={accentColor} boxSize={6}/> Şifre Değiştir
      </Heading>
      <Box as="form" onSubmit={handleSubmitForm}>
        <VStack spacing={6} align="stretch"> {/* Boşluk artırıldı */}
          {localError && (
            <Alert status="error" borderRadius="lg" variant="subtle" bg={useColorModeValue("red.50", "red.800")} boxShadow="md">
              <AlertIcon color="red.400"/>
              <Text color={useColorModeValue("red.700", "red.100")} fontSize="sm">{localError}</Text>
            </Alert>
          )}

          <FormControl id="currentPassword" isRequired isInvalid={!!localError && localError.toLowerCase().includes('mevcut')}>
            <FormLabel fontSize="sm" color={textColor} fontWeight="medium" mb={1}>Mevcut Şifre</FormLabel>
            <InputGroup size="lg"> {/* Input boyutu artırıldı */}
              <InputLeftElement pointerEvents="none" children={<Icon as={FaLock} color={textMutedColor} />} />
              <Input
                name="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setLocalError(''); }}
                bg={inputBg} borderColor={borderColor} borderRadius="md"
                _focus={{ borderColor: inputFocusBorderColor, boxShadow: `0 0 0 1px ${inputFocusBorderColor}` }}
              />
              <InputRightElement>
                <IconButton
                  size="sm" variant="ghost"
                  icon={showCurrentPassword ? <Icon as={FaEyeSlash} boxSize={5}/> : <Icon as={FaEye} boxSize={5}/>}
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label={showCurrentPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
                  color={textMutedColor}
                />
              </InputRightElement>
            </InputGroup>
            {!!localError && localError.toLowerCase().includes('mevcut') && <FormErrorMessage fontSize="xs">{localError}</FormErrorMessage>}
          </FormControl>

          <FormControl id="newPassword" isRequired isInvalid={!!localError && (localError.toLowerCase().includes('yeni şifre') || localError.toLowerCase().includes('eşleşmiyor'))}>
            <FormLabel fontSize="sm" color={textColor} fontWeight="medium" mb={1}>Yeni Şifre</FormLabel>
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none" children={<Icon as={FaShieldAlt} color={textMutedColor} />} />
              <Input
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={handleNewPasswordChange}
                placeholder="En az 6 karakter"
                bg={inputBg} borderColor={borderColor} borderRadius="md"
                _focus={{ borderColor: inputFocusBorderColor, boxShadow: `0 0 0 1px ${inputFocusBorderColor}` }}
              />
              <InputRightElement>
                <IconButton
                  size="sm" variant="ghost"
                  icon={showNewPassword ? <Icon as={FaEyeSlash} boxSize={5}/> : <Icon as={FaEye} boxSize={5}/>}
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Yeni Şifreyi Gizle" : "Yeni Şifreyi Göster"}
                  color={textMutedColor}
                />
              </InputRightElement>
            </InputGroup>
            {newPassword.length > 0 && (
              <Progress colorScheme={strengthColorScheme} size="sm" value={passwordStrength} mt={2} borderRadius="md" bg={useColorModeValue("gray.200", "gray.600")} />
            )}
             {!!localError && (localError.toLowerCase().includes('yeni şifre') || localError.toLowerCase().includes('6 karakter')) && <FormErrorMessage fontSize="xs">{localError}</FormErrorMessage>}
          </FormControl>

          <FormControl id="confirmNewPassword" isRequired isInvalid={!!localError && localError.toLowerCase().includes('eşleşmiyor')}>
            <FormLabel fontSize="sm" color={textColor} fontWeight="medium" mb={1}>Yeni Şifre (Tekrar)</FormLabel>
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none" children={<Icon as={FaShieldAlt} color={textMutedColor} />} />
              <Input
                name="confirmNewPassword"
                type={showConfirmNewPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => { setConfirmNewPassword(e.target.value); setLocalError(''); }}
                placeholder="Yeni şifrenizi tekrar girin"
                bg={inputBg} borderColor={borderColor} borderRadius="md"
                _focus={{ borderColor: inputFocusBorderColor, boxShadow: `0 0 0 1px ${inputFocusBorderColor}` }}
              />
              <InputRightElement>
                <IconButton
                  size="sm" variant="ghost"
                  icon={showConfirmNewPassword ? <Icon as={FaEyeSlash} boxSize={5}/> : <Icon as={FaEye} boxSize={5}/>}
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  aria-label={showConfirmNewPassword ? "Yeni Şifreyi Gizle" : "Yeni Şifreyi Göster"}
                  color={textMutedColor}
                />
              </InputRightElement>
            </InputGroup>
            {newPassword !== confirmNewPassword && confirmNewPassword.length > 0 && <FormErrorMessage fontSize="xs">Yeni şifreler eşleşmiyor!</FormErrorMessage>}
          </FormControl>
          
          <Divider mt={2} mb={0} borderColor={borderColor} />

          <HStack spacing={4} mt={2} justifyContent="flex-end">
            <Button
                variant="ghost"
                onClick={onCancel}
                leftIcon={<Icon as={FaTimesCircle} boxSize={4}/>}
                isDisabled={isLoading}
                colorScheme="gray"
                size="md" // Buton boyutları tutarlı
            >
              İptal
            </Button>
            <Button
                bg={inputFocusBorderColor} // Marka rengi
                color={useColorModeValue("white", "gray.900")}
                _hover={{bg: useColorModeValue('brand.600', 'brand.400')}}
                _active={{bg: useColorModeValue('brand.700', 'brand.500')}}
                isLoading={isLoading}
                loadingText="Değiştiriliyor..."
                leftIcon={<Icon as={FaSave} boxSize={4}/>}
                type="submit" // Form submit için
                size="md" // Buton boyutları tutarlı
                px={6} // Yatay padding
                borderRadius="lg"
                boxShadow="md"
                fontWeight="semibold"
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
