import React from 'react';
import {
  Container,
  Heading,
  Text,
  Icon,
  VStack,
  Progress,
  ScaleFade,
  useColorModeValue,
  Box // Box eklendi
} from '@chakra-ui/react';
import { FaBrain } from 'react-icons/fa';
import { FiCpu, FiLoader } from 'react-icons/fi'; // Alternatif ikonlar

function DashboardLoadingScreen({ currentLoadingMessage }) {
  // Layout ve diğer güncellenen bileşenlerle tutarlı stil değişkenleri
  const containerBg = useColorModeValue("gray.100", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("gray.700", "whiteAlpha.900");
  const textMutedColor = useColorModeValue("gray.500", "gray.400");
  const accentColor = useColorModeValue("brand.500", "brand.300");

  // Animasyon için ikon (FiCpu veya FaBrain seçilebilir)
  const LoadingIcon = FiCpu;

  return (
    <Container 
      maxW="container.lg" 
      py={8} 
      centerContent 
      minH={{base: "70vh", md: "80vh"}}
      display="flex" 
      flexDirection="column" 
      justifyContent="center" 
      alignItems="center"
      bg={containerBg} // Ana sayfa arkaplanı
    >
      <VStack
        spacing={6}
        p={{base: 8, md: 12}} // Padding artırıldı
        bg={cardBg}
        borderRadius="xl" // Daha yuvarlak köşeler
        boxShadow="2xl" // Daha belirgin gölge
        borderWidth="1px"
        borderColor={borderColor}
        textAlign="center"
        w="full"
        maxW="md" // Kartın maksimum genişliği
      >
        <Box animation="pulse 1.8s ease-in-out infinite">
          <Icon 
            as={LoadingIcon}
            boxSize={{base:"52px", md:"64px"}} // İkon boyutu artırıldı
            color={accentColor} // Tema vurgu rengi
          />
        </Box>
        
        <Heading size={{base:"md", md:"lg"}} color={headingColor} fontWeight="semibold">
          Dijital Mentorunuz Sizin İçin Hazırlanıyor
        </Heading>
        
        <ScaleFade initialScale={0.95} in={true} key={currentLoadingMessage}>
            <Text mt={1} color={textMutedColor} fontSize="md" maxW="sm" lineHeight="tall">
                {currentLoadingMessage || "Veriler analiz ediliyor, lütfen bekleyin..."}
            </Text>
        </ScaleFade>
        
        <Progress 
            size="sm" // Biraz daha kalın
            isIndeterminate 
            colorScheme="brand" 
            w="85%" // Genişliği artır
            mt={4} 
            borderRadius="full" // Tam yuvarlak
            bg={useColorModeValue("gray.200", "gray.600")} // Progress bar arkaplanı
        />
      </VStack>
      {/* Pulse animasyonu için stil (Global CSS'te veya tema içinde tanımlanabilir) */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(1); opacity: 0.6; }
          }
        `}
      </style>
    </Container>
  );
}

export default DashboardLoadingScreen;
