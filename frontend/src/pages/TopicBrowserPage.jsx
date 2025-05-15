import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopicCard from '../components/TopicCard';
import ExamCard from '../components/ExamCard';
import {
  Box, Container, Flex, Button, IconButton, Link as ChakraLink,
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, SimpleGrid, Heading,
  Text, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription,
  Icon, HStack, Center, useColorModeValue, VStack,
  Tag, Divider, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton, useDisclosure,
  Progress, ScaleFade, useInterval // Progress, ScaleFade, useInterval eklendi
} from '@chakra-ui/react';
import { 
  FaArrowLeft, FaBookOpen, FaPencilAlt, FaExclamationTriangle, 
  FaInfoCircle, FaFolder, FaUniversity, FaAngleRight, FaTags, FaFolderOpen,
  FaListUl, FaPlayCircle, FaStopwatch, FaSitemap, FaNetworkWired // FaSitemap, FaNetworkWired eklendi
} from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const LOADING_MESSAGE_INTERVAL_PAGE = 1700; // Sayfa yükleme mesajı için interval
const FETCH_DATA_MESSAGE_DELAY = 500; // fetchInitialData içindeki mesajlar için

const EXAM_CONFIG_ORDER = [
  { nameKey: "YDUS", tierName: 'DIAMOND', displayName: "YDUS" },
  { nameKey: "TUS", tierName: 'GOLD', displayName: "TUS" },
  { nameKey: "DUS", tierName: 'SILVER', displayName: "DUS" },
  { nameKey: "TIP FAKÜLTESİ DERSLERİ", tierName: 'BRONZE_TIP', displayName: "Tıp Fakültesi Dersleri" },
  { nameKey: "DİŞ HEKİMLİĞİ DERSLERİ", tierName: 'BRONZE_DIS', displayName: "Diş Hekimliği Dersleri" },
  { nameKey: "İSG İŞYERİ HEKİMLİĞİ DERSLERİ", tierName: 'BRONZE_ISG', displayName: "İSG & İş Yeri Hekimliği" }
];

const findTopicByIdRecursive = (nodes, targetId) => {
    if (!Array.isArray(nodes)) return null;
    const numTargetId = parseInt(targetId);
    for (const node of nodes) {
        if (node.id === numTargetId) return node;
        if (node.children && Array.isArray(node.children)) {
            const found = findTopicByIdRecursive(node.children, numTargetId);
            if (found) return found;
        }
    }
    return null;
};

