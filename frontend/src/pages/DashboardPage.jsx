import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Heading, Text, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription,
  Button, Icon, SimpleGrid, Card, CardHeader, CardBody, Table, Thead, Tbody, Tr, Th, Td,
  TableContainer, Link as ChakraLink, List, ListItem, Skeleton, SkeletonText, useColorModeValue,
  VStack, Center, Tabs, TabList, TabPanels, Tab, TabPanel, Stat, StatLabel, StatNumber, StatGroup
} from '@chakra-ui/react';
import { FaChartBar, FaExclamationTriangle, FaInfoCircle, FaListAlt, FaRedo, FaExclamationCircle, FaChartLine, FaGlobeEurope, FaRecycle } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, TimeSeriesScale } from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register( CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, TimeSeriesScale );

const API_BASE_URL = import.meta.env.VITE_API_URL;

// URL'ler component dışında tanımlandı
const backendUrls = {
    summary: `${API_BASE_URL}/api/stats/my-summary`,
    detailed: `${API_BASE_URL}/api/stats/my-detailed`,
    weakTopics: `${API_BASE_URL}/api/stats/my-topic-errors`,
    globalAvg: `${API_BASE_URL}/api/stats/global-averages`,
    weeklyProgress: `${API_BASE_URL}/api/stats/my-weekly-progress`
};

const WEAK_TOPIC_ACCURACY_THRESHOLD = 65;
const WEAK_TOPIC_MIN_ATTEMPTS = 5;

