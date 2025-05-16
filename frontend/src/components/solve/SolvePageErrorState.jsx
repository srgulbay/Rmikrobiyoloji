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
  VStack,
  Text, // Text importu zaten vardı
  Heading // Heading eklendi
} from '@chakra-ui/react';
import { FaExclamationTriangle, FaRedo, FaSignInAlt, FaHome, FaWrench } from 'react-icons/fa'; // FaWrench eklendi
import { FiAlertTriangle } from 'react-icons/fi'; // Daha modern bir ikon
import { Link as RouterLink, useNavigate } from 'react-router-dom';

function SolvePageErrorState({
    error,
    onRetry,
    onGoToSetup,
    token
}) {
  const cardBg = useColorModeValue("white", "gray.800"); // Layout.jsx'teki header gibi
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const textColor = useColorModeValue('gray.600', 'gray.400'); // Hata metni için biraz daha soluk
  const errorIconColor = useColorModeValue("red.500", "red.300");
  const errorAlertBg = useColorModeValue("red.50", "rgba(254, 178, 178, 0.1)"); // Hafif kırmızımsı arkaplan

  const navigate = useNavigate();

  const isAuthError = !token && (typeof error === 'string' && (error.toLowerCase().includes("giriş yap") || error.toLowerCase().includes("yetkilendirme")));

  return (
    <Container maxW="container.md" py={{ base: 8, md: 16 }} centerContent>
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
      >
        <Icon as={FiAlertTriangle} boxSize={{ base: "48px", md: "64px" }} color={errorIconColor} />
        <Heading as="h2" size={{base: "lg", md: "xl"}} color={headingColor} fontWeight="bold">
          {isAuthError ? "Erişim Hatası Oluştu" : "Beklenmedik Bir Sorun!"}
        </Heading>
        <Text fontSize={{base: "md", md: "lg"}} color={textColor} lineHeight="tall" maxW="lg">
          {error || "Soru çözme alanında beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin veya ayarlarınızı kontrol edin."}
        </Text>

        <VStack spacing={4} mt={6} w="full" maxW="sm">
          {isAuthError ? (
            <Button
              as={RouterLink}
              to="/login"
              colorScheme="blue" // Giriş butonu için standart renk
              leftIcon={<Icon as={FaSignInAlt} />}
              size="lg"
              w="full"
              py={6}
              borderRadius="lg"
              boxShadow="md"
              _hover={{boxShadow: "lg", transform: "translateY(-2px)"}}
            >
              Giriş Yap
            </Button>
          ) : (
            onRetry && (
              <Button
                colorScheme="red" // Hata ile ilişkili renk
                variant="solid" // Daha belirgin
                onClick={onRetry}
                leftIcon={<Icon as={FaRedo} />}
                size="lg"
                w="full"
                py={6}
                borderRadius="lg"
                boxShadow="md"
                _hover={{boxShadow: "lg", transform: "translateY(-2px)"}}
              >
                Tekrar Dene
              </Button>
            )
          )}
          {onGoToSetup && !isAuthError && (
             <Button
                variant="outline"
                colorScheme="gray"
                onClick={onGoToSetup}
                leftIcon={<Icon as={FaWrench} />}
                size="md" // Diğer ana aksiyon butonundan biraz daha küçük
                w="full"
                borderRadius="lg"
            >
                Test Ayarlarına Dön
            </Button>
          )}
           <Button
                as={RouterLink}
                to="/browse"
                variant="link" // Daha az dikkat çekici
                colorScheme="blue" // Tema ile uyumlu link rengi
                size="md"
                mt={2}
                leftIcon={<Icon as={FaHome} />}
            >
                Konu Tarayıcıya Dön
            </Button>
        </VStack>
      </VStack>
    </Container>
  );
}

export default SolvePageErrorState;
