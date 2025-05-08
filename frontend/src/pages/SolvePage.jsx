import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '@chakra-ui/react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Flex,
  Button,
  IconButton,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  Image,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Icon,
  Skeleton,
  SkeletonText,
  Stat,
  StatLabel,
  StatNumber,
  HStack,
  VStack,
  Center,
  Tag,
  useToast,
  List, ListItem,
  Divider,
  Collapse
} from '@chakra-ui/react';
import { FaArrowLeft, FaArrowRight, FaCheck, FaFlagCheckered, FaRedo, FaExclamationTriangle, FaInfoCircle, FaLightbulb } from 'react-icons/fa';
import { FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const formatTime = totalSeconds => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

function SolvePage() {
    const [allQuestions, setAllQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();
    const [score, setScore] = useState(0);
    const [isQuizFinished, setIsQuizFinished] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0); // Toplam süre
    const [questionStartTime, setQuestionStartTime] = useState(null); // Soru başlama zamanı
    const timerRef = useRef(null); // Toplam süre için timer ref
    const [questionStatsMap, setQuestionStatsMap] = useState({});
    const { colorMode } = useColorMode();
    const location = useLocation();
    const toast = useToast();
    const [showExplanation, setShowExplanation] = useState(false);

    const urls = {
        questions: `${API_BASE_URL}/api/questions`,
        attempts:  `${API_BASE_URL}/api/attempts`,
        stats:     `${API_BASE_URL}/api/stats/questions`
    };

     const initializeQuiz = useCallback(async () => {
        setLoading(true); setError(''); setScore(0);
        setIsQuizFinished(false); setSelectedAnswer(''); setIsAnswerChecked(false);
        setIsCorrect(null); setTimeElapsed(0); setQuestionStatsMap({});
        setShowExplanation(false);
        setQuestionStartTime(null); // Başlangıç zamanını sıfırla
        clearInterval(timerRef.current);
        timerRef.current = null;

        if (!token) { setError('Soruları çözebilmek için giriş yapmalısınız.'); setLoading(false); return; }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const queryParams = new URLSearchParams(location.search);
            const topicIdFilter = queryParams.get('topicId');
            let questionsUrl = urls.questions;
            if (topicIdFilter) { questionsUrl += `?topicId=${topicIdFilter}`; }

            const [qRes, sRes] = await Promise.all([
                axios.get(questionsUrl, config),
                axios.get(urls.stats, config)
            ]);

            const questionsData = Array.isArray(qRes.data) ? qRes.data : [];
            if (questionsData.length) {
                const finalQuestions = topicIdFilter ? questionsData : [...questionsData].sort(() => Math.random() - 0.5);
                setAllQuestions(finalQuestions);
                setCurrentQuestion(finalQuestions[0]);
                setQuestionStatsMap(typeof sRes.data === 'object' && sRes.data !== null ? sRes.data : {});
                setTimeElapsed(0);
                // setQuestionStartTime(Date.now()); // İlk soru için başlangıç zamanı (useEffect içinde yapılacak)
            } else {
                setError(topicIdFilter ? 'Bu konuya ait soru bulunamadı.' : 'Uygun soru bulunamadı.');
                setAllQuestions([]); setCurrentQuestion(null);
            }
        } catch (err) {
            console.error("Quiz verisi çekilirken hata:", err);
            setError('Sorular veya istatistikler yüklenirken bir hata oluştu.');
             setAllQuestions([]); setCurrentQuestion(null);
        } finally { setLoading(false); }
    }, [token, urls.questions, urls.stats, location.search]);

    useEffect(() => { initializeQuiz(); return () => { clearInterval(timerRef.current); timerRef.current = null; }; }, [initializeQuiz]);

    // Toplam süreyi takip eden useEffect
    useEffect(() => {
        if (!loading && allQuestions.length > 0 && !isQuizFinished) {
            if (!timerRef.current) { timerRef.current = setInterval(() => { setTimeElapsed(t => t + 1); }, 1000); }
        } else { clearInterval(timerRef.current); timerRef.current = null; }
         return () => { clearInterval(timerRef.current); timerRef.current = null; };
    }, [loading, allQuestions, isQuizFinished]);

    // Soru değiştiğinde başlangıç zamanını ayarlayan useEffect
     useEffect(() => {
        if (currentQuestion && !isQuizFinished && !isAnswerChecked) {
            setQuestionStartTime(Date.now());
        }
     }, [currentQuestion, isQuizFinished, isAnswerChecked]);

    const selectOption = useCallback((opt) => { if (!isAnswerChecked) setSelectedAnswer(opt); }, [isAnswerChecked]);

    // Cevabı kontrol et ve süreyi gönder
    const checkAnswer = useCallback(async () => {
        if (!selectedAnswer || !currentQuestion) return;

        const endTime = Date.now();
        // Geçen süreyi saniye cinsinden hesapla (negatif olamaz)
        const timeDiffSeconds = questionStartTime ? Math.max(0, Math.round((endTime - questionStartTime) / 1000)) : null;

        const correct = selectedAnswer === currentQuestion.correctAnswer;
        setIsAnswerChecked(true);
        setIsCorrect(correct);
        if (correct) setScore(s => s + 1);

        // Sonraki hesaplamalar için başlangıç zamanını sıfırla
        setQuestionStartTime(null);

        if (token) {
            try {
                 await axios.post(
                    urls.attempts,
                    {
                        questionId: currentQuestion.id,
                        selectedAnswer,
                        isCorrect: correct,
                        timeTaken: timeDiffSeconds // Hesaplanan süreyi gönder
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
             } catch (err) { console.error("Deneme kaydedilirken hata:", err); }
        }
    }, [selectedAnswer, currentQuestion, token, urls.attempts, questionStartTime]); // questionStartTime bağımlılıklara eklendi

    // Soru değiştirirken state'leri sıfırla
    const goTo = useCallback((index) => {
        if (index < 0 || index >= allQuestions.length) return;
        setCurrentQuestion(allQuestions[index]);
        setCurrentQuestionIndex(index);
        setSelectedAnswer(''); setIsAnswerChecked(false); setIsCorrect(null); setError('');
        setShowExplanation(false);
        // setQuestionStartTime(Date.now()); // Yeni soru geldiğinde useEffect tetiklenip ayarlayacak
    }, [allQuestions]);

    const prev = useCallback(() => goTo(currentQuestionIndex - 1), [goTo, currentQuestionIndex]);
    const next = useCallback(() => goTo(currentQuestionIndex + 1), [goTo, currentQuestionIndex]);

     const finish = useCallback(() => {
        if (window.confirm('Testi bitirmek istediğinizden emin misiniz?')) {
            setIsQuizFinished(true);
            clearInterval(timerRef.current); timerRef.current = null;
        }
    }, []);

    const toggleExplanation = () => setShowExplanation(prev => !prev);

    const currentQStats = useMemo(() => questionStatsMap[currentQuestion?.id], [questionStatsMap, currentQuestion]);

    if (loading) {
         return (
             <Container maxW="container.lg" py={8}>
                 <Skeleton height="50px" mb={6} borderRadius="md" />
                 <Skeleton height="250px" mb={6} borderRadius="lg" />
                 <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
                     {[...Array(5)].map((_, i) => ( <Skeleton key={i} height="50px" borderRadius="md" /> ))}
                 </SimpleGrid>
                 <Skeleton height="60px" borderRadius="md" />
             </Container>
         );
     }

    if (error && !currentQuestion) {
         return (
             <Container maxW="container.lg" mt={6}>
                 <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={10} borderRadius="lg">
                     <AlertIcon boxSize="40px" mr={0} as={FaExclamationTriangle}/>
                     <AlertTitle mt={4} mb={1} fontSize="xl">Hata!</AlertTitle>
                     <AlertDescription maxWidth="sm" mb={5}>{error}</AlertDescription>
                     <Button colorScheme="red" variant="outline" onClick={initializeQuiz} leftIcon={<Icon as={FaRedo} />}>
                         Tekrar Dene
                     </Button>
                 </Alert>
             </Container>
         );
     }

    if (isQuizFinished) {
         const accuracy = allQuestions.length > 0 ? ((score / allQuestions.length) * 100).toFixed(0) : 0;
         const accuracyColorScheme = accuracy >= 80 ? 'green' : accuracy >= 50 ? 'yellow' : 'red';
         return (
              <Container maxW="container.sm" centerContent py={10}>
                  <Card textAlign="center" p={8} variant="outline" w="full">
                      <CardBody>
                          <Heading as="h2" size="2xl" mb={4} color="accent">Test Tamamlandı!</Heading>
                          <List spacing={3} my={6} py={5} borderTopWidth="1px" borderBottomWidth="1px" borderColor="borderSecondary" textAlign="left">
                             <ListItem display="flex" justifyContent="space-between">
                                 <Text as="span" color="textSecondary">Geçen Süre:</Text>
                                 <Text as="span" fontWeight="semibold">{formatTime(timeElapsed)}</Text>
                             </ListItem>
                             <ListItem display="flex" justifyContent="space-between">
                                 <Text as="span" color="textSecondary">Toplam Soru:</Text>
                                 <Text as="span" fontWeight="semibold">{allQuestions.length}</Text>
                             </ListItem>
                             <ListItem display="flex" justifyContent="space-between">
                                  <Text as="span" color="textSecondary">Doğru Cevap:</Text>
                                  <Text as="span" fontWeight="semibold">{score}</Text>
                             </ListItem>
                          </List>
                         <Text fontSize="lg" fontWeight="semibold" mb={1}>Başarı Oranınız:</Text>
                         <Text fontSize="5xl" fontWeight="bold" color={`${accuracyColorScheme}.500`} my={4}>
                             %{accuracy}
                         </Text>
                         <Button colorScheme="brand" size="lg" onClick={initializeQuiz} leftIcon={<Icon as={FaRedo} />} mt={6}>
                              Yeniden Başla
                          </Button>
                      </CardBody>
                  </Card>
              </Container>
         );
     }

    if (!currentQuestion) {
          return (
              <Container maxW="container.lg" mt={6}>
                  <Alert status="info" variant="subtle" borderRadius="lg" py={6} flexDirection="column" alignItems="center" justifyContent="center" textAlign="center">
                     <AlertIcon boxSize="30px" mr={0} as={FaInfoCircle}/>
                     <AlertDescription mt={4} maxWidth="md">
                          Gösterilecek soru bulunamadı. Lütfen tekrar deneyin veya farklı bir konu seçin.
                     </AlertDescription>
                     <Button colorScheme="blue" variant="outline" onClick={initializeQuiz} mt={4} leftIcon={<Icon as={FaRedo} />}>
                         Tekrar Dene
                     </Button>
                 </Alert>
             </Container>
         );
     }

    return (
        <Container maxW="container.lg" py={6}>
            <Flex wrap="wrap" justify="space-between" align="center" gap={4} p={4} bg="bgSecondary" borderRadius="md" borderWidth="1px" borderColor="borderPrimary" mb={6} fontSize="sm">
                <Heading as="h3" size="md" m={0}>Soru {currentQuestionIndex + 1} / {allQuestions.length}</Heading>
                <HStack spacing={4} wrap="wrap">
                    <HStack><Icon as={FiCheckCircle} color="green.500" /> <Text>Doğru: <Text as="span" fontWeight="bold" color="textPrimary">{score}</Text></Text></HStack>
                    <HStack><Icon as={FiClock} color="textMuted" /> <Text>Süre: <Text as="span" fontWeight="bold" color="textPrimary">{formatTime(timeElapsed)}</Text></Text></HStack>
                </HStack>
            </Flex>

            <Card variant="outline" my={6} bg="bgPrimary">
                <CardBody>
                    <HStack spacing={4} wrap="wrap" fontSize="xs" color="textMuted" mb={4}>
                        <Tag size="sm" variant='subtle'>Konu: {currentQuestion.topic?.name || '-'}</Tag>
                        <Tag size="sm" variant='subtle' colorScheme={!currentQStats ? 'gray' : currentQStats.accuracy >= 75 ? 'green' : currentQStats.accuracy >= 50 ? 'yellow' : 'red'}>
                             Genel Başarı: {currentQStats ? `%${currentQStats.accuracy}` : '-'} ({currentQStats ? `${currentQStats.totalAttempts}d` : '-'})
                        </Tag>
                         <Tag size="sm" variant='subtle'>Sınıf: {currentQuestion.classification || '-'}</Tag>
                    </HStack>
                    <Divider my={4} />
                    {currentQuestion.imageUrl && (
                        <Center mb={4}>
                            <Image className="question-image" src={currentQuestion.imageUrl} alt={`Soru ${currentQuestionIndex + 1} için görsel`} borderRadius="md" maxW="100%" htmlWidth="auto" htmlHeight="auto" loading="lazy" />
                        </Center>
                    )}
                    <Box
                         className="question-text"
                         dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentQuestion.text) }}
                         sx={{
                            'h1, h2, h3, h4, h5, h6': { my: 4, fontWeight:'semibold', lineHeight:'tight' },
                            'p': { mb: 4, lineHeight: 'base' },
                            'ul, ol': { pl: 6, mb: 4 },
                            'li': { mb: 2 },
                            'img': { my: 4, borderRadius: 'md', maxW: '100%', height: 'auto' },
                            'a': { color: 'brand.500', textDecoration: 'underline', _hover: { color: 'brand.600'} }, // Link stili global temadan gelebilir veya burada kalabilir
                         }}
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
                    let variant = 'outline'; let colorScheme = 'gray'; let leftIcon = undefined; let sx = {};
                    if (isAnswerChecked) {
                         if (isCorrectAnswer) { variant = 'solid'; colorScheme = 'green'; leftIcon = <Icon as={FiCheckCircle} />; }
                         else if (isIncorrectSelected) { variant = 'solid'; colorScheme = 'red'; leftIcon = <Icon as={FiXCircle} />; }
                         else { variant = 'outline'; sx = { opacity: 0.6 }; }
                    } else if (isSelected) { variant = 'solid'; colorScheme = 'yellow'; }
                    return (
                        <Button key={opt} variant={variant} colorScheme={colorScheme} onClick={() => selectOption(opt)} isDisabled={isAnswerChecked} aria-pressed={isSelected} w="100%" h="auto" py={3} px={4} justifyContent="flex-start" textAlign="left" sx={sx} leftIcon={leftIcon} >
                            <Text as="span" fontWeight="bold" mr={2}>{opt})</Text>
                            <Text as="span" whiteSpace="normal">{optionText}</Text>
                        </Button>
                    );
                })}
            </SimpleGrid>

             {isAnswerChecked && currentQuestion.explanation && (
                 <Collapse in={showExplanation} animateOpacity>
                     <Alert status='info' variant="left-accent" borderRadius="md" mt={6} mb={6} alignItems="flex-start">
                         <AlertIcon mt={1} />
                         <Box flex="1">
                            <AlertTitle>Açıklama:</AlertTitle>
                             <AlertDescription display="block" className="explanation-content" mt={2}>
                                <Box dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentQuestion.explanation) }}
                                    sx={{
                                        'h1, h2, h3, h4, h5, h6': { my: 3, fontWeight:'semibold', lineHeight:'tight', fontSize: 'md' },
                                        'p': { mb: 3, lineHeight: 'base' },
                                        'ul, ol': { pl: 5, mb: 3 },
                                        'li': { mb: 1 },
                                        'img': { my: 3, borderRadius: 'md', maxW: '100%', height: 'auto' },
                                        'a': { color: 'brand.500', textDecoration: 'underline', _hover: { color: 'brand.600'} },
                                        'code': { fontFamily:'mono', bg:'bgTertiary', px:1, py:'1px', rounded:'sm', fontSize:'sm'},
                                        'pre': { fontFamily:'mono', bg:'bgSecondary', p:3, rounded:'md', overflowX:'auto', fontSize:'sm', borderWidth:'1px', borderColor:'borderSecondary', my:4}
                                    }}
                                />
                            </AlertDescription>
                         </Box>
                     </Alert>
                 </Collapse>
             )}

            <Flex justify="space-between" align="center" wrap="wrap" gap={3} p={5} bg="bgSecondary" borderRadius="md" borderWidth="1px" borderColor="borderPrimary" mt={6}>
                <IconButton icon={<Icon as={FaArrowLeft} />} onClick={prev} isDisabled={currentQuestionIndex === 0 || !isAnswerChecked /*Cevap kontrol edilmeden geçilemesin*/} aria-label="Önceki Soru" title="Önceki Soru" variant="ghost"/>

                <HStack flex="1" justifyContent="center" spacing={4}>
                    {!isAnswerChecked ? (
                        <Button colorScheme="brand" onClick={checkAnswer} isDisabled={!selectedAnswer} aria-label="Cevabı Kontrol Et" leftIcon={<Icon as={FaCheck} />}>
                            Kontrol Et
                        </Button>
                    ) : (
                        <Text fontWeight="bold" color={isCorrect ? 'green.500' : 'red.500'}>
                             <Icon as={isCorrect ? FiCheckCircle : FiXCircle} mr={2} verticalAlign="middle" />
                             {isCorrect ? 'Doğru!' : 'Yanlış'}
                        </Text>
                    )}

                    {isAnswerChecked && currentQuestion.explanation && (
                        <Button
                            variant="outline" size="md" colorScheme="blue"
                            leftIcon={<Icon as={FaLightbulb}/>}
                            onClick={toggleExplanation}
                            aria-expanded={showExplanation}
                        >
                            {showExplanation ? 'Gizle' : 'Açıklama'}
                        </Button>
                    )}
                </HStack>

                {currentQuestionIndex < allQuestions.length - 1 ? (
                    <IconButton icon={<Icon as={FaArrowRight} />} onClick={next} isDisabled={!isAnswerChecked} aria-label="Sonraki Soru" title="Sonraki Soru" variant="ghost" />
                ) : (
                    <IconButton icon={<Icon as={FaFlagCheckered} />} colorScheme="green" onClick={finish} isDisabled={!isAnswerChecked} aria-label="Testi Bitir" title="Testi Bitir"/>
                )}
            </Flex>
        </Container>
    );
}

export default SolvePage;