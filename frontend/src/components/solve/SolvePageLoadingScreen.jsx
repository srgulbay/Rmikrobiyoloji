import React from 'react';
import {
  Container,
  Heading,
  Text,
  Spinner,
  Icon,
  VStack,
  Progress,
  ScaleFade,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaBrain } from 'react-icons/fa'; // Veya FiCpu, FaMagic gibi farklı bir ikon

function SolvePageLoadingScreen({ loadingMessage }) {
  const headingColor = useColorModeValue("gray.700", "gray.100");
  const textMutedColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Container maxW="container.lg" py={8} centerContent minH="80vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
      <Icon 
        as={FaBrain} // Daha önce Dashboard'da kullandığımız ikon
        boxSize="52px" 
        color="brand.500" 
        mb={6} 
        sx={{ animation: "pulse 1.8s ease-in-out infinite" }}
      />
      <Heading size="md" color={headingColor} mb={2} textAlign="center">
        Soru Çözme Alanı Hazırlanıyor
      </Heading>
      <ScaleFade initialScale={0.9} in={true} key={loadingMessage}> {/* Mesaj değiştikçe animasyon için key */}
          <Text mt={2} color={textMutedColor} fontSize="sm" textAlign="center" maxW="sm">
              {loadingMessage || "Lütfen bekleyin..."}
          </Text>
      </ScaleFade>
      <Progress size="xs" isIndeterminate colorScheme="brand" w="220px" mt={6} borderRadius="md"/>
      {/* Pulse animasyonu için stil (Eğer global CSS'te yoksa) */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.12); opacity: 1; }
            100% { transform: scale(1); opacity: 0.7; }
          }
        `}
      </style>
    </Container>
  );
}

export default SolvePageLoadingScreen;
