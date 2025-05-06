import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useColorMode, useColorModeValue } from '@chakra-ui/react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { fetchWordleQuestions } from '../services/quizService';
import {
  Box, Container, Flex, Heading, Text, Button, IconButton, Input, FormControl,
  Alert, AlertIcon, AlertTitle, AlertDescription, Spinner, Card, CardBody, HStack, Center,
  Tag, SimpleGrid, VStack, Skeleton, SkeletonText, useToast,
  Stat, StatLabel, StatNumber, StatGroup, List, ListItem // Bitiş ekranı için
} from '@chakra-ui/react';
import { FaInfoCircle, FaExclamationTriangle, FaRedo, FaArrowRight, FaLightbulb, FaTrophy } from 'react-icons/fa';
import { FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";
import Leaderboard from '../components/Leaderboard';
// Yeni Bileşenler (İskelet)
// import GuessGrid from '../components/GuessGrid';
// import Keyboard from '../components/Keyboard';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const formatTime = totalSeconds => { /* ... (aynı) ... */ };

const MAX_GUESSES = 6; // Wordle standardı

function WordPracticePage() {
    // --- State Değişiklikleri ---
    const [wordQuestions, setWordQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [wordLength, setWordLength] = useState(5); // Varsayılan veya ilk kelimeye göre ayarla
    const [guesses, setGuesses] = useState(Array(MAX_GUESSES).fill('')); // Tahminleri tut
    const [currentAttempt, setCurrentAttempt] = useState(0); // Kaçıncı deneme
    const [letterStatuses, setLetterStatuses] = useState({}); // { A: 'absent', B: 'present', C: 'correct' } gibi
    // Grid durumu için daha detaylı state gerekebilir: const [gridStatuses, setGridStatuses] = useState(Array(MAX_GUESSES).fill(null).map(() => Array(wordLength).fill('idle')));

    const [feedback, setFeedback] = useState({ message: '', type: 'info' });
    const [score, setScore] = useState(0); // Skorlama mantığı değişebilir
    const [timeLeft, setTimeLeft] = useState(90); // Süre biraz daha uzun olabilir
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Leaderboard state'leri
    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(true);
    const [leaderboardError, setLeaderboardError] = useState('');

    const { token } = useAuth();
    const { colorMode } = useColorMode();
    const timerRef = useRef(null);
    const toast = useToast();

    // --- Fonksiyonlar (fetchLeaderboard, loadQuestions, setupQuestion, timer vb. güncellenmeli) ---

    const clearTimer = useCallback(() => { /* ... (aynı) ... */ }, []);

    const startTimer = useCallback(() => {
        clearTimer();
        // Zamanlayıcı mantığı burada... (süre bitince ne olacağı güncellenmeli, belki oyunu bitirir?)
         timerRef.current = setInterval(() => {
             setTimeLeft(prevTime => {
                 if (prevTime <= 1) {
                     clearTimer();
                     // Oyunu bitir veya başka bir işlem yap
                     // setIsGameOver(true);
                     // setGameStatus('lost');
                     return 0;
                 }
                 return prevTime - 1;
             });
         }, 1000);
    }, [clearTimer]);


     const setupQuestion = useCallback((question) => {
        if (!question || !question.answerWord) {
            setError("Oyun verisi yüklenirken sorun oluştu.");
            setIsGameOver(true); setGameStatus('error'); clearTimer(); return;
        };
        setCurrentQuestion(question);
        const answer = question.answerWord.toUpperCase();
        setCorrectAnswer(answer);
        setWordLength(answer.length); // Kelime uzunluğunu ayarla
        setGuesses(Array(MAX_GUESSES).fill('')); // Tahminleri sıfırla
        setCurrentAttempt(0); // Denemeyi sıfırla
        setLetterStatuses({}); // Harf durumlarını sıfırla
        // setGridStatuses(Array(MAX_GUESSES).fill(null).map(() => Array(answer.length).fill('idle'))); // Izgara durumunu sıfırla
        setFeedback({ message: '', type: 'info' });
        setIsGameOver(false);
        setGameStatus('playing');
        setTimeLeft(90); // Zamanlayıcıyı resetle
        startTimer();
    }, [startTimer, clearTimer]);

    const loadQuestions = useCallback(async () => {
        setLoading(true); setError(''); setWordQuestions([]); setCurrentQuestion(null); setIsGameOver(false); setGameStatus('playing'); setScore(0); setCurrentIndex(0);
        clearTimer();
        if (!token) { setError("Oyunu oynamak için giriş yapmalısınız."); setLoading(false); return; }
        try {
            const questions = await fetchWordleQuestions(token);
            if (questions?.length > 0) {
                const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
                setWordQuestions(shuffledQuestions);
                setupQuestion(shuffledQuestions[0]);
            } else {
                setError("Bu formatta uygun soru bulunamadı.");
                 setIsGameOver(true); setGameStatus('no_questions'); // Özel durum
            }
        } catch (err) {
             setError(err.message || "Sorular yüklenirken bir hata oluştu.");
             setIsGameOver(true); setGameStatus('error');
        } finally {
            setLoading(false);
        }
    }, [token, setupQuestion, clearTimer]);


    useEffect(() => {
        loadQuestions();
        return () => clearTimer();
    }, [loadQuestions]); // loadQuestions bağımlılığı düzeltildi

     useEffect(() => {
        if (gameStatus === 'won' || gameStatus === 'lost') {
            fetchLeaderboard();
            // TODO: Skoru backend'e kaydetme isteği burada yapılabilir
            // recordWordleScore(score);
        }
    }, [gameStatus, fetchLeaderboard]); // score eklenebilir


    // --- Klavye / Tahmin İşleme Mantığı (Taslak) ---
    const handleKeyPress = useCallback((key) => {
        if (gameStatus !== 'playing' || currentAttempt >= MAX_GUESSES) return;

        const currentGuess = guesses[currentAttempt];

        if (key === 'ENTER') {
            if (currentGuess.length === wordLength) {
                handleSubmitGuess(currentGuess);
            } else {
                toast({ title: "Uyarı", description: `${wordLength} harf girmelisiniz.`, status: "warning", duration: 1500, isClosable: true, position: "top" });
            }
        } else if (key === 'BACKSPACE') {
            setGuesses(prev => {
                const newGuesses = [...prev];
                newGuesses[currentAttempt] = currentGuess.slice(0, -1);
                return newGuesses;
            });
        } else if (currentGuess.length < wordLength && /^[a-zA-ZÇĞİÖŞÜ]$/i.test(key)) {
             setGuesses(prev => {
                const newGuesses = [...prev];
                newGuesses[currentAttempt] += key.toUpperCase();
                return newGuesses;
            });
        }
    }, [gameStatus, currentAttempt, guesses, wordLength, toast]); // handleSubmitGuess eklenecek

    const handleSubmitGuess = useCallback((guess) => {
        // TODO: Kelime listesinde kontrol (opsiyonel)

        // Harf durumlarını hesapla
        const newLetterStatuses = { ...letterStatuses };
        const statuses = Array(wordLength).fill('absent');
        const answerLetters = correctAnswer.split('');
        const guessLetters = guess.split('');

        // 1. Pass: Doğru yerdekileri (correct) bul
        for (let i = 0; i < wordLength; i++) {
            if (guessLetters[i] === answerLetters[i]) {
                statuses[i] = 'correct';
                newLetterStatuses[guessLetters[i]] = 'correct';
                answerLetters[i] = null; // Bu harfi tekrar eşleştirme
            }
        }

        // 2. Pass: Yanlış yerdekileri (present) bul
        for (let i = 0; i < wordLength; i++) {
            if (statuses[i] !== 'correct') { // Henüz doğru değilse
                 const letterIndexInAnswer = answerLetters.indexOf(guessLetters[i]);
                 if (letterIndexInAnswer !== -1) {
                     statuses[i] = 'present';
                     if (newLetterStatuses[guessLetters[i]] !== 'correct') { // Daha önce doğru bulunmadıysa 'present' yap
                        newLetterStatuses[guessLetters[i]] = 'present';
                     }
                     answerLetters[letterIndexInAnswer] = null; // Bu harfi tekrar eşleştirme
                 }
            }
        }

         // 3. Pass: Geriye kalanları (absent) işaretle
         for (let i = 0; i < wordLength; i++) {
             if (statuses[i] === 'absent') {
                 if (!newLetterStatuses[guessLetters[i]]) { // Henüz durumu belirlenmediyse 'absent' yap
                     newLetterStatuses[guessLetters[i]] = 'absent';
                 }
             }
         }

        // TODO: Izgara state'ini (gridStatuses) güncelle

        setLetterStatuses(newLetterStatuses); // Klavye için harf durumlarını güncelle

        if (guess === correctAnswer) {
            // Kazandı!
            setIsGameOver(true);
            setGameStatus('won');
            clearTimer();
            const points = Math.max(10, timeLeft * 10); // Örnek skorlama
            setScore(prev => prev + points);
            toast({ title: "Tebrikler!", description: `Kelimeyi ${currentAttempt + 1}. denemede buldunuz! +${points} puan!`, status: "success", duration: 5000, isClosable: true, position: "top" });
        } else if (currentAttempt + 1 >= MAX_GUESSES) {
            // Kaybetti!
            setIsGameOver(true);
            setGameStatus('lost');
            clearTimer();
            toast({ title: "Oyun Bitti!", description: `Deneme hakkınız kalmadı. Doğru kelime: ${correctAnswer}`, status: "error", duration: null, isClosable: true, position: "top" });
        } else {
            // Sonraki denemeye geç
            setCurrentAttempt(prev => prev + 1);
        }

    }, [correctAnswer, wordLength, currentAttempt, letterStatuses, toast, clearTimer, timeLeft]);

     // Fiziksel klavye dinleyicisi
     useEffect(() => {
         const handleKeyDown = (event) => {
             if (isGameOver) return; // Oyun bittiyse dinleme
             const key = event.key;
             if (key === 'Enter') {
                 handleKeyPress('ENTER');
             } else if (key === 'Backspace') {
                 handleKeyPress('BACKSPACE');
             } else if (key.length === 1 && key.match(/[a-zçğüöşöi]/i)) {
                 handleKeyPress(key);
             }
         };

         window.addEventListener('keydown', handleKeyDown);
         return () => {
             window.removeEventListener('keydown', handleKeyDown);
         };
     }, [handleKeyPress, isGameOver]); // isGameOver eklendi

    // --- İskelet Komponentler (Ayrı dosyalara taşınabilir) ---

    const GuessGrid = ({ guesses, currentAttempt, wordLength, statuses }) => {
        // TODO: Izgarayı oluştur (SimpleGrid veya VStack/HStack ile)
        // Her hücre için GridCell çağır
        return (
            <VStack spacing={1.5} mb={8}>
                {guesses.map((guess, rowIndex) => (
                    <HStack key={rowIndex} spacing={1.5}>
                        {Array.from({ length: wordLength }).map((_, colIndex) => (
                            <GridCell
                                key={colIndex}
                                letter={guess[colIndex] || ''}
                                // status={statuses[rowIndex]?.[colIndex] || 'idle'} // TODO: gridStatuses state'i lazım
                                status={'idle'} // Şimdilik idle
                                isCurrentRow={rowIndex === currentAttempt}
                            />
                        ))}
                    </HStack>
                ))}
            </VStack>
        );
    };

    const GridCell = ({ letter, status, isCurrentRow }) => {
        // TODO: Harf durumuna göre (correct, present, absent, idle) arka plan rengi belirle
        const bg = status === 'correct' ? 'green.500'
                 : status === 'present' ? 'yellow.500'
                 : status === 'absent' ? 'gray.500'
                 : useColorModeValue('white', 'gray.700');
        const color = status === 'correct' || status === 'present' || status === 'absent' ? 'white' : 'inherit';
        const borderColor = status === 'idle' ? useColorModeValue('gray.300','gray.600') : 'transparent';

        return (
            <Center
                w={{base:"3rem", md:"3.5rem"}}
                h={{base:"3rem", md:"3.5rem"}}
                bg={bg}
                color={color}
                borderWidth="2px"
                borderColor={borderColor}
                borderRadius="md"
                fontSize={{base:"xl", md:"2xl"}}
                fontWeight="bold"
                textTransform="uppercase"
                transition="all 0.2s ease-in-out"
                // Animasyonlar eklenebilir
            >
                {letter}
            </Center>
        );
    };

    const Keyboard = ({ onKeyPress, letterStatuses }) => {
        // TODO: Sanal klavyeyi oluştur (QWERTY düzeni)
        // Her tuş için Button kullan, tıklandığında onKeyPress'i çağır
        // letterStatuses'a göre tuş renklerini ayarla
        const rows = [
            "QWERTYUIOPĞÜ",
            "ASDFGHJKLŞİ",
            "ZXCVBNMÖÇ",
        ];
        return (
            <VStack spacing={1.5} mt={8} w="full" maxW="600px" mx="auto">
                {rows.map((row, rowIndex) => (
                    <HStack key={rowIndex} spacing={1.5} justify="center">
                         {rowIndex === 2 && <Button onClick={() => onKeyPress('ENTER')} h={12} px={3} minW="4rem">Enter</Button>}
                         {row.split('').map(key => {
                             const status = letterStatuses[key];
                             let colorScheme = 'gray';
                             if (status === 'correct') colorScheme = 'green';
                             else if (status === 'present') colorScheme = 'yellow';
                             else if (status === 'absent') colorScheme = 'blackAlpha'; // Veya dark mode'a uygun

                            return (
                                <Button
                                    key={key}
                                    onClick={() => onKeyPress(key)}
                                    size="sm"
                                    h={12} // Yükseklik
                                    flex={1} // Esnek genişlik
                                    minW={{base:"1.8rem", sm:"2.2rem"}} // Min genişlik
                                    px={1} // Yatay padding
                                    colorScheme={colorScheme}
                                    variant={status === 'absent' ? 'outline' : 'solid'}
                                >
                                    {key}
                                </Button>
                             );
                         })}
                         {rowIndex === 2 && <Button onClick={() => onKeyPress('BACKSPACE')} h={12} px={3} minW="4rem">Sil</Button>}
                    </HStack>
                 ))}
            </VStack>
        );
    };


    // --- Render Bölümü (Chakra UI ile) ---

    // Yükleme ve Hata durumları aynı kalabilir

    if (loading) return (<Container centerContent py={10}><Spinner size="xl" color="brand.500"/></Container>);
    if (error && gameStatus === 'error') return ( <Container maxW="container.md" mt={10}> <Alert status="error" variant="left-accent" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={10} borderRadius="lg"> <AlertIcon boxSize="40px" mr={0} as={FaExclamationTriangle} /> <AlertTitle mt={4} mb={1} fontSize="xl">Bir Hata Oluştu</AlertTitle> <AlertDescription maxWidth="sm" mb={5}>{error}</AlertDescription> <Button colorScheme="red" onClick={loadQuestions} leftIcon={<Icon as={FaRedo} />}> Tekrar Dene </Button> </Alert> </Container> );


    // Oyun Bitti veya Soru Yok Ekranı
    if (isGameOver) {
         const gameWon = gameStatus === 'won';
         const noQuestionsFound = gameStatus === 'no_questions';

        return (
            <Container maxW="container.md" py={8}>
                <Card variant="outline" textAlign="center" p={{base: 6, md: 10}} mt={10}>
                    <CardBody>
                        <Heading as="h2" size={gameWon ? "2xl" : "xl"} mb={4} color={gameWon ? 'green.500' : (noQuestionsFound ? 'orange.500' : 'red.500')}>
                            {gameWon ? 'Oyun Bitti!' : (noQuestionsFound ? 'Soru Bulunamadı' : 'Oyun Bitti!')}
                        </Heading>

                        {gameWon && (
                            <>
                                <Text fontSize="lg" mb={4}>Tebrikler, kelimeyi <Text as="span" fontWeight="bold">{currentAttempt + 1}</Text>. denemede buldunuz!</Text>
                                 <StatGroup justifyContent="center" mb={6}>
                                    <Stat>
                                        <StatLabel>Toplam Skor</StatLabel>
                                        <StatNumber fontSize="4xl" color="brand.500">{score}</StatNumber>
                                    </Stat>
                                </StatGroup>
                            </>
                        )}
                        {!gameWon && !noQuestionsFound && ( // Kaybettiyse
                             <Text fontSize="lg" mb={4}>Deneme hakkınız kalmadı. Doğru kelime: <Text as="span" fontWeight="bold" letterSpacing="wider">{correctAnswer}</Text></Text>
                        )}
                        {noQuestionsFound && (
                            <Text color="textMuted" mb={6}>Oyun için uygun soru bulunamadı.</Text>
                        )}

                         {/* Leaderboard */}
                         <Box mt={8}>
                             <Leaderboard data={leaderboard} loading={leaderboardLoading} error={leaderboardError} />
                         </Box>

                        <Button colorScheme="brand" size="lg" onClick={loadQuestions} leftIcon={<Icon as={FaRedo} />} mt={8}>
                           {gameWon || !noQuestionsFound ? 'Tekrar Oyna' : 'Yeni Oyun Başlat'}
                        </Button>
                    </CardBody>
                </Card>
            </Container>
        );
    }


    // --- Aktif Oyun Arayüzü ---
    return (
        <Container maxW="container.lg" py={6} className="word-practice-page">
            <Heading as="h1" size="lg" textAlign="center" mb={4}>Kelime Çalışması</Heading>
            {/* Skor ve Zamanlayıcı */}
            <Flex justify="space-between" align="center" mb={6} p={3} px={4} borderRadius="md" bg="bgSecondary" borderWidth="1px" borderColor="borderPrimary" maxW="lg" mx="auto">
                 <HStack>
                    <Text fontSize="sm" color="textMuted">Skor:</Text>
                    <Text fontWeight="bold" fontSize="lg" color="brand.500">{score}</Text>
                </HStack>
                <HStack>
                    <Text fontSize="sm" color="textMuted">Kalan Deneme:</Text>
                    <Text fontWeight="bold" fontSize="lg">{MAX_GUESSES - currentAttempt}</Text>
                </HStack>
                 <HStack>
                    <Icon as={FiClock} color="textMuted" />
                    <Text fontWeight="semibold" fontSize="lg">{formatTime(timeLeft)}</Text>
                </HStack>
            </Flex>

            {/* Soru Metni */}
             <Text fontSize={{base:"lg", md:"xl"}} color="textPrimary" textAlign="center" mb={6} px={4} minH="3em" fontStyle="italic">
                 "{currentQuestion?.text}"
             </Text>

            {/* Tahmin Izgarası */}
             <GuessGrid
                 guesses={guesses}
                 currentAttempt={currentAttempt}
                 wordLength={wordLength}
                 // statuses={gridStatuses} // TODO: gridStatuses state'i lazım
                 statuses={[]} // Şimdilik boş
             />

             {/* Sanal Klavye */}
             <Keyboard onKeyPress={handleKeyPress} letterStatuses={letterStatuses} />

        </Container>
    );
}

export default WordPracticePage;