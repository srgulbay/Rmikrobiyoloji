import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Flex, Button, IconButton, Heading, Text, SimpleGrid,
  Card, CardBody, Image, Alert, AlertIcon, AlertTitle, AlertDescription,
  Spinner, Icon,
  HStack, VStack, Center, Tag, useToast, List, ListItem,
  Divider, Collapse, Progress, useColorModeValue,
  Select, FormControl, FormLabel, Radio, RadioGroup, Stack // Yeni eklenenler: Select, FormControl, FormLabel, Radio, RadioGroup, Stack
} from '@chakra-ui/react';
import { 
    FaArrowLeft, FaArrowRight, FaCheck, FaFlagCheckered, FaRedo, 
    FaExclamationTriangle, FaInfoCircle, FaLightbulb, FaQuestion, FaClock, FaStopwatch,
    FaPencilAlt, FaFilter, FaPlay // Yeni ikonlar
} from 'react-icons/fa';
import { FiCheckCircle, FiXCircle, FiSettings } from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const DEFAULT_DENEME_DURATION_SECONDS_PER_QUESTION = 90;

const formatTime = totalSeconds => {
    if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// Başlangıç state'leri
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
    quizMode: 'practice', // 'practice', 'deneme'
    quizTitle: 'Soru Çözme Alanı',
    quizFixedDurationSeconds: null,
};

const initialSetupFilters = {
    examClassificationId: '',
    branchId: '',
    topicId: '',
    // subTopicId: '', // İleride eklenebilir
    // numberOfQuestions: 20, // Opsiyonel: kullanıcı soru sayısı seçebilir
};

