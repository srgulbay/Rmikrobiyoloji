import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
// useColorModeValue kaldırıldı, renkler tema/semantic token'lardan gelecek
// useColorMode hook'u da kullanılmıyorsa kaldırılabilir, DOMPurify skin/content_css için gerekli olabilir
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
  List, ListItem, // ListIcon kaldırıldı, kullanılmıyor
  Divider
} from '@chakra-ui/react';
import { FaArrowLeft, FaArrowRight, FaCheck, FaFlagCheckered, FaRedo, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// formatTime helper
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
    const [timeElapsed, setTimeElapsed] = useState(0);
    const timerRef = useRef(null);
    const [questionStatsMap, setQuestionStatsMap] = useState({});
    const { colorMode } = useColorMode(); // DOMPurify skin için gerekli olabilir
    const location = useLocation();
    const toast = useToast();

    const urls = {
        questions: `${API_BASE_URL}/api/questions`,
        attempts:  `${API_BASE_URL}/api/attempts`,
        stats:     `${API_BASE_URL}/api/stats/questions`
    };

    // --- Logic (Aynı kalır) ---
     const initializeQuiz = useCallback(async () => {
        setLoading(true); setError(''); setScore(0);
        setIsQuizFinished(false); setSelectedAnswer(''); setIsAnswerChecked(false);
        setIsCorrect(null); setTimeElapsed(0); setQuestionStatsMap({});
        clearInterval(timerRef.current);
        timerRef.current = null;

        if (!token) {
            setError('Soruları çözebilmek için giriş yapmalısınız.'); setLoading(false); return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const queryParams = new URLSearchParams(location.search);
            const topicIdFilter = queryParams.get('topicId');
            let questionsUrl = urls.questions;

            if (topicIdFilter) {
                questionsUrl += `?topicId=${topicIdFilter}`;
            }

            const [qRes, sRes] = await Promise.all([
                axios.get(questionsUrl, config),
                axios.get(urls.stats, config)
            ]);

            const questionsData = Array.isArray(qRes.data) ? qRes.data : []; // Gelen verinin dizi olduğundan emin ol
            if (questionsData.length) {
                const finalQuestions = topicIdFilter ? questionsData : [...questionsData].sort(() => Math.random() - 0.5);
                setAllQuestions(finalQuestions);
                setCurrentQuestion(finalQuestions[0]);
                // İstatistiklerin object olduğundan emin ol
                setQuestionStatsMap(typeof sRes.data === 'object' && sRes.data !== null ? sRes.data : {});
                setTimeElapsed(0);
            } else {
                setError(topicIdFilter ? 'Bu konuya ait soru bulunamadı.' : 'Uygun soru bulunamadı.');
                setAllQuestions([]);
                setCurrentQuestion(null);
            }
        } catch (err) {
            console.error("Quiz verisi çekilirken hata:", err);
            setError('Sorular veya istatistikler yüklenirken bir hata oluştu.');
             setAllQuestions([]);
             setCurrentQuestion(null);
        } finally {
            setLoading(false);
        }
    }, [token, urls.questions, urls.stats, location.search]);

    useEffect(() => {
        initializeQuiz();
        return () => { clearInterval(timerRef.current); timerRef.current = null; };
    }, [initializeQuiz]);

    useEffect(() => {
        if (!loading && allQuestions.length > 0 && !isQuizFinished) {
            if (!timerRef.current) {
                timerRef.current = setInterval(() => { setTimeElapsed(t => t + 1); }, 1000);
            }
        } else {
            clearInterval(timerRef.current); timerRef.current = null;
        }
         return () => { clearInterval(timerRef.current); timerRef.current = null; };
    }, [loading, allQuestions, isQuizFinished]);

    const selectOption = useCallback((opt) => {
        if (!isAnswerChecked) setSelectedAnswer(opt);
    }, [isAnswerChecked]);

    const checkAnswer = useCallback(async () => {
        if (!selectedAnswer || !currentQuestion) return;
        const correct = selectedAnswer === currentQuestion.correctAnswer;
        setIsAnswerChecked(true); setIsCorrect(correct);
        if (correct) setScore(s => s + 1);
        if (token) {
            try {
                 await axios.post(urls.attempts, { questionId: currentQuestion.id, selectedAnswer, isCorrect: correct }, { headers: { Authorization: `Bearer ${token}` } });
             } catch (err) { console.error("Deneme kaydedilirken hata:", err); }
        }
    }, [selectedAnswer, currentQuestion, token, urls.attempts]);

    const goTo = useCallback((index) => {
        if (index < 0 || index >= allQuestions.length) return;
        setCurrentQuestion(allQuestions[index]);
        setCurrentQuestionIndex(index);
        setSelectedAnswer(''); setIsAnswerChecked(false); setIsCorrect(null); setError('');
    }, [allQuestions]);

    const prev = useCallback(() => goTo(currentQuestionIndex - 1), [goTo, currentQuestionIndex]);
    const next = useCallback(() => goTo(currentQuestionIndex + 1), [goTo, currentQuestionIndex]);

     const finish = useCallback(() => {
        if (window.confirm('Testi bitirmek istediğinizden emin misiniz?')) {
            setIsQuizFinished(true);
            clearInterval(timerRef.current); timerRef.current = null;
        }
    }, []);

    const currentQStats = useMemo(() => questionStatsMap[currentQuestion?.id], [questionStatsMap, currentQuestion]);
    // --- Logic Sonu ---

    // --- Render Başlangıcı (Tema ile Uyumlu) ---
    if (loading) {
        // Skeleton tema stillerini kullanır
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
        // Alert ve Button tema stillerini kullanır
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

        // Bitiş ekranı tema stillerini kullanır (Card, Heading, List, Text, Button)
        return (
             <Container maxW="container.sm" centerContent py={10}>
                 {/* Card varsayılan (elevated) veya outline stilini kullanır */}
                 <Card textAlign="center" p={8} variant="outline" w="full">
                     <CardBody>
                         <Heading as="h2" size="2xl" mb={4} color="accent">Test Tamamlandı!</Heading>
                         {/* List ve ListItem varsayılan stilleri, Text semantic token'ları kullanır */}
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
                        {/* Text tema renklerini (dinamik) ve font boyutunu kullanır */}
                        <Text fontSize="5xl" fontWeight="bold" color={`${accuracyColorScheme}.500`} my={4}>
                            %{accuracy}
                        </Text>
                        {/* Button tema stilini (solid, lg, brand) kullanır */}
                        <Button
                             colorScheme="brand"
                             size="lg"
                             onClick={initializeQuiz}
                             leftIcon={<Icon as={FaRedo} />}
                             mt={6}
                         >
                             Yeniden Başla
                         </Button>
                     </CardBody>
                 </Card>
             </Container>
        );
    }

    if (!currentQuestion) {
        // Alert ve Button tema stillerini kullanır
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

    // --- Ana Soru Çözme Arayüzü ---
    return (
        <Container maxW="container.lg" py={6}>
            {/* Başlık ve İstatistikler Alanı - Tema stillerini kullanır */}
            <Flex
                wrap="wrap"
                justify="space-between"
                align="center"
                gap={4}
                p={4}
                bg="bgSecondary" // Semantic Token
                borderRadius="md" // Temadan radii.md
                borderWidth="1px"
                borderColor="borderPrimary" // Semantic Token
                mb={6}
                fontSize="sm"
            >
                <Heading as="h3" size="md" m={0}>Soru {currentQuestionIndex + 1} / {allQuestions.length}</Heading>
                <HStack spacing={4} wrap="wrap">
                    <HStack>
                        <Icon as={FiCheckCircle} color="green.500" />
                        <Text>Doğru: <Text as="span" fontWeight="bold" color="textPrimary">{score}</Text></Text> {/* Semantic Token */}
                    </HStack>
                    <HStack>
                        <Icon as={FiClock} color="textMuted" /> {/* Semantic Token */}
                        <Text>Süre: <Text as="span" fontWeight="bold" color="textPrimary">{formatTime(timeElapsed)}</Text></Text> {/* Semantic Token */}
                    </HStack>
                </HStack>
            </Flex>

            {/* Soru Kartı - Tema stillerini kullanır */}
            <Card variant="outline" my={6} bg="bgPrimary"> {/* Semantic Token */}
                <CardBody>
                    {/* Tag tema stilini (subtle, sm) ve renk şemalarını kullanır */}
                    <HStack spacing={4} wrap="wrap" fontSize="xs" color="textMuted" mb={4}>
                        <Tag size="sm" variant='subtle'>Konu: {currentQuestion.topic?.name || '-'}</Tag>
                        <Tag size="sm" variant='subtle' colorScheme={!currentQStats ? 'gray' : currentQStats.accuracy >= 75 ? 'green' : currentQStats.accuracy >= 50 ? 'yellow' : 'red'}>
                             Genel Başarı: {currentQStats ? `%${currentQStats.accuracy}` : '-'} ({currentQStats ? `${currentQStats.totalAttempts}d` : '-'})
                        </Tag>
                         <Tag size="sm" variant='subtle'>Sınıf: {currentQuestion.classification || '-'}</Tag>
                    </HStack>
                    {/* Divider varsayılan stilini kullanır */}
                    <Divider my={4} />
                    {currentQuestion.imageUrl && (
                        <Center mb={4}>
                            {/* Image tema stilini (radii.md) kullanır */}
                            <Image
                                className="question-image"
                                src={currentQuestion.imageUrl}
                                alt={`Soru ${currentQuestionIndex + 1} için görsel`}
                                borderRadius="md"
                                maxW="100%"
                                htmlWidth="auto"
                                htmlHeight="auto"
                                loading="lazy"
                            />
                        </Center>
                    )}
                    {/* dangerouslySetInnerHTML içindeki HTML için prose stilleri */}
                    <Box
                         className="question-text"
                         dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentQuestion.text) }}
                         sx={{
                            // Link stilleri kaldırıldı, global link stili kullanılacak
                            'h1, h2, h3, h4, h5, h6': { my: 4, fontWeight:'semibold', lineHeight:'tight' }, // Tema tipografisini kullanabilir
                            'p': { mb: 4, lineHeight: 'base' }, // Tema tipografisini kullanır
                            'ul, ol': { pl: 6, mb: 4 }, // Liste stilleri
                            'li': { mb: 2 },
                            'img': { my: 4, borderRadius: 'md', maxW: '100%', height: 'auto' }, // Resim stilleri
                            // 'a' stili kaldırıldı
                         }}
                    />
                </CardBody>
            </Card>

            {/* Cevap Seçenekleri - Butonlar tema stillerini kullanır */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
                {['A', 'B', 'C', 'D', 'E'].map(opt => {
                    const optionText = currentQuestion[`option${opt}`];
                    if (!optionText) return null;

                    const isSelected = selectedAnswer === opt;
                    const isCorrectAnswer = opt === currentQuestion.correctAnswer;
                    const isIncorrectSelected = isSelected && !isCorrectAnswer;

                    let variant = 'outline';
                    let colorScheme = 'gray';
                    let leftIcon = undefined;
                    let sx = {};

                    if (isAnswerChecked) {
                         if (isCorrectAnswer) { variant = 'solid'; colorScheme = 'green'; leftIcon = <Icon as={FiCheckCircle} />; }
                         else if (isIncorrectSelected) { variant = 'solid'; colorScheme = 'red'; leftIcon = <Icon as={FiXCircle} />; }
                         else { variant = 'outline'; sx = { opacity: 0.6 }; }
                    } else if (isSelected) { variant = 'solid'; colorScheme = 'yellow'; }

                    return (
                        // Button ve Text tema stillerini kullanır
                        <Button
                            key={opt}
                            variant={variant}
                            colorScheme={colorScheme}
                            onClick={() => selectOption(opt)}
                            isDisabled={isAnswerChecked}
                            aria-pressed={isSelected}
                            w="100%"
                            h="auto"
                            py={3}
                            px={4}
                            justifyContent="flex-start"
                            textAlign="left"
                            sx={sx}
                            leftIcon={leftIcon}
                        >
                            <Text as="span" fontWeight="bold" mr={2}>{opt})</Text>
                            <Text as="span" whiteSpace="normal">{optionText}</Text>
                        </Button>
                    );
                })}
            </SimpleGrid>

            {/* Kontrol Düğmeleri - Flex, Box, Button, IconButton tema stillerini kullanır */}
            <Flex
                justify="space-between"
                align="center"
                wrap="wrap"
                gap={3}
                p={5}
                bg="bgSecondary" // Semantic Token
                borderRadius="md" // Temadan radii.md
                borderWidth="1px"
                borderColor="borderPrimary" // Semantic Token
                mt={6}
            >
                <IconButton
                    icon={<Icon as={FaArrowLeft} />}
                    onClick={prev}
                    isDisabled={currentQuestionIndex === 0}
                    aria-label="Önceki Soru"
                    title="Önceki Soru"
                    variant="ghost" // Tema stilini kullanır
                />

                <Box flex="1" textAlign="center">
                    {!isAnswerChecked ? (
                        <Button
                            colorScheme="brand" // Tema stilini kullanır
                            onClick={checkAnswer}
                            isDisabled={!selectedAnswer}
                            aria-label="Cevabı Kontrol Et"
                            leftIcon={<Icon as={FaCheck} />}
                        >
                            Kontrol Et
                        </Button>
                    ) : (
                        <Text fontWeight="bold" color={isCorrect ? 'green.500' : 'red.500'}>
                             <Icon as={isCorrect ? FiCheckCircle : FiXCircle} mr={2} verticalAlign="middle" />
                             {isCorrect ? 'Doğru!' : 'Yanlış'}
                        </Text>
                    )}
                </Box>

                {currentQuestionIndex < allQuestions.length - 1 ? (
                    <IconButton
                        icon={<Icon as={FaArrowRight} />}
                        onClick={next}
                        aria-label="Sonraki Soru"
                        title="Sonraki Soru"
                        variant="ghost" // Tema stilini kullanır
                    />
                ) : (
                    <IconButton
                        icon={<Icon as={FaFlagCheckered} />}
                        colorScheme="green" // Tema stilini kullanır
                        onClick={finish}
                        isDisabled={!isAnswerChecked}
                        aria-label="Testi Bitir"
                        title="Testi Bitir"
                    />
                )}
            </Flex>
        </Container>
    );
}

export default SolvePage;