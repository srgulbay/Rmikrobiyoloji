import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopicCard from '../components/TopicCard'; // Chakra ile güncellenmiş hali kullanılıyor varsayılıyor
import {
  Box,
  Container,
  Flex,
  Button,
  IconButton,
  Link as ChakraLink,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  SimpleGrid,
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
  SkeletonCircle, // Gerekirse
  HStack,
  VStack,
  Center, // Ortalama için
  Fade // Geçiş efekti için
} from '@chakra-ui/react';
import { FaArrowLeft, FaBookOpen, FaPencilAlt, FaExclamationTriangle, FaInfoCircle, FaFolder, FaListAlt, FaRedo } from 'react-icons/fa';
// motion eklemeye gerek yok, Fade yeterli olabilir

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper Fonksiyonlar (Aynen kalabilir)
// ... (findTopicAndPathById ve getTopicFromPath fonksiyonları burada)
const findTopicAndPathById = (id, nodes, currentPath = []) => {
  for (const node of nodes) {
    const newPath = [...currentPath, { id: node.id, name: node.name }];
    if (node.id === id) {
      return { topic: node, path: newPath };
    }
    if (node.children) {
      const found = findTopicAndPathById(id, node.children, newPath);
      if (found) return found;
    }
  }
  return null;
};
const getTopicFromPath = (pathIds, tree) => {
  if (!pathIds || pathIds.length === 0) return null;
  let currentLevel = tree;
  let topic = null;
  for (const id of pathIds) {
    topic = currentLevel?.find(t => t.id === id);
    if (!topic) return null;
    currentLevel = topic.children;
  }
  return topic;
};


