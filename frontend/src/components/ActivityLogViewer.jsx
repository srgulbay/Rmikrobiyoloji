import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Box, Heading, Icon,
    Table, Thead, Tbody, Tr, Th, Td, TableContainer,
    Spinner, Alert, AlertIcon, Text,
    useColorModeValue, HStack, Input, Button,
    FormControl, FormLabel, Select, // Select'i de ekledim, filtrelerde kullanılabilir diye, ama mevcut kodda yok, kaldırılabilir.
    Tag,
    Center // Center importu eklendi
} from '@chakra-ui/react';
import { FaHistory, FaFilter, FaTimesCircle } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const initialFiltersState = { adminUsername: '', actionType: '', targetEntityType: '', page: 1, limit: 20 };

function ActivityLogViewer({ token }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState(initialFiltersState);
    const [totalPages, setTotalPages] = useState(1);

    // Style Hooks
    const tableHeaderBg = useColorModeValue("gray.100", "gray.700");
    const inputSelectBg = useColorModeValue("white", "gray.700");
    const tableRowHoverBg = useColorModeValue("gray.50", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const componentBg = useColorModeValue("white", "gray.800");


    const fetchLogs = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const activeFilters = {};
            for (const key in filters) {
                if (filters[key] !== '' && filters[key] !== null && filters[key] !== 0) { // Sayfa 0 olmamalı
                    activeFilters[key] = filters[key];
                }
            }
             // Ensure page is at least 1
            if (!activeFilters.page || activeFilters.page < 1) {
                activeFilters.page = 1;
            }


            const config = { 
                headers: { Authorization: `Bearer ${token}` },
                params: activeFilters 
            };
            const response = await axios.get(`${API_BASE_URL}/api/admin/activity-logs`, config);
            setLogs(Array.isArray(response.data.logs) ? response.data.logs : []);
            setTotalPages(response.data.totalPages || 1);
        } catch (err) {
            setError(err.response?.data?.message || 'Aktivite kayıtları yüklenirken bir hata oluştu.');
            setLogs([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [token, filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);
    
    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
    };
    
    const handlePageChange = (newPage) => {
         if (newPage >= 1 && newPage <= totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    const resetFilters = () => {
        setFilters(initialFiltersState);
    };

    const handleSubmitFilters = (e) => {
        e.preventDefault();
        // Ensure page is reset to 1 when submitting filters manually,
        // though handleFilterChange already does this.
        setFilters(prev => ({ ...prev, page: 1 }));
        fetchLogs(); 
    };

    return (
        <Box p={4} borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="lg" bg={componentBg}>
            <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3} mb={6} color="textPrimary">
                <Icon as={FaHistory} /> Aktivite Kayıtları (Audit Log)
            </Heading>

            <Box as="form" onSubmit={handleSubmitFilters}>
                <HStack spacing={4} mb={6} align="flex-end">
                    <FormControl id="adminUsernameFilter" size="sm">
                        <FormLabel fontSize="xs" mb={1}>Admin Kullanıcı Adı</FormLabel>
                        <Input name="adminUsername" placeholder="Tümü" value={filters.adminUsername} onChange={handleFilterChange} size="sm" bg={inputSelectBg} />
                    </FormControl>
                    <FormControl id="actionTypeFilter" size="sm">
                        <FormLabel fontSize="xs" mb={1}>Eylem Türü</FormLabel>
                        <Input name="actionType" placeholder="Örn: USER_UPDATED" value={filters.actionType} onChange={handleFilterChange} size="sm" bg={inputSelectBg}/>
                    </FormControl>
                    <FormControl id="targetEntityTypeFilter" size="sm">
                        <FormLabel fontSize="xs" mb={1}>Hedef Varlık Türü</FormLabel>
                        <Input name="targetEntityType" placeholder="Örn: Topic, Question" value={filters.targetEntityType} onChange={handleFilterChange} size="sm" bg={inputSelectBg}/>
                    </FormControl>
                    <Button type="submit" colorScheme="blue" size="sm" leftIcon={<Icon as={FaFilter} />} isLoading={loading}>Filtrele</Button>
                    <Button variant="outline" colorScheme="gray" size="sm" leftIcon={<Icon as={FaTimesCircle} />} onClick={resetFilters} isDisabled={loading}>Temizle</Button>
                </HStack>
            </Box>

            {error && <Alert status="error" mb={4} borderRadius="md" variant="subtle"><AlertIcon />{error}</Alert>}

            {loading && logs.length === 0 ? (
                <Center p={10}><Spinner size="xl" color="brand.500" thickness="3px"/></Center>
            ) : !loading && logs.length === 0 && !error ? (
                <Alert status="info" borderRadius="md" variant="subtle" mt={4}><AlertIcon /> Filtrelerinize uygun kayıt bulunamadı.</Alert>
            ) : (
                <>
                <TableContainer borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="sm">
                    <Table variant="simple" size="sm">
                        <Thead bg={tableHeaderBg}>
                            <Tr>
                                <Th>ID</Th>
                                <Th>Admin</Th>
                                <Th>Eylem</Th>
                                <Th>Hedef Varlık</Th>
                                <Th>Hedef ID</Th>
                                <Th>Detaylar</Th>
                                <Th>Zaman Damgası</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {logs.map(log => (
                                <Tr key={log.id} _hover={{bg: tableRowHoverBg}}>
                                    <Td>{log.id}</Td>
                                    <Td>{log.adminUser?.username || log.adminUserId || 'Sistem'}</Td>
                                    <Td><Tag size="sm" variant="solid" colorScheme="orange" borderRadius="full">{log.actionType}</Tag></Td>
                                    <Td>{log.targetEntityType || '-'}</Td>
                                    <Td>{log.targetEntityId || '-'}</Td>
                                    <Td maxW="250px" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" title={typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details}>
                                        {typeof log.details === 'string' ? (log.details.substring(0,50) + (log.details.length > 50 ? "..." : "")) : (typeof log.details === 'object' ? JSON.stringify(log.details).substring(0,50) + (JSON.stringify(log.details).length > 50 ? "..." : "") : String(log.details).substring(0,50) + "...")}
                                    </Td>
                                    <Td>{log.timestamp || log.createdAt ? new Date(log.timestamp || log.createdAt).toLocaleString('tr-TR') : '-'}</Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </TableContainer>
                {totalPages > 1 && (
                    <HStack mt={6} justifyContent="center" spacing={3}>
                        <Button size="sm" onClick={() => handlePageChange(filters.page - 1)} isDisabled={filters.page <= 1 || loading} variant="outline">Önceki</Button>
                        <Text fontSize="sm" color="textMuted">Sayfa {filters.page} / {totalPages}</Text>
                        <Button size="sm" onClick={() => handlePageChange(filters.page + 1)} isDisabled={filters.page >= totalPages || loading} variant="outline">Sonraki</Button>
                    </HStack>
                )}
                </>
            )}
        </Box>
    );
}

export default ActivityLogViewer;