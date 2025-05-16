import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box, Heading, VStack, HStack, Button, Icon, Center, IconButton,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  FormControl, FormLabel, Input, Textarea, Select, Switch, // Switch eklendi
  useToast, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Spinner, Alert, AlertIcon, Text, Tooltip, Badge, SimpleGrid,
  useColorModeValue, Flex
} from '@chakra-ui/react';
import { FaLightbulb, FaPlus, FaEdit, FaTrashAlt, FaSave, FaTimesCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa'; // FaLightbulb -> FaPlus veya uygun bir ikonla değiştirilebilir.

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const initialFlashcardFormState = {
  frontText: '',
  backText: '',
  topicId: '',
  examClassificationId: '',
  difficulty: 'medium', // Varsayılan zorluk
  source: 'admin_created',
  isActive: true,
};

const difficultyLevels = [
    { value: 'easy', label: 'Kolay' },
    { value: 'medium', label: 'Orta' },
    { value: 'hard', label: 'Zor' },
];

function FlashcardManagement({ token }) {
  const formBorderColor = useColorModeValue("gray.200", "gray.600");
  const [flashcards, setFlashcards] = useState([]);
  const [topics, setTopics] = useState([]);
  const [examClassifications, setExamClassifications] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  const { isOpen: isFormModalOpen, onOpen: onFormModalOpen, onClose: onFormModalCloseOriginal } = useDisclosure();
  const [editingFlashcard, setEditingFlashcard] = useState(null);
  const [formData, setFormData] = useState(initialFlashcardFormState);
  
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
  const [flashcardToDelete, setFlashcardToDelete] = useState(null);
  const toast = useToast();

  // Stil Değişkenleri
  const componentBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const formBg = useColorModeValue('gray.50', 'gray.700');
  const inputSelectBg = useColorModeValue("white", "gray.600");
  const tableHeaderBg = useColorModeValue("gray.100", "gray.750");
  const tableRowHoverBg = useColorModeValue("gray.50", "gray.800");
  const headingColor = useColorModeValue("gray.700", "gray.200");

  const onFormModalClose = () => {
    onFormModalCloseOriginal();
    setEditingFlashcard(null);
    setFormData(initialFlashcardFormState);
  };

  const fetchFlashcards = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_BASE_URL}/api/admin/flashcards`, config);
      setFlashcards(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Flash kartlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchAuxData = useCallback(async () => { // Konu ve Sınav Tiplerini çek
    if (!token) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [topicsRes, ecRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/topics?flat=true`, config), // Tüm konuları düz liste olarak çek (backend'de ?flat=true desteği olmalı)
        axios.get(`${API_BASE_URL}/api/exam-classifications`, config),
      ]);
      setTopics(Array.isArray(topicsRes.data) ? topicsRes.data : []);
      setExamClassifications(Array.isArray(ecRes.data) ? ecRes.data : []);
    } catch (error) {
      console.error("Yardımcı veriler (konular, sınav tipleri) çekilirken hata:", error);
      toast({ title: "Veri Yükleme Hatası", description: "Konu veya sınav türleri yüklenemedi.", status: "warning", duration: 3000 });
    }
  }, [token, toast]);

  useEffect(() => {
    fetchFlashcards();
    fetchAuxData();
  }, [fetchFlashcards, fetchAuxData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' || type === 'switch' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.frontText.trim() || !formData.backText.trim()) {
      toast({ title: "Doğrulama Hatası", description: "Ön yüz ve arka yüz boş olamaz.", status: "error", duration: 4000 });
      return;
    }
    setIsSaving(true);
    const payload = {
      ...formData,
      topicId: formData.topicId ? parseInt(formData.topicId, 10) : null,
      examClassificationId: formData.examClassificationId ? parseInt(formData.examClassificationId, 10) : null,
    };
    const url = editingFlashcard 
      ? `${API_BASE_URL}/api/admin/flashcards/${editingFlashcard.id}` 
      : `${API_BASE_URL}/api/admin/flashcards`;
    const method = editingFlashcard ? 'put' : 'post';

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios[method](url, payload, config);
      toast({ title: "Başarılı", description: `Flash kart ${editingFlashcard ? 'güncellendi' : 'eklendi'}.`, status: "success", duration: 3000 });
      fetchFlashcards();
      onFormModalClose();
    } catch (err) {
      toast({ title: "İşlem Hatası", description: err.response?.data?.message || 'Flash kart kaydedilirken bir hata oluştu.', status: "error", duration: 5000 });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (flashcard) => {
    setEditingFlashcard(flashcard);
    setFormData({ 
      frontText: flashcard.frontText || '',
      backText: flashcard.backText || '',
      topicId: flashcard.topicId ? String(flashcard.topicId) : '',
      examClassificationId: flashcard.examClassificationId ? String(flashcard.examClassificationId) : '',
      difficulty: flashcard.difficulty || 'medium',
      source: flashcard.source || 'admin_created',
      isActive: flashcard.isActive !== undefined ? flashcard.isActive : true,
    });
    onFormModalOpen();
  };
  
  const openDeleteConfirmation = (flashcard) => {
    setFlashcardToDelete(flashcard);
    onDeleteModalOpen();
  };

  const handleDelete = async () => {
    if (!flashcardToDelete) return;
    setIsSaving(true); 
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_BASE_URL}/api/admin/flashcards/${flashcardToDelete.id}`, config);
      toast({ title: "Başarılı", description: "Flash kart silindi.", status: "success", duration: 3000 });
      fetchFlashcards();
      onDeleteModalClose();
    } catch (err) {
      toast({ title: "Silme Hatası", description: err.response?.data?.message || 'Flash kart silinirken bir hata oluştu.', status: "error", duration: 5000 });
    } finally {
      setIsSaving(false);
      setFlashcardToDelete(null);
    }
  };

  if (loading && flashcards.length === 0 && !error) {
    return <Center p={10}><Spinner size="xl" color="brand.500" thickness="3px" /></Center>;
  }

  return (
    <Box p={{base:2, md:4}} borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="lg" bg={componentBg}>
      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={2}>
        <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3} color={headingColor}>
          <Icon as={FaLightbulb} /> Flash Kart Yönetimi {/* FaLightbulb -> FaFileAlt veya FaClone daha uygun olabilir */}
        </Heading>
        <Button 
          colorScheme="teal" 
          leftIcon={<FaPlus />} 
          onClick={() => { setEditingFlashcard(null); setFormData(initialFlashcardFormState); onFormModalOpen();}}
          size="sm"
        >
          Yeni Flash Kart Ekle
        </Button>
      </Flex>

      {error && <Alert status="error" mb={4} borderRadius="md" variant="subtle"><AlertIcon as={FaExclamationTriangle}/>{error}</Alert>}

      {flashcards.length === 0 && !loading && !error ? (
          <Alert status="info" variant="subtle" borderRadius="md" flexDirection="column" alignItems="center" py={10}>
            <AlertIcon as={FaInfoCircle} boxSize="32px"/> 
            <Text mt={3} fontWeight="medium">Henüz flash kart eklenmemiş.</Text>
            <Text fontSize="sm">Yukarıdaki "Yeni Flash Kart Ekle" butonu ile başlayabilirsiniz.</Text>
          </Alert>
      ) : (
        <TableContainer borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="sm">
          <Table variant="simple" size="sm">
            <Thead bg={tableHeaderBg}>
              <Tr>
                <Th>Ön Yüz (Kısaltılmış)</Th>
                <Th>Konu</Th>
                <Th>Sınav Tipi</Th>
                <Th>Zorluk</Th>
                <Th>Durum</Th>
                <Th isNumeric>İşlemler</Th>
              </Tr>
            </Thead>
            <Tbody>
              {flashcards.map(fc => (
                <Tr key={fc.id} _hover={{bg: tableRowHoverBg}}>
                  <Td maxW="200px" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" title={fc.frontText}>
                    {fc.frontText.substring(0,50)}{fc.frontText.length > 50 ? "..." : ""}
                  </Td>
                  <Td>{fc.topic?.name || '-'}</Td>
                  <Td>{fc.examClassification?.name || '-'}</Td>
                  <Td>{difficultyLevels.find(d => d.value === fc.difficulty)?.label || fc.difficulty || '-'}</Td>
                  <Td><Badge colorScheme={fc.isActive ? "green" : "red"} variant="subtle">{fc.isActive ? "Aktif" : "Pasif"}</Badge></Td>
                  <Td isNumeric>
                    <Tooltip label="Düzenle" fontSize="xs"><IconButton icon={<FaEdit />} variant="ghost" size="sm" colorScheme="blue" onClick={() => handleEdit(fc)} mr={1}/></Tooltip>
                    <Tooltip label="Sil" fontSize="xs"><IconButton icon={<FaTrashAlt />} variant="ghost" size="sm" colorScheme="red" onClick={() => openDeleteConfirmation(fc)}/></Tooltip>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      <Modal isOpen={isFormModalOpen} onClose={onFormModalClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent bg={formBg}>
          <ModalHeader borderBottomWidth="1px" borderColor={formBorderColor} color={headingColor}>
            {editingFlashcard ? 'Flash Kartı Düzenle' : 'Yeni Flash Kart Oluştur'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} pt={4}>
            <VStack as="form" id="flashcard-form" onSubmit={handleSubmit} spacing={4}>
              <FormControl isRequired id="fc-frontText">
                <FormLabel fontSize="sm">Ön Yüz İçeriği</FormLabel>
                <Textarea name="frontText" value={formData.frontText} onChange={handleInputChange} rows={4} bg={inputSelectBg} placeholder="Soru, terim veya anahtar kelime..."/>
              </FormControl>
              <FormControl isRequired id="fc-backText">
                <FormLabel fontSize="sm">Arka Yüz İçeriği (Cevap/Açıklama)</FormLabel>
                <Textarea name="backText" value={formData.backText} onChange={handleInputChange} rows={4} bg={inputSelectBg} placeholder="Cevap, tanım veya detaylı açıklama..."/>
              </FormControl>
              <SimpleGrid columns={{base:1, md:2}} spacing={4} w="full">
                <FormControl id="fc-topicId">
                  <FormLabel fontSize="sm">İlişkili Konu (Opsiyonel)</FormLabel>
                  <Select name="topicId" placeholder="Konu Seçin" value={formData.topicId} onChange={handleInputChange} bg={inputSelectBg} isDisabled={topics.length === 0}>
                    {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </FormControl>
                <FormControl id="fc-examClassificationId">
                  <FormLabel fontSize="sm">İlişkili Sınav Tipi (Opsiyonel)</FormLabel>
                  <Select name="examClassificationId" placeholder="Sınav Tipi Seçin" value={formData.examClassificationId} onChange={handleInputChange} bg={inputSelectBg} isDisabled={examClassifications.length === 0}>
                    {examClassifications.map(ec => <option key={ec.id} value={ec.id}>{ec.name}</option>)}
                  </Select>
                </FormControl>
              </SimpleGrid>
              <SimpleGrid columns={{base:1, md:2}} spacing={4} w="full">
                <FormControl id="fc-difficulty">
                  <FormLabel fontSize="sm">Zorluk Seviyesi</FormLabel>
                  <Select name="difficulty" value={formData.difficulty} onChange={handleInputChange} bg={inputSelectBg}>
                    {difficultyLevels.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </Select>
                </FormControl>
                <FormControl display="flex" alignItems="center" id="fc-isActive" pt={8}>
                  <FormLabel htmlFor="fc-isActive-switch" mb="0" fontSize="sm">Aktif mi?</FormLabel>
                  <Switch id="fc-isActive-switch" name="isActive" isChecked={formData.isActive} onChange={handleInputChange} colorScheme="green"/>
                </FormControl>
              </SimpleGrid>
               <FormControl id="fc-source" display="none"> {/* Genellikle admin panelinden eklendiği için gizli olabilir veya otomatik atanabilir */}
                <FormLabel fontSize="sm">Kaynak</FormLabel>
                <Input name="source" value={formData.source} onChange={handleInputChange} bg={inputSelectBg} isDisabled />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor={formBorderColor}>
            <Button variant="ghost" mr={3} onClick={onFormModalClose} leftIcon={<FaTimesCircle/>}>İptal</Button>
            <Button colorScheme="teal" type="submit" form="flashcard-form" leftIcon={<FaSave/>} isLoading={isSaving} loadingText="Kaydediliyor...">
              {editingFlashcard ? 'Güncelle' : 'Kaydet'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={componentBg}>
            <ModalHeader>Flash Kart Silme Onayı</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
                "{flashcardToDelete?.frontText.substring(0,50)}..." ile başlayan flash kartı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve bu kart kullanıcıların tekrar listelerinden de (eğer ilişkiliyse) kaldırılabilir.
            </ModalBody>
            <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onDeleteModalClose} isDisabled={isSaving}>İptal</Button>
                <Button colorScheme="red" onClick={handleDelete} isLoading={isSaving} loadingText="Siliniyor...">Sil</Button>
            </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default FlashcardManagement;
