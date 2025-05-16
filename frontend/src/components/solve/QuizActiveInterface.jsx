import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  Box, Container, Flex, Button, IconButton, Heading, Text, SimpleGrid,
  Card, CardBody, Image, Icon, HStack, Tag, Divider, Collapse, Progress,
  useColorModeValue, useToast, Center
} from '@chakra-ui/react';
import {
    FaArrowLeft, FaArrowRight, FaCheck, FaFlagCheckered, FaLightbulb,
    FaQuestion, FaClock, FaStopwatch, FaPencilAlt, FaBrain, FaPlusCircle, FaCheckCircle as FaCheckCircleSolid
} from 'react-icons/fa';
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const formatTime = totalSeconds => {
    if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

function QuizActiveInterface({
  quizState,
  onSelectOption,
  onCheckAnswer,
  onPrevQuestion,
  onNextQuestion,
  onFinishQuiz,
  onToggleExplanation,
  progressPercentage,
  // Stil propları artık bileşen içinde useColorModeValue ile alınacak
}) {
  const { token } = useAuth();
  const toast = useToast();
  const [isAddingToSrs, setIsAddingToSrs] = useState(false);
  const [isAddedToSrs, setIsAddedToSrs] = useState(false);

  const {
    currentQuestionIndex, questions, currentQuestion,
    selectedAnswer, isAnswerChecked, isCorrect, score,
    timeElapsed, showExplanation, quizMode,
    quizFixedDurationSeconds, quizTitle, isSrsMode, boxNumber
  } = quizState;

  // Layout ile tutarlı stil değişkenleri
  const mainBg = useColorModeValue('gray.100', 'gray.900'); // Ana sayfa arkaplanı gibi
  const cardBg = useColorModeValue('white', 'gray.800'); // Kartlar için Layout'taki header gibi
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const textMutedColor = useColorModeValue('gray.500', 'gray.400');
  const accentColor = useColorModeValue('brand.500', 'brand.300');
  const progressBarColorScheme = 'brand'; // Temanızdaki brand rengi

  const quizInfoBgResolved = useColorModeValue("white", "gray.800"); // quizInfoBg prop'u yerine
  const timerInfoColorResolved = textMutedColor; // timerInfoColor prop'u yerine
  const cardBgResolved = useColorModeValue("white", "gray.750"); // cardBg prop'u yerine
  const textMutedColorResolved = textMutedColor; // textMutedColor prop'u yerine


  const optionHoverBg = useColorModeValue('gray.100', 'gray.600');
  const explanationBg = useColorModeValue('blue.50', 'rgba(49, 130, 206, 0.15)'); // Hafif alpha
  const explanationBorderColor = useColorModeValue('blue.200', 'blue.700');
  const explanationHeadingColor = useColorModeValue('blue.700', 'blue.200');

  useEffect(() => {
    setIsAddedToSrs(false);
  }, [currentQuestion]);

  if (!currentQuestion) {
    // Daha iyi bir yükleme/hata durumu için SolvePage'e bırakılabilir
    return <Center py={10}><Text color={textColor}>Aktif soru bulunmuyor veya yüklenemedi.</Text></Center>;
  }

  const handleAddToSRS = async () => {
    if (!currentQuestion || !token) {
      toast({ title: "Hata", description: "Soru bilgisi veya yetkilendirme eksik.", status: "error", duration: 3000 });
      return;
    }
    setIsAddingToSrs(true);
    try {
      const payload = {
        itemId: currentQuestion.id,
        itemType: 'question',
      };
      if (currentQuestion.examClassificationId) {
        // payload.examClassificationId = currentQuestion.examClassificationId;
      }
      await axios.post(`${API_BASE_URL}/api/srs/add-item`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: "Başarılı!",
        description: "Soru başarıyla Dijital Antrenör'e eklendi/güncellendi.",
        status: "success",
        duration: 3000,
      });
      setIsAddedToSrs(true);
    } catch (err) {
      toast({
        title: "Ekleme Başarısız",
        description: err.response?.data?.message || "Soru Antrenöre eklenirken bir sorun oluştu.",
        status: "error",
        duration: 4000,
      });
    } finally {
      setIsAddingToSrs(false);
    }
  };

  const showNavigationButtons = !isSrsMode;
  const showFinishButton = !isSrsMode && (currentQuestionIndex >= questions.length - 1);
  const showNextButton = !isSrsMode && (currentQuestionIndex < questions.length - 1);
  const canShowExplanationButton = (quizMode === 'practice' || quizMode === 'srs_practice') && isAnswerChecked && currentQuestion.explanation;
  const canAddToSrs = isAnswerChecked && !isSrsMode;

  return (
    <Container maxW="container.xl" py={{base: 4, md: 6}}> {/* Ana container için padding */}
      <Box 
        p={{base:3, md:4}} 
        bg={quizInfoBgResolved} 
        borderRadius="xl" // Daha yuvarlak köşeler
        borderWidth="1px" 
        borderColor={borderColor} 
        mb={6} 
        boxShadow="lg" // Belirgin gölge
      >
        <Flex wrap="wrap" justify="space-between" align="center" gap={{base:2, md:4}} fontSize="sm">
            <Heading as="h3" size="md" m={0} color={headingColor} noOfLines={1} title={quizTitle}>
              <Icon 
                as={isSrsMode ? FaBrain : (quizMode === 'deneme' ? FaStopwatch : FaPencilAlt)} 
                mr={2} 
                verticalAlign="middle" 
                color={accentColor} // Vurgu rengi
              />
              {quizTitle}
            </Heading>
            <HStack spacing={{base:3, md:4}} wrap="wrap" color={timerInfoColorResolved}>
                {!isSrsMode && (
                  <>
                    <HStack><Icon as={FaQuestion} /> <Text>Soru: <Text as="span" fontWeight="bold" color={headingColor}>{currentQuestionIndex + 1} / {questions.length}</Text></Text></HStack>
                    <HStack><Icon as={FiCheckCircle} color="green.400" /> <Text>Doğru: <Text as="span" fontWeight="bold" color={headingColor}>{score}</Text></Text></HStack>
                  </>
                )}
                <HStack><Icon as={FaClock} /> 
                    <Text>
                        {(quizMode === 'deneme' && !isSrsMode && quizFixedDurationSeconds != null) ? 'Kalan Süre: ' : 'Geçen Süre: '}
                        <Text as="span" fontWeight="bold" color={headingColor}>{formatTime(timeElapsed)}</Text>
                    </Text>
                </HStack>
            </HStack>
        </Flex>
        {(questions.length > 0 && !isSrsMode) && 
            <Progress value={progressPercentage} size="xs" colorScheme={progressBarColorScheme} mt={4} borderRadius="full" bg={useColorModeValue("gray.200", "gray.600")} />}
        {isSrsMode && 
            <Progress value={isAnswerChecked? 100: 50} size="xs" colorScheme={progressBarColorScheme} mt={4} borderRadius="full" bg={useColorModeValue("gray.200", "gray.600")} />}
      </Box>

      <Card variant="outline" my={6} bg={cardBgResolved} boxShadow="xl" borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
        <CardBody p={{base:4, md:6}}>
          <Flex justifyContent="space-between" alignItems="flex-start" wrap="wrap" fontSize="xs" color={textMutedColorResolved} mb={4} gap={2}>
            <HStack spacing={3} wrap="wrap">
                <Tag size="sm" variant='solid' colorScheme="blue" borderRadius="full">{currentQuestion.topic?.name || 'Genel'}</Tag>
                <Tag size="sm" variant='solid' colorScheme="purple" borderRadius="full">{currentQuestion.classification || '-'}</Tag>
                {isSrsMode && boxNumber && <Tag size="sm" variant='solid' colorScheme='yellow' borderRadius="full">Kutu: {boxNumber}</Tag>}
            </HStack>
            {canAddToSrs && (
                <Button
                    size="xs"
                    colorScheme={isAddedToSrs ? "green" : "teal"}
                    variant={isAddedToSrs ? "solid" : "outline"}
                    leftIcon={<Icon as={isAddedToSrs ? FaCheckCircleSolid : FaPlusCircle} />}
                    onClick={handleAddToSRS}
                    isLoading={isAddingToSrs}
                    isDisabled={isAddedToSrs}
                    borderRadius="full"
                >
                    {isAddedToSrs ? "Antrenörde" : "Antrenöre Ekle"}
                </Button>
            )}
          </Flex>
          <Divider my={4} borderColor={borderColor}/>
          {currentQuestion.imageUrl && (
            <Center mb={4} p={2} borderWidth="1px" borderColor={borderColor} borderRadius="lg" bg={useColorModeValue("gray.50", "gray.700")}>
              <Image src={API_BASE_URL + currentQuestion.imageUrl} alt={`Soru ${currentQuestionIndex + 1} için görsel`} borderRadius="md" maxW="100%" maxH="350px" objectFit="contain" loading="lazy" onError={(e) => e.target.style.display='none'}/>
            </Center>
          )}
          <Box className="question-text" color={textColor} minH="60px" fontSize={{base:"md", md:"lg"}} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentQuestion.text) }}
            sx={{ p:{my:3}, ul:{my:3, ml:5}, ol:{my:3,ml:5}, img: {maxW:"100%", my:3, borderRadius:"lg", boxShadow:"md"} }}
          />
        </CardBody>
      </Card>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
        {['A', 'B', 'C', 'D', 'E'].map(opt => {
          const optionText = currentQuestion[`option${opt}`];
          if (!optionText) return null;
          const isSelected = selectedAnswer === opt;
          const isCorrectAnswer = opt === currentQuestion.correctAnswer;
          const isIncorrectSelected = isSelected && !isCorrectAnswer;
          let optionColorScheme = 'gray';
          let optionBoxShadow = 'md';
          let optionTransform = 'none';
          let optionLeftIcon = undefined;

          if (isAnswerChecked) {
            if (isCorrectAnswer) { optionColorScheme = 'green'; optionLeftIcon = <Icon as={FiCheckCircle} />; optionBoxShadow="lg"; }
            else if (isIncorrectSelected) { optionColorScheme = 'red'; optionLeftIcon = <Icon as={FiXCircle} />; optionBoxShadow="lg"; }
            else { optionBoxShadow="sm"; }
          } else if (isSelected) {
            optionColorScheme = 'yellow'; optionTransform="scale(1.02)"; optionBoxShadow="xl";
          }
          return (
            <Button key={opt} variant={isAnswerChecked && (isCorrectAnswer || isIncorrectSelected) ? 'solid' : 'outline'} 
              colorScheme={optionColorScheme} onClick={() => { if (!isAnswerChecked) { onSelectOption(opt); }}}
              isDisabled={isAnswerChecked} w="100%" h="auto" minH="55px" py={3} px={4}
              justifyContent="flex-start" textAlign="left" whiteSpace="normal" 
              borderRadius="lg" boxShadow={optionBoxShadow} transform={optionTransform}
              _hover={{boxShadow: "xl", transform: isAnswerChecked ? optionTransform : "translateY(-2px) scale(1.01)"}}
              transition="all 0.2s ease-out"
              leftIcon={optionLeftIcon}
              bg={isAnswerChecked && (isCorrectAnswer || isIncorrectSelected) ? undefined : cardBg} // Cevap kontrol edilince renkler scheme'den gelsin
            >
              <Text as="span" fontWeight="bold" mr={2}>{opt})</Text>
              <Text as="span" color={textColor} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(optionText) }} />
            </Button>
          );
        })}
      </SimpleGrid>

      {canShowExplanationButton && (
        <Flex justifyContent="center" mb={4}>
            <Button variant="outline" colorScheme="blue" size="sm" onClick={onToggleExplanation} leftIcon={<Icon as={FaLightbulb}/>} borderRadius="full">
            {showExplanation ? 'Açıklamayı Gizle' : 'Açıklamayı Göster'}
            </Button>
        </Flex>
      )}
      <Collapse in={showExplanation && isAnswerChecked && !!currentQuestion.explanation && (quizMode === 'practice' || quizMode === 'srs_practice')} animateOpacity>
            <Box p={5} borderWidth="1px" borderRadius="xl" borderColor={explanationBorderColor} bg={explanationBg} mb={6} boxShadow="md">
                <Heading size="sm" mb={3} color={explanationHeadingColor}>Açıklama:</Heading>
                <Box color={useColorModeValue("blue.800", "blue.100")} fontSize="md" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentQuestion.explanation) }}
                     sx={{ p:{my:2}, ul:{my:2, ml:4}, ol:{my:2,ml:4}, img: {maxW:"100%", my:2, borderRadius:"md"} }}/>
            </Box>
        </Collapse>

      <Flex 
        justify="space-between" align="center" wrap="wrap" gap={3} 
        p={{base:3, md:4}} bg={quizInfoBgResolved} borderRadius="xl" 
        borderWidth="1px" borderColor={borderColor} mt={8} boxShadow="lg"
      >
        {showNavigationButtons && (
            <IconButton icon={<Icon as={FaArrowLeft} />} onClick={onPrevQuestion}
                isDisabled={currentQuestionIndex === 0 || (quizMode === 'deneme')}
                aria-label={quizMode === 'deneme' ? "Denemede önceki soruya dönülemez" : "Önceki Soru"}
                title={quizMode === 'deneme' ? "Denemede önceki soruya dönülemez" : "Önceki Soru"}
                variant="ghost" size="lg" borderRadius="full"/>
        )}
        {!showNavigationButtons && <Box w={{base:"30px", md:"40px"}} /> }

        <HStack flex="1" justifyContent="center" spacing={4}>
          {!isAnswerChecked ? (
            <Button 
                colorScheme="brand" 
                onClick={onCheckAnswer} 
                isDisabled={!selectedAnswer} 
                aria-label="Cevabı Kontrol Et" 
                leftIcon={<Icon as={FaCheck} />}
                size="lg" px={8} py={6} borderRadius="lg" boxShadow="md"
                _hover={{boxShadow:"xl", transform:"translateY(-1px)"}}
            >
              {isSrsMode ? "Cevabımı Değerlendir" : "Kontrol Et"}
            </Button>
          ) : (
            <Text fontWeight="bold" color={isCorrect ? 'green.400' : 'red.400'} fontSize="xl" p={2} bg={useColorModeValue("white", "gray.700")} borderRadius="md" boxShadow="inner">
              <Icon as={isCorrect ? FiCheckCircle : FiXCircle} mr={2} verticalAlign="middle" />
              {isCorrect ? 'DOĞRU!' : `YANLIŞ! (Doğru: ${currentQuestion.correctAnswer})`}
            </Text>
          )}
        </HStack>

        {showNextButton && (
          <IconButton icon={<Icon as={FaArrowRight} />} onClick={onNextQuestion}
            isDisabled={!isAnswerChecked && (quizMode === 'practice' || quizMode === 'srs_practice')} // SRS modunda da cevap kontrol edilmeden geçilemesin
            aria-label="Sonraki Soru" title="Sonraki Soru" variant="ghost" size="lg" borderRadius="full"/>
        )}
        {showFinishButton && (
          <Button colorScheme="green" onClick={onFinishQuiz} 
            isDisabled={!isAnswerChecked} // Cevap kontrol edilmeden bitirilemesin
            aria-label="Testi Bitir" title="Testi Bitir" leftIcon={<Icon as={FaFlagCheckered} />}
            size="lg" px={8} py={6} borderRadius="lg" boxShadow="md"
            _hover={{boxShadow:"xl", transform:"translateY(-1px)"}}
          >
            Testi Bitir
          </Button>
        )}
        {!showNextButton && !showFinishButton && <Box w={{base:"30px", md:"40px"}} /> }
      </Flex>
    </Container>
  );
}

export default QuizActiveInterface;
