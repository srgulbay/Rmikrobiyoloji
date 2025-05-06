import React from 'react'; // useState, useEffect kaldırıldı
import { Outlet, Link as RouterLink, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Flex,
  Container,
  Button,
  IconButton,
  Link,
  HStack, // Yatay düzen için
  VStack, // Dikey düzen için
  Text,   // Metin için
  useColorMode,
  useDisclosure, // Drawer (mobil menü) için
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Icon, // react-icons kullanımı için
  Spacer, // Boşluk itmek için
  Menu, // Kullanıcı menüsü için (opsiyonel)
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { FaSignInAlt, FaUserPlus, FaSignOutAlt, FaSun, FaMoon, FaBars, FaTimes } from 'react-icons/fa';

// NavLink için özel stil component'i (Aktif durumunu yönetmek için)
const CustomNavLink = React.forwardRef(({ children, to, ...props }, ref) => {
  return (
    <NavLink to={to} ref={ref} {...props}>
      {({ isActive }) => (
        <Link
          as="span" // NavLink'in kendi <a>'sı var, stil için span kullanalım
          fontWeight={isActive ? 'semibold' : 'medium'}
          color={isActive ? 'accent' : 'textSecondary'} // Semantic token kullandık
          py={2}
          position="relative"
          _hover={{
            textDecoration: 'none',
            color: 'textPrimary', // Semantic token
            _after: { transform: 'scaleX(1)', transformOrigin: 'bottom left' },
          }}
          _after={{ // Alt çizgi efekti
            content: '""',
            position: 'absolute',
            width: '100%',
            height: '2px',
            bottom: 0,
            left: 0,
            bg: 'accent', // Semantic token
            transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin: 'bottom right',
            transition: 'transform .25s ease-out',
          }}
        >
          {children}
        </Link>
      )}
    </NavLink>
  );
});

// Mobil NavLink için özel stil component'i
const CustomMobileNavLink = React.forwardRef(({ children, to, onClose, ...props }, ref) => {
  return (
    <NavLink to={to} ref={ref} {...props} >
       {({ isActive }) => (
          <Link
            as="span" // NavLink <a> oluşturduğu için span kullanalım
            display="block"
            onClick={onClose} // Tıklanınca menüyü kapat
            p={3}
            borderRadius="md"
            fontWeight={isActive ? 'semibold' : 'medium'}
            bg={isActive ? 'accent' : 'transparent'} // Semantic token
            color={isActive ? 'white' : 'textSecondary'} // Semantic token
            _hover={{
              textDecoration: 'none',
              bg: isActive ? 'accent' : 'bgTertiary', // Semantic token
              color: isActive ? 'white' : 'textPrimary', // Semantic token
            }}
          >
            {children}
          </Link>
       )}
    </NavLink>
  );
});


function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();
  // Mobil menü (Drawer) için state yönetimi
  const { isOpen: isMobileMenuOpen, onOpen: onMobileMenuOpen, onClose: onMobileMenuClose } = useDisclosure();

  const handleLogout = () => {
    logout();
    onMobileMenuClose(); // Mobil menüyü kapat
  };

  return (
    // Eski .app-layout yerine Flex container
    <Flex direction="column" minH="100vh">
      {/* Eski header.main-header yerine Box */}
      <Box
        as="header"
        bg="bgSecondary" // Semantic token (tema dosyasından gelir)
        borderBottomWidth="1px"
        borderColor="borderPrimary" // Semantic token
        boxShadow="sm" // Temadan gelen shadow
        py={3} // Temadan gelen padding (space.3)
        position="sticky"
        top={0}
        zIndex="sticky" // Temadan gelen z-index
      >
        {/* Eski div.container.header-container yerine Container ve Flex */}
        <Container maxW="container.xl" display="flex" alignItems="center" justifyContent="space-between" gap={6}>
          {/* Eski div.logo yerine Link */}
          <Link
            as={RouterLink} // react-router-dom'dan Link'i kullan
            to="/browse"
            fontSize="xl" // Temadan
            fontWeight="bold"
            color="textPrimary" // Semantic token
            _hover={{ textDecoration: 'none', color: 'accent' }} // Semantic token
            flexShrink={0} // Küçülmesini engelle
          >
            mikRobiyoloji
          </Link>

          {/* Desktop Navigasyon Linkleri */}
          {/* Eski nav.nav-links.desktop-nav yerine HStack */}
          <HStack as="nav" spacing={5} display={{ base: 'none', lg: 'flex' }}> {/* lg breakpoint ve üzeri için göster */}
             <CustomNavLink to="/browse">Konular</CustomNavLink>
            {isAuthenticated && user?.role === 'admin' && (
              <CustomNavLink to="/admin">Yönetim Paneli</CustomNavLink>
            )}
            {isAuthenticated && (
              <CustomNavLink to="/solve">Soru Çöz</CustomNavLink>
            )}
            {isAuthenticated && (
              <CustomNavLink to="/my-stats">İstatistiklerim</CustomNavLink>
            )}
             {isAuthenticated && (
              <CustomNavLink to="/wordle-game">Kelime Oyunu</CustomNavLink>
            )}
          </HStack>

          {/* Sağ Taraf Kontroller */}
          {/* Eski div.header-right-controls yerine Flex */}
          <Flex alignItems="center" gap={2}>
            {/* Tema Değiştirici (Desktop) */}
             {/* Eski div.desktop-nav yerine display prop */}
            <Flex display={{ base: 'none', lg: 'flex' }} alignItems="center">
                <IconButton
                    size="sm"
                    variant="ghost"
                    onClick={toggleColorMode}
                    aria-label="Temayı Değiştir"
                    title={colorMode === 'light' ? 'Koyu Tema' : 'Açık Tema'}
                    icon={colorMode === 'light' ? <Icon as={FaMoon} /> : <Icon as={FaSun} />}
                 />
             </Flex>

            {/* Kullanıcı Menüsü (Desktop) */}
             {/* Eski div.user-menu.desktop-nav yerine display prop */}
            <Flex display={{ base: 'none', lg: 'flex' }} alignItems="center" gap={3}>
              {isAuthenticated ? (
                <>
                   {/* Eski span.user-info yerine Text */}
                  <Text fontSize="sm" color="textMuted" whiteSpace="nowrap" title={`Rol: ${user?.role} / Uzmanlık: ${user?.specialization || 'Belirtilmemiş'}`}>
                    Hoşgeldin, {user?.username || 'Kullanıcı'}!
                  </Text>
                  {/* Eski button yerine IconButton veya Menu */}
                   <IconButton
                     size="sm"
                     variant="ghost"
                     onClick={handleLogout}
                     title="Çıkış Yap"
                     aria-label="Çıkış Yap"
                     icon={<Icon as={FaSignOutAlt} />}
                  />
                  {/* VEYA Chakra Menu Kullanımı:
                   <Menu>
                     <MenuButton as={Button} variant="ghost" size="sm"> {user?.username || 'Kullanıcı'} </MenuButton>
                     <MenuList>
                       <MenuItem onClick={handleLogout}>Çıkış Yap</MenuItem>
                     </MenuList>
                   </Menu>
                  */}
                </>
              ) : (
                <HStack spacing={2}>
                  {/* Eski NavLink butonları yerine Button */}
                  <Button as={RouterLink} to="/login" variant="secondary" size="sm" leftIcon={<Icon as={FaSignInAlt} />}>
                     Giriş Yap
                  </Button>
                  <Button as={RouterLink} to="/register" colorScheme="brand" size="sm" leftIcon={<Icon as={FaUserPlus} />}>
                      Kayıt Ol
                  </Button>
                </HStack>
              )}
            </Flex>

            {/* Hamburger Butonu (Mobile) */}
             {/* Eski button.hamburger-btn yerine IconButton */}
            <IconButton
              display={{ base: 'flex', lg: 'none' }} // Sadece lg altı için göster
              onClick={onMobileMenuOpen}
              icon={isMobileMenuOpen ? <Icon as={FaTimes} /> : <Icon as={FaBars} />}
              aria-label="Menüyü Aç"
              variant="ghost"
            />
          </Flex>
        </Container>
      </Box>

      {/* Mobil Menü (Drawer) */}
      <Drawer isOpen={isMobileMenuOpen} placement="right" onClose={onMobileMenuClose}>
        <DrawerOverlay /> {/* Arka plan karartma */}
        <DrawerContent bg="bgSecondary"> {/* Semantic token */}
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor="borderPrimary">Menü</DrawerHeader>
          <DrawerBody display="flex" flexDirection="column" p={6}>
            {/* Eski nav.mobile-nav-links yerine VStack */}
            <VStack as="nav" spacing={1} alignItems="stretch" mb="auto">
               <CustomMobileNavLink to="/browse" onClose={onMobileMenuClose}>Konular</CustomMobileNavLink>
               {isAuthenticated && user?.role === 'admin' && (
                 <CustomMobileNavLink to="/admin" onClose={onMobileMenuClose}>Yönetim Paneli</CustomMobileNavLink>
               )}
               {isAuthenticated && (
                 <CustomMobileNavLink to="/solve" onClose={onMobileMenuClose}>Soru Çöz</CustomMobileNavLink>
               )}
               {isAuthenticated && (
                 <CustomMobileNavLink to="/my-stats" onClose={onMobileMenuClose}>İstatistiklerim</CustomMobileNavLink>
               )}
               {isAuthenticated && (
                <CustomMobileNavLink to="/wordle-game" onClose={onMobileMenuClose}>Kelime Oyunu</CustomMobileNavLink>
              )}
            </VStack>

            {/* Eski div.mobile-user-menu yerine Box */}
            <Box mt={6} pt={6} borderTopWidth="1px" borderColor="borderSecondary">
                {/* Mobil Tema Değiştirici */}
                <Flex justifyContent="space-between" alignItems="center" mb={4}>
                     <Text fontSize="sm" color="textMuted">Tema:</Text>
                     <IconButton
                         size="sm"
                         variant="ghost"
                         onClick={() => { toggleColorMode(); onMobileMenuClose(); }} // Kapatmayı unutma
                         aria-label="Temayı Değiştir"
                         title={colorMode === 'light' ? 'Koyu Tema' : 'Açık Tema'}
                         icon={colorMode === 'light' ? <Icon as={FaMoon} /> : <Icon as={FaSun} />}
                     />
                 </Flex>

                {/* Mobil Kullanıcı İşlemleri */}
               {isAuthenticated ? (
                 <>
                   <Text fontSize="sm" color="textMuted" textAlign="center" mb={4}> {user?.username || 'Kullanıcı'} ({user?.role}) </Text>
                   <Button onClick={handleLogout} colorScheme="red" variant="ghost" size="sm" w="full" leftIcon={<Icon as={FaSignOutAlt} />}>
                     Çıkış Yap
                   </Button>
                 </>
               ) : (
                 <VStack spacing={3} mt={4}>
                   <Button as={RouterLink} to="/login" variant="secondary" w="full" onClick={onMobileMenuClose} leftIcon={<Icon as={FaSignInAlt} />}>
                     Giriş Yap
                   </Button>
                   <Button as={RouterLink} to="/register" colorScheme="brand" w="full" onClick={onMobileMenuClose} leftIcon={<Icon as={FaUserPlus} />}>
                     Kayıt Ol
                   </Button>
                 </VStack>
               )}
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Eski main.main-content yerine Box */}
      {/* py={8} gibi genel bir padding eklenebilir veya sayfa bazlı yönetilebilir */}
      <Box as="main" flex="1" py={8}>
        <Outlet /> {/* Sayfa içeriği burada render edilecek */}
      </Box>

      {/* Footer (İsteğe bağlı) */}
      {/*
      <Box as="footer" bg="bgSecondary" p={4} mt="auto" borderTopWidth="1px" borderColor="borderPrimary">
        <Container maxW="container.xl">
          <Text textAlign="center" fontSize="sm" color="textMuted">© 2025 Mikrobiyoloji Platformu</Text>
        </Container>
      </Box>
      */}
    </Flex>
  );
}

export default Layout;