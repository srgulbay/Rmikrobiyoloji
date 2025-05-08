import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
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
} from '@chakra-ui/react';
import { FaArrowLeft, FaExclamationTriangle, FaInfoCircle, FaRedo } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function LectureViewPage() {
    const { topicId } = useParams();
    const [lectures, setLectures] = useState([]);
    const [topicName, setTopicName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();
    const navigate = useNavigate();

    // --- Süre Takibi için Ref'ler ---
    const startTimeRef = useRef(null); // Sayfa görünür olduğunda başlangıç zamanı
    const accumulatedTimeRef = useRef(0); // Toplam görünür kalma süresi (ms)

    const backendLectureUrl = `${API_BASE_URL}/api/lectures`;
    const backendTopicUrl = `${API_BASE_URL}/api/topics`;
    const backendLectureViewUrl = `${API_BASE_URL}/api/lecture-views`; // Yeni endpoint

    const fetchData = useCallback(async () => {
        setLoading(true); setError('');
        setLectures([]); setTopicName('');
        accumulatedTimeRef.current = 0; // Veri yeniden çekildiğinde süreyi sıfırla
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

    // Süre gönderme fonksiyonu
    const sendDurationData = useCallback(async (totalDurationMs) => {
        const durationInSeconds = Math.round(totalDurationMs / 1000);
        // Sadece anlamlı bir süre varsa gönder (örn: 3 saniyeden fazla)
        if (!token || lectures.length === 0 || !lectures[0]?.id || durationInSeconds < 3) {
            console.log("Duration not sent (insufficient time or data). Duration:", durationInSeconds, "Lecture ID:", lectures[0]?.id);
            return;
        }

        const lectureIdToSend = lectures[0].id; // Şimdilik ilk dersin ID'sini gönderiyoruz

        try {
            console.log(`Sending lecture view duration: lectureId=${lectureIdToSend}, duration=${durationInSeconds}s`);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(backendLectureViewUrl, {
                lectureId: lectureIdToSend,
                duration: durationInSeconds
            }, config);
        } catch (error) {
            console.error('Ders görüntüleme süresi gönderilirken hata:', error);
        }
    }, [token, lectures, backendLectureViewUrl]); // lectures bağımlılığı eklendi

    // Görünürlük ve Süre Takibi useEffect'i
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Sayfa gizlendi, geçen süreyi hesapla ve biriktir
                if (startTimeRef.current) {
                    const elapsed = Date.now() - startTimeRef.current;
                    accumulatedTimeRef.current += elapsed;
                    startTimeRef.current = null; // Başlangıç zamanını sıfırla
                    console.log(`Page hidden. Accumulated time: ${Math.round(accumulatedTimeRef.current / 1000)}s`);
                }
            } else {
                // Sayfa görünür oldu, başlangıç zamanını ayarla
                startTimeRef.current = Date.now();
                 console.log("Page visible. Timer started.");
            }
        };

        // Sayfa yüklendiğinde görünürse zamanlayıcıyı başlat
        if (!document.hidden) {
            startTimeRef.current = Date.now();
             console.log("Initial page visible. Timer started.");
        }

        // Listener'ları ekle
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Component unmount olduğunda çalışacak cleanup fonksiyonu
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // Unmount anında sayfa görünür durumdaysa son geçen süreyi de ekle
            if (startTimeRef.current) {
                const elapsed = Date.now() - startTimeRef.current;
                accumulatedTimeRef.current += elapsed;
                console.log(`Page unmounting while visible. Final accumulated time: ${Math.round(accumulatedTimeRef.current / 1000)}s`);
            } else {
                 console.log(`Page unmounting while hidden. Final accumulated time: ${Math.round(accumulatedTimeRef.current / 1000)}s`);
            }
            // Toplam süreyi backend'e gönder
            sendDurationData(accumulatedTimeRef.current);
            // Ref'leri temizle (teknik olarak gerekli değil ama iyi pratik)
            startTimeRef.current = null;
            accumulatedTimeRef.current = 0;
        };
    }, [sendDurationData]); // sendDurationData bağımlılığı eklendi

    if (loading) {
        return (
             <Container maxW="container.lg" py={8}>
                 <Skeleton height="20px" width="150px" mb={4} />
                 <Skeleton height="35px" width="60%" mb={8} />
                 <VStack spacing={6} align="stretch">
                     <Skeleton height="300px" borderRadius="lg" />
                     <Skeleton height="300px" borderRadius="lg" />
                 </VStack>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxW="container.lg" mt={6}>
                 <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={10} borderRadius="lg">
                    <AlertIcon boxSize="40px" mr={0} as={FaExclamationTriangle} />
                    <AlertTitle mt={4} mb={1} fontSize="xl">Bir Hata Oluştu</AlertTitle>
                    <AlertDescription maxWidth="sm" mb={5}>{error}</AlertDescription>
                    <Button colorScheme="red" variant="outline" onClick={fetchData} leftIcon={<Icon as={FaRedo} />}>
                        Tekrar Dene
                    </Button>
                 </Alert>
            </Container>
        );
    }

    return (
        <Container maxW="container.lg" py={8}>
            <Button as={RouterLink} to="/browse" variant="link" colorScheme="gray" leftIcon={<Icon as={FaArrowLeft} />} mb={6} alignSelf="flex-start">
                Konulara Geri Dön
            </Button>

            <Heading as="h1" size="xl" mb={8}>
                 {topicName} - Konu Anlatımları
            </Heading>

            <VStack spacing={6} align="stretch" className="lecture-list">
                {!loading && lectures.length === 0 && !error && (
                    <Alert status="info" variant="subtle" borderRadius="lg" py={6} justifyContent="center">
                        <AlertIcon as={FaInfoCircle} />
                        <AlertDescription textAlign="center" ml={3}>
                            Bu konu başlığı (ve alt başlıkları) için henüz konu anlatımı eklenmemiş.
                        </AlertDescription>
                    </Alert>
                )}

                {lectures.map((lecture) => (
                    <Card key={lecture.id} variant="outline" size="lg">
                        <CardBody p={{base: 4, md: 6}}>
                            <Heading as="h2" size="lg" mb={4}>{lecture.title}</Heading>
                            {lecture.imageUrl && (
                                <Center my={5}>
                                    <Image
                                        src={lecture.imageUrl}
                                        alt={`${lecture.title} için görsel`}
                                        borderRadius="md"
                                        boxShadow="sm"
                                        maxW="xl"
                                        objectFit="contain"
                                        loading="lazy"
                                    />
                                 </Center>
                            )}
                            <Box
                                className="lecture-html-content"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lecture.content) }}
                                sx={{
                                    'h1, h2, h3, h4, h5, h6': { fontFamily: 'heading', fontWeight:'semibold', lineHeight:'tight', my: 4, },
                                    'p': { mb: 4, lineHeight: 'tall', },
                                    'ul, ol': { pl: 6, mb: 4 },
                                    'li': { mb: 2 },
                                    'img': { my: 4, borderRadius: 'md', maxW: '100%', height: 'auto', display:'block', mx:'auto' },
                                    'a': { color: 'brand.500', textDecoration: 'underline', _hover: { color: 'brand.600'} },
                                    'code': { fontFamily:'mono', bg:'bgTertiary', px:1, py:'1px', rounded:'sm', fontSize:'sm'},
                                    'pre': { fontFamily:'mono', bg:'bgSecondary', p:4, rounded:'md', overflowX:'auto', fontSize:'sm', borderWidth:'1px', borderColor:'borderSecondary', my:5}
                                }}
                            />
                        </CardBody>
                    </Card>
                ))}
            </VStack>
        </Container>
    );
}

export default LectureViewPage;