import React, { useState, useEffect, useCallback, Fragment, useMemo } from 'react';
import axios from 'axios';
import {
    Box, Center, Heading, Flex,
    Spinner, Alert, AlertIcon, useToast, useDisclosure,
    Button, IconButton, Icon,
    Select, FormControl, FormLabel, Input, Textarea,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    VStack, HStack, Text, InputGroup, InputRightElement,
    useColorModeValue, FormErrorMessage
} from '@chakra-ui/react';
import { FaTags, FaUserEdit, FaTrashAlt, FaFolderOpen, FaFileAlt, FaSave, FaTimesCircle, FaPlus } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function TopicManagement({ token }) {
    // Mevcut state'ler...
    const [topics, setTopics] = useState([]);
    const [allTopicsFlat, setAllTopicsFlat] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState(''); // Ana form için hata
    const [editingTopic, setEditingTopic] = useState(null);
    const initialTopicFormState = { name: '', description: '', parentId: '', examClassificationId: '', branchId: '' };
    const [formState, setFormState] = useState(initialTopicFormState);
    const toast = useToast();
    const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
    const [topicToDelete, setTopicToDelete] = useState(null);
    const [examClassifications, setExamClassifications] = useState([]);
    const [branches, setBranches] = useState([]);

    // Yeni Branş Ekleme Modal State'leri
    const { isOpen: isBranchModalOpen, onOpen: onBranchModalOpen, onClose: onBranchModalCloseOriginal } = useDisclosure();
    const [newBranchName, setNewBranchName] = useState('');
    const [newBranchError, setNewBranchError] = useState('');
    const [isAddingBranch, setIsAddingBranch] = useState(false);

    // YENİ: Yeni Konu (Üst Konu/Ana Kategori için) Ekleme Modal State'leri
    const { isOpen: isNewTopicModalOpen, onOpen: onNewTopicModalOpen, onClose: onNewTopicModalCloseOriginal } = useDisclosure();
    const initialNewTopicModalFormState = { name: '', description: '', examClassificationId: ''};
    const [newTopicModalFormData, setNewTopicModalFormData] = useState(initialNewTopicModalFormState);
    const [newTopicModalError, setNewTopicModalError] = useState('');
    const [isAddingNewTopicFromModal, setIsAddingNewTopicFromModal] = useState(false);


    const topicNodeHoverBg = useColorModeValue('gray.50', 'gray.700');
    const topicFormBg = useColorModeValue('blue.50', 'blue.900');
    const topicFormBorder = useColorModeValue('blue.200', 'blue.700');
    const currentComponentColorMode = useColorModeValue('light', 'dark');

    const backendTopicUrl = `${API_BASE_URL}/api/topics`; // backendUrl -> backendTopicUrl
    const examClassificationsUrl = `${API_BASE_URL}/api/exam-classifications`;
    const branchesUrlApi = `${API_BASE_URL}/api/branches`;

    // Modal kapatma fonksiyonlarını sarmalayarak resetleme işlemleri ekleyelim
    const onBranchModalClose = () => {
        onBranchModalCloseOriginal();
        setNewBranchName('');
        setNewBranchError('');
    };
    const onNewTopicModalClose = () => {
        onNewTopicModalCloseOriginal();
        setNewTopicModalFormData(initialNewTopicModalFormState);
        setNewTopicModalError('');
    };


    const flattenTopicsForSelect = useCallback((nodes, list = [], level = 0) => {
        if (!Array.isArray(nodes)) return list;
        nodes.forEach(node => {
            list.push({
                id: node.id,
                name: '\u00A0'.repeat(level * 4) + node.name,
                branchId: node.branchId,
            });
            if (Array.isArray(node.children)) flattenTopicsForSelect(node.children, list, level + 1);
        });
        return list;
    }, []);

    const fetchInitialData = useCallback(async () => {
        if (!token) {
            setError("Yetkilendirme token'ı bulunamadı.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [classificationsRes, branchesRes, topicsRes] = await Promise.all([
                axios.get(examClassificationsUrl, config),
                axios.get(branchesUrlApi, config),
                axios.get(backendTopicUrl, config)
            ]);
            setExamClassifications(Array.isArray(classificationsRes.data) ? classificationsRes.data : []);
            setBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []);
            const treeData = Array.isArray(topicsRes.data) ? topicsRes.data : [];
            setTopics(treeData);
            setAllTopicsFlat(flattenTopicsForSelect(treeData));
        } catch (err) {
            console.error("Başlangıç verileri çekilirken hata:", err);
            const errorMsg = err.response?.data?.message || "Gerekli veriler yüklenirken bir hata oluştu.";
            setError(errorMsg);
            toast({ title: "Veri Yükleme Hatası", description: errorMsg, status: "error", duration: 5000, isClosable: true });
            setExamClassifications([]); setBranches([]); setTopics([]); setAllTopicsFlat([]);
        } finally {
            setLoading(false);
        }
    }, [token, examClassificationsUrl, branchesUrlApi, backendTopicUrl, flattenTopicsForSelect, toast]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };
    // YENİ: Yeni konu modalı için input change handler
    const handleNewTopicModalInputChange = (e) => {
        const { name, value } = e.target;
        setNewTopicModalFormData(prev => ({ ...prev, [name]: value }));
    };


    const parentTopicOptions = useMemo(() => {
        if (!formState.branchId) return [];
        return allTopicsFlat.filter(topic => {
            const matchesBranch = topic.branchId === parseInt(formState.branchId);
            const notSelf = !editingTopic || topic.id !== editingTopic.id;
            // Burada editingTopic'in alt konularını da filtrelemek gerekebilir (şimdilik atlandı)
            return matchesBranch && notSelf;
        });
    }, [formState.branchId, allTopicsFlat, editingTopic]);

    useEffect(() => {
        if (formState.branchId && formState.parentId) {
            const selectedParent = allTopicsFlat.find(t => t.id === parseInt(formState.parentId));
            // Eğer seçili parent artık filtrelenmiş parentTopicOptions içinde değilse (veya branchId uyuşmuyorsa) sıfırla.
            const isValidParent = parentTopicOptions.some(opt => opt.id === parseInt(formState.parentId));
            if ((selectedParent && selectedParent.branchId !== parseInt(formState.branchId)) || !isValidParent && formState.parentId !== '') {
                 setFormState(prev => ({ ...prev, parentId: '' }));
            }
        } else if (!formState.branchId) {
            setFormState(prev => ({ ...prev, parentId: '' }));
        }
    }, [formState.branchId, formState.parentId, allTopicsFlat, parentTopicOptions]); // parentTopicOptions eklendi


    const handleSaveNewBranch = async () => {
        if (!newBranchName.trim()) {
            setNewBranchError("Branş adı boş bırakılamaz."); return;
        }
        setIsAddingBranch(true); setNewBranchError('');
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post(branchesUrlApi, { name: newBranchName.trim() }, config);
            const newBranch = response.data;
            toast({ title: "Başarılı", description: `Branş (${newBranchName}) eklendi.`, status: "success", duration: 3000, isClosable: true });
            await fetchInitialData();
            if (newBranch && newBranch.id) {
                setFormState(prev => ({ ...prev, branchId: String(newBranch.id), parentId: '' }));
            }
            onBranchModalClose(); // Bu fonksiyon artık resetleme yapıyor
        } catch (err) {
            console.error("Yeni branş eklenirken hata:", err);
            const errorMsg = err.response?.data?.message || 'Branş eklenirken bir hata oluştu.';
            setNewBranchError(errorMsg);
            toast({ title: "Branş Ekleme Hatası", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        } finally {
            setIsAddingBranch(false);
        }
    };

    // YENİ: Modal'dan yeni konu (üst konu adayı) kaydetme
    const handleSaveNewTopicFromModal = async () => {
        if (!newTopicModalFormData.name.trim()) {
            setNewTopicModalError("Konu adı boş bırakılamaz."); return;
        }
        if (!formState.branchId) { // Ana formdan branş seçili olmalı
            setNewTopicModalError("Önce ana formdan bir branş seçmelisiniz.");
            toast({ title: "Uyarı", description: "Yeni konu ekleyebilmek için lütfen önce ana formdan bir branş seçin.", status: "warning", duration: 4000, isClosable: true });
            return;
        }
        setIsAddingNewTopicFromModal(true); setNewTopicModalError('');

        const newTopicData = {
            name: newTopicModalFormData.name.trim(),
            description: newTopicModalFormData.description.trim(),
            examClassificationId: newTopicModalFormData.examClassificationId === '' ? null : parseInt(newTopicModalFormData.examClassificationId, 10),
            branchId: parseInt(formState.branchId), // Ana formdan alınan branchId
            // Yeni konunun parent'ı, ana formdaki parentId seçimi olacak.
            // Eğer ana formda "Ana Kategori / Üst Konu Yok" seçiliyse, bu yeni konu da bir ana kategori olacak.
            parentId: formState.parentId === '' ? null : parseInt(formState.parentId, 10)
        };

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post(backendTopicUrl, newTopicData, config);
            const createdTopic = response.data; // Backend'in oluşturulan konuyu ID ile döndürdüğünü varsayalım

            toast({ title: "Başarılı", description: `Konu (${newTopicData.name}) eklendi.`, status: "success", duration: 3000, isClosable: true });
            await fetchInitialData(); // Tüm listeleri yenile

            if (createdTopic && createdTopic.id) {
                // Ana formdaki "Üst Konu" seçeneğini bu yeni oluşturulan konuyla güncelle
                setFormState(prev => ({ ...prev, parentId: String(createdTopic.id) }));
            }
            onNewTopicModalClose(); // Bu fonksiyon artık resetleme yapıyor
        } catch (err) {
            console.error("Modal'dan yeni konu eklenirken hata:", err);
            const errorMsg = err.response?.data?.message || 'Konu eklenirken bir hata oluştu.';
            setNewTopicModalError(errorMsg);
            toast({ title: "Konu Ekleme Hatası", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        } finally {
            setIsAddingNewTopicFromModal(false);
        }
    };


    const handleFormSubmit = async (e) => {
        e.preventDefault(); setFormError('');
        // ... (handleFormSubmit içeriği aynı kalıyor, sadece refresh için fetchInitialData kullanıyor)
        const config = { headers: { Authorization: `Bearer ${token}` } };
        if (!formState.name.trim()) { setFormError("Konu adı boş bırakılamaz."); return; }
        if (!formState.branchId) {
            setFormError("Lütfen konu için bir branş seçin.");
            return;
        }
        const topicData = {
            name: formState.name.trim(),
            description: formState.description.trim(),
            parentId: formState.parentId === '' ? null : parseInt(formState.parentId, 10),
            examClassificationId: formState.examClassificationId === '' ? null : parseInt(formState.examClassificationId, 10),
            branchId: parseInt(formState.branchId, 10)
        };
        try {
            let message = '';
            if (editingTopic) {
                await axios.put(`${backendTopicUrl}/${editingTopic.id}`, topicData, config);
                message = 'Konu başarıyla güncellendi!';
            } else {
                await axios.post(backendTopicUrl, topicData, config);
                message = 'Konu başarıyla eklendi!';
            }
            resetForm();
            await fetchInitialData();
            toast({ title: "Başarılı", description: message, status: "success", duration: 3000, isClosable: true });
        } catch (err) {
            console.error("Konu kaydedilirken hata:", err);
            const errorMsg = err.response?.data?.message || 'Konu kaydedilirken bir hata oluştu.';
            setFormError(errorMsg);
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        }
    };

    const handleEdit = (topic) => {
        const { children, ...topicDataToEdit } = topic;
        setEditingTopic(topicDataToEdit);
        setFormState({
            name: topicDataToEdit.name || '',
            description: topicDataToEdit.description || '',
            parentId: topicDataToEdit.parentId === null ? '' : String(topicDataToEdit.parentId),
            examClassificationId: topicDataToEdit.examClassificationId === null ? '' : String(topicDataToEdit.examClassificationId),
            branchId: topicDataToEdit.branchId === null ? '' : String(topicDataToEdit.branchId)
        });
        setFormError('');
        document.getElementById('topic-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const openDeleteConfirmation = (topic) => { setTopicToDelete(topic); onDeleteConfirmOpen(); };

    const handleDeleteConfirm = async () => {
        if (!topicToDelete) return;
        onDeleteConfirmClose();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`${backendTopicUrl}/${topicToDelete.id}`, config);
            toast({ title: "Başarılı", description: `Konu (${topicToDelete.name}) silindi.`, status: "success", duration: 3000, isClosable: true });
            await fetchInitialData();
            if(editingTopic && editingTopic.id === topicToDelete.id) resetForm();
        } catch (err) {
            console.error("Konu silinirken hata:", err);
            const errorMsg = err.response?.data?.message || 'Konu silinirken bir hata oluştu.';
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        } finally { setTopicToDelete(null); }
    };

    const resetForm = () => { setEditingTopic(null); setFormState(initialTopicFormState); setFormError(''); };

    const TopicNode = ({ topic, level = 0, nodeBg }) => (
        <Flex /* ... (TopicNode aynı) ... */ >
            <HStack spacing={3} flex={1} minW={0}>
                <Icon as={Array.isArray(topic.children) && topic.children.length > 0 ? FaFolderOpen : FaFileAlt} color="textMuted" />
                <Text isTruncated title={topic.name}>
                    [{topic.id}] {topic.name}
                    {topic.examClassificationId && examClassifications.find(ec => ec.id === topic.examClassificationId) &&
                        <Text as="span" fontSize="xs" color="gray.500" ml={2}>
                            (Sınav: {examClassifications.find(ec => ec.id === topic.examClassificationId).name})
                        </Text>
                    }
                    {topic.branchId && branches.find(b => b.id === topic.branchId) &&
                        <Text as="span" fontSize="xs" color="purple.500" ml={2}>
                            [Branş: {branches.find(b => b.id === topic.branchId).name}]
                        </Text>
                    }
                </Text>
            </HStack>
            <HStack spacing={1}>
                <IconButton icon={<Icon as={FaUserEdit} />} size="xs" variant="ghost" colorScheme="blue" onClick={() => handleEdit(topic)} aria-label="Düzenle" title="Düzenle" />
                <IconButton icon={<Icon as={FaTrashAlt} />} size="xs" variant="ghost" colorScheme="red" onClick={() => openDeleteConfirmation(topic)} aria-label="Sil" title="Sil" />
            </HStack>
        </Flex>
    );

    const renderTopics = useCallback((topicsToRender, level = 0, currentCM) => {
        // ... (renderTopics aynı) ...
        if (!Array.isArray(topicsToRender)) return null;
        const calculateNodeBg = (lvl) => {
            if (lvl === 0) return 'transparent';
            const baseValue = currentCM === 'light' ? 50 : 800;
            const increment = currentCM === 'light' ? 30 : -30;
            let shade = baseValue + (lvl -1) * increment;
            shade = Math.max(50, Math.min(900, shade));
            shade = Math.round(shade / 10) * 10;
            shade = Math.max(50, shade);
            return `gray.${shade}`;
        };
        return topicsToRender.map(topic => {
            const nodeBg = calculateNodeBg(level);
            return (
                <Fragment key={topic.id}>
                    <TopicNode topic={topic} level={level} nodeBg={nodeBg} />
                    {Array.isArray(topic.children) && topic.children.length > 0 && (
                        renderTopics(topic.children, level + 1, currentCM)
                    )}
                </Fragment>
            );
        });
    }, [examClassifications, branches, topicNodeHoverBg, handleEdit, openDeleteConfirmation]);


    if (loading) return <Center p={10}><Spinner size="xl" color="brand.500" /></Center>;

    return (
        <Box>
            <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3} mb={6}>
                <Icon as={FaTags} /> Konu, Kategori ve Branş Yönetimi
            </Heading>

            {error && ( <Alert status="error" variant="subtle" borderRadius="md" mb={4}> <AlertIcon /> {error} </Alert> )}

            <Box id="topic-form-section" as="form" onSubmit={handleFormSubmit} p={6} borderWidth="1px" borderRadius="lg" borderColor={topicFormBorder} bg={topicFormBg} mb={8}>
                <Heading as="h4" size="md" mb={5}>{editingTopic ? `Konu Düzenle (ID: ${editingTopic.id})` : 'Yeni Konu Ekle'}</Heading>
                {formError && <Alert status="warning" variant="subtle" borderRadius="md" mb={4}><AlertIcon />{formError}</Alert>}
                <VStack spacing={4}>
                    {/* Konu Adı Input */}
                    <FormControl isRequired isInvalid={!!formError && formError.includes('Konu adı')}>
                        <FormLabel fontSize="sm">Konu Adı:</FormLabel>
                        <Input name="name" value={formState.name} onChange={handleInputChange} />
                        {!!formError && formError.includes('Konu adı') && <FormErrorMessage>{formError}</FormErrorMessage>}
                    </FormControl>

                    {/* Branş Select + Ekle Butonu */}
                    <FormControl isRequired isInvalid={!!formError && formError.includes('branş seçin')}>
                        <FormLabel fontSize="sm">Branş:</FormLabel>
                        <InputGroup>
                            <Select name="branchId" value={formState.branchId} onChange={handleInputChange} placeholder="-- Branş Seçin --" >
                                {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
                            </Select>
                            <InputRightElement width="3rem">
                                <IconButton h="1.75rem" size="sm" onClick={onBranchModalOpen} icon={<FaPlus />} aria-label="Yeni Branş Ekle" title="Yeni Branş Ekle"/>
                            </InputRightElement>
                        </InputGroup>
                        {!!formError && formError.includes('branş seçin') && <FormErrorMessage>Lütfen bir branş seçin.</FormErrorMessage>}
                    </FormControl>

                    {/* Üst Konu Select + Ekle Butonu */}
                    <FormControl>
                        <FormLabel fontSize="sm">Üst Konu:</FormLabel>
                         <InputGroup>
                            <Select
                                name="parentId"
                                value={formState.parentId}
                                onChange={handleInputChange}
                                placeholder="-- Ana Kategori / Üst Konu Yok --"
                                isDisabled={!formState.branchId}
                            >
                                {parentTopicOptions.map(o => (<option key={o.id} value={o.id}>{o.name}</option>))}
                            </Select>
                            <InputRightElement width="3rem">
                                <IconButton 
                                    h="1.75rem" 
                                    size="sm" 
                                    onClick={onNewTopicModalOpen} 
                                    icon={<FaPlus />}
                                    aria-label="Yeni Üst Konu/Ana Kategori Ekle"
                                    title="Yeni Üst Konu/Ana Kategori Ekle"
                                    isDisabled={!formState.branchId} // Branş seçilmeden yeni konu eklenemez
                                />
                            </InputRightElement>
                        </InputGroup>
                         {!formState.branchId && <Text fontSize="xs" color="textMuted" mt={1}>Üst konu veya yeni konu ekleyebilmek için önce branş seçmelisiniz.</Text>}
                    </FormControl>
                    
                    {/* Sınav Sınıflandırması Select */}
                    <FormControl>
                        <FormLabel fontSize="sm">Sınav Sınıflandırması (Opsiyonel):</FormLabel>
                        <Select name="examClassificationId" value={formState.examClassificationId} onChange={handleInputChange} placeholder="-- Sınıflandırma Seçin --">
                            {examClassifications.map(ec => (<option key={ec.id} value={ec.id}>{ec.name}</option>))}
                        </Select>
                    </FormControl>

                    {/* Açıklama Textarea */}
                    <FormControl>
                        <FormLabel fontSize="sm">Açıklama (Opsiyonel):</FormLabel>
                        <Textarea name="description" value={formState.description} onChange={handleInputChange} rows={3} />
                    </FormControl>

                    {/* Kaydet/İptal Butonları */}
                    <HStack spacing={3} mt={5} alignSelf="flex-start">
                        <Button type="submit" colorScheme="blue" leftIcon={<Icon as={FaSave}/>} isLoading={isAddingBranch || isAddingNewTopicFromModal || loading /* genel yükleme durumu */}>
                            {editingTopic ? 'Güncelle' : 'Ekle'}
                        </Button>
                        {editingTopic && (
                            <Button variant="ghost" onClick={resetForm} leftIcon={<Icon as={FaTimesCircle}/>}>İptal</Button>
                        )}
                    </HStack>
                </VStack>
            </Box>

            {/* Yeni Branş Ekleme Modalı (Aynı) */}
            <Modal isOpen={isBranchModalOpen} onClose={onBranchModalClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Yeni Branş Ekle</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <FormControl isInvalid={!!newBranchError}>
                            <FormLabel>Branş Adı:</FormLabel>
                            <Input value={newBranchName} onChange={(e) => { setNewBranchName(e.target.value); setNewBranchError('');}} placeholder="Örn: Kardiyoloji"/>
                            {newBranchError && <FormErrorMessage>{newBranchError}</FormErrorMessage>}
                        </FormControl>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant='ghost' mr={3} onClick={onBranchModalClose}>İptal</Button>
                        <Button colorScheme='blue' onClick={handleSaveNewBranch} isLoading={isAddingBranch}>Kaydet</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* YENİ: Yeni Konu (Üst Konu/Ana Kategori için) Ekleme Modalı */}
            <Modal isOpen={isNewTopicModalOpen} onClose={onNewTopicModalClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Yeni Konu Ekle (Üst Konu/Ana Kategori)</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4}>
                            <Text fontSize="sm" color="textMuted" w="full">
                                Bu konu, ana formda seçili olan branşa ({branches.find(b=>b.id === parseInt(formState.branchId))?.name || 'N/A'}) eklenecektir.
                                {formState.parentId && allTopicsFlat.find(t=>t.id === parseInt(formState.parentId)) ? 
                                ` Üst konusu: "${allTopicsFlat.find(t=>t.id === parseInt(formState.parentId)).name}" olacaktır.` : 
                                ' Bu bir ana kategori olarak eklenecektir.'}
                            </Text>
                            <FormControl isRequired isInvalid={!!newTopicModalError && newTopicModalError.includes('Konu adı')}>
                                <FormLabel>Yeni Konu Adı:</FormLabel>
                                <Input name="name" value={newTopicModalFormData.name} onChange={handleNewTopicModalInputChange} placeholder="Yeni konu adı"/>
                                {!!newTopicModalError && newTopicModalError.includes('Konu adı') && <FormErrorMessage>{newTopicModalError}</FormErrorMessage>}
                            </FormControl>
                            <FormControl>
                                <FormLabel>Açıklama (Opsiyonel):</FormLabel>
                                <Textarea name="description" value={newTopicModalFormData.description} onChange={handleNewTopicModalInputChange} placeholder="Açıklama"/>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Sınav Sınıflandırması (Opsiyonel):</FormLabel>
                                <Select name="examClassificationId" value={newTopicModalFormData.examClassificationId} onChange={handleNewTopicModalInputChange} placeholder="-- Sınıflandırma Seçin --">
                                    {examClassifications.map(ec => (<option key={ec.id} value={ec.id}>{ec.name}</option>))}
                                </Select>
                            </FormControl>
                            {!!newTopicModalError && !newTopicModalError.includes('Konu adı') && <Alert status="error" size="sm"><AlertIcon/>{newTopicModalError}</Alert>}
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant='ghost' mr={3} onClick={onNewTopicModalClose}>İptal</Button>
                        <Button colorScheme='blue' onClick={handleSaveNewTopicFromModal} isLoading={isAddingNewTopicFromModal}>Kaydet</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Mevcut Konular Listesi (Aynı) */}
            <Heading as="h4" size="md" mb={4}>Mevcut Konular (Hiyerarşik)</Heading>
            {/* ... (listenin geri kalanı aynı) ... */}
            {topics.length === 0 && !loading && !error ? ( 
                <Alert status="info" variant="subtle" borderRadius="md"> <AlertIcon /> Konu bulunamadı. </Alert>
            ) : (
                <Box borderWidth="1px" borderRadius="md" borderColor="borderSecondary" bg="bgPrimary" maxH="500px" overflowY="auto">
                    {renderTopics(topics, 0, currentComponentColorMode)}
                </Box>
            )}

            {/* Silme Onay Modalı (Aynı) */}
            <Modal isOpen={isDeleteConfirmOpen} onClose={onDeleteConfirmClose} isCentered>
                {/* ... (içerik aynı) ... */}
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Konu Silme Onayı</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        Konuyu ({topicToDelete?.name} - ID: {topicToDelete?.id}) ve altındaki tüm alt konuları, dersleri, soruları silmek istediğinizden emin misiniz?
                        <Text fontWeight="bold" color="red.500" mt={2}>Bu işlem geri alınamaz!</Text>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant='ghost' mr={3} onClick={onDeleteConfirmClose}>İptal</Button>
                        <Button colorScheme='red' onClick={handleDeleteConfirm}> Sil </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}

export default TopicManagement;