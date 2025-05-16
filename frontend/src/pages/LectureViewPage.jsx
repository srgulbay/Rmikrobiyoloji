import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Container,
  Button,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  Skeleton,
  SkeletonText,
  Image,
  Card,
  CardBody,
  VStack,
  Center,
  useColorModeValue,
  Flex,
  HStack,
  useToast,
  Divider
} from '@chakra-ui/react';
import { FaArrowLeft, FaExclamationTriangle, FaInfoCircle, FaRedo, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function LectureViewPage() {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const location = useLocation(); 
    const { token } = useAuth();
    const toast = useToast();

    const [lectures, setLectures] = useState([]);
    const [topicName, setTopicName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [srsEntryId, setSrsEntryId] = useState(null);
    const [srsReturnPath, setSrsReturnPath] = useState(null);
    const [isSrsReviewMode, setIsSrsReviewMode] = useState(false);
    const [isSubmittingSrs, setIsSubmittingSrs] = useState(false);

    const startTimeRef = useRef(null);
    const accumulatedTimeRef = useRef(0);

    const backendLectureUrl = `${API_BASE_URL}/api/lectures`;
    const backendTopicUrl = `${API_BASE_URL}/api/topics`;
    const backendLectureViewUrl = `${API_BASE_URL}/api/lecture-views`;

    const cardBg = useColorModeValue("white", "gray.750");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const headingColor = useColorModeValue("gray.700", "gray.100");
    const textColor = useColorModeValue("gray.600", "gray.300");
    const textMutedColor = useColorModeValue("gray.500", "gray.400");

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const srsId = queryParams.get('srsEntryId');
        const returnPath = queryParams.get('srsReturnPath');

        if (srsId && returnPath) {
            setSrsEntryId(srsId);
            setSrsReturnPath(returnPath);
            setIsSrsReviewMode(true);
            console.log("LectureViewPage SRS Modu Aktif:", { srsId, returnPath });
        } else {
            setIsSrsReviewMode(false);
            setSrsEntryId(null);
            setSrsReturnPath(null);
        }
    }, [location.search]);

    const fetchData = useCallback(async () => {
        setLoading(true); setError('');
        setLectures([]); setTopicName('');
        accumulatedTimeRef.current = 0; 
        startTimeRef.current = null;

        if (!token) { setError("İçeriği görmek için giriş yapmalısınız."); setLoading(false); return; }
        if (!topicId) { setError("Geçerli bir konu ID'si bulunamadı."); setLoading(false); return; }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const lectureApiUrl = `${backendLectureUrl}?topicId=${topicId}`;
            const topicApiUrl = `${backendTopicUrl}/${topicId}`;

            const [lecturesRes, topicRes] = await Promise.all([
                axios.get(lectureApiUrl, config),
                axios.get(topicApiUrl, config)
            ]);
            const fetchedLectures = Array.isArray(lecturesRes.data) ? lecturesRes.data : [];
            setLectures(fetchedLectures);
            setTopicName(topicRes.data?.name || `Konu ID: ${topicId}`);
        } catch (err) {
            console.error("Konu anlatımı veya konu bilgisi çekilirken hata:", err);
            const errorMsg = err.response?.data?.message || 'İçerik yüklenirken bir hata oluştu.';
            setError(errorMsg);
            setTopicName(`Konu ID: ${topicId}`);
            setLectures([]);
        } finally {
            setLoading(false);
        }
    }, [topicId, token, backendLectureUrl, backendTopicUrl]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const sendDurationData = useCallback(async (totalDurationMs) => {
        const durationInSeconds = Math.round(totalDurationMs / 1000);
        if (!token || lectures.length === 0 || !lectures[0]?.id || durationInSeconds < 3) {
            return;
        }
        const lectureIdToSend = lectures[0].id; // Şimdilik ilk dersin ID'si üzerinden
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(backendLectureViewUrl, {
                lectureId: lectureIdToSend,
                duration: durationInSeconds
            }, config);
        } catch (error) {
            console.error('Ders görüntüleme süresi gönderilirken hata:', error);
        }
    }, [token, lectures, backendLectureViewUrl]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (startTimeRef.current) {
                    const elapsed = Date.now() - startTimeRef.current;
                    accumulatedTimeRef.current += elapsed;
                    startTimeRef.current = null;
                }
            } else {
                startTimeRef.current = Date.now();
            }
        };
        if (!document.hidden) { startTimeRef.current = Date.now(); }
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (startTimeRef.current) {
                const elapsed = Date.now() - startTimeRef.current;
                accumulatedTimeRef.current += elapsed;
            }
            sendDurationData(accumulatedTimeRef.current);
            startTimeRef.current = null;
            accumulatedTimeRef.current = 0;
        };
    }, [sendDurationData]);

    const handleSrsFeedbackSubmit = async (wasCorrect) => {
        if (!srsEntryId || !srsReturnPath || !token) {
            toast({ title: "Hata", description: "SRS bilgileri eksik, sonuç kaydedilemedi.", status: "error", duration: 3000 });
            return;
        }
        setIsSubmittingSrs(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`${API_BASE_URL}/api/srs/submit-review/${srsEntryId}`, { wasCorrect }, config);
            toast({
                title: "Değerlendirme Kaydedildi",
                description: "Antrenör seansınıza yönlendiriliyorsunuz...",
                status: "success",
                duration: 2000,
                isClosable: true,
                position: "top"
            });
            navigate(`${srsReturnPath}?srsFeedback=${wasCorrect ? 'correct' : 'incorrect'}&srsEntryId=${srsEntryId}`, { replace: true });
        } catch (err) {
            console.error("SRS sonucu gönderilirken hata:", err);
            toast({
                title: "SRS Sonuç Hatası",
                description: err.response?.data?.message || "SRS değerlendirmeniz kaydedilemedi.",
                status: "error",
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setIsSubmittingSrs(false);
        }
    };

  if (loading) {
    return (
         <Container maxW="container.lg" py={8}>
             <Skeleton height="30px" width="200px" mb={6} /> 
             <Skeleton height="45px" width="60%" mb={10} /> 
             <VStack spacing={8} align="stretch">
                 <Card variant="outline" bg={cardBg} borderColor={borderColor} borderRadius="xl" boxShadow="lg">
                    <CardBody p={{base: 4, md: 6}}>
                        <Skeleton height="30px" width="50%" mb={4}/>
                        <Center my={5} sx={{'& > div': {width: '100% !important'}}}>
                            <Skeleton height={{base:"200px", md:"300px"}} borderRadius="md" w="full" maxW="xl"/>
                        </Center>
                        <SkeletonText mt="4" noOfLines={10} spacing="4" />
                    </CardBody>
                 </Card>
             </VStack>
        </Container>
    );
  }

  if (error) {
    return (
        <Container maxW="container.lg" mt={6} centerContent py={10} minH="calc(100vh - 160px)" display="flex" alignItems="center" justifyContent="center">
             <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={10} borderRadius="xl" boxShadow="lg" bg={useColorModeValue("red.50", "red.800")}>
                <AlertIcon boxSize="40px" color="red.400" />
                <AlertTitle mt={4} mb={2} fontSize="xl" fontWeight="bold" color={useColorModeValue("red.700", "red.100")}>Bir Hata Oluştu</AlertTitle>
                <AlertDescription maxWidth="md" color={useColorModeValue("red.600", "red.200")}>{error}</AlertDescription>
                <HStack mt={6} spacing={4}>
                    <Button colorScheme="red" variant="outline" onClick={fetchData} leftIcon={<Icon as={FaRedo} />}>
                        Tekrar Dene
                    </Button>
                    <Button as={RouterLink} to="/browse" variant="ghost" colorScheme="gray">
                        Konulara Dön
                    </Button>
                </HStack>
             </Alert>
        </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <Button 
        as={RouterLink} 
        to={isSrsReviewMode && srsReturnPath ? srsReturnPath : "/browse"}
        variant="link" 
        colorScheme="gray" 
        leftIcon={<Icon as={FaArrowLeft} />} 
        mb={6} 
        alignSelf="flex-start"
        color={textMutedColor}
        _hover={{color: headingColor}}
      >
        {isSrsReviewMode ? "Antrenör Seansına Dön" : "Tüm Konulara Geri Dön"}
      </Button>

      <Heading as="h1" size="2xl" mb={3} color={headingColor} borderBottomWidth="2px" borderColor={borderColor} pb={3}>
          {topicName}
      </Heading>
      <Text fontSize="lg" color={textColor} fontStyle="italic" mb={10}>
        Konu Anlatımı
      </Text>

      {lectures.length === 0 && !loading && !error && (
        <Alert status="info" variant="subtle" borderRadius="lg" py={8} justifyContent="center" flexDirection="column" alignItems="center" textAlign="center" bg={useColorModeValue("blue.50", "blue.800")} boxShadow="md" mt={8}>
            <AlertIcon as={FaInfoCircle} boxSize="32px" color="blue.400"/>
            <AlertTitle mt={3} fontSize="lg" fontWeight="medium">İçerik Bulunamadı</AlertTitle>
            <AlertDescription textAlign="center" ml={3} mt={2} color={textColor}>
                Bu konu başlığı için henüz detaylı bir konu anlatımı eklenmemiş.
            </AlertDescription>
        </Alert>
      )}

      <VStack spacing={10} align="stretch" className="lecture-list">
        {lectures.map((lecture) => (
          <Card key={lecture.id} variant="outline" size="lg" bg={cardBg} borderColor={borderColor} boxShadow="xl" borderRadius="xl" overflow="hidden">
            <CardBody p={{base: 5, md: 8}}>
              <Heading as="h2" size="xl" mb={6} color={headingColor} textAlign="center">{lecture.title}</Heading>
              {lecture.imageUrl && (
                <Center my={6} p={2} bg={useColorModeValue("gray.50", "gray.700")} borderRadius="lg">
                    <Image
                        src={API_BASE_URL + lecture.imageUrl}
                        alt={`${lecture.title} için görsel`}
                        borderRadius="md"
                        boxShadow="md"
                        maxW="full" // Kartın genişliğine sığsın
                        maxH="500px" // Maksimum yükseklik
                        objectFit="contain"
                        loading="lazy"
                        onError={(e) => e.target.style.display='none'}
                    />
                 </Center>
              )}
              <Box
                className="lecture-html-content"
                fontSize={{base:"md", md:"lg"}} // Okunabilirliği artır
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lecture.content) }}
                sx={{
                    color: textColor,
                    lineHeight: 'taller', 
                    'h1, h2, h3, h4, h5, h6': { fontFamily: 'heading', fontWeight:'bold', lineHeight:'shorter', my: 6, color: headingColor, borderBottom: "1px solid", borderColor: borderColor, pb:2 },
                    'p': { mb: 4, fontSize:"1.05em" },
                    'ul, ol': { pl: 6, mb: 4, li: { mb: 2, fontSize:"1.05em" } },
                    'img': { my: 5, borderRadius: 'lg', maxW: '100%', height: 'auto', display:'block', mx:'auto', boxShadow:'lg' },
                    'a': { color: 'brand.500', textDecoration: 'underline', _hover: { color: 'brand.600'} },
                    'code': { fontFamily:'mono', bg:useColorModeValue('gray.100', 'gray.900'), px:2, py:'3px', rounded:'md', fontSize:'sm', borderWidth:"1px", borderColor:borderColor},
                    'pre': { fontFamily:'mono', bg:useColorModeValue('gray.100', 'gray.900'), p:4, rounded:'lg', overflowX:'auto', fontSize:'sm', borderWidth:'1px', borderColor:borderColor, my:5, boxShadow:"inner"},
                    'blockquote': { borderLeft: "4px solid", borderColor:"brand.400", pl:4, py:2, my:4, bg:useColorModeValue("brand.50", "brand.900"), fontStyle:"italic", color:textColor }
                }}
              />
            </CardBody>
          </Card>
        ))}
      </VStack>

      {isSrsReviewMode && srsEntryId && (
        <Box mt={12} pt={8} borderTopWidth="2px" borderColor={borderColor} borderStyle="dashed">
          <Heading size="lg" textAlign="center" mb={8} color={headingColor}>
            SRS Değerlendirmesi
          </Heading>
          <Text textAlign="center" mb={6} color={textColor} fontSize="lg">
            Bu konuyu inceledikten sonra, hatırlama düzeyinizi belirtin:
          </Text>
          <Flex direction={{base: "column", sm: "row"}} justify="center" align="center" gap={6}>
            <Button
              colorScheme="red"
              size="lg"
              minW="200px"
              py={8}
              leftIcon={<Icon as={FaTimesCircle} boxSize={5} />}
              onClick={() => handleSrsFeedbackSubmit(false)}
              isLoading={isSubmittingSrs}
              loadingText="Kaydediliyor..."
              boxShadow="lg" _hover={{boxShadow:"xl", transform:"translateY(-2px)"}}
            >
              Tekrar Etmem Gerek
            </Button>
            <Button
              colorScheme="green"
              size="lg"
              minW="200px"
              py={8}
              leftIcon={<Icon as={FaCheckCircle} boxSize={5} />}
              onClick={() => handleSrsFeedbackSubmit(true)}
              isLoading={isSubmittingSrs}
              loadingText="Kaydediliyor..."
              boxShadow="lg" _hover={{boxShadow:"xl", transform:"translateY(-2px)"}}
            >
              İyi Hatırladım
            </Button>
          </Flex>
        </Box>
      )}
    </Container>
  );
}

export default LectureViewPage;
