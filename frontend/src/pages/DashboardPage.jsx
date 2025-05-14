import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert, AlertIcon, Box, Container, Heading, Text, Icon, SimpleGrid, Card, CardHeader, CardBody,
  useColorModeValue, VStack, Center, Tabs, TabList, TabPanels, Tab, TabPanel, IconButton,
  Stat, StatLabel, StatNumber, StatHelpText, StatArrow, StatGroup, HStack,
  Progress, Divider, Badge, Flex, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Tooltip, ScaleFade, useInterval
} from '@chakra-ui/react';
import { 
  FaChartBar, FaExclamationTriangle, FaInfoCircle, FaListAlt, FaRedo, 
  FaExclamationCircle, FaChartLine, FaBullseye, FaStar, FaBookOpen, FaPencilAlt,
  FaUserGraduate, FaBrain , FaHourglassHalf, FaCalendarAlt, FaSeedling, FaMagic
} from 'react-icons/fa';
import { FiActivity, FiTarget, FiZap, FiTrendingUp, FiTrendingDown, FiCheckCircle, FiMinusCircle, FiCpu } from "react-icons/fi";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, BarController, PointElement, LineElement, Title, Tooltip as ChartTooltip, Legend, TimeScale, Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { tr } from 'date-fns/locale';

// Yeni component'leri import ediyoruz
import DashboardLoadingScreen from '../components/dashboard/DashboardLoadingScreen';
import DashboardErrorState from '../components/dashboard/DashboardErrorState';
import DashboardNoDataState from '../components/dashboard/DashboardNoDataState';
import OverviewTab from '../components/dashboard/OverviewTab';
import StrategicSuggestionsTab from '../components/dashboard/StrategicSuggestionsTab';
import DetailedTopicAnalysisTab from '../components/dashboard/DetailedTopicAnalysisTab';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, BarController, PointElement, LineElement, Title, ChartTooltip, Legend, TimeScale, Filler
);

const API_BASE_URL = import.meta.env.VITE_API_URL;

const backendUrls = {
    summary: `${API_BASE_URL}/api/stats/my-summary`,
    detailed: `${API_BASE_URL}/api/stats/my-detailed`,
    weakTopics: `${API_BASE_URL}/api/stats/my-topic-errors`,
    globalAvg: `${API_BASE_URL}/api/stats/global-averages`,
    weeklyProgress: `${API_BASE_URL}/api/stats/my-weekly-progress`,
    timeSpentPerTopic: `${API_BASE_URL}/api/stats/my-time-spent-per-topic`
};

const STRONG_TOPIC_ACCURACY_THRESHOLD = 85;
const STRONG_TOPIC_MIN_ATTEMPTS = 10;
const MIN_TIME_FOR_EFFECTIVE_STUDY_SECONDS = 60 * 15; 
const TREND_ANALYSIS_WEEKS = 4;
const LOADING_MESSAGE_INTERVAL = 1800;
const POST_ANALYTICS_MESSAGE_DELAY = 600;
const FINAL_LOADING_MESSAGE_DELAY = 700;

