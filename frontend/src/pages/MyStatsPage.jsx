import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link as RouterLink } from 'react-router-dom'; // Link için
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
  SimpleGrid, // Özet grid için
  Card,       // Özet kutuları için
  CardBody,   // Kart içeriği için
  Table,      // Detay tablosu için
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer, // Tablo sarmalayıcı
  Link as ChakraLink, // Linkler için
  List,             // Zayıf konular listesi
  ListItem,
  Skeleton,         // Yükleme iskeleti
  SkeletonText,
  useColorModeValue, // Açık/Koyu mod renkleri için
  VStack // Dikey yığınlama için
} from '@chakra-ui/react';
// İkonlar
import { FaChartBar, FaExclamationTriangle, FaInfoCircle, FaListAlt, FaRedo, FaExclamationCircle } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Zayıf konu belirleme eşikleri (aynı kalabilir)
const WEAK_TOPIC_ACCURACY_THRESHOLD = 65;
const WEAK_TOPIC_MIN_ATTEMPTS = 5;

function MyStatsPage() {
    // State'ler ve hook'lar aynı kalabilir
    const [summaryStats, setSummaryStats] = useState(null);
    const [detailedStats, setDetailedStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token, user } = useAuth();

    const backendSummaryUrl  = `${API_BASE_URL}/api/stats/my-summary`;
    const backendDetailedUrl = `${API_BASE_URL}/api/stats/my-detailed`;

    // fetchMyStats ve weakTopics hesaplamaları aynı kalabilir
    const fetchMyStats = useCallback(async () => {
        setLoading(true); setError('');
        if (!token) { setError("Giriş yapmadığınız için istatistikler getirilemedi."); setLoading(false); return; }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [summaryRes, detailedRes] = await Promise.all([
                axios.get(backendSummaryUrl, config),
                axios.get(backendDetailedUrl, config)
            ]);
            setSummaryStats(summaryRes.data);
            const sortedDetailedStats = Array.isArray(detailedRes.data)
               // Önce Zayıf Konuları Gösterelim, Sonra Başarıya Göre Sıralayalım
               ? detailedRes.data.sort((a, b) => {
                   const aIsWeak = a.accuracy < WEAK_TOPIC_ACCURACY_THRESHOLD && a.totalAttempts >= WEAK_TOPIC_MIN_ATTEMPTS;
                   const bIsWeak = b.accuracy < WEAK_TOPIC_ACCURACY_THRESHOLD && b.totalAttempts >= WEAK_TOPIC_MIN_ATTEMPTS;
                   if (aIsWeak && !bIsWeak) return -1; // a zayıf, b değil -> a önce
                   if (!aIsWeak && bIsWeak) return 1;  // b zayıf, a değil -> b önce
                   return a.accuracy - b.accuracy; // İkisi de zayıf veya değilse başarıya göre sırala
                 })
               : [];
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

    // --- Render Bölümü (Chakra UI ile) ---
    if (loading) {
        // Chakra UI İskelet Yükleme Ekranı
        return (
            <Container maxW="container.lg" py={8}>
                 <Skeleton height="30px" width="40%" mx="auto" mb={8} /> {/* Başlık iskeleti */}
                 {/* Özet İstatistikler İskeleti */}
                <Card variant="outline" mb={8} p={6}>
                    <SkeletonText width="50%" mx="auto" noOfLines={1} mb={6} height="24px"/>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                        <Skeleton height="80px" borderRadius="md" />
                        <Skeleton height="80px" borderRadius="md" />
                        <Skeleton height="80px" borderRadius="md" />
                    </SimpleGrid>
                </Card>
                {/* Detaylı Tablo İskeleti */}
                <SkeletonText width="60%" noOfLines={1} mb={4} height="24px"/>
                <Skeleton height="200px" borderRadius="md" />
            </Container>
        );
    }

    if (error) {
        // Chakra UI Hata Ekranı
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

    // Chakra UI Veri Yok Mesajı
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

    // Ana İçerik Render
    return (
        <Container maxW="container.lg" py={8} className="my-stats-page">
            <Heading as="h1" size="xl" textAlign="center" mb={8}>
                İstatistiklerim ({user?.username})
            </Heading>

            {/* Özet İstatistikler */}
            {summaryStats && (
                <Card variant="outline" mb={8}>
                    <CardBody p={6}>
                        <Heading as="h3" size="lg" display="flex" alignItems="center" justifyContent="center" gap={3} mb={6}>
                            <Icon as={FaChartBar} /> Özet İstatistikler
                        </Heading>
                        {/* Eski stats-summary-grid yerine SimpleGrid */}
                        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
                            {/* Eski summary-box yerine Box */}
                            <Box bg="bgTertiary" p={4} borderRadius="md" textAlign="center">
                                <Text fontSize="sm" color="textMuted" mb={1} fontWeight="medium">Toplam Çözülen Soru</Text>
                                <Text fontSize="3xl" fontWeight="bold">{summaryStats.totalAttempts}</Text>
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
                <Heading as="h3" size="lg" mb={4} display="flex" alignItems="center" gap={3}>
                    <Icon as={FaListAlt} /> Konu Bazlı Başarı
                </Heading>
                {detailedStats.length === 0 && !loading ? (
                    <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        <AlertDescription>Henüz konu bazlı istatistik oluşturacak kadar soru çözülmedi.</AlertDescription>
                    </Alert>
                ) : (
                    // Eski table-container yerine Chakra TableContainer
                    <TableContainer borderWidth="1px" borderColor="borderSecondary" borderRadius="md">
                        {/* Eski table yerine Chakra Table */}
                        <Table variant="striped" size="md">
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
                                    const accuracyColor = isWeak ? 'red.600' : topicStat.accuracy >= 80 ? 'green.600' : topicStat.accuracy >= 50 ? 'orange.600' : 'inherit';
                                    const weakBgColor = useColorModeValue('yellow.100', 'yellow.900'); // Açık/Koyu mod için
                                    const weakTextColor = useColorModeValue('yellow.800', 'yellow.100'); // Açık/Koyu mod için

                                    return (
                                        <Tr key={topicStat.topicId} sx={isWeak ? { bg: weakBgColor, color: weakTextColor, 'td, th': { color: weakTextColor } } : {}}>
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
                            </tbody>
                        </Table>
                    </TableContainer>
                )}
            </Box>

            {/* Zayıf Konular Listesi */}
            {weakTopics.length > 0 && (
                 // Eski alert yerine Chakra Alert
                <Alert status="warning" variant="left-accent" borderRadius="md" mt={6} flexDirection="column" alignItems="flex-start">
                     <AlertTitle display="flex" alignItems="center" gap={2} mb={3}>
                         <AlertIcon /> Tekrar Etmeniz Önerilen Konular
                    </AlertTitle>
                    <AlertDescription width="full">
                         <Text fontSize="sm" color="textMuted" mb={3}>
                              (Başarı %{WEAK_TOPIC_ACCURACY_THRESHOLD} altında ve en az {WEAK_TOPIC_MIN_ATTEMPTS} deneme)
                         </Text>
                         {/* Eski ul yerine Chakra List */}
                        <List spacing={2} styleType="disc" pl={5}>
                            {weakTopics.map(wt => (
                                <ListItem key={wt.topicId}>
                                    {wt.topicName}
                                    <Text as="span" fontSize="xs" color="textMuted" ml={2}>%{wt.accuracy}</Text>
                                    {/* Opsiyonel Link */}
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