function DashboardPage() {
    const [summaryStats, setSummaryStats] = useState(null);
    const [detailedStats, setDetailedStats] = useState([]);
    const [weakTopicsData, setWeakTopicsData] = useState([]);
    const [globalAvgData, setGlobalAvgData] = useState(null);
    const [weeklyProgressData, setWeeklyProgressData] = useState([]);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [dashboardError, setDashboardError] = useState('');
    const { token, user } = useAuth();

    const weakBgColor = useColorModeValue('yellow.100', 'yellow.900');
    const weakTextColor = useColorModeValue('yellow.800', 'yellow.100');

    const fetchDashboardData = useCallback(async () => {
        setDashboardLoading(true);
        setDashboardError('');
        if (!token) { setDashboardError("Giriş yapmadığınız için veriler getirilemedi."); setDashboardLoading(false); return; }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [summaryRes, detailedRes, weakTopicsRes, globalAvgRes, weeklyProgressRes] = await Promise.all([
                axios.get(backendUrls.summary, config),
                axios.get(backendUrls.detailed, config),
                axios.get(backendUrls.weakTopics, config),
                axios.get(backendUrls.globalAvg, config),
                axios.get(backendUrls.weeklyProgress, config)
            ]);

            setSummaryStats(typeof summaryRes.data === 'object' && summaryRes.data !== null ? summaryRes.data : null);

            const detailedData = Array.isArray(detailedRes.data) ? detailedRes.data : [];
            const sortedDetailedStats = detailedData.sort((a, b) => {
                const aIsWeak = a.accuracy < WEAK_TOPIC_ACCURACY_THRESHOLD && a.totalAttempts >= WEAK_TOPIC_MIN_ATTEMPTS;
                const bIsWeak = b.accuracy < WEAK_TOPIC_ACCURACY_THRESHOLD && b.totalAttempts >= WEAK_TOPIC_MIN_ATTEMPTS;
                if (aIsWeak && !bIsWeak) return -1;
                if (!aIsWeak && bIsWeak) return 1;
                return a.accuracy - b.accuracy;
            });
            setDetailedStats(sortedDetailedStats);

            setWeakTopicsData(Array.isArray(weakTopicsRes.data) ? weakTopicsRes.data : []);
            setGlobalAvgData(typeof globalAvgRes.data === 'object' && globalAvgRes.data !== null ? globalAvgRes.data : null);
            setWeeklyProgressData(Array.isArray(weeklyProgressRes.data) ? weeklyProgressRes.data : []);

        } catch (err) {
            console.error("Dashboard verileri çekilirken hata:", err);
            setDashboardError(err.response?.data?.message || 'Dashboard verileri yüklenirken bir hata oluştu.');
            setSummaryStats(null); setDetailedStats([]); setWeakTopicsData([]); setGlobalAvgData(null); setWeeklyProgressData([]);
        } finally {
            setDashboardLoading(false);
        }
        // backendUrls artık dışarıda tanımlı olduğu için useCallback bağımlılığından çıkarıldı.
    }, [token]); // Sadece token değiştiğinde yeniden oluşturulacak

    useEffect(() => {
        fetchDashboardData();
        // fetchDashboardData bağımlılığı artık stabil olduğu için sonsuz döngü oluşmaz.
    }, [fetchDashboardData]);

    const chartData = useMemo(() => {
        const labels = weeklyProgressData.map(d => d.weekStartDate);
        const accuracyData = weeklyProgressData.map(d => d.accuracy);
        const attemptsData = weeklyProgressData.map(d => d.totalAttempts);
        return {
            labels,
            datasets: [
                {
                    label: 'Haftalık Başarı (%)', data: accuracyData, borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.5)', yAxisID: 'yAccuracy', tension: 0.1
                },
                {
                    label: 'Çözülen Soru Sayısı', data: attemptsData, borderColor: 'rgb(255, 159, 64)',
                    backgroundColor: 'rgba(255, 159, 64, 0.5)', yAxisID: 'yAttempts', tension: 0.1
                },
            ],
        };
    }, [weeklyProgressData]);

    const chartOptions = {
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false, }, stacked: false,
        plugins: { legend: { position: 'top', }, title: { display: true, text: 'Haftalık Gelişim Grafiği' } },
        scales: {
            x: { type: 'time', time: { unit: 'week', tooltipFormat: 'yyyy-MM-dd', displayFormats: { week: 'MMM d' } }, title: { display: true, text: 'Hafta Başlangıcı' } },
            yAccuracy: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Başarı (%)' }, min: 0, max: 100, grid: { drawOnChartArea: false, } },
            yAttempts: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Soru Sayısı' }, min: 0, grid: { drawOnChartArea: false, }, ticks: { stepSize: 1 } }
        },
    };

    if (dashboardLoading) {
        return (
            <Container maxW="container.lg" py={8} centerContent>
                <Spinner size="xl" color="brand.500" thickness="4px" speed="0.65s"/>
                <Text mt={4} color="textSecondary">Kullanıcı Paneli Yükleniyor...</Text>
            </Container>
        );
    }

    if (dashboardError) {
        return (
            <Container maxW="container.lg" mt={6}>
                <Alert status="error" variant="left-accent" borderRadius="md" p={6}>
                    <AlertIcon />
                    <Box><AlertTitle>Hata!</AlertTitle><AlertDescription>{dashboardError}</AlertDescription></Box>
                    <Button colorScheme="red" variant="outline" onClick={fetchDashboardData} ml="auto" leftIcon={<Icon as={FaRedo} />}>Tekrar Dene</Button>
                </Alert>
            </Container>
        );
    }

    if (!dashboardLoading && !summaryStats && detailedStats.length === 0 && weakTopicsData.length === 0) {
         return (
             <Container maxW="container.lg" mt={6}>
                 <Alert status="info" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={10} borderRadius="lg">
                     <AlertIcon boxSize="40px" mr={0} as={FaInfoCircle} />
                     <AlertTitle mt={4} mb={1} fontSize="lg">Veri Bulunamadı</AlertTitle>
                     <AlertDescription maxWidth="sm" mb={5}>
                        Henüz görüntülenecek istatistik verisi bulunmuyor. Biraz soru çözmeye ne dersin?
                     </AlertDescription>
                     <Button as={RouterLink} to="/solve" colorScheme="brand" mt={4}>Soru Çözmeye Başla</Button>
                 </Alert>
             </Container>
         );
     }

    return (
        <Container maxW="container.xl" py={8} className="dashboard-page">
            <Heading as="h1" size="xl" textAlign="center" mb={8}>
                Kullanıcı Paneli ({user?.username})
            </Heading>

            <Tabs isLazy variant="line" colorScheme="brand">
                <TabList>
                    <Tab><Icon as={FaChartBar} mr={2}/> Genel Bakış</Tab>
                    <Tab><Icon as={FaListAlt} mr={2}/> Konu Detayları</Tab>
                    <Tab><Icon as={FaChartLine} mr={2}/> Haftalık Gelişim</Tab>
                </TabList>

                <TabPanels>
                    <TabPanel>
                        <VStack spacing={6} align="stretch">
                            {summaryStats && (
                                <Card variant="outline">
                                    <CardHeader>
                                        <Heading size="md" display="flex" alignItems="center" gap={2}>
                                             <Icon as={FaChartBar} /> Özet İstatistikler
                                        </Heading>
                                    </CardHeader>
                                    <CardBody>
                                        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4}>
                                            <Box bg="bgTertiary" p={4} borderRadius="md" textAlign="center">
                                                <Stat><StatLabel>Toplam Çözülen Soru</StatLabel><StatNumber color="textPrimary">{summaryStats.totalAttempts}</StatNumber></Stat>
                                            </Box>
                                            <Box bg="bgTertiary" p={4} borderRadius="md" textAlign="center">
                                                <Stat><StatLabel>Doğru Cevap Sayısı</StatLabel><StatNumber color="green.500">{summaryStats.correctAttempts}</StatNumber></Stat>
                                            </Box>
                                            <Box bg="bgTertiary" p={4} borderRadius="md" textAlign="center">
                                                 <Stat><StatLabel>Başarı Oranınız</StatLabel>
                                                     <StatNumber color={summaryStats.accuracy >= 80 ? 'green.500' : summaryStats.accuracy >= 50 ? 'yellow.500' : 'red.500'}>
                                                         %{summaryStats.accuracy}
                                                     </StatNumber>
                                                </Stat>
                                            </Box>
                                            {globalAvgData && (
                                                <Box bg="bgTertiary" p={4} borderRadius="md" textAlign="center">
                                                     <Stat><StatLabel>Genel Ortalama Başarı</StatLabel>
                                                        <StatNumber color="blue.500">
                                                            %{globalAvgData.overallAccuracy}
                                                        </StatNumber>
                                                    </Stat>
                                                </Box>
                                            )}
                                        </SimpleGrid>
                                    </CardBody>
                                </Card>
                            )}
                             {weakTopicsData.length > 0 && (
                                <Alert status="warning" variant="left-accent" borderRadius="md" flexDirection="column" alignItems="flex-start">
                                    <AlertTitle display="flex" alignItems="center" gap={2} mb={3}><AlertIcon /> Tekrar Etmeniz Önerilen Konular</AlertTitle>
                                    <AlertDescription width="full">
                                        <List spacing={1} styleType="none">
                                            {weakTopicsData.map(wt => (
                                                <ListItem key={wt.topicId} display="flex" justifyContent="space-between" fontSize="sm">
                                                    <Text>{wt.topicName}</Text>
                                                    <Text color="textMuted">%{wt.accuracy} ({wt.totalAttempts}d)</Text>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </AlertDescription>
                                </Alert>
                            )}
                         </VStack>
                    </TabPanel>

                    <TabPanel>
                         <Box className='detailed-stats-section'>
                            <Heading as="h3" size="lg" mb={4} display="flex" alignItems="center" gap={3}>
                                <Icon as={FaListAlt} /> Konu Bazlı Başarı Detayları
                            </Heading>
                            {detailedStats.length === 0 && !dashboardLoading ? (
                                <Alert status="info" variant="subtle" borderRadius="md">
                                    <AlertIcon /> Henüz konu bazlı istatistik oluşturacak kadar soru çözülmedi.
                                </Alert>
                            ) : (
                                <TableContainer borderWidth="1px" borderColor="borderSecondary" borderRadius="md">
                                    <Table variant="striped" size="md">
                                        <Thead bg="bgSecondary">
                                            <Tr><Th>Konu</Th><Th textAlign="center">Deneme</Th><Th textAlign="center">Doğru</Th><Th textAlign="center">Başarı (%)</Th></Tr>
                                        </Thead>
                                        <Tbody>
                                            {detailedStats.map(topicStat => {
                                                const isWeak = weakTopicsData.some(wt => wt.topicId === topicStat.topicId);
                                                const accuracyColor = isWeak ? 'red.600' : topicStat.accuracy >= 80 ? 'green.600' : topicStat.accuracy >= 50 ? 'orange.600' : 'inherit';
                                                const rowSx = isWeak ? { bg: weakBgColor, color: weakTextColor, 'td, th': { color: weakTextColor } } : {};
                                                return (
                                                    <Tr key={topicStat.topicId} sx={rowSx} _hover={!isWeak ? { bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.100' } } : {}}>
                                                        <Td fontWeight={isWeak ? 'semibold' : 'normal'}>{topicStat.topicName}</Td>
                                                        <Td textAlign="center">{topicStat.totalAttempts}</Td>
                                                        <Td textAlign="center">{topicStat.correctAttempts}</Td>
                                                        <Td textAlign="center" fontWeight="semibold" color={accuracyColor}>
                                                             {topicStat.accuracy}%
                                                             {isWeak && <Icon as={FaExclamationCircle} ml={2} title="Zayıf Konu" verticalAlign="middle"/>}
                                                         </Td>
                                                    </Tr>
                                                );
                                            })}
                                        </Tbody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    </TabPanel>

                    <TabPanel>
                         <Heading as="h3" size="lg" mb={4} display="flex" alignItems="center" gap={3}>
                             <Icon as={FaChartLine} /> Haftalık Gelişim Grafiği
                         </Heading>
                         {weeklyProgressData.length > 0 ? (
                             <Box h="400px" p={{base: 2, md: 4}} borderWidth="1px" borderRadius="lg" borderColor="borderSecondary">
                                 <Line options={chartOptions} data={chartData} />
                             </Box>
                         ) : (
                             <Alert status="info" variant="subtle" borderRadius="md">
                                <AlertIcon /> Grafik çizmek için yeterli haftalık veri bulunmuyor.
                             </Alert>
                         )}
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Container>
    );
}

export default DashboardPage;