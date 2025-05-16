import React from 'react';
import {
  Container,
  Heading,
  Text,
  Spinner, // Spinner'ı doğrudan kullanabiliriz veya Icon ile animasyonlu bir SVG
  Icon,
  VStack,
  Progress,
  ScaleFade,
  useColorModeValue,
  Box // Box eklendi
} from '@chakra-ui/react';
import { FaCogs, FaAtom, FaBrain } from 'react-icons/fa'; // FaCogs veya FaAtom gibi ikonlar da denenebilir
import { FiLoader, FiCpu } from 'react-icons/fi'; // FiLoader veya FiCpu

function SolvePageLoadingScreen({ loadingMessage }) {
  const containerBg = useColorModeValue("gray.100", "gray.900"); // Layout ana arkaplanı
  const cardBg = useColorModeValue("white", "gray.800"); // Ortadaki kart için
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("gray.700", "whiteAlpha.900");
  const textMutedColor = useColorModeValue("gray.500", "gray.400");
  const accentColor = useColorModeValue("brand.500", "brand.300");

  // Animasyon için ikon
  const LoadingIcon = FiCpu; // veya FaBrain, FaAtom, FiLoader

  return (
    <Container 
      maxW="container.lg" 
      py={8} 
      centerContent 
      minH={{base: "70vh", md: "80vh"}} // Yüksekliği biraz ayarla
      display="flex" 
      flexDirection="column" 
      justifyContent="center" 
      alignItems="center"
      bg={containerBg} // Arka plan rengi
    >
      <VStack
        spacing={6}
        p={{base: 6, md: 10}}
        bg={cardBg}
        borderRadius="xl"
        boxShadow="xl"
        borderWidth="1px"
        borderColor={borderColor}
        textAlign="center"
        w="full"
        maxW="md" // Kartın maksimum genişliği
      >
        <Box animation="pulse 1.8s ease-in-out infinite">
          <Icon 
            as={LoadingIcon}
            boxSize={{base:"48px", md:"60px"}} 
            color={accentColor}
          />
        </Box>
        
        <Heading size={{base:"md", md:"lg"}} color={headingColor} fontWeight="semibold">
          Soru Çözme Alanı Hazırlanıyor
        </Heading>
        
        <ScaleFade initialScale={0.95} in={true} key={loadingMessage}>
            <Text mt={1} color={textMutedColor} fontSize="md" maxW="sm">
                {loadingMessage || "Lütfen bekleyin, sihir gerçekleşiyor..."}
            </Text>
        </ScaleFade>
        
        <Progress 
            size="sm" // Biraz daha kalın
            isIndeterminate 
            colorScheme="brand" 
            w="80%" // Genişliği artır
            mt={4} 
            borderRadius="full" // Tam yuvarlak
            bg={useColorModeValue("gray.200", "gray.600")} // Progress bar arka planı
        />
      </VStack>
      {/* Pulse animasyonu için stil */}
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

export default SolvePageLoadingScreen;
