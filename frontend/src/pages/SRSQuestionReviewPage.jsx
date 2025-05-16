import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  Box, Container, Flex, Button, Heading, Text, SimpleGrid,
  Card, CardBody, Image, Icon, HStack, Tag, Divider, Collapse,
  useColorModeValue, Center, VStack, useToast, Spinner
} from '@chakra-ui/react';
import {
  FaArrowLeft, FaCheckCircle as FaCheckCircleSolid, FaTimesCircle as FaTimesCircleSolid, FaLightbulb, FaBrain
} from 'react-icons/fa'; // Solid ikonları kullanabiliriz
import { FiCheckCircle, FiXCircle, FiChevronLeft } from "react-icons/fi"; // FiChevronLeft eklendi

const API_BASE_URL = import.meta.env.VITE_API_URL;

function SRSQuestionReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [srsData, setSrsData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const mainBg = useColorModeValue('gray.100', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const textMutedColor = useColorModeValue('gray.500', 'gray.400');
  const accentColor = useColorModeValue('brand.500', 'brand.300');
  const explanationBg = useColorModeValue('blue.50', 'rgba(49, 130, 206, 0.1)');
  const explanationBorderColor = useColorModeValue('blue.200', 'blue.600');
  const explanationHeadingColor = useColorModeValue('blue.700', 'blue.200');


  useEffect(() => {
    const stateData = location.state;
    if (stateData && stateData.srsReviewItem && stateData.srsEntryId && stateData.srsReturnPath) {
      setCurrentQuestion(stateData.srsReviewItem);
      setSrsData({
        entry: stateData.srsReviewItem,
        srsEntryId: stateData.srsEntryId,
        srsReturnPath: stateData.srsReturnPath,
      });
      setSelectedAnswer('');
      setIsAnswerChecked(false);
      setIsCorrect(null);
      setShowExplanation(false);
    } else {
      toast({
        title: "Veri Hatası",
        description: "Tekrar edilecek soru bilgileri eksik. Lütfen antrenör sayfasına dönüp tekrar deneyin.",
        status: "error",
        duration: 7000,
        isClosable: true,
      });
      navigate('/digital-coach', { replace: true });
    }
  }, [location.state, navigate, toast]);

  const handleSelectOption = (option) => {
    if (!isAnswerChecked) {
      setSelectedAnswer(option);
    }
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer || !currentQuestion) return;
    const correct = selectedAnswer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setIsAnswerChecked(true);
  };

  const handleSrsFeedback = (wasCorrectFeedback) => {
    if (!srsData || !srsData.srsEntryId || !srsData.srsReturnPath) {
        toast({ title: "Hata", description: "Geri bildirim gönderilemedi, SRS bilgileri eksik.", status: "error"});
        return;
    }
    setIsSubmittingFeedback(true);
    const feedbackParams = new URLSearchParams();
    feedbackParams.append('srsFeedback', wasCorrectFeedback ? 'correct' : 'incorrect');
    feedbackParams.append('srsEntryId', srsData.srsEntryId.toString());
    
    const srsReturnPathOnly = srsData.srsReturnPath.split('?')[0];
    const existingReturnParams = new URLSearchParams(srsData.srsReturnPath.split('?')[1] || '');
    const typeParam = existingReturnParams.get('type');

    let finalReturnPath = srsReturnPathOnly;
    if (typeParam) {
        feedbackParams.append('type', typeParam);
    }
    finalReturnPath += `?${feedbackParams.toString()}`;
    
    navigate(finalReturnPath, { replace: true });
  };

  const toggleExplanation = () => setShowExplanation(!showExplanation);

  if (!currentQuestion || !srsData) {
    return (
      <Container centerContent py={10} minH="calc(100vh - 160px)" bg={mainBg}>
        <Spinner size="xl" color={accentColor} thickness="4px"/>
        <Text mt={4} color={textMutedColor} fontSize="lg">Soru Bilgileri Yükleniyor...</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={{ base: 4, md: 8 }} bg={mainBg} minH="calc(100vh - 80px)">
      <VStack spacing={6} align="stretch">
        <Flex justifyContent="space-between" alignItems="center" px={{base:2, md:0}}>
          <Heading size="lg" color={headingColor} display="flex" alignItems="center">
            <Icon as={FaBrain} mr={3} color={accentColor} /> Soru Tekrar Seansı
          </Heading>
          <Button
            variant="ghost" // Daha yumuşak bir görünüm
            colorScheme="gray"
            onClick={() => navigate(srsData.srsReturnPath || '/digital-coach')}
            leftIcon={<Icon as={FiChevronLeft} boxSize={5}/>} // Modern ikon
            isDisabled={isSubmittingFeedback}
            color={textMutedColor}
            _hover={{color: accentColor, bg: useColorModeValue("gray.100", "gray.700")}}
          >
            Seansa Dön
          </Button>
        </Flex>

        <Card variant="outline" bg={cardBg} borderColor={borderColor} boxShadow="xl" borderRadius="xl">
          <CardBody p={{ base: 4, md: 6 }}>
            <HStack spacing={3} wrap="wrap" fontSize="sm" color={textMutedColor} mb={4}>
              <Tag size="md" variant='solid' colorScheme="blue" borderRadius="full">Konu: {currentQuestion.topic?.name || 'Genel'}</Tag>
              <Tag size="md" variant='solid' colorScheme="purple" borderRadius="full">Tip: {currentQuestion.classification || '-'}</Tag>
              {srsData.entry?.boxNumber && <Tag size="md" variant='solid' colorScheme='yellow' borderRadius="full">Kutu: {srsData.entry.boxNumber}</Tag>}
            </HStack>
            <Divider my={4} borderColor={borderColor}/>
            {currentQuestion.imageUrl && (
              <Center mb={5} p={3} borderWidth="1px" borderColor={borderColor} borderRadius="lg" bg={useColorModeValue("gray.50", "gray.700")}>
                <Image src={API_BASE_URL + currentQuestion.imageUrl} alt="Soru Görseli" borderRadius="md" maxW="100%" maxH={{base:"250px", md:"350px"}} objectFit="contain" />
              </Center>
            )}
            <Box minH="60px" color={textColor} fontSize={{base:"md", md:"lg"}} lineHeight="tall"
                 dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentQuestion.text) }}
                 sx={{ p:{my:3}, ul:{my:3, ml:5}, ol:{my:3,ml:5}, img: {maxW:"100%", my:3, borderRadius:"lg", boxShadow:"md"} }}
            />
          </CardBody>
        </Card>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
  {['A', 'B', 'C', 'D', 'E'].map(opt => {
    const optionText = currentQuestion[`option${opt}`];
    if (!optionText) return null;

    const isSelected = selectedAnswer === opt;
    const isActuallyCorrect = opt === currentQuestion.correctAnswer;
    const isIncorrectSelected = isSelected && !isActuallyCorrect;
    const isCorrectAnswer = isActuallyCorrect;

    let optionColorScheme = 'gray';
    let optionBoxShadow = 'md';
    let optionTransform = 'none';
    let optionLeftIcon = undefined;
    let optionBg = cardBg;
    let optionSx = { transition: "all 0.2s ease-in-out" };

    if (isAnswerChecked) {
      optionSx.cursor = "not-allowed";

      if (isActuallyCorrect) {
        optionColorScheme = 'green';
        optionLeftIcon = <Icon as={FiCheckCircle} />;
        optionBoxShadow = "lg";
        optionBg = useColorModeValue("green.50", "green.800");
      } else if (isIncorrectSelected) {
        optionColorScheme = 'red';
        optionLeftIcon = <Icon as={FiXCircle} />;
        optionBoxShadow = "lg";
        optionBg = useColorModeValue("red.50", "red.800");
      } else {
        optionBoxShadow = "sm";
        optionBg = useColorModeValue("gray.50", "gray.600");
      }
    } else if (isSelected) {
      optionColorScheme = 'yellow';
      optionTransform = "scale(1.02)";
      optionBoxShadow = "xl";
      optionBg = useColorModeValue("yellow.50", "yellow.700");
    }

    return (
      <Button
        key={opt}
        variant={isAnswerChecked && (isCorrectAnswer || isIncorrectSelected) ? 'solid' : 'outline'}
        colorScheme={optionColorScheme}
        onClick={() => handleSelectOption(opt)}
        isDisabled={isAnswerChecked}
        w="100%" h="auto" minH="60px" py={4} px={5}
        justifyContent="flex-start" textAlign="left" whiteSpace="normal"
        borderRadius="lg" boxShadow={optionBoxShadow} transform={optionTransform}
        bg={optionBg}
        borderColor={isAnswerChecked && (isCorrectAnswer || isIncorrectSelected) ? `${optionColorScheme}.500` : borderColor}
        color={isAnswerChecked && (isCorrectAnswer || isIncorrectSelected) ? useColorModeValue("white", "gray.900") : textColor}
        _hover={{ boxShadow: "xl", transform: isAnswerChecked ? optionTransform : "translateY(-2px) scale(1.01)" }}
        transition="all 0.2s ease-out"
        leftIcon={optionLeftIcon}
        sx={optionSx}
      >
        <Text as="span" fontWeight="bold" mr={2}>{opt})</Text>
        <Text as="span" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(optionText) }} />
      </Button>
    );
  })}
