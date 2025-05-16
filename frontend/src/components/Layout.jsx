import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Link as RouterLink, NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import InstallPrompt from './InstallPrompt';
import usePushNotifications from '../hooks/usePushNotifications';
import {
  Box,
  Flex,
  Container,
  Button,
  IconButton,
  Link,
  HStack,
  Heading,
  VStack,
  Text,
  useColorMode,
  useDisclosure,
  Divider,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge,
  useToast,
  useColorModeValue,
  Spinner,
  Avatar,
  Center
} from '@chakra-ui/react';
import { 
  FaSignInAlt, FaUserPlus, FaSignOutAlt, FaFolder, FaUserGraduate, FaPencilAlt, FaSun, FaMoon, FaBars, FaTimes, 
  FaBell, FaRegBell, FaCog, FaUserCircle, FaBrain // FaBrain eklendi
} from 'react-icons/fa';
import { FiLogOut, FiUser, FiSettings, FiBellOff, FiRepeat, FiGrid, FiBarChart2, FiCpu } from 'react-icons/fi'; // Ek ikonlar

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const CustomNavLink = React.forwardRef(({ children, to, icon, ...props }, ref) => {
  const linkColor = useColorModeValue('gray.600', 'gray.300');
  const activeColor = useColorModeValue('brand.500', 'brand.200'); // Aktif renk daha belirgin
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const activeBg = useColorModeValue('brand.50', 'rgba(49, 130, 206, 0.1)'); // brand.50 veya tema rengine uygun bir alpha

  return (
    <NavLink to={to} ref={ref} {...props} end>
      {({ isActive }) => (
        <Link
          as="span"
          display="flex"
          alignItems="center"
          py={2}
          px={3} // Biraz daha padding
          borderRadius="md" // Yuvarlak köşeler
          fontWeight={isActive ? 'semibold' : 'medium'}
          color={isActive ? activeColor : linkColor}
          bg={isActive ? activeBg : 'transparent'}
          transition="all 0.2s ease-in-out"
          _hover={{
            textDecoration: 'none',
            color: activeColor, // Hover'da da aktif rengi kullan
            bg: hoverBg,
            transform: "translateY(-1px)", // Hafif yukarı kalkma efekti
          }}
          role="group" // _groupHover için
        >
          {icon && <Icon as={icon} mr={2} boxSize={4} transition="color 0.2s ease-in-out" _groupHover={{color: activeColor}} color={isActive ? activeColor : useColorModeValue('gray.500', 'gray.400')} />}
          <Text as="span" transition="color 0.2s ease-in-out" _groupHover={{color: activeColor}}>
            {children}
          </Text>
        </Link>
      )}
    </NavLink>
  );
});

