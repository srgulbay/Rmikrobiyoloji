import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '@chakra-ui/react'; // Tema için
import { useLocation, Link } from 'react-router-dom';
import { fetchWordleQuestions } from '../services/quizService';
import { FaInfoCircle, FaExclamationTriangle, FaRedo, FaArrowRight, FaLightbulb } from 'react-icons/fa';
import { FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";
import Leaderboard from '../components/Leaderboard';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const formatTime = totalSeconds => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// Kelime oyunu component'i
function WordPracticePage() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(true);
    const [leaderboardError, setLeaderboardError] = useState('');
    const [wordQuestions, setWordQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [correctAnswer, setCorrectAnswer] = useState('');
    // revealedAnswer artık kullanılmıyor, kutuları cevap uzunluğuna göre oluşturacağız
    const [userGuess, setUserGuess] = useState('');
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isGameOver, setIsGameOver] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();
    const { colorMode } = useColorMode(); // Gerekirse kullan
    const timerRef = useRef(null);
    const inputRef = useRef(null);
    const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    setLeaderboardError('');
    try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}; // ✅ sadece token varsa ekle
        const response = await axios.get(`${API_BASE_URL}/api/stats/wordle-leaderboard`, {
            headers
        });
        setLeaderboard(response.data || []);
    } catch (err) {
        console.error("Lider tablosu çekilirken hata:", err);
        setLeaderboardError("Lider tablosu yüklenemedi.");
        setLeaderboard([]);
    } finally {
        setLeaderboardLoading(false);
    }
}, [token]);


    // Soruları çekme
    const loadQuestions = useCallback(async () => {
        setLoading(true); setError(''); setWordQuestions([]); setCurrentQuestion(null); setIsGameOver(false); setScore(0); setCurrentIndex(0);
        clearTimer(); // Timer'ı temizle

        if (!token) { setError("Oyunu oynamak için giriş yapmalısınız."); setLoading(false); return; }
        try {
            const questions = await fetchWordleQuestions(token);
            if (questions && questions.length > 0) {
                const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
                setWordQuestions(shuffledQuestions);
                setupQuestion(shuffledQuestions[0]); // İlk soruyu kur
            } else {
                setError("Bu formatta uygun soru bulunamadı.");
            }
        } catch (err) {
            setError(err.message || "Sorular yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }, [token]); // Bağımlılık doğru

    // Yeni soruyu kurma fonksiyonu
    const setupQuestion = (question) => {
        if (!question || !question.answerWord) {
            console.error("Geçersiz soru verisi:", question);
            setIsGameOver(true);
            return;
        };
        setCurrentQuestion(question);
        const answer = question.answerWord.toUpperCase();
        setCorrectAnswer(answer);
        setUserGuess(''); // Tahmini temizle
        setFeedback({ message: '', type: '' });
        setIsAnswerSubmitted(false);
        setTimeLeft(30); // Zamanlayıcıyı resetle
        if (inputRef.current) inputRef.current.focus();
        startTimer();
    };

    // Zamanlayıcı yönetimi
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
                    handleTimeUp();
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);
    }, [clearTimer]); // handleTimeUp bağımlılığı kaldırıldı

    const handleTimeUp = useCallback(() => {
        if (isAnswerSubmitted) return;
        setIsAnswerSubmitted(true);
        setFeedback({ message: `Süre doldu! Cevap: ${correctAnswer}`, type: 'warning' });
    }, [correctAnswer, isAnswerSubmitted]);

    useEffect(() => {
        loadQuestions();
        return () => clearTimer();
    }, [loadQuestions, clearTimer]);
    useEffect(() => {
    if (isGameOver) {
        fetchLeaderboard();
    }
    }, [isGameOver, fetchLeaderboard]); // Oyun bitince leaderboard'u çek
    // Tahmini kontrol et
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
        } else {
            setFeedback({ message: `Yanlış! Doğru cevap: ${correctAnswer}`, type: 'error'});
        }
        // Input'u temizlemeye gerek yok, cevap gösterilecek
    }, [userGuess, isAnswerSubmitted, correctAnswer, timeLeft, clearTimer]);

    // Input değişikliği - Rakamlara izin ver, uzunluğu kontrol et
    const handleInputChange = useCallback((event) => {
         // Sadece harf ve rakamları al, boşlukları kaldır, büyük harfe çevir
        const newValue = event.target.value.replace(/[^a-zA-Z0-9ÇĞİÖŞÜçğüöşİ]/g, '').toUpperCase();
        // Cevap uzunluğunu geçmemesini sağla
        if (newValue.length <= correctAnswer.length) {
             setUserGuess(newValue);
        }
    }, [correctAnswer]); // correctAnswer değişince güncellenmeli

    // Sonraki soruya geçiş
    const goToNextQuestion = useCallback(() => {
        if (!isAnswerSubmitted) return;
        const nextIndex = currentIndex + 1;
        if (nextIndex < wordQuestions.length) {
            setCurrentIndex(nextIndex);
            setupQuestion(wordQuestions[nextIndex]);
        } else {
            setIsGameOver(true);
        }
    }, [currentIndex, wordQuestions, isAnswerSubmitted, setupQuestion]); // setupQuestion eklendi

    // --- Render Bölümü ---
    if (loading) {
         return ( <div className="container py-8 animate-pulse"> <div className="h-8 bg-[var(--bg-tertiary)] rounded w-1/3 mx-auto mb-8"></div> <div className="h-12 bg-[var(--bg-secondary)] rounded mb-6"></div> <div className="card max-w-2xl mx-auto p-8"> <div className="h-6 bg-[var(--bg-tertiary)] rounded w-3/4 mx-auto mb-6"></div> <div className="flex justify-center gap-2 mb-6"> {[...Array(7)].map((_, i)=><div key={i} className="h-12 w-10 bg-[var(--bg-tertiary)] rounded"></div>)} </div> <div className="h-10 bg-[var(--bg-tertiary)] rounded w-full"></div> </div> </div> );
    }
    if (error) {
        return ( <div className="container mt-6"> <div className="card card-accented-error text-center py-8"> <FaExclamationTriangle className='mb-4 text-4xl text-[var(--feedback-error)] mx-auto' /> <h3 className='h4 mb-3 text-[var(--text-primary)]'>Bir Hata Oluştu</h3> <p className="text-muted mb-5">{error}</p> <button onClick={loadQuestions} className="btn btn-danger"><FaRedo className='btn-icon'/> Tekrar Dene</button> </div> </div> );
    }
    if (isGameOver || (!loading && !currentQuestion)) { // Hata durumu zaten yukarıda handle edildi
        const gameFinished = isGameOver && wordQuestions.length > 0 && currentIndex >= wordQuestions.length -1; // Oyun bitti mi kontrolü
        const noQuestionsFound = !loading && wordQuestions.length === 0; // Hiç soru bulunamadı mı?

        return (
            <div className="container py-8"> {/* Flex kaldırıldı */}
                 {/* Kartı yatayda ortala ve yukarıdan boşluk ver */}
                <div className={`card quiz-finished-card text-center mx-auto mt-10 ${gameFinished ? 'card-accented-success' : 'card-accented-warning'}`} style={{ maxWidth: '550px' }}> {/* Max genişlik artırıldı */}
                    <h2 className="h1 mb-4">{gameFinished ? 'Oyun Bitti!' : 'Soru Bulunamadı'}</h2>
                    {gameFinished && (
                        <>
                            <p className="text-lg mb-4">Tebrikler, tüm soruları tamamladınız!</p>
                            {/* ... skor dl ... */}
                             <dl className="my-6 text-left border-t border-b border-[var(--border-secondary)] py-5">
                                 <div className="flex justify-between mb-3"> <dt className="text-secondary">Toplam Skor:</dt> <dd className="font-semibold text-xl text-[var(--accent-primary)]">{score}</dd> </div>
                             </dl>
                        </>
                    )}
                     {/* Soru bulunamama veya yüklenememe durumu için mesaj */}
                     {(noQuestionsFound || (!gameFinished && !loading && !currentQuestion)) && (
                        <p className="text-muted mb-6">Oyun için uygun soru bulunamadı veya yüklenirken bir hata oluştu.</p>
                    )}

                    <Leaderboard data={leaderboard} loading={leaderboardLoading} error={leaderboardError} />

                    <button className="btn btn-primary btn-lg btn-restart mt-8" onClick={loadQuestions}>
                         <FaRedo className="btn-icon" /> {gameFinished ? 'Tekrar Oyna' : 'Yeni Oyun Başlat'}
                    </button>
                 </div>
            </div>
        );
    }

    // --- Aktif Oyun Arayüzü ---
    return (
        <div className="container py-6 word-practice-page">
            <h1 className="h2 text-center mb-4">Kelime Çalışması</h1>
            <div className="flex justify-between items-center mb-6 p-3 px-4 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-primary)] max-w-md mx-auto text-sm">
                <div className='flex items-center gap-2'> <span className='text-muted'>Skor:</span> <span className='font-bold text-lg text-[var(--accent-primary)]'>{score}</span> </div>
                <div className='flex items-center gap-2'> <FiClock className="text-muted" /> <span className='font-semibold text-lg'>{formatTime(timeLeft)}</span> </div>
            </div>

            <div className="card max-w-2xl mx-auto p-6 md:p-8 shadow-lg">
                <div className='card-body text-center'> {/* Kart içeriğini ortala */}
                    {/* SORU METNİ ALANI EKLENDİ */}
                    <p className="question-text text-xl text-primary mb-8">
                         {currentQuestion.text}
                    </p>

                    {/* Cevap Kutucukları */}
                    <div className="word-display flex flex-wrap justify-center gap-2 mb-6">
                         {/* Doğru cevap uzunluğu kadar kutu oluştur */}
                         {Array.from({ length: correctAnswer.length }).map((_, index) => {
                             const char = correctAnswer[index];
                             const isRevealed = index === 0 || isAnswerSubmitted; // İlk harf veya cevap gönderildiyse
                             return (
                                 <span key={index} className={`word-letter-box ${isRevealed ? 'revealed-final' : ''} ${index === 0 ? 'revealed-initial' : ''}`}>
                                     {/* Sadece ilk harfi veya cevap gönderildiyse göster */}
                                     {isRevealed ? char : ''}
                                 </span>
                             );
                         })}
                    </div>

                     {/* Geri Bildirim */}
                     {feedback.message && ( <div className={`alert text-sm mb-4 ${feedback.type === 'success' ? 'alert-success' : feedback.type === 'error' ? 'alert-danger' : 'alert-warning'}`}> {feedback.type === 'success' && <FiCheckCircle className='alert-icon'/>} {feedback.type === 'error' && <FiXCircle className='alert-icon'/>} {feedback.type === 'warning' && <FaExclamationTriangle className='alert-icon'/>} <span className='alert-content'>{feedback.message}</span> </div> )}

                    {/* Tahmin Girişi veya Sonraki Soru */}
                    {!isAnswerSubmitted ? (
                         <form onSubmit={handleGuessSubmit} className='flex flex-col sm:flex-row gap-3 justify-center items-center mt-4 max-w-sm mx-auto'>
                             <input
                                 ref={inputRef}
                                 type="text"
                                 className="form-input flex-grow text-center uppercase text-xl tracking-wider font-semibold font-mono word-guess-input"
                                 value={userGuess}
                                 onChange={handleInputChange}
                                 maxLength={correctAnswer.length}
                                 placeholder={"_ ".repeat(correctAnswer.length)}
                                 autoFocus
                                 disabled={isAnswerSubmitted}
                                 aria-label="Tahmininizi girin"
                                 autoComplete='off'
                             />
                             <button type="submit" className="btn btn-primary w-full sm:w-auto px-6" disabled={!userGuess || userGuess.length !== correctAnswer.length}>
                                 Tahmin Et
                             </button>
                         </form>
                    ) : (
                        <button onClick={goToNextQuestion} className='btn btn-secondary mt-4'>
                            Sonraki Soru <FaArrowRight className='ml-2'/>
                        </button>
                    )}
                </div>
            </div>
             <p className='text-center text-muted text-sm mt-6'> Kelimeyi tahmin etmek için kutucuklara yazın ve "Tahmin Et" butonuna tıklayın veya Enter'a basın. </p>
        </div>
    );
}

export default WordPracticePage;
