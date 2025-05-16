import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Icon,
  VStack,
  HStack,
  Divider,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Card,
  CardBody,
  useColorModeValue,
  Flex,
  Center
} from '@chakra-ui/react';
import { FaBrain, FaSync, FaPlayCircle, FaListOl, FaCheckCircle, FaPlusSquare, FaQuestionCircle, FaClone, FaBookReader } from 'react-icons/fa';
import { FiRepeat, FiBox, FiArchive, FiLayers, FiZap, FiTarget } from "react-icons/fi"; // FiZap, FiTarget eklendi

const API_BASE_URL = import.meta.env.VITE_API_URL;

function DigitalCoachPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [srsSummary, setSrsSummary] = useState({
    reviewItemsCount: 0,
    dueQuestionCount: 0,
    dueFlashcardCount: 0,
    dueTopicSummaryCount: 0,
    masteredItemsCount: 0,
    totalSrsItems: 0,
    itemsInBoxes: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Layout ile tutarlı stil değişkenleri
  const mainBg = useColorModeValue('gray.100', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800'); // Kartlar için Layout'taki header gibi
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const textMutedColor = useColorModeValue('gray.500', 'gray.400');
  const accentColor = useColorModeValue('brand.500', 'brand.300');


  const fetchSrsSummaryData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("Lütfen giriş yapınız.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_BASE_URL}/api/srs/summary`, config);
      
      if (response.data) {
        setSrsSummary({
          reviewItemsCount: response.data.reviewItemsCount || 0,
          dueQuestionCount: response.data.dueQuestionCount || 0,
          dueFlashcardCount: response.data.dueFlashcardCount || 0,
          dueTopicSummaryCount: response.data.dueTopicSummaryCount || 0,
          masteredItemsCount: response.data.masteredItemsCount || 0,
          totalSrsItems: response.data.totalSrsItems || 0,
          itemsInBoxes: response.data.itemsInBoxes || {}
        });
      } else {
        setSrsSummary(prev => ({ ...prev, reviewItemsCount: 0, dueQuestionCount: 0, dueFlashcardCount: 0, dueTopicSummaryCount: 0, masteredItemsCount: 0, totalSrsItems: 0, itemsInBoxes: {} }));
      }
    } catch (err) {
      console.error("Dijital Antrenör özet verileri çekilirken hata:", err);
      setError(err.response?.data?.message || "Özet veriler yüklenirken bir sorun oluştu.");
      setSrsSummary(prev => ({ ...prev, reviewItemsCount: 0, dueQuestionCount: 0, dueFlashcardCount: 0, dueTopicSummaryCount: 0, masteredItemsCount: 0, totalSrsItems: 0, itemsInBoxes: {} }));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSrsSummaryData();
  }, [fetchSrsSummaryData]);

  const handleStartTypedReview = (itemType) => {
    navigate(`/srs-session?type=${itemType}`);
  };

  const handleAddItemsToSRS = () => {
    navigate('/browse'); // Konu Tarayıcıya yönlendir, oradan ekleme yapılacak
  };

  if (loading) {
    return (
      <Container centerContent py={10} minH="calc(100vh - 160px)" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color={accentColor} thickness="4px" speed="0.65s" />
          <Text color={textMutedColor} fontSize="lg">Dijital Antrenör Verileri Yükleniyor...</Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container centerContent py={10} minH="calc(100vh - 160px)">
        <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" borderRadius="xl" p={8} boxShadow="lg" bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <AlertIcon boxSize="40px" color="red.400"/>
          <AlertTitle mt={4} fontSize="xl" fontWeight="bold" color={headingColor}>Bir Hata Oluştu</AlertTitle>
          <AlertDescription maxWidth="sm" textAlign="center" mt={2} color={textColor}>{error}</AlertDescription>
          <Button mt={6} colorScheme="red" variant="outline" onClick={fetchSrsSummaryData} leftIcon={<FaSync />}>Tekrar Dene</Button>
          {!token && <Button as={RouterLink} to="/login" colorScheme="blue" mt={4}>Giriş Yap</Button>}
        </Alert>
      </Container>
    );
  }

  const totalDueItems = srsSummary.dueQuestionCount + srsSummary.dueFlashcardCount + srsSummary.dueTopicSummaryCount;

  const SessionButton = ({ icon, title, count, itemType, colorScheme }) => (
    <Button
      bg={cardBg}
      borderColor={borderColor}
      borderWidth="1px"
      colorScheme={colorScheme}
      variant="outline"
      size="lg"
      height="130px" // Yükseklik artırıldı
      leftIcon={<Icon as={icon} boxSize={7} color={`${colorScheme}.500`} />} // İkon rengi şemadan
      onClick={() => handleStartTypedReview(itemType)}
      isDisabled={count === 0}
      boxShadow="lg"
      _hover={{ boxShadow: "xl", transform: "translateY(-3px)", borderColor: `${colorScheme}.400` }}
      _disabled={{ opacity: 0.6, cursor: "not-allowed", boxShadow: "md", transform: "none" }}
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      p={4}
      w="full"
      borderRadius="xl" // Daha yuvarlak
      transition="all 0.2s ease-out"
    >
      <Text fontSize="xl" fontWeight="semibold" color={headingColor} mb={1}>{title}</Text>
      <Text fontSize="md" color={useColorModeValue(`${colorScheme}.600`, `${colorScheme}.200`)}>
        ({count} Öğe)
      </Text>
    </Button>
  );


  return (
    <Container maxW="container.xl" py={{ base: 6, md: 8 }} bg={mainBg} minH="calc(100vh - 80px)">
      <VStack spacing={{ base: 6, md: 10 }} align="stretch">
        <Flex direction={{base:"column", lg:"row"}} align="center" justify="space-between" gap={4}
              p={6} bg={cardBg} borderRadius="xl" boxShadow="xl" borderColor={borderColor} borderWidth="1px"
        >
            <HStack spacing={5}>
                <Icon as={FiRepeat} color={accentColor} boxSize={{base:10, md:14}} />
                <VStack align="flex-start" spacing={0}>
                    <Heading as="h1" size={{base:"lg", md:"xl"}} color={headingColor} fontWeight="bold">
                        Dijital Antrenör
                    </Heading>
                    <Text color={textColor} fontSize={{base:"sm", md:"lg"}} lineHeight="short">
                        Bilgilerinizi aralıklı tekrarla pekiştirin ve öğrenme veriminizi artırın.
                    </Text>
                </VStack>
            </HStack>
             <Button
                colorScheme="teal" // Ana aksiyon rengi
                variant="solid"
                size="lg"
                leftIcon={<FaPlusSquare />}
                onClick={handleAddItemsToSRS}
                boxShadow="lg"
                _hover={{boxShadow:"xl", transform: "translateY(-2px)"}}
                mt={{base:4, lg:0}}
                px={8} py={6}
                borderRadius="lg"
            >
                Antrenöre Yeni İçerik Ekle
            </Button>
        </Flex>

        <Box>
            <Heading size={{base:"lg", md:"xl"}} color={headingColor} textAlign="center" mb={8}>
                <Icon as={FiZap} mr={2} color={accentColor}/> Tekrar Seansları
            </Heading>
            {totalDueItems === 0 && !loading && (
                <Text textAlign="center" color={textMutedColor} fontStyle="italic" fontSize="lg" py={5}>
                    Şu an tekrar edilecek herhangi bir öğeniz bulunmuyor. Harika!
                </Text>
            )}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{base:4, md:6}} px={{base: 2, md: 0}}>
                <SessionButton icon={FaQuestionCircle} title="Soru Tekrarı" count={srsSummary.dueQuestionCount} itemType="question" colorScheme="blue" />
                <SessionButton icon={FaClone} title="Flashkart Tekrarı" count={srsSummary.dueFlashcardCount} itemType="flashcard" colorScheme="orange" />
                <SessionButton icon={FaBookReader} title="Konu Tekrarı" count={srsSummary.dueTopicSummaryCount} itemType="topic_summary" colorScheme="green" />
            </SimpleGrid>
        </Box>
        
        <Divider my={6} borderColor={borderColor} />
        
        <Box>
            <Heading size={{base:"lg", md:"xl"}} color={headingColor} textAlign="center" mb={8} mt={4}>
                 <Icon as={FiArchive} mr={2} color={accentColor}/> Genel İstatistikleriniz
            </Heading>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={{ base: 4, md: 6 }} px={{base: 2, md: 0}}>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" boxShadow="lg" p={5}>
                <HStack spacing={4} align="center">
                <Icon as={FiBox} color="blue.400" boxSize={8} />
                <Box>
                    <Text fontSize="3xl" fontWeight="bold" color={headingColor}>{srsSummary.reviewItemsCount}</Text>
                    <Text fontSize="md" color={textMutedColor}>Toplam Tekrar Edilecek</Text>
                </Box>
                </HStack>
            </Card>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" boxShadow="lg" p={5}>
                <HStack spacing={4} align="center">
                <Icon as={FaCheckCircle} color="green.400" boxSize={8} />
                <Box>
                    <Text fontSize="3xl" fontWeight="bold" color={headingColor}>{srsSummary.masteredItemsCount}</Text>
                    <Text fontSize="md" color={textMutedColor}>Ustalaşılmış Öğe</Text>
                </Box>
                </HStack>
            </Card>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" boxShadow="lg" p={5}>
                <HStack spacing={4} align="center">
                <Icon as={FiLayers} color="purple.400" boxSize={8} />
                <Box>
                    <Text fontSize="3xl" fontWeight="bold" color={headingColor}>{srsSummary.totalSrsItems}</Text>
                    <Text fontSize="md" color={textMutedColor}>Toplam Öğe Antrenörde</Text>
                </Box>
                </HStack>
            </Card>
            </SimpleGrid>
        </Box>
        
        {Object.keys(srsSummary.itemsInBoxes).length > 0 && srsSummary.totalSrsItems > srsSummary.masteredItemsCount && ( // Sadece ustalaşılmamış öğe varsa kutuları göster
            <Box mt={8} px={{base: 2, md: 0}}>
                <Heading size="md" color={headingColor} mb={6} textAlign="center">
                    <Icon as={FiTarget} mr={2} color={accentColor}/> Aktif Öğelerin Kutu Dağılımı
                </Heading>
                <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} spacing={4}>
                    {Object.entries(srsSummary.itemsInBoxes).sort(([boxA], [boxB]) => parseInt(boxA) - parseInt(boxB)).map(([boxNumber, count]) => (
                        count > 0 && ( // Sadece öğe sayısı 0'dan büyük olan kutuları göster
                            <Card key={`box-${boxNumber}`} bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="lg" boxShadow="md" p={4} textAlign="center">
                            <Text fontSize="sm" color={textMutedColor} mb={1}>Kutu {boxNumber}</Text>
                            <Text fontSize="2xl" fontWeight="bold" color={headingColor}>{count}</Text>
                            </Card>
                        )
                    ))}
                </SimpleGrid>
            </Box>
        )}
      </VStack>
    </Container>
  );
}

export default DigitalCoachPage;
