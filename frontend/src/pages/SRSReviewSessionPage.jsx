import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Card, CardBody,CardFooter,Flex, Button, IconButton, Heading, Text,
  Spinner, Alert, AlertIcon, AlertTitle, AlertDescription,
  useColorModeValue, Progress, Tag, Divider, Center,
  useToast, VStack, HStack, Icon
} from '@chakra-ui/react';
import {
  FaArrowLeft, FaSync, FaCheckCircle, FaInfoCircle, FaBrain
} from 'react-icons/fa';
import { FiRepeat, FiBox, FiChevronLeft } from "react-icons/fi"; // FiChevronLeft eklendi

import SRSItemDisplayArea from '../components/srs/SRSItemDisplayArea';
import SRSActionButtons from '../components/srs/SRSActionButtons';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const REVIEW_BATCH_SIZE = 1;

function SRSReviewSessionPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [reviewQueue, setReviewQueue] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isAnswerShown, setIsAnswerShown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionFinishedMessage, setSessionFinishedMessage] = useState('');
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);

  const processedUrlFeedbackKey = useRef(null);

  // Layout ile tutarlı stil değişkenleri
  const mainBg = useColorModeValue('gray.100', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800'); // Kartlar için Layout'taki header gibi
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const textMutedColor = useColorModeValue('gray.500', 'gray.400');
  const accentColor = useColorModeValue('brand.500', 'brand.300');
  const answerBg = useColorModeValue("gray.50", "gray.700"); // Flashkart cevap için daha koyu
  const progressBarColor = useColorModeValue("brand.500", "brand.400"); // Koyu modda biraz daha parlak
  const sessionInfoBg = useColorModeValue("white", "gray.750"); // Üst bilgi kutusu için
  const promptBg = useColorModeValue("white", "gray.700"); // SRSItemDisplayArea prompt için

  const formatDisplayItemForPage = useCallback((srsDbEntry) => {
    if (!srsDbEntry || !srsDbEntry.itemType || !srsDbEntry.item || typeof srsDbEntry.item.id === 'undefined' || typeof srsDbEntry.userFlashBoxId === 'undefined') {
        console.warn("[SRSReviewPage WARN] formatDisplayItemForPage: Geçersiz temel yapı veya userFlashBoxId eksik.", srsDbEntry);
        return null;
    }
    const { userFlashBoxId, boxNumber, lastReviewedAt, nextReviewAt, itemType, item } = srsDbEntry;
    const originalItemData = item;
    return {
      userFlashBoxId, boxNumber, lastReviewedAt, nextReviewAt, itemType,
      itemId: originalItemData.id,
      itemData: originalItemData,
    };
  }, []);

  const fetchReviewItems = useCallback(async () => {
    if (!token) { setError("Lütfen giriş yapın."); setIsLoading(false); return; }
    const params = new URLSearchParams(location.search);
    const itemTypeFilter = params.get('type');
    setIsLoading(true); setError(''); setSessionFinishedMessage(''); setCurrentItem(null); setIsAnswerShown(false);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      let url = `${API_BASE_URL}/api/srs/review-items?limit=${REVIEW_BATCH_SIZE}`;
      if (itemTypeFilter) url += `&type=${itemTypeFilter}`;
      const response = await axios.get(url, config);
      const itemsFromBackend = Array.isArray(response.data.items) ? response.data.items : [];
      if (itemsFromBackend.length > 0) {
        const formatted = itemsFromBackend.map(formatDisplayItemForPage).filter(Boolean);
        if (formatted.length > 0) {
            setReviewQueue(formatted);
            setCurrentItem(formatted[0]);
            setCurrentItemIndex(0);
        } else {
            setSessionFinishedMessage(response.data.message || `Tebrikler! ${itemTypeFilter ? itemTypeFilter.replace('_', ' ') + ' türünde ' : ''}tekrar edilecek uygun formatta öğe kalmadı.`);
        }
      } else {
        setSessionFinishedMessage(response.data.message || `Tebrikler! Şu an için ${itemTypeFilter ? itemTypeFilter.replace('_', ' ') + ' türünde ' : ''}tekrar edilecek öğe bulunmuyor.`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Tekrar öğeleri yüklenirken bir sorun oluştu.");
    } finally {
      setIsLoading(false);
    }
  }, [token, location.search, formatDisplayItemForPage]);

  useEffect(() => {
    fetchReviewItems();
  }, [fetchReviewItems]);

  const advanceToNextItemInQueue = useCallback(() => {
    setIsLoading(true);
    const nextIndex = currentItemIndex + 1;
    if (nextIndex < reviewQueue.length) {
        setCurrentItemIndex(nextIndex);
        setCurrentItem(reviewQueue[nextIndex]);
        setIsAnswerShown(false);
        setIsLoading(false);
    } else {
        toast({ title: "Tur Bitti!", description: "Bu türdeki tüm öğeler tekrar edildi. Yeni öğeler yükleniyor...", status: "info", duration: 2000, position:"top" });
        fetchReviewItems();
    }
  }, [reviewQueue, currentItemIndex, toast, fetchReviewItems]);

  const submitSrsFeedbackInternal = useCallback(async (idToSubmit, correctStatus) => {
    if (!idToSubmit || !token || isSubmittingResult) return;
    setIsSubmittingResult(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_BASE_URL}/api/srs/submit-review/${idToSubmit}`, { wasCorrect: correctStatus }, config);
      toast({ title: "Sonuç Kaydedildi", status: correctStatus ? "success" : "warning", variant:"subtle", duration: 1500, position:"top-right" });
      advanceToNextItemInQueue();
    } catch (err) {
      toast({ title: "Hata", description: err.response?.data?.message || "SRS sonucu kaydedilemedi.", status: "error" });
    } finally {
      setIsSubmittingResult(false);
    }
  }, [token, toast, advanceToNextItemInQueue, isSubmittingResult]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const srsFeedbackValue = params.get('srsFeedback');
    const srsEntryIdFromUrl = params.get('srsEntryId');
    const currentFeedbackKey = srsEntryIdFromUrl ? `${srsEntryIdFromUrl}_${srsFeedbackValue}` : null;

    if (srsFeedbackValue && srsEntryIdFromUrl) {
      if (processedUrlFeedbackKey.current !== currentFeedbackKey) {
        processedUrlFeedbackKey.current = currentFeedbackKey;
        const entryIdNum = parseInt(srsEntryIdFromUrl, 10);
        submitSrsFeedbackInternal(entryIdNum, srsFeedbackValue === 'correct');
        const currentType = params.get('type');
        const cleanedPathQuery = currentType ? `?type=${currentType}` : '';
        navigate(location.pathname + cleanedPathQuery, { replace: true, state: location.state });
      }
    } else {
      processedUrlFeedbackKey.current = null;
    }
  }, [location.search, navigate, submitSrsFeedbackInternal]);

  const handleShowAnswer = useCallback(() => {
    setIsAnswerShown(true);
  }, []);

  const handleNavigateToItemAction = useCallback(() => {
    if (!currentItem || !currentItem.itemData || typeof currentItem.userFlashBoxId === 'undefined' || currentItem.userFlashBoxId === null) {
        toast({title:"Yönlendirme Hatası", description:"Mevcut öğe, verisi veya SRS ID'si bulunamadı/geçersiz.", status:"error"});
        return;
    }
    const { itemType, itemData, userFlashBoxId } = currentItem;
    const srsReturnPath = `${location.pathname}${location.search}`;
    let targetPath = '/browse';

    if (itemType === 'question') {
        const qParams = new URLSearchParams();
        qParams.append('srsEntryId', userFlashBoxId.toString());
        if (itemData.id != null) qParams.append('questionIdForRef', itemData.id.toString());
        targetPath = `/srs-question-review?${qParams.toString()}`;
    } else if (itemType === 'topic_summary') {
        if (itemData.id != null) {
            targetPath = `/lectures/topic/${itemData.id}?srsEntryId=${userFlashBoxId.toString()}`;
        } else {
            toast({title:"Yönlendirme Hatası", description:"Konu özeti için ID bilgileri eksik.", status:"error"});
            return;
        }
    }
    const stateToPass = { srsReviewItem: itemData, srsEntryId: userFlashBoxId, srsReturnPath: srsReturnPath };
    navigate(targetPath, { state: stateToPass });
  }, [navigate, location.pathname, location.search, currentItem, toast]);

  const handleSolveTopicQuestionsClick = useCallback(() => {
    if (currentItem && currentItem.itemType === 'topic_summary' && currentItem.itemId) {
      navigate(`/solve?topicId=${currentItem.itemId}&mode=practice`);
    }
  }, [navigate, currentItem]);

  const progressPercentage = useMemo(() => {
    if (!reviewQueue || reviewQueue.length === 0 || !currentItem) return 0;
    return ((currentItemIndex + 1) / reviewQueue.length) * 100;
  }, [currentItemIndex, reviewQueue, currentItem]);

  // Yükleme, Hata ve Bitiş Durumları
  if (isLoading && !currentItem && !sessionFinishedMessage) {
    return <Container centerContent py={10} minH="calc(100vh - 120px)" display="flex" flexDirection="column" justifyContent="center" alignItems="center" bg={mainBg}><Spinner size="xl" color={accentColor} thickness="4px" /><Text mt={4} color={textMutedColor} fontSize="lg">Tekrar seansı hazırlanıyor...</Text></Container>;
  }
  if (error) {
    return <Container centerContent py={10} minH="calc(100vh - 120px)" bg={mainBg}><Alert status="error" variant="subtle" flexDirection="column" alignItems="center" borderRadius="xl" p={8} boxShadow="xl" bg={cardBg} borderColor={borderColor} borderWidth="1px"><AlertIcon boxSize="40px" color="red.400"/><AlertTitle mt={4} fontSize="xl" fontWeight="bold" color={headingColor}>Bir Hata Oluştu</AlertTitle><AlertDescription mt={2} color={textColor}>{error}</AlertDescription><HStack mt={6}><Button colorScheme="red" variant="outline" onClick={fetchReviewItems} leftIcon={<FaSync />}>Tekrar Yükle</Button><Button variant="ghost" onClick={() => navigate('/digital-coach')}>Antrenöre Dön</Button></HStack></Alert></Container>;
  }
  if (sessionFinishedMessage && !currentItem && !isLoading) {
    return <Container centerContent py={10} minH="calc(100vh - 120px)" bg={mainBg} textAlign="center"><Icon as={FaCheckCircle} boxSize="56px" color="green.400" mb={5} /><Heading size="xl" mb={4} color={headingColor}>{sessionFinishedMessage.startsWith('Tebrikler!') ? 'Harika İş Çıkardın!' : 'Bilgilendirme'}</Heading><Text mb={8} maxW="lg" fontSize="lg" color={textColor}>{sessionFinishedMessage}</Text><VStack spacing={4} w="full" maxW="xs"><Button colorScheme="brand" onClick={fetchReviewItems} leftIcon={<FaSync />} size="lg" w="full" py={6} borderRadius="lg" boxShadow="lg">Yeni Öğeleri Getir</Button><Button variant="outline" colorScheme="gray" onClick={() => navigate('/digital-coach')} size="lg" w="full" py={6} borderRadius="lg">Antrenöre Dön</Button></VStack></Container>;
  }
  if (!currentItem && !isLoading && !error) {
     return <Container centerContent py={10} minH="calc(100vh - 120px)" bg={mainBg} textAlign="center"><Icon as={FaInfoCircle} boxSize="48px" color="blue.400" mb={4} /><Heading size="xl" mb={3} color={headingColor}>Tekrar Edilecek Öğe Bulunamadı</Heading><Text mb={6} maxW="lg" color={textColor}>Bu türde tekrar edilecek başka öğe yok veya yüklenirken bir sorun oluştu.</Text><Button variant="solid" colorScheme="blue" onClick={() => navigate('/digital-coach')} size="lg" py={6} borderRadius="lg">Antrenöre Dön</Button></Container>;
  }

  return (
    <Container maxW="container.lg" py={{ base: 4, md: 8 }} bg={mainBg} minH="calc(100vh - 80px)">
      <VStack spacing={{base:5, md:8}} align="stretch">
        <Flex justifyContent="space-between" alignItems="center" wrap="wrap" gap={2} px={{base:2, md:0}}>
          <Heading size={{base:"lg", md:"xl"}} color={headingColor} display="flex" alignItems="center">
            <Icon as={FiRepeat} mr={3} color={accentColor} /> Dijital Antrenör
          </Heading>
          <Button 
            variant="ghost" 
            colorScheme="gray" 
            onClick={() => navigate('/digital-coach')} 
            leftIcon={<Icon as={FiChevronLeft} boxSize={5}/>}
            color={textMutedColor}
            _hover={{color: accentColor, bg: useColorModeValue("gray.200", "gray.700")}}
            borderRadius="full"
          >
            Seçim Ekranı
          </Button>
        </Flex>

        <Box 
            bg={sessionInfoBg} 
            p={{base:3, md:4}} 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor={borderColor} 
            boxShadow="lg"
        >
          <HStack justifyContent="space-between" alignItems="center">
            <Tag size="lg" variant="solid" colorScheme="yellow" borderRadius="full" px={4} py={2} boxShadow="md">
              <Icon as={FiBox} mr={2}/> Kutu: {currentItem.boxNumber}
            </Tag>
            <Text fontSize="md" color={textMutedColor} fontWeight="medium">
                {currentItemIndex + 1} / {reviewQueue.length} (Bu Turda)
            </Text>
          </HStack>
          {reviewQueue.length > 0 && 
            <Progress 
                value={progressPercentage} 
                size="md" // Biraz daha kalın
                colorScheme={progressBarColor.split('.')[0]} // 'brand.500' -> 'brand'
                mt={3} 
                borderRadius="full" 
                hasStripe 
                isAnimated={!isLoading}
                bg={useColorModeValue("gray.200", "gray.600")}
            />
          }
        </Box>

        <Card variant="outline" bg={cardBg} borderColor={borderColor} boxShadow="xl" borderRadius="xl" minH={{base:"350px", md:"420px"}} display="flex" flexDirection="column">
          <CardBody p={{base:5, md:8}} flex="1" display="flex" flexDirection="column" justifyContent="center" alignItems="center" textAlign="center">
            <SRSItemDisplayArea
              currentItem={currentItem}
              isAnswerShown={isAnswerShown}
              headingColor={headingColor}
              textColor={textColor}
              textMutedColor={textMutedColor}
              borderColor={borderColor}
              promptBg={promptBg} // promptBg'yi SRSItemDisplayArea'ya geçir
              answerBg={answerBg}   // answerBg'yi SRSItemDisplayArea'ya geçir
            />
          </CardBody>

          <CardFooter 
            borderTopWidth="1px" 
            borderColor={borderColor} 
            py={6} px={{base:4, md:8}} 
            bg={useColorModeValue("gray.50", "gray.850")} // Footer arkaplanı
            borderBottomRadius="xl" // Kart ile uyumlu köşe
          >
            <SRSActionButtons
              currentItem={currentItem}
              isAnswerShown={isAnswerShown}
              isSubmittingResult={isSubmittingResult}
              onShowAnswerClick={handleShowAnswer}
              onNavigateToItemAction={handleNavigateToItemAction}
              onSubmitFlashcardFeedback={submitSrsFeedbackInternal} 
              onSolveTopicQuestionsClick={handleSolveTopicQuestionsClick}
            />
          </CardFooter>
        </Card>

        <Center mt={2}>
            <Text fontSize="sm" color={textMutedColor}>
                Bu öğe şu anda {currentItem.boxNumber}. kutuda.
                {currentItem.lastReviewedAt ? ` Son tekrar: ${new Date(currentItem.lastReviewedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}` : ' (Yeni öğe)'}
            </Text>
        </Center>
      </VStack>
    </Container>
  );
}

export default SRSReviewSessionPage;
