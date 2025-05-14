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
  Heading
} from '@chakra-ui/react';
import { FaExclamationTriangle, FaRedo, FaSignInAlt } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';

function DashboardErrorState({ error, onRetry, token }) {
  const alertBg = useColorModeValue("red.50", "red.900");
  const alertBorderColor = useColorModeValue("red.200", "red.700");
  const titleColor = useColorModeValue("red.700", "red.100");
  const descriptionColor = useColorModeValue("red.600", "red.200");
  const headingColor = useColorModeValue("gray.700", "gray.100");


  if (!error) return null;

  // Token yoksa ve hata mesajı girişle ilgiliyse farklı bir mesaj ve buton gösterilebilir.
  const isAuthError = !token && (error.toLowerCase().includes("giriş yap") || error.toLowerCase().includes("yetkilendirme"));

  return (
    <Container maxW="container.lg" py={{ base: 6, md: 10 }} centerContent minH="60vh" display="flex" flexDirection="column" justifyContent="center">
      <Alert
        status="error"
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        py={10}
        borderRadius="xl"
        bg={alertBg}
        borderColor={alertBorderColor}
        borderWidth="1px"
        boxShadow="lg"
        w="full"
        maxW="lg"
      >
        <AlertIcon as={FaExclamationTriangle} boxSize="40px" color="red.400" />
        <AlertTitle mt={4} mb={2} fontSize="xl" fontWeight="bold" color={titleColor}>
          {isAuthError ? "Erişim Reddedildi" : "Bir Hata Oluştu!"}
        </AlertTitle>
        <AlertDescription maxWidth="md" mb={6} color={descriptionColor}>
          {error}
        </AlertDescription>
        {isAuthError ? (
          <Button
            as={RouterLink}
            to="/login"
            colorScheme="blue"
            leftIcon={<Icon as={FaSignInAlt} />}
            size="lg"
            px={8}
            boxShadow="md"
            _hover={{boxShadow:"lg"}}
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
              size="lg"
              px={8}
              _hover={{bg: useColorModeValue("red.100", "red.800")}}
            >
              Tekrar Dene
            </Button>
          )
        )}
      </Alert>
    </Container>
  );
}

export default DashboardErrorState;
