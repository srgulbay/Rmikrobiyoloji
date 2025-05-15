// Mevcut importlarınız ve fonksiyonun başı burada kalacak (bir önceki adımdaki gibi)
// ... (useState, useEffect, useCallback, useAuth, axios, Chakra UI importları, API_BASE_URL, ProfilePage fonksiyon tanımı, state'ler, handler fonksiyon taslakları vb. burada olmalı) ...
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Box,
  Container,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Heading,
  HStack,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription, // AlertDescription eklendi
  AlertTitle, // AlertTitle eklendi
  VStack,
  Divider,
  useColorModeValue,
  SimpleGrid,
  Button,
  Icon,
  useToast,
  Tabs, TabList, Tab, TabPanels, TabPanel // Tabs eklendi
} from '@chakra-ui/react';
import { FaUserCircle, FaEdit, FaKey, FaShieldAlt, FaSave, FaTimesCircle } from 'react-icons/fa';

// Alt component'leri import ediyoruz
import UserInfoDisplay from '../components/profile/UserInfoDisplay';
import EditProfileForm from '../components/profile/EditProfileForm';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function ProfilePage() {
  const { user, token, logout, setUser: setAuthUser } = useAuth(); 
  const [examClassifications, setExamClassifications] = useState([]);
  const [pageLoading, setPageLoading] = useState(true); // Genel sayfa yükleme durumu
  const [formLoading, setFormLoading] = useState(false); // Form işlemleri için yükleme durumu
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false); // Profil düzenleme modu
  const [changePasswordMode, setChangePasswordMode] = useState(false); // Şifre değiştirme modu

  const toast = useToast();
  const navigate = useNavigate(); // useNavigate import edildi

  // Stil Değişkenleri
  const mainBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("gray.700", "gray.100");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const textMutedColor = useColorModeValue("gray.500", "gray.400");
  const inputSelectBg = useColorModeValue("white", "gray.600");


  useEffect(() => {
    const fetchData = async () => {
      if (!token || !user) {
        setError("Profil bilgilerinizi görüntülemek için lütfen giriş yapın.");
        setPageLoading(false);
        return;
      }
      setPageLoading(true);
      try {
        const ecConfig = { headers: { Authorization: `Bearer ${token}` } };
        const ecResponse = await axios.get(`${API_BASE_URL}/api/exam-classifications`, ecConfig);
        setExamClassifications(Array.isArray(ecResponse.data) ? ecResponse.data : []);
        setError(''); // Başarılı olursa önceki hataları temizle
      } catch (err) {
        console.error("Profil sayfası için veri çekilirken hata:", err);
        setError("Profil bilgileri yüklenirken bir sorun oluştu.");
      } finally {
        setPageLoading(false);
      }
    };
    fetchData();
  }, [token, user]);

  const handleProfileUpdate = async (updatedData) => {
    if (!token) return;
    setFormLoading(true); 
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Backend endpoint'i: /api/users/me/profile veya /api/users/profile
      const response = await axios.put(`${API_BASE_URL}/api/users/profile`, updatedData, config); 
      
      if (setAuthUser && response.data.user) {
         setAuthUser(prevUser => ({...prevUser, ...response.data.user})); // AuthContext'i güncelle
      } else if (setAuthUser) { // Sadece güncellenen alanları yansıtmak için
         setAuthUser(prevUser => ({...prevUser, ...updatedData}));
      }
      
      toast({ title: "Başarılı", description: "Profiliniz güncellendi.", status: "success", duration: 3000, isClosable: true });
      setEditMode(false);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Profil güncellenirken bir hata oluştu.";
      setError(errorMsg); // Hata mesajını forma değil, genel error state'ine ata
      toast({ title: "Profil Güncelleme Hatası", description: errorMsg, status: "error", duration: 5000, isClosable: true });
    } finally {
      setFormLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (passwordData) => {
    if (!token) return;
    setFormLoading(true); 
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Backend endpoint'i: /api/auth/change-password veya /api/users/change-password
      const response = await axios.post(`${API_BASE_URL}/api/auth/change-password`, passwordData, config); 
      toast({ title: "Başarılı", description: response.data.message || "Şifreniz başarıyla değiştirildi.", status: "success", duration: 4000, isClosable: true });
      setChangePasswordMode(false);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Şifre değiştirilirken bir hata oluştu.";
      // Bu hatayı doğrudan ChangePasswordForm component'ine prop olarak geçmek daha iyi olabilir.
      // Şimdilik genel error state'ini kullanıyoruz.
      setError(errorMsg); 
      toast({ title: "Şifre Değiştirme Hatası", description: errorMsg, status: "error", duration: 5000, isClosable: true });
    } finally {
      setFormLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Container centerContent py={10} minH="60vh" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" thickness="4px"/>
            <Text color={textMutedColor}>Profil bilgileri yükleniyor...</Text>
        </VStack>
      </Container>
    );
  }

  if (error && !user) { // Sadece kritik bir yükleme hatası varsa ve kullanıcı bilgisi yoksa göster
    return (
        <Container centerContent py={10}>
            <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={10} borderRadius="lg">
                <AlertIcon boxSize="40px" />
                <AlertTitle mt={4} mb={2} fontSize="xl">Hata!</AlertTitle>
                <AlertDescription maxWidth="sm">{error}</AlertDescription>
                <Button as={RouterLink} to="/login" colorScheme="blue" mt={6}>Giriş Yap</Button>
            </Alert>
        </Container>
    );
  }
  
  if (!user) { // Token var ama user bilgisi henüz AuthContext'ten gelmemiş olabilir veya bir sorun var
    return (
        <Container centerContent py={10}>
            <Text color={textMutedColor}>Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapmayı deneyin.</Text>
            <Button onClick={() => logout()} mt={4} colorScheme="gray">Çıkış Yap</Button>
        </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={{ base: 6, md: 8 }} bg={mainBg}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl" color={headingColor} textAlign="center" display="flex" alignItems="center" justifyContent="center">
          <Icon as={FaUserCircle} mr={3} /> Profilim
        </Heading>

        {error && !editMode && !changePasswordMode && ( // Genel hatalar (form hataları hariç)
            <Alert status="warning" variant="top-accent" borderRadius="md">
                <AlertIcon /> {error}
            </Alert>
        )}

        <Box>
            <UserInfoDisplay user={user} examClassifications={examClassifications} />
            {!editMode && !changePasswordMode && (
                <HStack mt={6} spacing={4} justifyContent="flex-end">
                    <Button 
                        colorScheme="blue" 
                        variant="outline"
                        onClick={() => { setEditMode(true); setChangePasswordMode(false); setError(''); }} 
                        leftIcon={<Icon as={FaEdit} />}
                        isDisabled={formLoading}
                    >
                        Profili Düzenle
                    </Button>
                    <Button 
                        colorScheme="purple" 
                        variant="outline"
                        onClick={() => { setChangePasswordMode(true); setEditMode(false); setError(''); }} 
                        leftIcon={<Icon as={FaKey} />}
                        isDisabled={formLoading}
                    >
                        Şifre Değiştir
                    </Button>
                </HStack>
            )}
        </Box>

        {editMode && (
          <EditProfileForm
            currentUser={user}
            examClassifications={examClassifications}
            onSubmit={handleProfileUpdate}
            onCancel={() => { setEditMode(false); setError(''); }}
            isLoading={formLoading}
            formError={error && editMode ? error : ''} // Sadece düzenleme modundayken hata göster
          />
        )}

        {changePasswordMode && (
          <ChangePasswordForm
            onSubmit={handleChangePasswordSubmit}
            onCancel={() => { setChangePasswordMode(false); setError(''); }}
            isLoading={formLoading}
            formError={error && changePasswordMode ? error : ''} // Sadece şifre modundayken hata göster
          />
        )}
        
        {/* İleride eklenebilecek diğer modüller için placeholder */}
        {/* <Divider my={8} />
        <Box>
          <Heading size="md" color={headingColor} mb={4}>Bildirim Ayarları</Heading>
          <Text color={textColor}>Yakında burada olacak...</Text>
        </Box>
        <Box>
          <Heading size="md" color={headingColor} mb={4}>Hesap Silme</Heading>
          <Button colorScheme="red" variant="ghost">Hesabımı Kalıcı Olarak Sil</Button>
        </Box> */}

      </VStack>
    </Container>
  );
}

export default ProfilePage;
