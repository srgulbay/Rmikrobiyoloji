import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Box, Center, Heading,
    Spinner, Alert, AlertIcon, AlertDescription, useToast,
    Select, FormControl, FormLabel,
    Stat, StatLabel, StatNumber, StatGroup,
    VStack, Text, Icon, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
    useColorModeValue
} from '@chakra-ui/react';
import { FaChartBar, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa'; // FaExclamationTriangle eklendi

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API URL Constants
const backendOverviewUrl = `${API_BASE_URL}/api/stats/admin/overview`;
const backendUserSummariesUrl = `${API_BASE_URL}/api/stats/admin/user-summaries`;
const examClassificationsUrlApi = `${API_BASE_URL}/api/exam-classifications`;

function AdminStatsOverview({ token }) {
    // State Hooks
    const [overviewStats, setOverviewStats] = useState(null);
    const [userSummaries, setUserSummaries] = useState([]);
    const [examClassifications, setExamClassifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialDataLoading, setInitialDataLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedEcFilter, setSelectedEcFilter] = useState('');

    // Chakra UI Hooks & Style variables
    const toast = useToast();
    const tableHeaderBg = useColorModeValue("gray.100", "gray.750");
    const cardBg = useColorModeValue("white", "gray.750");
    const selectBg = useColorModeValue("white", "gray.700");
    const tableRowHoverBg = useColorModeValue('gray.50', 'gray.800');
    const borderColor = useColorModeValue("gray.200", "gray.600"); // Genel kenarlık için
    const componentBg = useColorModeValue("gray.50", "gray.800"); // Ana Box için arkaplan
    const headingColor = useColorModeValue("gray.700", "gray.200");
    const textColorMuted = useColorModeValue("gray.600", "gray.400");


    const fetchExamClassificationsInternal = useCallback(async () => {
        if (!token) {
            console.warn("Token is missing. Cannot fetch exam classifications.");
            setInitialDataLoading(false);
            return;
        }
        setInitialDataLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(examClassificationsUrlApi, config);
            setExamClassifications(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Sınav Sınıflandırmaları çekilirken hata:", err);
            toast({ title: "Veri Yükleme Hatası", description: "Sınav sınıflandırmaları yüklenemedi.", status: "error", duration: 3000, isClosable: true });
            setExamClassifications([]);
        } finally {
            setInitialDataLoading(false);
        }
    }, [token, toast]);

    useEffect(() => {
        fetchExamClassificationsInternal();
    }, [fetchExamClassificationsInternal]);

    const fetchStats = useCallback(async (filterName = '') => {
        setLoading(true); setError('');
        if (!token) { setError("Yetkilendirme token'ı bulunamadı."); setLoading(false); return; }
        
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            let overviewUrlWithFilter = backendOverviewUrl;
            let userSummariesUrlWithFilter = backendUserSummariesUrl;
            
            if (filterName) {
                const queryParam = `?specialization=${encodeURIComponent(filterName)}`; 
                overviewUrlWithFilter += queryParam;
                userSummariesUrlWithFilter += queryParam;
            }

            const [overviewRes, summariesRes] = await Promise.all([
                axios.get(overviewUrlWithFilter, config),
                axios.get(userSummariesUrlWithFilter, config)
            ]);
            setOverviewStats(overviewRes.data || {});
            setUserSummaries(Array.isArray(summariesRes.data) ? summariesRes.data : []);
        } catch (err) {
            console.error("Admin istatistikleri çekerken hata:", err);
            const errorMsg = err.response?.data?.message || 'İstatistikler yüklenirken bir hata oluştu.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (!initialDataLoading) { 
            fetchStats(selectedEcFilter);
        }
    }, [fetchStats, selectedEcFilter, initialDataLoading]);

    const handleFilterChange = (event) => {
        setSelectedEcFilter(event.target.value); 
    };

    if (initialDataLoading) return <Center p={10}><Spinner size="xl" color="brand.500" thickness="3px" speed="0.65s"/></Center>;

    return (
        <Box p={4} borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="lg" bg={componentBg}>
            <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3} mb={6} color={headingColor}>
                <Icon as={FaChartBar} /> Genel Bakış ve Kullanıcı Performansları
            </Heading>
            
            <FormControl id="ec-filter-overview" mb={6}>
                <FormLabel fontSize="sm">Sınav Tipine Göre Filtrele:</FormLabel>
                <Select 
                    value={selectedEcFilter} 
                    onChange={handleFilterChange} 
                    placeholder="Tüm Sınav Tipleri"
                    borderColor="borderSecondary" 
                    focusBorderColor="brand.500"
                    bg={selectBg}
                    size="sm"
                >
                    {examClassifications.map(ec => (<option key={ec.id} value={ec.name}>{ec.name}</option>))}
                </Select>
            </FormControl>

            {loading && <Center p={5}><Spinner color="brand.500" thickness="2px" speed="0.65s" size="md" /></Center>}
            
            {error && !loading && (
                <Alert status="error" borderRadius="md" variant="subtle" mt={4}>
                    <AlertIcon as={FaExclamationTriangle} />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {!loading && !error && overviewStats && (
                <Box borderWidth="1px" borderRadius="lg" p={6} borderColor={borderColor} bg={cardBg} boxShadow="md" mb={6}>
                    <Heading as="h4" size="md" mb={4} color={headingColor}>
                        Genel Özet ({overviewStats.filter || selectedEcFilter || 'Tümü'})
                    </Heading>
                    <StatGroup>
                        <Stat>
                            <StatLabel color={textColorMuted}>Kayıtlı Kullanıcı</StatLabel>
                            <StatNumber color="textPrimary">{overviewStats.userCount}</StatNumber>
                        </Stat>
                        <Stat>
                            <StatLabel color={textColorMuted}>Toplam Soru Çözme</StatLabel>
                            <StatNumber color="textPrimary">{overviewStats.totalAttempts}</StatNumber>
                        </Stat>
                        <Stat>
                            <StatLabel color={textColorMuted}>Toplam Doğru</StatLabel>
                            <StatNumber color="green.500">{overviewStats.correctAttempts}</StatNumber>
                        </Stat>
                        <Stat>
                            <StatLabel color={textColorMuted}>Genel Başarı</StatLabel>
                            <StatNumber color={overviewStats.accuracy >= 80 ? 'green.500' : overviewStats.accuracy >= 50 ? 'yellow.500' : 'red.500'}>
                                %{overviewStats.accuracy != null ? parseFloat(overviewStats.accuracy).toFixed(1) : 'N/A'}
                            </StatNumber>
                        </Stat>
                    </StatGroup>
                </Box>
            )}

                {!loading && !error && ( // Sadece yükleme yokken ve hata yokken kullanıcı performanslarını göster
                <Box>
                    <Heading as="h4" size="md" mb={4} color={headingColor}>
                        Kullanıcı Performansları ({selectedEcFilter || 'Tümü'})
                    </Heading>
                    {userSummaries.length === 0 && !loading ? ( 
                        <Alert status="info" borderRadius="md" variant="subtle" >
                            <AlertIcon as={FaInfoCircle} mr={2}/>
                            Bu filtreye uygun kullanıcı performansı verisi bulunamadı.
                        </Alert>
                    ) : userSummaries.length > 0 ? ( // userSummaries doluysa tabloyu göster
                        <TableContainer borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="md">
                            <Table variant="simple" size="sm">
                                <Thead bg={tableHeaderBg}>
                                    <Tr>
                                        <Th>Kullanıcı Adı</Th>
                                        <Th isNumeric>Toplam Deneme</Th>
                                        <Th isNumeric>Doğru Sayısı</Th>
                                        <Th isNumeric>Başarı Oranı (%)</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {userSummaries.map(userStat => (
                                        <Tr key={userStat.userId} _hover={{ bg: tableRowHoverBg }}>
                                            <Td fontWeight="medium">{userStat.username} <Text as="span" fontSize="xs" color={textColorMuted}>(ID: {userStat.userId})</Text></Td>
                                            <Td isNumeric>{userStat.totalAttempts}</Td>
                                            <Td isNumeric color="green.600">{userStat.correctAttempts}</Td>
                                            <Td isNumeric fontWeight="semibold" color={userStat.accuracy >= 80 ? 'green.500' : userStat.accuracy >= 50 ? 'yellow.500' : 'red.500'}>
                                                {userStat.accuracy != null ? parseFloat(userStat.accuracy).toFixed(1) : 'N/A'}%
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    ) : null}
                </Box>
                )}
            </Box>
    );
}

export default AdminStatsOverview;