import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
// DOMPurify artık kullanılmıyor gibi, kaldırılabilir
// import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import { useColorMode, useColorModeValue } from '@chakra-ui/react'; // useColorModeValue eklendi
import { useLocation, Link as RouterLink } from 'react-router-dom'; // RouterLink eklendi
import { fetchWordleQuestions } from '../services/quizService'; // Servis importu
import {
  Box, Container, Flex, Heading, Text, Button, IconButton, Input, FormControl,
  Alert, AlertIcon, AlertTitle, AlertDescription, Spinner, Card, CardBody, HStack, Center,
  Tag, SimpleGrid, VStack, Skeleton, SkeletonText, useToast, // useToast eklendi (opsiyonel)
  Stat, StatLabel, StatNumber, StatGroup, // Bitiş ekranı için
  List, ListItem // Bitiş ekranı için
} from '@chakra-ui/react';
import { FaInfoCircle, FaExclamationTriangle, FaRedo, FaArrowRight, FaLightbulb, FaTrophy } from 'react-icons/fa';
import { FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";
import Leaderboard from '../components/Leaderboard'; // Leaderboard importu

const API_BASE_URL = import.meta.env.VITE_API_URL;

// formatTime helper (aynı kalabilir)
const formatTime = totalSeconds => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

function WordPracticePage() {
    // State'ler ve hook'lar aynı kalabilir
    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(true);
    const [leaderboardError, setLeaderboardError] = useState('');
    const [wordQuestions, setWordQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [userGuess, setUserGuess] = useState('');
    const [feedback, setFeedback] = useState({ message: '', type: 'info' }); // type için varsayılan 'info'
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isGameOver, setIsGameOver] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();
    const { colorMode } = useColorMode();
    const timerRef = useRef(null);
    const inputRef = useRef(null);
    const toast = useToast(); // Bildirimler için

    // fetchLeaderboard (aynı kalabilir, hata durumunda toast eklenebilir)
    const fetchLeaderboard = useCallback(async () => {
        setLeaderboardLoading(true); setLeaderboardError('');
        try {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(`${API_BASE_URL}/api/stats/wordle-leaderboard`, { headers });
            setLeaderboard(response.data || []);
        } catch (err) {
            console.error("Lider tablosu çekilirken hata:", err);
            const errorMsg = "Lider tablosu yüklenemedi.";
            setLeaderboardError(errorMsg);
            setLeaderboard([]);
            // toast({ title: "Hata", description: errorMsg, status: "error", duration: 3000, isClosable: true });
        } finally {
            setLeaderboardLoading(false);
        }
    }, [token, toast]); // toast bağımlılığı eklendi

    // loadQuestions (aynı kalabilir, hata durumunda toast eklenebilir)
    const loadQuestions = useCallback(async () => {
        setLoading(true); setError(''); setWordQuestions([]); setCurrentQuestion(null); setIsGameOver(false); setScore(0); setCurrentIndex(0);
        clearTimer();
        if (!token) { setError("Oyunu oynamak için giriş yapmalısınız."); setLoading(false); return; }
        try {
            const questions = await fetchWordleQuestions(token);
            if (questions && questions.length > 0) {
                const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
                setWordQuestions(shuffledQuestions);
                setupQuestion(shuffledQuestions[0]);
            } else {
                setError("Bu formatta uygun soru bulunamadı.");
            }
        } catch (err) {
             const errorMsg = err.message || "Sorular yüklenirken bir hata oluştu.";
             setError(errorMsg);
             // toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        } finally {
            setLoading(false);
        }
    }, [token, toast]); // setupQuestion kaldırıldı, aşağıda tanımlı

     // setupQuestion, clearTimer, startTimer, handleTimeUp mantığı aynı kalabilir
      const clearTimer = useCallback(() => {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }, []);

      const startTimer = useCallback(() => {
        clearTimer();
        timerRef.current = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearTimer();
                    // handleTimeUp çağrılacak ama state güncellemeleri batch olabilir,
                    // doğrudan burada state güncellemek daha garanti olabilir.
                     if (!isAnswerSubmitted) { // Henüz cevap gönderilmediyse süre bitti mesajı ver
                         setIsAnswerSubmitted(true); // Cevap gönderilmiş kabul et
                         setFeedback({ message: `Süre doldu! Doğru cevap: ${correctAnswer}`, type: 'warning' });
                     }
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);
      // isAnswerSubmitted ve correctAnswer bağımlılıkları sorun yaratabilir, dikkat!
      // Bu nedenle handleTimeUp'ı burada doğrudan çağırmak yerine state'i burada güncelledik.
    }, [clearTimer, correctAnswer]); // isAnswerSubmitted bağımlılığı kaldırıldı, correctAnswer eklendi


     const setupQuestion = useCallback((question) => {
        if (!question || !question.answerWord) {
            console.error("Geçersiz soru verisi:", question);
            setError("Oyun verisi yüklenirken sorun oluştu."); // Hata mesajı ayarla
            setIsGameOver(true); // Oyunu bitir
            clearTimer();
            return;
        };
        setCurrentQuestion(question);
        const answer = question.answerWord.toUpperCase();
        setCorrectAnswer(answer);
        setUserGuess('');
        setFeedback({ message: '', type: 'info' });
        setIsAnswerSubmitted(false);
        setTimeLeft(30);
        if (inputRef.current) inputRef.current.focus();
        startTimer(); // startTimer burada çağrılıyor
    }, [startTimer, clearTimer]); // Bağımlılıklar düzeltildi


    useEffect(() => {
        loadQuestions();
        return () => clearTimer();
    }, [loadQuestions, clearTimer]);

     useEffect(() => {
        if (isGameOver) {
            fetchLeaderboard();
        }
    }, [isGameOver, fetchLeaderboard]);

    // handleGuessSubmit mantığı aynı, sadece toast eklenebilir
     const handleGuessSubmit = useCallback((e) => {
        if(e) e.preventDefault();
        if (!userGuess || isAnswerSubmitted || !correctAnswer) return;
        clearTimer();
        setIsAnswerSubmitted(true);
        const guessUpper = userGuess.trim().toUpperCase();
        if (guessUpper === correctAnswer) {
            const points = Math.max(10, timeLeft * 10);
            setFeedback({ message: `Tebrikler! +${points} puan!`, type: 'success'});
            setScore(prev => prev + points);
             // Opsiyonel: Başarı Toast'ı
             // toast({ title: "Doğru!", description: `+${points} puan kazandınız!`, status: "success", duration: 2000 });
        } else {
            setFeedback({ message: `Yanlış! Doğru cevap: ${correctAnswer}`, type: 'error'});
             // Opsiyonel: Hata Toast'ı
             // toast({ title: "Yanlış!", description: `Doğru cevap: ${correctAnswer}`, status: "error", duration: 3000 });
        }
    }, [userGuess, isAnswerSubmitted, correctAnswer, timeLeft, clearTimer, toast]);

    // handleInputChange mantığı aynı kalabilir
    const handleInputChange = useCallback((event) => {
        const newValue = event.target.value.replace(/[^a-zA-Z0-9ÇĞİÖŞÜçğüöşİ]/g, '').toUpperCase();
        if (correctAnswer && newValue.length <= correctAnswer.length) {
             setUserGuess(newValue);
        }
    }, [correctAnswer]);

     // goToNextQuestion mantığı aynı kalabilir
    const goToNextQuestion = useCallback(() => {
        if (!isAnswerSubmitted) return;
        const nextIndex = currentIndex + 1;
        if (nextIndex < wordQuestions.length) {
            setCurrentIndex(nextIndex);
            setupQuestion(wordQuestions[nextIndex]);
        } else {
            setIsGameOver(true);
        }
    }, [currentIndex, wordQuestions, isAnswerSubmitted, setupQuestion]);

    // --- Render Bölümü (Chakra UI ile) ---

    if (loading) {
        // Chakra UI Skeleton
        return (
            <Container maxW="container.md" py={8}>
                <VStack spacing={6}>
                    <Skeleton height="40px" width="50%" />
                    <Skeleton height="50px" width="70%" borderRadius="md" />
                    <Card variant="outline" w="full" p={8}>
                        <SkeletonText mt="4" noOfLines={1} spacing="4" width="80%" mx="auto" />
                        <HStack justify="center" spacing={2} my={6}>
                            {[...Array(7)].map((_, i) => <Skeleton key={i} height="4rem" width="3rem" borderRadius="md" />)}
                        </HStack>
                        <Skeleton height="40px" borderRadius="md" />
                    </Card>
                </VStack>
            </Container>
        );
    }

    if (error) {
        // Chakra UI Hata Ekranı
        return (
            <Container maxW="container.md" mt={10}>
                <Alert status="error" variant="left-accent" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={10} borderRadius="lg">
                    <AlertIcon boxSize="40px" mr={0} as={FaExclamationTriangle} />
                    <AlertTitle mt={4} mb={1} fontSize="xl">Bir Hata Oluştu</AlertTitle>
                    <AlertDescription maxWidth="sm" mb={5}>{error}</AlertDescription>
                    <Button colorScheme="red" onClick={loadQuestions} leftIcon={<Icon as={FaRedo} />}>
                        Tekrar Dene
                    </Button>
                </Alert>
            </Container>
        );
    }

    if (isGameOver || (!loading && !currentQuestion)) {
        const gameFinished = isGameOver && wordQuestions.length > 0 && currentIndex >= wordQuestions.length -1;
        const noQuestionsFound = !loading && wordQuestions.length === 0;

        // Chakra UI Oyun Bitiş / Soru Yok Ekranı
        return (
            <Container maxW="container.md" py={8}>
                <Card variant="outline" textAlign="center" p={{base: 6, md: 10}} mt={10}>
                    <CardBody>
                        <Heading as="h2" size="2xl" mb={4} color={gameFinished ? 'green.500' : 'orange.500'}>
                            {gameFinished ? 'Oyun Bitti!' : 'Soru Bulunamadı'}
                        </Heading>

                        {gameFinished && (
                            <>
                                <Text fontSize="lg" mb={4}>Tebrikler, tüm soruları tamamladınız!</Text>
                                <StatGroup justifyContent="center" mb={6}>
                                    <Stat>
                                        <StatLabel>Toplam Skor</StatLabel>
                                        <StatNumber fontSize="3xl" color="brand.500">{score}</StatNumber>
                                    </Stat>
                                </StatGroup>
                            </>
                        )}
                        {(noQuestionsFound || (!gameFinished && !loading && !currentQuestion)) && (
                            <Text color="textMuted" mb={6}>Oyun için uygun soru bulunamadı veya yüklenirken bir hata oluştu.</Text>
                        )}

                        {/* Leaderboard (Henüz güncellenmedi) */}
                        <Leaderboard data={leaderboard} loading={leaderboardLoading} error={leaderboardError} />

                        <Button colorScheme="brand" size="lg" onClick={loadQuestions} leftIcon={<Icon as={FaRedo} />} mt={8}>
                            {gameFinished ? 'Tekrar Oyna' : 'Yeni Oyun Başlat'}
                        </Button>
                    </CardBody>
                </Card>
            </Container>
        );
    }

    // --- Aktif Oyun Arayüzü (Chakra UI ile) ---
    // Tema renkleri
    const boxBorderColor = useColorModeValue('gray.300', 'gray.600');
    const revealedBoxBorderColor = useColorModeValue('gray.500', 'gray.400');
    const finalRevealBorderColor = useColorModeValue('blue.500', 'blue.300');
    const boxBg = useColorModeValue('gray.100', 'gray.700');

    return (
        <Container maxW="container.md" py={6} className="word-practice-page">
            <Heading as="h1" size="lg" textAlign="center" mb={4}>Kelime Çalışması</Heading>
            {/* Skor ve Zamanlayıcı */}
            <Flex justify="space-between" align="center" mb={6} p={3} px={4} borderRadius="md" bg="bgSecondary" borderWidth="1px" borderColor="borderPrimary" maxW="sm" mx="auto">
                <HStack>
                    <Text fontSize="sm" color="textMuted">Skor:</Text>
                    <Text fontWeight="bold" fontSize="lg" color="brand.500">{score}</Text>
                </HStack>
                <HStack>
                    <Icon as={FiClock} color="textMuted" />
                    <Text fontWeight="semibold" fontSize="lg">{formatTime(timeLeft)}</Text>
                </HStack>
            </Flex>

            {/* Oyun Alanı Kartı */}
            <Card variant="outline" maxW="2xl" mx="auto" p={{base: 4, md: 8}} boxShadow="lg">
                <CardBody textAlign="center">
                    {/* Soru Metni */}
                    <Text fontSize={{base:"lg", md:"xl"}} color="textPrimary" mb={8} minH="3em"> {/* Minimum yükseklik */}
                         {currentQuestion.text}
                    </Text>

                    {/* Cevap Kutucukları */}
                    <HStack spacing={{base: 1, sm: 2}} justify="center" mb={6} flexWrap="wrap">
                         {Array.from({ length: correctAnswer.length }).map((_, index) => {
                             const char = correctAnswer[index];
                             const isRevealed = index === 0 || isAnswerSubmitted;
                             return (
                                 <Center
                                     key={index}
                                     as="span"
                                     w={{base:"2.5rem", md:"3rem"}} // Responsive boyut
                                     h={{base:"2.5rem", md:"3rem"}}
                                     borderWidth="2px"
                                     borderColor={isRevealed ? finalRevealBorderColor : (index === 0 ? revealedBoxBorderColor : boxBorderColor)}
                                     borderRadius="sm"
                                     fontFamily="mono"
                                     fontSize={{base:"lg", md:"xl"}}
                                     fontWeight="bold"
                                     textTransform="uppercase"
                                     color="textPrimary"
                                     bg={boxBg}
                                     transition="all 0.2s ease"
                                     userSelect="none" // Seçimi engelle
                                 >
                                     {isRevealed ? char : ''}
                                 </Center>
                             );
                         })}
                    </HStack>

                     {/* Geri Bildirim */}
                     <ScaleFade initialScale={0.9} in={!!feedback.message} unmountOnExit>
                         {feedback.message && (
                            <Alert status={feedback.type === 'info' ? 'info' : feedback.type} borderRadius="md" mb={4} variant="subtle" justifyContent="center">
                                <AlertIcon />
                                <AlertDescription fontSize="sm">{feedback.message}</AlertDescription>
                            </Alert>
                         )}
                    </ScaleFade>

                    {/* Tahmin Girişi veya Sonraki Soru Butonu */}
                    {!isAnswerSubmitted ? (
                         <Flex as="form" onSubmit={handleGuessSubmit} direction={{base:"column", sm:"row"}} gap={3} justify="center" align="center" mt={4} maxW="sm" mx="auto">
                             <FormControl isDisabled={isAnswerSubmitted}>
                                 <Input
                                     ref={inputRef}
                                     type="text"
                                     textAlign="center"
                                     textTransform="uppercase"
                                     fontSize="xl"
                                     letterSpacing="wider"
                                     fontWeight="semibold"
                                     fontFamily="mono"
                                     value={userGuess}
                                     onChange={handleInputChange}
                                     maxLength={correctAnswer.length}
                                     placeholder={"_ ".repeat(correctAnswer.length)}
                                     autoFocus
                                     autoComplete='off'
                                     aria-label="Tahmininizi girin"
                                     bg={useColorModeValue('white', 'gray.800')}
                                     borderColor={useColorModeValue('gray.300', 'gray.600')}
                                     _focus={{borderColor: "brand.500", boxShadow: `0 0 0 1px var(--chakra-colors-brand-500)`}}
                                 />
                              </FormControl>
                             <Button
                                type="submit"
                                colorScheme="brand"
                                w={{base:"full", sm:"auto"}}
                                px={6}
                                isDisabled={!userGuess || userGuess.length !== correctAnswer.length || isAnswerSubmitted}
                            >
                                 Tahmin Et
                             </Button>
                         </Flex>
                    ) : (
                        <Button onClick={goToNextQuestion} colorScheme="gray" variant="outline" mt={4} rightIcon={<Icon as={FaArrowRight}/>}>
                            Sonraki Soru
                        </Button>
                    )}
                </CardBody>
            </Card>
            {/* Yardımcı Metin */}
            <Text textAlign="center" color="textMuted" fontSize="sm" mt={6}>
                Kelimeyi tahmin etmek için kutucuklara yazın ve "Tahmin Et" butonuna tıklayın veya Enter'a basın.
            </Text>
        </Container>
    );
}

export default WordPracticePage;