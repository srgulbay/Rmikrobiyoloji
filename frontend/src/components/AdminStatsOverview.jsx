import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Box, Container, Center, Heading, Flex, Tabs, TabList, TabPanels, Tab, TabPanel,
    Spinner, Alert, AlertIcon, AlertTitle, AlertDescription, useToast,
    Button, IconButton, Icon, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
    Badge, Select, FormControl, FormLabel, Input, Textarea, SimpleGrid, Modal,
    ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    VStack, HStack, Text, Link as ChakraLink, Stat, StatLabel, StatNumber, StatGroup,
    useColorModeValue
} from '@chakra-ui/react';
import { FaChartBar } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const specializations = [
    "YDUS", "TUS", "DUS", "Tıp Fakültesi Dersleri", "Diş Hekimliği Fakültesi Dersleri", "Diğer Uzmanlıklar"
];

function AdminStatsOverview({ token }) {
    const [overviewStats, setOverviewStats] = useState(null);
    const [userSummaries, setUserSummaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSpec, setSelectedSpec] = useState('');
    const toast = useToast();

    const backendOverviewUrl = `${API_BASE_URL}/api/stats/admin/overview`;
    const backendUserSummariesUrl = `${API_BASE_URL}/api/stats/admin/user-summaries`;

    const fetchStats = useCallback(async (filter = '') => {
        setLoading(true); setError(''); setUserSummaries([]); setOverviewStats(null);
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
            setOverviewStats(overviewRes.data);
            setUserSummaries(Array.isArray(summariesRes.data) ? summariesRes.data : []);
        } catch (err) {
            console.error("Admin istatistikleri çekerken hata:", err);
            const errorMsg = err.response?.data?.message || 'İstatistikler yüklenirken bir hata oluştu.';
            setError(errorMsg);
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        } finally {
            setLoading(false);
        }
    }, [token, backendOverviewUrl, backendUserSummariesUrl, toast]);

    useEffect(() => { fetchStats(selectedSpec); }, [fetchStats, selectedSpec]);

    const handleFilterChange = (event) => setSelectedSpec(event.target.value);

    if (loading) return <Center p={10}><Spinner size="xl" color="brand.500" /></Center>;

    return (
        <VStack spacing={6} align="stretch">
            <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3}>
                <Icon as={FaChartBar} /> Genel Bakış ve Kullanıcı Performansları
            </Heading>
            {error && (
                <Alert status="error" borderRadius="md" variant="subtle">
                    <AlertIcon />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <FormControl id="spec-filter-overview">
                <FormLabel>Uzmanlık Alanına Göre Filtrele:</FormLabel>
                <Select value={selectedSpec} onChange={handleFilterChange} placeholder="Tümü">
                    {specializations.map(spec => (<option key={spec} value={spec}>{spec}</option>))}
                </Select>
            </FormControl>
            {overviewStats && (
                <Box borderWidth="1px" borderRadius="lg" p={6} borderColor="borderPrimary" bg="bgSecondary">
                    <Heading as="h4" size="md" mb={4}>Genel Özet ({overviewStats.filter || 'Tümü'})</Heading>
                    <StatGroup>
                        <Stat><StatLabel>Kullanıcı Sayısı</StatLabel><StatNumber>{overviewStats.userCount}</StatNumber></Stat>
                        <Stat><StatLabel>Toplam Deneme</StatLabel><StatNumber>{overviewStats.totalAttempts}</StatNumber></Stat>
                        <Stat><StatLabel>Doğru Sayısı</StatLabel><StatNumber color="green.500">{overviewStats.correctAttempts}</StatNumber></Stat>
                        <Stat><StatLabel>Başarı Oranı</StatLabel><StatNumber color={overviewStats.accuracy >= 80 ? 'green.500' : overviewStats.accuracy >= 50 ? 'yellow.500' : 'red.500'}>%{overviewStats.accuracy}</StatNumber></Stat>
                    </StatGroup>
                </Box>
            )}
            <Box>
                <Heading as="h4" size="md" mb={4}>Kullanıcı Performansları ({selectedSpec || 'Tümü'})</Heading>
                {userSummaries.length === 0 && !loading ? (
                    <Alert status="info" borderRadius="md" variant="subtle"><AlertIcon /> Filtreye uygun kullanıcı veya deneme bulunamadı.</Alert>
                ) : (
                    <TableContainer borderWidth="1px" borderRadius="md" borderColor="borderSecondary">
                        <Table variant="striped" size="sm">
                            <Thead bg="bgTertiary"><Tr><Th>Kullanıcı Adı</Th><Th isNumeric>Toplam Deneme</Th><Th isNumeric>Doğru Sayısı</Th><Th isNumeric>Başarı Oranı (%)</Th></Tr></Thead>
                            <Tbody>
                                {userSummaries.map(userStat => (
                                    <Tr key={userStat.userId} _hover={{ bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.100' }}}>
                                        <Td>{userStat.username} <Text as="span" fontSize="xs" color="textMuted">(ID: {userStat.userId})</Text></Td>
                                        <Td isNumeric>{userStat.totalAttempts}</Td>
                                        <Td isNumeric>{userStat.correctAttempts}</Td>
                                        <Td isNumeric color={userStat.accuracy >= 80 ? 'green.600' : userStat.accuracy >= 50 ? 'yellow.600' : 'red.600'}>{userStat.accuracy}%</Td>
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