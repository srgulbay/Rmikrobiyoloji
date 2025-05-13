// src/components/admin/ExamSimulationManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    Box, Heading, VStack, HStack, Button, Icon,
    Table, Thead, Tbody, Tr, Th, Td, TableContainer,
    FormControl, FormLabel, Input, Textarea, Select, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
    useToast, useDisclosure,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    Spinner, Alert, AlertIcon, Text, Tooltip, Tag, SimpleGrid, Checkbox, Badge,
    useColorModeValue, Flex,
    Center
} from '@chakra-ui/react';
import { FaFileContract, FaPlus, FaEdit, FaTrashAlt, FaSave, FaTimesCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Beklenen Backend API Endpoint'leri:
// GET /api/admin/exam-simulations -> [{ id, title, description, durationMinutes, status, examClassificationId, branchId, questionIds: [1,2,3] (veya questions: [{id, text},...]) }]
// POST /api/admin/exam-simulations -> Gövde: { title, description, durationMinutes, status, examClassificationId, branchId?, questionIds: [] } -> Döner: Oluşturulan sınav objesi
// PUT /api/admin/exam-simulations/:id -> Gövde: Güncellenecek alanlar -> Döner: Güncellenmiş sınav objesi
// DELETE /api/admin/exam-simulations/:id -> Status 200/204
// GET /api/exam-classifications -> [{ id, name }]
// GET /api/branches -> [{ id, name }]
// GET /api/questions?limit=10000&basic=true -> [{ id, text, ... (diğer temel bilgiler) }] (Soru seçici için optimize edilmiş)


const examStatuses = [
    { value: 'draft', label: 'Taslak', color: 'gray' },
    { value: 'active', label: 'Aktif', color: 'green' },
    { value: 'archived', label: 'Arşivlendi', color: 'purple' },
];

function ExamSimulationManagement({ token }) {
    // State Hooks
    const [simulations, setSimulations] = useState([]);
    const [examClassifications, setExamClassifications] = useState([]);
    const [branches, setBranches] = useState([]);
    const [allQuestions, setAllQuestions] = useState([]); // Soru seçici için
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [editingSimulation, setEditingSimulation] = useState(null);
    const initialFormState = { 
        title: '', description: '', durationMinutes: 120, 
        status: 'draft', examClassificationId: '', branchId: '',
        questionIds: []
    };
    const [formData, setFormData] = useState(initialFormState);
    const [questionSearchTerm, setQuestionSearchTerm] = useState('');
    const [simulationToDelete, setSimulationToDelete] = useState(null);

    // Chakra UI Hooks
    const toast = useToast();
    const { isOpen: isFormModalOpen, onOpen: onFormModalOpen, onClose: onFormModalCloseOriginal } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    
    // Style Hooks
    const formBg = useColorModeValue('teal.50', 'teal.900');
    const formBorderColor = useColorModeValue('teal.200', 'teal.700');
    const tableHeaderBg = useColorModeValue("gray.100", "gray.750");
    const tableRowHoverBg = useColorModeValue("gray.50", "gray.800");
    const inputSelectBg = useColorModeValue("white", "gray.700");
    const questionPickerBg = useColorModeValue("gray.50", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const componentBg = useColorModeValue("white", "gray.800");
    const headingColor = useColorModeValue("gray.700", "gray.200");
    const textColorMuted = useColorModeValue("gray.500", "gray.400");

    const onFormModalClose = () => {
        onFormModalCloseOriginal();
        setEditingSimulation(null);
        setFormData(initialFormState);
        setQuestionSearchTerm('');
    };

    const fetchInitialData = useCallback(async () => {
        setLoading(true); setError('');
        if (!token) { 
            setError("Yetkilendirme token'ı bulunamadı."); // Token yoksa hata ayarla
            setLoading(false); 
            return; 
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [simRes, ecRes, branchRes, questionsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/admin/exam-simulations`, config),
                axios.get(`${API_BASE_URL}/api/exam-classifications`, config),
                axios.get(`${API_BASE_URL}/api/branches`, config),
                axios.get(`${API_BASE_URL}/api/questions?limit=10000&basic=true`, config)
            ]);
            setSimulations(Array.isArray(simRes.data) ? simRes.data : []);
            setExamClassifications(Array.isArray(ecRes.data) ? ecRes.data : []);
            setBranches(Array.isArray(branchRes.data) ? branchRes.data : []);
            setAllQuestions(Array.isArray(questionsRes.data) ? questionsRes.data : []);
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Veriler yüklenirken bir hata oluştu.';
            setError(errorMsg); // Hata state'ini ayarla
            // toast({ title: "Veri Yükleme Hatası", description: errorMsg, status: "error", duration: 3000, isClosable: true }); // Bu toast yerine Alert ile gösterim daha iyi
        } finally { setLoading(false); }
    }, [token]); // toast bağımlılıktan çıkarıldı, API URL'leri sabit

    useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleNumberInputChange = (name, valueAsString, valueAsNumber) => {
        setFormData(prev => ({ ...prev, [name]: valueAsNumber }));
    };
    const handleQuestionSelection = (questionId) => {
        setFormData(prev => {
            const newQuestionIds = prev.questionIds.includes(questionId)
                ? prev.questionIds.filter(id => id !== questionId)
                : [...prev.questionIds, questionId];
            return { ...prev, questionIds: newQuestionIds };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.examClassificationId) {
            toast({ title: "Doğrulama Hatası", description: "Başlık ve Sınav Tipi zorunludur.", status: "error", duration: 4000, isClosable: true });
            return;
        }
        setIsSaving(true);
        const payload = { 
            title: formData.title.trim(),
            description: formData.description.trim(),
            durationMinutes: parseInt(formData.durationMinutes, 10),
            status: formData.status,
            examClassificationId: parseInt(formData.examClassificationId, 10),
            branchId: formData.branchId ? parseInt(formData.branchId, 10) : null,
            questionIds: formData.questionIds 
        };

        const url = editingSimulation 
            ? `${API_BASE_URL}/api/admin/exam-simulations/${editingSimulation.id}` 
            : `${API_BASE_URL}/api/admin/exam-simulations`;
        const method = editingSimulation ? 'put' : 'post';

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios[method](url, payload, config);
            toast({ title: "Başarılı", description: `Deneme sınavı ${editingSimulation ? 'güncellendi' : 'oluşturuldu'}.`, status: "success", duration: 3000, isClosable: true });
            fetchInitialData(); // Veriyi yenile
            onFormModalClose(); // Modalı kapat
        } catch (err) {
            toast({ title: "İşlem Hatası", description: err.response?.data?.message || 'İşlem sırasında hata.', status: "error", duration: 5000, isClosable: true });
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (sim) => {
        setEditingSimulation(sim);
        setFormData({
            title: sim.title || '',
            description: sim.description || '',
            durationMinutes: sim.durationMinutes || 120,
            status: sim.status || 'draft',
            examClassificationId: sim.examClassificationId ? String(sim.examClassificationId) : '',
            branchId: sim.branchId ? String(sim.branchId) : '',
            questionIds: Array.isArray(sim.questions) 
                ? sim.questions.map(q => q.id) 
                : (Array.isArray(sim.questionIds) ? sim.questionIds : [])
        });
        onFormModalOpen();
    };

    const openDeleteModal = (sim) => { setSimulationToDelete(sim); onDeleteOpen(); };
    const handleDelete = async () => {
        if (!simulationToDelete) return;
        setIsSaving(true);
        try {
            await axios.delete(`${API_BASE_URL}/api/admin/exam-simulations/${simulationToDelete.id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast({ title: "Başarılı", description: "Deneme sınavı silindi.", status: "success", duration: 3000, isClosable: true });
            fetchInitialData(); // Veriyi yenile
            onDeleteClose(); // Modalı kapat
        } catch (err) {
            toast({ title: "Silme Hatası", description: err.response?.data?.message || 'Silme işlemi sırasında hata.', status: "error", duration: 5000, isClosable: true });
        } finally {
            setIsSaving(false);
            setSimulationToDelete(null);
        }
    };
    
    const getStatusTag = (statusValue) => {
        const statusObj = examStatuses.find(s => s.value === statusValue);
        return statusObj ? <Badge colorScheme={statusObj.color} variant="subtle" px={2} py={0.5} borderRadius="md">{statusObj.label}</Badge> : <Badge>{statusValue}</Badge>;
    };
    
    const filteredQuestionsForPicker = useMemo(() => {
        if (!allQuestions) return [];
        if (!questionSearchTerm.trim()) return allQuestions.slice(0, 200);
        const lowerSearchTerm = questionSearchTerm.toLowerCase();
        return allQuestions.filter(q => 
            (q.text && q.text.toLowerCase().includes(lowerSearchTerm)) ||
            String(q.id).includes(questionSearchTerm)
        ).slice(0, 200);
    }, [allQuestions, questionSearchTerm]);


    if (loading) return <Center p={10}><Spinner size="xl" color="brand.500" thickness="3px" /></Center>;

    return (
        <Box p={4} borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="lg" bg={componentBg}>
            <Flex justify="space-between" align="center" mb={6}>
                <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3} color={headingColor}>
                    <Icon as={FaFileContract} /> Deneme Sınavı Yönetimi
                </Heading>
                <Button 
                    colorScheme="teal" 
                    leftIcon={<FaPlus />} 
                    onClick={() => { setEditingSimulation(null); setFormData(initialFormState); onFormModalOpen();}}
                    size="sm"
                >
                    Yeni Deneme Sınavı
                </Button>
            </Flex>

            {error && <Alert status="error" mb={4} borderRadius="md" variant="subtle"><AlertIcon as={FaExclamationTriangle}/>{error}</Alert>}

            {simulations.length === 0 && !loading ? (
                <Alert status="info" variant="subtle" borderRadius="md"><AlertIcon as={FaInfoCircle} /> Henüz deneme sınavı oluşturulmamış.</Alert>
            ) : (
            <TableContainer borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="sm">
                <Table variant="simple" size="sm">
                    <Thead bg={tableHeaderBg}>
                        <Tr><Th>ID</Th><Th>Başlık</Th><Th>Sınav Tipi</Th><Th>Branş</Th><Th>Soru Sayısı</Th><Th>Süre</Th><Th>Durum</Th><Th isNumeric>İşlemler</Th></Tr>
                    </Thead>
                    <Tbody>
                        {simulations.map(sim => (
                            <Tr key={sim.id} _hover={{bg: tableRowHoverBg}}>
                                <Td>{sim.id}</Td>
                                <Td fontWeight="medium" maxW="250px" whiteSpace="normal">{sim.title}</Td>
                                <Td>{examClassifications.find(ec => ec.id === sim.examClassificationId)?.name || '-'}</Td>
                                <Td>{branches.find(b => b.id === sim.branchId)?.name || 'Tüm Branşlar'}</Td>
                                <Td textAlign="center">{sim.questionIds?.length || (Array.isArray(sim.questions) ? sim.questions.length : 0)}</Td>
                                <Td textAlign="center">{sim.durationMinutes} dk</Td>
                                <Td>{getStatusTag(sim.status)}</Td>
                                <Td isNumeric>
                                    <Tooltip label="Düzenle" fontSize="xs"><IconButton icon={<FaEdit />} variant="ghost" size="sm" colorScheme="blue" onClick={() => handleEdit(sim)} mr={2}/></Tooltip>
                                    <Tooltip label="Sil" fontSize="xs"><IconButton icon={<FaTrashAlt />} variant="ghost" size="sm" colorScheme="red" onClick={() => openDeleteModal(sim)}/></Tooltip>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </TableContainer>
            )}

            <Modal isOpen={isFormModalOpen} onClose={onFormModalClose} size="3xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent bg={componentBg}>
                    <ModalHeader>{editingSimulation ? 'Deneme Sınavını Düzenle' : 'Yeni Deneme Sınavı Oluştur'}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack as="form" id="exam-sim-form" onSubmit={handleSubmit} spacing={5}>
                            <FormControl isRequired id="sim-title-modal">
                                <FormLabel fontSize="sm">Sınav Başlığı</FormLabel>
                                <Input name="title" value={formData.title} onChange={handleInputChange} bg={inputSelectBg} />
                            </FormControl>
                            <FormControl id="sim-description-modal">
                                <FormLabel fontSize="sm">Açıklama</FormLabel>
                                <Textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} bg={inputSelectBg}/>
                            </FormControl>
                            <SimpleGrid columns={{base:1, md:2}} spacing={4} w="full">
                                <FormControl isRequired id="sim-ec-modal">
                                    <FormLabel fontSize="sm">Sınav Tipi</FormLabel>
                                    <Select name="examClassificationId" placeholder="Sınav Tipi Seçin" value={formData.examClassificationId} onChange={handleInputChange} bg={inputSelectBg}>
                                        {examClassifications.map(ec => <option key={ec.id} value={ec.id}>{ec.name}</option>)}
                                    </Select>
                                </FormControl>
                                <FormControl id="sim-branch-modal">
                                    <FormLabel fontSize="sm">Branş (Opsiyonel)</FormLabel>
                                    <Select name="branchId" placeholder="Tüm Branşlar (Genel Sınav)" value={formData.branchId} onChange={handleInputChange} bg={inputSelectBg}>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </Select>
                                </FormControl>
                            </SimpleGrid>
                             <SimpleGrid columns={2} spacing={4} w="full">
                                <FormControl isRequired id="sim-duration-modal">
                                    <FormLabel fontSize="sm">Süre (Dakika)</FormLabel>
                                    <NumberInput 
                                        name="durationMinutes" 
                                        value={formData.durationMinutes} 
                                        onChange={(valStr, valNum) => handleNumberInputChange("durationMinutes", valStr, valNum)} 
                                        min={10}
                                    >
                                        <NumberInputField bg={inputSelectBg} />
                                        <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                                    </NumberInput>
                                </FormControl>
                                <FormControl isRequired id="sim-status-modal">
                                    <FormLabel fontSize="sm">Durum</FormLabel>
                                    <Select name="status" value={formData.status} onChange={handleInputChange} bg={inputSelectBg}>
                                        {examStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </Select>
                                </FormControl>
                            </SimpleGrid>

                            <FormControl id="sim-questions-modal">
                                <FormLabel fontSize="sm">Sorular (Seçilen: {formData.questionIds.length})</FormLabel>
                                <Input placeholder="Soru metni veya ID ile ara..." value={questionSearchTerm} onChange={(e) => setQuestionSearchTerm(e.target.value)} mb={2} bg={inputSelectBg}/>
                                <Box borderWidth="1px" borderRadius="md" p={3} maxHeight="300px" overflowY="auto" bg={questionPickerBg} borderColor={borderColor}>
                                    {filteredQuestionsForPicker.length > 0 ? (
                                        <VStack align="stretch" spacing={1}>
                                            {filteredQuestionsForPicker.map(q => (
                                                <Checkbox 
                                                    key={q.id} 
                                                    isChecked={formData.questionIds.includes(q.id)}
                                                    onChange={() => handleQuestionSelection(q.id)}
                                                    size="sm"
                                                >
                                                   <Text fontSize="xs" noOfLines={1} title={q.text || `Soru ID: ${q.id}`}> (ID: {q.id}) {(q.text || "").substring(0,100)}...</Text>
                                                </Checkbox>
                                            ))}
                                        </VStack>
                                    ) : <Text fontSize="sm" color={textColorMuted}>Arama kriterine uygun soru bulunamadı veya soru havuzu boş/yüklenemedi.</Text>}
                                </Box>
                                <Text fontSize="xs" color={textColorMuted} mt={1}>Not: Performans için arama sonuçları ve ilk liste 200 soru ile sınırlıdır.</Text>
                            </FormControl>

                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onFormModalClose}>İptal</Button>
                        <Button colorScheme="teal" type="submit" form="exam-sim-form" leftIcon={<FaSave/>} isLoading={isSaving} loadingText="Kaydediliyor...">Kaydet</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

             <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
                <ModalOverlay />
                <ModalContent bg={componentBg}>
                    <ModalHeader>Deneme Sınavı Silme Onayı</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        "{simulationToDelete?.title}" başlıklı deneme sınavını silmek istediğinizden emin misiniz? Bu işlem, sınavla ilişkili kullanıcı sonuçlarını etkileyebilir.
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

export default ExamSimulationManagement;