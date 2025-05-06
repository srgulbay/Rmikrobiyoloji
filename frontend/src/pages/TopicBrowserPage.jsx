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
  Link, // Chakra Link
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
  SkeletonCircle, // Skeleton için
  HStack,
  VStack,
  Center,
  useColorModeValue // Renkler için
} from '@chakra-ui/react';
import { FaArrowLeft, FaBookOpen, FaPencilAlt, FaExclamationTriangle, FaInfoCircle, FaFolder, FaFolderOpen, FaListAlt, FaRedo } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper Fonksiyonlar (Aynı kalabilir)
const findTopicAndPathById = (id, nodes, currentPath = []) => {
  for (const node of nodes) {
    const newPath = [...currentPath, { id: node.id, name: node.name }];
    if (node.id === id) { return { topic: node, path: newPath }; }
    if (node.children) {
      const found = findTopicAndPathById(id, node.children, newPath);
      if (found) return found;
    }
  }
  return null;
};
const getTopicFromPath = (pathIds, tree) => {
  if (!pathIds || pathIds.length === 0) return null;
  let currentLevel = tree; let topic = null;
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

    const backendTopicUrl = `${API_BASE_URL}/api/topics`;

    // fetchTopics, handleTopicSelect, handleGoBack, breadcrumbItems, navigateToPath, handleContentNavigation aynı kalabilir
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
    // --- Logic Sonu ---


    // --- Render Bölümü (Chakra UI ile Mükemmelleştirilmiş) ---

    if (loading) {
        // İskelet Ekranı
        return (
            <Container maxW="container.xl" py={8}>
                <HStack mb={6} spacing={4}>
                     <Skeleton height="20px" width="20%" />
                     <Skeleton height="20px" width="20%" />
                     <Skeleton height="32px" width="120px" ml="auto" />
                </HStack>
                <Skeleton height="120px" borderRadius="lg" mb={8} />
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
                    {[...Array(8)].map((_, i) => ( <Skeleton key={i} height="100px" borderRadius="lg" /> ))}
                </SimpleGrid>
            </Container>
        );
    }

    if (error) {
        // Hata Ekranı
        return ( <Container maxW="container.lg" mt={10}> <Alert status="error" variant="left-accent" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={10} borderRadius="lg"> <AlertIcon boxSize="40px" mr={0} as={FaExclamationTriangle} /> <AlertTitle mt={4} mb={1} fontSize="xl">Bir Hata Oluştu</AlertTitle> <AlertDescription maxWidth="sm" mb={5}>{error}</AlertDescription> <Button colorScheme="red" onClick={fetchTopics} leftIcon={<Icon as={FaRedo} />}> Tekrar Dene </Button> </Alert> </Container> );
    }

    // Ana İçerik Render
    return (
        <Container maxW="container.xl" py={8}>

            {/* Navigasyon Alanı */}
            <Flex wrap="wrap" align="center" justify="space-between" gap={4} mb={8}> {/* Alt boşluk artırıldı */}
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
                                    _hover={!isLast && item.id !== null ? { color: 'accent', textDecor: 'underline' } : {}}
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

             {/* Aktif Konu Başlığı ve Aksiyonları (Daha Belirgin) */}
             {activeTopic && (
                 <Box mb={10} p={6} borderRadius="xl" bg={useColorModeValue('brand.50', 'brand.900')} borderWidth="1px" borderColor={useColorModeValue('brand.100', 'brand.700')} boxShadow="md">
                      <Flex wrap="wrap" justify="space-between" align="center" gap={4}>
                          <HStack spacing={4} flex="1" minW={0}>
                               <Icon as={FaFolderOpen} boxSize="24px" color="brand.500" _dark={{color:"brand.200"}}/>
                               <Box>
                                   <Heading as="h2" size="lg" color="brand.700" _dark={{color:"brand.100"}} noOfLines={2}>
                                       {activeTopic.name}
                                   </Heading>
                                   {activeTopic.description && <Text color="brand.600" _dark={{color:"brand.200"}} fontSize="sm" noOfLines={2}>{activeTopic.description}</Text>}
                               </Box>
                          </HStack>
                           <HStack spacing={3} flexShrink={0} mt={{base: 4, md: 0}}>
                               <Button
                                   onClick={() => handleContentNavigation('lecture', activeTopic.id)}
                                   variant="outline"
                                   colorScheme="brand" // Ana renkle uyumlu outline
                                   leftIcon={<Icon as={FaBookOpen} />}
                                   title={`${activeTopic.name} Konu Anlatımı`}
                                   _hover={{ bg: useColorModeValue('brand.100', 'brand.800') }}
                               >
                                   Konu Anlatımı
                               </Button>
                               <Button
                                    onClick={() => handleContentNavigation('quiz', activeTopic.id)}
                                    colorScheme="brand" // Ana renk
                                    leftIcon={<Icon as={FaPencilAlt} />}
                                    title={`${activeTopic.name} Soru Çöz`}
                                    _hover={{ bg: useColorModeValue('brand.600', 'brand.400') }} // Hafif koyu/açık hover
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
                     {activeTopic && (
                         <Heading as="h3" size="md" mb={5} color="textSecondary" fontWeight="semibold">
                            Alt Konular
                         </Heading>
                     )}
                     {/* Güncellenmiş TopicCard ile SimpleGrid */}
                     <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={5}>
                         {currentTopics.map(topic => (
                             <TopicCard
                                 key={topic.id}
                                 topic={topic}
                                 onSelectTopic={handleTopicSelect}
                                 // Ekstra props veya stil gerekirse buraya eklenebilir
                             />
                         ))}
                     </SimpleGrid>
                 </>
            ) : (
                 !loading && ( // Sadece yükleme bittiyse göster
                    currentPathIds.length > 0 ? (
                         // Daha bilgilendirici boş durum
                        <Center py={10}>
                            <Text color="textMuted" fontStyle="italic">
                                Bu konuda başka alt başlık bulunmuyor.
                            </Text>
                        </Center>
                    ) : (
                         // Daha ilgi çekici boş durum kartı
                        <Card variant="outline" textAlign="center" py={10} mt={8} bg="bgSecondary">
                             <CardBody>
                                <Icon as={FaFolder} boxSize="40px" color="textMuted" mb={4} />
                                <Heading as="h3" size="md" mb={3}>Henüz Konu Eklenmemiş</Heading>
                                <Text color="textMuted">İçeriklere göz atmak için lütfen Yönetim Panelinden konuları ekleyin.</Text>
                                {/* Opsiyonel: Yönetim paneline link */}
                                {/* <Button as={RouterLink} to="/admin" colorScheme="brand" variant="outline" mt={6}>Yönetim Paneline Git</Button> */}
                            </CardBody>
                       </Card>
                   )
                 )
            )}
        </Container>
    );
}

export default TopicBrowserPage;