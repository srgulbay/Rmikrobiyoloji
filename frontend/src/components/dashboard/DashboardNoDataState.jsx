import React from 'react';
import {
  Container,
  Alert, // Alert'i Vstack ve Card ile değiştirebiliriz
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Icon,
  useColorModeValue,
  VStack,
  Text,
  Heading, // Heading eklendi
  Box // Box eklendi
} from '@chakra-ui/react';
import { FaInfoCircle, FaPencilAlt, FaRocket } from 'react-icons/fa'; // FaRocket eklendi
import { FiZap } from 'react-icons/fi'; // Daha modern bir ikon
import { Link as RouterLink } from 'react-router-dom';

function DashboardNoDataState() {
  // Layout ile tutarlı stil değişkenleri
  const mainBg = useColorModeValue('gray.100', 'gray.900'); // Sayfa arkaplanı
  const cardBg = useColorModeValue('white', 'gray.800'); // Kart arkaplanı
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const textColor = useColorModeValue('gray.600', 'gray.400'); // Normal metinler için
  const accentColor = useColorModeValue('brand.500', 'brand.300');
  const infoIconColor = useColorModeValue("blue.500", "blue.300");
  const infoCardBorderColor = useColorModeValue("blue.300", "blue.600");
  const infoCardBg = useColorModeValue("blue.50", "rgba(49, 130, 206, 0.1)");


  return (
    <Container 
      maxW="container.md" // Biraz daha odaklı
      py={{ base: 8, md: 16 }} 
      centerContent 
      minH={{base:"60vh", md:"70vh"}}
      display="flex" 
      flexDirection="column" 
      justifyContent="center"
      bg={mainBg}
    >
      <VStack
        spacing={6}
        p={{base: 8, md: 12}} // Daha fazla padding
        bg={cardBg}
        borderRadius="xl"
        boxShadow="2xl" // Daha belirgin gölge
        borderWidth="1px"
        borderColor={infoCardBorderColor} // Bilgi temalı kenarlık
        textAlign="center"
        w="full"
        maxW="lg" // Kartın maksimum genişliği
      >
        <Icon as={FiZap} boxSize={{ base: "48px", md: "64px" }} color={accentColor} /> 
        <Heading as="h2" size={{base: "lg", md: "xl"}} color={headingColor} fontWeight="bold">
          Potansiyeliniz Keşfedilmeyi Bekliyor!
        </Heading>
        <Text fontSize={{base: "md", md: "lg"}} color={textColor} lineHeight="tall" maxW="md">
          Dijital Mentorunuz, öğrenme yolculuğunuzda size rehberlik etmek için hazır. Özel analizler ve kişiselleştirilmiş öneriler sunabilmesi için platformda biraz daha aktif olmanız yeterli.
        </Text>
        <Text fontSize="md" color={textColor} fontWeight="medium">
          Başarıya giden yolda ilk adımı atın!
        </Text>
        <Button
          as={RouterLink}
          to="/solve"
          colorScheme="brand" // Tema rengi
          size="lg"
          mt={6} // Üst boşluk
          px={10} // Daha geniş buton
          py={7}  // Daha yüksek buton
          leftIcon={<Icon as={FaRocket} boxSize={5}/>} // Farklı bir ikon
          boxShadow="lg" // Gölge
          _hover={{ boxShadow: "xl", transform: "translateY(-3px) scale(1.02)" }} // Hover efekti
          transition="all 0.25s ease-out"
          borderRadius="lg" // Yuvarlak köşeler
          letterSpacing="wide"
          fontWeight="bold"
        >
          Hemen Pratik Yapmaya Başla!
        </Button>
      </VStack>
    </Container>
  );
}

export default DashboardNoDataState;