function SolvePage() {
  // --- Ana State'ler ---
  const [pageStep, setPageStep] = useState('loading'); // 'loading', 'setup', 'quiz', 'finished'
  const [quizState, setQuizState] = useState(initialQuizState);
  const [setupMode, setSetupMode] = useState(''); // Kullanıcının setup ekranında seçtiği mod: 'deneme' veya 'practice'
  const [setupFilters, setSetupFilters] = useState(initialSetupFilters);
  
  // Setup UI için veri listeleri
  const [examClassifications, setExamClassifications] = useState([]);
  const [branches, setBranches] = useState([]); // Seçilen sınava göre filtrelenmiş branşlar
  const [topics, setTopics] = useState([]);     // Seçilen branşa göre filtrelenmiş konular (en üst seviye)
  // const [subTopics, setSubTopics] = useState([]); // Seçilen konuya göre alt konular (ileride)

  const [loadingMessage, setLoadingMessage] = useState('Sayfa hazırlanıyor...');
  const [error, setError] = useState('');
  
  // --- Context ve Router Hook'ları ---
  const { user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  // --- Ref'ler ---
  const timerRef = useRef(null);
  const quizSessionIdRef = useRef(Date.now()); // Quiz'i yeniden başlatmak için

  // --- Stil Hook'ları ---
  const progressBarColor = useColorModeValue("brand.500", "brand.300");
  const timerInfoColor = useColorModeValue("gray.600", "gray.300");
  const quizInfoBg = useColorModeValue("gray.50", "gray.850");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const cardBg = useColorModeValue("white", "gray.750");
  const headingColor = useColorModeValue('gray.700', 'gray.100');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const textMutedColor = useColorModeValue("gray.500", "gray.400");
  const stepIndicatorColor = useColorModeValue('brand.500', 'brand.300');
  const setupBoxBg = useColorModeValue("white", "gray.750");

  const parseQueryParams = useCallback(() => {
    return new URLSearchParams(location.search);
  }, [location.search]);

  // Setup UI için Sınav Tiplerini Çekme
  useEffect(() => {
    const fetchExamClassifications = async () => {
      if (token) {
        try {
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const response = await axios.get(`${API_BASE_URL}/api/exam-classifications`, config);
          setExamClassifications(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
          console.error("Sınav tipleri çekilirken hata:", err);
          toast({ title: "Hata", description: "Sınav türleri yüklenemedi.", status: "error", duration: 3000 });
        }
      }
    };
    fetchExamClassifications();
  }, [token, toast]);

  // Setup UI: Sınav Tipi seçildiğinde Branşları Çekme
  useEffect(() => {
    const fetchBranchesForSetup = async () => {
      if (token && setupFilters.examClassificationId) {
        setLoadingMessage("Branşlar yükleniyor...");
        // Normalde tüm branşlar çekilip client'ta filtrelenebilir veya examClassificationId ile API'den çekilebilir.
        // Şimdilik tüm konuları çekip oradan branşları filtreleyelim (TopicBrowserPage'deki gibi)
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const allBranchesRes = await axios.get(`${API_BASE_URL}/api/branches`, config);
            const allBranchesData = Array.isArray(allBranchesRes.data) ? allBranchesRes.data : [];

            const topicsForExamRes = await axios.get(`${API_BASE_URL}/api/topics?examClassificationId=${setupFilters.examClassificationId}`, config);
            const topicsData = Array.isArray(topicsForExamRes.data) ? topicsForExamRes.data : [];
            
            const relevantBranchIds = new Set();
            const collectBranchIds = (nodes) => {
                if (!Array.isArray(nodes)) return;
                nodes.forEach(topic => {
                if (topic.branchId) relevantBranchIds.add(topic.branchId);
                if (topic.children && Array.isArray(topic.children)) collectBranchIds(topic.children);
                });
            };
            collectBranchIds(topicsData);
            setBranches(allBranchesData.filter(branch => relevantBranchIds.has(branch.id)));
            setSetupFilters(prev => ({ ...prev, branchId: '', topicId: '' })); // Branş ve konu seçimini sıfırla
            setTopics([]); // Konu listesini sıfırla
        } catch (err) {
            console.error("Kurulum için branşlar çekilirken hata:", err);
            toast({ title: "Hata", description: "Branşlar yüklenemedi.", status: "error", duration: 3000 });
            setBranches([]);
        } finally {
             setLoadingMessage(""); // Yükleme mesajını temizle
        }
      } else {
        setBranches([]); // Sınav tipi seçilmemişse branşları temizle
        setSetupFilters(prev => ({ ...prev, branchId: '', topicId: '' }));
        setTopics([]);
      }
    };
    fetchBranchesForSetup();
  }, [token, setupFilters.examClassificationId, toast]);

  // Setup UI: Branş seçildiğinde Konuları Çekme
  useEffect(() => {
    const fetchTopicsForSetup = async () => {
      if (token && setupFilters.examClassificationId && setupFilters.branchId) {
        setLoadingMessage("Konular yükleniyor...");
        try {
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const response = await axios.get(`${API_BASE_URL}/api/topics?examClassificationId=${setupFilters.examClassificationId}&branchId=${setupFilters.branchId}`, config);
          // Sadece parentId'si olmayan (ana) konuları alalım, şimdilik alt konu seçimi eklemiyoruz
          const rootTopics = (Array.isArray(response.data) ? response.data : []).filter(topic => !topic.parentId);
          setTopics(rootTopics);
           setSetupFilters(prev => ({ ...prev, topicId: '' })); // Konu seçimini sıfırla
        } catch (err) {
          console.error("Kurulum için konular çekilirken hata:", err);
          toast({ title: "Hata", description: "Konular yüklenemedi.", status: "error", duration: 3000 });
          setTopics([]);
        } finally {
            setLoadingMessage("");
        }
      } else {
        setTopics([]); // Branş seçilmemişse konuları temizle
         setSetupFilters(prev => ({ ...prev, topicId: '' }));
      }
    };
    fetchTopicsForSetup();
  }, [token, setupFilters.examClassificationId, setupFilters.branchId, toast]);


  // Quiz'i başlatan ana fonksiyon
  const initializeQuiz = useCallback(async (mode, filters) => {
    setQuizState(prev => ({...initialQuizState, isLoadingInitial: true, quizSessionId: Date.now() }));
    setLoadingMessage('Sorular hazırlanıyor...');
    setError('');
    clearInterval(timerRef.current);
    timerRef.current = null;
    quizSessionIdRef.current = Date.now();

    if (!token) {
      setError('Soruları çözebilmek için giriş yapmalısınız.');
      setQuizState(prev => ({ ...prev, isLoadingInitial: false }));
      setPageStep('setup'); // Token yoksa setup'a geri dön
      return;
    }

    let fetchedQuestions = [];
    let newQuizTitle = 'Soru Çözme';
    let newQuizMode = mode;
    let newQuizFixedDurationSeconds = null;
    let questionSourceError = '';

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      let questionsUrl = `${API_BASE_URL}/api/questions`;
      const queryParamsForAPI = new URLSearchParams();

      if (filters.topicId) queryParamsForAPI.append('topicId', filters.topicId);
      else if (filters.branchId) queryParamsForAPI.append('branchId', filters.branchId);
      // examClassificationId her zaman eklenmeli, çünkü sorular buna bağlı
      if (filters.examClassificationId) queryParamsForAPI.append('examClassificationId', filters.examClassificationId);
      else if (newQuizMode === 'deneme' && !filters.topicId && !filters.branchId) {
           // Eğer genel bir deneme moduysa ve sınav tipi seçilmemişse bu bir hata olabilir.
           // Ya da tüm sınav tiplerinden rastgele sorular getirmek gibi bir mantık eklenebilir.
           // Şimdilik sınav tipi zorunluymuş gibi davranalım.
           questionSourceError = "Deneme modu için en azından bir sınav tipi seçilmelidir.";
      }


      const examName = examClassifications.find(ec => ec.id === parseInt(filters.examClassificationId))?.name || '';
      const branchName = branches.find(b => b.id === parseInt(filters.branchId))?.name || '';
      const topicName = topics.find(t => t.id === parseInt(filters.topicId))?.name || '';


      if (newQuizMode === 'deneme') {
        newQuizTitle = `${examName} ${branchName} Denemesi`.replace(/\s+/g, ' ').trim();
        if (!newQuizTitle || newQuizTitle === "Denemesi") newQuizTitle = "Genel Deneme";
      } else { // Pratik Modu
        let titleParts = [];
        if (examName) titleParts.push(examName);
        if (branchName) titleParts.push(branchName);
        if (topicName) titleParts.push(topicName);
        newQuizTitle = titleParts.length > 0 ? `${titleParts.join(" > ")} Pratiği` : "Genel Karma Pratik";
      }
      setLoadingMessage(`${newQuizTitle} soruları yükleniyor...`);
      
      const queryString = queryParamsForAPI.toString();
      if (queryString) questionsUrl += `?${queryString}`;
      else if (!filters.topicId && !filters.branchId && !filters.examClassificationId && newQuizMode === 'practice') {
          // Genel pratik için hiçbir filtre yoksa tüm soruları çek (veya backend'den rastgele N soru)
      } else if (!questionSourceError) { // Eğer hala bir hata yoksa ve query string boşsa (örn: deneme için sadece mod seçildi)
          questionSourceError = "Soruları filtrelemek için yeterli kriter seçilmedi.";
      }


      if (!questionSourceError) {
        const qRes = await axios.get(questionsUrl, config);
        const questionsData = Array.isArray(qRes.data) ? qRes.data : [];
        
        if (questionsData.length > 0) {
            fetchedQuestions = [...questionsData].sort(() => Math.random() - 0.5); 
            if (newQuizMode === 'deneme') {
                newQuizFixedDurationSeconds = fetchedQuestions.length * DEFAULT_DENEME_DURATION_SECONDS_PER_QUESTION;
            }
        } else {
          questionSourceError = queryString ? 'Bu kriterlere uygun soru bulunamadı.' : 'Soru havuzunda hiç soru bulunamadı.';
        }
      }

      if (questionSourceError) {
        setError(questionSourceError);
        setQuizState(prev => ({ ...prev, questions: [], currentQuestion: null, quizTitle: newQuizTitle, quizMode: newQuizMode, quizFixedDurationSeconds: newQuizFixedDurationSeconds, isLoadingInitial: false }));
        setPageStep('setup'); // Hata varsa setup'a dön
      } else {
        setQuizState(prev => ({
          ...prev,
          questions: fetchedQuestions,
          currentQuestion: fetchedQuestions[0],
          currentQuestionIndex: 0,
          questionStartTime: Date.now(),
          quizTitle: newQuizTitle,
          quizMode: newQuizMode,
          quizFixedDurationSeconds: newQuizFixedDurationSeconds,
          timeElapsed: newQuizMode === 'deneme' && newQuizFixedDurationSeconds ? newQuizFixedDurationSeconds : 0,
          isLoadingInitial: false,
        }));
        setPageStep('quiz'); // Quiz'i başlat
      }
    } catch (err) {
      console.error("Quiz başlatılırken hata:", err);
      setError(err.response?.data?.message || 'Sorular yüklenirken bir hata oluştu.');
      setQuizState(prev => ({ ...prev, isLoadingInitial: false }));
      setPageStep('setup'); // Hata varsa setup'a dön
    }
  }, [token, examClassifications, branches, topics, navigate]); // navigate eklendi, gerekirse diye

  // URL parametrelerini kontrol et ve sayfa adımını ayarla
  useEffect(() => {
    const queryParams = parseQueryParams();
    const modeFromUrl = queryParams.get('mode');
    const examIdFromUrl = queryParams.get('examClassificationId') || queryParams.get('examId');
    const branchIdFromUrl = queryParams.get('branchId');
    const topicIdFromUrl = queryParams.get('topicId');

    if (examIdFromUrl || branchIdFromUrl || topicIdFromUrl) { // Eğer URL'de filtre varsa, doğrudan quiz'i başlatmayı dene
      const directFilters = {
        examClassificationId: examIdFromUrl,
        branchId: branchIdFromUrl,
        topicId: topicIdFromUrl,
      };
      const directMode = modeFromUrl === 'deneme' ? 'deneme' : 'practice';
      initializeQuiz(directMode, directFilters);
      // setPageStep('quiz'); // initializeQuiz içinde zaten ayarlanıyor
    } else {
      // URL'de parametre yoksa, setup ekranını göster
      setPageStep('setup');
      setQuizState(prev => ({...prev, isLoadingInitial: false})); // İlk yükleme bitti
    }
  }, [location.search, initializeQuiz, parseQueryParams, token]); // token eklendi, çünkü initializeQuiz token'a bağlı


  // Zamanlayıcı ve diğer useEffect'ler (öncekiyle aynı)
  useEffect(() => { /* ... Timer Logic ... */ 
    const { isLoadingInitial, questions, isQuizFinished, quizMode, quizFixedDurationSeconds } = quizState;
    if (!isLoadingInitial && questions.length > 0 && !isQuizFinished) {
      if (quizMode === 'deneme' && quizFixedDurationSeconds != null) {
        if (!timerRef.current) {
          timerRef.current = setInterval(() => {
            setQuizState(prev => {
              if (prev.timeElapsed <= 1) {
                clearInterval(timerRef.current); timerRef.current = null;
                toast({ title: "Süre Doldu!", description: "Deneme sınavı süreniz sona erdi.", status: "warning", duration: 5000, isClosable: true, position: "top" });
                return { ...prev, isQuizFinished: true, timeElapsed: 0 };
              }
              return { ...prev, timeElapsed: prev.timeElapsed - 1 };
            });
          }, 1000);
        }
      } else if (quizMode === 'practice') {
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
  }, [quizState.isLoadingInitial, quizState.questions, quizState.isQuizFinished, quizState.quizMode, quizState.quizFixedDurationSeconds, toast]);

  useEffect(() => { /* ... Question Start Time ... */ 
    if (quizState.currentQuestion && !quizState.isQuizFinished && !quizState.isAnswerChecked) {
      setQuizState(prev => ({ ...prev, questionStartTime: Date.now() }));
    }
  }, [quizState.currentQuestion?.id, quizState.isQuizFinished, quizState.isAnswerChecked]);

  // Callback Fonksiyonları (selectOption, checkAnswer, goTo, prev/nextQuestion, finishQuiz, toggleExplanation)
  // Bu fonksiyonlar quizState'e bağlı olduğu için quizState değiştikçe yeniden oluşturulabilirler.
  // Mantıkları bir öncekiyle büyük ölçüde aynı.
  const selectOption = useCallback((opt) => {
    if (!quizState.isAnswerChecked) {
      setQuizState(prev => ({ ...prev, selectedAnswer: opt }));
    }
  }, [quizState.isAnswerChecked]);

  const checkAnswer = useCallback(async () => {
    const { selectedAnswer, currentQuestion, questionStartTime, score } = quizState;
    if (!selectedAnswer || !currentQuestion) return;
    const endTime = Date.now();
    const timeDiffSeconds = questionStartTime ? Math.max(0, Math.round((endTime - questionStartTime) / 1000)) : null;
    const correct = selectedAnswer === currentQuestion.correctAnswer;
    setQuizState(prev => ({
      ...prev, isAnswerChecked: true, isCorrect: correct,
      score: correct ? score + 1 : score, questionStartTime: null,
    }));
    if (token) { /* ... attempt kaydetme ... */ }
  }, [quizState.selectedAnswer, quizState.currentQuestion, quizState.questionStartTime, quizState.score, token]);

  const goTo = useCallback((index) => {
    const { questions } = quizState;
    if (index < 0 || index >= questions.length) return;
    setQuizState(prev => ({
      ...prev, currentQuestion: questions[index], currentQuestionIndex: index,
      selectedAnswer: '', isAnswerChecked: false, isCorrect: null, showExplanation: false,
    }));
    setError(''); // Hata mesajını temizle (eğer soru geçişinde hata varsa)
  }, [quizState.questions]);

  const prevQuestion = useCallback(() => goTo(quizState.currentQuestionIndex - 1), [goTo, quizState.currentQuestionIndex]);
  const nextQuestion = useCallback(() => goTo(quizState.currentQuestionIndex + 1), [goTo, quizState.currentQuestionIndex]);
  const finishQuiz = useCallback(() => {
    if (window.confirm('Testi bitirmek istediğinizden emin misiniz?')) {
      setQuizState(prev => ({ ...prev, isQuizFinished: true }));
      clearInterval(timerRef.current); timerRef.current = null;
    }
  }, []);
  const toggleExplanation = () => setQuizState(prev => ({ ...prev, showExplanation: !prev.showExplanation }));
  
  const progressPercentage = useMemo(() => {
      if (!quizState.questions || quizState.questions.length === 0) return 0;
      return ((quizState.currentQuestionIndex + 1) / quizState.questions.length) * 100;
  }, [quizState.currentQuestionIndex, quizState.questions]);

  // Setup UI için handler'lar
  const handleSetupModeChange = (value) => {
    setSetupMode(value);
    // Mod değiştiğinde filtreleri sıfırlayabiliriz veya koruyabiliriz. Şimdilik koruyalım.
    // setSetupFilters(initialSetupFilters); 
    // setBranches([]); setTopics([]);
  };

  const handleSetupFilterChange = (e) => {
    const { name, value } = e.target;
    setSetupFilters(prev => {
      const newState = { ...prev, [name]: value };
      if (name === 'examClassificationId') {
        newState.branchId = '';
        newState.topicId = '';
      } else if (name === 'branchId') {
        newState.topicId = '';
      }
      return newState;
    });
  };

  const handleStartQuizFromSetup = () => {
    if (!setupMode) {
      toast({ title: "Uyarı", description: "Lütfen bir çözme modu seçin.", status: "warning", duration: 3000 });
      return;
    }
    if (!setupFilters.examClassificationId && !setupFilters.branchId && !setupFilters.topicId) {
        // Eğer hiçbir filtre seçilmemişse, genel bir pratik/deneme başlatılabilir.
        // Ya da en azından bir sınav tipi seçilmesi zorunlu kılınabilir.
        // Şimdilik, en az bir sınav tipi seçilmesini zorunlu tutalım.
        if (!setupFilters.examClassificationId) {
             toast({ title: "Uyarı", description: "Lütfen en azından bir sınav türü seçin.", status: "warning", duration: 3000 });
             return;
        }
    }
    initializeQuiz(setupMode, setupFilters);
  };

  // ----- RENDER KISMI -----

  // 1. Ana Yükleme Ekranı (Sayfa ilk açıldığında veya URL'den direkt quiz başlarken)
  if (pageStep === 'loading') {
    return (
      <Container maxW="container.lg" py={8} centerContent minH="80vh" display="flex" flexDirection="column" justifyContent="center">
        <Spinner size="xl" color="brand.500" thickness="4px" speed="0.65s"/>
        <Text mt={4} color={textMutedColor}>{loadingMessage}</Text>
      </Container>
    );
  }

  // 2. Kurulum (Setup) Arayüzü
  if (pageStep === 'setup') {
    return (
      <Container maxW="container.md" py={{base:6, md:10}}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl" textAlign="center" color={headingColor}>
            Soru Çözme Alanı Kurulumu
          </Heading>

          {error && ( // Setup aşamasında genel bir hata varsa göster
             <Alert status="error" variant="subtle" borderRadius="md">
                <AlertIcon /> {error}
             </Alert>
          )}

          {/* Adım 1: Mod Seçimi */}
          <Box p={6} borderWidth="1px" borderRadius="lg" borderColor={borderColor} bg={setupBoxBg} boxShadow="lg">
            <Heading as="h2" size="md" mb={4} color={headingColor}>1. Çözme Modunu Seçin</Heading>
            <RadioGroup onChange={handleSetupModeChange} value={setupMode}>
              <Stack direction={{base: "column", md: "row"}} spacing={5}>
                <Radio value="practice" colorScheme="blue" size="lg">
                  <Text fontWeight="medium" color={textColor}>Pratik Modu</Text>
                  <Text fontSize="sm" color={textMutedColor} ml={1}>(Süresiz, Açıklamalı)</Text>
                </Radio>
                <Radio value="deneme" colorScheme="purple" size="lg">
                  <Text fontWeight="medium" color={textColor}>Deneme Modu</Text>
                  <Text fontSize="sm" color={textMutedColor} ml={1}>(Süreli, Açıklamasız)</Text>
                </Radio>
              </Stack>
            </RadioGroup>
          </Box>

          {/* Adım 2: Filtre Seçimleri (Mod seçildikten sonra aktifleşir) */}
          {setupMode && (
            <Box p={6} borderWidth="1px" borderRadius="lg" borderColor={borderColor} bg={setupBoxBg} boxShadow="lg">
              <Heading as="h2" size="md" mb={5} color={headingColor}>2. Kapsamı Belirleyin (Opsiyonel)</Heading>
              <VStack spacing={4} align="stretch">
                <FormControl id="setupExamClassification">
                  <FormLabel fontSize="sm" color={textColor}>Sınav Türü:</FormLabel>
                  <Select 
                    name="examClassificationId" 
                    placeholder="-- Sınav Türü Seçin (Zorunlu) --" 
                    value={setupFilters.examClassificationId} 
                    onChange={handleSetupFilterChange}
                    bg={useColorModeValue("white", "gray.600")}
                  >
                    {examClassifications.map(ec => <option key={ec.id} value={ec.id}>{ec.name}</option>)}
                  </Select>
                </FormControl>

                <FormControl id="setupBranch" isDisabled={!setupFilters.examClassificationId || branches.length === 0}>
                  <FormLabel fontSize="sm" color={textColor}>Branş (Opsiyonel):</FormLabel>
                  <Select 
                    name="branchId" 
                    placeholder="-- Branş Seçin (Tüm Branşlar) --" 
                    value={setupFilters.branchId} 
                    onChange={handleSetupFilterChange}
                    bg={useColorModeValue("white", "gray.600")}
                  >
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </Select>
                  {!setupFilters.examClassificationId && <Text fontSize="xs" color={textMutedColor} mt={1}>Branşları listelemek için önce Sınav Türü seçin.</Text>}
                </FormControl>

                <FormControl id="setupTopic" isDisabled={!setupFilters.branchId || topics.length === 0}>
                  <FormLabel fontSize="sm" color={textColor}>Konu (Opsiyonel):</FormLabel>
                  <Select 
                    name="topicId" 
                    placeholder="-- Konu Seçin (Tüm Konular) --" 
                    value={setupFilters.topicId} 
                    onChange={handleSetupFilterChange}
                    bg={useColorModeValue("white", "gray.600")}
                  >
                    {/* Burada sadece ana konuları listeliyoruz, alt konu seçimi için daha karmaşık bir yapı gerekebilir */}
                    {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                  {!setupFilters.branchId && <Text fontSize="xs" color={textMutedColor} mt={1}>Konuları listelemek için önce Branş seçin.</Text>}
                </FormControl>
                {/* İleride soru sayısı, zorluk gibi filtreler buraya eklenebilir */}
              </VStack>
            </Box>
          )}

          {/* Başlat Butonu */}
          {setupMode && (
            <Button 
              colorScheme="brand" 
              size="lg" 
              width="full" 
              mt={6}
              onClick={handleStartQuizFromSetup}
              isLoading={quizState.isLoadingInitial} // initializeQuiz başladığında true olur
              loadingText="Başlatılıyor..."
              leftIcon={<Icon as={FaPlay} />}
              isDisabled={!setupFilters.examClassificationId && !setupFilters.branchId && !setupFilters.topicId && !setupMode} // En az bir mod seçilmeli, ve en az bir filtre (veya genel pratik)
            >
              {setupMode === 'deneme' ? "Denemeyi Başlat" : "Pratiği Başlat"}
            </Button>
          )}
        </VStack>
      </Container>
    );
  }

  // 3. Quiz Aktifken veya Bittikten Sonraki Render Mantığı (öncekiyle büyük ölçüde aynı)
  // quizState.isLoadingInitial yerine ana 'loading' state'i ve quizState.questions kontrolü kullanılabilir.
  // Ancak initializeQuiz içinde isLoadingInitial:false yapılıyor.
  
  if (quizState.isLoadingInitial && pageStep === 'quiz') { // Quiz başlatıldı ama sorular henüz yükleniyor
    return ( 
        <Container maxW="container.lg" py={8} centerContent minH="80vh">
          <Spinner size="xl" color="brand.500" thickness="4px" speed="0.65s"/>
          <Text mt={4} color={textMutedColor}>{loadingMessage}</Text>
        </Container>
    );
  }
  
  if (error && pageStep === 'quiz' && (!quizState.questions || quizState.questions.length === 0)) {
    return ( 
      <Container maxW="container.lg" mt={6}>
        <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={10} borderRadius="lg">
          <AlertIcon boxSize="40px" mr={0} as={FaExclamationTriangle}/>
          <AlertTitle mt={4} mb={1} fontSize="xl">Hata!</AlertTitle>
          <AlertDescription maxWidth="sm" mb={5}>{error}</AlertDescription>
          <Button colorScheme="red" variant="outline" onClick={() => { quizSessionIdRef.current = Date.now(); setPageStep('setup'); setError(''); initializeQuiz(setupMode, setupFilters); }} leftIcon={<Icon as={FaRedo} />}>Kuruluma Dön</Button>
           <Button as={RouterLink} to="/browse" variant="link" colorScheme="blue" mt={4}>Konulara Göz At</Button>
        </Alert>
      </Container>
    );
  }

  if (quizState.isQuizFinished) {
    const { questions, score, quizMode, quizFixedDurationSeconds, timeElapsed, quizTitle } = quizState;
    const accuracy = questions.length > 0 ? ((score / questions.length) * 100).toFixed(0) : 0;
    const accuracyColorScheme = accuracy >= 80 ? 'green' : accuracy >= 50 ? 'yellow' : 'red';
    const timeTakenOrRemaining = quizMode === 'deneme' && quizFixedDurationSeconds != null ? quizFixedDurationSeconds - timeElapsed : timeElapsed;

    return (
      <Container maxW="container.md" centerContent py={10}>
        <Card textAlign="center" p={{base:4, md:8}} variant="outline" w="full" bg={cardBg} boxShadow="xl">
          <CardBody>
            <Heading as="h2" size="xl" mb={2} color={stepIndicatorColor}>
              {quizMode === 'deneme' ? 'Deneme Tamamlandı!' : 'Pratik Tamamlandı!'}
            </Heading>
            <Text fontSize="lg" color={textColor} mb={6}>{quizTitle}</Text>
            <List spacing={3} my={6} py={5} borderTopWidth="1px" borderBottomWidth="1px" borderColor={borderColor} textAlign="left">
              <ListItem display="flex" justifyContent="space-between"><Text as="span" color={textMutedColor}>
                  {quizMode === 'deneme' && quizFixedDurationSeconds != null ? 'Kullanılan Süre:' : 'Harcanan Süre:'}
              </Text><Text as="span" fontWeight="semibold">{formatTime(timeTakenOrRemaining < 0 ? 0 : timeTakenOrRemaining)}</Text></ListItem>
              {quizMode === 'deneme' && quizFixedDurationSeconds != null && 
                <ListItem display="flex" justifyContent="space-between"><Text as="span" color={textMutedColor}>Toplam Süre:</Text><Text as="span" fontWeight="semibold">{formatTime(quizFixedDurationSeconds)}</Text></ListItem>
              }
              <ListItem display="flex" justifyContent="space-between"><Text as="span" color={textMutedColor}>Toplam Soru:</Text><Text as="span" fontWeight="semibold">{questions.length}</Text></ListItem>
              <ListItem display="flex" justifyContent="space-between"><Text as="span" color={textMutedColor}>Doğru Cevap:</Text><Text as="span" fontWeight="semibold" color="green.500">{score}</Text></ListItem>
              <ListItem display="flex" justifyContent="space-between"><Text as="span" color={textMutedColor}>Yanlış Cevap:</Text><Text as="span" fontWeight="semibold" color="red.500">{questions.length - score}</Text></ListItem>
            </List>
            <Text fontSize="lg" fontWeight="semibold" mb={1}>Başarı Oranınız:</Text>
            <Text fontSize="5xl" fontWeight="bold" color={`${accuracyColorScheme}.500`} my={4}>%{accuracy}</Text>
            <HStack spacing={4} justifyContent="center" mt={6}>
                <Button colorScheme="brand" size="lg" onClick={() => { quizSessionIdRef.current = Date.now(); setPageStep('setup'); /* initializeQuiz setup'tan çağrılacak */ }} leftIcon={<Icon as={FaRedo} />}>Yeni Test Kur</Button>
                <Button as={RouterLink} to="/browse" variant="outline" size="lg">Konu Seçimine Dön</Button>
            </HStack>
          </CardBody>
        </Card>
      </Container>
    );
  }

  // pageStep === 'quiz' ve currentQuestion varsa burası render edilir
  if (pageStep === 'quiz' && quizState.currentQuestion) {
    const { currentQuestionIndex, questions, currentQuestion, selectedAnswer, isAnswerChecked, isCorrect, score, timeElapsed, showExplanation, quizMode, quizFixedDurationSeconds, quizTitle } = quizState;
    const currentQStats = null; // Şimdilik kaldırıldı

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
    
          <Card variant="outline" my={6} bg={cardBg} boxShadow="md">
            <CardBody p={{base:4, md:6}}>
              <HStack spacing={4} wrap="wrap" fontSize="xs" color={textMutedColor} mb={4}>
                <Tag size="sm" variant='subtle' colorScheme="blue">Konu: {currentQuestion.topic?.name || 'Genel'}</Tag>
                <Tag size="sm" variant='subtle' colorScheme="purple">Tip: {currentQuestion.classification || '-'}</Tag>
              </HStack>
              <Divider my={4} />
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
              let variant = 'outline'; let currentColorScheme = 'gray'; let leftIcon = undefined; let optionSx = {};
              const optionHoverBg = useColorModeValue("gray.100", "gray.600");
    
              if (isAnswerChecked) {
                if (isCorrectAnswer) { variant = 'solid'; currentColorScheme = 'green'; leftIcon = <Icon as={FiCheckCircle} />; }
                else if (isIncorrectSelected) { variant = 'solid'; currentColorScheme = 'red'; leftIcon = <Icon as={FiXCircle} />; }
                else { variant = 'outline'; optionSx = { opacity: 0.65, _hover: {bg: optionHoverBg} }; }
              } else if (isSelected) { variant = 'solid'; currentColorScheme = 'yellow';}
              
              return (
                <Button key={opt} variant={variant} colorScheme={currentColorScheme} onClick={() => selectOption(opt)} isDisabled={isAnswerChecked} 
                        aria-pressed={isSelected} w="100%" h="auto" minH="50px" py={3} px={4} justifyContent="flex-start" textAlign="left" whiteSpace="normal" 
                        sx={optionSx} leftIcon={leftIcon}
                        _hover={{bg: !isAnswerChecked && !isSelected ? optionHoverBg : undefined}}
                >
                  <Text as="span" fontWeight="bold" mr={2}>{opt})</Text>
                  <Text as="span" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(optionText) }} />
                </Button>
              );
            })}
          </SimpleGrid>
            
          {quizMode === 'practice' && isAnswerChecked && currentQuestion.explanation && (
            <Button variant="link" colorScheme="blue" size="sm" onClick={toggleExplanation} leftIcon={<Icon as={FaLightbulb}/>} mb={4}>
              {showExplanation ? 'Açıklamayı Gizle' : 'Açıklamayı Göster'}
            </Button>
          )}
          {quizMode === 'practice' && (
            <Collapse in={showExplanation && isAnswerChecked && !!currentQuestion.explanation} animateOpacity>
                <Box p={4} mt={0} borderWidth="1px" borderRadius="md" borderColor={useColorModeValue("blue.200", "blue.700")} bg={useColorModeValue("blue.50", "blue.900")} mb={6}>
                    <Heading size="sm" mb={2} color={useColorModeValue("blue.700", "blue.200")}>Açıklama:</Heading>
                    <Box dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentQuestion.explanation) }} 
                         sx={{ p:{my:2}, ul:{my:2, ml:4}, ol:{my:2,ml:4}, img: {maxW:"100%", my:2, borderRadius:"md"} }}/>
                </Box>
            </Collapse>
          )}
    
          <Flex justify="space-between" align="center" wrap="wrap" gap={3} p={5} bg={quizInfoBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor} mt={6} boxShadow="sm">
            <IconButton icon={<Icon as={FaArrowLeft} />} onClick={prevQuestion} 
                isDisabled={currentQuestionIndex === 0 || (quizMode === 'deneme')}
                aria-label={quizMode === 'deneme' ? "Denemede önceki soruya dönülemez" : "Önceki Soru"} 
                title={quizMode === 'deneme' ? "Denemede önceki soruya dönülemez" : "Önceki Soru"} 
                variant="ghost"/>
            <HStack flex="1" justifyContent="center" spacing={4}>
              {!isAnswerChecked ? (
                <Button colorScheme="brand" onClick={checkAnswer} isDisabled={!selectedAnswer} aria-label="Cevabı Kontrol Et" leftIcon={<Icon as={FaCheck} />}>Kontrol Et</Button>
              ) : (
                <Text fontWeight="bold" color={isCorrect ? 'green.500' : 'red.500'} fontSize="lg">
                  <Icon as={isCorrect ? FiCheckCircle : FiXCircle} mr={2} verticalAlign="middle" />
                  {isCorrect ? 'Doğru!' : `Yanlış (Doğru: ${currentQuestion.correctAnswer})`}
                </Text>
              )}
            </HStack>
            {currentQuestionIndex < questions.length - 1 ? (
              <IconButton icon={<Icon as={FaArrowRight} />} onClick={nextQuestion} 
                isDisabled={!isAnswerChecked && quizMode === 'practice'} 
                aria-label="Sonraki Soru" title="Sonraki Soru" variant="ghost" />
            ) : (
              <Button colorScheme="green" onClick={finishQuiz} isDisabled={!isAnswerChecked} aria-label="Testi Bitir" title="Testi Bitir" leftIcon={<Icon as={FaFlagCheckered} />}>Testi Bitir</Button>
            )}
          </Flex>
        </Container>
      );
  }

  // Eğer pageStep 'setup', 'quiz', 'finished', 'loading' dışında bir değer alırsa veya
  // 'quiz' adımında currentQuestion null ise (initializeQuiz sonrası hata veya soru yoksa)
  // bu fallback gösterilir. Hata ve soru yok durumları zaten yukarıda ele alındı.
  return (
    <Container centerContent py={10}>
        <Alert status="info">
            <AlertIcon />
            Sayfa yükleniyor veya beklenmedik bir durum oluştu. Lütfen bekleyin veya sayfayı yenileyin.
        </Alert>
    </Container>
  );

}

export default SolvePage;
