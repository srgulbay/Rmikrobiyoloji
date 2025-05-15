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
  Text,
  FormHelperText
} from '@chakra-ui/react';
import { FaSave, FaTimesCircle, FaUserEdit, FaEnvelope } from 'react-icons/fa'; // FaEnvelope eklendi

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
    email: '', // E-posta alanı eklendi
    specialization: '',
    defaultClassificationId: '',
  });
  const [currentFormError, setCurrentFormError] = useState('');
  const [emailChanged, setEmailChanged] = useState(false);


  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username || '',
        email: currentUser.email || '', // E-posta state'i dolduruluyor
        specialization: currentUser.specialization || '',
        defaultClassificationId: currentUser.defaultClassificationId ? String(currentUser.defaultClassificationId) : '',
      });
      setEmailChanged(false); // Form her dolduğunda e-posta değişikliği flag'ini sıfırla
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

  const handleSubmit = (e) => {
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

  const cardBg = useColorModeValue("white", "gray.750");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const headingColor = useColorModeValue("gray.700", "gray.100");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const inputSelectBg = useColorModeValue("whiteAlpha.800", "gray.700"); // Hafif transparanlık eklendi


  return (
    <Card variant="outline" bg={cardBg} borderColor={borderColor} boxShadow="xl" borderRadius="xl" p={{base:4, md:6}} mt={8}>
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

          <FormControl id="usernameEdit" isRequired isInvalid={!!currentFormError && currentFormError.toLowerCase().includes('kullanıcı adı')}>
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
          </FormControl>

          <FormControl id="emailEdit" isRequired isInvalid={!!currentFormError && currentFormError.toLowerCase().includes('e-posta')}>
            <FormLabel fontSize="sm" color={textColor} fontWeight="medium">E-posta Adresi</FormLabel>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              bg={inputSelectBg}
              borderColor={borderColor}
              _hover={{ borderColor: useColorModeValue("gray.300", "gray.500") }}
              _focus={{ borderColor: "brand.400", boxShadow: `0 0 0 1px var(--chakra-colors-brand-400)` }}
            />
            {emailChanged && (
                <FormHelperText fontSize="xs" color="orange.500">
                    E-posta adresinizi değiştirirseniz, yeni adresinize bir doğrulama bağlantısı gönderilecektir. Mevcut oturumunuzu etkilemez ancak yeni e-postanız doğrulanana kadar "Doğrulanmamış" olarak görünecektir.
                </FormHelperText>
            )}
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
