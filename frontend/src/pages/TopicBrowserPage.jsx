import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopicCard from '../components/TopicCard';
import ExamCard from '../components/ExamCard';
import {
  Box, Container, Flex, Button, IconButton, Link as ChakraLink,
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, SimpleGrid, Heading,
  Text, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription,
  Icon, HStack, Center, useColorModeValue, VStack,
  Divider, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton, useDisclosure,
  Progress, ScaleFade, useInterval
} from '@chakra-ui/react';
import {
  FaArrowLeft, FaBookOpen, FaPencilAlt, FaExclamationTriangle,
  FaInfoCircle, FaFolder, FaUniversity, FaAngleRight, FaTags, FaFolderOpen,
  FaListUl, FaPlayCircle, FaStopwatch, FaSitemap, FaNetworkWired, FaChevronRight, FaHome
} from 'react-icons/fa';
import { FiGrid, FiFilter, FiLayers, FiCpu } from 'react-icons/fi'; // Daha modern ikonlar

const API_BASE_URL = import.meta.env.VITE_API_URL;
const LOADING_MESSAGE_INTERVAL_PAGE = 1800; // Biraz daha yavaş
const FETCH_DATA_MESSAGE_DELAY = 600;

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
  const [currentSelectionStep, setCurrentSelectionStep] = useState('exam');
  const [orderedExamsForUI, setOrderedExamsForUI] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [topics, setTopics] = useState([]);
  const [topicCountsForBranches, setTopicCountsForBranches] = useState({});
  const [currentPathIds, setCurrentPathIds] = useState([]);

  const [pageLoading, setPageLoading] = useState(true);
  const [dataFetchLoading, setDataFetchLoading] = useState(false);
  const loadingMessage = "Yükleniyor…"; // ya da istediğiniz başka bir mesaj
  
  const pageLoadingMessages = useMemo(() => [
    "Bilgi evreni taranıyor...",
    "Öğrenme rotaları oluşturuluyor...",
    "İçerik matrisi çözümleniyor...",
    "Keşif arayüzü hazırlanıyor!"
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

  // Layout ile tutarlı stil değişkenleri
  const mainBg = useColorModeValue('gray.100', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const textMutedColor = useColorModeValue('gray.500', 'gray.400');
  const accentColor = useColorModeValue('brand.500', 'brand.300');
  const stepIndicatorColor = accentColor; // Breadcrumb aktif öğe için
  const branchButtonBg = useColorModeValue('white', 'gray.750');
  const branchButtonHoverBg = useColorModeValue('gray.100', 'gray.600');
  const modalContentBg = useColorModeValue('white', 'gray.800');

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
    // topics state'i, seçili exam ve branch'e göre filtrelenmiş ağaç yapısını tutar
    const currentTopicTreeForPath = topics; // Bu, o anki gösterilen konu ağacıdır
    const newPathArray = findPath(currentTopicTreeForPath, selectedTopicFromCard.id);
    setCurrentPathIds(newPathArray || [selectedTopicFromCard.id]);
  }, [topics]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setPageLoading(true);
      setCurrentLoadingMessage(pageLoadingMessages[0]);
      setDataFetchLoading(true);
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
        setTimeout(() => setPageLoading(false), 700);
      }
    };
    if (token) { fetchInitialData(); }
    else { setError("İçeriklere erişmek için lütfen giriş yapın."); setPageLoading(false); }
  }, [token, user, pageLoadingMessages]); // user bağımlılığı eklendi

  useEffect(() => {
      if (currentSelectionStep === 'branch' && selectedExam && token && allBranches.length > 0) {
      const fetchBranchesAndTopicCounts = async () => {
        setDataFetchLoading(true);
        setCurrentLoadingMessage(`${selectedExam.displayName} için branşlar hazırlanıyor...`);
        setError(''); setFilteredBranches([]); setTopicCountsForBranches({});
        try {
          const topicsForExamRes = await axios.get(`${API_BASE_URL}/api/topics?examClassificationId=${selectedExam.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const topicsData = Array.isArray(topicsForExamRes.data) ? topicsForExamRes.data : [];
          const relevantBranchIds = new Set();
          const counts = {};
          const processTopicsForCounts = (nodes) => { // Bu fonksiyon ağaç yapısını gezer
            if (!Array.isArray(nodes)) return;
            nodes.forEach(topic => {
              if (topic.branchId) {
                relevantBranchIds.add(topic.branchId);
                if (!topic.parentId) { // Sadece ana konuları say (parentId'si null olanlar)
                    counts[topic.branchId] = (counts[topic.branchId] || 0) + 1;
                }
              }
              if (topic.children && topic.children.length > 0) {
                processTopicsForCounts(topic.children); // Alt konuları da işle (relevantBranchIds için)
              }
            });
          };
          processTopicsForCounts(topicsData); // topicsData ağaç yapısında olmalı
          const branchesForSelectedExam = allBranches.filter(branch => relevantBranchIds.has(branch.id));
          setFilteredBranches(branchesForSelectedExam);
          setTopicCountsForBranches(counts);
        } catch (err) {
          console.error("Branşlar veya konu sayıları çekilirken hata:", err);
          setError(err.response?.data?.message || `Veriler yüklenirken bir hata oluştu.`);
        } finally { setDataFetchLoading(false); setCurrentLoadingMessage(pageLoadingMessages[pageLoadingMessages.length-1]); }
      };
      fetchBranchesAndTopicCounts();
    }
  }, [currentSelectionStep, selectedExam, token, allBranches, pageLoadingMessages]);

  useEffect(() => {
    if (currentSelectionStep === 'topic' && selectedExam && selectedBranch && token) {
      const fetchTopicsForBranch = async () => {
        setDataFetchLoading(true);
        setCurrentLoadingMessage(`${selectedExam.displayName} > ${selectedBranch.name} için konular listeleniyor...`);
        setError(''); setTopics([]); setCurrentPathIds([]);
        try {
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const response = await axios.get(
            `${API_BASE_URL}/api/topics?examClassificationId=${selectedExam.id}&branchId=${selectedBranch.id}`,
            config
          );
          // Backend'den gelen topics verisi zaten ağaç yapısında olmalı (Layout.jsx'teki TopicManagement'e benzer)
          setTopics(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
          console.error("Konular çekilirken hata:", err);
          setError(err.response?.data?.message || 'Konular yüklenirken bir hata oluştu.');
        } finally { setDataFetchLoading(false); setCurrentLoadingMessage(pageLoadingMessages[pageLoadingMessages.length-1]); }
      };
      fetchTopicsForBranch();
    }
  }, [currentSelectionStep, selectedExam, selectedBranch, token, pageLoadingMessages]);

  const { activeTopicBrowse, currentDisplayTopics, breadcrumbItemsBrowsePath } = useMemo(() => {
    if (currentSelectionStep !== 'topic' || !Array.isArray(topics) || topics.length === 0) {
        return { activeTopicBrowse: null, currentDisplayTopics: [], breadcrumbItemsBrowsePath: [] };
    }
    let currentLevelData = topics; // Bu, seçili sınav ve branşa göre filtrelenmiş ana konu ağacıdır.
    let activeTopicNode = null;
    const pathForBreadcrumb = [];

    if (currentPathIds.length > 0) {
        let parentNodesForCurrentLevel = topics;
        for (const pathId of currentPathIds) {
            const foundNode = findTopicByIdRecursive(parentNodesForCurrentLevel, pathId);
            if (foundNode) {
                pathForBreadcrumb.push({ id: foundNode.id, name: foundNode.name, description: foundNode.description });
                activeTopicNode = foundNode;
                parentNodesForCurrentLevel = foundNode.children && Array.isArray(foundNode.children) ? foundNode.children : [];
            } else {
                console.warn("Path ID not found in current topic level:", pathId, parentNodesForCurrentLevel);
                currentLevelData = []; // Hatalı path ise bir şey gösterme
                break;
            }
        }
        currentLevelData = activeTopicNode?.children && Array.isArray(activeTopicNode.children) ? activeTopicNode.children : [];
    } else {
        // currentPathIds boş ise, en üst seviye konuları göster (topics state'i zaten bu olmalı)
        currentLevelData = topics.filter(topic => !topic.parentId); // Sadece ana konuları filtrele (eğer backend tümünü düz yolluyorsa)
                                                                  // Backend zaten filtrelenmiş ağaç yolluyorsa bu filter gereksiz
        activeTopicNode = null;
    }
    return {
        activeTopicBrowse: activeTopicNode,
        currentDisplayTopics: currentLevelData,
        breadcrumbItemsBrowsePath: pathForBreadcrumb
    };
  }, [topics, currentPathIds, currentSelectionStep]);

  const pageBreadcrumbs = useMemo(() => {
    const items = [];
    items.push({ name: "Anasayfa", onClick: () => navigate('/'), isCurrent: false, icon: FaHome });

    if (selectedExam) {
      items.push({
        name: selectedExam.displayName,
        onClick: () => handleGoToStep('exam', true),
        isCurrent: currentSelectionStep === 'exam',
        icon: FaUniversity
      });
    }
    if (selectedBranch && currentSelectionStep !== 'exam') {
      items.push({
        name: selectedBranch.name,
        onClick: () => handleGoToStep('branch', false, true),
        isCurrent: currentSelectionStep === 'branch' && breadcrumbItemsBrowsePath.length === 0,
        icon: FaTags
      });
    }

    if (currentSelectionStep === 'topic' && breadcrumbItemsBrowsePath.length > 0) {
        breadcrumbItemsBrowsePath.forEach((topicCrumb, index) => {
            const isLastTopicCrumb = index === breadcrumbItemsBrowsePath.length -1;
            items.push({
                name: topicCrumb.name,
                onClick: !isLastTopicCrumb ? () => setCurrentPathIds(currentPathIds.slice(0, index + 1)) : undefined,
                isCurrent: isLastTopicCrumb,
                icon: isLastTopicCrumb && activeTopicBrowse?.children?.length > 0 ? FaFolderOpen : FaFolder
            });
        });
    } else if (currentSelectionStep === 'topic' && selectedBranch && breadcrumbItemsBrowsePath.length === 0 && topics.length > 0) {
        // Bu durum, branş seçildikten sonraki ilk konu listesi görünümü
        // items.push({name: "Konu Başlıkları", isCurrent: true, icon: FaListUl }); // Zaten branş adı var
    }
    return items;
  }, [selectedExam, selectedBranch, currentSelectionStep, breadcrumbItemsBrowsePath, currentPathIds.length, topics.length, handleGoToStep, navigate]); // currentPathIds.length eklendi


  const openModeSelector = (scope) => {
    setQuizScopeForModal(scope);
    onModeSelectionModalOpen();
  };

  const navigateToSolvePage = (mode) => {
    const { examId, branchId, topicId } = quizScopeForModal; // examName, branchName burada gereksiz
    const params = new URLSearchParams();
    if (examId) params.append('examClassificationId', examId);
    if (branchId) params.append('branchId', branchId);
    if (topicId) params.append('topicId', topicId);
    if (mode === 'deneme') params.append('mode', 'deneme');
    
      // Bu kısmı EKLE:
    else params.append('mode', 'practice'); // eksikse default olarak eklenmeli
    // Seçili sınav, branş ve konu isimlerini de SolvePage'e başlık için yollayalım
    const exam = orderedExamsForUI.find(e => e.id === examId);
    const branch = filteredBranches.find(b => b.id === branchId);
    const topic = topicId ? findTopicByIdRecursive(topics, topicId) : null;

    if(exam) params.append('examName', exam.displayName);
    if(branch) params.append('branchName', branch.name);
    if(topic) params.append('topicName', topic.name);

    navigate(`/solve?${params.toString()}`);
    onModeSelectionModalClose();
  };
    // Yükleme, Hata ve İçerik Gösterim Mantığı
    if (pageLoading) {
      return (
        <Container maxW="container.lg" py={8} centerContent minH="80vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center" bg={mainBg}>
          <Icon as={FiLayers} boxSize="60px" color={accentColor} mb={6} sx={{ animation: "pulse 2s ease-in-out infinite" }}/>
          <Heading size="lg" color={headingColor} mb={3} textAlign="center" fontWeight="semibold">
            Konu Evreni Yükleniyor
          </Heading>
          <ScaleFade initialScale={0.95} in={true} key={currentLoadingMessage}>
              <Text mt={1} color={textMutedColor} fontSize="md" textAlign="center" maxW="md">
                  {currentLoadingMessage}
              </Text>
          </ScaleFade>
          <Progress size="sm" isIndeterminate colorScheme="brand" w="250px" mt={8} borderRadius="full" bg={useColorModeValue("gray.200", "gray.600")}/>
          <style>
            {`
              @keyframes pulse {
                0% { transform: scale(1); opacity: 0.7; }
                50% { transform: scale(1.1); opacity: 1; }
                100% { transform: scale(1); opacity: 0.7; }
              }
            `}
          </style>
        </Container>
      );
    }
  
    if (error && orderedExamsForUI.length === 0) { // Sadece başlangıçta hiç veri çekilemediyse bu hata gösterilsin
      return (
        <Container maxW="container.lg" mt={{base: 6, md: 10}} py={10} bg={mainBg} centerContent>
          <VStack spacing={6} p={{base:6, md:10}} bg={cardBg} borderRadius="xl" boxShadow="2xl" borderWidth="1px" borderColor={borderColor} textAlign="center" w="full" maxW="lg">
            <Icon as={FaExclamationTriangle} boxSize={{ base: "48px", md: "60px" }} color={useColorModeValue("red.500", "red.300")} />
            <Heading as="h2" size={{base:"lg", md:"xl"}} color={headingColor} fontWeight="bold">Bir Hata Oluştu!</Heading>
            <Text fontSize={{base:"md", md:"lg"}} color={textColor} lineHeight="tall">{error}</Text>
            <Button colorScheme="red" variant="outline" onClick={() => { if (token) { fetchInitialData(); } else { navigate('/login'); }}} leftIcon={<Icon as={FaSync} />}>
              {token ? 'Tekrar Dene' : 'Giriş Yap'}
            </Button>
          </VStack>
        </Container>
      );
    }
    
    return (
      <Container maxW="container.xl" py={{base:4, md:8}} bg={mainBg} minH="calc(100vh - 100px)"> {/* Header yüksekliğini hesaba kat */}
        <Flex 
          direction={{base:"column", md:"row"}} 
          wrap="wrap" 
          align={{base:"stretch", md:"center"}} 
          justify="space-between" 
          gap={{base:3, md:4}} 
          mb={{base:6, md:8}} 
          px={{base:2, md:0}}
          pb={4}
          borderBottomWidth="1px"
          borderColor={borderColor}
        >
          {pageBreadcrumbs.length > 0 && (
            <Breadcrumb spacing="10px" separator={<Icon as={FaChevronRight} color={textMutedColor} boxSize={3}/>} fontSize="sm" flexGrow={1} mr={{base:0, md:4}} display="flex" alignItems="center" flexWrap="wrap">
              {pageBreadcrumbs.map((crumb, index) => (
                <BreadcrumbItem key={index} isCurrentPage={crumb.isCurrent} whiteSpace="nowrap" mb={{base:1, md:0}}>
                  <BreadcrumbLink
                    onClick={crumb.isCurrent ? undefined : crumb.onClick}
                    color={crumb.isCurrent ? headingColor : textMutedColor}
                    fontWeight={crumb.isCurrent ? "semibold" : "medium"}
                    _hover={!crumb.isCurrent ? { color: accentColor, textDecoration: 'none' } : {}}
                    cursor={!crumb.isCurrent ? 'pointer' : 'default'}
                    display="flex" alignItems="center"
                    p={1.5} borderRadius="md"
                    bg={crumb.isCurrent ? useColorModeValue("blackAlpha.100", "whiteAlpha.100") : "transparent"}
                  >
                    {crumb.icon && <Icon as={crumb.icon} mr={1.5} color={crumb.isCurrent ? accentColor : textMutedColor} />}
                    {crumb.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              ))}
            </Breadcrumb>
          )}
          <HStack spacing={3} mt={{base:3, md:0}} w={{base:"full", md:"auto"}} justifyContent={{base:"center", md:"flex-end"}} flexWrap="wrap">
              {currentSelectionStep === 'branch' && selectedExam && (
                  <>
                      <Button
                          onClick={() => openModeSelector({ examId: selectedExam.id, examName: selectedExam.displayName })}
                          colorScheme="brand" size="sm" leftIcon={<Icon as={FaPlayCircle} />}
                          boxShadow="md" _hover={{boxShadow:"lg", transform:"translateY(-1px)"}} flexShrink={0} borderRadius="lg"
                      >
                          "{selectedExam.displayName}" Tüm Soruları
                      </Button>
                      <Button onClick={() => handleGoToStep('exam', true)} variant="outline" size="sm" leftIcon={<Icon as={FaArrowLeft} />} flexShrink={0} borderRadius="lg">Sınav Seçimine Dön</Button>
                  </>
              )}
              {currentSelectionStep === 'topic' && selectedExam && selectedBranch && (!activeTopicBrowse || (activeTopicBrowse.children && activeTopicBrowse.children.length === 0) || (!activeTopicBrowse.children)) && (
                   <>
                      <Button
                          onClick={() => openModeSelector({ examId: selectedExam.id, branchId: selectedBranch.id, examName: selectedExam.displayName, branchName: selectedBranch.name })}
                          colorScheme="brand" size="sm" leftIcon={<Icon as={FaPlayCircle} />}
                          boxShadow="md" _hover={{boxShadow:"lg", transform:"translateY(-1px)"}} flexShrink={0} borderRadius="lg"
                      >
                          "{selectedBranch.name}" Tüm Soruları
                      </Button>
                      <Button onClick={() => handleGoToStep('branch', false, true)} variant="outline" size="sm" leftIcon={<Icon as={FaArrowLeft} />} flexShrink={0} borderRadius="lg">Branş Seçimine Dön</Button>
                   </>
              )}
               {currentSelectionStep === 'topic' && activeTopicBrowse && currentPathIds.length > 0 && (
                   <Button onClick={() => {
                       const parentPathIds = currentPathIds.slice(0, -1);
                       setCurrentPathIds(parentPathIds);
                   }} variant="outline" size="sm" leftIcon={<Icon as={FaArrowLeft} />} flexShrink={0} borderRadius="lg">
                      "{breadcrumbItemsBrowsePath[breadcrumbItemsBrowsePath.length - 2]?.name || selectedBranch?.name || 'Üst Seviye'}"
                  </Button>
              )}
          </HStack>
        </Flex>
        
        {dataFetchLoading && currentSelectionStep !== 'exam' && (
          <Center py={10}><Spinner color={accentColor} size="xl" thickness="4px"/><Text ml={4} fontSize="lg" color={textMutedColor}>{loadingMessage || "Veriler yükleniyor..."}</Text></Center>
        )}
  
        {!dataFetchLoading && currentSelectionStep === 'exam' && (
          <Box>
            <VStack spacing={2} mb={{base:8, md:12}} textAlign="center">
              <Icon as={FiGrid} boxSize={{base:10, md:12}} color={accentColor} />
              <Heading as="h1" size={{base:"lg", md:"xl"}} color={headingColor} fontWeight="bold">Konu Evrenini Keşfet</Heading>
              <Text color={textColor} fontSize={{base:"md", md:"lg"}} maxW="xl" mx="auto">
                  Sınav hedefinize yönelik konu anlatımlarına, özel olarak hazırlanmış sorulara ve dijital antrenörünüze buradan ulaşın.
              </Text>
            </VStack>
            {orderedExamsForUI.length === 0 && !pageLoading ? (
              <Alert status="info" variant="subtle" borderRadius="xl" bg={useColorModeValue("blue.50", "rgba(49,130,206,0.15)")} p={6} boxShadow="md">
                <AlertIcon color={useColorModeValue("blue.500","blue.300")} boxSize={6}/>
                <AlertDescription ml={3} color={textColor}>Kullanılabilir sınav türü bulunamadı. Lütfen daha sonra tekrar kontrol edin.</AlertDescription>
              </Alert>
            ) : (
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={{base:5, md:8}}>
                {orderedExamsForUI.map((exam, index) => {
                  const isTarget = user && user.defaultClassificationId === exam.id && user.role !== 'admin';
                  return (
                    <ExamCard
                      key={exam.id}
                      exam={{ id: exam.id, displayName: exam.displayName, name: exam.name }}
                      tierName={exam.tierName}
                      isTargetExam={isTarget}
                      onClick={handleExamSelect}
                      index={index}
                    />
                  );
                })}
              </SimpleGrid>
            )}
          </Box>
        )}
  
        {!dataFetchLoading && currentSelectionStep === 'branch' && selectedExam && (
          <Box>
             <Heading as="h2" size={{base:"lg", md:"xl"}} color={headingColor} mb={{base:6, md:8}} display="flex" alignItems="center">
               <Icon as={FaTags} mr={3} color={accentColor}/> "{selectedExam.displayName}" İçin Branşınızı Seçin
            </Heading>
            {error && !pageLoading && <Alert status="error" variant="subtle" mb={4} borderRadius="lg" boxShadow="md"><AlertIcon />{error}</Alert>}
            {filteredBranches.length === 0 && !dataFetchLoading && !error && (
               <Alert status="info" variant="subtle" borderRadius="xl" bg={useColorModeValue("orange.50", "rgba(221,107,32,0.15)")} p={6} boxShadow="md">
                  <AlertIcon color={useColorModeValue("orange.500", "orange.300")} boxSize={6}/>
                  <AlertDescription ml={3} color={textColor}>"{selectedExam.displayName}" sınav türü için uygun branş bulunamadı veya bu branşlarda henüz konu içeriği yok.</AlertDescription>
               </Alert>
            )}
            {filteredBranches.length > 0 && (
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={{base:4, md:6}}>
                {filteredBranches.map((branch, index) => (
                  <ScaleFade initialScale={0.95} in={true} key={branch.id} transition={{ enter: { duration: 0.35, delay: index * 0.06 } }}>
                      <Button
                      onClick={() => handleBranchSelect(branch)}
                      variant="outline" bg={branchButtonBg} borderColor={borderColor}
                      p={6} h="auto" minH={{base:"120px", md:"140px"}} borderRadius="xl" boxShadow="lg"
                      _hover={{ boxShadow: 'xl', borderColor: accentColor, bg: branchButtonHoverBg, transform: "translateY(-4px) scale(1.02)"}}
                      _focusVisible={{ ring: '3px', ringColor: accentColor, borderColor: accentColor}}
                      textAlign="left" w="full" display="flex" flexDirection="column" alignItems="flex-start" justifyContent="space-between"
                      transition="all 0.2s ease-out"
                      >
                      <VStack align="flex-start" spacing={1.5} flex="1">
                          <Icon as={FaListUl} color={accentColor} boxSize={7} mb={2}/>
                          <Heading fontWeight="semibold" color={headingColor} fontSize="lg" noOfLines={2} lineHeight="shorter">{branch.name}</Heading>
                      </VStack>
                      <Text fontSize="sm" color={textMutedColor} mt={2} alignSelf="flex-end">
                          {topicCountsForBranches[branch.id] || 0} Ana Konu
                      </Text>
                      </Button>
                  </ScaleFade>
                ))}
              </SimpleGrid>
            )}
          </Box>
        )}
  
        {!dataFetchLoading && currentSelectionStep === 'topic' && selectedExam && selectedBranch && (
          <Box>
            {/* Aktif Konu Bilgi Kutusu */}
            {activeTopicBrowse && (
              <Box 
                  mb={{base:8, md:10}} 
                  p={{base:5, md:6}} 
                  borderRadius="xl" 
                  bg={useColorModeValue('brand.50', 'rgba(49, 130, 206, 0.1)')} // Vurgulu arkaplan
                  borderWidth="1px" 
                  borderColor={useColorModeValue('brand.200', 'brand.700')} 
                  boxShadow="xl"
              >
                <Flex wrap="wrap" justify="space-between" align={{base:"flex-start", md:"center"}} gap={4}>
                  <HStack spacing={{base:3, md:4}} flex="1" minW={0}>
                    <Icon as={FaFolderOpen} boxSize={{base:"28px", md:"32px"}} color={useColorModeValue('brand.600', 'brand.200')} />
                    <Box>
                      <Heading as="h2" size={{base:"md", md:"lg"}} color={useColorModeValue('brand.700', 'brand.100')} noOfLines={2} fontWeight="bold">{activeTopicBrowse.name}</Heading>
                      {activeTopicBrowse.description && <Text display={{base:"none", sm:"block"}} color={useColorModeValue('brand.600', 'brand.200')} fontSize="sm" noOfLines={2} mt={1.5}>{activeTopicBrowse.description}</Text>}
                    </Box>
                  </HStack>
                  <HStack spacing={3} flexShrink={0} mt={{ base: 4, md: 0 }} w={{base:"full", md:"auto"}} justifyContent={{base:"center", md:"flex-end"}}>
                    <Button as={ChakraLink} onClick={(e) => {e.preventDefault(); navigate(`/lectures/topic/${activeTopicBrowse.id}`);}} variant="solid" colorScheme="blue" leftIcon={<Icon as={FaBookOpen} />} size={{base:"sm", md:"md"}} flexGrow={{base:1, md:0}} boxShadow="md" _hover={{boxShadow:"lg"}}>Konu Anlatımı</Button>
                    <Button
                      onClick={() => openModeSelector({ examId: selectedExam.id, branchId: selectedBranch.id, topicId: activeTopicBrowse.id })}
                      colorScheme="brand"
                      leftIcon={<Icon as={FaPencilAlt} />}
                      size={{base:"sm", md:"md"}}
                      flexGrow={{base:1, md:0}}
                      boxShadow="md" _hover={{boxShadow:"lg"}}
                    >
                      Soruları Çöz
                    </Button>
                  </HStack>
                </Flex>
              </Box>
            )}
  
            {/* Alt Konu Kartları */}
            {(currentDisplayTopics && currentDisplayTopics.length > 0) ? (
              <>
                <Heading as="h3" size={{base:"md", md:"lg"}} mb={{base:4, md:6}} color={headingColor} fontWeight="semibold" display="flex" alignItems="center">
                  <Icon as={activeTopicBrowse ? FiLayers : FaListUl} mr={3} color={textColor} />
                  {activeTopicBrowse ? 'Alt Başlıklar' : `${selectedBranch.name} Konu Başlıkları`}
                </Heading>
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={{base:4, md:6}}>
                  {currentDisplayTopics.map((topic, index) => (
                      <TopicCard key={topic.id} topic={topic} index={index} onSelectTopic={handleTopicCardSelect} token={token} examClassificationId={selectedExam.id} />
                  ))}
                </SimpleGrid>
              </>
            ) : (!dataFetchLoading && !error && (
              <Center py={10} flexDirection="column" bg={cardBg} borderRadius="xl" boxShadow="lg" p={8}>
                <Icon as={FaInfoCircle} boxSize="48px" color={textMutedColor} mb={5}/>
                <Text color={textColor} fontSize="lg" fontStyle="italic" textAlign="center" maxW="md">
                  {currentPathIds.length > 0 ? 'Bu başlık altında gösterilecek başka alt konu bulunmuyor.' : `"${selectedBranch.name}" branşında henüz konu eklenmemiş veya bu filtreye uygun konu yok.`}
                </Text>
              </Center>
            ))}
          </Box>
        )}
  
        {/* Çözme Modu Seçim Modalı */}
        <Modal isOpen={isModeSelectionModalOpen} onClose={onModeSelectionModalClose} isCentered size="lg">
          <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(8px)" />
          <ModalContent bg={modalContentBg} borderRadius="xl" boxShadow="2xl" borderWidth="1px" borderColor={borderColor}>
            <ModalHeader color={headingColor} fontWeight="bold" borderBottomWidth="1px" borderColor={borderColor} fontSize="xl" py={5} px={6}>
              <Flex align="center"><Icon as={FaPlayCircle} color={accentColor} mr={3} boxSize={6}/>Çalışma Modunu Seçin</Flex>
            </ModalHeader>
            <ModalCloseButton _hover={{bg: useColorModeValue("gray.200", "gray.600")}} borderRadius="full"/>
            <ModalBody py={8} px={6}>
              <Text mb={6} color={textColor} textAlign="center" fontSize="md">
                  Seçili kapsam için "{quizScopeForModal.topicId ? (findTopicByIdRecursive(topics, quizScopeForModal.topicId))?.name || 'Konu' : quizScopeForModal.branchName || quizScopeForModal.examName || 'Genel'}" hangi modda çalışmak istersiniz?
              </Text>
              <VStack spacing={5}>
                <Button
                  bg={useColorModeValue("purple.500", "purple.300")}
                  color="white"
                  _hover={{bg: useColorModeValue("purple.600", "purple.400"), boxShadow: "xl"}}
                  onClick={() => navigateToSolvePage('deneme')}
                  w="full" size="lg" py={7}
                  leftIcon={<Icon as={FaStopwatch} boxSize={5}/>}
                  boxShadow="lg" borderRadius="lg"
                  fontWeight="bold" letterSpacing="wide"
                >
                  Deneme Modu
                  <Text as="span" fontSize="xs" color={useColorModeValue("purple.100", "purple.100")} ml={1.5} fontWeight="normal">(Süreli, Açıklamasız)</Text>
                </Button>
                <Button
                  bg={useColorModeValue("teal.500", "teal.300")}
                  color="white"
                  _hover={{bg: useColorModeValue("teal.600", "teal.400"), boxShadow: "xl"}}
                  onClick={() => navigateToSolvePage('practice')}
                  w="full" size="lg" py={7}
                  leftIcon={<Icon as={FaPencilAlt} boxSize={5}/>}
                  boxShadow="lg" borderRadius="lg"
                  fontWeight="bold" letterSpacing="wide"
                >
                  Pratik Modu
                  <Text as="span" fontSize="xs" color={useColorModeValue("teal.100", "teal.100")} ml={1.5} fontWeight="normal">(Süresiz, Açıklamalı)</Text>
                </Button>
              </VStack>
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor={borderColor} pt={4} pb={5} px={6}>
              <Button variant="ghost" onClick={onModeSelectionModalClose} colorScheme="gray">Kapat</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    );
  }
  
  export default TopicBrowserPage;