import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Container,
  // Flex kaldırıldı, kullanılmıyor
  Button,
  // Link as ChakraLink kaldırıldı, kullanılmıyor
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
  // useColorModeValue kaldırıldı, gerek yok gibi
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

    const backendLectureUrl = `${API_BASE_URL}/api/lectures`;
    const backendTopicUrl = `${API_BASE_URL}/api/topics`;

    // fetchData useCallback (API yanıtı kontrolü güçlendirildi)
    const fetchData = useCallback(async () => {
        setLoading(true); setError('');
        setLectures([]); setTopicName('');

        if (!token) {
            setError("İçeriği görmek için giriş yapmalısınız."); setLoading(false); return;
        }
        if (!topicId) {
            setError("Geçerli bir konu ID'si bulunamadı."); setLoading(false); return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const lectureApiUrl = `${backendLectureUrl}?topicId=${topicId}`;
            const topicApiUrl = `${backendTopicUrl}/${topicId}`;

            const [lecturesRes, topicRes] = await Promise.all([
                axios.get(lectureApiUrl, config),
                axios.get(topicApiUrl, config)
            ]);
            // Gelen ders verisinin dizi olduğundan emin ol
            setLectures(Array.isArray(lecturesRes.data) ? lecturesRes.data : []);
            // Konu adı için fallback
            setTopicName(topicRes.data?.name || `Konu ID: ${topicId}`);

            // Konsol logunu kaldırabiliriz veya koşullu yapabiliriz
            // if (!lecturesRes.data || lecturesRes.data.length === 0) {
            //     console.log("Bu konu ve alt konuları için konu anlatımı bulunamadı.");
            // }

        } catch (err) {
            console.error("Konu anlatımı veya konu bilgisi çekilirken hata:", err);
            const errorMsg = err.response?.data?.message || 'İçerik yüklenirken bir hata oluştu.';
            setError(errorMsg);
            setTopicName(`Konu ID: ${topicId}`);
            setLectures([]); // Hata durumunda dersleri temizle
        } finally {
            setLoading(false);
        }
    }, [topicId, token, backendLectureUrl, backendTopicUrl]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Render Bölümü (Tema ile Uyumlu) ---

    if (loading) {
        // Skeleton tema stillerini kullanır
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
        // Alert ve Button tema stillerini kullanır
        return (
            <Container maxW="container.lg" mt={6}>
                 <Alert
                    status="error"
                    variant="subtle" // Temadaki alert varyantı
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    textAlign="center"
                    py={10}
                    borderRadius="lg" // Temadaki radii.lg
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
        <Container maxW="container.lg" py={8}>
             {/* Geri Dön Butonu - Tema stillerini (link, gray) kullanır */}
            <Button
                as={RouterLink}
                to="/browse"
                variant="link"
                colorScheme="gray" // Daha nötr bir renk veya 'brand' olabilir
                leftIcon={<Icon as={FaArrowLeft} />}
                mb={6}
                alignSelf="flex-start"
            >
                Konulara Geri Dön
            </Button>

             {/* Başlık - Tema stilini kullanır */}
            <Heading as="h1" size="xl" mb={8}>
                 {topicName} - Konu Anlatımları
            </Heading>

            {/* Ders Listesi */}
            <VStack spacing={6} align="stretch" className="lecture-list">
                 {/* Ders Yoksa Mesaj - Alert tema stilini kullanır */}
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
                     // Card tema stilini (outline, lg) kullanır
                    <Card key={lecture.id} variant="outline" size="lg">
                         {/* CardBody tema padding'ini (size=lg) kullanır */}
                        <CardBody p={{base: 4, md: 6}}>
                             {/* Heading tema stilini (lg) kullanır */}
                            <Heading as="h2" size="lg" mb={4}>{lecture.title}</Heading>

                            {/* Görsel */}
                            {lecture.imageUrl && (
                                <Center my={5}>
                                     {/* Image tema stilini (radii.md, shadows.sm) kullanır */}
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

                            {/* İçerik Alanı - HTML için sx ile özel stil */}
                            <Box
                                className="lecture-html-content"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lecture.content) }}
                                sx={{
                                    // Başlıklar için tema font ailesi ve ağırlığı
                                    'h1, h2, h3, h4, h5, h6': {
                                        fontFamily: 'heading', // Temadan
                                        fontWeight:'semibold', // Temadan
                                        lineHeight:'tight', // Temadan
                                        my: 4, // Temadan space.4
                                    },
                                    // Paragraflar için tema satır yüksekliği ve boşluk
                                    'p': {
                                        mb: 4, // Temadan space.4
                                        lineHeight: 'tall', // Temadan lineHeights.tall
                                    },
                                    // Listeler için tema boşlukları
                                    'ul, ol': { pl: 6, mb: 4 },
                                    'li': { mb: 2 },
                                    // Resimler için tema yuvarlaklığı ve boşluk
                                    'img': {
                                        my: 4,
                                        borderRadius: 'md', // Temadan radii.md
                                        maxW: '100%',
                                        height: 'auto',
                                        display:'block',
                                        mx:'auto'
                                    },
                                    // Linkler için özel renk (içerik linkleri farklı olabilir)
                                    'a': {
                                        color: 'brand.500', // Tema rengi veya 'blue.500'
                                        textDecoration: 'underline',
                                        _hover: { color: 'brand.600' }, // Tema rengi
                                    },
                                    // Kod blokları için tema fontları ve renkleri (semantic tokens)
                                    'code': {
                                        fontFamily:'mono', // Temadan
                                        bg:'bgTertiary', // Semantic Token
                                        px:1, py:'1px', // Temadan space.1
                                        rounded:'sm', // Temadan radii.sm
                                        fontSize:'sm', // Temadan fontSizes.sm
                                    },
                                    'pre': {
                                        fontFamily:'mono', // Temadan
                                        bg:'bgSecondary', // Semantic Token
                                        p:4, // Temadan space.4
                                        rounded:'md', // Temadan radii.md
                                        overflowX:'auto',
                                        fontSize:'sm', // Temadan fontSizes.sm
                                        borderWidth:'1px',
                                        borderColor:'borderSecondary', // Semantic Token
                                        my:5, // Temadan space.5
                                    }
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