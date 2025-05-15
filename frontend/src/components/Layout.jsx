import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Link as RouterLink, NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import InstallPrompt from './InstallPrompt';
import usePushNotifications from '../hooks/usePushNotifications'; // Yeni Hook'u import et
import {
  Box,
  Flex,
  Center,
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
  MenuDivider, // MenuDivider eklendi
  Badge, // Bildirim sayısı için
  useToast, // Bildirim işlemleri için
  useColorModeValue,
  Spinner, // Bildirim yüklenirken
  Avatar // Kullanıcı menüsü için
} from '@chakra-ui/react';
import { 
  FaSignInAlt, FaUserPlus, FaSignOutAlt, FaFolder, FaUserGraduate, FaPencilAlt, FaSun, FaMoon, FaBars, FaTimes, 
  FaBell, FaRegBell, FaCog, FaUserCircle // Yeni ikonlar
} from 'react-icons/fa';
import { FiLogOut, FiUser, FiSettings, FiBellOff } from 'react-icons/fi';


const API_BASE_URL = import.meta.env.VITE_API_URL;

const CustomNavLink = React.forwardRef(({ children, to, ...props }, ref) => {
  return (
    <NavLink to={to} ref={ref} {...props}>
      {({ isActive }) => (
        <Link
          as="span"
          fontWeight={isActive ? 'semibold' : 'medium'}
          color={isActive ? useColorModeValue('brand.600', 'brand.300') : useColorModeValue('gray.600', 'gray.300')}
          py={2}
          px={1}
          position="relative"
          _hover={{
            textDecoration: 'none',
            color: useColorModeValue('brand.500', 'brand.200'),
            _after: { transform: 'scaleX(1)', transformOrigin: 'bottom left' },
          }}
          _after={{
            content: '""',
            position: 'absolute',
            width: '100%',
            height: '2px',
            bottom: '-2px', // Çizgiyi biraz aşağı al
            left: 0,
            bg: useColorModeValue('brand.500', 'brand.300'),
            transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin: 'bottom center', // Ortadan başlasın
            transition: 'transform .25s ease-out',
          }}
        >
          {children}
        </Link>
      )}
    </NavLink>
  );
});

const CustomMobileNavLink = React.forwardRef(({ children, to, onClose, icon, ...props }, ref) => {
  const location = useNavigate(); // useNavigate hook'u direkt NavLink içinde kullanılamaz, bu yüzden onClick ile
  return (
    <NavLink to={to} ref={ref} {...props} end> 
       {({ isActive }) => (
          <Button
            variant="ghost"
            justifyContent="flex-start"
            w="full"
            onClick={() => { onClose(); location(to);}} // navigate import et
            isActive={isActive}
            leftIcon={icon ? <Icon as={icon} /> : undefined}
            bg={isActive ? useColorModeValue('brand.100', 'brand.700') : 'transparent'}
            color={isActive ? useColorModeValue('brand.700', 'brand.100') : undefined}
            _hover={{ bg: useColorModeValue('gray.100', 'gray.700')}}
            px={4} py={3} borderRadius="md"
          >
            {children}
          </Button>
       )}
    </NavLink>
  );
});


