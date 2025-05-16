import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  // CardHeader, // Kullanılmıyor
  // CardBody,   // Kullanılmıyor
  // CardFooter, // Kullanılmıyor
  Heading,
  FormControl,
  FormLabel,
  Input,
  InputGroup, // InputGroup eklendi
  InputLeftElement, // InputLeftElement eklendi
  Select,
  Button,
  VStack,
  HStack,
  Icon,
  Alert,
  AlertIcon,
  // Spinner, // Kullanılmıyor
  useColorModeValue,
  Text, // Kullanılmıyor, FormHelperText daha uygun
  FormHelperText,
  Divider // Divider eklendi
} from '@chakra-ui/react';
import { FaSave, FaTimesCircle, FaUserEdit, FaEnvelope, FaUserTie, FaTasks } from 'react-icons/fa'; // FaUserTie ve FaTasks eklendi
import { FiEdit3 } from 'react-icons/fi'; // Daha modern bir ikon

const specializationsArray = [
  "YDUS", "TUS", "DUS", "Tıp Fakültesi Dersleri", "Diş Hekimliği Fakültesi Dersleri", "Diğer"
];

function EditProfileForm({
    currentUser,
    examClassifications = [],
    onSubmit,
    onCancel,
    isLoading,
    formError
}) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    specialization: '',
    defaultClassificationId: '',
  });
  const [currentFormError, setCurrentFormError] = useState('');
  const [emailChanged, setEmailChanged] = useState(false);

  // Layout ile tutarlı stil değişkenleri
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("gray.700", "whiteAlpha.900");
  const textColor = useColorModeValue("gray.600", "gray.300"); // FormLabel için
  const textMutedColor = useColorModeValue("gray.500", "gray.400"); // İkonlar ve helper text için
  const inputBg = useColorModeValue("white", "gray.700");
  const inputFocusBorderColor = useColorModeValue("brand.500", "brand.300");
  const accentColor = inputFocusBorderColor; // Başlık ikonu için

  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username || '',
        email: currentUser.email || '',
        specialization: currentUser.specialization || '',
        defaultClassificationId: currentUser.defaultClassificationId ? String(currentUser.defaultClassificationId) : '',
      });
      setEmailChanged(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if(formError) setCurrentFormError(formError);
  }, [formError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setCurrentFormError('');
    if (name === 'email' && currentUser && value !== currentUser.email) {
        setEmailChanged(true);
    } else if (name === 'email' && currentUser && value === currentUser.email) {
        setEmailChanged(false);
    }
  };

  const handleSubmitForm = (e) => { // Fonksiyon adı handleSubmit ile çakışmaması için değiştirildi
    e.preventDefault();
    setCurrentFormError('');
    if (!formData.username.trim()) {
      setCurrentFormError("Kullanıcı adı boş bırakılamaz.");
      return;
    }
    if (!formData.email.trim()) {
      setCurrentFormError("E-posta alanı boş bırakılamaz.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setCurrentFormError("Lütfen geçerli bir e-posta adresi girin.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <Card
        variant="outline"
        bg={cardBg}
        borderColor={borderColor}
        boxShadow="xl"
        borderRadius="xl"
        p={{base: 5, md: 8}}
        mt={8} // ProfilePage içindeki diğer sekmelerle aynı hizada olması için
    >
      <Heading
        as="h2"
        size="lg"
        color={headingColor}
        mb={8}
        display="flex"
        alignItems="center"
        fontWeight="semibold"
      >
        <Icon as={FiEdit3} mr={3} color={accentColor} boxSize={6}/> Profilimi Düzenle
      </Heading>
      <Box as="form" onSubmit={handleSubmitForm}>
        <VStack spacing={6} align="stretch"> {/* Boşluk artırıldı */}
          {currentFormError && (
            <Alert status="error" borderRadius="lg" variant="subtle" bg={useColorModeValue("red.50", "red.800")} boxShadow="md">
              <AlertIcon color="red.400"/>
              <Text color={useColorModeValue("red.700", "red.100")} fontSize="sm">{currentFormError}</Text>
            </Alert>
          )}

          <FormControl id="usernameEdit" isRequired isInvalid={!!currentFormError && currentFormError.toLowerCase().includes('kullanıcı adı')}>
            <FormLabel fontSize="sm" color={textColor} fontWeight="medium" mb={1}>Kullanıcı Adı</FormLabel>
            <InputGroup size="lg"> {/* Input boyutu */}
                <InputLeftElement pointerEvents="none" children={<Icon as={FaUserEdit} color={textMutedColor} />} />
                <Input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Yeni kullanıcı adınız"
                bg={inputBg}
                borderColor={borderColor}
                borderRadius="md"
                _focus={{ borderColor: inputFocusBorderColor, boxShadow: `0 0 0 1px ${inputFocusBorderColor}` }}
                />
            </InputGroup>
          </FormControl>

          <FormControl id="emailEdit" isRequired isInvalid={!!currentFormError && currentFormError.toLowerCase().includes('e-posta')}>
            <FormLabel fontSize="sm" color={textColor} fontWeight="medium" mb={1}>E-posta Adresi</FormLabel>
            <InputGroup size="lg">
                <InputLeftElement pointerEvents="none" children={<Icon as={FaEnvelope} color={textMutedColor} />} />
                <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Yeni e-posta adresiniz"
                bg={inputBg}
                borderColor={borderColor}
                borderRadius="md"
                _focus={{ borderColor: inputFocusBorderColor, boxShadow: `0 0 0 1px ${inputFocusBorderColor}` }}
                />
            </InputGroup>
            {emailChanged && (
                <FormHelperText fontSize="xs" color={useColorModeValue("orange.600", "orange.300")} mt={1.5}>
                    <Icon as={FaExclamationTriangle} mr={1.5} verticalAlign="middle"/>
                    E-posta adresinizi değiştirirseniz, yeni adresinize bir doğrulama bağlantısı gönderilecektir.
                </FormHelperText>
            )}
          </FormControl>

          <FormControl id="specializationEdit">
            <FormLabel fontSize="sm" color={textColor} fontWeight="medium" mb={1}>Uzmanlık Alanı</FormLabel>
            <InputGroup size="lg">
                <InputLeftElement pointerEvents="none" children={<Icon as={FaUserTie} color={textMutedColor} />} />
                <Select
                name="specialization"
                placeholder="-- Uzmanlık Alanı Seçin veya Boş Bırakın --"
                value={formData.specialization}
                onChange={handleChange}
                bg={inputBg}
                borderColor={borderColor}
                borderRadius="md"
                _focus={{ borderColor: inputFocusBorderColor, boxShadow: `0 0 0 1px ${inputFocusBorderColor}` }}
                iconColor={textMutedColor}
                >
                <option value="">Belirtmek İstemiyorum</option>
                {specializationsArray.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                ))}
                </Select>
            </InputGroup>
          </FormControl>

          <FormControl id="defaultClassificationIdEdit">
            <FormLabel fontSize="sm" color={textColor} fontWeight="medium" mb={1}>Varsayılan Sınav Hedefi</FormLabel>
             <InputGroup size="lg">
                <InputLeftElement pointerEvents="none" children={<Icon as={FaTasks} color={textMutedColor} />} />
                <Select
                name="defaultClassificationId"
                placeholder="-- Sınav Hedefi Seçin veya Boş Bırakın --"
                value={formData.defaultClassificationId}
                onChange={handleChange}
                bg={inputBg}
                borderColor={borderColor}
                borderRadius="md"
                _focus={{ borderColor: inputFocusBorderColor, boxShadow: `0 0 0 1px ${inputFocusBorderColor}` }}
                iconColor={textMutedColor}
                isDisabled={examClassifications.length === 0} // Sınıflandırma yoksa disable et
                >
                <option value="">Hedef Yok</option>
                {examClassifications.map(ec => (
                    <option key={ec.id} value={String(ec.id)}>{ec.name}</option>
                ))}
                </Select>
            </InputGroup>
          </FormControl>
          
          <Divider mt={2} mb={0} borderColor={borderColor} />

          <HStack spacing={4} mt={2} justifyContent="flex-end">
            <Button
                variant="ghost"
                onClick={onCancel}
                leftIcon={<Icon as={FaTimesCircle} boxSize={4}/>}
                isDisabled={isLoading}
                colorScheme="gray"
                size="md"
                borderRadius="lg"
            >
              İptal
            </Button>
            <Button
                bg={inputFocusBorderColor} // Marka rengi
                color={useColorModeValue("white", "gray.900")}
                _hover={{bg: useColorModeValue('brand.600', 'brand.400')}}
                _active={{bg: useColorModeValue('brand.700', 'brand.500')}}
                isLoading={isLoading}
                loadingText="Kaydediliyor..."
                leftIcon={<Icon as={FaSave} boxSize={4}/>}
                type="submit"
                size="md"
                px={6}
                borderRadius="lg"
                boxShadow="md"
                fontWeight="semibold"
            >
              Değişiklikleri Kaydet
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Card>
  );
}

export default EditProfileForm;
