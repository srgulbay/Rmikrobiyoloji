import React from 'react';
import DOMPurify from 'dompurify';
import {
  Box, Container, Flex, Button, IconButton, Heading, Text, SimpleGrid,
  Card, CardBody, Image, Icon, HStack, Tag, Divider, Collapse, Progress,
  useColorModeValue
} from '@chakra-ui/react';
import { 
    FaArrowLeft, FaArrowRight, FaCheck, FaFlagCheckered, FaLightbulb, 
    FaQuestion, FaClock, FaStopwatch, FaPencilAlt
} from 'react-icons/fa';
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

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
  onSelectOption, // Bu prop SolvePage'den gelecek
  onCheckAnswer,
  onPrevQuestion,
  onNextQuestion,
  onFinishQuiz,
  onToggleExplanation,
  progressPercentage,
  API_BASE_URL,
  quizInfoBg,
  borderColor,
  headingColor,
  timerInfoColor,
  progressBarColor,
  cardBg,
  textMutedColor,
}) {
  const { 
    currentQuestionIndex, questions, currentQuestion, 
    selectedAnswer, isAnswerChecked, isCorrect, score, 
    timeElapsed, showExplanation, quizMode, 
    quizFixedDurationSeconds, quizTitle 
  } = quizState;

  const optionHoverBg = useColorModeValue("gray.100", "gray.600");
  const explanationBg = useColorModeValue("blue.50", "blue.900");
  const explanationBorderColor = useColorModeValue("blue.200", "blue.700");
  const explanationHeadingColor = useColorModeValue("blue.700", "blue.200");

  if (!currentQuestion) {
    return <Text>Aktif soru bulunmuyor veya yüklenemedi.</Text>;
  }

  return (
    <Container maxW="container.lg" py={6}>
      <Box p={4} bg={quizInfoBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor} mb={6} boxShadow="md">
        <Flex wrap="wrap" justify="space-between" align="center" gap={{base:2, md:4}} fontSize="sm">
            <Heading as="h3" size="md" m={0} color={headingColor} noOfLines={1} title={quizTitle}>
              {quizMode === 'deneme' ? <Icon as={FaStopwatch} mr={2} verticalAlign="middle"/> : <Icon as={FaPencilAlt} mr={2} verticalAlign="middle"/>}
              {quizTitle}
            </Heading>
            <HStack spacing={{base:2, md:4}} wrap="wrap" color={timerInfoColor}>
                <HStack><Icon as={FaQuestion} /> <Text>Soru: <Text as="span" fontWeight="bold" color={headingColor}>{currentQuestionIndex + 1} / {questions.length}</Text></Text></HStack>
                <HStack><Icon as={FiCheckCircle} color="green.500" /> <Text>Doğru: <Text as="span" fontWeight="bold" color={headingColor}>{score}</Text></Text></HStack>
                <HStack><Icon as={FaClock} /> 
                    <Text>
                        {quizMode === 'deneme' && quizFixedDurationSeconds != null ? 'Kalan Süre: ' : 'Geçen Süre: '}
                        <Text as="span" fontWeight="bold" color={headingColor}>{formatTime(timeElapsed)}</Text>
                    </Text>
                </HStack>
            </HStack>
        </Flex>
        {questions.length > 0 && <Progress value={progressPercentage} size="xs" colorScheme={progressBarColor} mt={3} borderRadius="sm" />}
      </Box>

      <Card variant="outline" my={6} bg={cardBg} boxShadow="md" borderRadius="xl">
        <CardBody p={{base:4, md:6}}>
          <HStack spacing={4} wrap="wrap" fontSize="xs" color={textMutedColor} mb={4}>
            <Tag size="sm" variant='subtle' colorScheme="blue">Konu: {currentQuestion.topic?.name || 'Genel'}</Tag>
            <Tag size="sm" variant='subtle' colorScheme="purple">Tip: {currentQuestion.classification || '-'}</Tag>
          </HStack>
          <Divider my={4} borderColor={borderColor}/>
          {currentQuestion.imageUrl && (
            <Center mb={4} p={2} borderWidth="1px" borderColor={borderColor} borderRadius="md">
              <Image className="question-image" src={API_BASE_URL + currentQuestion.imageUrl} alt={`Soru ${currentQuestionIndex + 1} için görsel`} borderRadius="md" maxW="100%" maxH="400px" objectFit="contain" loading="lazy" onError={(e) => e.target.style.display='none'}/>
            </Center>
          )}
          <Box className="question-text" minH="60px" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentQuestion.text) }}
            sx={{ p:{my:2}, ul:{my:2, ml:4}, ol:{my:2,ml:4}, img: {maxW:"100%", my:2, borderRadius:"md"} }}
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
          
          let variant = 'outline'; 
          let currentColorScheme = 'gray'; 
          let leftIcon = undefined; 
          let optionSx = { transition: "all 0.2s ease-in-out" }; // Yumuşak geçişler için
          
          if (isAnswerChecked) {
            optionSx.cursor = "not-allowed"; // Cevap kontrol edildikten sonra tıklamayı engelle
            if (isCorrectAnswer) { 
              variant = 'solid'; 
              currentColorScheme = 'green'; 
              leftIcon = <Icon as={FiCheckCircle} />; 
            } else if (isIncorrectSelected) { 
              variant = 'solid'; 
              currentColorScheme = 'red'; 
              leftIcon = <Icon as={FiXCircle} />; 
            } else { 
              variant = 'outline'; 
              optionSx.opacity = 0.65; 
              optionSx._hover = { bg: optionHoverBg };
            }
          } else if (isSelected) { 
            variant = 'solid'; 
            currentColorScheme = 'yellow';
            optionSx.transform = "scale(1.02)"; // Seçiliyken hafif büyütme
            optionSx.boxShadow = "md";
          } else {
            optionSx._hover = { bg: optionHoverBg, transform: "translateY(-2px)", boxShadow: "sm" };
          }
          
          return (
            <Button 
              key={opt} 
              variant={variant} 
              colorScheme={currentColorScheme} 
              onClick={() => {
                if (!isAnswerChecked) { // Sadece cevap kontrol edilmemişse çalışsın
                  onSelectOption(opt);
                }
              }} 
              isDisabled={isAnswerChecked} // Butonu cevap kontrol edildikten sonra deaktif et
              aria-pressed={isSelected} 
              w="100%" 
              h="auto" 
              minH="50px" 
              py={3} 
              px={4} 
              justifyContent="flex-start" 
              textAlign="left" 
              whiteSpace="normal" 
              sx={optionSx} 
              leftIcon={leftIcon}
            >
              <Text as="span" fontWeight="bold" mr={2}>{opt})</Text>
              <Text as="span" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(optionText) }} />
            </Button>
          );
        })}
      </SimpleGrid>
        
      {quizMode === 'practice' && isAnswerChecked && currentQuestion.explanation && (
        <Button variant="link" colorScheme="blue" size="sm" onClick={onToggleExplanation} leftIcon={<Icon as={FaLightbulb}/>} mb={4}>
          {showExplanation ? 'Açıklamayı Gizle' : 'Açıklamayı Göster'}
        </Button>
      )}
      {quizMode === 'practice' && (
        <Collapse in={showExplanation && isAnswerChecked && !!currentQuestion.explanation} animateOpacity>
            <Box p={4} mt={0} borderWidth="1px" borderRadius="md" borderColor={explanationBorderColor} bg={explanationBg} mb={6}>
                <Heading size="sm" mb={2} color={explanationHeadingColor}>Açıklama:</Heading>
                <Box dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentQuestion.explanation) }} 
                     sx={{ p:{my:2}, ul:{my:2, ml:4}, ol:{my:2,ml:4}, img: {maxW:"100%", my:2, borderRadius:"md"}, color: useColorModeValue("gray.700", "gray.200") }}/>
            </Box>
        </Collapse>
      )}

      <Flex justify="space-between" align="center" wrap="wrap" gap={3} p={5} bg={quizInfoBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor} mt={6} boxShadow="sm">
        <IconButton icon={<Icon as={FaArrowLeft} />} onClick={onPrevQuestion} 
            isDisabled={currentQuestionIndex === 0 || (quizMode === 'deneme')}
            aria-label={quizMode === 'deneme' ? "Denemede önceki soruya dönülemez" : "Önceki Soru"} 
            title={quizMode === 'deneme' ? "Denemede önceki soruya dönülemez" : "Önceki Soru"} 
            variant="ghost"/>
        <HStack flex="1" justifyContent="center" spacing={4}>
          {!isAnswerChecked ? (
            <Button colorScheme="brand" onClick={onCheckAnswer} isDisabled={!selectedAnswer} aria-label="Cevabı Kontrol Et" leftIcon={<Icon as={FaCheck} />}>Kontrol Et</Button>
          ) : (
            <Text fontWeight="bold" color={isCorrect ? 'green.500' : 'red.500'} fontSize="lg">
              <Icon as={isCorrect ? FiCheckCircle : FiXCircle} mr={2} verticalAlign="middle" />
              {isCorrect ? 'Doğru!' : `Yanlış (Doğru: ${currentQuestion.correctAnswer})`}
            </Text>
          )}
        </HStack>
        {currentQuestionIndex < questions.length - 1 ? (
          <IconButton icon={<Icon as={FaArrowRight} />} onClick={onNextQuestion} 
            isDisabled={!isAnswerChecked && quizMode === 'practice'} 
            aria-label="Sonraki Soru" title="Sonraki Soru" variant="ghost" />
        ) : (
          <Button colorScheme="green" onClick={onFinishQuiz} isDisabled={!isAnswerChecked} aria-label="Testi Bitir" title="Testi Bitir" leftIcon={<Icon as={FaFlagCheckered} />}>Testi Bitir</Button>
        )}
      </Flex>
    </Container>
  );
}

export default QuizActiveInterface;
