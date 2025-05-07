import React from 'react';
import { Outlet, Link as RouterLink, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Flex,
  Container,
  Button,
  IconButton,
  Link,
  HStack,
  VStack,
  Text,
  useColorMode,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Icon,
  Spacer, // Kullanılmıyor gibi, kaldırılabilir
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { FaSignInAlt, FaUserPlus, FaSignOutAlt, FaSun, FaMoon, FaBars, FaTimes } from 'react-icons/fa';

// NavLink için özel stil component'i (Tema ile Uyumlu)
const CustomNavLink = React.forwardRef(({ children, to, ...props }, ref) => {
  return (
    <NavLink to={to} ref={ref} {...props}>
      {({ isActive }) => (
        // Link tema stilini ve semantic token'ları kullanır
        <Link
          as="span"
          fontWeight={isActive ? 'semibold' : 'medium'}
          color={isActive ? 'accent' : 'textSecondary'} // Aktif: accent, değilse textSecondary
          py={2}
          position="relative"
          _hover={{
            textDecoration: 'none',
            color: 'textPrimary', // Hover: textPrimary
            _after: { transform: 'scaleX(1)', transformOrigin: 'bottom left' },
          }}
          _after={{ // Alt çizgi efekti için accent rengi
            content: '""',
            position: 'absolute',
            width: '100%',
            height: '2px',
            bottom: 0,
            left: 0,
            bg: 'accent',
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

// Mobil NavLink için özel stil component'i (Tema ile Uyumlu)
const CustomMobileNavLink = React.forwardRef(({ children, to, onClose, ...props }, ref) => {
  return (
    <NavLink to={to} ref={ref} {...props} >
       {({ isActive }) => (
          // Link tema stilini ve semantic token'ları kullanır
          <Link
            as="span"
            display="block"
            onClick={onClose}
            p={3} // Tema space.3
            borderRadius="md" // Tema radii.md
            fontWeight={isActive ? 'semibold' : 'medium'}
            bg={isActive ? 'accent' : 'transparent'} // Aktif: accent bg
            color={isActive ? 'white' : 'textSecondary'} // Aktif: beyaz metin, değilse textSecondary
            _hover={{
              textDecoration: 'none',
              bg: isActive ? 'accent' : 'bgTertiary', // Hover: bgTertiary
              color: isActive ? 'white' : 'textPrimary', // Hover: textPrimary
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
  const { isOpen: isMobileMenuOpen, onOpen: onMobileMenuOpen, onClose: onMobileMenuClose } = useDisclosure();

  const handleLogout = () => {
    logout();
    onMobileMenuClose();
  };

  return (
    // Flex tema stillerini (varsayılan) kullanır
    <Flex direction="column" minH="100vh">
      {/* Header - Box tema stillerini ve semantic token'ları kullanır */}
      <Box
        as="header"
        bg="bgSecondary" // Semantic token
        borderBottomWidth="1px"
        borderColor="borderPrimary" // Semantic token
        boxShadow="sm" // Tema shadows.sm
        py={3} // Tema space.3
        position="sticky"
        top={0}
        zIndex="sticky" // Tema zIndices.sticky
      >
        {/* Container ve Flex tema stillerini kullanır */}
        <Container maxW="container.xl" display="flex" alignItems="center" justifyContent="space-between" gap={6}>
          {/* Logo Link - Tema link/typography stillerini ve semantic token'ları kullanır */}
          <Link
            as={RouterLink}
            to="/browse"
            fontSize="xl"
            fontWeight="bold"
            color="textPrimary"
            _hover={{ textDecoration: 'none', color: 'accent' }}
            flexShrink={0}
          >
            mikRobiyoloji
          </Link>

          {/* Desktop Navigasyon - HStack tema boşluklarını, CustomNavLink tema stillerini kullanır */}
          <HStack as="nav" spacing={5} display={{ base: 'none', lg: 'flex' }}>
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

          {/* Sağ Taraf Kontroller - Flex tema stillerini kullanır */}
          <Flex alignItems="center" gap={2}>
            {/* Tema Değiştirici - IconButton tema stilini (ghost, sm) kullanır */}
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

            {/* Kullanıcı Menüsü (Desktop) - Flex, Text, IconButton tema stillerini kullanır */}
            <Flex display={{ base: 'none', lg: 'flex' }} alignItems="center" gap={3}>
              {isAuthenticated ? (
                <>
                  <Text fontSize="sm" color="textMuted" whiteSpace="nowrap" title={`Rol: ${user?.role} / Uzmanlık: ${user?.specialization || 'Belirtilmemiş'}`}>
                    Hoşgeldin, {user?.username || 'Kullanıcı'}!
                  </Text>
                   <IconButton
                     size="sm"
                     variant="ghost"
                     onClick={handleLogout}
                     title="Çıkış Yap"
                     aria-label="Çıkış Yap"
                     icon={<Icon as={FaSignOutAlt} />}
                  />
                </>
              ) : (
                // Butonlar tema stillerini kullanır
                <HStack spacing={2}>
                  {/* GÜNCELLENDİ: variant="secondary" -> variant="outline" */}
                  <Button as={RouterLink} to="/login" variant="outline" size="sm" leftIcon={<Icon as={FaSignInAlt} />}>
                     Giriş Yap
                  </Button>
                  <Button as={RouterLink} to="/register" colorScheme="brand" size="sm" leftIcon={<Icon as={FaUserPlus} />}>
                      Kayıt Ol
                  </Button>
                </HStack>
              )}
            </Flex>

            {/* Hamburger Butonu - IconButton tema stilini (ghost) kullanır */}
            <IconButton
              display={{ base: 'flex', lg: 'none' }}
              onClick={onMobileMenuOpen}
              icon={isMobileMenuOpen ? <Icon as={FaTimes} /> : <Icon as={FaBars} />}
              aria-label="Menüyü Aç"
              variant="ghost"
            />
          </Flex>
        </Container>
      </Box>

      {/* Mobil Menü (Drawer) - Tema stillerini ve semantic token'ları kullanır */}
      <Drawer isOpen={isMobileMenuOpen} placement="right" onClose={onMobileMenuClose}>
        <DrawerOverlay />
        <DrawerContent bg="bgSecondary">
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor="borderPrimary">Menü</DrawerHeader>
          <DrawerBody display="flex" flexDirection="column" p={6}>
            {/* VStack ve CustomMobileNavLink tema stillerini/semantic token'ları kullanır */}
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

            {/* Drawer Footer - Box, Flex, Text, IconButton, Button tema stillerini/semantic token'ları kullanır */}
            <Box mt={6} pt={6} borderTopWidth="1px" borderColor="borderSecondary">
                <Flex justifyContent="space-between" alignItems="center" mb={4}>
                     <Text fontSize="sm" color="textMuted">Tema:</Text>
                     <IconButton
                         size="sm"
                         variant="ghost"
                         onClick={() => { toggleColorMode(); onMobileMenuClose(); }}
                         aria-label="Temayı Değiştir"
                         title={colorMode === 'light' ? 'Koyu Tema' : 'Açık Tema'}
                         icon={colorMode === 'light' ? <Icon as={FaMoon} /> : <Icon as={FaSun} />}
                     />
                 </Flex>

               {isAuthenticated ? (
                 <>
                   <Text fontSize="sm" color="textMuted" textAlign="center" mb={4}> {user?.username || 'Kullanıcı'} ({user?.role}) </Text>
                   <Button onClick={handleLogout} colorScheme="red" variant="ghost" size="sm" w="full" leftIcon={<Icon as={FaSignOutAlt} />}>
                     Çıkış Yap
                   </Button>
                 </>
               ) : (
                 <VStack spacing={3} mt={4}>
                    {/* GÜNCELLENDİ: variant="secondary" -> variant="outline" */}
                   <Button as={RouterLink} to="/login" variant="outline" w="full" onClick={onMobileMenuClose} leftIcon={<Icon as={FaSignInAlt} />}>
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

      {/* Main Content Area - Box tema stillerini kullanır */}
      <Box as="main" flex="1" py={8}>
        <Outlet />
      </Box>

      {/* Footer (Yorumlu) - Box, Container, Text tema stillerini/semantic token'ları kullanır */}
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