function Layout() {
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const headingColor = useColorModeValue('gray.700', 'gray.100');
  const textMutedColor = useColorModeValue('gray.500', 'gray.400');
  const { isAuthenticated, user, logout, token: authToken } = useAuth(); // authToken olarak yeniden adlandırdık
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen: isMobileMenuOpen, onOpen: onMobileMenuOpen, onClose: onMobileMenuClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();

  // Push Bildirim Hook'u
  const {
    isSupported: isPushSupported,
    isSubscribed: isUserSubscribedToPush,
    subscribeUser: subscribeToPush,
    unsubscribeUser: unsubscribeFromPush,
    permission: pushPermission,
    isCheckingSubscription: isCheckingPushSubscription,
    requestPermissionAgain
  } = usePushNotifications();

  // In-App Bildirimler için State'ler
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const { isOpen: isNotificationPanelOpen, onOpen: onNotificationPanelOpen, onClose: onNotificationPanelClose } = useDisclosure();

  const handleLogout = async () => {
    if (isUserSubscribedToPush) {
        // Opsiyonel: Çıkış yaparken push aboneliğini sonlandır
        // await unsubscribeFromPush(); 
    }
    logout();
    onMobileMenuClose();
    navigate('/'); // Ana sayfaya yönlendir
  };

  // In-App Bildirimleri Çekme
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
      // toast({ title: "Bildirim Hatası", description: "Bildirimler yüklenemedi.", status: "error", duration: 3000, isClosable: true });
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [isAuthenticated, authToken]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Bildirimleri periyodik olarak çekmek için interval (opsiyonel)
      // const intervalId = setInterval(fetchNotifications, 60000); // Her dakika
      // return () => clearInterval(intervalId);
    } else {
        setNotifications([]);
        setUnreadCount(0);
    }
  }, [isAuthenticated, fetchNotifications]);

  const [pushAttempted, setPushAttempted] = useState(false); // Eklenmeli

  useEffect(() => {
    if (
      isAuthenticated &&
      isPushSupported &&
      pushPermission === 'granted' &&
      !isUserSubscribedToPush &&
      !isCheckingPushSubscription &&
      !pushAttempted
    ) {
      console.log("📢 Push aboneliği için uygun durum, abone olunuyor...");
      setPushAttempted(true); // Tek seferlik deneme işareti
  
      subscribeToPush().then(success => {
        if (success) {
          toast({
            title: "Başarılı",
            description: "Push bildirimlerine abone oldunuz.",
            status: "success",
            duration: 3000,
          });
        } else {
          // Abonelik başarısızsa tekrar deneme açılabilir (isteğe bağlı)
          // setPushAttempted(false);
        }
      });
    }
  }, [
    isAuthenticated,
    isPushSupported,
    pushPermission,
    isUserSubscribedToPush,
    isCheckingPushSubscription,
    pushAttempted, // Yeni eklendi
    subscribeToPush,
    toast
  ]);

  const handleTogglePushSubscription = async () => {
    if (isCheckingPushSubscription) return;

    if (pushPermission === 'denied') {
        toast({
            title: "İzin Gerekli",
            description: "Push bildirimlerine tarayıcı ayarlarınızdan izin vermeniz gerekmektedir.",
            status: "warning",
            duration: 5000,
            isClosable: true,
        });
        return;
    }
    if (pushPermission === 'default') {
        const permissionResult = await requestPermissionAgain();
        if (permissionResult !== 'granted') return; // İzin verilmediyse çık
    }

    if (isUserSubscribedToPush) {
      const success = await unsubscribeFromPush();
      if (success) toast({ title: "Başarılı", description: "Push bildirim aboneliğinden çıktınız.", status: "info", duration: 3000 });
      // else toast({ title: "Hata", description: "Abonelikten çıkılırken sorun oluştu.", status: "error", duration: 3000 });
    } else {
      const success = await subscribeToPush();
      if (success) toast({ title: "Başarılı", description: "Push bildirimlerine abone oldunuz.", status: "success", duration: 3000 });
      // else toast({ title: "Hata", description: "Abone olunurken sorun oluştu.", status: "error", duration: 3000 });
    }
  };


  const markAsRead = async (notificationId) => {
    // Bildirimi UI'da hemen okundu olarak işaretle (optimistic update)
    setNotifications(prev => prev.map(n => n.id === notificationId ? {...n, isRead: true} : n));
    setUnreadCount(prev => Math.max(0, prev -1));

    try {
        await axios.post(`${API_BASE_URL}/api/notifications/${notificationId}/mark-as-read`, {}, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        // fetchNotifications(); // Listeyi yeniden çekmeye gerek yok, UI güncellendi.
    } catch (error) {
        console.error("Bildirim okundu olarak işaretlenirken hata:", error);
        toast({ title: "Hata", description: "Bildirim okundu olarak işaretlenemedi.", status: "error", duration: 2000 });
        // Optimistic update'i geri alabiliriz, ancak genellikle gerekmez.
        fetchNotifications(); // Hata durumunda listeyi senkronize et
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({...n, isRead: true})));
    setUnreadCount(0);
    try {
        await axios.post(`${API_BASE_URL}/api/notifications/mark-all-as-read`, {}, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        // fetchNotifications();
    } catch (error) {
        console.error("Tüm bildirimler okundu olarak işaretlenirken hata:", error);
        toast({ title: "Hata", description: "Bildirimler okundu olarak işaretlenemedi.", status: "error", duration: 2000 });
        fetchNotifications();
    }
  };

  // ----- RENDER KISMI -----
  const headerBg = useColorModeValue('white', 'gray.800');
  const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
  const mobileDrawerBg = useColorModeValue('white', 'gray.800');
  const textColorPrimary = useColorModeValue('gray.700', 'gray.200');
  const textColorSecondary = useColorModeValue('gray.500', 'gray.400');
  const accentColor = useColorModeValue('brand.500', 'brand.300');
  const iconButtonHoverBg = useColorModeValue('gray.100', 'gray.700');
  const notificationItemHoverBg = useColorModeValue('gray.50', 'gray.700');


  return (
    <Flex direction="column" minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Box
        as="header"
        bg={headerBg}
        borderBottomWidth="1px"
        borderColor={headerBorderColor}
        boxShadow="sm"
        py={3}
        px={{ base: 4, md: 6 }}
        position="sticky"
        top={0}
        zIndex="sticky"
      >
        <Container maxW="container.xl">
          <Flex alignItems="center" justifyContent="space-between" gap={2}>
            <Link
              as={RouterLink}
              to={isAuthenticated ? "/dashboard" : "/"}
              fontSize={{base: "lg", md: "xl"}}
              fontWeight="bold"
              color={textColorPrimary}
              _hover={{ textDecoration: 'none', color: accentColor }}
              flexShrink={0}
            >
              mikRobiyoloji
            </Link>

            <HStack as="nav" spacing={{base:3, md:5}} display={{ base: 'none', lg: 'flex' }} flexGrow={1} justifyContent="center">
              <CustomNavLink to="/browse">Konu Tarayıcı</CustomNavLink>
              {isAuthenticated && (
                <CustomNavLink to="/dashboard">Dijital Mentor</CustomNavLink>
              )}
              {isAuthenticated && (
                <CustomNavLink to="/solve">Soru Çöz</CustomNavLink>
              )}
              {isAuthenticated && user?.role === 'admin' && (
                <CustomNavLink to="/admin">Yönetim Paneli</CustomNavLink>
              )}
            </HStack>

            <HStack spacing={{base:1, md:2}} alignItems="center">
              <IconButton
                  size="md"
                  variant="ghost"
                  onClick={toggleColorMode}
                  aria-label="Temayı Değiştir"
                  title={colorMode === 'light' ? 'Koyu Tema' : 'Açık Tema'}
                  icon={colorMode === 'light' ? <Icon as={FaMoon} /> : <Icon as={FaSun} />}
                  color={textColorSecondary}
                  _hover={{bg: iconButtonHoverBg, color: accentColor}}
              />

              {isAuthenticated && (
                <Menu isOpen={isNotificationPanelOpen} onClose={onNotificationPanelClose} placement="bottom-end">
                  <MenuButton
                    as={IconButton}
                    icon={
                        <Box position="relative">
                            <Icon as={unreadCount > 0 ? FaBell : FaRegBell} boxSize={5} />
                            {unreadCount > 0 && (
                            <Badge
                                colorScheme="red"
                                variant="solid"
                                borderRadius="full"
                                boxSize="18px"
                                fontSize="0.7em"
                                position="absolute"
                                top="-5px"
                                right="-8px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                boxShadow="md"
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </Badge>
                            )}
                        </Box>
                    }
                    variant="ghost"
                    aria-label="Bildirimler"
                    title="Bildirimler"
                    onClick={onNotificationPanelOpen}
                    color={textColorSecondary}
                    _hover={{bg: iconButtonHoverBg, color: accentColor}}
                    size="md"
                  />
                  <MenuList zIndex="popover" boxShadow="xl" borderColor={borderColor} minW={{base:"300px", md:"400px"}} maxH="400px" overflowY="auto">
                    <Flex justifyContent="space-between" alignItems="center" px={4} py={2} borderBottomWidth="1px" borderColor={borderColor}>
                        <Heading size="sm" color={headingColor}>Bildirimler</Heading>
                        {notifications.length > 0 && unreadCount > 0 && (
                            <Button size="xs" variant="link" colorScheme="blue" onClick={markAllAsRead}>Tümünü Okundu İşaretle</Button>
                        )}
                    </Flex>
                    {isLoadingNotifications ? (
                      <Center py={6}><Spinner size="md" color="brand.500"/></Center>
                    ) : notifications.length === 0 ? (
                      <Text px={4} py={3} color={textMutedColor} fontSize="sm">Yeni bildiriminiz bulunmuyor.</Text>
                    ) : (
                      notifications.map(notif => (
                        <MenuItem 
                            key={notif.id} 
                            onClick={() => {
                                if (notif.link) navigate(notif.link);
                                if (!notif.isRead) markAsRead(notif.id);
                                onNotificationPanelClose();
                            }}
                            bg={!notif.isRead ? useColorModeValue("blue.50", "rgba(49,130,206,0.1)") : "transparent"}
                            _hover={{ bg: notificationItemHoverBg }}
                            py={3}
                            px={4}
                            whiteSpace="normal" // Uzun mesajlar için
                        >
                          <VStack align="flex-start" spacing={1} w="full">
                            {notif.title && <Text fontWeight="semibold" fontSize="sm" color={textColorPrimary} noOfLines={1}>{notif.title}</Text>}
                            <Text fontSize="xs" color={textColorSecondary} noOfLines={2}>{notif.message}</Text>
                            <Text fontSize="2xs" color={textMutedColor}>{new Date(notif.createdAt).toLocaleString('tr-TR', { dateStyle:'short', timeStyle:'short'})}</Text>
                          </VStack>
                        </MenuItem>
                      ))
                    )}
                    {notifications.length > 0 && (
                        <>
                            <MenuDivider borderColor={borderColor}/>
                            <MenuItem onClick={() => { navigate('/notifications'); onNotificationPanelClose(); }} justifyContent="center" color="brand.500" fontWeight="medium" py={2}>
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
                    as={Button}
                    rounded={'full'}
                    variant={'link'}
                    cursor={'pointer'}
                    minW={0}
                    aria-label="Kullanıcı Menüsü"
                    px={1}
                    py={1}
                  >
                    <Avatar
                      size={'sm'}
                      name={user?.username}
                      src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${user?.username}&background=random&size=128`} // Veya varsayılan bir ikon
                      bg={useColorModeValue("gray.200", "gray.600")}
                      color={textColorPrimary}
                    />
                  </MenuButton>
                  <MenuList zIndex="popover" boxShadow="xl" borderColor={borderColor}>
                    <MenuItem onClick={() => navigate('/profile')} icon={<Icon as={FiUser}/>}>Profilim</MenuItem>
                    <MenuItem onClick={() => navigate('/settings')} icon={<Icon as={FiSettings}/>}>Ayarlar</MenuItem>
                    <MenuDivider borderColor={borderColor}/>
                     <MenuItem 
                        onClick={handleTogglePushSubscription} 
                        icon={<Icon as={isUserSubscribedToPush ? FiBellOff : FaBell} />}
                        isDisabled={!isPushSupported || isCheckingPushSubscription}
                        closeOnSelect={false} // Tekrar izin isteme durumunda menü kapanmasın
                    >
                        {isCheckingPushSubscription ? <Spinner size="xs" mr={2}/> : null}
                        Push Bildirimleri {isUserSubscribedToPush ? 'Kapat' : 'Aç'}
                    </MenuItem>
                    {pushPermission === 'denied' && !isUserSubscribedToPush && (
                        <Text fontSize="xs" color="red.500" px={4} py={1}>Tarayıcıdan izin gerekli.</Text>
                    )}
                    <MenuDivider borderColor={borderColor}/>
                    <MenuItem onClick={handleLogout} icon={<Icon as={FiLogOut}/>} color="red.500">Çıkış Yap</MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <HStack spacing={2} display={{ base: 'none', lg: 'flex' }}>
                  <Button as={RouterLink} to="/login" variant="ghost" size="sm" colorScheme="blue">Giriş Yap</Button>
                  <Button as={RouterLink} to="/register" colorScheme="brand" size="sm">Kayıt Ol</Button>
                </HStack>
              )}
              <IconButton
                display={{ base: 'flex', lg: 'none' }}
                onClick={onMobileMenuOpen}
                icon={isMobileMenuOpen ? <Icon as={FaTimes} /> : <Icon as={FaBars} />}
                aria-label="Menüyü Aç"
                variant="ghost"
                color={textColorSecondary}
                _hover={{bg: iconButtonHoverBg, color: accentColor}}
                size="md"
              />
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Drawer isOpen={isMobileMenuOpen} placement="right" onClose={onMobileMenuClose} size="full">
        <DrawerOverlay />
        <DrawerContent bg={mobileDrawerBg}>
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
            <Flex justify="space-between" align="center">
                <Text fontWeight="bold" color={textColorPrimary}>Menü</Text>
                <DrawerCloseButton position="static"/>
            </Flex>
          </DrawerHeader>
          <DrawerBody display="flex" flexDirection="column" p={4}>
            <VStack as="nav" spacing={2} alignItems="stretch" flexGrow={1}>
               <CustomMobileNavLink to="/browse" onClose={onMobileMenuClose} icon={FaFolder}>Konu Tarayıcı</CustomMobileNavLink>
               {isAuthenticated && (
                 <CustomMobileNavLink to="/dashboard" onClose={onMobileMenuClose} icon={FaUserGraduate}>Dijital Mentor</CustomMobileNavLink>
               )}
               {isAuthenticated && (
                 <CustomMobileNavLink to="/solve" onClose={onMobileMenuClose} icon={FaPencilAlt}>Soru Çöz</CustomMobileNavLink>
               )}
               {isAuthenticated && user?.role === 'admin' && (
                 <CustomMobileNavLink to="/admin" onClose={onMobileMenuClose} icon={FaCog}>Yönetim Paneli</CustomMobileNavLink>
               )}
            </VStack>

            <Divider my={4} borderColor={borderColor}/>
            <VStack spacing={4} alignItems="stretch">
                <Flex justifyContent="space-between" alignItems="center">
                     <Text fontSize="sm" color={textMutedColor}>Tema:</Text>
                     <IconButton
                         size="sm" variant="ghost"
                         onClick={() => { toggleColorMode(); }}
                         aria-label="Temayı Değiştir"
                         icon={colorMode === 'light' ? <Icon as={FaMoon} /> : <Icon as={FaSun} />}
                     />
                 </Flex>
                 {isAuthenticated && isPushSupported && (
                    <Button 
                        onClick={handleTogglePushSubscription} 
                        leftIcon={<Icon as={isUserSubscribedToPush ? FiBellOff : FaBell} />}
                        variant="outline"
                        colorScheme={isUserSubscribedToPush ? "red" : "green"}
                        size="sm"
                        isLoading={isCheckingPushSubscription}
                        w="full"
                    >
                         Push Bildirimleri {isUserSubscribedToPush ? 'Kapat' : 'Aç'}
                    </Button>
                 )}
                  {pushPermission === 'denied' && !isUserSubscribedToPush && (
                    <Text fontSize="xs" color="red.400" textAlign="center">Push bildirimlerine tarayıcı ayarlarından izin vermelisiniz.</Text>
                  )}
            </VStack>
            <Divider my={4} borderColor={borderColor}/>

            {isAuthenticated ? (
              <VStack spacing={2} alignItems="stretch">
                 <Button as={RouterLink} to="/profile" variant="ghost" justifyContent="flex-start" onClick={onMobileMenuClose} leftIcon={<Icon as={FiUser} />}>Profilim</Button>
                 <Button as={RouterLink} to="/settings" variant="ghost" justifyContent="flex-start" onClick={onMobileMenuClose} leftIcon={<Icon as={FiSettings} />}>Ayarlar</Button>
                 <Button onClick={handleLogout} colorScheme="red" variant="ghost" justifyContent="flex-start" leftIcon={<Icon as={FiLogOut} />}>Çıkış Yap</Button>
              </VStack>
            ) : (
              <VStack spacing={3} mt={4}>
                <Button as={RouterLink} to="/login" variant="outline" w="full" onClick={onMobileMenuClose} leftIcon={<Icon as={FaSignInAlt} />}>Giriş Yap</Button>
                <Button as={RouterLink} to="/register" colorScheme="brand" w="full" onClick={onMobileMenuClose} leftIcon={<Icon as={FaUserPlus} />}>Kayıt Ol</Button>
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Box as="main" flex="1" py={{base:4, md:8}} px={{base:2, md:4}}>
        <Outlet />
      </Box>
      
      <InstallPrompt />
    </Flex>
  );
}

export default Layout;
