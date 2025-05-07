import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
// useColorMode kaldırıldı, useColorModeValue yetiyor
import { useColorModeValue } from '@chakra-ui/react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { fetchWordleQuestions } from '../services/quizService';
import {
  Box, Container, Flex, Heading, Text, Button, IconButton, Input, FormControl, Icon,
  Alert, AlertIcon, AlertTitle, AlertDescription, Spinner, Card, CardBody, HStack, Center,
  Tag, SimpleGrid, VStack, Skeleton, SkeletonText, useToast,
  Stat, StatLabel, StatNumber, StatGroup, List, ListItem // Bitiş ekranı için
  // Divider kaldırıldı, kullanılmıyor
} from '@chakra-ui/react';
import { FaInfoCircle, FaExclamationTriangle, FaRedo, FaArrowRight, FaLightbulb, FaTrophy } from 'react-icons/fa';
import { FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";
import Leaderboard from '../components/Leaderboard';
// import GuessGrid from '../components/GuessGrid'; // İskelet
// import Keyboard from '../components/Keyboard'; // İskelet

const API_BASE_URL = import.meta.env.VITE_API_URL;

// formatTime helper
const formatTime = totalSeconds => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const MAX_GUESSES = 6;

function WordPracticePage() {
    const [wordQuestions, setWordQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [wordLength, setWordLength] = useState(5);
    const [guesses, setGuesses] = useState(Array(MAX_GUESSES).fill(''));
    const [currentAttempt, setCurrentAttempt] = useState(0);
    const [letterStatuses, setLetterStatuses] = useState({});
    // const [gridStatuses, setGridStatuses] = useState(Array(MAX_GUESSES).fill(null).map(() => Array(wordLength).fill('idle'))); // Daha detaylı grid durumu

    const [feedback, setFeedback] = useState({ message: '', type: 'info' }); // Şu an kullanılmıyor gibi
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(90);
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameStatus, setGameStatus] = useState('playing');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(true);
    const [leaderboardError, setLeaderboardError] = useState('');

    const { token } = useAuth();
    const timerRef = useRef(null);
    const toast = useToast();

    // --- Tema Değerleri (Hook Kuralı İçin Top-Level'da) ---
    const cellBgIdle = useColorModeValue('white', 'gray.700');
    const cellBorderIdle = useColorModeValue('gray.300','gray.600');
    const keyboardAbsentVariant = useColorModeValue('outline', 'solid'); // Koyu modda absent tuşlar solid olabilir
    const keyboardAbsentColorScheme = useColorModeValue('gray', 'whiteAlpha'); // Koyu modda whiteAlpha kullanılabilir

    // --- Fonksiyonlar ---
    const clearTimer = useCallback(() => { if(timerRef.current) clearInterval(timerRef.current); timerRef.current = null; }, []);

    const startTimer = useCallback(() => {
        clearTimer();
         timerRef.current = setInterval(() => {
             setTimeLeft(prevTime => {
                 if (prevTime <= 1) {
                     clearTimer();
                     // Süre bitince oyunu kaybetme durumu
                     // (Eğer zaten kazanmadıysa)
                     if (gameStatus === 'playing') {
                         setIsGameOver(true);
                         setGameStatus('lost');
                         toast({ title: "Süre Doldu!", description: `Doğru kelime: ${correctAnswer}`, status: "error", duration: null, isClosable: true, position: "top" });
                     }
                     return 0;
                 }
                 return prevTime - 1;
             });
         }, 1000);
    }, [clearTimer, toast, correctAnswer, gameStatus]); // gameStatus ve correctAnswer eklendi

     const setupQuestion = useCallback((question) => {
        if (!question || !question.answerWord) {
            setError("Oyun verisi yüklenirken sorun oluştu.");
            setIsGameOver(true); setGameStatus('error'); clearTimer(); return;
        };
        setCurrentQuestion(question);
        const answer = question.answerWord.toUpperCase();
        setCorrectAnswer(answer);
        setWordLength(answer.length);
        setGuesses(Array(MAX_GUESSES).fill(''));
        setCurrentAttempt(0);
        setLetterStatuses({});
        // setGridStatuses(Array(MAX_GUESSES).fill(null).map(() => Array(answer.length).fill('idle')));
        setFeedback({ message: '', type: 'info' });
        setIsGameOver(false);
        setGameStatus('playing');
        setTimeLeft(90);
        startTimer();
    }, [startTimer, clearTimer]);

    const loadQuestions = useCallback(async () => {
        setLoading(true); setError(''); setWordQuestions([]); setCurrentQuestion(null); setIsGameOver(false); setGameStatus('playing'); setScore(0); setCurrentIndex(0);
        clearTimer();
        if (!token) { setError("Oyunu oynamak için giriş yapmalısınız."); setLoading(false); return; }
        try {
            const questions = await fetchWordleQuestions(token); // Servisten çağır
            if (Array.isArray(questions) && questions.length > 0) {
                const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
                setWordQuestions(shuffledQuestions);
                setupQuestion(shuffledQuestions[0]); // İlk soruyu ayarla
            } else {
                setError("Bu formatta uygun soru bulunamadı.");
                 setIsGameOver(true); setGameStatus('no_questions');
            }
        } catch (err) {
             setError(err.message || "Sorular yüklenirken bir hata oluştu.");
             setIsGameOver(true); setGameStatus('error');
        } finally {
            setLoading(false);
        }
    }, [token, setupQuestion, clearTimer]);

    // Liderlik tablosunu çekme fonksiyonu (varsayım)
     const fetchLeaderboard = useCallback(async () => {
         setLeaderboardLoading(true);
         setLeaderboardError('');
         try {
             // const response = await axios.get(`${API_BASE_URL}/api/leaderboard/wordle`, { headers: { Authorization: `Bearer ${token}` } });
             // setLeaderboard(response.data || []);
             console.log("Leaderboard fetching not implemented yet."); // Placeholder
             setLeaderboard([]); // Şimdilik boş
         } catch (err) {
             console.error("Liderlik tablosu çekilirken hata:", err);
             setLeaderboardError("Liderlik tablosu yüklenemedi.");
         } finally {
             setLeaderboardLoading(false);
         }
     }, [token]); // Token bağımlılığı eklendi

    useEffect(() => {
        loadQuestions();
        return () => clearTimer();
    }, [loadQuestions]);

    useEffect(() => {
        if (gameStatus === 'won' || gameStatus === 'lost') {
            fetchLeaderboard();
            // TODO: Skor kaydetme isteği
        }
    }, [gameStatus, fetchLeaderboard]); // fetchLeaderboard bağımlılığı eklendi

    const handleSubmitGuess = useCallback((guess) => {
        // ... (Harf durumu hesaplama logic'i aynı kalır) ...
        const newLetterStatuses = { ...letterStatuses };
        const statuses = Array(wordLength).fill('absent');
        const answerLetters = correctAnswer.split('');
        const guessLetters = guess.split('');
        for (let i = 0; i < wordLength; i++) { if (guessLetters[i] === answerLetters[i]) { statuses[i] = 'correct'; newLetterStatuses[guessLetters[i]] = 'correct'; answerLetters[i] = null; }}
        for (let i = 0; i < wordLength; i++) { if (statuses[i] !== 'correct') { const letterIndexInAnswer = answerLetters.indexOf(guessLetters[i]); if (letterIndexInAnswer !== -1) { statuses[i] = 'present'; if (newLetterStatuses[guessLetters[i]] !== 'correct') { newLetterStatuses[guessLetters[i]] = 'present'; } answerLetters[letterIndexInAnswer] = null; }}}
        for (let i = 0; i < wordLength; i++) { if (statuses[i] === 'absent') { if (!newLetterStatuses[guessLetters[i]]) { newLetterStatuses[guessLetters[i]] = 'absent'; }}}

        // TODO: gridStatuses state'ini güncelle (statuses dizisi ile)

        setLetterStatuses(newLetterStatuses);

        if (guess === correctAnswer) {
            setIsGameOver(true); setGameStatus('won'); clearTimer();
            const points = Math.max(10, timeLeft * 10); setScore(prev => prev + points);
            toast({ title: "Tebrikler!", description: `Kelimeyi ${currentAttempt + 1}. denemede buldunuz! +${points} puan!`, status: "success", duration: 5000, isClosable: true, position: "top" });
        } else if (currentAttempt + 1 >= MAX_GUESSES) {
            setIsGameOver(true); setGameStatus('lost'); clearTimer();
            toast({ title: "Oyun Bitti!", description: `Deneme hakkınız kalmadı. Doğru kelime: ${correctAnswer}`, status: "error", duration: null, isClosable: true, position: "top" });
        } else {
            setCurrentAttempt(prev => prev + 1);
        }
    }, [correctAnswer, wordLength, currentAttempt, letterStatuses, toast, clearTimer, timeLeft]);

    const handleKeyPress = useCallback((key) => {
        if (gameStatus !== 'playing' || currentAttempt >= MAX_GUESSES) return;
        const currentGuess = guesses[currentAttempt];

        if (key === 'ENTER') {
            if (currentGuess.length === wordLength) { handleSubmitGuess(currentGuess); }
            else { toast({ title: "Uyarı", description: `${wordLength} harf girmelisiniz.`, status: "warning", duration: 1500, isClosable: true, position: "top" }); }
        } else if (key === 'BACKSPACE') {
            setGuesses(prev => { const ng = [...prev]; ng[currentAttempt] = currentGuess.slice(0, -1); return ng; });
        } else if (currentGuess.length < wordLength && /^[a-zA-ZÇĞİÖŞÜ]$/i.test(key)) {
            setGuesses(prev => { const ng = [...prev]; ng[currentAttempt] += key.toUpperCase(); return ng; });
        }
    }, [gameStatus, currentAttempt, guesses, wordLength, toast, handleSubmitGuess]); // handleSubmitGuess eklendi

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (isGameOver) return;
            const key = event.key;
            if (key === 'Enter') { handleKeyPress('ENTER'); }
            else if (key === 'Backspace') { handleKeyPress('BACKSPACE'); }
            else if (key.length === 1 && key.match(/[a-zçğüöşöi]/i)) { handleKeyPress(key); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => { window.removeEventListener('keydown', handleKeyDown); };
    }, [handleKeyPress, isGameOver]);

    // --- İskelet Komponentler (Tema ile Uyumlu) ---

    // GridCell (Hook dışından alınan renklerle)
    const GridCell = ({ letter, status, isCurrentRow }) => {
        const bg = status === 'correct' ? 'green.500'
                 : status === 'present' ? 'yellow.500'
                 : status === 'absent' ? 'gray.500'
                 : cellBgIdle; // Dışarıdan alınan değer
        const color = status === 'correct' || status === 'present' || status === 'absent' ? 'white' : 'inherit';
        const borderColor = status === 'idle' ? cellBorderIdle : 'transparent'; // Dışarıdan alınan değer

        return (
            // Center tema stillerini (boyut, renk, border, radius, font) kullanır
            <Center
                w={{base:"3rem", md:"3.5rem"}} h={{base:"3rem", md:"3.5rem"}}
                bg={bg} color={color}
                borderWidth="2px" borderColor={borderColor} borderRadius="md"
                fontSize={{base:"xl", md:"2xl"}} fontWeight="bold" textTransform="uppercase"
                transition="all 0.2s ease-in-out"
            >
                {letter}
            </Center>
        );
    };

    // GuessGrid (Aynı kalabilir, GridCell'i kullanır)
    const GuessGrid = ({ guesses, currentAttempt, wordLength, statuses }) => (
        <VStack spacing={1.5} mb={8}>
            {guesses.map((guess, rowIndex) => (
                <HStack key={rowIndex} spacing={1.5}>
                    {Array.from({ length: wordLength }).map((_, colIndex) => (
                        <GridCell
                            key={colIndex}
                            letter={guess[colIndex] || ''}
                            status={statuses?.[rowIndex]?.[colIndex] || 'idle'} // Gerçek status ile güncellenmeli
                            isCurrentRow={rowIndex === currentAttempt}
                        />
                    ))}
                </HStack>
            ))}
        </VStack>
    );

    // Keyboard (Button tema stillerini kullanır)
    const Keyboard = ({ onKeyPress, letterStatuses }) => {
        const rows = ["QWERTYUIOPĞÜ", "ASDFGHJKLŞİ", "ZXCVBNMÖÇ"];
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
                             else if (status === 'absent') colorScheme = keyboardAbsentColorScheme; // Dışarıdan alınan değer

                             // Absent tuşlar için variant'ı dinamik yapalım
                             const variant = status === 'absent' ? keyboardAbsentVariant : 'solid';

                            return (
                                // Button tema stilini (boyut, renk şeması, varyant) kullanır
                                <Button
                                    key={key}
                                    onClick={() => onKeyPress(key)}
                                    size="sm" h={12} flex={1}
                                    minW={{base:"1.8rem", sm:"2.2rem"}} px={1}
                                    colorScheme={colorScheme}
                                    variant={variant} // Dinamik variant
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
    // --- İskelet Komponentler Sonu ---


    // --- Render Bölümü (Tema ile Uyumlu) ---

    if (loading) return (<Container centerContent py={10}><Spinner size="xl" color="brand.500"/></Container>);

    if (error && gameStatus === 'error') return (
        <Container maxW="container.md" mt={10}>
             <Alert status="error" variant="left-accent" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={10} borderRadius="lg">
                 <AlertIcon boxSize="40px" mr={0} as={FaExclamationTriangle} />
                 <AlertTitle mt={4} mb={1} fontSize="xl">Bir Hata Oluştu</AlertTitle>
                 <AlertDescription maxWidth="sm" mb={5}>{error}</AlertDescription>
                 <Button colorScheme="red" variant="outline" onClick={loadQuestions} leftIcon={<Icon as={FaRedo} />}> Tekrar Dene </Button>
            </Alert>
        </Container>
    );

    // Oyun Bitti veya Soru Yok Ekranı
    if (isGameOver) {
         const gameWon = gameStatus === 'won';
         const noQuestionsFound = gameStatus === 'no_questions';

        return (
            <Container maxW="container.md" py={8}>
                 {/* Card, Heading, Text, Stat, List, Button tema stillerini kullanır */}
                <Card variant="outline" textAlign="center" p={{base: 6, md: 10}} mt={10}>
                    <CardBody>
                        <Heading as="h2" size={gameWon ? "2xl" : "xl"} mb={4} color={gameWon ? 'green.500' : (noQuestionsFound ? 'orange.500' : 'red.500')}>
                            {gameWon ? 'Tebrikler!' : (noQuestionsFound ? 'Soru Bulunamadı' : 'Oyun Bitti!')}
                        </Heading>

                        {gameWon && (
                            <>
                                <Text fontSize="lg" mb={4}>Kelimeyi <Text as="span" fontWeight="bold">{currentAttempt + 1}</Text>. denemede buldunuz!</Text>
                                 <StatGroup justifyContent="center" mb={6}>
                                    <Stat>
                                        <StatLabel>Toplam Skor</StatLabel>
                                        <StatNumber fontSize="4xl" color="brand.500">{score}</StatNumber>
                                    </Stat>
                                </StatGroup>
                            </>
                        )}
                        {!gameWon && !noQuestionsFound && (
                             <Text fontSize="lg" mb={4}>Deneme hakkınız kalmadı. Doğru kelime: <Text as="span" fontWeight="bold" letterSpacing="wider">{correctAnswer}</Text></Text>
                        )}
                        {noQuestionsFound && (
                            <Text color="textMuted" mb={6}>Oyun için uygun soru bulunamadı.</Text>
                        )}

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
            {/* Heading tema stilini kullanır */}
            <Heading as="h1" size="lg" textAlign="center" mb={4}>Kelime Çalışması</Heading>
            {/* Skor ve Zamanlayıcı - Flex, HStack, Text tema stillerini/semantic token'ları kullanır */}
            <Flex justify="space-between" align="center" mb={6} p={3} px={4} borderRadius="md" bg="bgSecondary" borderWidth="1px" borderColor="borderPrimary" maxW="lg" mx="auto">
                 <HStack>
                    <Text fontSize="sm" color="textMuted">Skor:</Text>
                    <Text fontWeight="bold" fontSize="lg" color="brand.500">{score}</Text>
                </HStack>
                <HStack>
                    <Text fontSize="sm" color="textMuted">Kalan Deneme:</Text>
                    <Text fontWeight="bold" fontSize="lg" color="textPrimary">{MAX_GUESSES - currentAttempt}</Text>
                </HStack>
                 <HStack>
                    <Icon as={FiClock} color="textMuted" />
                    <Text fontWeight="semibold" fontSize="lg" color="textPrimary">{formatTime(timeLeft)}</Text>
                </HStack>
            </Flex>

            {/* Soru Metni - Text tema stilini (textPrimary) kullanır */}
             <Text fontSize={{base:"lg", md:"xl"}} color="textPrimary" textAlign="center" mb={6} px={4} minH="3em" fontStyle="italic">
                 "{currentQuestion?.text}"
             </Text>

            {/* Tahmin Izgarası - İçindeki GridCell tema stillerini kullanır */}
             <GuessGrid
                 guesses={guesses}
                 currentAttempt={currentAttempt}
                 wordLength={wordLength}
                 statuses={[]} // Gerçek grid durumu (gridStatuses) buraya gelmeli
             />

             {/* Sanal Klavye - İçindeki Button tema stillerini kullanır */}
             <Keyboard onKeyPress={handleKeyPress} letterStatuses={letterStatuses} />

        </Container>
    );
}

export default WordPracticePage;