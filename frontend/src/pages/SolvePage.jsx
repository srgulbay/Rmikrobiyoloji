import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import { useParams, Link } from 'react-router-dom'; // useParams ve Link eklendi

const formatTime = (totalSeconds) => { const minutes = Math.floor(totalSeconds / 60); const seconds = totalSeconds % 60; return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0'); };
const getDifficultyColor = (stats, minAttempts = 3) => { const saturation = '70%'; const lightness = '80%'; const defaultColor = '#f8f9fa'; if (!stats || stats.totalAttempts < minAttempts) { return defaultColor; } const accuracy = stats.accuracy; const hue = accuracy * 1.2; return `hsl(${hue}, ${saturation}, ${lightness})`; };

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

  const { topicId } = useParams(); // URL'den topicId parametresini al

  const backendQuestionsUrl = 'http://localhost:3001/api/questions';
  const backendAttemptsUrl = 'http://localhost:3001/api/attempts';
  const backendQuestionStatsUrl = 'http://localhost:3001/api/stats/questions';

  const initializeQuiz = useCallback(async () => {
    setLoading(true); setError(''); setScore(0); setIsQuizFinished(false);
    setSelectedAnswer(''); setIsAnswerChecked(false); setIsCorrect(null); setTimeElapsed(0);
    setQuestionStatsMap({});
    if (!token) { setError("Soruları ve istatistikleri görmek için giriş yapmalısınız."); setLoading(false); return; }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // URL'yi topicId'ye göre ayarla
      let questionsUrl = backendQuestionsUrl;
      if (topicId) {
         // Alt konuları da dahil etsin mi? Şimdilik evet.
         questionsUrl += `?topicId=${topicId}&includeSubtopics=true`;
      }

      // Soruları ve soru istatistiklerini çek
      const [questionsRes, statsRes] = await Promise.all([
          axios.get(questionsUrl, config), // Filtrelenmiş veya tüm sorular
          axios.get(backendQuestionStatsUrl, config)
      ]);

      if (questionsRes.data && questionsRes.data.length > 0) {
        // Filtreli gelince de karıştıralım
        const shuffledQuestions = [...questionsRes.data].sort(() => Math.random() - 0.5);
        setAllQuestions(shuffledQuestions);
        setCurrentQuestion(shuffledQuestions[0]);
        setCurrentQuestionIndex(0);
        setQuestionStatsMap(statsRes.data || {});
      } else { setError(topicId ? `Seçilen konu (ID: ${topicId}) için çözülecek soru bulunamadı.` : 'Çözülecek soru bulunamadı.'); setAllQuestions([]); setCurrentQuestion(null); }
    } catch (err) { console.error("Veri çekerken hata:", err); setError('Sorular veya istatistikler yüklenirken bir hata oluştu.'); }
    finally { setLoading(false); }
    // initializeQuiz bağımlılıklarına topicId eklendi
  }, [backendQuestionsUrl, backendQuestionStatsUrl, token, topicId]);

  useEffect(() => { initializeQuiz(); }, [initializeQuiz]);

  // Zamanlayıcı useEffect (Aynı)
  useEffect(() => { /* ... önceki kod ... */ }, [loading, allQuestions.length, isQuizFinished]);

  // Diğer Handler Fonksiyonlar (Aynı)
  const handleOptionSelect = (option) => { /* ... */ };
  const handleCheckAnswer = async () => { /* ... */ };
  const goToQuestion = (index) => { /* ... */ };
  const handlePreviousQuestion = () => { /* ... */ };
  const handleSkipOrNextQuestion = () => { /* ... */ };
  const handleFinishQuiz = () => { /* ... */ };
  const getOptionStyle = (option) => { /* ... */ };


  if (loading) return <p>Sorular ve İstatistikler yükleniyor...</p>;
  if (error && allQuestions.length === 0) return (
      <div>
          <p style={{ color: 'red' }}>Hata: {error}</p>
          <Link to="/browse">Konulara Geri Dön</Link> {/* /browse olacak şekilde güncelledik */}
      </div>
  );

  // Test Bitti Ekranı (Aynı)
  if (isQuizFinished) { /* ... önceki kod ... */ }
  if (!currentQuestion) return (
       <div>
           <p>Gösterilecek soru yok.</p>
           <Link to="/browse">Konulara Geri Dön</Link> {/* /browse olacak şekilde güncelledik */}
       </div>
   );


  const currentQuestionStats = questionStatsMap[currentQuestion.id];
  const questionBoxColor = getDifficultyColor(currentQuestionStats);

  // Soru Çözme Ekranı (Aynı)
  return ( <div> {/* ... Önceki JSX Kodu ... */} </div> );
}

export default SolvePage;