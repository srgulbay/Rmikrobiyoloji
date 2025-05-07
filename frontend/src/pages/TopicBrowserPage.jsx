import React, { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import axios from 'axios';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopicCard from '../components/TopicCard'; // Tema kullanan TopicCard varsayılıyor
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
  SkeletonCircle,
  HStack,
  Center,
  useColorModeValue, // Sadece top-level'da çağrılacak
  Card, CardBody // Boş durum kartı için
} from '@chakra-ui/react';
import { FaArrowLeft, FaBookOpen, FaPencilAlt, FaExclamationTriangle, FaInfoCircle, FaFolder, FaFolderOpen, FaListAlt, FaRedo } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper Fonksiyonlar
const findTopicAndPathById = (id, nodes, currentPath = []) => {
  if (!Array.isArray(nodes)) return null; // Ekstra güvenlik
  for (const node of nodes) {
    const newPath = [...currentPath, { id: node.id, name: node.name }];
    if (node.id === id) { return { topic: node, path: newPath }; }
    if (Array.isArray(node.children)) { // Children'ın dizi olduğunu kontrol et
      const found = findTopicAndPathById(id, node.children, newPath);
      if (found) return found;
    }
  }
  return null;
};

const getTopicFromPath = (pathIds, tree) => {
  if (!pathIds || pathIds.length === 0) return null;
  let currentLevel = Array.isArray(tree) ? tree : []; // tree'nin dizi olduğundan emin ol
  let topic = null;
  for (const id of pathIds) {
    currentLevel = Array.isArray(currentLevel) ? currentLevel : []; // Her seviyenin dizi olduğundan emin ol
    topic = currentLevel.find(t => t.id === id);
    if (!topic) return null;
    currentLevel = Array.isArray(topic.children) ? topic.children : []; // Children'ın dizi olduğundan emin ol
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

    // --- Tema Değerlerini Top-Level'da Al ---
    // Hooks'ları koşulsuz olarak en üst seviyede çağırın
    const activeTopicBg = useColorModeValue('brand.50', 'brand.900');
    const activeTopicBorder = useColorModeValue('brand.100', 'brand.700');
    // Diğer useColorModeValue çağrıları semantic token'lar veya bileşen stilleri ile yönetiliyor olmalı.

    // fetchTopics (API yanıtı kontrolü güçlendirildi)
    const fetchTopics = useCallback(async () => {
        setLoading(true); setError('');
        if (!token) { setError("Konuları görmek için giriş yapmalısınız."); setLoading(false); return; }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(backendTopicUrl, config);
            // API'den gelen verinin dizi olduğundan emin ol
            setTopicTree(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Konu ağacı çekilirken hata:", err);
            const errorMsg = err.response?.data?.message || 'Konular yüklenirken bir sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
            setError(errorMsg);
            setTopicTree([]); // Hata durumunda boş dizi ata
        } finally {
            setLoading(false);
        }
    }, [token, backendTopicUrl]);

    useEffect(() => { fetchTopics(); }, [fetchTopics]);

    // currentTopics'in her zaman dizi olmasını garantileyen useMemo
    const { activeTopic, currentTopics } = useMemo(() => {
        const rootLevel = Array.isArray(topicTree) ? topicTree : [];
        const topic = getTopicFromPath(currentPathIds, rootLevel);
        let childrenToDisplay = [];
        if (currentPathIds.length === 0) {
            childrenToDisplay = rootLevel;
        } else if (topic && Array.isArray(topic.children)) { // Children'ın dizi olduğunu kontrol et
            childrenToDisplay = topic.children;
        }
        return { activeTopic: topic, currentTopics: childrenToDisplay };
    }, [currentPathIds, topicTree]);

    const handleTopicSelect = useCallback((selectedTopic) => {
        setError('');
        setCurrentPathIds(prevPath => [...prevPath, selectedTopic.id]);
    }, []);

    const handleGoBack = useCallback(() => {
        setError('');
        setCurrentPathIds(prevPath => prevPath.slice(0, -1));
    }, []);

    // breadcrumbItems (currentLevel kontrolü eklendi)
    const breadcrumbItems = useMemo(() => {
        const rootLevel = Array.isArray(topicTree) ? topicTree : [];
        const items = [{ id: null, name: 'Konular', isLink: currentPathIds.length > 0, isRoot: true }];
        let currentLevel = rootLevel;
        currentPathIds.forEach((pathId, index) => {
            currentLevel = Array.isArray(currentLevel) ? currentLevel : []; // Her zaman dizi kontrolü
            const found = currentLevel.find(t => t.id === pathId);
            if (found) {
              items.push({ id: pathId, name: found.name, isLink: index < currentPathIds.length - 1 });
              currentLevel = Array.isArray(found.children) ? found.children : []; // Bir sonraki seviye için dizi kontrolü
            } else {
              console.warn(`Breadcrumb oluşturulurken ID ${pathId} bulunamadı.`);
            }
        });
        return items;
      }, [currentPathIds, topicTree]);

    // navigateToPath (isRoot kontrolü eklendi)
    const navigateToPath = useCallback((index, isRoot = false) => {
        if (isRoot && index === 0) {
             setCurrentPathIds([]);
        } else {
             setCurrentPathIds(currentPathIds.slice(0, index));
        }
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


    // --- Render Bölümü (Tema ile Uyumlu) ---

    if (loading) {
        // İskelet Ekranı (Temadan etkilenir)
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
        // Hata Ekranı (Temadan etkilenir)
        return (
             <Container maxW="container.lg" mt={10}>
                  <Alert status="error" variant="left-accent" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={10} borderRadius="lg">
                      <AlertIcon boxSize="40px" mr={0} as={FaExclamationTriangle} />
                      <AlertTitle mt={4} mb={1} fontSize="xl">Bir Hata Oluştu</AlertTitle>
                      <AlertDescription maxWidth="sm" mb={5}>{error}</AlertDescription>
                      <Button colorScheme="red" onClick={fetchTopics} leftIcon={<Icon as={FaRedo} />}>
                          Tekrar Dene
                      </Button>
                  </Alert>
            </Container>
        );
    }

    // Ana İçerik Render
    return (
        <Container maxW="container.xl" py={8}>

            {/* Navigasyon Alanı */}
            <Flex wrap="wrap" align="center" justify="space-between" gap={4} mb={8}>
                <Breadcrumb separator="/" spacing={2} fontSize="sm">
                    {breadcrumbItems.map((item, index) => {
                        const isLast = index === breadcrumbItems.length - 1;
                        const isRootLink = !!item.isRoot && currentPathIds.length > 0; // isRoot flag'ini kontrol et
                        const isClickable = (!isLast && item.id !== null) || isRootLink;

                        return (
                            <BreadcrumbItem key={item.id || 'home'} isCurrentPage={isLast}>
                                <BreadcrumbLink
                                    as={isClickable ? Link : 'span'}
                                    onClick={isClickable ? (e) => { e.preventDefault(); navigateToPath(index, !!item.isRoot); } : undefined}
                                    fontWeight={isLast ? 'semibold' : 'normal'}
                                    color={isLast ? 'textPrimary' : 'textSecondary'} // Semantic Token
                                    _hover={isClickable ? { color: 'accent', textDecoration: 'underline' } : {}} // Semantic Token
                                    aria-current={isLast ? 'page' : undefined}
                                    cursor={isClickable ? 'pointer' : 'default'}
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

             {/* Aktif Konu Başlığı ve Aksiyonları */}
             {/* Koşullu render içinde hook çağrısı olmaması için değerler dışarıda alındı */}
             {activeTopic && (
                 <Box
                    mb={10}
                    p={6}
                    borderRadius="xl"
                    bg={activeTopicBg} // Hook dışından alınan değer
                    borderWidth="1px"
                    borderColor={activeTopicBorder} // Hook dışından alınan değer
                    boxShadow="md" // Temadan shadows.md
                 >
                      <Flex wrap="wrap" justify="space-between" align="center" gap={4}>
                          <HStack spacing={4} flex="1" minW={0}>
                               {/* Bu ikon/metin renkleri _dark prop'u veya semantic token ile yönetilebilir */}
                               {/* Şimdilik specific renkler kalabilir */}
                               <Icon as={FaFolderOpen} boxSize="24px" color="brand.500" _dark={{color:"brand.200"}}/>
                               <Box>
                                   <Heading as="h2" size="lg" color="brand.700" _dark={{color:"brand.100"}} noOfLines={2}>
                                       {activeTopic.name}
                                   </Heading>
                                   {activeTopic.description && <Text color="brand.600" _dark={{color:"brand.200"}} fontSize="sm" noOfLines={2}>{activeTopic.description}</Text>}
                               </Box>
                          </HStack>
                           <HStack spacing={3} flexShrink={0} mt={{base: 4, md: 0}}>
                               {/* Butonlar tema stillerini kullanır, explicit _hover kaldırıldı */}
                               <Button
                                   onClick={() => handleContentNavigation('lecture', activeTopic.id)}
                                   variant="outline"
                                   colorScheme="brand"
                                   leftIcon={<Icon as={FaBookOpen} />}
                                   title={`${activeTopic.name} Konu Anlatımı`}
                               >
                                   Konu Anlatımı
                               </Button>
                               <Button
                                    onClick={() => handleContentNavigation('quiz', activeTopic.id)}
                                    colorScheme="brand" // Varsayılan variant="solid" kullanılır
                                    leftIcon={<Icon as={FaPencilAlt} />}
                                    title={`${activeTopic.name} Soru Çöz`}
                               >
                                   Soruları Çöz
                               </Button>
                           </HStack>
                      </Flex>
                 </Box>
             )}

            {/* Alt Konular veya Boş Durum Mesajı */}
            {/* currentTopics her zaman dizi */}
            {currentTopics.length > 0 ? (
                <>
                     {activeTopic && (
                         <Heading as="h3" size="md" mb={5} color="textSecondary" fontWeight="semibold">
                            Alt Konular
                         </Heading>
                     )}
                     <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={5}>
                         {currentTopics.map(topic => (
                             <TopicCard
                                 key={topic.id}
                                 topic={topic}
                                 onSelectTopic={handleTopicSelect}
                             />
                         ))}
                     </SimpleGrid>
                 </>
            ) : (
                 !loading && ( // Yükleme bitince göster
                    currentPathIds.length > 0 ? (
                         // Alt konu yok durumu
                        <Center py={10}>
                            <Text color="textMuted" fontStyle="italic">
                                Bu konuda başka alt başlık bulunmuyor.
                            </Text>
                        </Center>
                    ) : (
                         // Hiç konu yok durumu
                         // Card ve içindekiler tema stillerini ve semantic token'ları kullanır
                        <Card variant="outline" textAlign="center" py={10} mt={8} bg="bgSecondary">
                             <CardBody>
                                <Icon as={FaFolder} boxSize="40px" color="textMuted" mb={4} />
                                <Heading as="h3" size="md" mb={3}>Henüz Konu Eklenmemiş</Heading>
                                <Text color="textMuted">İçeriklere göz atmak için lütfen Yönetim Panelinden konuları ekleyin.</Text>
                                {/* <Button as={RouterLink} to="/admin" variant="outline" mt={6}>Yönetim Paneline Git</Button> */}
                            </CardBody>
                       </Card>
                   )
                 )
            )}
        </Container>
    );
}

export default TopicBrowserPage;