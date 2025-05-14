import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link as RouterLink, useNavigate } from 'react-router-dom'; // useNavigate eklendi
import {
  Box,
  Container,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Icon,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Link as ChakraLink,
  List,
  ListItem,
  useColorModeValue,
  VStack,
  Center,
  Tabs, // Tabs eklendi
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat, // Stat eklendi
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Progress, // Progress eklendi
  Divider, // Divider eklendi
  Badge // Badge eklendi
} from '@chakra-ui/react';
import { 
  FaChartBar, FaExclamationTriangle, FaInfoCircle, FaListAlt, FaRedo, 
  FaExclamationCircle, FaLightbulb, FaBookOpen, FaPencilAlt, FaChartLine, FaBullseye, FaStar // Yeni ikonlar eklendi
} from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler // Filler eklendi (alan grafiği için)
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // Tarih adaptörü
import { tr } from 'date-fns/locale'; // Grafik için Türkçe tarih formatı

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, Filler
);

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Backend'den gelen zayıf konu belirleme eşikleri (bilgi amaçlı, backend'de kullanılıyor)
// const WEAK_TOPIC_ACCURACY_THRESHOLD = 65;
// const WEAK_TOPIC_MIN_ATTEMPTS = 5;

function MyStatsPage() {
    const [summaryStats, setSummaryStats] = useState(null);
    const [detailedStats, setDetailedStats] = useState([]); // Tüm konuların detaylı istatistikleri
    const [weakTopics, setWeakTopics] = useState([]); // Backend'den gelen zayıf konular
    const [strongTopics, setStrongTopics] = useState([]); // Client-side hesaplanacak güçlü konular
    const [weeklyProgress, setWeeklyProgress] = useState([]);
    const [globalAverage, setGlobalAverage] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token, user } = useAuth();
    const navigate = useNavigate();

    // API URL'leri
    const backendUrls = {
        summary: `${API_BASE_URL}/api/stats/my-summary`,
        detailed: `${API_BASE_URL}/api/stats/my-detailed`,
        weakTopics: `${API_BASE_URL}/api/stats/my-topic-errors`, // Bu endpoint'i kullanacağız
        weeklyProgress: `${API_BASE_URL}/api/stats/my-weekly-progress`,
        globalAverage: `${API_BASE_URL}/api/stats/global-averages`
    };

    // Tema Renkleri ve Stilleri
    const cardBg = useColorModeValue("white", "gray.750");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const headingColor = useColorModeValue("gray.700", "gray.100");
    const textColor = useColorModeValue("gray.600", "gray.300");
    const textMutedColor = useColorModeValue("gray.500", "gray.400");
    const weakTopicBg = useColorModeValue('red.50', 'red.900');
    const weakTopicColor = useColorModeValue('red.700', 'red.100');
    const strongTopicBg = useColorModeValue('green.50', 'green.900');
    const strongTopicColor = useColorModeValue('green.700', 'green.100');
    const chartBorderColor = useColorModeValue('rgba(0, 123, 255, 0.5)', 'rgba(54, 162, 235, 0.8)');
    const chartBgColor = useColorModeValue('rgba(0, 123, 255, 0.1)', 'rgba(54, 162, 235, 0.2)');

    // Veri Çekme Fonksiyonu
    const fetchAllStats = useCallback(async () => {
        setLoading(true); setError('');
        if (!token) { 
            setError("İstatistikleri görmek için lütfen giriş yapın."); 
            setLoading(false); 
            return; 
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [summaryRes, detailedRes, weakTopicsRes, weeklyProgressRes, globalAvgRes] = await Promise.all([
                axios.get(backendUrls.summary, config).catch(e => ({error: e})),
                axios.get(backendUrls.detailed, config).catch(e => ({error: e})),
                axios.get(backendUrls.weakTopics, config).catch(e => ({error: e})),
                axios.get(backendUrls.weeklyProgress, config).catch(e => ({error: e})),
                axios.get(backendUrls.globalAverage, config).catch(e => ({error: e}))
            ]);

            // Hata kontrolü ve state güncellemeleri
            if (summaryRes.error || detailedRes.error || weakTopicsRes.error || weeklyProgressRes.error || globalAvgRes.error) {
                console.error("Bir veya daha fazla istatistik çekilirken hata oluştu:", {summaryRes, detailedRes, weakTopicsRes, weeklyProgressRes, globalAvgRes});
                setError('İstatistiklerin bir kısmı veya tamamı yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
            }

            setSummaryStats(summaryRes.data && typeof summaryRes.data === 'object' ? summaryRes.data : null);
            
            const detailedData = Array.isArray(detailedRes.data) ? detailedRes.data : [];
            setDetailedStats(detailedData.sort((a, b) => a.accuracy - b.accuracy)); // Başarıya göre sırala (en düşükten yükseğe)
            
            setWeakTopics(Array.isArray(weakTopicsRes.data) ? weakTopicsRes.data : []);
            setWeeklyProgress(Array.isArray(weeklyProgressRes.data) ? weeklyProgressRes.data : []);
            setGlobalAverage(globalAvgRes.data && typeof globalAvgRes.data === 'object' ? globalAvgRes.data : null);

            // Güçlü konuları client-side'da belirleyelim (örnek: %85 üzeri ve en az 10 deneme)
            const strong = detailedData.filter(
                stat => stat.accuracy >= 85 && stat.totalAttempts >= 10
            ).sort((a,b) => b.accuracy - a.accuracy); // En yüksekten düşüğe sırala
            setStrongTopics(strong);

        } catch (err) { // Bu catch genellikle Promise.all dışındaki hatalar için.
            console.error("Toplu istatistik çekme sırasında genel hata:", err);
            setError('İstatistikler yüklenirken beklenmedik bir hata oluştu.');
            setSummaryStats(null); setDetailedStats([]); setWeakTopics([]); setWeeklyProgress([]); setGlobalAverage(null); setStrongTopics([]);
        } finally {
            setLoading(false);
        }
    }, [token, backendUrls]); // backendUrls objesi sabit olduğu için bağımlılığa eklenebilir veya çıkarılabilir.

    useEffect(() => {
        fetchAllStats();
    }, [fetchAllStats]);

    // Haftalık Gelişim Grafiği için Veri ve Seçenekler
    const weeklyChartData = useMemo(() => {
        const labels = weeklyProgress.map(d => new Date(d.weekStartDate)); // Tarih objesi olarak
        const accuracyData = weeklyProgress.map(d => d.accuracy);
        const attemptsData = weeklyProgress.map(d => d.totalAttempts);
        return {
            labels,
            datasets: [
                {
                    label: 'Haftalık Başarı (%)',
                    data: accuracyData,
                    borderColor: chartBorderColor,
                    backgroundColor: chartBgColor,
                    tension: 0.3,
                    yAxisID: 'yAccuracy',
                    fill: true,
                },
                {
                    label: 'Çözülen Soru Sayısı',
                    data: attemptsData,
                    borderColor: useColorModeValue('rgba(255, 159, 64, 0.5)', 'rgba(255, 159, 64, 0.8)'),
                    backgroundColor: useColorModeValue('rgba(255, 159, 64, 0.1)', 'rgba(255, 159, 64, 0.2)'),
                    tension: 0.3,
                    yAxisID: 'yAttempts',
                    fill: true,
                },
            ],
        };
    }, [weeklyProgress, chartBorderColor, chartBgColor, useColorModeValue]); // useColorModeValue bağımlılığı eklendi

    const weeklyChartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { position: 'top', labels: { color: textColor } },
            title: { display: true, text: 'Haftalık Gelişim Grafiği', color: headingColor, font: {size: 16} },
            tooltip: {
                backgroundColor: cardBg, // Chakra UI renkleri
                titleColor: headingColor,
                bodyColor: textColor,
                borderColor: borderColor,
                borderWidth: 1,
            }
        },
        scales: {
            x: { 
                type: 'time', 
                time: { 
                    unit: 'week', 
                    tooltipFormat: 'PPP', // date-fns formatı (örn: 12 Ara 2023)
                    displayFormats: { week: 'dd MMM' } // Eksen formatı
                }, 
                title: { display: true, text: 'Hafta', color: textColor },
                ticks: { color: textColor, major: { enabled: true } },
                grid: { color: borderColor }
            },
            yAccuracy: { 
                type: 'linear', display: true, position: 'left',
                title: { display: true, text: 'Başarı (%)', color: textColor },
                min: 0, max: 100,
                ticks: { color: textColor, stepSize: 20 },
                grid: { color: borderColor, drawOnChartArea: false } // Sadece eksen çizgisi
            },
            yAttempts: { 
                type: 'linear', display: true, position: 'right',
                title: { display: true, text: 'Soru Sayısı', color: textColor },
                min: 0,
                ticks: { color: textColor, stepSize: 10 }, // Soru sayısına göre ayarla
                grid: { color: borderColor }
            }
        },
        adapters: { // date-fns adaptörü için Türkçe locale
            date: {
              locale: tr,
            },
        },
    }), [textColor, headingColor, cardBg, borderColor]); // Dinamik renkler için bağımlılıklar

  // Yükleme veya hata durumları zaten ilk `cat` bloğundaki `if (loading)` ve `if (error)` ile ele alınıyor.
  // O blok geçici bir return içeriyordu, şimdi gerçek render kısmı başlıyor.
  // Ana component return'ü:
  if (loading) { // Bu `loading` state'i fetchAllStats'ın genel yükleme durumunu gösterir.
    return (
      <Container maxW="container.xl" py={8} centerContent minH="80vh" display="flex" flexDirection="column" justifyContent="center">
        <Spinner size="xl" color="brand.500" thickness="4px" speed="0.65s"/>
        <Text mt={4} color={textMutedColor}>Strateji Merkeziniz yükleniyor...</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.lg" mt={6}>
        <Alert status="error" variant="left-accent" borderRadius="md" p={6} bg={useColorModeValue("red.50", "red.800")} borderColor={useColorModeValue("red.200", "red.600")}>
          <AlertIcon color="red.500" />
          <Box flex="1">
            <AlertTitle color={useColorModeValue("red.700", "red.100")}>Bir Hata Oluştu!</AlertTitle>
            <AlertDescription color={useColorModeValue("red.600", "red.200")}>{error}</AlertDescription>
          </Box>
          <Button colorScheme="red" variant="outline" onClick={fetchAllStats} ml="auto" leftIcon={<Icon as={FaRedo} />}>
            Tekrar Dene
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!summaryStats && detailedStats.length === 0 && weakTopics.length === 0 && weeklyProgress.length === 0) {
    return (
      <Container maxW="container.lg" mt={6}>
        <Alert status="info" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={10} borderRadius="lg" bg={useColorModeValue("blue.50", "blue.800")}>
          <AlertIcon boxSize="40px" mr={0} as={FaInfoCircle} color="blue.500" />
          <AlertTitle mt={4} mb={1} fontSize="lg" color={useColorModeValue("blue.700", "blue.100")}>Veri Bulunamadı</AlertTitle>
          <AlertDescription maxWidth="sm" mb={5} color={useColorModeValue("blue.600", "blue.200")}>
            Henüz sizin için bir strateji oluşturacak kadar veri bulunmuyor. Biraz soru çözerek başlayabilirsiniz!
          </AlertDescription>
          <Button as={RouterLink} to="/solve" colorScheme="brand" mt={4} leftIcon={<Icon as={FaPencilAlt} />}>
            Soru Çözmeye Başla
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8} className="strategy-center-page">
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl" textAlign="center" color={headingColor} mb={4}>
          Strateji Merkeziniz, {user?.username}!
        </Heading>
        <Text textAlign="center" color={textColor} mt={-6} mb={6}>
          Performansınızı analiz edin, zayıf ve güçlü yönlerinizi keşfedin, hedeflerinize ulaşın.
        </Text>

        <Tabs variant="soft-rounded" colorScheme="brand" isLazy>
          <TabList flexWrap="wrap" justifyContent="center" mb={6}>
            <Tab borderRadius="md" fontWeight="semibold" _selected={{ color: 'white', bg: 'brand.500' }}><Icon as={FaChartBar} mr={2}/>Genel Bakış</Tab>
            <Tab borderRadius="md" fontWeight="semibold" _selected={{ color: 'white', bg: 'brand.500' }}><Icon as={FaBullseye} mr={2}/>Güçlü & Zayıf Yönler</Tab>
            <Tab borderRadius="md" fontWeight="semibold" _selected={{ color: 'white', bg: 'brand.500' }}><Icon as={FaListAlt} mr={2}/>Tüm Konu Detayları</Tab>
          </TabList>

          <TabPanels>
            {/* TAB 1: GENEL BAKIŞ */}
            <TabPanel p={0}>
              <VStack spacing={8} align="stretch">
                {summaryStats && (
                  <Card variant="outline" bg={cardBg} borderColor={borderColor} boxShadow="lg">
                    <CardHeader pb={2}>
                      <Heading size="md" color={headingColor}>Performans Özetiniz</Heading>
                    </CardHeader>
                    <CardBody>
                      <StatGroup flexWrap={{base: "wrap", md: "nowrap"}} gap={{base:4, md:6}}>
                        <Stat bg={useColorModeValue("gray.50", "gray.800")} p={4} borderRadius="md" textAlign="center">
                          <StatLabel color={textMutedColor}>Toplam Çözülen Soru</StatLabel>
                          <StatNumber fontSize="3xl" color={headingColor}>{summaryStats.totalAttempts}</StatNumber>
                        </Stat>
                        <Stat bg={useColorModeValue("gray.50", "gray.800")} p={4} borderRadius="md" textAlign="center">
                          <StatLabel color={textMutedColor}>Doğru Cevap Sayısı</StatLabel>
                          <StatNumber fontSize="3xl" color="green.500">{summaryStats.correctAttempts}</StatNumber>
                        </Stat>
                        <Stat bg={useColorModeValue("gray.50", "gray.800")} p={4} borderRadius="md" textAlign="center">
                          <StatLabel color={textMutedColor}>Genel Başarı Oranınız</StatLabel>
                          <StatNumber fontSize="3xl" color={summaryStats.accuracy >= 80 ? 'green.400' : summaryStats.accuracy >= 50 ? 'yellow.400' : 'red.400'}>
                            %{summaryStats.accuracy}
                          </StatNumber>
                          {globalAverage && (
                            <StatHelpText color={textMutedColor} fontSize="xs">
                              Platform Ort: %{globalAverage.overallAccuracy}
                              {summaryStats.accuracy > globalAverage.overallAccuracy ? <StatArrow type="increase" /> : (summaryStats.accuracy < globalAverage.overallAccuracy ? <StatArrow type="decrease" /> : null)}
                            </StatHelpText>
                          )}
                        </Stat>
                      </StatGroup>
                    </CardBody>
                  </Card>
                )}

                {weeklyProgress.length > 0 && (
                  <Card variant="outline" bg={cardBg} borderColor={borderColor} boxShadow="lg">
                    <CardHeader>
                      <Heading size="md" color={headingColor}>Haftalık Gelişim Grafiği</Heading>
                    </CardHeader>
                    <CardBody>
                      <Box h={{base: "300px", md: "400px"}} p={{base:0, md:2}}>
                        <Line options={weeklyChartOptions} data={weeklyChartData} />
                      </Box>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </TabPanel>

            {/* TAB 2: GÜÇLÜ VE ZAYIF YÖNLER */}
            <TabPanel p={0}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
                {/* Zayıf Konular */}
                <Box>
                  <Heading size="lg" mb={6} color={headingColor} display="flex" alignItems="center">
                    <Icon as={FaExclamationCircle} color="red.500" mr={3} /> Üzerinde Durulması Gerekenler
                  </Heading>
                  {weakTopics.length > 0 ? (
                    <VStack spacing={4} align="stretch">
                      {weakTopics.map(topic => (
                        <Card key={`weak-${topic.topicId}`} bg={weakTopicBg} variant="outline" borderColor={useColorModeValue("red.200", "red.700")} boxShadow="md">
                          <CardBody p={4}>
                            <Flex direction={{base: "column", md: "row"}} justify="space-between" align={{base:"flex-start", md:"center"}} gap={2}>
                                <Box flex="1">
                                    <Heading size="sm" color={weakTopicColor} noOfLines={2}>{topic.topicName}</Heading>
                                    <Text fontSize="xs" color={textMutedColor}>
                                        Başarı: %{topic.accuracy} ({topic.correctAttempts}/{topic.totalAttempts} doğru)
                                    </Text>
                                </Box>
                                <HStack spacing={2} mt={{base:2, md:0}}>
                                    <Button size="xs" colorScheme="red" variant="outline" leftIcon={<Icon as={FaBookOpen}/>} onClick={() => navigate(`/lectures/topic/${topic.topicId}`)}>Konuyu Çalış</Button>
                                    <Button size="xs" colorScheme="red" leftIcon={<Icon as={FaPencilAlt}/>} onClick={() => navigate(`/solve?topicId=${topic.topicId}&mode=practice`)}>Soru Çöz</Button>
                                </HStack>
                            </Flex>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  ) : (
                    <Text color={textColor}>Harika! Belirlenmiş bir zayıf konunuz bulunmuyor.</Text>
                  )}
                </Box>
                
                {/* Güçlü Konular */}
                <Box>
                  <Heading size="lg" mb={6} color={headingColor} display="flex" alignItems="center">
                    <Icon as={FaStar} color="green.500" mr={3} /> Güçlü Olduğunuz Konular
                  </Heading>
                  {strongTopics.length > 0 ? (
                    <VStack spacing={4} align="stretch">
                      {strongTopics.map(topic => (
                        <Card key={`strong-${topic.topicId}`} bg={strongTopicBg} variant="outline" borderColor={useColorModeValue("green.200", "green.700")} boxShadow="md">
                          <CardBody p={4}>
                            <Flex direction={{base: "column", md: "row"}} justify="space-between" align={{base:"flex-start", md:"center"}} gap={2}>
                                <Box flex="1">
                                    <Heading size="sm" color={strongTopicColor} noOfLines={2}>{topic.topicName}</Heading>
                                    <Text fontSize="xs" color={textMutedColor}>
                                        Başarı: %{topic.accuracy} ({topic.correctAttempts}/{topic.totalAttempts} doğru)
                                    </Text>
                                </Box>
                                 <Button size="xs" colorScheme="green" variant="ghost" leftIcon={<Icon as={FaPencilAlt}/>} onClick={() => navigate(`/solve?topicId=${topic.topicId}&mode=practice`)}>Daha Fazla Pratik</Button>
                            </Flex>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  ) : (
                    <Text color={textColor}>Henüz belirgin güçlü konularınız oluşmamış. Çözmeye devam!</Text>
                  )}
                </Box>
              </SimpleGrid>
            </TabPanel>

            {/* TAB 3: DETAYLI KONU PERFORMANSI */}
            <TabPanel p={0}>
                <Heading as="h3" size="lg" mb={6} color={headingColor} display="flex" alignItems="center">
                    <Icon as={FaListAlt} mr={3} /> Tüm Konu Performans Detayları
                </Heading>
                {detailedStats.length === 0 ? (
                    <Alert status="info" variant="subtle" borderRadius="md" bg={useColorModeValue("blue.50", "blue.800")}>
                        <AlertIcon color="blue.500" />
                        <AlertDescription color={useColorModeValue("blue.700", "blue.200")}>Henüz konu bazlı istatistik oluşturacak kadar soru çözülmedi.</AlertDescription>
                    </Alert>
                ) : (
                    <Card variant="outline" bg={cardBg} borderColor={borderColor} boxShadow="lg">
                        <TableContainer>
                            <Table variant="simple" size={{base: "sm", md: "md"}}>
                                <Thead bg={useColorModeValue("gray.100", "gray.800")}>
                                    <Tr>
                                        <Th color={textMutedColor}>Konu Adı</Th>
                                        <Th textAlign="center" color={textMutedColor}>Toplam Deneme</Th>
                                        <Th textAlign="center" color={textMutedColor}>Doğru Sayısı</Th>
                                        <Th textAlign="center" color={textMutedColor}>Başarı Oranı (%)</Th>
                                        <Th color={textMutedColor}>Durum</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {detailedStats.map(topicStat => {
                                        const isIdentifiedAsWeak = weakTopics.some(wt => wt.topicId === topicStat.topicId);
                                        const isIdentifiedAsStrong = strongTopics.some(st => st.topicId === topicStat.topicId);
                                        let rowBg = undefined;
                                        let rowColor = textColor;
                                        let statusBadge = null;

                                        if (isIdentifiedAsWeak) {
                                            rowBg = weakTopicBg;
                                            rowColor = weakTopicColor;
                                            statusBadge = <Badge colorScheme="red" variant="subtle">Geliştirilmeli</Badge>;
                                        } else if (isIdentifiedAsStrong) {
                                            rowBg = strongTopicBg;
                                            rowColor = strongTopicColor;
                                            statusBadge = <Badge colorScheme="green" variant="subtle">Güçlü</Badge>;
                                        }
                                        
                                        const accuracyColorValue = topicStat.accuracy >= 85 ? 'green.500' : topicStat.accuracy >= 65 ? 'yellow.500' : 'red.500';

                                        return (
                                            <Tr key={topicStat.topicId} bg={rowBg} _hover={{bg: useColorModeValue("gray.100", "gray.700")}}>
                                                <Td fontWeight="medium" color={rowColor} maxW="300px" whiteSpace="normal">{topicStat.topicName}</Td>
                                                <Td textAlign="center" color={rowColor}>{topicStat.totalAttempts}</Td>
                                                <Td textAlign="center" color={rowColor}>{topicStat.correctAttempts}</Td>
                                                <Td textAlign="center" fontWeight="semibold" color={accuracyColorValue}>
                                                    {topicStat.accuracy}%
                                                </Td>
                                                <Td>{statusBadge || <Text as="span" color={textMutedColor}>-</Text>}</Td>
                                            </Tr>
                                        );
                                    })}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    </Card>
                )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
}

export default MyStatsPage;
