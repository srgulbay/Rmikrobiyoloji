import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '@chakra-ui/react'; // Gece modu için eklendi
import { useLocation } from 'react-router-dom'; // topicId okumak için eklendi
import { FaArrowLeft, FaArrowRight, FaCheck, FaFlagCheckered, FaSpinner, FaRedo, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const formatTime = totalSeconds => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// Gece/Gündüz modu uyumlu arka plan rengi hesaplama
const getDifficultyBgVariable = (stats, colorMode, minAttempts = 5) => {
    if (!stats || stats.totalAttempts < minAttempts) {
        return null; // CSS varsayılanı (--bg-primary) uygular
    }
    const hue = Math.max(0, Math.min(120, stats.accuracy * 1.2));
    // OKLCH(lightness chroma hue / alpha)
    if (colorMode === 'dark') {
        return `oklch(0.2 0.04 ${hue} / 0.7)`; // Gece modu: %20 açıklık, %4 renk yoğunluğu
    } else {
        return `oklch(0.96 0.03 ${hue} / 0.6)`; // Açık tema: %96 açıklık, %3 renk yoğunluğu
    }
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
    const { colorMode } = useColorMode(); // Renk modunu al
    const location = useLocation(); // URL bilgisini almak için

    const urls = {
        questions: `${API_BASE_URL}/api/questions`,
        attempts:  `${API_BASE_URL}/api/attempts`,
        stats:     `${API_BASE_URL}/api/stats/questions`
    };

    const initializeQuiz = useCallback(async () => {
        setLoading(true); setError(''); setScore(0);
        setIsQuizFinished(false); setSelectedAnswer(''); setIsAnswerChecked(false);
        setIsCorrect(null); setTimeElapsed(0); setQuestionStatsMap({});
        clearInterval(timerRef.current); // Önceki zamanlayıcıyı temizle
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
                 // Backend'in topicId aldığında alt konuları da getireceğini varsayıyoruz
                questionsUrl += `?topicId=${topicIdFilter}`;
                console.log("Fetching questions for topic:", topicIdFilter);
            } else {
                 console.log("Fetching all random questions");
            }

            const [qRes, sRes] = await Promise.all([
                axios.get(questionsUrl, config),
                axios.get(urls.stats, config) // Genel soru istatistikleri
            ]);

            const questionsData = qRes.data || [];
            if (questionsData.length) {
                const finalQuestions = topicIdFilter ? questionsData : [...questionsData].sort(() => Math.random() - 0.5);
                setAllQuestions(finalQuestions);
                setCurrentQuestion(finalQuestions[0]);
                setQuestionStatsMap(sRes.data || {});
                setTimeElapsed(0); // Zamanı sıfırla
            } else {
                setError(topicIdFilter ? 'Bu konuya ait soru bulunamadı.' : 'Uygun soru bulunamadı.');
                setAllQuestions([]); // Soru listesini boşalt
                setCurrentQuestion(null);
            }
        } catch (err) {
            console.error("Quiz verisi çekilirken hata:", err);
            setError('Sorular veya istatistikler yüklenirken bir hata oluştu.');
             setAllQuestions([]); // Hata durumunda listeyi boşalt
             setCurrentQuestion(null);
        } finally {
            setLoading(false);
        }
    }, [token, urls.questions, urls.stats, location.search]); // location.search bağımlılığa eklendi

    useEffect(() => {
        initializeQuiz();
         // Component unmount olduğunda zamanlayıcıyı temizlediğimizden emin olalım
        return () => {
            clearInterval(timerRef.current);
             timerRef.current = null;
        };
    }, [initializeQuiz]); // Sadece initializeQuiz değiştiğinde çalışır

    useEffect(() => {
        if (!loading && allQuestions.length > 0 && !isQuizFinished) {
            if (!timerRef.current) {
                timerRef.current = setInterval(() => {
                    setTimeElapsed(t => t + 1);
                }, 1000);
            }
        } else {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
         // Bu effect'in cleanup fonksiyonu, zamanlayıcıyı durdurmalı
         return () => {
             clearInterval(timerRef.current);
             timerRef.current = null;
         };
    }, [loading, allQuestions, isQuizFinished]); // allQuestions bağımlılığa eklendi

    const selectOption = useCallback((opt) => {
        if (!isAnswerChecked) {
            setSelectedAnswer(opt);
        }
    }, [isAnswerChecked]);

    const checkAnswer = useCallback(async () => {
        if (!selectedAnswer || !currentQuestion) return;
        const correct = selectedAnswer === currentQuestion.correctAnswer;
        setIsAnswerChecked(true);
        setIsCorrect(correct);
        if (correct) setScore(s => s + 1);
        if (token) {
            try { await axios.post(urls.attempts, { questionId: currentQuestion.id, selectedAnswer, isCorrect: correct }, { headers: { Authorization: `Bearer ${token}` } }); }
            catch (err) { console.error("Deneme kaydedilirken hata:", err); }
        }
    }, [selectedAnswer, currentQuestion, token, urls.attempts]);

    const goTo = useCallback((index) => {
        if (index < 0 || index >= allQuestions.length) return;
        // İsteğe bağlı: Geçiş animasyonu için state güncellemesi
        // setAnimating(true);
        // setTimeout(() => {
            setCurrentQuestion(allQuestions[index]);
            setCurrentQuestionIndex(index);
            setSelectedAnswer('');
            setIsAnswerChecked(false);
            setIsCorrect(null);
            setError('');
            // setAnimating(false);
        // }, 300); // Animasyon süresi kadar bekleme
    }, [allQuestions]);

    const prev = useCallback(() => goTo(currentQuestionIndex - 1), [goTo, currentQuestionIndex]);
    const next = useCallback(() => goTo(currentQuestionIndex + 1), [goTo, currentQuestionIndex]); // Cevap kontrol şartı kaldırıldı

    const finish = useCallback(() => {
        if (window.confirm('Testi bitirmek istediğinizden emin misiniz?')) {
            setIsQuizFinished(true);
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const currentQStats = useMemo(() => questionStatsMap[currentQuestion?.id], [questionStatsMap, currentQuestion]);
    const difficultyBg = useMemo(() => getDifficultyBgVariable(currentQStats, colorMode), [currentQStats, colorMode]);
    // --- Render Bölümü ---
    if (loading) {
        // Daha açıklayıcı bir iskelet yükleme ekranı
        return (
            <div className="container py-8 animate-pulse"> {/* Pulse animasyonu için Tailwind benzeri sınıf varsayımı veya CSS'e ekle */}
                {/* Header Skeleton */}
                <div className="h-[50px] bg-gray-300 dark:bg-gray-700 rounded-md mb-6"></div>
                {/* Question Card Skeleton */}
                <div className="h-[250px] bg-gray-300 dark:bg-gray-700 rounded-lg mb-6"></div>
                {/* Options Grid Skeleton */}
                <div className="answer-options-grid mb-6">
                    {[...Array(5)].map((_, i) => (
                         <div key={i} className="h-[50px] bg-gray-300 dark:bg-gray-700 rounded-md"></div>
                    ))}
                </div>
                 {/* Controls Skeleton */}
                <div className="h-[60px] bg-gray-300 dark:bg-gray-700 rounded-md"></div>
            </div>
            // VEYA daha önceki CSS iskelet sınıflarını kullan:
            // <div className="container py-8">
            //      <div className="skeleton skeleton-animated mb-6" style={{ height: '50px', width: '100%', borderRadius: 'var(--border-radius-md)' }}></div>
            //      <div className="skeleton skeleton-animated mb-6" style={{ height: '250px', width: '100%', borderRadius: 'var(--border-radius-lg)' }}></div>
            //      <div className="answer-options-grid mb-6">
            //          {[...Array(5)].map((_, i) => ( <div key={i} className="skeleton skeleton-animated" style={{ height: '50px', borderRadius: 'var(--border-radius-md)' }}></div> ))}
            //      </div>
            //      <div className="skeleton skeleton-animated" style={{ height: '60px', width: '100%', borderRadius: 'var(--border-radius-md)' }}></div>
            // </div>
        );
    }

    if (error && !currentQuestion) { // Soru yüklenemedi hatası
        return (
            <div className="container mt-6">
                {/* Hata mesajı için alert bileşeni */}
                <div className="alert alert-danger" role="alert">
                    <FaExclamationTriangle className='alert-icon' />
                    <div className="alert-content">
                         <p className='font-semibold'>Hata!</p>
                         <p>{error}</p>
                    </div>
                </div>
                 <button onClick={initializeQuiz} className="btn btn-secondary mt-4">
                    <FaRedo className="btn-icon"/> Tekrar Dene
                 </button>
            </div>
        );
    }

    if (isQuizFinished) {
        const accuracy = allQuestions.length > 0 ? ((score / allQuestions.length) * 100).toFixed(0) : 0;
        // Başarıya göre renk sınıfını belirle (CSS'te .text-success vb tanımlı olmalı)
        const accuracyColorClass = accuracy >= 80 ? 'text-success' : accuracy >= 50 ? 'text-warning' : 'text-danger';

        return (
             <div className="container py-8 d-flex justify-center align-center">
                 {/* Bitiş kartı */}
                <div className="card quiz-finished-card text-center" style={{ maxWidth: '500px' }}>
                     <h2 className="h1 mb-4">Test Tamamlandı!</h2>
                      {/* Tanım listesi ile daha düzenli istatistikler */}
                     <dl className="my-6 text-left" style={{ borderTop: '1px solid var(--border-secondary)', borderBottom: '1px solid var(--border-secondary)', padding: 'var(--space-5) 0' }}>
                         <div className="d-flex justify-between mb-3">
                             <dt className="text-secondary">Geçen Süre:</dt>
                             <dd className="font-semibold">{formatTime(timeElapsed)}</dd>
                         </div>
                         <div className="d-flex justify-between mb-3">
                             <dt className="text-secondary">Toplam Soru:</dt>
                             <dd className="font-semibold">{allQuestions.length}</dd>
                         </div>
                         <div className="d-flex justify-between">
                             <dt className="text-secondary">Doğru Cevap:</dt>
                             <dd className="font-semibold">{score}</dd>
                         </div>
                     </dl>

                    <p className="text-lg font-semibold mb-1">Başarı Oranınız:</p>
                     {/* Renk sınıfını uygula */}
                    <p className={`final-score mb-6 ${accuracyColorClass}`}>
                        %{accuracy}
                    </p>

                    <button className="btn btn-primary btn-lg btn-restart" onClick={initializeQuiz}>
                         <FaRedo className="btn-icon" /> Yeniden Başla
                    </button>
                 </div>
            </div>
        );
    }

    // Mevcut soru yoksa veya yüklenirken bir sorun olduysa (güvenlik önlemi)
    if (!currentQuestion) {
         return (
             <div className="container mt-6">
                 <div className="alert alert-warning" role="alert">
                     <FaInfoCircle className='alert-icon' />
                     <div className="alert-content">Gösterilecek soru bulunamadı. Lütfen tekrar deneyin veya farklı bir konu seçin.</div>
                 </div>
                 <button onClick={initializeQuiz} className="btn btn-secondary mt-4">
                     <FaRedo className="btn-icon"/> Tekrar Dene
                 </button>
             </div>
         );
    }


    // --- Ana Soru Çözme Arayüzü ---
    return (
        <div className="container py-6">
            {/* Başlık ve İstatistikler Alanı */}
            <div className="solve-page-header">
                <h2 className="h3 m-0">Soru {currentQuestionIndex + 1} / {allQuestions.length}</h2>
                <div className="d-flex gap-4 align-center flex-wrap">
                     <div className="stat">
                         <FiCheckCircle className="text-success" />
                         <span>Doğru: <span className="stat-value">{score}</span></span>
                     </div>
                     <div className="stat">
                          {/* text-muted sınıfının CSS'te tanımlı olduğunu varsayıyoruz */}
                         <FiClock className="text-muted" />
                         <span>Süre: <span className="stat-value">{formatTime(timeElapsed)}</span></span>
                     </div>
                </div>
            </div>

            {/* Soru Kartı */}
            <div
                // Sınıflar CSS'ten gelir
                className="card question-card my-6"
                // Hesaplanan arka planı CSS değişkeni ile uygula
                // Gece modu uyumu için JS tarafında hesaplama yapıldı
                style={{ '--question-bg-dynamic': difficultyBg || 'transparent', backgroundColor: 'var(--question-bg-dynamic, var(--bg-primary))' }}
            >
                 <div className="question-stats">
                    {/* CSS'te .question-stats span {...} ile boşluk ve stil ayarlanabilir */}
                     <span><strong>Konu:</strong> {currentQuestion.topic?.name || '-'}</span>
                     <span><strong>Genel Başarı:</strong> {currentQStats ? `%${currentQStats.accuracy}` : '-'} ({currentQStats ? `${currentQStats.totalAttempts}d` : '-'})</span>
                     <span><strong>Sınıf:</strong> {currentQuestion.classification || '-'}</span>
                 </div>
                 <hr className="my-4" />
                 {currentQuestion.imageUrl && (
                    // Resmi tıklayınca büyütecek bir modal eklenebilir (opsiyonel)
                    <img
                        className="question-image mb-4"
                        src={currentQuestion.imageUrl}
                        alt={`Soru ${currentQuestionIndex + 1} için görsel`}
                        loading="lazy" // Lazy loading
                    />
                 )}
                 <div
                    className="question-text"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentQuestion.text) }}
                 />
            </div>

            {/* Cevap Seçenekleri */}
            <div className="answer-options-grid mb-6">
                {['A', 'B', 'C', 'D', 'E'].map(opt => {
                    const optionText = currentQuestion[`option${opt}`];
                    if (!optionText) return null;

                    const isSelected = selectedAnswer === opt;
                    const isCorrectAnswer = opt === currentQuestion.correctAnswer;
                    const isIncorrectSelected = isSelected && !isCorrectAnswer;
                    const showAsPale = isAnswerChecked && !isCorrectAnswer && !isSelected;

                    // Daha okunaklı sınıf birleştirme
                    const buttonClasses = `btn ${
                        isAnswerChecked
                            ? (isCorrectAnswer ? 'correct' : isIncorrectSelected ? 'incorrect' : 'btn-secondary opacity-60') // Kontrol sonrası
                            : (isSelected ? 'selected btn-secondary' : 'btn-secondary') // Kontrol öncesi
                    }`;

                    return (
                        <button
                            key={opt}
                            className={buttonClasses}
                            onClick={() => selectOption(opt)}
                            disabled={isAnswerChecked}
                            aria-pressed={isSelected}
                        >
                            {/* Seçenek harfini daha belirgin yapalım */}
                            <span className='option-letter'>{opt})</span>
                            {/* Seçenek metnini sarmalayalım */}
                            <span className='option-text'>{optionText}</span>
                        </button>
                    );
                })}
            </div>

            {/* Kontrol Düğmeleri */}
            <div className="solve-page-controls">
                 {/* Geri Butonu (İkonlu) */}
                <button className="btn btn-secondary btn-icon-only" onClick={prev} disabled={currentQuestionIndex === 0} aria-label="Önceki Soru" title="Önceki Soru" >
                    <FaArrowLeft />
                </button>

                {/* Kontrol Et / Geri Bildirim */}
                <div className="text-center flex-grow-1">
                    {!isAnswerChecked ? (
                        <button className="btn btn-primary" onClick={checkAnswer} disabled={!selectedAnswer} aria-label="Cevabı Kontrol Et" >
                             <FaCheck className="btn-icon" /> Kontrol Et
                        </button>
                    ) : (
                        <span className={`feedback-text ${isCorrect ? 'correct-text' : 'incorrect-text'}`}>
                            {isCorrect ? <FiCheckCircle className="inline-block mr-2 align-middle" /> : <FiXCircle className="inline-block mr-2 align-middle" />}
                            {isCorrect ? 'Doğru!' : 'Yanlış'}
                        </span>
                    )}
                </div>

                {/* İleri / Bitir Butonları (İkonlu) */}
                {currentQuestionIndex < allQuestions.length - 1 ? (
                     <button className="btn btn-secondary btn-icon-only" onClick={next} aria-label="Sonraki Soru" title="Sonraki Soru">
                         <FaArrowRight />
                     </button>
                ) : (
                     <button className="btn btn-success btn-icon-only" onClick={finish} disabled={!isAnswerChecked} aria-label="Testi Bitir" title="Testi Bitir">
                         <FaFlagCheckered />
                     </button>
                )}
            </div>
        </div>
    );
} // SolvePage Sonu

// Component'i export et
export default SolvePage;
