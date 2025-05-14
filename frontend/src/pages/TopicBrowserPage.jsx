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
  ModalFooter, ModalBody, ModalCloseButton, useDisclosure
} from '@chakra-ui/react';
import { 
  FaArrowLeft, FaBookOpen, FaPencilAlt, FaExclamationTriangle, 
  FaInfoCircle, FaFolder, FaUniversity, FaAngleRight, FaTags, FaFolderOpen,
  FaListUl, FaPlayCircle, FaStopwatch // FaStopwatch eklendi
} from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL;

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
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Veriler yükleniyor...');
  const [error, setError] = useState('');

  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Modal state'leri
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

  // Effects (veri çekme vb.)
  useEffect(() => { /* ... fetchInitialData (öncekiyle aynı) ... */ 
    const fetchInitialData = async () => {
      setLoading(true); setLoadingMessage('Sınav türleri ve branşlar yükleniyor...'); setError('');
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [ecRes, branchRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/exam-classifications`, config),
          axios.get(`${API_BASE_URL}/api/branches`, config)
        ]);
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
      } finally { setLoading(false); }
    };
    if (token) { fetchInitialData(); } 
    else { setError("İçeriklere erişmek için lütfen giriş yapın."); setLoading(false); }
  }, [token, user]);

  useEffect(() => { /* ... fetchBranchesAndTopicCounts (öncekiyle aynı) ... */ 
      if (currentSelectionStep === 'branch' && selectedExam && token && allBranches.length > 0) {
      const fetchBranchesAndTopicCounts = async () => {
        setLoading(true); setLoadingMessage(`${selectedExam.displayName} için branşlar ve konu sayıları yükleniyor...`);
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
        } finally { setLoading(false); }
      };
      fetchBranchesAndTopicCounts();
    }
  }, [currentSelectionStep, selectedExam, token, allBranches]);

  useEffect(() => { /* ... fetchTopicsForBranch (öncekiyle aynı) ... */ 
    if (currentSelectionStep === 'topic' && selectedExam && selectedBranch && token) {
      const fetchTopicsForBranch = async () => {
        setLoading(true); setLoadingMessage(`${selectedExam.displayName} > ${selectedBranch.name} için konular yükleniyor...`);
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
        } finally { setLoading(false); }
      };
      fetchTopicsForBranch();
    }
  }, [currentSelectionStep, selectedExam, selectedBranch, token]);

  // Memoized values (öncekiyle aynı)
  const { activeTopicBrowse, currentDisplayTopics, breadcrumbItemsBrowsePath } = useMemo(() => { /* ... */ 
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

  const pageBreadcrumbs = useMemo(() => { /* ... */ 
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

  // YENİ: Mod seçimi modalını açan fonksiyon
  const openModeSelector = (scope) => {
    // scope: { examId, examName, branchId?, branchName?, topicId? }
    setQuizScopeForModal(scope);
    onModeSelectionModalOpen();
  };

  const navigateToSolvePage = (mode) => {
    const { examId, branchId, topicId, examName, branchName } = quizScopeForModal;
    let queryString = '';
    const params = new URLSearchParams();

    if (examId) params.append('examClassificationId', examId);
    if (examName && mode === 'deneme') params.append('examName', examName); // Deneme başlığı için

    if (branchId) params.append('branchId', branchId);
    if (branchName && mode === 'deneme' && branchId) params.append('branchName', branchName); // Deneme başlığı için

    if (topicId) params.append('topicId', topicId); // Pratik modunda topicId yeterli olabilir, SolvePage'in mantığına bağlı.
                                                  // Deneme modunda topicId genellikle kullanılmaz.
    if (mode === 'deneme') {
        params.append('mode', 'deneme');
    }
    // Eğer sadece topicId varsa ve bu bir pratik mod ise, exam ve branch ID'leri de ekleyelim ki SolvePage başlığı doğru oluştursun
    if (mode === 'practice' && topicId && examId && branchId) {
        // examId ve branchId zaten eklenmiş olmalı. Bu ek kontrol gereksiz olabilir.
    }

    queryString = params.toString();
    navigate(`/solve?${queryString}`);
    onModeSelectionModalClose();
  };


  // --- RENDER KISMI ---
  if (loading) { /* ... Yükleniyor (aynı) ... */ 
    return (
      <Container maxW="container.lg" py={{base: 6, md: 10}} centerContent minH="60vh">
        <VStack spacing={4}><Spinner size="xl" color="brand.500" thickness="4px" /><Text color="textSecondary">{loadingMessage}</Text></VStack>
      </Container>
    );
  }
  if (error) { /* ... Hata (aynı) ... */ 
    return (
      <Container maxW="container.lg" mt={{base: 6, md: 10}}>
        <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={10} borderRadius="lg" bg={useColorModeValue("red.50", "red.900")}>
          <AlertIcon boxSize="40px" mr={0} as={FaExclamationTriangle} color="red.500"/>
          <AlertTitle mt={4} mb={2} fontSize="xl" color={useColorModeValue("red.600", "red.100")}>Erişim Hatası veya Veri Yüklenemedi</AlertTitle>
          <AlertDescription maxWidth="md" mb={6} color={useColorModeValue("red.700", "red.200")}>{error}</AlertDescription>
          <Button colorScheme="red" onClick={() => { 
            setError(''); setLoading(true); 
            if (token) { handleGoToStep('exam', true); }
            else { navigate('/login'); }
          }} leftIcon={<Icon as={FaArrowLeft} />}>
            {token ? 'Başa Dön ve Tekrar Dene' : 'Giriş Yap'}
          </Button>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.xl" py={{base:4, md:8}} bg={bgColor} minH="calc(100vh - 150px)">
      <Flex direction={{base:"column", md:"row"}} wrap="wrap" align="center" justify="space-between" gap={4} mb={{base:3, md:6}} px={{base:2, md:0}}>
        {pageBreadcrumbs.length > 0 && (
          <Breadcrumb spacing="8px" separator={<Icon as={FaAngleRight} color="gray.400" />} fontSize="sm" flexGrow={1} mr={{base:0, md:4}}>
            {pageBreadcrumbs.map((crumb, index) => (
              <BreadcrumbItem key={index} isCurrentPage={crumb.isCurrent}>
                <BreadcrumbLink 
                  onClick={crumb.isCurrent ? undefined : crumb.onClick} 
                  color={crumb.isCurrent ? headingColor : textMutedColor}
                  fontWeight={crumb.isCurrent ? "semibold" : "normal"}
                  _hover={!crumb.isCurrent ? { color: stepIndicatorColor, textDecoration: 'underline' } : {}}
                  cursor={!crumb.isCurrent ? 'pointer' : 'default'}
                >
                  {crumb.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        )}
        <HStack spacing={3} mt={{base:3, md:0}} w={{base:"full", md:"auto"}} justifyContent={{base:"flex-start", md:"flex-end"}} flexWrap="wrap">
            {/* ---- YENİ "SORU ÇÖZ" VE "GERİ DÖN" BUTONLARI ---- */}
            {currentSelectionStep === 'branch' && selectedExam && (
                <>
                    <Button 
                        onClick={() => openModeSelector({ examId: selectedExam.id, examName: selectedExam.displayName })} 
                        colorScheme="green" 
                        size="sm" 
                        leftIcon={<Icon as={FaPlayCircle} />}
                    >
                        "{selectedExam.displayName}" Soruları
                    </Button>
                    <Button onClick={() => handleGoToStep('exam', true)} variant="outline" size="sm" leftIcon={<Icon as={FaArrowLeft} />}>Sınav Seçimine Dön</Button>
                </>
            )}
            {currentSelectionStep === 'topic' && selectedExam && selectedBranch && breadcrumbItemsBrowsePath.length === 0 && (
                 <>
                    <Button 
                        onClick={() => openModeSelector({ examId: selectedExam.id, branchId: selectedBranch.id, examName: selectedExam.displayName, branchName: selectedBranch.name })} 
                        colorScheme="green" 
                        size="sm" 
                        leftIcon={<Icon as={FaPlayCircle} />}
                    >
                        "{selectedBranch.name}" Soruları
                    </Button>
                    <Button onClick={() => handleGoToStep('branch', false, true)} variant="outline" size="sm" leftIcon={<Icon as={FaArrowLeft} />}>Branş Seçimine Dön</Button>
                 </>
            )}
            {/* Spesifik bir konu seçildiğinde (activeTopicBrowse) zaten kendi içinde Soru Çöz butonu var, o da modalı açacak şekilde güncellenecek. */}
        </HStack>
      </Flex>
      <Divider mb={{base:4, md:8}} borderColor={borderColor}/>

      {currentSelectionStep === 'exam' && ( /* ... Sınav Seçim Ekranı (öncekiyle aynı) ... */ 
        <Box>
          <Heading as="h1" size={{base:"lg", md:"xl"}} textAlign="center" mb={3} color={headingColor}>Sınavınızı Seçin</Heading>
          <Text textAlign="center" color={textColor} fontSize={{base:"sm", md:"md"}} mb={{base:6, md:10}}>Hangi sınava veya ders grubuna odaklanmak istiyorsunuz?</Text>
          {orderedExamsForUI.length === 0 && !error && !loading ? (
            <Alert status="info" variant="subtle" borderRadius="md" bg={useColorModeValue("blue.50", "blue.800")}>
              <AlertIcon color="blue.400" /> 
              { user && user.defaultClassificationId && user.role !== 'admin' ?
                `Varsayılan sınav türünüz için içerik bulunamadı veya henüz tanımlanmadı.` :
                "Kullanılabilir sınav türü bulunamadı."
              }
            </Alert>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={{base:4, md:6}}>
              {orderedExamsForUI.map(exam => {
                const isTarget = user && user.defaultClassificationId === exam.id && user.role !== 'admin';
                return (
                  <ExamCard 
                    key={exam.id} 
                    exam={{ id: exam.id, displayName: exam.displayName, name: exam.name }}
                    tierName={exam.tierName}
                    isTargetExam={isTarget}
                    onClick={handleExamSelect} 
                  />
                );
              })}
            </SimpleGrid>
          )}
        </Box>
      )}

      {currentSelectionStep === 'branch' && selectedExam && (  /* ... Branş Seçim Ekranı (öncekiyle aynı, sadece Soru Çöz butonu yukarı taşındı) ... */ 
        <Box>
           <Heading as="h2" size={{base:"md", md:"lg"}} color={headingColor} mb={{base:4, md:6}}>
             Branşınızı Seçin
          </Heading>
          {error && !loading && <Alert status="error" variant="subtle" mb={4} borderRadius="md"><AlertIcon />{error}</Alert>}
          {filteredBranches.length === 0 && !error && !loading ? (
             <Alert status="info" variant="subtle" borderRadius="md" bg={useColorModeValue("orange.50", "orange.800")}>
                <AlertIcon color="orange.400" /> 
                <Text>"{selectedExam.displayName}" için tanımlanmış uygun branş bulunamadı.</Text>
             </Alert>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={{base:3, md:5}}>
              {filteredBranches.map(branch => (
                <Button 
                  key={branch.id} 
                  onClick={() => handleBranchSelect(branch)}
                  colorScheme={branchButtonColorScheme} variant="outline" bg={cardBg} borderColor={borderColor}
                  p={5} h="auto" minH={{base:"100px", md:"120px"}} borderRadius="lg" boxShadow="sm"
                  _hover={{ boxShadow: 'md', borderColor: stepIndicatorColor, bg: useColorModeValue('gray.100', 'gray.700')}}
                  _focusVisible={{ ring: '2px', ringColor: stepIndicatorColor}}
                  textAlign="left" w="full" display="flex" flexDirection="column" alignItems="flex-start" justifyContent="space-between" 
                >
                  <VStack align="flex-start" spacing={1}>
                    <Icon as={FaListUl} color={stepIndicatorColor} boxSize={{base:4, md:5}} />
                    <Text fontWeight="medium" color={headingColor} fontSize={{base:"sm", md:"md"}} noOfLines={2}>{branch.name}</Text>
                  </VStack>
                  <Text fontSize="xs" color={textMutedColor} mt={1}>
                    {topicCountsForBranches[branch.id] || 0} Ana Konu
                  </Text>
                </Button>
              ))}
            </SimpleGrid>
          )}
        </Box>
      )}

      {currentSelectionStep === 'topic' && selectedExam && selectedBranch && ( /* ... Konu Tarama Ekranı ... */ 
        <Box>
          {error && !loading && <Alert status="error" mb={4} variant="subtle" borderRadius="md"><AlertIcon />{error}</Alert>}
          {activeTopicBrowse && ( 
            <Box mb={{base:6, md:10}} p={{base:4, md:6}} borderRadius="xl" bg={useColorModeValue('brand.50', 'brand.800')} borderWidth="1px" borderColor={useColorModeValue('brand.200', 'brand.700')} boxShadow="lg">
              <Flex wrap="wrap" justify="space-between" align="center" gap={4}>
                <HStack spacing={{base:2, md:4}} flex="1" minW={0}>
                  <Icon as={FaFolderOpen} boxSize={{base:"20px", md:"28px"}} color={useColorModeValue('brand.600', 'brand.200')} />
                  <Box>
                    <Heading as="h2" size={{base:"md", md:"lg"}} color={useColorModeValue('brand.700', 'brand.100')} noOfLines={2}>{activeTopicBrowse.name}</Heading>
                    {activeTopicBrowse.description && <Text display={{base:"none", md:"block"}} color={useColorModeValue('brand.600', 'brand.200')} fontSize="sm" noOfLines={2} mt={1}>{activeTopicBrowse.description}</Text>}
                  </Box>
                </HStack>
                <HStack spacing={3} flexShrink={0} mt={{ base: 3, md: 0 }} w={{base:"full", md:"auto"}} justifyContent={{base:"center", md:"flex-end"}}>
                  <Button as={ChakraLink} onClick={(e) => {e.preventDefault(); navigate(`/lectures/topic/${activeTopicBrowse.id}`);}} variant="outline" colorScheme="brand" leftIcon={<Icon as={FaBookOpen} />} size={{base:"sm", md:"md"}} flexGrow={{base:1, md:0}}>Konu Anlatımı</Button>
                  {/* YENİ: Buradaki Soru Çöz butonu da modalı açacak */}
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

          {(currentDisplayTopics && currentDisplayTopics.length > 0) ? ( /* ... Alt konular (TopicCard ile) ... */ 
            <>
              <Heading as="h3" size={{base:"sm", md:"md"}} mb={5} color={textColor} fontWeight="semibold">
                {activeTopicBrowse ? 'Alt Başlıklar' : `${selectedBranch.name} Konu Başlıkları`}
              </Heading>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={{base:3, md:5}}>
                {currentDisplayTopics.map(topic => ( <TopicCard key={topic.id} topic={topic} onSelectTopic={handleTopicCardSelect} /> ))}
              </SimpleGrid>
            </>
          ) : (!loading && !error && ( /* ... İçerik yok mesajı ... */ 
            <Center py={10} flexDirection="column">
              <Icon as={FaInfoCircle} boxSize="30px" color={textMutedColor} mb={3}/>
              <Text color={textMutedColor} fontStyle="italic" textAlign="center">
                {currentPathIds.length > 0 ? 'Bu başlık altında başka alt konu bulunmuyor.' : `"${selectedBranch.name}" branşında henüz konu eklenmemiş veya bu filtreye uygun konu yok.`}
              </Text>
            </Center>
          ))}
        </Box>
      )}

      {/* ---- MOD SEÇİM MODAL'I ---- */}
      <Modal isOpen={isModeSelectionModalOpen} onClose={onModeSelectionModalClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={cardBg}>
          <ModalHeader color={headingColor}>Çözme Modunu Seçin</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} py={4}>
              <Button
                colorScheme="purple" // Deneme Modu için farklı bir renk
                onClick={() => navigateToSolvePage('deneme')}
                w="full"
                size="lg"
                leftIcon={<Icon as={FaStopwatch} />}
                boxShadow="md"
                _hover={{boxShadow: "lg"}}
              >
                Deneme Modu <Text as="span" fontSize="xs" color="gray.400" ml={1}>(Süreli, Açıklamasız)</Text>
              </Button>
              <Button
                colorScheme="teal" // Pratik Modu için farklı bir renk
                onClick={() => navigateToSolvePage('practice')}
                w="full"
                size="lg"
                leftIcon={<Icon as={FaPencilAlt} />}
                boxShadow="md"
                _hover={{boxShadow: "lg"}}
              >
                Pratik Modu <Text as="span" fontSize="xs" color="gray.400" ml={1}>(Süresiz, Açıklamalı)</Text>
              </Button>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onModeSelectionModalClose}>Kapat</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Container>
  );
}

export default TopicBrowserPage;