const formatTime = totalSeconds => {
    if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

function DashboardPage() {
    const [summaryStats, setSummaryStats] = useState(null);
    const [detailedStats, setDetailedStats] = useState([]);
    const [weakTopics, setWeakTopics] = useState([]);
    const [strongTopics, setStrongTopics] = useState([]);
    const [globalAvgData, setGlobalAvgData] = useState(null);
    const [weeklyProgressData, setWeeklyProgressData] = useState([]);
    const [timeSpentPerTopicData, setTimeSpentPerTopicData] = useState([]);
    const [studyPlanSuggestions, setStudyPlanSuggestions] = useState([]);
    
    const [pageLoading, setPageLoading] = useState(true);
    const loadingMessagesList = useMemo(() => [
        "Kişisel verileriniz senkronize ediliyor...",
        "Performans metrikleriniz hesaplanıyor...",
        "Öğrenme örüntüleriniz analiz ediliyor...",
        "Stratejik yol haritanız oluşturuluyor...",
        "Dijital Mentorunuz hazırlanıyor!"
    ], []);
    const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessagesList[0]);
    
    const [performanceTrend, setPerformanceTrend] = useState({ trend: 'stable', change: 0, description: 'Veri bekleniyor...' }); 
    const [activityLevel, setActivityLevel] = useState({ level: 'stable', description: 'Veri bekleniyor...' }); 
    const [consistencyScore, setConsistencyScore] = useState({ score: null, description: 'Veri bekleniyor...', value: null });


    const [error, setError] = useState('');
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const cardBg = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const headingColor = useColorModeValue("gray.700", "gray.100");
    const textColor = useColorModeValue("gray.600", "gray.300");
    const textMutedColor = useColorModeValue("gray.500", "gray.400");
    const weakTopicCardBg = useColorModeValue('red.50', 'rgba(224, 49, 49, 0.15)');
    const weakTopicCardBorder = useColorModeValue('red.200', 'red.700');
    const strongTopicCardBg = useColorModeValue('green.50', 'rgba(56, 161, 105, 0.15)');
    const strongTopicCardBorder = useColorModeValue('green.200', 'green.700');
    const suggestionCardBg = useColorModeValue('blue.50', 'rgba(49, 130, 206, 0.15)');
    const suggestionCardBorder = useColorModeValue('blue.200', 'blue.700');
    const chartBorderColor = useColorModeValue('rgba(79, 59, 169, 0.7)', 'rgba(159, 122, 234, 0.9)');
    const chartBgColor = useColorModeValue('rgba(79, 59, 169, 0.15)', 'rgba(159, 122, 234, 0.3)');

    useInterval(() => {
        if (pageLoading) {
            setCurrentLoadingMessage(prev => {
                const currentIndex = loadingMessagesList.indexOf(prev);
                return loadingMessagesList[(currentIndex + 1) % loadingMessagesList.length];
            });
        }
    }, pageLoading ? LOADING_MESSAGE_INTERVAL : null);

    const fetchDashboardData = useCallback(async () => {
        setPageLoading(true); 
        setCurrentLoadingMessage(loadingMessagesList[0]); 
        setError('');
        if (!token) { 
            setError("Verilerinizi görebilmek için lütfen giriş yapın."); 
            setPageLoading(false); 
            return; 
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            setCurrentLoadingMessage(loadingMessagesList[0]); 
            const requests = [
                axios.get(backendUrls.summary, config), axios.get(backendUrls.detailed, config),
                axios.get(backendUrls.weakTopics, config), axios.get(backendUrls.globalAvg, config),
                axios.get(backendUrls.weeklyProgress, config), axios.get(backendUrls.timeSpentPerTopic, config)
            ];
            const responses = await Promise.allSettled(requests);
            
            await new Promise(resolve => setTimeout(resolve, POST_ANALYTICS_MESSAGE_DELAY / 2)); 
            setCurrentLoadingMessage(loadingMessagesList[1]); 
            await new Promise(resolve => setTimeout(resolve, POST_ANALYTICS_MESSAGE_DELAY / 2));
            
            const [summaryRes, detailedRes, weakTopicsRes, globalAvgRes, weeklyProgressRes, timeSpentRes] = responses;

            if (summaryRes.status === 'fulfilled') setSummaryStats(summaryRes.value.data || null);
            else console.error("Özet istatistikleri çekilemedi:", summaryRes.reason);

            if (detailedRes.status === 'fulfilled') {
                const data = Array.isArray(detailedRes.value.data) ? detailedRes.value.data : [];
                setDetailedStats(data);
                const strong = data.filter(s => s.accuracy >= STRONG_TOPIC_ACCURACY_THRESHOLD && s.totalAttempts >= STRONG_TOPIC_MIN_ATTEMPTS).sort((a,b) => b.accuracy - a.accuracy);
                setStrongTopics(strong);
            } else { console.error("Detaylı istatistikler çekilemedi:", detailedRes.reason); setDetailedStats([]); setStrongTopics([]); }
            
            if (weakTopicsRes.status === 'fulfilled') setWeakTopics(Array.isArray(weakTopicsRes.value.data) ? weakTopicsRes.value.data : []);
            else { console.error("Zayıf konular çekilemedi:", weakTopicsRes.reason); setWeakTopics([]); }

            if (globalAvgRes.status === 'fulfilled') setGlobalAvgData(globalAvgRes.value.data || null);
            else console.error("Genel ortalamalar çekilemedi:", globalAvgRes.reason);

            if (weeklyProgressRes.status === 'fulfilled') {
                const progressData = Array.isArray(weeklyProgressRes.value.data) ? weeklyProgressRes.value.data : [];
                setWeeklyProgressData(progressData);
            } else { console.error("Haftalık gelişim verileri çekilemedi:", weeklyProgressRes.reason); }

            if (timeSpentRes.status === 'fulfilled') setTimeSpentPerTopicData(Array.isArray(timeSpentRes.value.data) ? timeSpentRes.value.data : []);
            else { console.error("Harcanan süre verisi çekilemedi:", timeSpentRes.reason); }

            if (responses.some(res => res.status === 'rejected')) {
                setError('Bazı dashboard verileri yüklenirken sorun oluştu.');
            }
            await new Promise(resolve => setTimeout(resolve, POST_ANALYTICS_MESSAGE_DELAY));
            setCurrentLoadingMessage(loadingMessagesList[2]); 
            
        } catch (err) {
            console.error("Dashboard verileri çekilirken genel hata:", err);
            setError('Dashboard verileri yüklenirken beklenmedik bir hata oluştu.');
        } finally {
            setTimeout(() => {
                setCurrentLoadingMessage(loadingMessagesList[loadingMessagesList.length -1]); 
                setTimeout(() => {
                    setPageLoading(false);
                }, FINAL_LOADING_MESSAGE_DELAY); 
            }, POST_ANALYTICS_MESSAGE_DELAY); 
        }
    }, [token, loadingMessagesList]);

    useEffect(() => {
        if (token) { fetchDashboardData(); } 
        else { setPageLoading(false); setError("Lütfen giriş yapınız."); }
    }, [fetchDashboardData, token]);

    useEffect(() => {
        if (pageLoading || weeklyProgressData.length < 2) {
            setPerformanceTrend({ trend: 'insufficient_data', change: 0, description: 'Performans trendi için daha fazla veri gerekiyor.' });
            setActivityLevel({ level: 'insufficient_data', description: 'Aktivite seviyesi için daha fazla veri gerekiyor.' });
            return;
        }
        const dataPoints = Math.min(weeklyProgressData.length, TREND_ANALYSIS_WEEKS);
        if (dataPoints < 2) {
             setPerformanceTrend({ trend: 'insufficient_data', change: 0, description: 'Performans trendi için daha fazla veri gerekiyor.' });
             setActivityLevel({ level: 'insufficient_data', description: 'Aktivite seviyesi için daha fazla veri gerekiyor.' });
             return;
        }
        const recentWeeks = weeklyProgressData.slice(-dataPoints);
        const accuracies = recentWeeks.map(d => d.accuracy);
        const attempts = recentWeeks.map(d => d.totalAttempts);
        const midPoint = Math.ceil(dataPoints / 2);
        const firstHalfAccuracy = accuracies.slice(0, midPoint);
        const secondHalfAccuracy = accuracies.slice(midPoint);
        const firstHalfAttempts = attempts.slice(0, midPoint);
        const secondHalfAttempts = attempts.slice(midPoint);
        const avgAccFirst = firstHalfAccuracy.reduce((a, b) => a + b, 0) / (firstHalfAccuracy.length || 1);
        const avgAccSecond = secondHalfAccuracy.reduce((a, b) => a + b, 0) / (secondHalfAccuracy.length || 1);
        const accuracyChange = secondHalfAccuracy.length > 0 ? avgAccSecond - avgAccFirst : 0;
        let trend = 'stable';
        let trendDesc = `Başarı oranınız son ${dataPoints} haftada genel olarak stabil.`;
        if (accuracyChange > 3) { trend = 'improving'; trendDesc = `Başarı oranınız son ${dataPoints} haftada %${accuracyChange.toFixed(1)} artış gösteriyor!`; }
        else if (accuracyChange < -3) { trend = 'declining'; trendDesc = `Başarı oranınız son ${dataPoints} haftada %${Math.abs(accuracyChange).toFixed(1)} düşüş gösteriyor.`; }
        setPerformanceTrend({ trend, change: accuracyChange, description: trendDesc });
        const avgAttFirst = firstHalfAttempts.reduce((a, b) => a + b, 0) / (firstHalfAttempts.length || 1);
        const avgAttSecond = secondHalfAttempts.reduce((a, b) => a + b, 0) / (secondHalfAttempts.length || 1);
        let activity = 'stable';
        let activityDesc = `Haftalık soru çözme aktiviteniz son ${dataPoints} haftada benzer seviyede.`;
        if (secondHalfAttempts.length > 0) {
            if (avgAttFirst === 0 && avgAttSecond > 0) { activity = 'increasing'; activityDesc = `Tebrikler! Son haftalarda soru çözmeye başladınız ve aktiviteniz artıyor.`; }
            else if (avgAttFirst > 0 && avgAttSecond > avgAttFirst * 1.15) { activity = 'increasing'; activityDesc = `Soru çözme aktivitenizde belirgin bir artış var. Harika!`; }
            else if (avgAttFirst > 0 && avgAttSecond < avgAttFirst * 0.85) { activity = 'decreasing'; activityDesc = `Soru çözme aktivitenizde bir düşüş gözleniyor. Tekrar ritim kazanmaya ne dersiniz?`;}
        }
        setActivityLevel({ level: activity, description: activityDesc });
        if(accuracies.length > 1){
            const mean = accuracies.reduce((a,b) => a+b, 0) / accuracies.length;
            const stdDev = Math.sqrt(accuracies.map(x => Math.pow(x - mean, 2)).reduce((a,b) => a+b, 0) / accuracies.length);
            let consScoreText = null; // score -> scoreText olarak değiştirdim, state ile çakışmasın
            let consDesc = "Tutarlılık verisi hesaplanıyor...";
            if(stdDev < 5) { consScoreText = 'high'; consDesc = "Konulardaki başarınız oldukça tutarlı, bu harika!"; }
            else if (stdDev < 10) { consScoreText = 'medium'; consDesc = "Genel olarak tutarlı bir performansınız var, bazı ufak dalgalanmalar olabilir."; }
            else { consScoreText = 'low'; consDesc = "Başarı oranlarınız konular arasında değişkenlik gösteriyor. Daha stabil bir öğrenme için odaklanabilirsiniz."; }
            setConsistencyScore({score: consScoreText, description: consDesc, value: stdDev.toFixed(1)});
        } else {
            setConsistencyScore({score: null, description: "Tutarlılık analizi için daha fazla haftalık veri gerekiyor.", value: null});
        }
    }, [weeklyProgressData, pageLoading]);
    
    useEffect(() => {
        if (pageLoading) return; 
        const suggestions = [];
        if (performanceTrend.trend === 'declining') {
            suggestions.push({
                id: 'trend-decline', type: 'Performans Uyarısı', title: "Genel Başarıda Düşüş Eğilimi!",
                icon: FiTrendingDown, color: "red.500",
                reason: performanceTrend.description + " Bu durumu tersine çevirmek için zayıf olduğunuz konulara odaklanın ve düzenli pratik yapın.",
                actions: [{ label: "Zayıf Konularımı İncele", scrollTarget: "detailed-analysis-tab-content", icon: FiTarget, colorScheme: "red" }], 
                priority: 0 
            });
        }
        weakTopics.slice(0, activityLevel.level === 'decreasing' && performanceTrend.trend !== 'improving' ? 1 : 2).forEach(wt => {
            const timeSpentInfo = timeSpentPerTopicData.find(ts => ts.topicId === wt.topicId);
            const timeSpentText = timeSpentInfo ? `(${formatTime(timeSpentInfo.totalTimeSpentSeconds)} harcandı)` : '(henüz zaman harcanmamış)';
            suggestions.push({
                id: `weak-${wt.topicId}`, type: 'Öncelikli Gelişim Alanı', title: wt.topicName,
                icon: FaExclamationCircle, color: "orange.500",
                reason: `Başarı %${wt.accuracy.toFixed(1)} (${wt.correctAttempts}/${wt.totalAttempts} D) ${timeSpentText}. Bu konuya odaklanmak genel başarınızı önemli ölçüde artırabilir.`,
                actions: [
                    { label: "Konu Anlatımı", to: `/lectures/topic/${wt.topicId}`, icon: FaBookOpen, colorScheme: "orange" },
                    { label: "Pratik Yap", to: `/solve?topicId=${wt.topicId}&mode=practice`, icon: FaPencilAlt, colorScheme: "orange" }
                ], priority: 1 
            });
        });
        if (activityLevel.level === 'decreasing' && performanceTrend.trend !== 'improving') {
            suggestions.push({
                id: 'activity-low', type: 'Motivasyon ve Aktivite', title: "Çalışma Temponuzda Yavaşlama Var",
                icon: FiMinusCircle, color: "yellow.500",
                reason: activityLevel.description + " Küçük adımlarla başlayarak tekrar ivme kazanabilirsiniz.",
                actions: [
                    strongTopics.length > 0 
                        ? { label: `Güçlü Konunla Hızlı Başla (${strongTopics[0].topicName.substring(0,12)}...)`, to: `/solve?topicId=${strongTopics[0].topicId}&mode=practice&count=5`, icon: FaStar, colorScheme:"yellow" }
                        : { label: "5 Soruluk Hızlı Pratik", to: "/solve?mode=practice&count=5", icon: FaPencilAlt, colorScheme:"yellow" }
                ], priority: 1 
            });
        }
        if (performanceTrend.trend === 'improving' && performanceTrend.change > 0) {
             suggestions.push({
                id: 'trend-improve', type: 'Tebrikler!', title: "Yükselen Performans!",
                icon: FiTrendingUp, color: "green.500",
                reason: performanceTrend.description + " Bu harika ivmeyi koruyarak hedeflerinize daha da yaklaşın.",
                actions: [{ label: "Yeni Konular Keşfet", to: "/browse", icon: FiZap, colorScheme: "green" }],
                priority: strongTopics.length > 2 ? 3 : 2
            });
        }
        strongTopics.slice(0,1).forEach(st => {
            const timeSpentInfo = timeSpentPerTopicData.find(ts => ts.topicId === st.topicId);
            const timeSpentText = timeSpentInfo ? `(${formatTime(timeSpentInfo.totalTimeSpentSeconds)} harcandı)` : '';
            suggestions.push({
               id: `strong-${st.topicId}`, type: 'Gücünü Koru', title: st.topicName,
               icon: FaStar, color: "teal.500",
               reason: `Bu konuda %${st.accuracy.toFixed(1)} başarıdasınız ${timeSpentText}. Bilgilerinizi taze tutmak için periyodik tekrarlar faydalı olacaktır.`,
               actions: [ { label: "Hızlı Tekrar (10 Soru)", to: `/solve?topicId=${st.topicId}&mode=practice&count=10`, icon: FaSeedling, colorScheme:"teal" } ],
               priority: 3
           });
       });
       if(suggestions.length === 0 && summaryStats && summaryStats.totalAttempts > 5){
           suggestions.push({
               id: 'general-ok', type: 'İyi Durumdasın', title: "Her Şey Yolunda Görünüyor!",
               icon: FiCheckCircle, color: "green.500",
               reason: "Genel performansınız dengeli ve belirgin bir sorun alanı yok. Öğrenmeye ve pratik yapmaya devam edin!",
               actions: [{label: "Yeni Konulara Göz At", to:"/browse", icon: FaBookOpen, colorScheme:"blue"}],
               priority: 5
           })
       }
        setStudyPlanSuggestions(suggestions.sort((a,b) => a.priority - b.priority).slice(0, 4));
    }, [weakTopics, strongTopics, detailedStats, timeSpentPerTopicData, performanceTrend, activityLevel, pageLoading, navigate]);

    const weeklyChartData = useMemo(() => { 
        const labels = weeklyProgressData.map(d => new Date(d.weekStartDate));
        const accuracyData = weeklyProgressData.map(d => d.accuracy);
        const attemptsData = weeklyProgressData.map(d => d.totalAttempts);
        return {
            labels,
            datasets: [
                {
                    label: 'Haftalık Başarı (%)', data: accuracyData, borderColor: chartBorderColor,
                    backgroundColor: chartBgColor, yAxisID: 'yAccuracy', tension: 0.3, fill: true,
                    pointBackgroundColor: chartBorderColor, pointBorderColor: cardBg, pointHoverRadius: 7, pointRadius: 4,
                },
                {
                    label: 'Çözülen Soru Sayısı', data: attemptsData, 
                    borderColor: useColorModeValue('rgba(255, 159, 64, 0.7)', 'rgba(255, 159, 64, 0.9)'),
                    backgroundColor: useColorModeValue('rgba(255, 159, 64, 0.15)', 'rgba(255, 159, 64, 0.3)'), 
                    yAxisID: 'yAttempts', tension: 0.3, fill: true, type: 'bar',
                    pointBackgroundColor: useColorModeValue('rgba(255, 159, 64, 0.7)', 'rgba(255, 159, 64, 0.9)'),
                    pointBorderColor: cardBg, pointHoverRadius: 7, pointRadius: 4,
                },
            ],
        };
    }, [weeklyProgressData, chartBorderColor, chartBgColor, useColorModeValue, cardBg]);

    const weeklyChartOptions = useMemo(() => ({ 
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false, }, 
        plugins: { 
            legend: { position: 'bottom', labels: { color: textColor, padding:15, usePointStyle: true, pointStyle: 'rectRounded', boxWidth:12, font: {size: 10} } }, 
            title: { display: false },
            tooltip: {
                enabled: true, backgroundColor: cardBg, titleColor: headingColor, bodyColor: textColor,
                borderColor: borderColor, borderWidth: 1, padding: 10, usePointStyle: true,
                callbacks: { labelPointStyle: function(context) { return { pointStyle: 'rectRounded', rotation: 0 }; } }
            }
        },
        scales: {
            x: { 
                type: 'time', time: { unit: 'week', tooltipFormat: 'PPP', displayFormats: { week: 'dd MMM' } }, 
                title: { display: false }, ticks: { color: textMutedColor, major: { enabled: true }, font: {size:10} }, grid: { color: borderColor, drawBorder: false }
            },
            yAccuracy: { 
                type: 'linear', display: true, position: 'left',
                title: { display: true, text: 'Başarı (%)', color: textColor, font:{size:12} }, min: 0, max: 100,
                ticks: { color: textMutedColor, stepSize: 20, font: {size:10} }, grid: { color: borderColor, drawBorder: false }
            },
            yAttempts: { 
                type: 'linear', display: true, position: 'right',
                title: { display: true, text: 'Soru Sayısı', color: textColor, font:{size:12} }, min: 0, 
                suggestedMax: weeklyProgressData.length > 0 ? Math.max(...weeklyProgressData.map(d=>d.totalAttempts), 10) + 5 : 20,
                ticks: { color: textMutedColor, stepSize: weeklyProgressData.length > 0 ? Math.ceil(Math.max(...weeklyProgressData.map(d=>d.totalAttempts), 10) / 5) : 5, font: {size:10} }, // Dinamik stepSize
                grid: { display: false }
            }
        },
        adapters: { date: { locale: tr, }, },
    }), [textColor, headingColor, cardBg, borderColor, textMutedColor, weeklyProgressData]);
  if (pageLoading) {
    return (
      <Container maxW="container.lg" py={8} centerContent minH="80vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
        <Icon as={FaBrain} boxSize="52px" color="brand.500" mb={6} sx={{ animation: "pulse 1.8s ease-in-out infinite" }}/>
        <Heading size="md" color={headingColor} mb={2} textAlign="center">Dijital Mentorunuz Sizin İçin Hazırlanıyor</Heading>
        <ScaleFade initialScale={0.9} in={true} key={currentLoadingMessage}>
            <Text mt={2} color={textMutedColor} fontSize="sm" textAlign="center" maxW="sm">
                {currentLoadingMessage}
            </Text>
        </ScaleFade>
        <Progress size="xs" isIndeterminate colorScheme="brand" w="220px" mt={6} borderRadius="md"/>
        <style>
          {`
            @keyframes pulse {
              0% { transform: scale(1); opacity: 0.7; }
              50% { transform: scale(1.12); opacity: 1; }
              100% { transform: scale(1); opacity: 0.7; }
            }
          `}
        </style>
      </Container>
    );
  }

  const isAnyDataAvailable = summaryStats || detailedStats.length > 0 || weakTopics.length > 0 || weeklyProgressData.length > 0;

  if (error && !isAnyDataAvailable) {
    return (
      <Container maxW="container.lg" mt={6}>
        <Alert status="error" variant="left-accent" borderRadius="md" p={6} bg={useColorModeValue("red.50", "red.800")} borderColor={useColorModeValue("red.200", "red.600")}>
          <AlertIcon color="red.500" />
          <Box flex="1">
            <AlertTitle color={useColorModeValue("red.700", "red.100")}>Bir Hata Oluştu!</AlertTitle>
            <AlertDescription color={useColorModeValue("red.600", "red.200")}>{error}</AlertDescription>
          </Box>
          <Button colorScheme="red" variant="outline" onClick={fetchDashboardData} ml="auto" leftIcon={<Icon as={FaRedo} />}>
            Tekrar Dene
          </Button>
        </Alert>
      </Container>
    );
  }
  
  if (!token && error) {
     return (
      <Container maxW="container.lg" mt={6}>
        <Alert status="warning" variant="left-accent" borderRadius="md" p={6}>
          <AlertIcon />
          <Box><AlertTitle>Erişim Reddedildi</AlertTitle><AlertDescription>{error}</AlertDescription></Box>
          <Button as={RouterLink} to="/login" colorScheme="blue" ml="auto">Giriş Yap</Button>
        </Alert>
      </Container>
     );
  }

  const noDataForStrategy = !pageLoading && !isAnyDataAvailable && !error;

  return (
    <Container maxW="container.xl" py={8} className="digital-mentor-page">
      <VStack spacing={8} align="stretch">
        <Flex direction={{base: "column", md: "row"}} justify="space-between" align={{base: "flex-start", md: "center"}} gap={{base:2, md:4}} mb={2}>
            <HStack spacing={4}>
                <Icon as={FaBrain} color={headingColor} boxSize={{base:10, md:12}} />
                <VStack align="flex-start" spacing={0}>
                    <Heading as="h1" size={{base:"lg", md:"xl"}} color={headingColor} fontWeight="bold">
                        Dijital Mentorun, {user?.username}!
                    </Heading>
                    <Text color={textColor} fontSize={{base:"sm", md:"md"}}>
                        Başarıya giden yolda kişisel analiz ve strateji merkezin.
                    </Text>
                </VStack>
            </HStack>
        </Flex>
        {error && isAnyDataAvailable && ( 
            <Alert status="warning" variant="subtle" borderRadius="md">
                <AlertIcon /> {error} (Bazı veriler eksik olabilir)
            </Alert>
        )}
        {noDataForStrategy && (
             <Alert status="info" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={10} borderRadius="xl" bg={useColorModeValue("blue.50", "rgba(49,130,206,0.1)")} borderColor={useColorModeValue("blue.200", "blue.700")} borderWidth="1px" boxShadow="lg">
                 <Icon as={FaInfoCircle} boxSize="48px" color="blue.400" />
                 <AlertTitle mt={4} mb={2} fontSize="2xl" fontWeight="bold" color={useColorModeValue("blue.700", "blue.200")}>Stratejik Verileriniz Henüz Oluşmadı</AlertTitle>
                 <AlertDescription maxWidth="lg" mb={6} color={textColor} lineHeight="tall">
                    Dijital Mentorunuzun size özel analizler ve kişiselleştirilmiş öneriler sunabilmesi için platformda biraz daha aktif olmanız (soru çözmeniz, dersleri incelemeniz) gerekmektedir. Öğrenme yolculuğunuza hemen başlayın!
                 </AlertDescription>
                 <Button as={RouterLink} to="/solve" colorScheme="brand" size="lg" mt={4} px={8} py={6} leftIcon={<Icon as={FaPencilAlt} />} 
                    boxShadow="md" _hover={{boxShadow:"xl", transform:"translateY(-2px)"}}
                 >
                    Hemen Soru Çözmeye Başla!
                 </Button>
             </Alert>
        )}

        {!noDataForStrategy && (
        <Tabs variant="line" colorScheme="brand" isLazy size={{base:"sm", md:"md"}}>
          <TabList flexWrap="wrap" justifyContent="flex-start" borderColor={borderColor} overflowX="auto" sx={{ "&::-webkit-scrollbar": { display: "none" }, "-ms-overflow-style": "none", "scrollbar-width": "none" }}>
            <Tab fontWeight="semibold" fontSize={{base:"sm", md:"md"}} py={3} px={5} _selected={{ color: useColorModeValue('brand.600', 'brand.200'), borderColor: useColorModeValue('brand.500', 'brand.300'), borderBottomWidth: "3px" }}><Icon as={FaChartBar} mr={2}/>Genel Performans</Tab>
            <Tab fontWeight="semibold" fontSize={{base:"sm", md:"md"}} py={3} px={5} _selected={{ color: useColorModeValue('brand.600', 'brand.200'), borderColor: useColorModeValue('brand.500', 'brand.300'), borderBottomWidth: "3px" }}><Icon as={FiTarget} mr={2}/>Stratejik Öneriler</Tab>
            <Tab fontWeight="semibold" fontSize={{base:"sm", md:"md"}} py={3} px={5} _selected={{ color: useColorModeValue('brand.600', 'brand.200'), borderColor: useColorModeValue('brand.500', 'brand.300'), borderBottomWidth: "3px" }}><Icon as={FaBrain} mr={2}/>Detaylı Konu Analizi</Tab>
          </TabList>

          <TabPanels mt={5} bg={cardBg} borderRadius="xl" boxShadow="xl" p={{base:3, md:6}} borderWidth="1px" borderColor={borderColor}>
            <TabPanel px={{base:1, md:2}} py={2}>
                <OverviewTab
                    summaryStats={summaryStats}
                    globalAvgData={globalAvgData}
                    weeklyProgressData={weeklyProgressData}
                    weeklyChartOptions={weeklyChartOptions}
                    weeklyChartData={weeklyChartData}
                    performanceTrend={performanceTrend}
                    activityLevel={activityLevel}
                    consistencyScore={consistencyScore}
                    cardBg={useColorModeValue("gray.50", "gray.750")}
                    borderColor={borderColor}
                    headingColor={headingColor}
                    textColor={textColor}
                    textMutedColor={textMutedColor}
                />
            </TabPanel>
            <TabPanel px={{base:1, md:2}} py={2}>
                <StrategicSuggestionsTab
                    studyPlanSuggestions={studyPlanSuggestions}
                    suggestionCardBg={suggestionCardBg}
                    suggestionCardBorder={suggestionCardBorder}
                    headingColor={headingColor}
                    textColor={textColor}
                />
            </TabPanel>
            <TabPanel px={{base:0, md:1}} py={2}>
                <DetailedTopicAnalysisTab
                    detailedStats={detailedStats}
                    weakTopics={weakTopics}
                    strongTopics={strongTopics}
                    timeSpentPerTopicData={timeSpentPerTopicData}
                    cardBg={cardBg}
                    borderColor={borderColor}
                    headingColor={headingColor}
                    textColor={textColor}
                    textMutedColor={textMutedColor}
                    weakTopicRowBg={weakTopicCardBg}
                    strongTopicRowBg={strongTopicCardBg}
                    formatTime={formatTime}
                />
            </TabPanel>
          </TabPanels>
        </Tabs>
        )}
      </VStack>
    </Container>
  );
}

export default DashboardPage;