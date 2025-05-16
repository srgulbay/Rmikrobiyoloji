import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useInterval } from "usehooks-ts";
import {
  Box, Container, Flex, Button, IconButton, Heading, Text, SimpleGrid,
  Card, CardBody, Image, Alert, AlertIcon, AlertTitle, AlertDescription,
  Spinner, Icon,
  HStack, VStack, Center, Tag, useToast, List, ListItem,
  Divider, Collapse, Progress, useColorModeValue,
  Select, FormControl, FormLabel, Radio, RadioGroup, Stack, ScaleFade
} from '@chakra-ui/react';
import {
    FaArrowLeft, FaArrowRight, FaCheck, FaFlagCheckered, FaRedo,
    FaExclamationTriangle, FaInfoCircle, FaLightbulb, FaQuestion, FaClock, FaStopwatch,
    FaPencilAlt, FaFilter, FaPlay, FaBrain
} from 'react-icons/fa';
import { FiCheckCircle, FiXCircle, FiSettings } from "react-icons/fi";

import QuizSetupInterface from '../components/solve/QuizSetupInterface';
import QuizActiveInterface from '../components/solve/QuizActiveInterface';
import QuizFinishedScreen from '../components/solve/QuizFinishedScreen';
import SolvePageLoadingScreen from '../components/solve/SolvePageLoadingScreen';
import SolvePageErrorState from '../components/solve/SolvePageErrorState';

const initialLoadingMessages = [
  "Soru çözme motoru başlatılıyor...",
  "Kaynaklar taranıyor...",
  "Arayüz hazırlanıyor..."
];
const QUIZ_INIT_MESSAGE_DELAY = 500;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const DEFAULT_DENEME_DURATION_SECONDS_PER_QUESTION = 90;
const LOADING_MESSAGE_INTERVAL_SETUP = 1200;

