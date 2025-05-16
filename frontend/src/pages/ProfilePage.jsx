import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  // Stack, // Kullanılmıyor, kaldırılabilir
} from '@chakra-ui/react';
import { FaUserCircle, FaEdit, FaKey, FaSignOutAlt, FaUserCog, FaShieldAlt } from 'react-icons/fa';
import { FiUser, FiEdit3, FiKey, FiLogOut, FiSettings } from 'react-icons/fi'; // Daha modern ikonlar

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
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const toast = useToast();
  const navigate = useNavigate();

  // Layout ile tutarlı stil değişkenleri
  const mainBg = useColorModeValue('gray.100', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const textMutedColor = useColorModeValue('gray.500', 'gray.400');
  const accentColor = useColorModeValue('brand.500', 'brand.300');
  // inputSelectBg ProfilePage'de doğrudan kullanılmıyor, alt bileşenlere prop olarak geçilebilir veya onlar kendi içlerinde tanımlayabilir.

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
    if (user) {
        fetchData();
    } else if (!token) {
        setError("Profil bilgilerinizi görüntülemek için lütfen giriş yapın.");
        setPageLoading(false);
    }
    // Eğer token var ama user hala AuthContext'ten gelmediyse pageLoading true kalır.
  }, [token, user]);

  const handleProfileUpdate = async (updatedData) => {
    if (!token) return;
    setFormLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.put(`${API_BASE_URL}/api/users/profile`, updatedData, config);
      const returnedUser = response.data.user;
      if (setAuthUser && returnedUser) {
         setAuthUser(prevUser => ({
             ...prevUser,
             username: returnedUser.username,
             email: returnedUser.email,
             isEmailVerified: returnedUser.isEmailVerified,
             specialization: returnedUser.specialization,
             defaultClassificationId: returnedUser.defaultClassificationId,
            }));
      }
      toast({
        title: "Başarılı",
        description: response.data.message || "Profiliniz güncellendi.",
        status: "success",
        duration: 4000,
        isClosable: true,
        position: "top-right"
      });
      setActiveTabIndex(0);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Profil güncellenirken bir hata oluştu.";
      setError(errorMsg);
      toast({ title: "Profil Güncelleme Hatası", description: errorMsg, status: "error", duration: 5000, position: "top-right" });
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
      toast({ title: "Başarılı", description: response.data.message || "Şifreniz başarıyla değiştirildi.", status: "success", duration: 4000, isClosable: true, position: "top-right" });
      setActiveTabIndex(0);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Şifre değiştirilirken bir hata oluştu.";
      setError(errorMsg);
      toast({ title: "Şifre Değiştirme Hatası", description: errorMsg, status: "error", duration: 5000, position: "top-right" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleTabChange = (index) => {
    setActiveTabIndex(index);
    setError('');
  };

  if (pageLoading || (!user && token)) {
    return (
      <Container centerContent py={10} minH="calc(100vh - 160px)" bg={mainBg} display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4} bg={cardBg} p={10} borderRadius="xl" boxShadow="lg">
            <Spinner size="xl" color={accentColor} thickness="4px"/>
            <Text color={textMutedColor} fontSize="lg">Profil bilgileri yükleniyor...</Text>
        </VStack>
      </Container>
    );
  }

  if (!user && !token) {
     return (
        <Container centerContent py={10} bg={mainBg} minH="calc(100vh - 160px)">
            <Alert status="warning" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={10} borderRadius="xl" bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="xl" maxW="lg">
                <AlertIcon boxSize="40px" color={useColorModeValue("yellow.500", "yellow.300")}/>
                <AlertTitle mt={4} mb={2} fontSize="xl" color={headingColor}>Erişim Reddedildi</AlertTitle>
                <AlertDescription maxWidth="sm" color={textColor}>{error || "Profil sayfasını görüntülemek için lütfen giriş yapın."}</AlertDescription>
                <Button as={RouterLink} to="/login" colorScheme="blue" mt={6} size="lg" py={6} borderRadius="lg">Giriş Yap</Button>
            </Alert>
        </Container>
    );
  }
  if (!user) { // Token var ama user hala null (beklenmedik durum)
      return (
        <Container centerContent py={10} bg={mainBg} minH="calc(100vh - 160px)">
            <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={10} borderRadius="xl" bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="xl" maxW="lg">
                <AlertIcon boxSize="40px" color={useColorModeValue("red.500", "red.300")}/>
                <AlertTitle mt={4} mb={2} fontSize="xl" color={headingColor}>Hata</AlertTitle>
                <AlertDescription maxWidth="sm" color={textColor}>Kullanıcı bilgileri alınamadı. Lütfen daha sonra tekrar deneyin veya çıkış yapıp tekrar giriş yapın.</AlertDescription>
                <Button onClick={logout} colorScheme="red" variant="outline" mt={6}>Çıkış Yap</Button>
            </Alert>
        </Container>
      )
  }

  return (
    <Container maxW="container.xl" py={{ base: 6, md: 10 }} bg={mainBg}> {/* Sayfa geneli için container.xl */}
      <VStack spacing={8} align="stretch" maxW="container.lg" mx="auto"> {/* İçerik için container.lg */}
        <Flex direction="column" align="center" mb={4}>
            <Icon as={FiUser} boxSize={{base:10, md:12}} color={accentColor} mb={3}/>
            <Heading as="h1" size={{base:"lg", md:"xl"}} color={headingColor} fontWeight="bold">
            Profil Yönetimi
            </Heading>
            <Text color={textMutedColor} fontSize={{base:"sm", md:"md"}} mt={1}>
                Hesap bilgilerinizi güncelleyin ve ayarlarınızı yönetin.
            </Text>
        </Flex>


        {error && activeTabIndex === 0 && (
            <Alert status="warning" variant="subtle" borderRadius="lg" bg={useColorModeValue("yellow.50", "yellow.800")} boxShadow="md">
                <AlertIcon color="yellow.400"/> 
                <Text color={useColorModeValue("yellow.700", "yellow.100")} fontSize="sm">{error}</Text>
            </Alert>
        )}

        <Tabs index={activeTabIndex} onChange={handleTabChange} variant="soft-rounded" colorScheme="brand" isLazy size={{base:"sm", md:"md"}}>
          <TabList 
            mb={8} // Sekmeler ve panel arası boşluk
            justifyContent="center" 
            flexWrap="wrap" 
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="xl"
            p={1.5}
            bg={cardBg}
            boxShadow="lg"
          >
            <Tab borderRadius="lg" fontWeight="semibold" _selected={{ color: useColorModeValue('white', 'gray.900'), bg: accentColor, boxShadow:'md' }}><Icon as={FaUserCircle} mr={2}/>Bilgilerim</Tab>
            <Tab borderRadius="lg" fontWeight="semibold" _selected={{ color: useColorModeValue('white', 'gray.900'), bg: accentColor, boxShadow:'md' }}><Icon as={FiEdit3} mr={2}/>Profili Düzenle</Tab>
            <Tab borderRadius="lg" fontWeight="semibold" _selected={{ color: useColorModeValue('white', 'gray.900'), bg: accentColor, boxShadow:'md' }}><Icon as={FiKey} mr={2}/>Şifre Değiştir</Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0}>
              {user && (
                <UserInfoDisplay
                    user={user}
                    examClassifications={examClassifications}
                    // Stil propları UserInfoDisplay kendi içinden alacak veya varsayılanları kullanacak
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
                // Stil propları EditProfileForm kendi içinden alacak veya varsayılanları kullanacak
              />
            </TabPanel>
            <TabPanel p={0}>
              <ChangePasswordForm
                onSubmit={handleChangePasswordSubmit}
                onCancel={() => { setActiveTabIndex(0); setError(''); }}
                isLoading={formLoading}
                formError={activeTabIndex === 2 ? error : ''}
                // Stil propları ChangePasswordForm kendi içinden alacak veya varsayılanları kullanacak
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        <Divider my={10} borderColor={borderColor} /> {/* Alt boşluk artırıldı */}
        <Flex justifyContent="center">
            <Button
                bg={useColorModeValue("red.500", "red.400")}
                color="white"
                _hover={{bg: useColorModeValue("red.600", "red.500"), boxShadow:"xl"}}
                _active={{bg: useColorModeValue("red.700", "red.600")}}
                onClick={() => {
                    logout();
                    toast({ title: "Başarıyla çıkış yapıldı.", status: "info", duration: 3000, position:"top-right"});
                    navigate("/");
                }}
                leftIcon={<Icon as={FiLogOut}/>}
                size="lg"
                px={10} // Daha geniş buton
                py={6}  // Daha yüksek buton
                borderRadius="lg"
                boxShadow="lg"
                fontWeight="semibold"
                letterSpacing="wide"
            >
                Güvenli Çıkış Yap
            </Button>
        </Flex>
      </VStack>
    </Container>
  );
}

export default ProfilePage;
