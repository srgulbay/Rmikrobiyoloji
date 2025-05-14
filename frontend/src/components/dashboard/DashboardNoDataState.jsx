import React from 'react';
import {
  Container,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Icon,
  useColorModeValue,
  VStack,
  Text // Text importu eklendi
} from '@chakra-ui/react';
import { FaInfoCircle, FaPencilAlt } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';

function DashboardNoDataState() {
  const alertBg = useColorModeValue("blue.50", "rgba(49,130,206,0.1)");
  const alertBorderColor = useColorModeValue("blue.200", "blue.700");
  const titleColor = useColorModeValue("blue.700", "blue.200");
  const descriptionColor = useColorModeValue("blue.600", "blue.200");
  const textColor = useColorModeValue("gray.600", "gray.300"); // Normal metinler için

  return (
    <Container maxW="container.lg" mt={6} py={10}>
      <Alert
        status="info"
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        py={{ base: 8, md: 10 }}
        borderRadius="xl"
        bg={alertBg}
        borderColor={alertBorderColor}
        borderWidth="1px"
        boxShadow="lg"
        w="full"
        maxW="xl" // Daha geniş bir kart için
      >
        <Icon as={FaInfoCircle} boxSize={{ base: "32px", md: "48px" }} color="blue.400" />
        <AlertTitle mt={4} mb={2} fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold" color={titleColor}>
          Stratejik Verileriniz Henüz Oluşmadı
        </AlertTitle>
        <AlertDescription maxWidth="lg" mb={6} color={textColor} lineHeight="tall" fontSize={{ base: "sm", md: "md" }}>
          Dijital Mentorunuzun size özel analizler ve kişiselleştirilmiş öneriler sunabilmesi için platformda biraz daha aktif olmanız (soru çözmeniz, dersleri incelemeniz) gerekmektedir.
          <Text mt={2}>Başarıya giden yolda ilk adımı atın ve potansiyelinizi keşfedin!</Text>
        </AlertDescription>
        <Button
          as={RouterLink}
          to="/solve"
          colorScheme="brand"
          size="lg"
          mt={4}
          px={8}
          py={6}
          leftIcon={<Icon as={FaPencilAlt} />}
          boxShadow="md"
          _hover={{ boxShadow: "xl", transform: "translateY(-2px)" }}
          transition="all 0.2s ease-out"
        >
          Hemen Soru Çözmeye Başla!
        </Button>
      </Alert>
    </Container>
  );
}

export default DashboardNoDataState;
