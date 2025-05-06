import React, { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import axios from 'axios';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopicCard from '../components/TopicCard'; // Güncellenmiş TopicCard'ı kullan
import {
  Box,
  Container,
  Flex,
  Button,
  IconButton,
  Link,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  SimpleGrid, // Grid için
  Heading,
  Text,
  Spinner, // Yükleme göstergesi
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  Skeleton, // İskelet yükleme için
  SkeletonText,
  SkeletonCircle,
  HStack // Yatay dizilim için
} from '@chakra-ui/react';
import { FaArrowLeft, FaBookOpen, FaPencilAlt, FaExclamationTriangle, FaInfoCircle, FaFolder, FaListAlt, FaRedo } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper Fonksiyonlar (Aynen kalabilir)
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
// --- Helper Fonksiyonlar Sonu ---

function TopicBrowserPage() {
    const [topicTree, setTopicTree] = useState([]);
    const [currentPathIds, setCurrentPathIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();
    const navigate = useNavigate();
    // const location = useLocation(); // Şu an kullanılmıyor gibi

    const backendTopicUrl = `${API_BASE_URL}/api/topics`;

    const fetchTopics = useCallback(async () => {
        setLoading(true); setError('');
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

    // Bu kısım aynı kalabilir
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

    // Bu kısım aynı kalabilir
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

    // Bu kısım aynı kalabilir
    const handleContentNavigation = (type, topicId) => {
        if (!topicId) return;
        if (type === 'lecture') {
            navigate(`/lectures/topic/${topicId}`);
        } else if (type === 'quiz') {
            navigate(`/solve?topicId=${topicId}`);
        }
    };
    // --- Helper ve Logic Fonksiyonları Sonu ---


    // --- Render Bölümü (Chakra UI ile) ---

    if (loading) {
        // Chakra UI İskelet Yükleme Ekranı
        return (
            <Container maxW="container.xl" py={8}>
                 {/* Breadcrumb Skeleton */}
                <Skeleton height="20px" width="50%" mb={6} />
                 {/* Back Button Skeleton */}
                <Skeleton height="32px" width="120px" mb={6} />
                 {/* Active Topic Skeleton */}
                <Skeleton height="100px" borderRadius="lg" mb={8} />
                 {/* Card Grid Skeleton */}
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} height="80px" borderRadius="md" />
                    ))}
                </SimpleGrid>
            </Container>
        );
    }

    if (error) {
        // Chakra UI Hata Ekranı
        return (
            <Container maxW="container.xl" mt={6}>
                 <Alert
                    status="error"
                    variant="subtle" // Veya 'solid', 'left-accent'
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    textAlign="center"
                    height="auto" // İçeriğe göre yükseklik
                    py={10} // Dikey padding
                    borderRadius="lg" // Kenar yuvarlaklığı
                >
                    <AlertIcon boxSize="40px" mr={0} as={FaExclamationTriangle} />
                    <AlertTitle mt={4} mb={1} fontSize="xl">
                        Bir Hata Oluştu
                    </AlertTitle>
                    <AlertDescription maxWidth="sm" mb={5}>
                        {error}
                    </AlertDescription>
                    <Button colorScheme="red" onClick={fetchTopics} leftIcon={<Icon as={FaRedo} />}>
                        Tekrar Dene
                    </Button>
                </Alert>
            </Container>
        );
    }

    // Ana İçerik Render
    return (
        // Eski main.topic-browser-page.container.py-8 yerine Chakra Container
        <Container maxW="container.xl" py={8}>

            {/* Navigasyon Alanı */}
            {/* Eski flex div yerine Chakra Flex */}
            <Flex wrap="wrap" align="center" justify="space-between" gap={4} mb={6}>
                 {/* Eski nav > ol.breadcrumb yerine Chakra Breadcrumb */}
                <Breadcrumb separator="/" spacing={2} fontSize="sm">
                    {breadcrumbItems.map((item, index) => {
                        const isLast = index === breadcrumbItems.length - 1;
                        return (
                            <BreadcrumbItem key={item.id || 'home'} isCurrentPage={isLast}>
                                <BreadcrumbLink
                                    as={!isLast && item.id !== null ? 'a' : 'span'} // Link veya span
                                    href={!isLast && item.id !== null ? '#' : undefined}
                                    onClick={!isLast && item.id !== null ? (e) => { e.preventDefault(); navigateToPath(index); } : undefined}
                                    fontWeight={isLast ? 'medium' : 'normal'}
                                    color={isLast ? 'textMuted' : 'textSecondary'} // Semantic token
                                    _hover={!isLast && item.id !== null ? { color: 'accent' } : {}} // Semantic token
                                    aria-current={isLast ? 'page' : undefined}
                                >
                                    {item.name}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        );
                    })}
                </Breadcrumb>
                {/* Eski Geri Butonu yerine Chakra Button */}
                {currentPathIds.length > 0 && (
                    <Button onClick={handleGoBack} variant="ghost" size="sm" leftIcon={<Icon as={FaArrowLeft} />} flexShrink={0}>
                         Geri ({breadcrumbItems[breadcrumbItems.length - 2]?.name || 'Konular'})
                    </Button>
                )}
            </Flex>

             {/* Aktif Konu Başlığı ve Aksiyonları */}
             {activeTopic && (
                 // Eski active-topic-section yerine Box
                 <Box mb={8} p={6} borderRadius="lg" bg="bgSecondary" borderWidth="1px" borderColor="borderPrimary" boxShadow="sm">
                      {/* Eski flex div yerine Chakra Flex */}
                      <Flex wrap="wrap" justify="space-between" align="center" gap={4}>
                          <Box flex="1" minW="0"> {/* Taşan metinler için */}
                               {/* Eski h2 yerine Chakra Heading */}
                               <Heading as="h2" size="lg" mb={1} noOfLines={2}> {/* Uzun başlıklar için */}
                                   {activeTopic.name}
                               </Heading>
                               {/* Eski p yerine Chakra Text */}
                               {activeTopic.description && <Text color="textMuted" fontSize="sm" mb={0} noOfLines={3}>{activeTopic.description}</Text>}
                          </Box>
                           {/* Eski action-buttons yerine Chakra HStack */}
                           <HStack spacing={3} flexShrink={0}>
                               {/* Eski button yerine Chakra Button */}
                               <Button
                                   onClick={() => handleContentNavigation('lecture', activeTopic.id)}
                                   variant="secondary" // Tema'dan gelen varyant
                                   leftIcon={<Icon as={FaBookOpen} />}
                                   title={`${activeTopic.name} Konu Anlatımı (Alt konular dahil)`}
                               >
                                   Konu Anlatımı
                               </Button>
                               <Button
                                    onClick={() => handleContentNavigation('quiz', activeTopic.id)}
                                    colorScheme="brand" // Tema'dan gelen ana renk
                                    leftIcon={<Icon as={FaPencilAlt} />}
                                    title={`${activeTopic.name} ve Alt Konuları İçin Soru Çöz`}
                                >
                                   Soruları Çöz
                               </Button>
                           </HStack>
                      </Flex>
                 </Box>
             )}

            {/* Alt Konular veya Boş Durum Mesajı */}
            {currentTopics.length > 0 ? (
                <>
                     {activeTopic && <Heading as="h3" size="md" mb={4} color="textSecondary">Alt Konular</Heading>}
                     {/* Eski card-grid yerine Chakra SimpleGrid */}
                     <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
                         {currentTopics.map(topic => (
                             // Chakra ile güncellenmiş TopicCard'ı kullan
                             <TopicCard
                                 key={topic.id}
                                 topic={topic}
                                 onSelectTopic={handleTopicSelect}
                             />
                         ))}
                     </SimpleGrid>
                 </>
            ) : (
                 !loading && ( // Sadece yükleme bittiyse göster
                    currentPathIds.length > 0 ? (
                         // Eski div yerine Chakra Text
                        <Text textAlign="center" color="textMuted" py={5} fontStyle="italic">
                            Bu konuda başka alt başlık bulunmuyor.
                        </Text>
                    ) : (
                         // Eski card yerine Chakra Box veya Card
                        <Box textAlign="center" py={8} bg="bgSecondary" borderRadius="lg" borderWidth="1px" borderColor="borderPrimary">
                            <Icon as={FaFolder} boxSize="40px" color="textMuted" mb={4} />
                            <Heading as="h3" size="md" mb={3}>Henüz Konu Eklenmemiş</Heading>
                            <Text color="textMuted">İçeriklere göz atmak için lütfen Yönetim Panelinden konuları ekleyin.</Text>
                       </Box>
                   )
                 )
            )}
        </Container>
    );
} // TopicBrowserPage Sonu

export default TopicBrowserPage;