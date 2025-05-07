import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
// Chakra UI Bileşenlerini Import Et
import {
    Box,
    VStack,
    Heading,
    Text,
    Spinner,
    Alert,
    AlertIcon,
    AlertDescription,
    FormControl,
    FormLabel,
    Select,
    SimpleGrid,
    StatGroup,
    Stat,
    StatLabel,
    StatNumber,
    TableContainer,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Center,
    Icon // Heading için
} from '@chakra-ui/react';
// İkonlar
import { FaChartBar } from 'react-icons/fa'; // Örnek ikon

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Uzmanlık alanları listesi
const specializations = [
    "YDUS", "TUS", "DUS", "Tıp Fakültesi Dersleri", "Diş Hekimliği Fakültesi Dersleri", "Diğer"
];

function AdminStatsOverview() {
    const [overviewStats, setOverviewStats] = useState(null);
    const [userSummaries, setUserSummaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSpec, setSelectedSpec] = useState('');
    const { token } = useAuth(); // Token'ı al

    const backendOverviewUrl = `${API_BASE_URL}/api/stats/admin/overview`;
    const backendUserSummariesUrl = `${API_BASE_URL}/api/stats/admin/user-summaries`;

    // Veri çekme logic'i (Aynı kalır, API yanıtı kontrolü eklendi)
    const fetchStats = useCallback(async (filter = '') => {
        setLoading(true); setError('');
        setUserSummaries([]); setOverviewStats(null);

        if (!token) { setError("Yetkilendirme token'ı bulunamadı."); setLoading(false); return; }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            let overviewUrl = backendOverviewUrl;
            let userSummariesUrl = backendUserSummariesUrl;

            if (filter) {
                const queryParam = `?specialization=${encodeURIComponent(filter)}`;
                overviewUrl += queryParam;
                userSummariesUrl += queryParam;
            }

            const [overviewRes, summariesRes] = await Promise.all([
                axios.get(overviewUrl, config),
                axios.get(userSummariesUrl, config)
            ]);

            // Gelen verinin object ve array olduğundan emin ol
            setOverviewStats(typeof overviewRes.data === 'object' && overviewRes.data !== null ? overviewRes.data : null);
            setUserSummaries(Array.isArray(summariesRes.data) ? summariesRes.data : []);

        } catch (err) {
            console.error("İstatistikleri çekerken hata:", err);
            const errorMsg = err.response?.data?.message || 'İstatistikler yüklenirken bir hata oluştu.';
            setError(errorMsg);
            setOverviewStats(null); setUserSummaries([]);
        } finally {
            setLoading(false);
        }
    }, [token, backendOverviewUrl, backendUserSummariesUrl]);

    useEffect(() => {
        fetchStats(selectedSpec);
    }, [fetchStats, selectedSpec]);

    const handleFilterChange = (event) => {
        setSelectedSpec(event.target.value);
    };

    // --- Render Bölümü (Chakra UI ve Tema ile Uyumlu) ---

    if (loading) {
        // Chakra UI Spinner
        return (
            <Center p={10}>
                <Spinner size="xl" color="brand.500" />
                <Text ml={3} color="textSecondary">İstatistikler yükleniyor...</Text>
            </Center>
        );
    }

    return (
         // Ana VStack, tema boşluklarını kullanır
        <VStack spacing={6} align="stretch">
            {/* Heading tema stilini kullanır */}
            <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3}>
                <Icon as={FaChartBar} /> Genel Bakış ve Kullanıcı Performansları
            </Heading>

            {/* Alert tema stilini kullanır */}
            {error && (
                <Alert status="error" variant="subtle" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

             {/* FormControl ve Select tema stillerini kullanır */}
            <FormControl id="spec-filter-overview"> {/* ID benzersiz olmalı */}
                <FormLabel>Uzmanlık Alanına Göre Filtrele:</FormLabel>
                <Select value={selectedSpec} onChange={handleFilterChange} placeholder="Tümü">
                    {specializations.map(spec => (<option key={spec} value={spec}>{spec}</option>))}
                </Select>
            </FormControl>

            {/* Genel İstatistik Özeti - Box, Heading, StatGroup tema/semantic token'ları kullanır */}
            {overviewStats && (
                <Box borderWidth="1px" borderRadius="lg" p={6} borderColor="borderPrimary" bg="bgSecondary">
                    <Heading as="h4" size="md" mb={4}>Genel Özet ({overviewStats.filter || 'Tümü'})</Heading>
                    {/* StatGroup/Stat bileşenleri varsayılan tema stillerini kullanır */}
                    <StatGroup>
                        <Stat>
                            <StatLabel>Kullanıcı Sayısı</StatLabel>
                            <StatNumber>{overviewStats.userCount}</StatNumber>
                        </Stat>
                        <Stat>
                            <StatLabel>Toplam Deneme</StatLabel>
                            <StatNumber>{overviewStats.totalAttempts}</StatNumber>
                        </Stat>
                        <Stat>
                            <StatLabel>Doğru Sayısı</StatLabel>
                            <StatNumber color="green.500">{overviewStats.correctAttempts}</StatNumber>
                        </Stat>
                         <Stat>
                            <StatLabel>Başarı Oranı</StatLabel>
                            {/* Renk dinamik, Text/StatNumber tema stillerini kullanır */}
                            <StatNumber color={overviewStats.accuracy >= 80 ? 'green.500' : overviewStats.accuracy >= 50 ? 'yellow.500' : 'red.500'}>
                                %{overviewStats.accuracy}
                            </StatNumber>
                        </Stat>
                    </StatGroup>
                </Box>
            )}

            {/* Kullanıcı Performans Listesi - Box, Heading, Alert, Table tema/semantic token'ları kullanır */}
            <Box>
                <Heading as="h4" size="md" mb={4}>Kullanıcı Performansları ({selectedSpec || 'Tümü'})</Heading>
                {userSummaries.length === 0 && !loading ? (
                    <Alert status="info" variant="subtle" borderRadius="md">
                        <AlertIcon /> Filtreye uygun kullanıcı veya deneme bulunamadı.
                    </Alert>
                ) : (
                    <TableContainer borderWidth="1px" borderRadius="md" borderColor="borderSecondary">
                        <Table variant="striped" size="sm">
                            {/* Thead tema stilini (bgTertiary) kullanır */}
                            <Thead bg="bgTertiary">
                                <Tr>
                                    <Th>Kullanıcı Adı</Th>
                                    <Th isNumeric>Toplam Deneme</Th>
                                    <Th isNumeric>Doğru Sayısı</Th>
                                    <Th isNumeric>Başarı Oranı (%)</Th>
                                </Tr>
                            </Thead>
                             {/* Tbody, Tr, Td tema stillerini ve semantic token'ları kullanır */}
                            <Tbody>
                                {userSummaries.map(userStat => (
                                    <Tr key={userStat.userId} _hover={{ bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.100' }}}>
                                        <Td>{userStat.username} <Text as="span" fontSize="xs" color="textMuted">(ID: {userStat.userId})</Text></Td>
                                        <Td isNumeric>{userStat.totalAttempts}</Td>
                                        <Td isNumeric>{userStat.correctAttempts}</Td>
                                         {/* Renk dinamik, Td tema stilini kullanır */}
                                        <Td isNumeric color={userStat.accuracy >= 80 ? 'green.600' : userStat.accuracy >= 50 ? 'yellow.600' : 'red.600'}>
                                            {userStat.accuracy}%
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        </VStack>
    );
}

export default AdminStatsOverview;