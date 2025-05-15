import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom'; // RouterLink eklendi
import {
  Box,
  Container,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  AlertTitle,
  VStack,
  Divider,
  useColorModeValue,
  Button,
  Icon,
  useToast,
  Tabs, TabList, Tab, TabPanels, TabPanel,
  Flex,
  Stack // Stack daha önce import edilmişti, kontrol ettim.
} from '@chakra-ui/react';
import { FaUserCircle, FaEdit, FaKey, FaSignOutAlt, FaUserCog } from 'react-icons/fa'; // FaUserCog eklendi

// Alt component'leri import ediyoruz
import UserInfoDisplay from '../components/profile/UserInfoDisplay';
import EditProfileForm from '../components/profile/EditProfileForm';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function ProfilePage() {
  const { user, token, logout, setUser: setAuthUser } = useAuth(); 
  const [examClassifications, setExamClassifications] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTabIndex, setActiveTabIndex] = useState(0); // Sekme yönetimi için

  const toast = useToast();
  const navigate = useNavigate();

  const mainBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800"); // EditProfileForm ve ChangePasswordForm için
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("gray.700", "gray.100");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const textMutedColor = useColorModeValue("gray.500", "gray.400");
  const inputSelectBg = useColorModeValue("white", "gray.600"); // Form elemanları için

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
        setError('');
      } catch (err) {
        console.error("Profil sayfası için Sınav Türleri çekilirken hata:", err);
        setError("Sınav türleri yüklenemedi. Bazı profil bilgileri eksik görüntülenebilir.");
      } finally {
        setPageLoading(false);
      }
    };
    // Sadece user yüklendikten sonra API çağrısı yap
    if (user) {
        fetchData();
    } else {
        // Eğer user hala null ise (AuthContext yükleniyor olabilir veya giriş yapılmamış)
        // pageLoading'i true tutabiliriz veya bir Auth hatası gösterebiliriz.
        // AuthContext zaten kendi yükleme durumunu yönetiyor, bu yüzden user'ın varlığını beklemek yeterli.
        // Eğer token var ama user yoksa, AuthContext'te bir sorun olabilir.
        if(token && !user) setError("Kullanıcı bilgileri yüklenemedi, lütfen tekrar giriş yapmayı deneyin.");
        else if(!token) setError("Profil bilgilerinizi görüntülemek için lütfen giriş yapın.");
        setPageLoading(false); 
    }
  }, [token, user]); // user bağımlılığı eklendi

  const handleProfileUpdate = async (updatedData) => {
    if (!token) return;
    setFormLoading(true); 
    setError(''); // Önceki form genel hatalarını temizle
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.put(`${API_BASE_URL}/api/users/profile`, updatedData, config); 
      
      const returnedUser = response.data.user;
      if (setAuthUser && returnedUser) {
         setAuthUser(prevUser => ({
             ...prevUser, 
             username: returnedUser.username,
             email: returnedUser.email, // Yeni e-posta
             isEmailVerified: returnedUser.isEmailVerified, // E-posta değiştiyse false olacak
             specialization: returnedUser.specialization,
             defaultClassificationId: returnedUser.defaultClassificationId,
            }));
      }
      
      toast({ 
        title: "Başarılı", 
        description: response.data.message || "Profiliniz güncellendi.", 
        status: "success", 
        duration: 4000, 
        isClosable: true 
      });
      setActiveTabIndex(0); // Başarılı güncelleme sonrası Bilgilerim sekmesine dön
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Profil güncellenirken bir hata oluştu.";
      // Bu hatayı doğrudan EditProfileForm'a prop olarak geçireceğiz
      setError(errorMsg); // Form içi hata gösterimi için EditProfileForm'a iletilecek
      toast({ title: "Profil Güncelleme Hatası", description: errorMsg, status: "error", duration: 5000 });
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
      const response = await axios.post(`${API_BASE_URL}/api/auth/change-password`, passwordData, config); 
      toast({ title: "Başarılı", description: response.data.message || "Şifreniz başarıyla değiştirildi.", status: "success", duration: 4000, isClosable: true });
      setActiveTabIndex(0); // Başarılı şifre değişikliği sonrası Bilgilerim sekmesine dön
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Şifre değiştirilirken bir hata oluştu.";
      setError(errorMsg); // Form içi hata gösterimi için ChangePasswordForm'a iletilecek
      toast({ title: "Şifre Değiştirme Hatası", description: errorMsg, status: "error", duration: 5000 });
    } finally {
      setFormLoading(false);
    }
  };

  const handleTabChange = (index) => {
    setActiveTabIndex(index);
    setError(''); // Sekme değiştiğinde form hatalarını temizle
  };


  if (pageLoading || (!user && token)) { // AuthContext'ten user gelene kadar veya genel yükleme
    return (
      <Container centerContent py={10} minH="calc(100vh - 160px)" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}><Spinner size="xl" color="brand.500" thickness="4px"/><Text color={textMutedColor}>Profil bilgileri yükleniyor...</Text></VStack>
      </Container>
    );
  }
  
  if (!user && !token) { // Token da yoksa direkt login'e yönlendirilebilir veya mesaj gösterilebilir
     return (
        <Container centerContent py={10}>
            <Alert status="warning" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={10} borderRadius="lg">
                <AlertIcon boxSize="40px" />
                <AlertTitle mt={4} mb={2} fontSize="xl">Erişim Reddedildi</AlertTitle>
                <AlertDescription maxWidth="sm">{error || "Profil sayfasını görüntülemek için lütfen giriş yapın."}</AlertDescription>
                <Button as={RouterLink} to="/login" colorScheme="blue" mt={6}>Giriş Yap</Button>
            </Alert>
        </Container>
    );
  }
  // Eğer user objesi bir sebepten hala null ise (beklenmedik durum)
  if (!user) {
      return (
        <Container centerContent py={10}>
            <Alert status="error" variant="subtle" flexDirection="column"><AlertIcon />Beklenmedik bir hata oluştu, kullanıcı bilgileri alınamadı.</Alert>
        </Container>
      )
  }


  return (
    <Container maxW="container.lg" py={{ base: 6, md: 8 }} bg={mainBg}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl" color={headingColor} textAlign="center" display="flex" alignItems="center" justifyContent="center">
          <Icon as={FaUserCog} mr={3} color="brand.500" /> Profil Yönetimi
        </Heading>

        {error && activeTabIndex === 0 && ( // Sadece Bilgilerim sekmesindeyken genel hataları göster
            <Alert status="warning" variant="top-accent" borderRadius="md" mb={0}>
                <AlertIcon /> {error}
            </Alert>
        )}

        <Tabs index={activeTabIndex} onChange={handleTabChange} variant="enclosed-colored" colorScheme="brand" isLazy>
          <TabList mb={6} justifyContent="center" flexWrap="wrap" borderBottomColor={borderColor}>
            <Tab borderRadius="lg" _selected={{ color: useColorModeValue('brand.700','white'), bg: useColorModeValue('brand.50','brand.600'), boxShadow:'md' }}><Icon as={FaUserCircle} mr={2}/>Bilgilerim</Tab>
            <Tab borderRadius="lg" _selected={{ color: useColorModeValue('brand.700','white'), bg: useColorModeValue('brand.50','brand.600'), boxShadow:'md' }}><Icon as={FaEdit} mr={2}/>Profili Düzenle</Tab>
            <Tab borderRadius="lg" _selected={{ color: useColorModeValue('brand.700','white'), bg: useColorModeValue('brand.50','brand.600'), boxShadow:'md' }}><Icon as={FaKey} mr={2}/>Şifre Değiştir</Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0}>
              {user && ( // User yüklendiyse göster
                <UserInfoDisplay 
                    user={user} 
                    examClassifications={examClassifications} 
                    cardBg={cardBg} 
                    borderColor={borderColor} 
                    headingColor={headingColor}
                    textColor={textColor}
                    textMutedColor={textMutedColor}
                />
              )}
            </TabPanel>
            <TabPanel p={0}>
              <EditProfileForm
                currentUser={user}
                examClassifications={examClassifications}
                onSubmit={handleProfileUpdate}
                onCancel={() => { setActiveTabIndex(0); setError(''); }}
                isLoading={formLoading}
                formError={activeTabIndex === 1 ? error : ''} 
                // Stil propları
                cardBg={cardBg}
                borderColor={borderColor}
                headingColor={headingColor}
                textColor={textColor}
                textMutedColor={textMutedColor}
                inputSelectBg={inputSelectBg}
              />
            </TabPanel>
            <TabPanel p={0}>
              <ChangePasswordForm
                onSubmit={handleChangePasswordSubmit}
                onCancel={() => { setActiveTabIndex(0); setError(''); }}
                isLoading={formLoading}
                formError={activeTabIndex === 2 ? error : ''}
                // Stil propları
                cardBg={cardBg}
                borderColor={borderColor}
                headingColor={headingColor}
                textColor={textColor}
                textMutedColor={textMutedColor}
                inputSelectBg={inputSelectBg}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        <Divider my={8} borderColor={borderColor} />
        <Flex justifyContent="center">
            <Button 
                colorScheme="red" 
                variant="ghost" 
                onClick={() => {
                    logout(); 
                    toast({ title: "Başarıyla çıkış yapıldı.", status: "info", duration: 2000, position:"top-right"});
                    navigate("/"); // Genellikle AuthContext'teki logout zaten yönlendirme yapar.
                }}
                leftIcon={<Icon as={FaSignOutAlt}/>}
                size="lg"
            >
                Güvenli Çıkış Yap
            </Button>
        </Flex>
      </VStack>
    </Container>
  );
}

export default ProfilePage;
