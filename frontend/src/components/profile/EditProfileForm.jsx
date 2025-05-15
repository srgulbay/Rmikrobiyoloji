import React, { useState, useEffect } from 'react';
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
  Select,
  Button,
  VStack,
  HStack,
  Icon,
  Alert,
  AlertIcon,
  Spinner,
  useColorModeValue,
  Text
} from '@chakra-ui/react';
import { FaSave, FaTimesCircle, FaUserEdit, FaGraduationCap, FaBriefcase } from 'react-icons/fa';

// RegisterPage'deki uzmanlık alanlarını burada da kullanabiliriz veya constants dosyasından import edebiliriz.
const specializationsArray = [
  "YDUS", "TUS", "DUS", "Tıp Fakültesi Dersleri", "Diş Hekimliği Fakültesi Dersleri", "Diğer"
];

function EditProfileForm({ 
    currentUser, 
    examClassifications = [], 
    onSubmit, 
    onCancel, 
    isLoading, 
    formError // ProfilePage'den gelen genel form hatası
}) {
  const [formData, setFormData] = useState({
    username: '',
    specialization: '',
    defaultClassificationId: '',
  });
  const [currentFormError, setCurrentFormError] = useState('');


  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username || '',
        specialization: currentUser.specialization || '',
        defaultClassificationId: currentUser.defaultClassificationId ? String(currentUser.defaultClassificationId) : '',
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if(formError) setCurrentFormError(formError); // Dışarıdan gelen hatayı göster
  }, [formError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setCurrentFormError(''); // Kullanıcı yazmaya başlayınca hatayı temizle
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setCurrentFormError('');
    if (!formData.username.trim()) {
      setCurrentFormError("Kullanıcı adı boş bırakılamaz.");
      return;
    }
    // Diğer validasyonlar eklenebilir.
    onSubmit(formData); // Güncellenecek veriyi ana component'e gönder
  };

  const cardBg = useColorModeValue("white", "gray.750");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const headingColor = useColorModeValue("gray.700", "gray.100");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const inputSelectBg = useColorModeValue("white", "gray.600");


  return (
    <Card variant="outline" bg={cardBg} borderColor={borderColor} boxShadow="lg" borderRadius="xl" p={6} mt={8}>
      <Heading as="h2" size="lg" color={headingColor} mb={6} display="flex" alignItems="center">
        <Icon as={FaUserEdit} mr={3} color="brand.500" /> Profilimi Düzenle
      </Heading>
      <Box as="form" onSubmit={handleSubmit}>
        <VStack spacing={5} align="stretch">
          {currentFormError && (
            <Alert status="error" borderRadius="md" variant="subtle">
              <AlertIcon />
              {currentFormError}
            </Alert>
          )}

          <FormControl id="usernameEdit" isRequired isInvalid={!!currentFormError && currentFormError.includes('Kullanıcı adı')}>
            <FormLabel fontSize="sm" color={textColor} fontWeight="medium">Kullanıcı Adı</FormLabel>
            <Input
              name="username"
              value={formData.username}
              onChange={handleChange}
              bg={inputSelectBg}
              borderColor={borderColor}
              _hover={{ borderColor: useColorModeValue("gray.300", "gray.500") }}
              _focus={{ borderColor: "brand.400", boxShadow: `0 0 0 1px var(--chakra-colors-brand-400)` }}
            />
            {/* Username için hata mesajı (varsa) */}
          </FormControl>

          <FormControl id="specializationEdit">
            <FormLabel fontSize="sm" color={textColor} fontWeight="medium">Uzmanlık Alanı</FormLabel>
            <Select
              name="specialization"
              placeholder="-- Uzmanlık Alanı Seçin veya Boş Bırakın --"
              value={formData.specialization}
              onChange={handleChange}
              bg={inputSelectBg}
              borderColor={borderColor}
              _hover={{ borderColor: useColorModeValue("gray.300", "gray.500") }}
              _focus={{ borderColor: "brand.400", boxShadow: `0 0 0 1px var(--chakra-colors-brand-400)` }}
            >
              <option value="">Yok</option>
              {specializationsArray.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </Select>
          </FormControl>

          <FormControl id="defaultClassificationIdEdit">
            <FormLabel fontSize="sm" color={textColor} fontWeight="medium">Varsayılan Sınav Hedefi</FormLabel>
            <Select
              name="defaultClassificationId"
              placeholder="-- Sınav Hedefi Seçin veya Boş Bırakın --"
              value={formData.defaultClassificationId}
              onChange={handleChange}
              bg={inputSelectBg}
              borderColor={borderColor}
              _hover={{ borderColor: useColorModeValue("gray.300", "gray.500") }}
              _focus={{ borderColor: "brand.400", boxShadow: `0 0 0 1px var(--chakra-colors-brand-400)` }}
            >
              <option value="">Yok</option>
              {examClassifications.map(ec => (
                <option key={ec.id} value={String(ec.id)}>{ec.name}</option>
              ))}
            </Select>
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
                loadingText="Kaydediliyor..."
                leftIcon={<Icon as={FaSave}/>}
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