</SimpleGrid>
        

        {!isAnswerChecked && (
          <Button
            colorScheme="brand"
            onClick={handleCheckAnswer}
            isDisabled={!selectedAnswer}
            size="lg"
            w="full"
            py={7}
            leftIcon={<Icon as={FaCheckCircleSolid} />}
            borderRadius="lg" boxShadow="lg" _hover={{boxShadow:"xl"}}
          >
            Cevabımı Kontrol Et
          </Button>
        )}

        {isAnswerChecked && (
          <VStack spacing={5} mt={6} p={6} bg={cardBg} borderRadius="xl" boxShadow="lg" borderColor={borderColor} borderWidth="1px">
            <Text fontWeight="bold" fontSize="2xl" color={isCorrect ? 'green.400' : 'red.400'}>
              <Icon as={isCorrect ? FiCheckCircle : FiXCircle} mr={2} verticalAlign="middle" boxSize={6} />
              {isCorrect ? 'DOĞRU!' : `YANLIŞ! (Doğru Cevap: ${currentQuestion.correctAnswer})`}
            </Text>

            {currentQuestion.explanation && (
              <Button variant="ghost" colorScheme="blue" size="md" onClick={toggleExplanation} leftIcon={<Icon as={FaLightbulb}/>} mt={2} mb={2} borderRadius="full">
                {showExplanation ? 'Açıklamayı Gizle' : 'Açıklamayı Göster'}
              </Button>
            )}
            <Collapse in={showExplanation && currentQuestion.explanation} animateOpacity style={{width: '100%'}}>
              <Box p={5} borderWidth="1px" borderRadius="lg" borderColor={explanationBorderColor} bg={explanationBg} boxShadow="inner">
                <Heading size="sm" mb={3} color={explanationHeadingColor}>Açıklama:</Heading>
                <Box color={useColorModeValue("blue.800", "blue.100")} fontSize="md" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentQuestion.explanation) }}
                     sx={{ p:{my:2}, ul:{my:2, ml:4}, ol:{my:2,ml:4}, img: {maxW:"100%", my:2, borderRadius:"md"} }}/>
              </Box>
            </Collapse>

            <Divider my={4} borderColor={borderColor} />

            <Heading size="lg" mt={4} mb={3} color={headingColor} fontWeight="semibold">Bu Tekrarı Değerlendir:</Heading>
            <HStack spacing={6} w="full" justifyContent="center">
              <Button
                bg={useColorModeValue("red.500", "red.400")}
                color="white"
                _hover={{bg: useColorModeValue("red.600", "red.500")}}
                onClick={() => handleSrsFeedback(false)}
                isLoading={isSubmittingFeedback}
                size="lg" minW={{base:"160px", md:"200px"}} py={7}
                leftIcon={<Icon as={FiXCircle} boxSize={5}/>}
                borderRadius="lg" boxShadow="lg"
              >
                Zorlandım
              </Button>
              <Button
                bg={useColorModeValue("green.500", "green.400")}
                color="white"
                _hover={{bg: useColorModeValue("green.600", "green.500")}}
                onClick={() => handleSrsFeedback(true)}
                isLoading={isSubmittingFeedback}
                size="lg" minW={{base:"160px", md:"200px"}} py={7}
                leftIcon={<Icon as={FiCheckCircle} boxSize={5}/>}
                borderRadius="lg" boxShadow="lg"
              >
                Kolaydı
              </Button>
            </HStack>
          </VStack>
        )}
      </VStack>
    </Container>
  );
}

export default SRSQuestionReviewPage;