function TopicBrowserPage() {
  const [currentSelectionStep, setCurrentSelectionStep] = useState('exam'); // 'exam', 'branch', 'topic'
  const [orderedExamsForUI, setOrderedExamsForUI] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [allBranches, setAllBranches] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [topics, setTopics] = useState([]);
  const [topicCountsForBranches, setTopicCountsForBranches] = useState({});
  const [currentPathIds, setCurrentPathIds] = useState([]);
  
  const [pageLoading, setPageLoading] = useState(true); // Ana sayfa yükleme durumu
  const [dataFetchLoading, setDataFetchLoading] = useState(false); // Sadece API istekleri için yükleme
  
  const pageLoadingMessages = useMemo(() => [
    "Konu evreni taranıyor...",
    "Öğrenme yolları haritalanıyor...",
    "İçerik ağacı oluşturuluyor...",
    "Konu Tarayıcı hazırlanıyor!"
  ], []);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(pageLoadingMessages[0]);
  const [error, setError] = useState('');

  const { user, token } = useAuth();
  const navigate = useNavigate();

  const { 
    isOpen: isModeSelectionModalOpen, 
    onOpen: onModeSelectionModalOpen, 
    onClose: onModeSelectionModalClose 
  } = useDisclosure();
  const [quizScopeForModal, setQuizScopeForModal] = useState({ examId: null, branchId: null, topicId: null, examName: '', branchName: '' });

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.700', 'gray.100');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const textMutedColor = useColorModeValue("gray.500", "gray.400");
  const stepIndicatorColor = useColorModeValue('brand.500', 'brand.300');
  const branchButtonColorScheme = useColorModeValue('gray', 'gray');
  
  useInterval(() => {
    if (pageLoading) {
        setCurrentLoadingMessage(prev => {
            const currentIndex = pageLoadingMessages.indexOf(prev);
            return pageLoadingMessages[(currentIndex + 1) % pageLoadingMessages.length];
        });
    }
  }, pageLoading ? LOADING_MESSAGE_INTERVAL_PAGE : null);

  const handleGoToStep = useCallback((step, resetExam = false, resetBranch = false) => {
    setCurrentSelectionStep(step); setError('');
    if (resetExam) {
      setSelectedExam(null); setSelectedBranch(null); setFilteredBranches([]); setTopics([]); setCurrentPathIds([]);
      setTopicCountsForBranches({});
    } else if (resetBranch) {
      setSelectedBranch(null); setTopics([]); setCurrentPathIds([]);
    }
  }, []);

  const handleExamSelect = useCallback((examToSelect) => {
    setSelectedExam(examToSelect); setCurrentSelectionStep('branch');
    setSelectedBranch(null); setTopics([]); setCurrentPathIds([]); setError('');
    setTopicCountsForBranches({});
  }, []);

  const handleBranchSelect = useCallback((branch) => {
    setSelectedBranch(branch); setCurrentSelectionStep('topic');
    setTopics([]); setCurrentPathIds([]); setError('');
  }, []);

  const handleTopicCardSelect = useCallback((selectedTopicFromCard) => {
    setError('');
    const findPath = (nodes, targetId, currentPath = []) => {
      if (!Array.isArray(nodes)) return null;
      for (const node of nodes) {
        const newPath = [...currentPath, node.id];
        if (node.id === targetId) return newPath;
        if (node.children && Array.isArray(node.children)) {
          const result = findPath(node.children, targetId, newPath);
          if (result) return result;
        }
      }
      return null;
    };
    const newPathArray = findPath(topics, selectedTopicFromCard.id);
    setCurrentPathIds(newPathArray || [selectedTopicFromCard.id]);
  }, [topics]);

  useEffect(() => { 
    const fetchInitialData = async () => {
      setPageLoading(true); // Genel sayfa yüklemesini başlat
      setCurrentLoadingMessage(pageLoadingMessages[0]);
      setDataFetchLoading(true); // API isteği için ayrı yükleme
      setError('');
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await new Promise(resolve => setTimeout(resolve, FETCH_DATA_MESSAGE_DELAY));
        setCurrentLoadingMessage(pageLoadingMessages[1]);

        const [ecRes, branchRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/exam-classifications`, config),
          axios.get(`${API_BASE_URL}/api/branches`, config)
        ]);
        
        await new Promise(resolve => setTimeout(resolve, FETCH_DATA_MESSAGE_DELAY));
        setCurrentLoadingMessage(pageLoadingMessages[2]);

        const fetchedECs = Array.isArray(ecRes.data) ? ecRes.data : [];
        let finalExamsForDisplayProcessing = EXAM_CONFIG_ORDER.map(configExam => {
          const foundApiEcItem = fetchedECs.find(apiEcItm => apiEcItm.name.toUpperCase() === configExam.nameKey.toUpperCase());
          return foundApiEcItem ? { ...foundApiEcItem, displayName: configExam.displayName, tierName: configExam.tierName } : null;
        }).filter(Boolean);
        fetchedECs.forEach(apiEcItem => {
          if (!finalExamsForDisplayProcessing.find(oEc => oEc.id === apiEcItem.id)) {
            finalExamsForDisplayProcessing.push({ ...apiEcItem, displayName: apiEcItem.name, tierName: 'DEFAULT' });
          }
        });
        setOrderedExamsForUI(finalExamsForDisplayProcessing);
        setAllBranches(Array.isArray(branchRes.data) ? branchRes.data : []);
        setCurrentSelectionStep('exam'); 
      } catch (err) {
        console.error("Başlangıç verileri çekilirken hata:", err);
        setError(err.response?.data?.message || 'Veriler yüklenirken bir hata oluştu.');
        setOrderedExamsForUI([]);
      } finally {
        setDataFetchLoading(false);
        await new Promise(resolve => setTimeout(resolve, FETCH_DATA_MESSAGE_DELAY));
        setCurrentLoadingMessage(pageLoadingMessages[pageLoadingMessages.length-1]);
        setTimeout(() => setPageLoading(false), 700); // Son mesajın görünmesi için
      }
    };
    if (token) { fetchInitialData(); } 
    else { setError("İçeriklere erişmek için lütfen giriş yapın."); setPageLoading(false); }
  }, [token, user, pageLoadingMessages]); // pageLoadingMessages eklendi

  useEffect(() => { 
      if (currentSelectionStep === 'branch' && selectedExam && token && allBranches.length > 0) {
      const fetchBranchesAndTopicCounts = async () => {
        setDataFetchLoading(true); 
        setLoadingMessage(`${selectedExam.displayName} için branşlar ve konu sayıları yükleniyor...`);
        setError(''); setFilteredBranches([]); setTopicCountsForBranches({});
        try {
          const topicsForExamRes = await axios.get(`${API_BASE_URL}/api/topics?examClassificationId=${selectedExam.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const topicsData = Array.isArray(topicsForExamRes.data) ? topicsForExamRes.data : [];
          const relevantBranchIds = new Set();
          const counts = {};
          const processTopicsForCounts = (nodes) => {
            if (!Array.isArray(nodes)) return;
            nodes.forEach(topic => {
              if (topic.branchId) {
                relevantBranchIds.add(topic.branchId);
                if (!topic.parentId) { counts[topic.branchId] = (counts[topic.branchId] || 0) + 1; }
              }
            });
          };
          processTopicsForCounts(topicsData);
          const branchesForSelectedExam = allBranches.filter(branch => relevantBranchIds.has(branch.id));
          setFilteredBranches(branchesForSelectedExam);
          setTopicCountsForBranches(counts);
        } catch (err) {
          console.error("Branşlar veya konu sayıları çekilirken hata:", err);
          setError(err.response?.data?.message || `Veriler yüklenirken bir hata oluştu.`);
        } finally { setDataFetchLoading(false); }
      };
      fetchBranchesAndTopicCounts();
    }
  }, [currentSelectionStep, selectedExam, token, allBranches]);

  useEffect(() => { 
    if (currentSelectionStep === 'topic' && selectedExam && selectedBranch && token) {
      const fetchTopicsForBranch = async () => {
        setDataFetchLoading(true); 
        setLoadingMessage(`${selectedExam.displayName} > ${selectedBranch.name} için konular yükleniyor...`);
        setError(''); setTopics([]); setCurrentPathIds([]);
        try {
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const response = await axios.get(
            `${API_BASE_URL}/api/topics?examClassificationId=${selectedExam.id}&branchId=${selectedBranch.id}`,
            config
          );
          setTopics(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
          console.error("Konular çekilirken hata:", err);
          setError(err.response?.data?.message || 'Konular yüklenirken bir hata oluştu.');
        } finally { setDataFetchLoading(false); }
      };
      fetchTopicsForBranch();
    }
  }, [currentSelectionStep, selectedExam, selectedBranch, token]);

  const { activeTopicBrowse, currentDisplayTopics, breadcrumbItemsBrowsePath } = useMemo(() => { 
    if (currentSelectionStep !== 'topic' || !Array.isArray(topics) || topics.length === 0) {
        return { activeTopicBrowse: null, currentDisplayTopics: [], breadcrumbItemsBrowsePath: [] };
    }
    let currentLevelData = topics; 
    let activeTopicNode = null;
    const pathForBreadcrumb = [];
    if (currentPathIds.length > 0) {
        let parentNodesForCurrentLevel = topics; 
        for (const pathId of currentPathIds) {
            const foundNode = findTopicByIdRecursive(parentNodesForCurrentLevel, pathId);
            if (foundNode) {
                pathForBreadcrumb.push({ id: foundNode.id, name: foundNode.name });
                activeTopicNode = foundNode;
                parentNodesForCurrentLevel = foundNode.children && Array.isArray(foundNode.children) ? foundNode.children : [];
            } else {
                console.warn(`Breadcrumb path ID ${pathId} not found in topic tree.`);
                currentLevelData = []; break;
            }
        }
        currentLevelData = activeTopicNode?.children && Array.isArray(activeTopicNode.children) ? activeTopicNode.children : [];
    } else {
        currentLevelData = topics; activeTopicNode = null;
    }
    return { 
        activeTopicBrowse: activeTopicNode, 
        currentDisplayTopics: currentLevelData, 
        breadcrumbItemsBrowsePath: pathForBreadcrumb 
    };
  }, [topics, currentPathIds, currentSelectionStep]);

  const pageBreadcrumbs = useMemo(() => { 
    const items = [];
    if (selectedExam) {
      items.push({ 
        name: selectedExam.displayName, 
        onClick: () => handleGoToStep('exam', true),
        isCurrent: currentSelectionStep === 'exam'
      });
    }
    if (selectedBranch && currentSelectionStep !== 'exam') {
      items.push({ 
        name: selectedBranch.name, 
        onClick: () => handleGoToStep('branch', false, true),
        isCurrent: currentSelectionStep === 'branch' && breadcrumbItemsBrowsePath.length === 0
      });
    }
    if (currentSelectionStep === 'topic' && breadcrumbItemsBrowsePath.length > 0) {
        breadcrumbItemsBrowsePath.forEach((topicCrumb, index) => {
            const isLastTopicCrumb = index === breadcrumbItemsBrowsePath.length -1;
            items.push({
                name: topicCrumb.name,
                onClick: !isLastTopicCrumb ? () => setCurrentPathIds(currentPathIds.slice(0, index + 1)) : undefined,
                isCurrent: isLastTopicCrumb
            });
        });
    } else if (currentSelectionStep === 'topic' && selectedBranch && breadcrumbItemsBrowsePath.length === 0 && topics.length > 0) {
        items.push({name: "Konu Başlıkları", isCurrent: true});
    }
    return items;
  }, [selectedExam, selectedBranch, currentSelectionStep, breadcrumbItemsBrowsePath, currentPathIds, topics.length, handleGoToStep]);

  const openModeSelector = (scope) => {
    setQuizScopeForModal(scope);
    onModeSelectionModalOpen();
  };

  const navigateToSolvePage = (mode) => {
    const { examId, branchId, topicId, examName, branchName } = quizScopeForModal;
    const params = new URLSearchParams();
    if (examId) params.append('examClassificationId', examId);
    if (examName && mode === 'deneme' && examId) params.append('examName', examName);
    if (branchId) params.append('branchId', branchId);
    if (branchName && mode === 'deneme' && branchId) params.append('branchName', branchName);
    if (topicId) params.append('topicId', topicId);
    if (mode === 'deneme') params.append('mode', 'deneme');
    navigate(`/solve?${params.toString()}`);
    onModeSelectionModalClose();
  };

  if (pageLoading) { // Ana sayfa ilk yükleme animasyonu
    return (
      <Container maxW="container.lg" py={8} centerContent minH="80vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
        <Icon as={FaSitemap} boxSize="52px" color="brand.500" mb={6} sx={{ animation: "pulse 1.8s ease-in-out infinite" }}/>
        <Heading size="md" color={headingColor} mb={2} textAlign="center">Konu Tarayıcı Hazırlanıyor</Heading>
        <ScaleFade initialScale={0.9} in={true} key={currentLoadingMessage}>
            <Text mt={2} color={textMutedColor} fontSize="sm" textAlign="center" maxW="sm">
                {currentLoadingMessage}
            </Text>
        </ScaleFade>
        <Progress size="xs" isIndeterminate colorScheme="brand" w="220px" mt={6} borderRadius="md"/>
        <style>
          {`
            @keyframes pulse {
              0% { transform: scale(1); opacity: 0.7; }
              50% { transform: scale(1.12); opacity: 1; }
              100% { transform: scale(1); opacity: 0.7; }
            }
          `}
        </style>
      </Container>
    );
  }

  if (error && orderedExamsForUI.length === 0) { // Kritik bir hata varsa ve hiç sınav yüklenemediyse
    return (
      <Container maxW="container.lg" mt={{base: 6, md: 10}}>
        <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={10} borderRadius="xl" bg={useColorModeValue("red.50", "red.900")} borderColor={useColorModeValue("red.200", "red.700")} borderWidth="1px">
          <AlertIcon boxSize="48px" color="red.400" />
          <AlertTitle mt={4} mb={2} fontSize="xl" fontWeight="bold" color={useColorModeValue("red.700", "red.100")}>Bir Hata Oluştu!</AlertTitle>
          <AlertDescription maxWidth="md" mb={6} color={useColorModeValue("red.600", "red.200")}>{error}</AlertDescription>
          <Button colorScheme="red" onClick={() => { 
            if (token) { fetchInitialData(); } // fetchInitialData token'a bağlı, tekrar denemek için
            else { navigate('/login'); }
          }} leftIcon={<Icon as={FaRedo} />}>
            {token ? 'Tekrar Dene' : 'Giriş Yap'}
          </Button>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.xl" py={{base:4, md:8}} bg={bgColor} minH="calc(100vh - 150px)">
      <Flex direction={{base:"column", md:"row"}} wrap="wrap" align="flex-start" justify="space-between" gap={4} mb={{base:4, md:6}} px={{base:2, md:0}}>
        {pageBreadcrumbs.length > 0 && (
          <Breadcrumb spacing="8px" separator={<Icon as={FaAngleRight} color="gray.400" />} fontSize="sm" flexGrow={1} mr={{base:0, md:4}} display="flex" alignItems="center">
            {pageBreadcrumbs.map((crumb, index) => (
              <BreadcrumbItem key={index} isCurrentPage={crumb.isCurrent}>
                <BreadcrumbLink 
                  onClick={crumb.isCurrent ? undefined : crumb.onClick} 
                  color={crumb.isCurrent ? headingColor : textMutedColor}
                  fontWeight={crumb.isCurrent ? "semibold" : "normal"}
                  _hover={!crumb.isCurrent ? { color: stepIndicatorColor, textDecoration: 'underline' } : {}}
                  cursor={!crumb.isCurrent ? 'pointer' : 'default'}
                  display="flex" alignItems="center"
                >
                  {index === 0 && currentSelectionStep !== 'exam' && <Icon as={FaSitemap} mr={1.5} />}
                  {index === 1 && currentSelectionStep === 'topic' && <Icon as={FaListUl} mr={1.5} />}
                  {index > 1 && <Icon as={FaFolderOpen} mr={1.5} />}
                  {crumb.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        )}
        <HStack spacing={3} mt={{base:3, md:0}} w={{base:"full", md:"auto"}} justifyContent={{base:"space-between", md:"flex-end"}} flexWrap="wrap">
            {currentSelectionStep === 'branch' && selectedExam && (
                <>
                    <Button 
                        onClick={() => openModeSelector({ examId: selectedExam.id, examName: selectedExam.displayName })} 
                        colorScheme="green" 
                        size="sm" 
                        leftIcon={<Icon as={FaPlayCircle} />}
                        boxShadow="sm" _hover={{boxShadow:"md"}}
                    >
                        "{selectedExam.displayName}" Soruları
                    </Button>
                    <Button onClick={() => handleGoToStep('exam', true)} variant="outline" size="sm" leftIcon={<Icon as={FaArrowLeft} />}>Sınav Seçimi</Button>
                </>
            )}
            {currentSelectionStep === 'topic' && selectedExam && selectedBranch && breadcrumbItemsBrowsePath.length === 0 && (
                 <>
                    <Button 
                        onClick={() => openModeSelector({ examId: selectedExam.id, branchId: selectedBranch.id, examName: selectedExam.displayName, branchName: selectedBranch.name })} 
                        colorScheme="green" 
                        size="sm" 
                        leftIcon={<Icon as={FaPlayCircle} />}
                        boxShadow="sm" _hover={{boxShadow:"md"}}
                    >
                        "{selectedBranch.name}" Soruları
                    </Button>
                    <Button onClick={() => handleGoToStep('branch', false, true)} variant="outline" size="sm" leftIcon={<Icon as={FaArrowLeft} />}>Branş Seçimi</Button>
                 </>
            )}
             {currentSelectionStep === 'topic' && activeTopicBrowse && ( // Eğer bir alt konu seçiliyse, o alt konunun üst konusuna dön
                 <Button onClick={() => { 
                     const parentPathIds = currentPathIds.slice(0, -1);
                     setCurrentPathIds(parentPathIds);
                 }} variant="outline" size="sm" leftIcon={<Icon as={FaArrowLeft} />}>
                    "{breadcrumbItemsBrowsePath[breadcrumbItemsBrowsePath.length - 2]?.name || selectedBranch?.name || 'Üst Konu'}" Listesine Dön
                </Button>
            )}
        </HStack>
      </Flex>
      {currentSelectionStep !== 'exam' && <Divider mb={{base:4, md:8}} borderColor={borderColor}/>}

      {/* Hata mesajı (veri yükleme sonrası oluşanlar için) */}
      {error && !pageLoading && ( 
            <Alert status="warning" variant="subtle" borderRadius="md" mb={6}>
                <AlertIcon /> {error}
            </Alert>
        )}
      
      {/* --- SINAV SEÇİM EKRANI --- */}
      {currentSelectionStep === 'exam' && (
        <Box>
          <Heading as="h1" size={{base:"lg", md:"xl"}} textAlign="center" mb={3} color={headingColor}>Konu Evrenini Keşfet</Heading>
          <Text textAlign="center" color={textColor} fontSize={{base:"sm", md:"md"}} mb={{base:6, md:10}}>Lütfen çalışmak istediğiniz sınav türünü seçerek başlayın.</Text>
          {orderedExamsForUI.length === 0 && !pageLoading ? ( // loading yerine pageLoading kontrolü daha doğru olabilir, veya ikisi de
            <Alert status="info" variant="subtle" borderRadius="md" bg={useColorModeValue("blue.50", "blue.800")}>
              <AlertIcon color="blue.400" /> 
              Kullanılabilir sınav türü bulunamadı.
            </Alert>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={{base:5, md:6}}>
              {orderedExamsForUI.map((exam, index) => {
                const isTarget = user && user.defaultClassificationId === exam.id && user.role !== 'admin';
                return (
                  <ExamCard 
                    key={exam.id} 
                    exam={{ id: exam.id, displayName: exam.displayName, name: exam.name }}
                    tierName={exam.tierName}
                    isTargetExam={isTarget}
                    onClick={handleExamSelect}
                    // index prop'u ScaleFade için TopicCard'da kullanılıyor, ExamCard'a da eklenebilir.
                  />
                );
              })}
            </SimpleGrid>
          )}
        </Box>
      )}

      {/* --- BRANŞ SEÇİM EKRANI --- */}
      {currentSelectionStep === 'branch' && selectedExam && (
        <Box>
           <Heading as="h2" size={{base:"md", md:"lg"}} color={headingColor} mb={{base:4, md:6}}>
             Branşınızı Seçin
          </Heading>
          {loading && filteredBranches.length === 0 && <Center py={10}><Spinner color="brand.500" size="lg"/><Text ml={3} color={textMutedColor}>{loadingMessage}</Text></Center>}
          {filteredBranches.length === 0 && !loading && !error && (
             <Alert status="info" variant="subtle" borderRadius="lg" bg={useColorModeValue("orange.50", "orange.800")} p={5}>
                <AlertIcon color="orange.400" /> 
                <Text color={textColor}>"{selectedExam.displayName}" sınav türü için tanımlanmış uygun branş bulunamadı veya bu branşlarda henüz konu yok.</Text>
             </Alert>
          )}
          {filteredBranches.length > 0 && (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={{base:4, md:5}}>
              {filteredBranches.map((branch, index) => (
                // TODO: BranchCard component'i oluşturulabilir veya Button stilize edilebilir
                <ScaleFade initialScale={0.95} in={true} key={branch.id} transition={{ enter: { duration: 0.3, delay: index * 0.07 } }}>
                    <Button 
                    onClick={() => handleBranchSelect(branch)}
                    colorScheme={branchButtonColorScheme} variant="outline" bg={cardBg} borderColor={borderColor}
                    p={6} h="auto" minH={{base:"100px", md:"130px"}} borderRadius="xl" boxShadow="lg"
                    _hover={{ boxShadow: 'xl', borderColor: stepIndicatorColor, bg: useColorModeValue('gray.100', 'gray.700'), transform: "translateY(-3px)"}}
                    _focusVisible={{ ring: '3px', ringColor: stepIndicatorColor}}
                    textAlign="left" w="full" display="flex" flexDirection="column" alignItems="flex-start" justifyContent="space-between" 
                    >
                    <VStack align="flex-start" spacing={1} flex="1">
                        <Icon as={FaListUl} color={stepIndicatorColor} boxSize={6} mb={2}/>
                        <Heading fontWeight="semibold" color={headingColor} fontSize="md" noOfLines={2}>{branch.name}</Heading>
                    </VStack>
                    <Text fontSize="xs" color={textMutedColor} mt={2} alignSelf="flex-end">
                        {topicCountsForBranches[branch.id] || 0} Ana Konu
                    </Text>
                    </Button>
                </ScaleFade>
              ))}
            </SimpleGrid>
          )}
        </Box>
      )}

      {/* --- KONU TARAMA EKRANI --- */}
      {currentSelectionStep === 'topic' && selectedExam && selectedBranch && (
        <Box>
          {loading && topics.length === 0 && <Center py={10}><Spinner color="brand.500" size="lg"/><Text ml={3} color={textMutedColor}>{loadingMessage}</Text></Center>}
          {error && !loading && topics.length === 0 && <Alert status="error" variant="subtle" mb={4} borderRadius="md"><AlertIcon />{error}</Alert>}
          
          {activeTopicBrowse && ( 
            <Box mb={{base:6, md:10}} p={{base:4, md:6}} borderRadius="xl" bg={useColorModeValue('brand.50', 'brand.800')} borderWidth="1px" borderColor={useColorModeValue('brand.200', 'brand.700')} boxShadow="lg">
              <Flex wrap="wrap" justify="space-between" align="center" gap={4}>
                <HStack spacing={{base:2, md:4}} flex="1" minW={0}>
                  <Icon as={FaFolderOpen} boxSize={{base:"24px", md:"30px"}} color={useColorModeValue('brand.600', 'brand.200')} />
                  <Box>
                    <Heading as="h2" size={{base:"md", md:"lg"}} color={useColorModeValue('brand.700', 'brand.100')} noOfLines={2}>{activeTopicBrowse.name}</Heading>
                    {activeTopicBrowse.description && <Text display={{base:"none", md:"block"}} color={useColorModeValue('brand.600', 'brand.200')} fontSize="sm" noOfLines={2} mt={1}>{activeTopicBrowse.description}</Text>}
                  </Box>
                </HStack>
                <HStack spacing={3} flexShrink={0} mt={{ base: 3, md: 0 }} w={{base:"full", md:"auto"}} justifyContent={{base:"center", md:"flex-end"}}>
                  <Button as={ChakraLink} onClick={(e) => {e.preventDefault(); navigate(`/lectures/topic/${activeTopicBrowse.id}`);}} variant="outline" colorScheme="brand" leftIcon={<Icon as={FaBookOpen} />} size={{base:"sm", md:"md"}} flexGrow={{base:1, md:0}}>Konu Anlatımı</Button>
                  <Button 
                    onClick={() => openModeSelector({ examId: selectedExam.id, branchId: selectedBranch.id, topicId: activeTopicBrowse.id, examName: selectedExam.displayName, branchName: selectedBranch.name })} 
                    colorScheme="brand" 
                    leftIcon={<Icon as={FaPencilAlt} />} 
                    size={{base:"sm", md:"md"}} 
                    flexGrow={{base:1, md:0}}
                  >
                    Soruları Çöz
                  </Button>
                </HStack>
              </Flex>
            </Box>
          )}

          {(currentDisplayTopics && currentDisplayTopics.length > 0) ? ( 
            <>
              <Heading as="h3" size={{base:"sm", md:"md"}} mb={5} color={textColor} fontWeight="semibold">
                {activeTopicBrowse ? 'Alt Başlıklar' : `${selectedBranch.name} Konu Başlıkları`}
              </Heading>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={{base:4, md:5}}>
                {currentDisplayTopics.map((topic, index) => ( <TopicCard key={topic.id} topic={topic} index={index} onSelectTopic={handleTopicCardSelect} /> ))}
              </SimpleGrid>
            </>
          ) : (!loading && !error && ( 
            <Center py={10} flexDirection="column">
              <Icon as={FaInfoCircle} boxSize="40px" color={textMutedColor} mb={4}/>
              <Text color={textMutedColor} fontStyle="italic" textAlign="center" maxW="md">
                {currentPathIds.length > 0 ? 'Bu başlık altında gösterilecek başka alt konu bulunmuyor.' : `"${selectedBranch.name}" branşında henüz konu eklenmemiş veya bu filtreye uygun konu bulunamadı.`}
              </Text>
            </Center>
          ))}
        </Box>
      )}

      <Modal isOpen={isModeSelectionModalOpen} onClose={onModeSelectionModalClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
        <ModalContent bg={cardBg} borderRadius="xl" boxShadow="2xl">
          <ModalHeader color={headingColor} fontWeight="bold" borderBottomWidth="1px" borderColor={borderColor}>
            Çözme Modunu Seçin
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <Text mb={4} color={textColor} textAlign="center">
                "{quizScopeForModal.topicId ? topics.find(t=>t.id === quizScopeForModal.topicId)?.name || 'Seçili Konu' : quizScopeForModal.branchName || quizScopeForModal.examName || 'Seçili Kapsam'}" için:
            </Text>
            <VStack spacing={4}>
              <Button
                colorScheme="purple" 
                onClick={() => navigateToSolvePage('deneme')}
                w="full" size="lg" py={7}
                leftIcon={<Icon as={FaStopwatch} />}
                boxShadow="md" _hover={{boxShadow: "lg", transform:"translateY(-2px)"}} transition="all 0.2s"
              >
                Deneme Modu <Text as="span" fontSize="xs" color={useColorModeValue("purple.600", "purple.200")} ml={1} fontWeight="normal">(Süreli, Açıklamasız)</Text>
              </Button>
              <Button
                colorScheme="teal" 
                onClick={() => navigateToSolvePage('practice')}
                w="full" size="lg" py={7}
                leftIcon={<Icon as={FaPencilAlt} />}
                boxShadow="md" _hover={{boxShadow: "lg", transform:"translateY(-2px)"}} transition="all 0.2s"
              >
                Pratik Modu <Text as="span" fontSize="xs" color={useColorModeValue("teal.600", "teal.200")} ml={1} fontWeight="normal">(Süresiz, Açıklamalı)</Text>
              </Button>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor={borderColor} pt={3} pb={4}>
            <Button variant="ghost" onClick={onModeSelectionModalClose}>Kapat</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Container>
  );
}

export default TopicBrowserPage;
