import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Flex,
  Container,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Alert,
  AlertIcon,
  AlertDescription,
  AlertTitle,
  VStack,
  Text,
  Icon,
  Link as ChakraLink,
  ScaleFade,
  InputGroup, // Eksik import eklendi
  InputLeftElement // Eksik import eklendi
} from '@chakra-ui/react';
import { FaEnvelope, FaPaperPlane } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function RequestPasswordResetPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!email) {
      setError('Lütfen e-posta adresinizi girin.');
      setLoading(false);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        setError('Lütfen geçerli bir e-posta adresi girin.');
        setLoading(false);
        return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/request-password-reset`, { email });
      setMessage(response.data.message || 'Şifre sıfırlama talimatları e-posta adresinize gönderildi.');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Şifre sıfırlama isteği sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" px={4} py={12}>
      <Container
        maxW="md"
        bg="bgPrimary"
        p={{ base: 6, md: 8 }}
        borderRadius="xl"
        boxShadow="xl"
        borderWidth={1}
        borderColor="borderPrimary"
      >
        <Heading as="h1" size="lg" textAlign="center" mb={8} color="brand.500">
          Şifremi Unuttum
        </Heading>

        {message && !error && (
          <Alert status="success" borderRadius="md" mb={6} variant="subtle">
            <AlertIcon />
            <Box>
                <AlertTitle>İstek Gönderildi!</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
            </Box>
          </Alert>
        )}

        <ScaleFade initialScale={0.9} in={!!error} unmountOnExit>
            {error && (
                <Alert status="error" borderRadius="md" width="full" variant="subtle" mb={6}>
                <AlertIcon />
                <AlertDescription fontSize="sm">{error}</AlertDescription>
                </Alert>
            )}
        </ScaleFade>


        <Box as="form" onSubmit={handleSubmit}>
          <VStack spacing={5}>
            <Text color="textSecondary" textAlign="center" fontSize="sm">
              Hesabınızla ilişkili e-posta adresini girin. Size şifrenizi sıfırlamanız için bir bağlantı göndereceğiz.
            </Text>
            <FormControl id="email-request-reset" isRequired isDisabled={loading}>
              <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">E-posta Adresi</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaEnvelope} color="gray.400" />
                </InputLeftElement>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='kayitli.eposta@adresiniz.com'
                />
              </InputGroup>
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              width="full"
              mt={4}
              isLoading={loading}
              loadingText="Gönderiliyor..."
              leftIcon={<Icon as={FaPaperPlane} />}
            >
              Sıfırlama Linki Gönder
            </Button>
          </VStack>
        </Box>

        <Text textAlign="center" mt={8} fontSize="sm">
          Şifrenizi hatırlıyor musunuz?{' '}
          <ChakraLink as={RouterLink} to="/login" fontWeight="medium" color="brand.500">
            Giriş Yapın
          </ChakraLink>
        </Text>
      </Container>
    </Flex>
  );
}

export default RequestPasswordResetPage;