const CustomMobileNavLink = React.forwardRef(({ children, to, onClose, icon, ...props }, ref) => {
  const navigateHook = useNavigate();
  const activeBg = useColorModeValue('brand.100', 'brand.700'); // Daha belirgin aktif arkaplan
  const activeColor = useColorModeValue('brand.700', 'brand.100');
  const hoverBg = useColorModeValue('gray.100', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  return (
    <NavLink to={to} ref={ref} {...props} end>
       {({ isActive }) => (
          <Button
            variant="ghost"
            justifyContent="flex-start"
            w="full"
            onClick={() => { onClose(); navigateHook(to);}}
            isActive={isActive}
            leftIcon={icon ? <Icon as={icon} boxSize={5} /> : undefined}
            bg={isActive ? activeBg : 'transparent'}
            color={isActive ? activeColor : textColor}
            _hover={{ bg: hoverBg, color: isActive ? activeColor : useColorModeValue('brand.600', 'brand.300')}} // Hover'da da renk değişimi
            px={4} // Artırılmış padding
            py={3} // Artırılmış padding
            borderRadius="md"
            fontSize="md" // Font boyutu sabit
            fontWeight="medium" // Font ağırlığı sabit
          >
            {children}
          </Button>
       )}
    </NavLink>
  );
});

function Layout() {
  const borderColor = useColorModeValue('gray.200', 'gray.700'); // gray.600'dan gray.700'e (koyu mod için)
  const headingColor = useColorModeValue('gray.800', 'whiteAlpha.900');
  const textMutedColor = useColorModeValue('gray.500', 'gray.400');
  const { isAuthenticated, user, logout, token: authToken } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen: isMobileMenuOpen, onOpen: onMobileMenuOpen, onClose: onMobileMenuClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();

  const {
    isSupported: isPushSupported,
    isSubscribed: isUserSubscribedToPush,
    subscribeUser: subscribeToPush,
    unsubscribeUser: unsubscribeFromPush,
    permission: pushPermission,
    isCheckingSubscription: isCheckingPushSubscription,
    requestPermissionAgain
  } = usePushNotifications();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const { isOpen: isNotificationPanelOpen, onOpen: onNotificationPanelOpen, onClose: onNotificationPanelClose } = useDisclosure();

  const handleLogout = async () => {
    logout();
    onMobileMenuClose();
    navigate('/');
  };

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !authToken) return;
    setIsLoadingNotifications(true);
    try {
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      const response = await axios.get(`${API_BASE_URL}/api/notifications/my-notifications`, config);
      const fetchedNotifs = Array.isArray(response.data.notifications) ? response.data.notifications : [];
      setNotifications(fetchedNotifs);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error("In-app bildirimler çekilirken hata:", error);
      toast({ title: "Bildirim Hatası", description: "Bildirimleriniz yüklenirken bir sorun oluştu.", status: "warning", duration: 3000, isClosable: true, position: "top-right" });
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [isAuthenticated, authToken, toast]);

  useEffect(() => {
    let intervalId = null;
    if (isAuthenticated) {
      fetchNotifications();
      // intervalId = setInterval(fetchNotifications, 30000); 
    } else {
        setNotifications([]);
        setUnreadCount(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAuthenticated, fetchNotifications]);

  const [pushAttempted, setPushAttempted] = useState(false);

  useEffect(() => {
    if ( isAuthenticated && isPushSupported && pushPermission === 'granted' &&
      !isUserSubscribedToPush && !isCheckingPushSubscription && !pushAttempted ) {
      setPushAttempted(true);
      subscribeToPush().then(success => {
        if (success) {
          toast({ title: "Başarılı!", description: "Artık önemli gelişmelerden anında haberdar olacaksınız.", status: "success", duration: 3000 });
        }
      });
    }
  }, [ isAuthenticated, isPushSupported, pushPermission, isUserSubscribedToPush, isCheckingPushSubscription, pushAttempted, subscribeToPush, toast ]);

  const handleTogglePushSubscription = async () => {
    if (isCheckingPushSubscription) return;
    if (pushPermission === 'denied') {
        toast({ title: "İzin Gerekli", description: "Push bildirimlerine tarayıcı ayarlarınızdan izin vermeniz gerekmektedir.", status: "warning", duration: 5000, isClosable: true, });
        return;
    }
    if (pushPermission === 'default') {
        const permissionResult = await requestPermissionAgain();
        if (permissionResult !== 'granted') return;
        return;
    }
    if (isUserSubscribedToPush) {
      const success = await unsubscribeFromPush();
      if (success) toast({ title: "Abonelikten Çıkıldı", description: "Push bildirimleri artık gönderilmeyecek.", status: "info", duration: 3000 });
    } else {
      const success = await subscribeToPush();
      if (success) toast({ title: "Abone Olundu!", description: "Push bildirimlerine başarıyla abone oldunuz.", status: "success", duration: 3000 });
    }
  };

  const markAsRead = async (notificationId) => {
    const originalNotifications = [...notifications];
    const originalUnreadCount = unreadCount;
    const targetNotification = originalNotifications.find(n => n.id === notificationId);
    const wasAlreadyRead = targetNotification ? targetNotification.isRead : true;

    setNotifications(prev => prev.map(n => n.id === notificationId ? {...n, isRead: true} : n));
    if (!wasAlreadyRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
        await axios.post(`${API_BASE_URL}/api/notifications/${notificationId}/mark-as-read`, {}, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
    } catch (error) {
        console.error("Bildirim okundu olarak işaretlenirken hata:", error);
        toast({ title: "Hata", description: "Bildirim okundu olarak işaretlenemedi. Lütfen tekrar deneyin.", status: "error", duration: 3000 });
        setNotifications(originalNotifications); 
        setUnreadCount(originalUnreadCount);
    }
  };

  const markAllAsRead = async () => {
    const originalNotifications = [...notifications];
    const originalUnreadCount = unreadCount;
    setNotifications(prev => prev.map(n => ({...n, isRead: true})));
    setUnreadCount(0);
    try {
        await axios.post(`${API_BASE_URL}/api/notifications/mark-all-as-read`, {}, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
    } catch (error) {
        console.error("Tüm bildirimler okundu olarak işaretlenirken hata:", error);
        toast({ title: "Hata", description: "Bildirimler okundu olarak işaretlenemedi.", status: "error", duration: 3000 });
        setNotifications(originalNotifications); 
        setUnreadCount(originalUnreadCount);
    }
  };

  const headerBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)'); // Daha belirgin transparanlık
  const textColorPrimary = useColorModeValue('gray.800', 'whiteAlpha.900');
  const textColorSecondary = useColorModeValue('gray.600', 'gray.400');
  const accentColor = useColorModeValue('brand.500', 'brand.300');
  const iconButtonHoverBg = useColorModeValue('gray.200', 'gray.700');
  const notificationItemHoverBg = useColorModeValue('gray.100', 'gray.600'); // Koyu mod için biraz daha koyu
  const mobileDrawerBg = useColorModeValue('white', 'gray.800');

  return (
    <Flex direction="column" minH="100vh" bg={useColorModeValue('gray.100', 'gray.900')}> {/* Ana arkaplan */}
      <Box
        as="header"
        bg={headerBg}
        borderBottomWidth="1px"
        borderColor={borderColor}
        boxShadow="md"
        py={3}
        px={{ base: 3, md: 6 }}
        position="sticky"
        top={0}
        zIndex="sticky" // Chakra'da banner yerine sticky daha yaygın
        sx={{ backdropFilter: 'blur(10px)'}} // Blur efekti
      >
        <Container maxW="container.xl"> {/* Genişletildi */}
          <Flex alignItems="center" justifyContent="space-between" gap={{base:1, md:4}}>
            <Link
              as={RouterLink}
              to={isAuthenticated ? "/dashboard" : "/"}
              fontSize={{base: "xl", md: "2xl"}} // Biraz büyütüldü
              fontWeight="bold"
              color={accentColor} // Logo için vurgu rengi
              _hover={{ textDecoration: 'none', opacity: 0.8 }}
              fontFamily="Poppins, sans-serif" // Temadan gelen font veya özel font
              letterSpacing="tight"
            >
              mikRobiyoloji<Text as="span" color={textColorPrimary} fontWeight="light">Platform</Text>
            </Link>

            <HStack as="nav" spacing={{base:2, md:4}} display={{ base: 'none', lg: 'flex' }} flexGrow={1} justifyContent="center">
              <CustomNavLink to="/browse" icon={FiGrid}>Konu Tarayıcı</CustomNavLink>
              {isAuthenticated && (
                <CustomNavLink to="/dashboard" icon={FiCpu}>Dijital Mentor</CustomNavLink>
              )}
              {isAuthenticated && (
                <CustomNavLink to="/digital-coach" icon={FiRepeat}>Dijital Antrenör</CustomNavLink>
              )}
              {isAuthenticated && (
                <CustomNavLink to="/solve" icon={FaPencilAlt}>Soru Çöz</CustomNavLink>
              )}
              {isAuthenticated && user?.role === 'admin' && (
                <CustomNavLink to="/admin" icon={FaCog}>Yönetim</CustomNavLink>
              )}
            </HStack>

            <HStack spacing={{base:1, sm:1.5, md:2}} alignItems="center">
              <IconButton
                  size="md" variant="ghost" onClick={toggleColorMode}
                  aria-label="Temayı Değiştir" title={colorMode === 'light' ? 'Koyu Tema' : 'Açık Tema'}
                  icon={colorMode === 'light' ? <Icon as={FaMoon} boxSize={5}/> : <Icon as={FaSun} boxSize={5}/>}
                  color={textColorSecondary} _hover={{bg: iconButtonHoverBg, color: accentColor}}
                  borderRadius="full" // Daha yuvarlak
              />

              {isAuthenticated && (
                <Menu isOpen={isNotificationPanelOpen} onClose={onNotificationPanelClose} placement="bottom-end" >
                  <MenuButton
                    as={IconButton}
                    icon={ /* ... (Bildirim ikonu ve badge aynı kalabilir) ... */ 
                        <Box position="relative" p="2px">
                            <Icon as={unreadCount > 0 ? FaBell : FaRegBell} boxSize={5} />
                            {unreadCount > 0 && (
                            <Badge
                                colorScheme="red" variant="solid" borderRadius="full"
                                boxSize="18px" fontSize="0.7em" position="absolute"
                                top="-7px" right="-7px" display="flex"
                                alignItems="center" justifyContent="center" boxShadow="md"
                                lineHeight="1"
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </Badge>
                            )}
                        </Box>
                    }
                    variant="ghost" aria-label="Bildirimler" title="Bildirimler"
                    onClick={onNotificationPanelOpen} color={textColorSecondary}
                    _hover={{bg: iconButtonHoverBg, color: accentColor}} size="md"
                    borderRadius="full"
                  />
                  <MenuList zIndex="popover" boxShadow="xl" borderColor={borderColor} minW={{base:"300px", sm:"360px", md:"420px"}} maxH="70vh" overflowY="auto" bg={useColorModeValue("white", "gray.700")}>
                    {/* ... (MenuList içeriği aynı, sadece bg eklendi) ... */}
                    <Flex justifyContent="space-between" alignItems="center" px={4} py={3} borderBottomWidth="1px" borderColor={borderColor}>
                        <Heading size="sm" color={headingColor}>Bildirimler</Heading>
                        {notifications.length > 0 && unreadCount > 0 && (
                            <Button size="xs" variant="link" colorScheme="blue" onClick={markAllAsRead} fontWeight="medium">Tümünü Okundu İşaretle</Button>
                        )}
                    </Flex>
                    {isLoadingNotifications ? (
                      <Center py={8}><Spinner size="lg" color="brand.500"/></Center>
                    ) : notifications.length === 0 ? (
                      <Text px={4} py={6} color={textMutedColor} fontSize="sm" textAlign="center">Yeni bildiriminiz bulunmuyor.</Text>
                    ) : (
                      notifications.map(notif => (
                        <MenuItem 
                            key={notif.id} 
                            onClick={() => {
                                if (notif.link) navigate(notif.link);
                                if (!notif.isRead) markAsRead(notif.id);
                                onNotificationPanelClose();
                            }}
                            bg={!notif.isRead ? useColorModeValue("blue.50", "rgba(49,130,206,0.15)") : "transparent"}
                            _hover={{ bg: notificationItemHoverBg }}
                            py={3} px={4} whiteSpace="normal" 
                            alignItems="flex-start" 
                            borderRadius="md" 
                            my={1} mx={1} 
                        >
                          <VStack align="flex-start" spacing={0.5} w="full">
                            {notif.title && <Text fontWeight="semibold" fontSize="sm" color={textColorPrimary} noOfLines={2}>{notif.title}</Text>}
                            <Text fontSize="xs" color={textColorSecondary} noOfLines={3}>{notif.message}</Text>
                            <Text fontSize="2xs" color={textMutedColor} mt={1}>{new Date(notif.createdAt).toLocaleString('tr-TR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</Text>
                          </VStack>
                        </MenuItem>
                      ))
                    )}
                    {notifications.length > 5 && ( 
                        <>
                            <MenuDivider borderColor={borderColor}/>
                            <MenuItem onClick={() => { navigate('/notifications'); onNotificationPanelClose(); }} justifyContent="center" color="brand.500" fontWeight="medium" py={3}>
                                Tüm Bildirimleri Gör
                            </MenuItem>
                        </>
                    )}
                  </MenuList>
                </Menu>
              )}

              {isAuthenticated ? (
                <Menu placement="bottom-end">
                  <MenuButton
                    as={IconButton}
                    icon={<Avatar size={'sm'} name={user?.username} src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=random&color=fff&size=128&font-size=0.5&bold=true`} />}
                    rounded={'full'} variant={'ghost'} cursor={'pointer'} minW={0} aria-label="Kullanıcı Menüsü"
                     _hover={{bg: iconButtonHoverBg, boxShadow: "md"}} // Hafif gölge
                  />
                  <MenuList zIndex="popover" boxShadow="xl" borderColor={borderColor} bg={useColorModeValue("white", "gray.700")}>
                    <Text px={4} py={2} fontSize="sm" fontWeight="semibold" color={headingColor}>Merhaba, {user?.username}</Text>
                    <MenuDivider borderColor={borderColor}/>
                    <MenuItem onClick={() => navigate('/profile')} icon={<Icon as={FiUser}/>}>Profilim</MenuItem>
                    <MenuItem onClick={() => navigate('/settings')} icon={<Icon as={FiSettings}/>}>Ayarlar</MenuItem>
                    <MenuDivider borderColor={borderColor}/>
                     <MenuItem 
                        onClick={handleTogglePushSubscription} 
                        icon={<Icon as={isUserSubscribedToPush ? FiBellOff : FaBell} color={isUserSubscribedToPush ? "red.500" : "green.500"}/>}
                        isDisabled={!isPushSupported || isCheckingPushSubscription}
                        closeOnSelect={pushPermission !== 'default'}
                    >
                        {isCheckingPushSubscription && <Spinner size="xs" mr={2}/>}
                        Push Bildirimleri {isUserSubscribedToPush ? 'Kapat' : 'Aç'}
                    </MenuItem>
                    {pushPermission === 'denied' && !isUserSubscribedToPush && (
                        <Text fontSize="xs" color="red.500" px={4} py={1}>Tarayıcıdan bildirim izni gerekli.</Text>
                    )}
                    <MenuDivider borderColor={borderColor}/>
                    <MenuItem onClick={handleLogout} icon={<Icon as={FiLogOut}/>} color="red.400" _hover={{bg: useColorModeValue("red.50", "red.700"), color: "red.500"}}>Çıkış Yap</MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <HStack spacing={3} display={{ base: 'none', md: 'flex' }}>
                  <Button as={RouterLink} to="/login" variant="ghost" size="sm" colorScheme="blue" fontWeight="medium" letterSpacing="0.5px">GİRİŞ YAP</Button>
                  <Button as={RouterLink} to="/register" colorScheme="brand" size="sm" fontWeight="semibold" letterSpacing="0.5px" boxShadow="sm" _hover={{boxShadow:"md"}}>KAYIT OL</Button>
                </HStack>
              )}
              <IconButton
                display={{ base: 'flex', lg: 'none' }} onClick={onMobileMenuOpen}
                icon={isMobileMenuOpen ? <Icon as={FaTimes} boxSize={5}/> : <Icon as={FaBars} boxSize={5}/>}
                aria-label="Menüyü Aç" variant="ghost" color={textColorSecondary}
                _hover={{bg: iconButtonHoverBg, color: accentColor}} size="md"
                borderRadius="md"
              />
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Drawer isOpen={isMobileMenuOpen} onClose={onMobileMenuClose} size="full">
        <DrawerOverlay bg="blackAlpha.400"/> {/* Daha koyu overlay */}
        <DrawerContent bg={mobileDrawerBg}>
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor} py={4}> {/* Daha fazla padding */}
            <Flex justify="space-between" align="center">
                <Text fontWeight="bold" color={textColorPrimary} fontSize="xl">Menü</Text>
                <DrawerCloseButton position="static" size="lg" />
            </Flex>
          </DrawerHeader>
          <DrawerBody display="flex" flexDirection="column" p={5} mt={2}> {/* Artırılmış padding */}
            <VStack as="nav" spacing={3} alignItems="stretch" flexGrow={1}>
               <CustomMobileNavLink to="/browse" onClose={onMobileMenuClose} icon={FiGrid}>Konu Tarayıcı</CustomMobileNavLink>
               {isAuthenticated && (
                 <CustomMobileNavLink to="/dashboard" onClose={onMobileMenuClose} icon={FiCpu}>Dijital Mentor</CustomMobileNavLink>
               )}
               {isAuthenticated && (
                 <CustomMobileNavLink to="/digital-coach" onClose={onMobileMenuClose} icon={FiRepeat}>Dijital Antrenör</CustomMobileNavLink>
               )}
               {isAuthenticated && (
                 <CustomMobileNavLink to="/solve" onClose={onMobileMenuClose} icon={FaPencilAlt}>Soru Çöz</CustomMobileNavLink>
               )}
               {isAuthenticated && user?.role === 'admin' && (
                 <CustomMobileNavLink to="/admin" onClose={onMobileMenuClose} icon={FaCog}>Yönetim</CustomMobileNavLink>
               )}
            </VStack>

            <VStack spacing={4} alignItems="stretch" py={5} mt="auto"> {/* mt="auto" ile alta yasla */}
              <Divider borderColor={borderColor}/>
                <Flex justifyContent="space-between" alignItems="center" px={2} py={1}>
                     <Text fontSize="md" color={textMutedColor}>Tema</Text>
                     <IconButton
                         size="md" variant="ghost" onClick={toggleColorMode}
                         aria-label="Temayı Değiştir" icon={colorMode === 'light' ? <Icon as={FaMoon} /> : <Icon as={FaSun} />}
                         borderRadius="full"
                     />
                 </Flex>
                 {isAuthenticated && isPushSupported && (
                    <Button 
                        onClick={handleTogglePushSubscription} 
                        leftIcon={<Icon as={isUserSubscribedToPush ? FiBellOff : FaBell} />}
                        variant="ghost" colorScheme={isUserSubscribedToPush ? "red" : "green"}
                        size="lg" isLoading={isCheckingPushSubscription} w="full" justifyContent="flex-start"
                    >
                         Push Bildirimleri {isUserSubscribedToPush ? 'Kapat' : 'Aç'}
                    </Button>
                 )}
                  {pushPermission === 'denied' && !isUserSubscribedToPush && (
                    <Text fontSize="sm" color="red.400" textAlign="center" px={2}>Tarayıcı ayarlarından bildirim izni gerekli.</Text>
                  )}
             <Divider borderColor={borderColor}/>
            </VStack>
            
            {isAuthenticated ? (
              <VStack spacing={2} alignItems="stretch" >
                 <CustomMobileNavLink to="/profile" onClose={onMobileMenuClose} icon={FiUser}>Profilim</CustomMobileNavLink>
                 <CustomMobileNavLink to="/settings" onClose={onMobileMenuClose} icon={FiSettings}>Ayarlar</CustomMobileNavLink>
                 <Button onClick={handleLogout} colorScheme="red" variant="ghost" justifyContent="flex-start" leftIcon={<Icon as={FiLogOut} />} w="full" px={4} py={3} borderRadius="md" fontSize="md" fontWeight="medium">Çıkış Yap</Button>
              </VStack>
            ) : (
              <VStack spacing={4} mt={6}>
                <Button as={RouterLink} to="/login" variant="outline" colorScheme="blue" w="full" onClick={onMobileMenuClose} leftIcon={<Icon as={FaSignInAlt} />} size="lg" py={6}>GİRİŞ YAP</Button>
                <Button as={RouterLink} to="/register" colorScheme="brand" w="full" onClick={onMobileMenuClose} leftIcon={<Icon as={FaUserPlus} />} size="lg" py={6}>KAYIT OL</Button>
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Box as="main" flex="1" py={{base:4, md:8}} px={{base:2, md:4}}> {/* Ana içerik alanı için padding */}
        <Outlet />
      </Box>
      
      <InstallPrompt /> {/* PWA Yükleme Butonu */}
    </Flex>
  );
}

export default Layout;
