import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link as RouterLink } from 'react-router-dom';
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
  Skeleton,
  SkeletonText,
  useColorModeValue, // Top-level'da çağrılacak
  VStack,
  Center // Spinner için eklendi
} from '@chakra-ui/react';
// İkonlar
import { FaChartBar, FaExclamationTriangle, FaInfoCircle, FaListAlt, FaRedo, FaExclamationCircle } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Zayıf konu belirleme eşikleri
const WEAK_TOPIC_ACCURACY_THRESHOLD = 65;
const WEAK_TOPIC_MIN_ATTEMPTS = 5;

function MyStatsPage() {
    const [summaryStats, setSummaryStats] = useState(null);
    const [detailedStats, setDetailedStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token, user } = useAuth();

    const backendSummaryUrl  = `${API_BASE_URL}/api/stats/my-summary`;
    const backendDetailedUrl = `${API_BASE_URL}/api/stats/my-detailed`;

    // --- Tema Değerlerini Top-Level'da Al ---
    // Hooks'ları koşulsuz olarak en üst seviyede çağırın
    const weakBgColor = useColorModeValue('yellow.100', 'yellow.900'); // Zayıf konu satır arkaplanı
    const weakTextColor = useColorModeValue('yellow.800', 'yellow.100'); // Zayıf konu satır metin rengi

    // fetchMyStats (API yanıtı kontrolü güçlendirildi)
    const fetchMyStats = useCallback(async () => {
        setLoading(true); setError('');
        if (!token) { setError("Giriş yapmadığınız için istatistikler getirilemedi."); setLoading(false); return; }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [summaryRes, detailedRes] = await Promise.all([
                axios.get(backendSummaryUrl, config),
                axios.get(backendDetailedUrl, config)
            ]);
            // Gelen verinin object olduğundan emin ol
            setSummaryStats(typeof summaryRes.data === 'object' && summaryRes.data !== null ? summaryRes.data : null);
             // Gelen verinin array olduğundan emin ol
            const detailedData = Array.isArray(detailedRes.data) ? detailedRes.data : [];
            const sortedDetailedStats = detailedData.sort((a, b) => {
                   const aIsWeak = a.accuracy < WEAK_TOPIC_ACCURACY_THRESHOLD && a.totalAttempts >= WEAK_TOPIC_MIN_ATTEMPTS;
                   const bIsWeak = b.accuracy < WEAK_TOPIC_ACCURACY_THRESHOLD && b.totalAttempts >= WEAK_TOPIC_MIN_ATTEMPTS;
                   if (aIsWeak && !bIsWeak) return -1;
                   if (!aIsWeak && bIsWeak) return 1;
                   return a.accuracy - b.accuracy;
                 });
            setDetailedStats(sortedDetailedStats);
        } catch (err) {
            console.error("İstatistikleri çekerken hata:", err);
            setError(err.response?.data?.message || 'İstatistikler yüklenirken bir hata oluştu.');
            setSummaryStats(null); setDetailedStats([]);
        } finally { setLoading(false); }
    }, [token, backendSummaryUrl, backendDetailedUrl]);

    useEffect(() => { fetchMyStats(); }, [fetchMyStats]);

    const weakTopics = useMemo(() => {
        return detailedStats.filter(stat =>
            stat.accuracy < WEAK_TOPIC_ACCURACY_THRESHOLD &&
            stat.totalAttempts >= WEAK_TOPIC_MIN_ATTEMPTS
        );
    }, [detailedStats]);

    // --- Render Bölümü (Tema ile Uyumlu) ---
    if (loading) {
        // Skeleton tema stillerini kullanır
        return (
            <Container maxW="container.lg" py={8}>
                 <Skeleton height="30px" width="40%" mx="auto" mb={8} />
                <Card variant="outline" mb={8} p={6}>
                    <SkeletonText width="50%" mx="auto" noOfLines={1} mb={6} height="24px"/>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                        <Skeleton height="80px" borderRadius="md" />
                        <Skeleton height="80px" borderRadius="md" />
                        <Skeleton height="80px" borderRadius="md" />
                    </SimpleGrid>
                </Card>
                <SkeletonText width="60%" noOfLines={1} mb={4} height="24px"/>
                <Skeleton height="200px" borderRadius="md" />
            </Container>
        );
    }

    if (error) {
        // Alert ve Button tema stillerini kullanır
        return (
            <Container maxW="container.lg" mt={6}>
                <Alert status="error" variant="left-accent" borderRadius="md" p={6}>
                    <AlertIcon />
                    <Box>
                        <AlertTitle>Hata!</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Box>
                     <Button colorScheme="red" variant="outline" onClick={fetchMyStats} ml="auto" leftIcon={<Icon as={FaRedo} />}>
                         Tekrar Dene
                     </Button>
                </Alert>
            </Container>
        );
    }

    // Veri Yok Mesajı (Tema stillerini kullanır)
     if (!loading && !summaryStats && detailedStats.length === 0) {
         return (
             <Container maxW="container.lg" mt={6}>
                 <Alert status="info" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={10} borderRadius="lg">
                     <AlertIcon boxSize="40px" mr={0} as={FaInfoCircle} />
                     <AlertTitle mt={4} mb={1} fontSize="lg">Veri Bulunamadı</AlertTitle>
                     <AlertDescription maxWidth="sm" mb={5}>
                        Henüz görüntülenecek istatistik verisi bulunmuyor. Biraz soru çözmeye ne dersin?
                     </AlertDescription>
                     <Button as={RouterLink} to="/solve" colorScheme="brand" mt={4}>
                        Soru Çözmeye Başla
                     </Button>
                 </Alert>
             </Container>
         );
     }

    // Ana İçerik Render (Tema ile Uyumlu)
    return (
        <Container maxW="container.lg" py={8} className="my-stats-page">
            {/* Heading tema stilini kullanır */}
            <Heading as="h1" size="xl" textAlign="center" mb={8}>
                İstatistiklerim ({user?.username})
            </Heading>

            {/* Özet İstatistikler */}
            {summaryStats && (
                // Card, CardBody, Heading, SimpleGrid, Box, Text tema stillerini ve semantic token'ları kullanır
                <Card variant="outline" mb={8}>
                    <CardBody p={6}>
                        <Heading as="h3" size="lg" display="flex" alignItems="center" justifyContent="center" gap={3} mb={6}>
                            <Icon as={FaChartBar} /> Özet İstatistikler
                        </Heading>
                        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
                            <Box bg="bgTertiary" p={4} borderRadius="md" textAlign="center">
                                <Text fontSize="sm" color="textMuted" mb={1} fontWeight="medium">Toplam Çözülen Soru</Text>
                                <Text fontSize="3xl" fontWeight="bold" color="textPrimary">{summaryStats.totalAttempts}</Text>
                            </Box>
                            <Box bg="bgTertiary" p={4} borderRadius="md" textAlign="center">
                                <Text fontSize="sm" color="textMuted" mb={1} fontWeight="medium">Doğru Cevap Sayısı</Text>
                                <Text fontSize="3xl" fontWeight="bold" color="green.500">{summaryStats.correctAttempts}</Text>
                            </Box>
                            <Box bg="bgTertiary" p={4} borderRadius="md" textAlign="center">
                                <Text fontSize="sm" color="textMuted" mb={1} fontWeight="medium">Genel Başarı Oranı</Text>
                                <Text
                                    fontSize="3xl"
                                    fontWeight="bold"
                                    color={summaryStats.accuracy >= 80 ? 'green.500' : summaryStats.accuracy >= 50 ? 'yellow.500' : 'red.500'}
                                >
                                    %{summaryStats.accuracy}
                                </Text>
                            </Box>
                        </SimpleGrid>
                    </CardBody>
                </Card>
            )}

            {/* Detaylı İstatistikler */}
            <Box className='detailed-stats-section' mb={8}>
                {/* Heading ve Alert tema stillerini kullanır */}
                <Heading as="h3" size="lg" mb={4} display="flex" alignItems="center" gap={3}>
                    <Icon as={FaListAlt} /> Konu Bazlı Başarı
                </Heading>
                {detailedStats.length === 0 && !loading ? (
                    <Alert status="info" variant="subtle" borderRadius="md">
                        <AlertIcon />
                        <AlertDescription>Henüz konu bazlı istatistik oluşturacak kadar soru çözülmedi.</AlertDescription>
                    </Alert>
                ) : (
                    // TableContainer ve Table tema stillerini ('striped', 'md') kullanır
                    <TableContainer borderWidth="1px" borderColor="borderSecondary" borderRadius="md">
                        <Table variant="striped" size="md">
                            {/* Thead tema stilini (bgSecondary) kullanır */}
                            <Thead bg="bgSecondary">
                                <Tr>
                                    <Th>Konu</Th>
                                    <Th textAlign="center">Toplam Deneme</Th>
                                    <Th textAlign="center">Doğru Sayısı</Th>
                                    <Th textAlign="center">Başarı Oranı (%)</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {detailedStats.map(topicStat => {
                                    const isWeak = weakTopics.some(wt => wt.topicId === topicStat.topicId);
                                    // Başarı rengi dinamik olarak belirlenir
                                    const accuracyColor = isWeak ? 'red.600' : topicStat.accuracy >= 80 ? 'green.600' : topicStat.accuracy >= 50 ? 'orange.600' : 'inherit';
                                    // zayıfBgColor ve zayıfTextColor hook dışından alınır
                                    const rowSx = isWeak ? { bg: weakBgColor, color: weakTextColor, 'td, th': { color: weakTextColor } } : {};

                                    return (
                                         // Tr ve Td tema stillerini kullanır, sx ile dinamik stil eklenir
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

            {/* Zayıf Konular Listesi */}
            {weakTopics.length > 0 && (
                 // Alert, List, ListItem, Text tema stillerini ve semantic token'ları kullanır
                <Alert status="warning" variant="left-accent" borderRadius="md" mt={6} flexDirection="column" alignItems="flex-start">
                     <AlertTitle display="flex" alignItems="center" gap={2} mb={3}>
                         <AlertIcon /> Tekrar Etmeniz Önerilen Konular
                    </AlertTitle>
                    <AlertDescription width="full">
                         <Text fontSize="sm" color="textMuted" mb={3}>
                              (Başarı %{WEAK_TOPIC_ACCURACY_THRESHOLD} altında ve en az {WEAK_TOPIC_MIN_ATTEMPTS} deneme)
                         </Text>
                        <List spacing={2} styleType="disc" pl={5}>
                            {weakTopics.map(wt => (
                                <ListItem key={wt.topicId}>
                                    {wt.topicName}
                                    <Text as="span" fontSize="xs" color="textMuted" ml={2}>%{wt.accuracy}</Text>
                                    {/* Opsiyonel Link (tema link stilini kullanır) */}
                                     {/*
                                     <ChakraLink as={RouterLink} to={`/solve?topicId=${wt.topicId}`} color="brand.500" fontSize="xs" ml={3}>
                                         Pratik Yap
                                     </ChakraLink>
                                     */}
                                </ListItem>
                            ))}
                        </List>
                    </AlertDescription>
                </Alert>
            )}
        </Container>
    );
}

export default MyStatsPage;