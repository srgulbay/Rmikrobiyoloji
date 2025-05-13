// src/components/admin/FeedbackManagement.jsx (veya src/components/FeedbackManagement.jsx)
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Box, Heading, VStack, HStack, Button, Icon, Center,
    Table, Thead, Tbody, Tr, Th, Td, TableContainer,
    Select, FormControl, FormLabel, Textarea, Text, Badge,
    useToast, useDisclosure,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    Spinner, Alert, AlertIcon, Tooltip, Tag, IconButton,
    useColorModeValue, Link as ChakraLink, Flex
} from '@chakra-ui/react';
import { FaComments, FaEye, FaFilter, FaTimesCircle, FaSave, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';


const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const feedbackTypes = [
    { value: 'question_error', label: 'Soru Hatası' },
    { value: 'lecture_feedback', label: 'Konu Anlatımı Geri Bildirimi' },
    { value: 'technical_issue', label: 'Teknik Sorun' },
    { value: 'general_feedback', label: 'Genel Geri Bildirim' },
];

const feedbackStatuses = [
    { value: 'new', label: 'Yeni', color: 'blue' },
    { value: 'in_progress', label: 'İnceleniyor', color: 'yellow' },
    { value: 'resolved', label: 'Çözüldü', color: 'green' },
    { value: 'wont_fix', label: 'Çözülmeyecek', color: 'purple' },
    { value: 'archived', label: 'Arşivlendi', color: 'gray' },
];

const initialFiltersState = { type: '', status: '' };

function FeedbackManagement({ token }) {
    const [feedbackItems, setFeedbackItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const toast = useToast();
    const { isOpen: isDetailModalOpen, onOpen: onDetailModalOpen, onClose: onDetailModalClose } = useDisclosure();
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const [filters, setFilters] = useState(initialFiltersState);

    // Style Hooks
    const tableHeaderBg = useColorModeValue("gray.100", "gray.750");
    const inputSelectBg = useColorModeValue("white", "gray.700");
    const tableRowHoverBg = useColorModeValue("gray.50", "gray.800");
    const detailBoxBg = useColorModeValue("gray.50", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const componentBg = useColorModeValue("white", "gray.800");
    const headingColor = useColorModeValue("gray.700", "gray.200");


    const fetchFeedbackItems = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const activeFilters = {};
            if (filters.type) activeFilters.type = filters.type;
            if (filters.status) activeFilters.status = filters.status;

            const config = { 
                headers: { Authorization: `Bearer ${token}` },
                params: activeFilters
            };
            
            const response = await axios.get(`${API_BASE_URL}/api/admin/feedback`, config);
            setFeedbackItems(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Geri bildirimler yüklenirken bir hata oluştu.');
            setFeedbackItems([]);
        } finally {
            setLoading(false);
        }
    }, [token, filters]);

    useEffect(() => {
        fetchFeedbackItems();
    }, [fetchFeedbackItems]);

    const handleViewDetails = (item) => {
        setSelectedFeedback(item);
        setAdminNotes(item.adminNotes || '');
        setNewStatus(item.status);
        onDetailModalOpen();
    };

    const handleUpdateFeedback = async () => {
        if (!selectedFeedback) return;
        setIsUpdating(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = { status: newStatus, adminNotes: adminNotes };
            await axios.put(`${API_BASE_URL}/api/admin/feedback/${selectedFeedback.id}`, payload, config);
            toast({ title: "Başarılı", description: "Geri bildirim güncellendi.", status: "success", duration: 3000, isClosable: true });
            fetchFeedbackItems(); 
            onDetailModalClose(); 
        } catch (err) {
            toast({ title: "Hata", description: err.response?.data?.message || "Güncelleme sırasında hata.", status: "error", duration: 5000, isClosable: true });
        } finally {
            setIsUpdating(false);
        }
    };
    
    const getStatusTag = (statusValue) => {
        const statusObj = feedbackStatuses.find(s => s.value === statusValue);
        return statusObj ? <Badge colorScheme={statusObj.color} variant="subtle" px={2} py={0.5} borderRadius="md">{statusObj.label}</Badge> : <Badge>{statusValue}</Badge>;
    };

    const getFeedbackTypeLabel = (typeValue) => {
        return feedbackTypes.find(t => t.value === typeValue)?.label || typeValue;
    };
    
    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const resetFilters = () => {
        setFilters(initialFiltersState);
    };

    // İlk yükleme ve veri yoksa ana spinner gösterilir
    if (loading && feedbackItems.length === 0 && !error) {
        return <Center p={10}><Spinner size="xl" color="brand.500" thickness="3px" /></Center>;
    }

    return (
        <Box p={4} borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="lg" bg={componentBg}>
            <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3} mb={6} color={headingColor}>
                <Icon as={FaComments} /> Geri Bildirim ve Hata Raporları
            </Heading>

            <HStack spacing={4} mb={6} as="form" onSubmit={(e) => { e.preventDefault(); fetchFeedbackItems(); }}>
                <FormControl id="filterType">
                    <FormLabel fontSize="sm">Türe Göre Filtrele</FormLabel>
                    <Select name="type" placeholder="Tüm Türler" value={filters.type} onChange={handleFilterChange} bg={inputSelectBg} size="sm" focusBorderColor="blue.500">
                        {feedbackTypes.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                    </Select>
                </FormControl>
                <FormControl id="filterStatus">
                    <FormLabel fontSize="sm">Duruma Göre Filtrele</FormLabel>
                    <Select name="status" placeholder="Tüm Durumlar" value={filters.status} onChange={handleFilterChange} bg={inputSelectBg} size="sm" focusBorderColor="blue.500">
                         {feedbackStatuses.map(fs => <option key={fs.value} value={fs.value}>{fs.label}</option>)}
                    </Select>
                </FormControl>
                <Button type="submit" colorScheme="blue" size="sm" leftIcon={<Icon as={FaFilter} />} isLoading={loading} alignSelf="flex-end">Filtrele</Button>
                <Button variant="outline" colorScheme="gray" size="sm" leftIcon={<Icon as={FaTimesCircle} />} onClick={resetFilters} isDisabled={loading} alignSelf="flex-end">Temizle</Button>
            </HStack>
            
            {error && <Alert status="error" mb={4} borderRadius="md" variant="subtle"><AlertIcon as={FaExclamationTriangle}/>{error}</Alert>}
            {/* Filtreleme sırasında gösterilecek küçük spinner */}
            {loading && feedbackItems.length > 0 && <Center py={5}><Spinner color="brand.400" thickness="2px" speed="0.65s" size="md"/></Center>}

            {!loading && feedbackItems.length === 0 && !error ? (
                <Alert status="info" variant="subtle" borderRadius="md"><AlertIcon as={FaInfoCircle} /> Filtrelerinize uygun geri bildirim bulunamadı.</Alert>
            ) : !error && feedbackItems.length > 0 ? (
            <TableContainer borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="sm">
                <Table variant="simple" size="sm">
                    <Thead bg={tableHeaderBg}>
                        <Tr>
                            <Th>ID</Th>
                            <Th>Kullanıcı</Th>
                            <Th>Tür</Th>
                            <Th>İlgili İçerik</Th>
                            <Th>Mesaj (Önizleme)</Th>
                            <Th>Durum</Th>
                            <Th>Tarih</Th>
                            <Th isNumeric>İşlemler</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {feedbackItems.map(item => (
                            <Tr key={item.id} _hover={{bg: tableRowHoverBg}}>
                                <Td>{item.id}</Td>
                                <Td>{item.user?.username || `Kullanıcı ID: ${item.userId}`}</Td>
                                <Td><Tag size="sm" variant="outline" colorScheme="cyan" borderRadius="full">{getFeedbackTypeLabel(item.type)}</Tag></Td>
                                <Td>
                                    {item.contentId ? (
                                        item.type === 'question_error' && item.question ? 
                                        <ChakraLink as={RouterLink} to={`/admin?tab=questions&edit=${item.contentId}`} color="blue.500" title={`Soruya Git: ${item.question.text?.substring(0,30)}...`}>Soru: {item.contentId}</ChakraLink> :
                                        item.type === 'lecture_feedback' && item.lecture ?
                                        <ChakraLink as={RouterLink} to={`/admin?tab=lectures&edit=${item.contentId}`} color="blue.500" title={`Konu Anlatımına Git: ${item.lecture.title}`}>Ders: {item.contentId}</ChakraLink> :
                                        item.contentId
                                    ) : '-'}
                                </Td>
                                <Td maxW="250px" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" title={item.message}>
                                    {item.message.substring(0,50)}{item.message.length > 50 && "..."}
                                </Td>
                                <Td>{getStatusTag(item.status)}</Td>
                                <Td>{new Date(item.createdAt).toLocaleString('tr-TR')}</Td>
                                <Td isNumeric>
                                    <Tooltip label="Detayları Görüntüle / Yönet" fontSize="xs">
                                        <IconButton icon={<FaEye />} variant="ghost" size="sm" colorScheme="blue" onClick={() => handleViewDetails(item)}/>
                                    </Tooltip>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </TableContainer>
            ) : null }

            {selectedFeedback && (
                <Modal isOpen={isDetailModalOpen} onClose={onDetailModalClose} size="xl" scrollBehavior="inside">
                    <ModalOverlay />
                    <ModalContent bg={componentBg}>
                        <ModalHeader>Geri Bildirim Detayı (ID: {selectedFeedback.id})</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <VStack spacing={4} align="stretch">
                                <Box>
                                    <Text fontWeight="bold">Kullanıcı:</Text>
                                    <Text>{selectedFeedback.user?.username || `ID: ${selectedFeedback.userId}`}{selectedFeedback.user?.email ? ` (${selectedFeedback.user.email})` : ''}</Text>
                                </Box>
                                <Box>
                                    <Text fontWeight="bold">Tür:</Text>
                                    <Text>{getFeedbackTypeLabel(selectedFeedback.type)}</Text>
                                </Box>
                                {selectedFeedback.contentId && 
                                <Box>
                                    <Text fontWeight="bold">İlgili İçerik ID:</Text>
                                     {selectedFeedback.type === 'question_error' && selectedFeedback.question ? 
                                        <ChakraLink as={RouterLink} to={`/solve?questionId=${selectedFeedback.contentId}`} color="blue.500" >Soru: {selectedFeedback.contentId} ({selectedFeedback.question.text?.substring(0,50)}...)</ChakraLink> :
                                     selectedFeedback.type === 'lecture_feedback' && selectedFeedback.lecture ?
                                        <ChakraLink as={RouterLink} to={`/lectures/topic/${selectedFeedback.lecture.topicId}`} color="blue.500" >Ders: {selectedFeedback.contentId} ({selectedFeedback.lecture.title})</ChakraLink> :
                                     <Text>{selectedFeedback.contentId}</Text>}
                                </Box>}
                                <Box>
                                    <Text fontWeight="bold">Mesaj:</Text>
                                    <Text whiteSpace="pre-wrap" p={3} bg={detailBoxBg} borderRadius="md" maxHeight="200px" overflowY="auto">{selectedFeedback.message}</Text>
                                </Box>
                                 <Box>
                                    <Text fontWeight="bold">Gönderim Tarihi:</Text>
                                    <Text>{new Date(selectedFeedback.createdAt).toLocaleString('tr-TR')}</Text>
                                </Box>
                                <FormControl id="feedback-status-update">
                                    <FormLabel fontSize="sm">Durum:</FormLabel>
                                    <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} bg={inputSelectBg} focusBorderColor="blue.500">
                                        {feedbackStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </Select>
                                </FormControl>
                                <FormControl id="feedback-adminNotes">
                                    <FormLabel fontSize="sm">Admin Notları:</FormLabel>
                                    <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={4} bg={inputSelectBg} placeholder="Bu geri bildirimle ilgili notlarınız..." focusBorderColor="blue.500"/>
                                </FormControl>
                            </VStack>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="ghost" mr={3} onClick={onDetailModalClose}>Kapat</Button>
                            <Button colorScheme="blue" onClick={handleUpdateFeedback} isLoading={isUpdating} leftIcon={<FaSave/>}>Güncelle</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
        </Box>
    );
}

export default FeedbackManagement;