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
  VStack, // VStack eklendi
  Text // Text eklendi
} from '@chakra-ui/react';
import { FaExclamationTriangle, FaRedo, FaSignInAlt, FaHome } from 'react-icons/fa';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

function SolvePageErrorState({ 
    error, 
    onRetry, // Genel bir tekrar deneme fonksiyonu (örn: initializeQuiz'i tekrar çağırmak)
    onGoToSetup, // Kurulum ekranına geri dönme fonksiyonu
    token 
}) {
  const alertBg = useColorModeValue("red.50", "rgba(224, 49, 49, 0.15)");
  const alertBorderColor = useColorModeValue("red.200", "red.700");
  const titleColor = useColorModeValue("red.700", "red.100");
  const descriptionColor = useColorModeValue("red.600", "red.200");
  const navigate = useNavigate();

  const isAuthError = !token && (typeof error === 'string' && (error.toLowerCase().includes("giriş yap") || error.toLowerCase().includes("yetkilendirme")));

  return (
    <Container maxW="container.md" mt={{ base: 6, md: 10 }} py={10}>
      <Alert
        status="error"
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        py={{ base: 8, md: 10 }}
        px={{ base: 4, md: 6 }}
        borderRadius="xl"
        bg={alertBg}
        borderColor={alertBorderColor}
        borderWidth="1px"
        boxShadow="lg"
        w="full"
      >
        <Icon as={FaExclamationTriangle} boxSize={{ base: "32px", md: "40px" }} color="red.400" />
        <AlertTitle mt={4} mb={2} fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={titleColor}>
          {isAuthError ? "Erişim Hatası" : "Bir Sorun Oluştu!"}
        </AlertTitle>
        <AlertDescription maxWidth="lg" mb={6} color={descriptionColor} lineHeight="tall">
          {error || "Beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin."}
        </AlertDescription>
        
        <VStack spacing={4} mt={4} w="full" maxW="xs">
          {isAuthError ? (
            <Button
              as={RouterLink}
              to="/login"
              colorScheme="blue"
              leftIcon={<Icon as={FaSignInAlt} />}
              size="md"
              w="full"
            >
              Giriş Yap
            </Button>
          ) : (
            onRetry && (
              <Button
                colorScheme="red"
                variant="outline"
                onClick={onRetry}
                leftIcon={<Icon as={FaRedo} />}
                size="md"
                w="full"
              >
                Tekrar Dene
              </Button>
            )
          )}
          {onGoToSetup && !isAuthError && (
             <Button 
                colorScheme="gray" 
                variant="ghost" 
                onClick={onGoToSetup} 
                size="sm"
                w="full"
            >
                Test Kurulumuna Geri Dön
            </Button>
          )}
           <Button 
                as={RouterLink} 
                to="/browse" 
                variant="link" 
                colorScheme="blue" 
                size="sm"
                mt={2}
            >
                Konulara Göz At
            </Button>
        </VStack>
      </Alert>
    </Container>
  );
}

export default SolvePageErrorState;
