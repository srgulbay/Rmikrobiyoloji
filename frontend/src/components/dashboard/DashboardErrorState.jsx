import React from 'react';
import {
  Container,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Icon,
  Box,
  useColorModeValue,
  Text,
  VStack,
  Heading,
  Flex // Flex eklendi
} from '@chakra-ui/react';
import { FaExclamationTriangle, FaRedo, FaSignInAlt, FaHome } from 'react-icons/fa';
import { FiAlertOctagon } from 'react-icons/fi'; // Daha modern bir hata ikonu
import { Link as RouterLink } from 'react-router-dom';

function DashboardErrorState({ error, onRetry, token }) {
  // Layout ile tutarlı stil değişkenleri
  const mainBg = useColorModeValue('gray.100', 'gray.900'); // Sayfa arkaplanı
  const cardBg = useColorModeValue('white', 'gray.800'); // Hata kartı arkaplanı
  const borderColor = useColorModeValue('red.300', 'red.600'); // Hata için kenarlık rengi
  const headingColor = useColorModeValue('red.600', 'red.200'); // Hata başlığı için
  const textColor = useColorModeValue('gray.700', 'gray.300'); // Genel metinler
  const errorIconColor = useColorModeValue("red.500", "red.300");

  if (!error) return null;

  const isAuthError = !token && (typeof error === 'string' && (error.toLowerCase().includes("giriş yap") || error.toLowerCase().includes("yetkilendirme")));

  return (
    <Container 
      maxW="container.md" // Biraz daha daraltıldı
      py={{ base: 8, md: 16 }} 
      centerContent 
      minH={{base:"60vh", md:"70vh"}} // Yükseklik biraz ayarlandı
      display="flex" 
      flexDirection="column" 
      justifyContent="center"
      bg={mainBg} // Ana sayfa arkaplanı
    >
      <VStack
        spacing={6}
        p={{base: 6, md: 10}}
        bg={cardBg}
        borderRadius="xl" // Daha yuvarlak köşeler
        boxShadow="2xl" // Daha belirgin gölge
        borderWidth="1px"
        borderColor={borderColor} // Hata temalı kenarlık
        textAlign="center"
        w="full"
        maxW="lg" // Kartın maksimum genişliği
      >
        <Icon as={FiAlertOctagon} boxSize={{ base: "48px", md: "64px" }} color={errorIconColor} />
        <Heading as="h2" size={{base: "lg", md: "xl"}} color={headingColor} fontWeight="bold">
          {isAuthError ? "Erişim Reddedildi" : "Bir Sorun Oluştu!"}
        </Heading>
        <Text fontSize={{base: "md", md: "lg"}} color={textColor} lineHeight="tall" maxW="md">
          {error || "Beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin veya sistem yöneticisi ile iletişime geçin."}
        </Text>
        
        <VStack spacing={4} mt={6} w="full" maxW="sm">
          {isAuthError ? (
            <Button
              as={RouterLink}
              to="/login"
              colorScheme="blue" // Giriş butonu için standart
              leftIcon={<Icon as={FaSignInAlt} />}
              size="lg"
              w="full"
              py={6} // Buton yüksekliği
              borderRadius="lg" // Buton köşeleri
              boxShadow="lg"
              _hover={{boxShadow:"xl", transform: "translateY(-2px)"}}
            >
              Giriş Yap
            </Button>
          ) : (
            onRetry && (
              <Button
                colorScheme="red" // Hata ile ilişkili ana aksiyon
                variant="solid" // Daha belirgin
                onClick={onRetry}
                leftIcon={<Icon as={FaRedo} />}
                size="lg"
                w="full"
                py={6}
                borderRadius="lg"
                boxShadow="lg"
                _hover={{boxShadow:"xl", transform: "translateY(-2px)"}}
              >
                Tekrar Dene
              </Button>
            )
          )}
          <Button 
            as={RouterLink} 
            to="/" 
            variant="link" // Daha az dikkat çekici
            colorScheme="gray" // Nötr renk
            size="md"
            mt={2} // Diğer butonlardan sonra biraz boşluk
            leftIcon={<Icon as={FaHome} />}
          >
            Ana Sayfaya Dön
          </Button>
        </VStack>
      </VStack>
    </Container>
  );
}

export default DashboardErrorState;
