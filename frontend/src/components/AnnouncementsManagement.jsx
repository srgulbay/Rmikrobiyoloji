// src/components/AnnouncementsManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Box, Heading, VStack, HStack, Button, Icon, Center, IconButton,
    Table, Thead, Tbody, Tr, Th, Td, TableContainer,
    FormControl, FormLabel, Input, Textarea, Select,
    useToast, useDisclosure,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    Spinner, Alert, AlertIcon, Text, Tooltip, Badge, SimpleGrid,
    useColorModeValue,
    Flex 
} from '@chakra-ui/react';
import { FaBullhorn, FaPlus, FaEdit, FaTrashAlt, FaSave, FaTimesCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const initialFormState = { title: '', content: '', targetAudience: 'all', isActive: true, scheduledAt: '' };

function AnnouncementsManagement({ token }) {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [formData, setFormData] = useState(initialFormState);
    const toast = useToast();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const [announcementToDelete, setAnnouncementToDelete] = useState(null);

    // Style Hooks
    const formBg = useColorModeValue('blue.50', 'blue.900');
    const formBorderColor = useColorModeValue('blue.200', 'blue.700');
    const inputSelectBg = useColorModeValue("white", "gray.700");
    const tableHeaderBg = useColorModeValue("gray.100", "gray.750");
    const tableRowHoverBg = useColorModeValue("gray.50", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const componentBg = useColorModeValue("white", "gray.800");
    const headingColor = useColorModeValue("gray.700", "gray.200"); // Başlık için renk
    const textColorMuted = useColorModeValue("gray.500", "gray.400"); // Daha soluk metinler

    const fetchAnnouncements = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${API_BASE_URL}/api/admin/announcements`, config);
            setAnnouncements(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Duyurular yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    }, [token]); // error ve toast bağımlılıktan çıkarıldı

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.content.trim()) {
            toast({ title: "Doğrulama Hatası", description: "Başlık ve içerik boş olamaz.", status: "error", duration: 4000, isClosable: true });
            return;
        }
        setIsSaving(true);
        const payload = { ...formData, scheduledAt: formData.scheduledAt || null };
        const url = editingAnnouncement 
            ? `${API_BASE_URL}/api/admin/announcements/${editingAnnouncement.id}` 
            : `${API_BASE_URL}/api/admin/announcements`;
        const method = editingAnnouncement ? 'put' : 'post';

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios[method](url, payload, config);
            toast({ title: "Başarılı", description: `Duyuru ${editingAnnouncement ? 'güncellendi' : 'eklendi'}.`, status: "success", duration: 3000, isClosable: true });
            fetchAnnouncements();
            setIsFormOpen(false);
            setEditingAnnouncement(null);
            setFormData(initialFormState);
        } catch (err) {
            toast({ title: "İşlem Hatası", description: err.response?.data?.message || 'İşlem sırasında bir hata oluştu.', status: "error", duration: 5000, isClosable: true });
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (announcement) => {
        setEditingAnnouncement(announcement);
        setFormData({ 
            title: announcement.title, 
            content: announcement.content, 
            targetAudience: announcement.targetAudience || 'all',
            isActive: announcement.isActive !== undefined ? announcement.isActive : true,
            scheduledAt: announcement.scheduledAt ? new Date(announcement.scheduledAt).toISOString().substring(0, 16) : ''
        });
        setIsFormOpen(true);
    };
    
    const openDeleteModal = (announcement) => {
        setAnnouncementToDelete(announcement);
        onDeleteOpen();
    };

    const handleDelete = async () => {
        if (!announcementToDelete) return;
        setIsSaving(true); 
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`${API_BASE_URL}/api/admin/announcements/${announcementToDelete.id}`, config);
            toast({ title: "Başarılı", description: "Duyuru silindi.", status: "success", duration: 3000, isClosable: true });
            fetchAnnouncements();
            onDeleteClose();
        } catch (err) {
            toast({ title: "Silme Hatası", description: err.response?.data?.message || 'Silme işlemi sırasında hata.', status: "error", duration: 5000, isClosable: true });
        } finally {
            setIsSaving(false);
            setAnnouncementToDelete(null);
        }
    };

    if (loading && announcements.length === 0 && !error) {
        return <Center p={10}><Spinner size="xl" color="brand.500" thickness="3px" /></Center>;
    }

    return (
        <Box p={4} borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="lg" bg={componentBg}>
            <Flex justify="space-between" align="center" mb={6}>
                <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3} color={headingColor}>
                    <Icon as={FaBullhorn} /> Duyuru Yönetimi
                </Heading>
                <Button 
                    colorScheme="blue" 
                    leftIcon={<FaPlus />} 
                    onClick={() => { setIsFormOpen(true); setEditingAnnouncement(null); setFormData(initialFormState);}}
                    size="sm"
                >
                    Yeni Duyuru Ekle
                </Button>
            </Flex>

            {error && <Alert status="error" mb={4} borderRadius="md" variant="subtle"><AlertIcon as={FaExclamationTriangle}/>{error}</Alert>}

            {isFormOpen && (
                <Box as="form" onSubmit={handleSubmit} p={6} borderWidth="1px" borderRadius="lg" borderColor={formBorderColor} bg={formBg} mb={8} boxShadow="md">
                    <Heading as="h4" size="md" mb={5} color={headingColor}>{editingAnnouncement ? 'Duyuruyu Düzenle' : 'Yeni Duyuru Oluştur'}</Heading>
                    <VStack spacing={4}>
                        <FormControl isRequired id="announcement-title">
                            <FormLabel fontSize="sm">Başlık</FormLabel>
                            <Input name="title" value={formData.title} onChange={handleInputChange} bg={inputSelectBg} />
                        </FormControl>
                        <FormControl isRequired id="announcement-content">
                            <FormLabel fontSize="sm">İçerik</FormLabel>
                            <Textarea name="content" value={formData.content} onChange={handleInputChange} rows={5} bg={inputSelectBg} />
                        </FormControl>
                        <SimpleGrid columns={{base: 1, md: 3}} spacing={4} w="full">
                            <FormControl id="announcement-targetAudience">
                                <FormLabel fontSize="sm">Hedef Kitle</FormLabel>
                                <Select name="targetAudience" value={formData.targetAudience} onChange={handleInputChange} bg={inputSelectBg}>
                                    <option value="all">Tüm Kullanıcılar</option>
                                    <option value="registered_users">Kayıtlı Kullanıcılar</option> 
                                </Select>
                            </FormControl>
                            <FormControl id="announcement-isActive">
                                <FormLabel fontSize="sm">Durum</FormLabel>
                                <Select name="isActive" value={String(formData.isActive)} onChange={handleInputChange} bg={inputSelectBg}>
                                     <option value="true">Aktif</option>
                                     <option value="false">Pasif</option>
                                 </Select>
                            </FormControl>
                             <FormControl id="announcement-scheduledAt">
                                <FormLabel fontSize="sm">Yayınlanma Zamanı (Opsiyonel)</FormLabel>
                                <Input type="datetime-local" name="scheduledAt" value={formData.scheduledAt} onChange={handleInputChange} bg={inputSelectBg}/>
                                <Text fontSize="xs" color={textColorMuted} mt={1}>Boş bırakılırsa hemen yayınlanır.</Text>
                            </FormControl>
                        </SimpleGrid>
                        <HStack spacing={3} alignSelf="flex-start" mt={3}>
                            <Button type="submit" colorScheme="blue" leftIcon={<FaSave/>} isLoading={isSaving} loadingText="Kaydediliyor...">Kaydet</Button>
                            <Button variant="ghost" onClick={() => { setIsFormOpen(false); setEditingAnnouncement(null); setFormData(initialFormState);}} leftIcon={<FaTimesCircle/>}>İptal</Button>
                        </HStack>
                    </VStack>
                </Box>
            )}

            <Heading as="h4" size="md" mb={4} mt={isFormOpen ? 8 : 0} color={headingColor}>Mevcut Duyurular</Heading>
            {loading && announcements.length > 0 && <Center py={5}><Spinner color="brand.400" thickness="2px" speed="0.65s" size="md"/></Center>} 
            
            {!loading && announcements.length === 0 && !error ? (
                <Alert status="info" variant="subtle" borderRadius="md"><AlertIcon as={FaInfoCircle} /> Henüz duyuru eklenmemiş.</Alert>
            ) : !error && announcements.length > 0 ? (
                <TableContainer borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="sm">
                    <Table variant="simple" size="sm">
                        <Thead bg={tableHeaderBg}>
                            <Tr><Th>Başlık</Th><Th>Hedef Kitle</Th><Th>Durum</Th><Th>Yayın/Zamanlama</Th><Th isNumeric>İşlemler</Th></Tr>
                        </Thead>
                        <Tbody>
                            {announcements.map(ann => (
                                <Tr key={ann.id} _hover={{bg: tableRowHoverBg}}>
                                    <Td fontWeight="medium" maxW="300px" whiteSpace="normal">{ann.title}</Td>
                                    <Td>{ann.targetAudience === 'all' ? 'Tüm Kullanıcılar' : ann.targetAudience}</Td>
                                    <Td><Badge colorScheme={ann.isActive ? "green" : "red"} variant="subtle" px={2} py={0.5} borderRadius="md">{ann.isActive ? "Aktif" : "Pasif"}</Badge></Td>
                                    <Td>{ann.scheduledAt ? new Date(ann.scheduledAt).toLocaleString('tr-TR') : "Hemen Yayınlandı"}</Td>
                                    <Td isNumeric>
                                        <Tooltip label="Düzenle" fontSize="xs"><IconButton icon={<FaEdit />} variant="ghost" size="sm" colorScheme="blue" onClick={() => handleEdit(ann)} mr={2}/></Tooltip>
                                        <Tooltip label="Sil" fontSize="xs"><IconButton icon={<FaTrashAlt />} variant="ghost" size="sm" colorScheme="red" onClick={() => openDeleteModal(ann)}/></Tooltip>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </TableContainer>
            ) : null }

             <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
                <ModalOverlay />
                <ModalContent bg={componentBg}>
                    <ModalHeader>Duyuru Silme Onayı</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        "{announcementToDelete?.title}" başlıklı duyuruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onDeleteClose} isDisabled={isSaving}>İptal</Button>
                        <Button colorScheme="red" onClick={handleDelete} isLoading={isSaving} loadingText="Siliniyor...">Sil</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}

export default AnnouncementsManagement;