const formatTime = totalSeconds => {
    if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const initialQuizState = {
    questions: [],
    currentQuestionIndex: 0,
    currentQuestion: null,
    selectedAnswer: '',
    isAnswerChecked: false,
    isCorrect: null,
    score: 0,
    isQuizFinished: false,
    timeElapsed: 0,
    questionStartTime: null,
    showExplanation: false,
    quizMode: 'practice',
    quizTitle: 'Soru Çözme Alanı',
    quizFixedDurationSeconds: null,
    srsEntryId: null,
    srsReturnPath: null,
    isSrsMode: false
};

const initialSetupFilters = {
    examClassificationId: '',
    branchId: '',
    topicId: '',
    numberOfQuestions: '',
};

function SolvePage() {
  const [pageStep, setPageStep] = useState('loading');
  const [quizState, setQuizState] = useState(initialQuizState);
  const [setupMode, setSetupMode] = useState('');
  const [setupFilters, setSetupFilters] = useState(initialSetupFilters);

  const [examClassifications, setExamClassifications] = useState([]);
  const [branchesForSetup, setBranchesForSetup] = useState([]);
  const [topicsForSetup, setTopicsForSetup] = useState([]);

  const [loadingMessage, setLoadingMessage] = useState('Sayfa ve kaynaklar hazırlanıyor...');
  const [error, setError] = useState('');
  const [isFetchingFilters, setIsFetchingFilters] = useState(false);

  const { user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const timerRef = useRef(null);
  const quizSessionIdRef = useRef(Date.now());
  const setupLoadingMessages = useMemo(() => [
    "Sınav türleri yükleniyor...", "Branşlar filtreleniyor...", "Konular listeleniyor...", "Neredeyse hazır!"
  ], []);
  const [currentSetupLoadingMsgIdx, setCurrentSetupLoadingMsgIdx] = useState(0);
  const quizLoadingMessages = useMemo(() => [
    "Quiz parametreleriniz işleniyor...", "Uygun sorular taranıyor...", "Soru seti derleniyor...", "Başlatılıyor!"
  ], []);

  const progressBarColor = useColorModeValue("brand.500", "brand.300");
  const timerInfoColor = useColorModeValue("gray.600", "gray.300");
  const quizInfoBg = useColorModeValue("gray.50", "gray.850");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const cardBg = useColorModeValue("white", "gray.750");
  const headingColor = useColorModeValue('gray.700', 'gray.100');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const textMutedColor = useColorModeValue("gray.500", "gray.400");
  const setupBoxBg = useColorModeValue("white", "gray.750");
  const inputSelectBg = useColorModeValue("white", "gray.600");

  const parseQueryParams = useCallback(() => new URLSearchParams(location.search), [location.search]);

  useInterval(() => {
    if (pageStep === 'loading' && setupLoadingMessages.length > 0) {
        setCurrentSetupLoadingMsgIdx(prev => (prev + 1) % setupLoadingMessages.length);
        setLoadingMessage(setupLoadingMessages[currentSetupLoadingMsgIdx]);
    } else if (pageStep === 'quiz_loading' && quizLoadingMessages.length > 0) {
        setCurrentSetupLoadingMsgIdx(prev => (prev + 1) % quizLoadingMessages.length); // Use same index for simplicity or create a new one
        setLoadingMessage(quizLoadingMessages[currentSetupLoadingMsgIdx]);
    } else if (pageStep === 'setup' && isFetchingFilters) {
        setLoadingMessage("Filtre seçenekleri güncelleniyor...");
    }
  }, (pageStep === 'loading' || pageStep === 'quiz_loading' || (pageStep === 'setup' && isFetchingFilters)) ? LOADING_MESSAGE_INTERVAL_SETUP : null);


  const fetchFilterData = useCallback(async (dataType, params = {}) => {
    if (!token) return;
    setIsFetchingFilters(true);
    setLoadingMessage(`${dataType === 'exam' ? 'Sınav türleri' : dataType === 'branch' ? 'Branşlar' : 'Konular'} yükleniyor...`);
    let url = '';
    switch (dataType) {
      case 'exam': url = `${API_BASE_URL}/api/exam-classifications`; break;
      case 'branch':
        if (!params.examClassificationId) { setIsFetchingFilters(false); return; }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const allBranchesRes = await axios.get(`${API_BASE_URL}/api/branches`, config);
            const allBranchesData = Array.isArray(allBranchesRes.data) ? allBranchesRes.data : [];
            const topicsForExamRes = await axios.get(`${API_BASE_URL}/api/topics?examClassificationId=${params.examClassificationId}`, config);
            const topicsDataForBranchFilter = Array.isArray(topicsForExamRes.data) ? topicsForExamRes.data : [];
            const relevantBranchIds = new Set();
            topicsDataForBranchFilter.forEach(topic => { if (topic.branchId) relevantBranchIds.add(topic.branchId); });
            setBranchesForSetup(allBranchesData.filter(branch => relevantBranchIds.has(branch.id)));
        } catch (err) { toast({ title: "Hata", description: `Branşlar yüklenemedi.`, status: "error", duration: 3000 });}
        finally { setIsFetchingFilters(false); }
        return;
      case 'topic':
        if (!params.examClassificationId || !params.branchId) { setIsFetchingFilters(false); return; }
        url = `${API_BASE_URL}/api/topics?examClassificationId=${params.examClassificationId}&branchId=${params.branchId}`;
        break;
      default: setIsFetchingFilters(false); return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(url, config);
      const data = Array.isArray(response.data) ? response.data : [];
      if (dataType === 'exam') setExamClassifications(data);
      else if (dataType === 'topic') setTopicsForSetup(data.filter(t => !t.parentId));
    } catch (err) { toast({ title: "Hata", description: `${dataType} yüklenemedi.`, status: "error", duration: 3000 });}
    finally { setIsFetchingFilters(false); }
  }, [token, toast]);

  useEffect(() => { fetchFilterData('exam'); }, [fetchFilterData]);

  useEffect(() => {
    if (setupFilters.examClassificationId) {
      setBranchesForSetup([]); setTopicsForSetup([]);
      setSetupFilters(prev => ({...prev, branchId: '', topicId: ''}));
      fetchFilterData('branch', { examClassificationId: setupFilters.examClassificationId });
    } else { setBranchesForSetup([]); }
  }, [setupFilters.examClassificationId, fetchFilterData]);

  useEffect(() => {
    if (setupFilters.branchId) {
      setTopicsForSetup([]);
      setSetupFilters(prev => ({...prev, topicId: ''}));
      fetchFilterData('topic', { examClassificationId: setupFilters.examClassificationId, branchId: setupFilters.branchId });
    } else { setTopicsForSetup([]); }
  }, [setupFilters.branchId, setupFilters.examClassificationId, fetchFilterData]);

  const initializeQuiz = useCallback(async (mode, filters, srsEntryId = null, srsReturnPath = null, directQuestionData = null) => {
    setPageStep('quiz_loading');
    setCurrentSetupLoadingMsgIdx(0);
    setLoadingMessage(quizLoadingMessages[0]);
    setQuizState({...initialQuizState, isSrsMode: !!srsEntryId, srsEntryId, srsReturnPath });
    setError(''); clearInterval(timerRef.current); timerRef.current = null;
    quizSessionIdRef.current = Date.now();

    if (!token) { setError('Soruları çözebilmek için giriş yapmalısınız.'); setPageStep('setup'); return; }

    let fetchedQuestions = [];
    let newQuizTitle = 'Soru Çözme';
    let newQuizMode = mode;
    let newQuizFixedDurationSeconds = null;
    let questionSourceError = '';

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      let questionsUrl = `${API_BASE_URL}/api/questions`;
      const queryParamsForAPI = new URLSearchParams();

      await new Promise(resolve => setTimeout(resolve, QUIZ_INIT_MESSAGE_DELAY));
      setLoadingMessage(quizLoadingMessages[1]);

      if (srsEntryId && directQuestionData) {
        newQuizMode = 'srs_practice';
        newQuizTitle = 'Dijital Antrenör - Soru Tekrarı';
        fetchedQuestions = [directQuestionData]; // Doğrudan gelen soruyu kullan
        console.log("SRS Modu - Soru state'ten yüklendi:", directQuestionData);
      } else if (srsEntryId && !directQuestionData) {
        // Bu durum, SRSReviewSessionPage'den state ile veri aktarımı başarısız olduysa veya
        // doğrudan SolvePage'e srsEntryId ile gelindiyse oluşur.
        // Backend'den srsEntryId veya ilişkili questionId ile tek soru çekilmeli.
        newQuizMode = 'srs_practice';
        newQuizTitle = 'Dijital Antrenör - Soru Tekrarı';
        const questionIdForSrs = filters.topicId; // Varsayım: filters.topicId SRS'de questionId'yi tutuyor
                                                 // Veya srsEntryId'den questionId'yi backend'de çözümle
        if (questionIdForSrs) {
             questionsUrl = `${API_BASE_URL}/api/questions/${questionIdForSrs}`;
        } else {
            questionSourceError = "SRS tekrarı için soru ID bilgisi eksik.";
        }
        console.log("SRS Modu (veri state'ten gelmedi) - Soru Yükleme URL'i:", questionsUrl);

      } else {
        const currentExamClassifications = examClassifications.length > 0 ? examClassifications : ((await axios.get(`${API_BASE_URL}/api/exam-classifications`, config)).data || []);
        const currentBranches = branchesForSetup.length > 0 ? branchesForSetup : (filters.examClassificationId ? ((await axios.get(`${API_BASE_URL}/api/branches`, config)).data || []) : []);
        const currentTopics = topicsForSetup.length > 0 ? topicsForSetup : (filters.branchId ? ((await axios.get(`${API_BASE_URL}/api/topics?examClassificationId=${filters.examClassificationId}&branchId=${filters.branchId}`, config)).data.filter(t => !t.parentId) || []) : []);

        const examName = currentExamClassifications.find(ec => ec.id === parseInt(filters.examClassificationId))?.name || '';
        const branchName = currentBranches.find(b => b.id === parseInt(filters.branchId))?.name || '';
        const topicName = currentTopics.find(t => t.id === parseInt(filters.topicId))?.name || '';

        if (filters.topicId) queryParamsForAPI.append('topicId', filters.topicId);
        else if (filters.branchId) queryParamsForAPI.append('branchId', filters.branchId);
        if (filters.examClassificationId) queryParamsForAPI.append('examClassificationId', filters.examClassificationId);
        else if (newQuizMode === 'deneme' && !filters.topicId && !filters.branchId) {
             questionSourceError = "Deneme modu için en azından bir sınav tipi seçilmelidir.";
        }

        if (newQuizMode === 'deneme') {
          let titleParts = [];
          if(examName) titleParts.push(examName);
          if(branchName) titleParts.push(branchName);
          newQuizTitle = titleParts.length > 0 ? `${titleParts.join(" > ")} Denemesi` : "Genel Deneme";
        } else {
          let titleParts = [];
          if (examName) titleParts.push(examName);
          if (branchName) titleParts.push(branchName);
          if (topicName) titleParts.push(topicName);
          newQuizTitle = titleParts.length > 0 ? `${titleParts.join(" > ")} Pratiği` : "Genel Karma Pratik";
        }
        const queryString = queryParamsForAPI.toString();
        if (!questionSourceError && queryString) { questionsUrl += `?${queryString}`; }
        else if (!questionSourceError && newQuizMode === 'practice' && !queryString) { /* Genel pratik */ }
        else if (!questionSourceError) { questionSourceError = "Soruları filtrelemek için yeterli kriter seçilmedi."; }
      }

      await new Promise(resolve => setTimeout(resolve, QUIZ_INIT_MESSAGE_DELAY));
      setLoadingMessage(quizLoadingMessages[2]);

      if (!questionSourceError && (!srsEntryId || (srsEntryId && !directQuestionData))) { // Eğer SRS ve directQuestionData yoksa API'den çek
        const qRes = await axios.get(questionsUrl, config);
        const questionsDataFromApi = Array.isArray(qRes.data) ? qRes.data : (qRes.data ? [qRes.data] : []);
        if (questionsDataFromApi.length > 0) {
            fetchedQuestions = srsEntryId ? questionsDataFromApi : [...questionsDataFromApi].sort(() => Math.random() - 0.5);
        } else {
          questionSourceError = srsEntryId ? "SRS için belirtilen soru yüklenemedi (API)." : (queryParamsForAPI.toString() ? 'Bu kriterlere uygun soru bulunamadı.' : 'Soru havuzunda hiç soru bulunamadı.');
        }
      } else if (questionSourceError && srsEntryId && directQuestionData) {
        // directQuestionData zaten fetchedQuestions'a atandı. Hata yok.
        questionSourceError = '';
      }


      if (newQuizMode === 'deneme' && !srsEntryId && fetchedQuestions.length > 0) {
        newQuizFixedDurationSeconds = fetchedQuestions.length * DEFAULT_DENEME_DURATION_SECONDS_PER_QUESTION;
      }


      await new Promise(resolve => setTimeout(resolve, QUIZ_INIT_MESSAGE_DELAY));
      setLoadingMessage(quizLoadingMessages[3]);

      if (questionSourceError) {
        setError(questionSourceError);
        setQuizState(prev => ({ ...initialQuizState, quizTitle: newQuizTitle, quizMode: newQuizMode, quizFixedDurationSeconds: newQuizFixedDurationSeconds, isSrsMode: !!srsEntryId, srsEntryId, srsReturnPath }));
        setPageStep('setup');
      } else {
        setQuizState(prev => ({
          ...initialQuizState,
          questions: fetchedQuestions, currentQuestion: fetchedQuestions[0], currentQuestionIndex: 0,
          questionStartTime: Date.now(), quizTitle: newQuizTitle, quizMode: newQuizMode,
          quizFixedDurationSeconds: newQuizFixedDurationSeconds,
          timeElapsed: (newQuizMode === 'deneme' && !srsEntryId && newQuizFixedDurationSeconds) ? newQuizFixedDurationSeconds : 0,
          isSrsMode: !!srsEntryId, srsEntryId, srsReturnPath
        }));
        setTimeout(() => setPageStep('quiz'), 300);
      }
    } catch (err) {
      console.error("Quiz başlatılırken hata:", err);
      setError(err.response?.data?.message || 'Sorular yüklenirken bir hata oluştu.');
      setPageStep('setup');
    }
  }, [token, examClassifications, branchesForSetup, topicsForSetup, quizLoadingMessages]);

  useEffect(() => {
    const queryParams = parseQueryParams();
    const srsEntryIdFromUrl = queryParams.get('srsEntryId');
    const srsReturnPathFromUrl = queryParams.get('srsReturnPath');
    const srsReviewItemFromState = location.state?.srsReviewItem; // SRSReviewSessionPage'den gelen soru objesi

    if (!token) { setPageStep('setup'); setError("Lütfen giriş yapın."); return; }

    if (srsEntryIdFromUrl && srsReviewItemFromState) {
      console.log("SRS Modu Algılandı (state ile). srsEntryId:", srsEntryIdFromUrl, "Soru:", srsReviewItemFromState);
      initializeQuiz('srs_practice', {}, srsEntryIdFromUrl, srsReturnPathFromUrl, srsReviewItemFromState);
    } else if (srsEntryIdFromUrl && !srsReviewItemFromState) {
      // State ile gelmediyse, URL'deki topicId'yi (aslında questionId olmalı) kullanarak API'den çekmeyi deneyebiliriz.
      // Bu durum, kullanıcı sayfayı yenilediyse veya doğrudan linkle geldiyse oluşur.
      const questionIdForSrs = queryParams.get('topicId'); // SRSReviewSessionPage'in topicId'ye questionId koyduğu varsayılıyor
      console.log("SRS Modu Algılandı (state YOK, URL ile). srsEntryId:", srsEntryIdFromUrl, "Soru ID (topicId üzerinden):", questionIdForSrs);
      if (questionIdForSrs) {
        initializeQuiz('srs_practice', { topicId: questionIdForSrs }, srsEntryIdFromUrl, srsReturnPathFromUrl, null);
      } else {
        setError("SRS tekrarı için soru bilgisi eksik. Lütfen antrenör sayfasından tekrar deneyin.");
        setPageStep('error'); // veya 'setup'
      }
    } else {
      // Normal quiz akışı (URL'deki diğer parametrelerle)
      const modeFromUrl = queryParams.get('mode');
      const examIdFromUrl = queryParams.get('examClassificationId') || queryParams.get('examId');
      const branchIdFromUrl = queryParams.get('branchId');
      const topicIdFromUrl = queryParams.get('topicId');

      if (examIdFromUrl || branchIdFromUrl || topicIdFromUrl) {
        const directFilters = {
          examClassificationId: examIdFromUrl, branchId: branchIdFromUrl, topicId: topicIdFromUrl,
        };
        const directMode = modeFromUrl === 'deneme' ? 'deneme' : 'practice';
        setSetupMode(directMode);
        setSetupFilters(directFilters);
        initializeQuiz(directMode, directFilters);
      } else {
        setPageStep('setup');
        setLoadingMessage(initialLoadingMessages[initialLoadingMessages.length-1]);
      }
    }
  }, [location.search, location.state, token, initializeQuiz, parseQueryParams, initialLoadingMessages]);


  useEffect(() => {
    const { questions, isQuizFinished, quizMode, quizFixedDurationSeconds, isSrsMode } = quizState;
    if (pageStep === 'quiz' && questions.length > 0 && !isQuizFinished) {
      if (quizMode === 'deneme' && !isSrsMode && quizFixedDurationSeconds != null) {
        if (!timerRef.current) {
          timerRef.current = setInterval(() => {
            setQuizState(prev => {
              if (prev.timeElapsed <= 1) {
                clearInterval(timerRef.current); timerRef.current = null;
                toast({ title: "Süre Doldu!", description: "Deneme sınavı süreniz sona erdi.", status: "warning", duration: 5000, isClosable: true, position: "top" });
                setPageStep('finished');
                return { ...prev, isQuizFinished: true, timeElapsed: 0 };
              }
              return { ...prev, timeElapsed: prev.timeElapsed - 1 };
            });
          }, 1000);
        }
      } else if (quizMode === 'practice' || isSrsMode) {
        if (!timerRef.current) {
          timerRef.current = setInterval(() => {
            setQuizState(prev => ({ ...prev, timeElapsed: prev.timeElapsed + 1 }));
          }, 1000);
        }
      }
    } else {
      clearInterval(timerRef.current); timerRef.current = null;
    }
    return () => { clearInterval(timerRef.current); timerRef.current = null; };
  }, [pageStep, quizState.questions, quizState.isQuizFinished, quizState.quizMode, quizState.quizFixedDurationSeconds, quizState.isSrsMode, toast]);

  useEffect(() => {
    if (quizState.currentQuestion && !quizState.isQuizFinished && !quizState.isAnswerChecked) {
      setQuizState(prev => ({ ...prev, questionStartTime: Date.now() }));
    }
  }, [quizState.currentQuestion?.id, quizState.isQuizFinished, quizState.isAnswerChecked]);

  const selectOption = useCallback((opt) => {
    if (!quizState.isAnswerChecked) {
      setQuizState(prev => ({ ...prev, selectedAnswer: opt }));
    }
  }, [quizState.isAnswerChecked]);

  const checkAnswer = useCallback(async () => {
    const { selectedAnswer, currentQuestion, questionStartTime, score, isSrsMode, srsEntryId, srsReturnPath } = quizState;
    if (!selectedAnswer || !currentQuestion) return;
    const endTime = Date.now();
    const timeDiffSeconds = questionStartTime ? Math.max(0, Math.round((endTime - questionStartTime) / 1000)) : null;
    const correct = selectedAnswer === currentQuestion.correctAnswer;

    setQuizState(prev => ({
      ...prev, isAnswerChecked: true, isCorrect: correct,
      score: correct ? score + 1 : score, questionStartTime: null,
    }));

    if (token && !isSrsMode) {
        try {
            await axios.post(
              `${API_BASE_URL}/api/attempts`,
              { questionId: currentQuestion.id, selectedAnswer, isCorrect: correct, timeTaken: timeDiffSeconds },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (err) { console.error("Deneme kaydedilirken hata:", err); }
    }

    if (isSrsMode && srsReturnPath && srsEntryId) {
        clearInterval(timerRef.current); timerRef.current = null;
        const feedbackParams = new URLSearchParams();
        feedbackParams.append('srsFeedback', correct ? 'correct' : 'incorrect');
        feedbackParams.append('srsEntryId', srsEntryId);
        const finalReturnPath = `${srsReturnPath}?${feedbackParams.toString()}`;
        console.log("SRS - SolvePage'den geri yönlendirme (checkAnswer):", finalReturnPath);
        navigate(finalReturnPath, { replace: true });
    }

  }, [quizState, token, navigate]);

  const goTo = useCallback((index) => {
    const { questions } = quizState;
    if (index < 0 || index >= questions.length) return;
    setQuizState(prev => ({
      ...prev, currentQuestion: questions[index], currentQuestionIndex: index,
      selectedAnswer: '', isAnswerChecked: false, isCorrect: null, showExplanation: false,
    }));
    setError('');
  }, [quizState.questions]);

  const prevQuestion = useCallback(() => goTo(quizState.currentQuestionIndex - 1), [goTo, quizState.currentQuestionIndex]);
  const nextQuestion = useCallback(() => goTo(quizState.currentQuestionIndex + 1), [goTo, quizState.currentQuestionIndex]);

  const finishQuiz = useCallback(() => {
    if (quizState.isSrsMode) {
        const { srsReturnPath, srsEntryId, isCorrect, isAnswerChecked } = quizState;
        if (srsReturnPath && srsEntryId) {
            clearInterval(timerRef.current); timerRef.current = null;
            const feedbackParams = new URLSearchParams();
            const feedback = isAnswerChecked ? (isCorrect ? 'correct' : 'incorrect') : 'incorrect';
            feedbackParams.append('srsFeedback', feedback);
            feedbackParams.append('srsEntryId', srsEntryId);
            console.log("SRS - SolvePage'den geri yönlendirme (finishQuiz):", `${srsReturnPath}?${feedbackParams.toString()}`);
            navigate(`${srsReturnPath}?${feedbackParams.toString()}`, { replace: true });
            return;
        }
    }

    if (window.confirm('Testi bitirmek istediğinizden emin misiniz?')) {
      setQuizState(prev => ({ ...prev, isQuizFinished: true }));
      setPageStep('finished');
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [quizState, navigate, setPageStep]);
  const toggleExplanation = () => setQuizState(prev => ({ ...prev, showExplanation: !prev.showExplanation }));

  const progressPercentage = useMemo(() => {
      if (!quizState.questions || quizState.questions.length === 0) return 0;
      return ((quizState.currentQuestionIndex + 1) / quizState.questions.length) * 100;
  }, [quizState.currentQuestionIndex, quizState.questions]);

  const handleSetupModeChange = (value) => { setSetupMode(value); };
  const handleSetupFilterChange = (e) => {
    const { name, value } = e.target;
    setSetupFilters(prev => {
      const newState = { ...prev, [name]: value };
      if (name === 'examClassificationId') { newState.branchId = ''; newState.topicId = ''; setTopicsForSetup([]); setBranchesForSetup([]);}
      else if (name === 'branchId') { newState.topicId = ''; setTopicsForSetup([]);}
      return newState;
    });
  };
  const handleStartQuizFromSetup = () => {
    if (!setupMode) {
      toast({ title: "Uyarı", description: "Lütfen bir çözme modu seçin.", status: "warning", duration: 3000, position:"top" });
      return;
    }
    if (setupMode === 'deneme' && !setupFilters.examClassificationId && !setupFilters.branchId && !setupFilters.topicId) {
        if(!setupFilters.examClassificationId){
            toast({ title: "Uyarı", description: "Deneme modu için lütfen en azından bir Sınav Türü seçin.", status: "warning", duration: 4000, position:"top" });
            return;
        }
    }
    initializeQuiz(setupMode, setupFilters);
  };

  if (pageStep === 'initial_loading' || pageStep === 'quiz_loading') {
    return <SolvePageLoadingScreen loadingMessage={loadingMessage} />;
  }

  if (pageStep === 'setup') {
    return (
      <QuizSetupInterface
        setupMode={setupMode}
        onSetupModeChange={handleSetupModeChange}
        setupFilters={setupFilters}
        onSetupFilterChange={handleSetupFilterChange}
        examClassifications={examClassifications}
        branchesForSetup={branchesForSetup}
        topicsForSetup={topicsForSetup}
        onStartQuiz={handleStartQuizFromSetup}
        isFetchingFilters={isFetchingFilters}
        isLoadingQuiz={pageStep === 'quiz_loading'}
        generalError={error && (!quizState.questions || quizState.questions.length === 0) ? error : null}
        setupBoxBg={setupBoxBg}
        borderColor={borderColor}
        headingColor={headingColor}
        textColor={textColor}
        textMutedColor={textMutedColor}
        inputSelectBg={inputSelectBg}
      />
    );
  }

  if (pageStep === 'quiz' && error && (!quizState.questions || quizState.questions.length === 0)) {
    return (
      <SolvePageErrorState
        error={error}
        onGoToSetup={() => {
            quizSessionIdRef.current = Date.now();
            setPageStep('setup');
            setError('');
        }}
        token={token}
      />
    );
  }

  if (pageStep === 'quiz' && !quizState.currentQuestion && !error) {
     return (
       <Container centerContent py={10}>
         <Alert status="info" variant="subtle" borderRadius="lg" flexDirection="column" alignItems="center">
             <AlertIcon boxSize="30px" />
             <AlertTitle mt={3} mb={1} fontSize="lg">Soru Bulunamadı</AlertTitle>
             <AlertDescription maxWidth="sm" textAlign="center">
                 Seçtiğiniz kriterlere uygun soru bulunamadı veya yüklenirken bir sorun oluştu.
             </AlertDescription>
             <Button mt={4} colorScheme="blue" onClick={() => setPageStep('setup')}>Yeni Test Kurulumu</Button>
         </Alert>
       </Container>
     );
  }

  if (pageStep === 'quiz' && quizState.currentQuestion) {
    return (
      <QuizActiveInterface
        quizState={quizState}
        onSelectOption={selectOption}
        onCheckAnswer={checkAnswer}
        onPrevQuestion={prevQuestion}
        onNextQuestion={nextQuestion}
        onFinishQuiz={finishQuiz}
        onToggleExplanation={toggleExplanation}
        progressPercentage={progressPercentage}
        API_BASE_URL={API_BASE_URL}
        quizInfoBg={quizInfoBg}
        borderColor={borderColor}
        headingColor={headingColor}
        timerInfoColor={timerInfoColor}
        progressBarColor={progressBarColor}
        cardBg={cardBg}
        textMutedColor={textMutedColor}
      />
    );
  }

  if (pageStep === 'finished') {
    return (
      <QuizFinishedScreen
        quizState={quizState}
        onRestartQuizSetup={() => {
          quizSessionIdRef.current = Date.now();
          setPageStep('setup');
          setSetupFilters(initialSetupFilters);
          setSetupMode('');
          setQuizState(initialQuizState);
        }}
        formatTime={formatTime}
        cardBg={cardBg}
        borderColor={borderColor}
        textColor={textColor}
        textMutedColor={textMutedColor}
      />
    );
  }

  return (
    <Container centerContent py={10}>
        <Alert status="info" variant="subtle" borderRadius="lg">
            <AlertIcon />
            Beklenmedik bir durum oluştu. Lütfen sayfayı yenileyin.
            <Button as={RouterLink} to="/" variant="link" colorScheme="blue" ml={4}>Ana Sayfa</Button>
        </Alert>
    </Container>
  );
}

export default SolvePage;