function TopicBrowserPage() {
    // State'ler ve hook'lar aynı kalabilir
    const [topicTree, setTopicTree] = useState([]);
    const [currentPathIds, setCurrentPathIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();
    const navigate = useNavigate();

    const backendTopicUrl = `${API_BASE_URL}/api/topics`;

    // fetchData, useEffect, useMemo, handleTopicSelect, handleGoBack,
    // breadcrumbItems, navigateToPath, handleContentNavigation
    // fonksiyonları aynı kalabilir.

    const fetchTopics = useCallback(async () => {
        setLoading(true); setError('');
        // Yapay gecikme (Test için, gerçekte kaldırın)
        // await new Promise(resolve => setTimeout(resolve, 1000));
        if (!token) { setError("Konuları görmek için giriş yapmalısınız."); setLoading(false); return;}
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(backendTopicUrl, config);
            setTopicTree(response.data || []);
        } catch (err) {
            console.error("Konu ağacı çekilirken hata:", err);
            const errorMsg = err.response?.data?.message || 'Konular yüklenirken bir sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [token, backendTopicUrl]);

    useEffect(() => { fetchTopics(); }, [fetchTopics]);

    const { activeTopic, currentTopics } = useMemo(() => {
        const topic = getTopicFromPath(currentPathIds, topicTree);
        const children = currentPathIds.length === 0 ? topicTree : topic?.children || [];
        return { activeTopic: topic, currentTopics: children };
    }, [currentPathIds, topicTree]);

    const handleTopicSelect = useCallback((selectedTopic) => {
        setError('');
        setCurrentPathIds(prevPath => [...prevPath, selectedTopic.id]);
    }, []);

    const handleGoBack = useCallback(() => {
        setError('');
        setCurrentPathIds(prevPath => prevPath.slice(0, -1));
    }, []);

     const breadcrumbItems = useMemo(() => {
        const items = [{ id: null, name: 'Konular', isLink: currentPathIds.length > 0 }];
        let currentLevel = topicTree;
        currentPathIds.forEach((pathId, index) => {
            const found = currentLevel?.find(t => t.id === pathId);
            if (found) {
                items.push({ id: pathId, name: found.name, isLink: index < currentPathIds.length - 1 });
                currentLevel = found.children;
            }
        });
        return items;
    }, [currentPathIds, topicTree]);

    const navigateToPath = useCallback((index) => {
        setCurrentPathIds(currentPathIds.slice(0, index));
    }, [currentPathIds]);

    const handleContentNavigation = (type, topicId) => {
        if (!topicId) return;
        if (type === 'lecture') {
            navigate(`/lectures/topic/${topicId}`);
        } else if (type === 'quiz') {
            navigate(`/solve?topicId=${topicId}`);
        }
    };

    // --- Render Bölümü (Daha İyileştirilmiş) ---

    if (loading) {
        // Daha Detaylı İskelet Yükleme Ekranı
        return (
            <Container maxW="container.xl" py={8}>
                {/* Breadcrumb & Back Button Skeleton */}
                <Flex wrap="wrap" align="center" justify="space-between" gap={4} mb={6}>
                     <Skeleton height="20px" width="50%" />
                     <Skeleton height="32px" width="120px" />
                </Flex>
                 {/* Active Topic Skeleton (Varsa) */}
                 {/* currentPathIds boş değilse activeTopic iskeleti gösterilebilir ama şimdilik basit tutalım */}
                <Skeleton height="100px" borderRadius="lg" mb={8} />
                 {/* Card Grid Skeleton */}
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
                    {[...Array(8)].map((_, i) => ( // Daha fazla iskelet kartı
                        <Skeleton key={i} height="90px" borderRadius="md" /> // Kart yüksekliğine yakın
                    ))}
                </SimpleGrid>
            </Container>
        );
    }

    if (error) {
        // Hata Ekranı (Aynı kalabilir veya geliştirilebilir)
        return (
             <Container maxW="container.xl" mt={6}>
                 <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={10} borderRadius="lg">
                     <AlertIcon boxSize="40px" mr={0} as={FaExclamationTriangle} />
                     <AlertTitle mt={4} mb={1} fontSize="xl">Bir Hata Oluştu</AlertTitle>
                     <AlertDescription maxWidth="sm" mb={5}>{error}</AlertDescription>
                     <Button colorScheme="red" onClick={fetchTopics} leftIcon={<Icon as={FaRedo} />}>Tekrar Dene</Button>
                 </Alert>
             </Container>
        );
    }

    // Ana İçerik Render
    return (
        <Container maxW="container.xl" py={8}>

            {/* Navigasyon Alanı */}
            <Flex wrap="wrap" align="center" justify="space-between" gap={4} mb={6}>
                <Breadcrumb separator="/" spacing={2} fontSize="sm">
                    {breadcrumbItems.map((item, index) => {
                        const isLast = index === breadcrumbItems.length - 1;
                        return (
                            <BreadcrumbItem key={item.id || 'home'} isCurrentPage={isLast}>
                                <BreadcrumbLink
                                    as={!isLast && item.id !== null ? 'a' : 'span'}
                                    href={!isLast && item.id !== null ? '#' : undefined}
                                    onClick={!isLast && item.id !== null ? (e) => { e.preventDefault(); navigateToPath(index); } : undefined}
                                    fontWeight={isLast ? 'semibold' : 'normal'} // Aktif olanı kalın yap
                                    color={isLast ? 'textPrimary' : 'textSecondary'} // Aktif olanı daha belirgin yap
                                    _hover={!isLast && item.id !== null ? { color: 'accent', textDecor: 'underline' } : {}} // Hover efekti
                                    aria-current={isLast ? 'page' : undefined}
                                >
                                    {item.name}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        );
                    })}
                </Breadcrumb>
                {currentPathIds.length > 0 && (
                    <Button onClick={handleGoBack} variant="outline" size="sm" leftIcon={<Icon as={FaArrowLeft} />} flexShrink={0}>
                         Geri ({breadcrumbItems[breadcrumbItems.length - 2]?.name || 'Konular'})
                    </Button>
                )}
            </Flex>

             {/* Aktif Konu Başlığı ve Aksiyonları (Daha belirgin arkaplan/gölge ve geçiş efekti) */}
             <Fade in={!!activeTopic} unmountOnExit> {/* Sadece activeTopic varsa göster ve geçiş ekle */}
                {activeTopic && (
                    <Box
                        mb={8} p={6} borderRadius="xl" // Daha yuvarlak köşe
                        bg="bgTertiary" // Daha belirgin arka plan
                        borderWidth="1px" borderColor="borderSecondary" // Hafif border
                        boxShadow="lg" // Daha belirgin gölge
                    >
                        <Flex wrap="wrap" justify="space-between" align="center" gap={4}>
                            <Box flex="1" minW="0">
                                <Heading as="h2" size="lg" mb={1} noOfLines={2} color="textPrimary">
                                    {activeTopic.name}
                                </Heading>
                                {activeTopic.description && <Text color="textSecondary" fontSize="sm" mb={0} noOfLines={3}>{activeTopic.description}</Text>}
                            </Box>
                            <HStack spacing={3} flexShrink={0}>
                                <Button
                                    onClick={() => handleContentNavigation('lecture', activeTopic.id)}
                                    variant="solid" // Daha belirgin olabilir
                                    colorScheme="blue" // Farklı renk
                                    leftIcon={<Icon as={FaBookOpen} />}
                                    title={`${activeTopic.name} Konu Anlatımı`}
                                    size="sm" // Butonları biraz küçültebiliriz
                                >
                                    Konu Anlatımı
                                </Button>
                                <Button
                                    onClick={() => handleContentNavigation('quiz', activeTopic.id)}
                                    colorScheme="brand"
                                    leftIcon={<Icon as={FaPencilAlt} />}
                                    title={`${activeTopic.name} Soruları Çöz`}
                                    size="sm"
                                >
                                    Soruları Çöz
                                </Button>
                            </HStack>
                        </Flex>
                    </Box>
                )}
            </Fade>

            {/* Alt Konular veya Boş Durum Mesajı (Geçiş efekti ile) */}
            <Fade in={!loading} key={currentPathIds.join('-') || 'root'}> {/* Path değiştiğinde fade olsun */}
                {currentTopics.length > 0 ? (
                    <>
                        {activeTopic && <Heading as="h3" size="md" mb={4} color="textSecondary" fontWeight="medium">Alt Konular</Heading>}
                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={5}> {/* Spacing ayarlandı */}
                            {currentTopics.map(topic => (
                                <TopicCard
                                    key={topic.id}
                                    topic={topic}
                                    onSelectTopic={handleTopicSelect}
                                    // TopicCard'a hover/active efektleri eklenmişti
                                />
                            ))}
                        </SimpleGrid>
                    </>
                ) : (
                    !loading && ( // Sadece yükleme bittiğinde göster
                        <Center py={10}>
                            <VStack spacing={3}>
                                <Icon as={currentPathIds.length > 0 ? FaInfoCircle : FaFolder} boxSize="40px" color="textMuted" />
                                <Text color="textMuted" fontStyle={currentPathIds.length > 0 ? 'italic' : 'normal'}>
                                    {currentPathIds.length > 0
                                        ? "Bu konuda başka alt başlık bulunmuyor."
                                        : "Henüz konu eklenmemiş. Yönetim panelinden ekleyebilirsiniz."}
                                </Text>
                            </VStack>
                        </Center>
                    )
                )}
            </Fade>
        </Container>
    );
}

export default TopicBrowserPage;