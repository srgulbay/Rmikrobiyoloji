import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Container,
  Flex,
  Button,
  Link as ChakraLink,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  Skeleton, // İskelet yükleme
  SkeletonText,
  Image,      // Resim için
  Card,       // Kart için
  CardBody,   // Kart içeriği için
  VStack,     // Dikey yığınlama
  Center      // Ortalama için
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
    const navigate = useNavigate(); // useNavigate hook'u burada tanımlı

    const backendLectureUrl = `${API_BASE_URL}/api/lectures`;
    const backendTopicUrl = `${API_BASE_URL}/api/topics`;

    // fetchData useCallback aynı kalabilir
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        setLectures([]);
        setTopicName('');

        if (!token) {
            setError("İçeriği görmek için giriş yapmalısınız.");
            setLoading(false);
            return;
        }
        if (!topicId) {
            setError("Geçerli bir konu ID'si bulunamadı.");
            setLoading(false);
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const lectureApiUrl = `${backendLectureUrl}?topicId=${topicId}`;
            const topicApiUrl = `${backendTopicUrl}/${topicId}`;

            const [lecturesRes, topicRes] = await Promise.all([
                axios.get(lectureApiUrl, config),
                axios.get(topicApiUrl, config)
            ]);

            setLectures(lecturesRes.data || []);
            setTopicName(topicRes.data?.name || `Konu ID: ${topicId}`);

            if (!lecturesRes.data || lecturesRes.data.length === 0) {
                console.log("Bu konu ve alt konuları için konu anlatımı bulunamadı.");
            }

        } catch (err) {
            console.error("Konu anlatımı veya konu bilgisi çekilirken hata:", err);
            const errorMsg = err.response?.data?.message || 'İçerik yüklenirken bir hata oluştu.';
            setError(errorMsg);
            setTopicName(`Konu ID: ${topicId}`);
        } finally {
            setLoading(false);
        }
    }, [topicId, token, backendLectureUrl, backendTopicUrl]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Render Bölümü (Chakra UI ile) ---

    if (loading) {
        // Chakra UI İskelet Yükleme
        return (
             <Container maxW="container.lg" py={8}>
                 <Skeleton height="20px" width="150px" mb={4} /> {/* Geri link iskeleti */}
                 <Skeleton height="35px" width="60%" mb={8} /> {/* Başlık iskeleti */}
                 <VStack spacing={6} align="stretch"> {/* Konu anlatımları için iskelet */}
                     <Skeleton height="300px" borderRadius="lg" />
                     <Skeleton height="300px" borderRadius="lg" />
                 </VStack>
            </Container>
        );
    }

    // Hata Durumu
    if (error) {
        return (
            <Container maxW="container.lg" mt={6}>
                 <Alert
                    status="error"
                    variant="subtle"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    textAlign="center"
                    py={10}
                    borderRadius="lg"
                 >
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

    // Ana İçerik
    return (
        // Eski div.container yerine Chakra Container
        <Container maxW="container.lg" py={8}>
             {/* Eski Link yerine Chakra Button (RouterLink ile) */}
            <Button
                as={RouterLink}
                to="/browse"
                variant="link" // Link görünümü
                colorScheme="gray" // Veya tema rengi "brand"
                leftIcon={<Icon as={FaArrowLeft} />}
                mb={6}
                alignSelf="flex-start" // Sola yasla
            >
                Konulara Geri Dön
            </Button>

             {/* Eski h1 yerine Chakra Heading */}
            <Heading as="h1" size="xl" mb={8}>
                 {topicName} - Konu Anlatımları
            </Heading>

            {/* Eski div.lecture-list yerine VStack */}
            <VStack spacing={6} align="stretch" className="lecture-list">
                 {/* Ders Yoksa Mesaj */}
                {!loading && lectures.length === 0 && !error && (
                    <Alert status="info" variant="subtle" borderRadius="lg" py={6} justifyContent="center">
                        <AlertIcon as={FaInfoCircle} />
                        <AlertDescription textAlign="center" ml={3}>
                            Bu konu başlığı (ve alt başlıkları) için henüz konu anlatımı eklenmemiş.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Dersleri Listeleme */}
                {lectures.map((lecture) => (
                     // Eski article.lecture-item.card yerine Chakra Card
                    <Card key={lecture.id} variant="outline" size="lg"> {/* Boyut ve varyant ayarlanabilir */}
                        <CardBody p={{base: 4, md: 6}}> {/* Responsive padding */}
                             {/* Eski h3 yerine Chakra Heading */}
                            <Heading as="h2" size="lg" mb={4}>{lecture.title}</Heading>

                            {/* Görsel */}
                            {lecture.imageUrl && (
                                <Center my={5}> {/* Resmi ortalamak için */}
                                    <Image
                                        src={lecture.imageUrl}
                                        alt={`${lecture.title} için görsel`}
                                        borderRadius="md"
                                        boxShadow="sm"
                                        maxW="xl" // Maksimum genişlik
                                        objectFit="contain" // Resim oranını koru
                                        loading="lazy"
                                    />
                                 </Center>
                            )}

                            {/* İçerik Alanı */}
                             {/* className eklendi, global CSS ile stil verilecek */}
                            <Box
                                className="lecture-html-content"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lecture.content) }}
                                sx={{ // Temel stiller (daha fazlası global CSS'te olabilir)
                                    'h1, h2, h3, h4, h5, h6': { my: 4, fontWeight:'semibold', lineHeight:'tight' },
                                    'p': { mb: 4, lineHeight: 'tall' }, // Chakra'nın line height token'ı
                                    'ul, ol': { pl: 6, mb: 4 },
                                    'li': { mb: 2 },
                                    'img': { my: 4, borderRadius: 'md', maxW: '100%', height: 'auto', display:'block', mx:'auto' }, // Resimleri ortala
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