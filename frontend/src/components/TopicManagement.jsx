import React, { useState, useEffect, useCallback, Fragment, useMemo, useRef } from 'react';
import axios from 'axios';
import {
    Box, Center, Heading, Flex,
    Spinner, Alert, AlertIcon, useToast, useDisclosure,
    Button, IconButton, Icon,
    Select, FormControl, FormLabel, Input, Textarea,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    VStack, HStack, Text, InputGroup, InputRightElement,
    useColorModeValue, FormErrorMessage, Tooltip, SimpleGrid, Tag
} from '@chakra-ui/react';
import { FaTags, FaEdit, FaTrashAlt, FaFolderOpen, FaFileAlt, FaSave, FaTimesCircle, FaPlus, FaSitemap, FaLevelDownAlt, FaBook, FaBuilding, FaExclamationTriangle } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Bu helper fonksiyon eğer TopicNode içinde aktif olarak kullanılmayacaksa kaldırılabilir.
// Şu anki TopicNode implementasyonunda direkt kullanılmıyor.
// const findTopicByIdRecursiveHelper = (nodes, targetId) => {
//     for (const node of nodes) {
//         if (node.id === targetId) return node;
//         if (node.children) {
//             const found = findTopicByIdRecursiveHelper(node.children, targetId);
//             if (found) return found;
//         }
//     }
//     return null;
// };

function TopicNode({ topic, level = 0, onEdit, onAddSubTopic, onDelete }) {
    const hasChildren = Array.isArray(topic.children) && topic.children.length > 0;
    const NodeIcon = hasChildren ? FaFolderOpen : FaFileAlt;

    // Stil Hook'ları TopicNode içinde en üste taşındı
    const nodeHoverBg = useColorModeValue('gray.100', 'gray.700');
    const nodeBorderColor = useColorModeValue('gray.200', 'gray.600');
    const nodeTextColor = useColorModeValue('gray.800', 'gray.100');
    const nodeEvenBg = useColorModeValue("gray.50", "gray.800");
    const nodeOddBg = "transparent";
    const nodeIconColor = useColorModeValue('blue.500', 'blue.300');
    const actionIconColor = useColorModeValue('gray.600', 'gray.400');

    // examClassifications ve branches verisi TopicManagement'tan prop olarak gelmeli
    // Veya bu bilgiler topic objesine backend'den eklenmeli. Şimdilik topic.examClassificationName vb. varsayıyoruz.
    // Bu örnekte, bu bilgiler TopicManagement'taki map'lerden alınacak gibi davranılacak.

    return (
        <Flex
            alignItems="center" p={2} pl={level * 6 + 2}
            bg={level % 2 === 0 ? nodeEvenBg : nodeOddBg}
            _hover={{ bg: nodeHoverBg }} borderBottomWidth="1px" borderColor={nodeBorderColor}
        >
            <HStack spacing={2} flex={1} minW={0} alignItems="center">
                <Icon as={NodeIcon} color={nodeIconColor} mr={2}/>
                <Text isTruncated title={topic.name} fontWeight={level === 0 ? "semibold" : "normal"} color={nodeTextColor}>
                    {topic.name}
                    <Text as="span" fontSize="xs" color="textMuted" ml={1}> (ID: {topic.id})</Text>
                </Text>
                {/* Sınav Tipi ve Branş bilgisi için Tag'ler (opsiyonel, eğer topic objesinde varsa) */}
                {topic.examClassificationName && <Tag size="xs" colorScheme="green" variant="subtle">{topic.examClassificationName}</Tag>}
                {topic.branchName && <Tag size="xs" colorScheme="purple" variant="subtle">{topic.branchName}</Tag>}
            </HStack>
            <HStack spacing={1}>
                <Tooltip label="Alt Konu Ekle" fontSize="xs"><IconButton icon={<Icon as={FaLevelDownAlt} />} size="xs" variant="ghost" colorScheme="teal" onClick={() => onAddSubTopic(topic)} aria-label="Alt Konu Ekle" /></Tooltip>
                <Tooltip label="Düzenle" fontSize="xs"><IconButton icon={<Icon as={FaEdit} />} size="xs" variant="ghost" colorScheme="blue" onClick={() => onEdit(topic)} aria-label="Düzenle" /></Tooltip>
                <Tooltip label="Sil" fontSize="xs"><IconButton icon={<Icon as={FaTrashAlt} />} size="xs" variant="ghost" colorScheme="red" onClick={() => onDelete(topic, 'topic')} aria-label="Sil" /></Tooltip>
            </HStack>
        </Flex>
    );
}


function TopicManagement({ token }) {
    const [topics, setTopics] = useState([]);
    const [allTopicsFlat, setAllTopicsFlat] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDataReady, setIsDataReady] = useState(false);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [editingTopic, setEditingTopic] = useState(null);
    const initialTopicFormState = { name: '', description: '', parentId: '', examClassificationId: '', branchId: '' };
    const [formState, setFormState] = useState(initialTopicFormState);
    const toast = useToast();
    const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState('');

    const [examClassifications, setExamClassifications] = useState([]);
    const { isOpen: isEcModalOpen, onOpen: onEcModalOpen, onClose: onEcModalCloseOriginal } = useDisclosure();
    const [currentEc, setCurrentEc] = useState({ id: null, name: '' });
    const [ecError, setEcError] = useState('');
    const [isSavingEc, setIsSavingEc] = useState(false);

    const [branches, setBranches] = useState([]);
    const { isOpen: isBranchModalOpen, onOpen: onBranchModalOpen, onClose: onBranchModalCloseOriginal } = useDisclosure();
    const [currentBranch, setCurrentBranch] = useState({ id: null, name: '' });
    const [branchError, setBranchError] = useState('');
    const [isSavingBranch, setIsSavingBranch] = useState(false);
    
    const { isOpen: isNewTopicModalOpen, onOpen: onNewTopicModalOpen, onClose: onNewTopicModalCloseOriginal } = useDisclosure();
    const initialNewTopicModalFormState = { name: '', description: ''};
    const [newTopicModalFormData, setNewTopicModalFormData] = useState(initialNewTopicModalFormState);
    const [newTopicModalError, setNewTopicModalError] = useState('');
    const [isAddingNewTopicFromModal, setIsAddingNewTopicFromModal] = useState(false);

    const [selectedFilterEcId, setSelectedFilterEcId] = useState('');
    const [selectedFilterBranchId, setSelectedFilterBranchId] = useState('');

    // Style Hooks
    const topicFormBg = useColorModeValue('gray.50', 'gray.850'); // Adjusted for subtle difference
    const topicFormBorder = useColorModeValue('gray.200', 'gray.700');
    const inputSelectBg = useColorModeValue("white", "gray.700");
    const componentBg = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const listManagementBoxBg = useColorModeValue("gray.50", "gray.750");
    const topicNodeHoverBg   = useColorModeValue('gray.100', 'gray.700');


    const formSectionRef = useRef(null);

    const backendTopicUrl = `${API_BASE_URL}/api/topics`;
    const examClassificationsUrlApi = `${API_BASE_URL}/api/exam-classifications`;
    const branchesUrlApi = `${API_BASE_URL}/api/branches`;

    const onEcModalClose = () => { onEcModalCloseOriginal(); setCurrentEc({ id: null, name: '' }); setEcError(''); };
    const onBranchModalClose = () => { onBranchModalCloseOriginal(); setCurrentBranch({ id: null, name: '' }); setBranchError(''); };
    const onNewTopicModalClose = () => { onNewTopicModalCloseOriginal(); setNewTopicModalFormData(initialNewTopicModalFormState); setNewTopicModalError(''); };

    const flattenTopicsForSelect = useCallback((nodes, list = [], level = 0) => {
        if (!Array.isArray(nodes)) return list;
        nodes.forEach(node => {
            list.push({ 
                id: node.id, 
                name: '\u00A0'.repeat(level * 4) + node.name, 
                branchId: node.branchId, 
                examClassificationId: node.examClassificationId, 
                level: level 
            });
            if (Array.isArray(node.children)) flattenTopicsForSelect(node.children, list, level + 1);
        });
        return list;
    }, []);
    
    const enrichTopicsWithNames = useCallback((topicNodes, ecList, branchList) => {
        if (!Array.isArray(topicNodes)) return [];
        return topicNodes.map(topic => {
            const ec = ecList.find(e => e.id === topic.examClassificationId);
            const branch = branchList.find(b => b.id === topic.branchId);
            return {
                ...topic,
                examClassificationName: ec ? ec.name : '-',
                branchName: branch ? branch.name : '-',
                children: topic.children ? enrichTopicsWithNames(topic.children, ecList, branchList) : []
            };
        });
    }, []);


    const fetchInitialData = useCallback(async () => {
        if (!token) { setError("Yetkilendirme token'ı bulunamadı."); setLoading(false); setIsDataReady(false); return; }
        setLoading(true); setError('');
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [classificationsRes, branchesRes, topicsRes] = await Promise.all([
                axios.get(examClassificationsUrlApi, config),
                axios.get(branchesUrlApi, config),
                axios.get(backendTopicUrl, config)
            ]);
            const ecData = Array.isArray(classificationsRes.data) ? classificationsRes.data : [];
            const branchData = Array.isArray(branchesRes.data) ? branchesRes.data : [];
            const topicTreeData = Array.isArray(topicsRes.data) ? topicsRes.data : [];

            setExamClassifications(ecData);
            setBranches(branchData);
            const enrichedTopicTree = enrichTopicsWithNames(topicTreeData, ecData, branchData);
            setTopics(enrichedTopicTree);
            setAllTopicsFlat(flattenTopicsForSelect(enrichedTopicTree));
            setIsDataReady(true);
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Gerekli veriler yüklenirken bir hata oluştu.";
            setError(errorMsg);
            toast({ title: "Veri Yükleme Hatası", description: errorMsg, status: "error", duration: 5000, isClosable: true });
            setIsDataReady(false);
        } finally { setLoading(false); }
    }, [token, flattenTopicsForSelect, toast, enrichTopicsWithNames]);

    useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
        if (name === "examClassificationId") { // EC değişince Branch ve Parent sıfırlanmalı
            setFormState(prev => ({ ...prev, branchId: '', parentId: '' }));
        } else if (name === "branchId") { // Branch değişince Parent sıfırlanmalı
            setFormState(prev => ({ ...prev, parentId: '' }));
        }
    };
    const handleNewTopicModalInputChange = (e) => { /* ... (Aynı kalır) ... */
        const { name, value } = e.target;
        setNewTopicModalFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleEcInputChange = (e) => setCurrentEc(prev => ({ ...prev, name: e.target.value }));
    const handleBranchInputChange = (e) => setCurrentBranch(prev => ({ ...prev, name: e.target.value }));

    const parentTopicOptions = useMemo(() => {
        if (!formState.branchId || !formState.examClassificationId || !isDataReady) return [];
        const branchIdNum = parseInt(formState.branchId);
        const ecIdNum = parseInt(formState.examClassificationId);
        
        let options = [];
        const buildOptions = (nodes, level = 0) => {
            if (!Array.isArray(nodes)) return;
            nodes.forEach(node => {
                if (node.branchId === branchIdNum && node.examClassificationId === ecIdNum) {
                    // Kendisi veya kendi alt konusu olamaz kontrolü
                    let isSelfOrDescendantOfEditing = false;
                    if (editingTopic && editingTopic.id === node.id) {
                        isSelfOrDescendantOfEditing = true;
                    } else if (editingTopic) {
                        // editingTopic'in alt konularını kontrol et
                        const findDescendant = (currentNode, targetId) => {
                            if (!currentNode.children) return false;
                            for (const child of currentNode.children) {
                                if (child.id === targetId) return true;
                                if (findDescendant(child, targetId)) return true;
                            }
                            return false;
                        };
                        // editingTopic'i ağaçtan bulmamız gerekebilir tam yapısıyla
                        const currentEditingTopicNodeInTree = allTopicsFlat.find(t => t.id === editingTopic.id);
                        if (currentEditingTopicNodeInTree) { // Bu aslında flat list, tam ağaç yapısı değil.
                                                          // Bu kontrol karmaşık. Basitçe kendisi olmasın yeterli olabilir.
                                                          // Daha gelişmiş bir kontrol için tam ağaç yapısında arama gerekir.
                                                          // Şimdilik sadece kendisi olmamasını sağlıyoruz.
                        }
                    }
                    if (!(editingTopic && node.id === editingTopic.id)) { // Sadece kendisi olmasın kontrolü
                         options.push({ id: node.id, name: '\u00A0'.repeat(level * 4) + node.name });
                    }
                }
                // Çocukları her zaman işle, çünkü farklı EC/Branch altında olabilirler
                if (Array.isArray(node.children)) buildOptions(node.children, level + 1);
            });
        };
        // topics (enriched) üzerinden build et
        buildOptions(topics, 0);
        return options;
    }, [formState.branchId, formState.examClassificationId, topics, editingTopic, isDataReady, allTopicsFlat]);


/* ======= 🔄 UPDATE : filteredBranchesForForm ======= */
const filteredBranchesForForm = useMemo(() => {
    // Sınav tipi seçilmediyse branş listesi gösterme
    if (!formState.examClassificationId || !isDataReady) return [];
  
    // Branş kaydındaki examClassificationId alanı (camel-case veya lower-case) seçili EC ile eşleşmeli
    return branches.filter(
      b =>
        Number(b.examClassificationId ?? b.examclassificationid) ===
        Number(formState.examClassificationId)
    );
  }, [branches, formState.examClassificationId, isDataReady]);
  /* ======= 🔄 END UPDATE ======= */

    const handleSaveEc = async () => { /* ... (Aynı kalır) ... */
        if (!currentEc.name.trim()) { setEcError("Sınav tipi adı boş olamaz."); return; }
        setIsSavingEc(true); setEcError('');
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (currentEc.id) {
                await axios.put(`<span class="math-inline">\{examClassificationsUrlApi\}/</span>{currentEc.id}`, { name: currentEc.name.trim() }, config);
            } else {
                await axios.post(examClassificationsUrlApi, { name: currentEc.name.trim() }, config);
            }
            toast({ title: "Başarılı", description: `Sınav tipi ${currentEc.id ? 'güncellendi' : 'eklendi'}.`, status: "success", duration: 3000, isClosable: true });
            fetchInitialData();
            onEcModalClose();
        } catch (err) {
            const errorMsg = err.response?.data?.message || `Sınav tipi ${currentEc.id ? 'güncellenirken' : 'eklenirken'} hata.`;
            setEcError(errorMsg);
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        } finally { setIsSavingEc(false); }
    };
    const handleSaveBranch = async () => { /* ... (Aynı kalır, setFormState güncellendi) ... */
        if (!currentBranch.name.trim()) { setBranchError("Branş adı boş olamaz."); return; }
        setIsSavingBranch(true); setBranchError('');
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            let newBranchData;
            if (currentBranch.id) {
                await axios.put(`<span class="math-inline">\{branchesUrlApi\}/</span>{currentBranch.id}`, { name: currentBranch.name.trim() }, config);
            } else {
                const response = await axios.post(branchesUrlApi, { name: currentBranch.name.trim() }, config);
                newBranchData = response.data;
            }
            toast({ title: "Başarılı", description: `Branş ${currentBranch.id ? 'güncellendi' : 'eklendi'}.`, status: "success", duration: 3000, isClosable: true });
            await fetchInitialData();
            if (!currentBranch.id && newBranchData && newBranchData.id && formState.examClassificationId) { 
                 setFormState(prev => ({ ...prev, branchId: String(newBranchData.id), parentId: '' }));
            }
            onBranchModalClose();
        } catch (err) {
            const errorMsg = err.response?.data?.message || `Branş ${currentBranch.id ? 'güncellenirken' : 'eklenirken'} hata.`;
            setBranchError(errorMsg);
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        } finally { setIsSavingBranch(false); }
    };
    const handleSaveNewTopicFromModal = async () => { /* ... (Aynı kalır, examClassificationId ve branchId ana formdan alınır) ... */
        if (!newTopicModalFormData.name.trim()) { setNewTopicModalError("Konu adı boş bırakılamaz."); return; }
        if (!formState.branchId || !formState.examClassificationId) {
            setNewTopicModalError("Ana formdan bir Sınav Tipi ve Branş seçmelisiniz.");
            toast({ title: "Uyarı", description: "Yeni konu ekleyebilmek için lütfen önce ana formdan Sınav Tipi ve Branş seçin.", status: "warning", duration: 4000, isClosable: true });
            return;
        }
        setIsAddingNewTopicFromModal(true); setNewTopicModalError('');
        const newTopicData = {
            name: newTopicModalFormData.name.trim(),
            description: newTopicModalFormData.description.trim(),
            examClassificationId: parseInt(formState.examClassificationId), // Ana formdan al
            branchId: parseInt(formState.branchId), // Ana formdan al
            parentId: formState.parentId === '' ? null : parseInt(formState.parentId, 10)
        };
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post(backendTopicUrl, newTopicData, config);
            const createdTopic = response.data;
            toast({ title: "Başarılı", description: `Konu (${newTopicData.name}) eklendi.`, status: "success", duration: 3000, isClosable: true });
            await fetchInitialData();
            if (createdTopic && createdTopic.id) {
                setFormState(prev => ({ ...prev, parentId: String(createdTopic.id) }));
            }
            onNewTopicModalClose();
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Konu eklenirken bir hata oluştu.';
            setNewTopicModalError(errorMsg);
            toast({ title: "Konu Ekleme Hatası", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        } finally { setIsAddingNewTopicFromModal(false); }
    };
    const handleFormSubmit = async (e) => { /* ... (Aynı kalır) ... */
        e.preventDefault(); setFormError('');
        if (!formState.name.trim()) { setFormError("Konu adı boş bırakılamaz."); return; }
        if (!formState.examClassificationId) { setFormError("Lütfen bir sınav tipi seçin."); return; }
        if (!formState.branchId) { setFormError("Lütfen bir branş seçin."); return; }
        const topicData = {
            name: formState.name.trim(),
            description: formState.description.trim(),
            parentId: formState.parentId === '' ? null : parseInt(formState.parentId, 10),
            examClassificationId: parseInt(formState.examClassificationId, 10),
            branchId: parseInt(formState.branchId, 10)
        };
        if (editingTopic && topicData.parentId === editingTopic.id) {
            setFormError("Bir konu kendisinin üst konusu olamaz.");
            toast({ title: "Hata", description: "Bir konu kendisinin üst konusu olamaz.", status: "error", duration: 5000, isClosable: true });
            return;
        }
        setIsSavingBranch(true); // Genel bir saving state kullanılabilir veya butonun kendi isLoading'i
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            let message = '';
            if (editingTopic) {
                await axios.put(`<span class="math-inline">\{backendTopicUrl\}/</span>{editingTopic.id}`, topicData, config);
                message = 'Konu başarıyla güncellendi!';
            } else {
                await axios.post(backendTopicUrl, topicData, config);
                message = 'Konu başarıyla eklendi!';
            }
            resetForm();
            await fetchInitialData();
            toast({ title: "Başarılı", description: message, status: "success", duration: 3000, isClosable: true });
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Konu kaydedilirken bir hata oluştu.';
            setFormError(errorMsg);
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        } finally {
            setIsSavingBranch(false);
        }
    };
    const handleEdit = (topic) => { /* ... (Aynı kalır) ... */
        const { children, ...topicDataToEdit } = topic; // children'ı ayır
        const flatVersion = allTopicsFlat.find(t => t.id === topic.id); // Düz listeden level bilgisini al
        setEditingTopic({...topicDataToEdit, level: flatVersion?.level ?? 0 }); // level yoksa 0 ata
        setFormState({
            name: topicDataToEdit.name || '',
            description: topicDataToEdit.description || '',
            parentId: topicDataToEdit.parentId === null ? '' : String(topicDataToEdit.parentId),
            examClassificationId: topicDataToEdit.examClassificationId === null ? '' : String(topicDataToEdit.examClassificationId),
            branchId: topicDataToEdit.branchId === null ? '' : String(topicDataToEdit.branchId)
        });
        setFormError('');
        formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const handleAddSubTopic = (parentTopic) => { /* ... (Aynı kalır) ... */
        setEditingTopic(null);
        setFormState({
            name: '',
            description: '',
            parentId: String(parentTopic.id),
            branchId: String(parentTopic.branchId), // Parent'tan al
            examClassificationId: String(parentTopic.examClassificationId) // Parent'tan al
        });
        setFormError('');
        formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        toast({
            title: "Alt Konu Ekleniyor",
            description: `"${parentTopic.name}" konusuna alt konu eklemek için formu doldurun.`,
            status: "info",
            duration: 4000,
            isClosable: true,
        });
    };
    const openItemDeleteConfirmation = (item, type) => { setItemToDelete(item); setDeleteType(type); onDeleteConfirmOpen(); };
    const handleDeleteItemConfirm = async () => { /* ... (Aynı kalır) ... */
        if (!itemToDelete || !deleteType) return;
        onDeleteConfirmClose();
        setIsSavingBranch(true); // Genel bir saving/busy state
        let url = '';
        let itemName = itemToDelete.name;
        let itemTypeMsg = '';

        if (deleteType === 'topic') { url = `<span class="math-inline">\{backendTopicUrl\}/</span>{itemToDelete.id}`; itemTypeMsg = 'Konu'; }
        else if (deleteType === 'branch') { url = `<span class="math-inline">\{branchesUrlApi\}/</span>{itemToDelete.id}`; itemTypeMsg = 'Branş'; }
        else if (deleteType === 'ec') { url = `<span class="math-inline">\{examClassificationsUrlApi\}/</span>{itemToDelete.id}`; itemTypeMsg = 'Sınav Tipi';}
        else { toast({ title: "Geçersiz Silme Türü", status: "error" }); setIsSavingBranch(false); return; }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(url, config);
            toast({ title: "Başarılı", description: `<span class="math-inline">\{itemTypeMsg\} \(</span>{itemName}) silindi.`, status: "success", duration: 3000, isClosable: true });
            await fetchInitialData();
            if(deleteType === 'topic' && editingTopic && editingTopic.id === itemToDelete.id) resetForm();
        } catch (err) {
            const errorMsg = err.response?.data?.message || `${itemTypeMsg} silinirken bir hata oluştu. İlişkili veriler olabilir.`;
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        } finally { setItemToDelete(null); setDeleteType(''); setIsSavingBranch(false);}
    };
    const resetForm = () => { setEditingTopic(null); setFormState(initialTopicFormState); setFormError(''); };

    const renderTopicsRecursive = useCallback((topicsToRender, level = 0) => {
        if (!Array.isArray(topicsToRender) || !isDataReady) return null;

        // Filtreleme mantığı burada başlar
        let filteredNodes = topicsToRender;
        if (selectedFilterEcId) {
            const ecIdNum = parseInt(selectedFilterEcId);
            filteredNodes = filteredNodes.filter(topic => topic.examClassificationId === ecIdNum);
        }
        if (selectedFilterBranchId) {
            const branchIdNum = parseInt(selectedFilterBranchId);
            filteredNodes = filteredNodes.filter(topic => topic.branchId === branchIdNum);
        }
        // Sadece en üst seviye konuları filtrele (parentId olmayanlar veya parentId'si seçili filtre dışında kalanlar)
        // Bu recursive yapı için, en üst seviye filtrelemeyi burada yapıp, çocukları koşulsuz render etmek daha doğru olabilir.
        // Ya da her seviyede filtrelemeyi kontrol etmeli, bu da karmaşıklaşır.
        // Şimdilik, ana `topics` listesini filtreleyip `renderTopicsRecursive`'e o şekilde veriyoruz.
        // Bu fonksiyon içindeki filtreleme, eğer `topicsToRender` zaten filtrelenmiş bir alt küme ise,
        // sadece o alt küme içinde hiyerarşiyi korur.

        return filteredNodes.map(topic => (
            <Fragment key={topic.id}>
                <TopicNode 
                    topic={topic} 
                    level={level} 
                    onEdit={handleEdit}
                    onAddSubTopic={handleAddSubTopic}
                    onDelete={openItemDeleteConfirmation}
                />
                {Array.isArray(topic.children) && topic.children.length > 0 && (
                    renderTopicsRecursive(topic.children, level + 1, selectedFilterEcId, selectedFilterBranchId) // Filtreleri çocuklara geçirme, çünkü ana filtreleme üstte yapılıyor.
                )}
            </Fragment>
        ));
    }, [isDataReady, selectedFilterEcId, selectedFilterBranchId, handleEdit, handleAddSubTopic, openItemDeleteConfirmation, topics]); // `topics` eklendi çünkü render edilen data buna bağlı


    const topicsToDisplay = useMemo(() => {
        if (!isDataReady) return [];
        let RaporlanacakKonular = topics;
        if (selectedFilterEcId) {
            const ecIdNum = parseInt(selectedFilterEcId);
            RaporlanacakKonular = RaporlanacakKonular.filter(topic => topic.examClassificationId === ecIdNum && !topic.parentId); 
            // Sadece parentId'si olmayanları (ana kategorileri) veya tüm hiyerarşiyi koruyarak filtrelemek gerekebilir.
            // Daha doğru bir filtreleme için, tüm ağacı dolaşıp EC ve Branch'e uyan alt ağaçları çıkarmak lazım.
            // Bu basit filtreleme şimdilik ana kategorileri filtreler.
            // Veya tüm `topics` ağacını `enrichTopicsWithNames` sonrası `renderTopicsRecursive`'e verip, orada filtrelemek.
            // `renderTopicsRecursive` içindeki filtreleme mantığını güçlendirmek daha iyi.
        }
        if (selectedFilterBranchId) {
            const branchIdNum = parseInt(selectedFilterBranchId);
            // `RaporlanacakKonular` zaten EC'ye göre filtrelenmiş olabilir.
             RaporlanacakKonular = RaporlanacakKonular.filter(topic => topic.branchId === branchIdNum && !topic.parentId);
        }
        // Eğer filtre yoksa ve tüm konuları göstermek istiyorsak:
        if (!selectedFilterEcId && !selectedFilterBranchId) {
            return topics.filter(topic => !topic.parentId); // Sadece en üst seviye konuları göster
        }
        // Ya da tüm ağacı göstermek için: return topics; (ama bu filtrelerle çelişir)

        // Doğru yaklaşım: renderTopicsRecursive içinde filtrelemeyi yapmak.
        return topics; // renderTopicsRecursive kendi içinde filtreleyecek.

    }, [topics, selectedFilterEcId, selectedFilterBranchId, isDataReady]);


    if (loading && !isDataReady) return <Center p={10}><Spinner size="xl" color="brand.500" thickness="3px" /></Center>;

    return (
        <Box p={4} borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="lg" bg={componentBg}>
            <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3} mb={6} color="textPrimary"><Icon as={FaSitemap} /> Sınav, Branş ve Konu Yönetimi</Heading>
            {error && ( <Alert status="error" variant="subtle" borderRadius="md" mb={4}> <AlertIcon as={FaExclamationTriangle} /> {error} </Alert> )}

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
                <Box p={4} borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="sm" bg={listManagementBoxBg}>
                    <Flex justifyContent="space-between" alignItems="center" mb={3}>
                        <Heading size="sm" display="flex" alignItems="center"><Icon as={FaBook} mr={2}/>Sınav Tipleri</Heading>
                        <Button size="xs" colorScheme="teal" leftIcon={<FaPlus />} onClick={() => { setCurrentEc({id: null, name: ''}); onEcModalOpen();}}>Yeni Ekle</Button>
                    </Flex>
                    <VStack spacing={1} align="stretch" maxHeight="200px" overflowY="auto" pr={2}>
                        {examClassifications.map(ec => (
                            <Flex key={ec.id} justifyContent="space-between" alignItems="center" p={1.5} _hover={{bg: topicNodeHoverBg}} borderRadius="md">
                                <Text fontSize="sm">{ec.name}</Text>
                                <HStack spacing={1}>
                                    <Tooltip label="Düzenle" fontSize="xs"><IconButton icon={<FaEdit/>} size="xs" variant="ghost" colorScheme="blue" onClick={() => {setCurrentEc(ec); onEcModalOpen();}}/></Tooltip>
                                    <Tooltip label="Sil" fontSize="xs"><IconButton icon={<FaTrashAlt/>} size="xs" variant="ghost" colorScheme="red" onClick={() => openItemDeleteConfirmation(ec, 'ec')}/></Tooltip>
                                </HStack>
                            </Flex>
                        ))}
                    </VStack>
                </Box>
                <Box p={4} borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="sm" bg={listManagementBoxBg}>
                    <Flex justifyContent="space-between" alignItems="center" mb={3}>
                        <Heading size="sm" display="flex" alignItems="center"><Icon as={FaBuilding} mr={2}/>Branşlar</Heading>
                        <Button size="xs" colorScheme="purple" leftIcon={<FaPlus />} onClick={() => { setCurrentBranch({id:null, name:''}); onBranchModalOpen();}}>Yeni Ekle</Button>
                    </Flex>
                     <VStack spacing={1} align="stretch" maxHeight="200px" overflowY="auto" pr={2}>
                        {branches.map(b => (
                            <Flex key={b.id} justifyContent="space-between" alignItems="center" p={1.5} _hover={{bg: topicNodeHoverBg}} borderRadius="md">
                                <Text fontSize="sm">{b.name}</Text>
                                <HStack spacing={1}>
                                    <Tooltip label="Düzenle" fontSize="xs"><IconButton icon={<FaEdit/>} size="xs" variant="ghost" colorScheme="blue" onClick={() => {setCurrentBranch(b); onBranchModalOpen();}}/></Tooltip>
                                    <Tooltip label="Sil" fontSize="xs"><IconButton icon={<FaTrashAlt/>} size="xs" variant="ghost" colorScheme="red" onClick={() => openItemDeleteConfirmation(b, 'branch')}/></Tooltip>
                                </HStack>
                            </Flex>
                        ))}
                    </VStack>
                </Box>
            </SimpleGrid>

            <Box ref={formSectionRef} id="topic-form-section" as="form" onSubmit={handleFormSubmit} p={6} borderWidth="1px" borderRadius="lg" borderColor={topicFormBorder} bg={topicFormBg} mb={8} boxShadow="md">
                <Heading as="h4" size="md" mb={5}>{editingTopic ? `Konu/Kategori Düzenle (ID: ${editingTopic.id})` : 'Yeni Konu/Kategori Ekle'}</Heading>
                {formError && <Alert status="warning" variant="subtle" borderRadius="md" mb={4}><AlertIcon as={FaExclamationTriangle} />{formError}</Alert>}
                <VStack spacing={4}>
                    <FormControl isRequired id="topicExamClassification" isInvalid={!!formError && formError.includes('Sınav tipi')}>
                        <FormLabel fontSize="sm">Sınav Tipi:</FormLabel>
                        <Select name="examClassificationId" value={formState.examClassificationId} onChange={handleInputChange} placeholder="-- Sınav Tipi Seçin --" bg={inputSelectBg}>
                            {examClassifications.map(ec => (<option key={ec.id} value={ec.id}>{ec.name}</option>))}
                        </Select>
                         {!!formError && formError.includes('Sınav tipi') && <FormErrorMessage>Lütfen bir sınav tipi seçin.</FormErrorMessage>}
                    </FormControl>
                    <FormControl isRequired id="topicBranch" isInvalid={!!formError && formError.includes('Branş')}>
                        <FormLabel fontSize="sm">Branş:</FormLabel>
                         <Select name="branchId" value={formState.branchId} onChange={handleInputChange} placeholder="-- Branş Seçin --" isDisabled={!formState.examClassificationId} bg={inputSelectBg}>
                            {filteredBranchesForForm.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
                        </Select>
                        {!formState.examClassificationId && <Text fontSize="xs" color="textMuted" mt={1}>Branş seçebilmek için önce Sınav Tipi seçin.</Text>}
                        {!!formError && formError.includes('Branş') && <FormErrorMessage>Lütfen bir branş seçin.</FormErrorMessage>}
                    </FormControl>
                     <FormControl isRequired id="topicName" isInvalid={!!formError && formError.includes('Konu adı')}>
                        <FormLabel fontSize="sm">Konu/Kategori Adı:</FormLabel>
                        <Input name="name" value={formState.name} onChange={handleInputChange} bg={inputSelectBg} />
                         {!!formError && formError.includes('Konu adı') && <FormErrorMessage>Konu adı boş olamaz.</FormErrorMessage>}
                    </FormControl>
                    <FormControl id="topicParent">
                        <FormLabel fontSize="sm">Üst Konu/Kategori:</FormLabel>
                         <InputGroup>
                            <Select
                                name="parentId" value={formState.parentId} onChange={handleInputChange}
                                placeholder="-- Yok (Ana Kategori Olacak) --"
                                isDisabled={!formState.branchId || !formState.examClassificationId} bg={inputSelectBg}
                            >
                                {parentTopicOptions.map(o => (<option key={o.id} value={o.id} disabled={o.id === editingTopic?.id}>{o.name}</option>))}
                            </Select>
                            <InputRightElement>
                                <Tooltip label="Seçili Sınav Tipi ve Branşta, seçili üst konu altına veya ana kategori olarak Yeni Konu/Kategori Ekle" fontSize="xs"><IconButton h="full" size="sm" onClick={onNewTopicModalOpen} icon={<FaPlus />} aria-label="Yeni Konu/Kategori Ekle" isDisabled={!formState.branchId || !formState.examClassificationId}/></Tooltip>
                            </InputRightElement>
                        </InputGroup>
                         {(!formState.branchId || !formState.examClassificationId) && <Text fontSize="xs" color="textMuted" mt={1}>Üst konu seçmek veya yeni konu eklemek için Sınav Tipi ve Branş seçilmelidir.</Text>}
                    </FormControl>
                    <FormControl id="topicDescription">
                        <FormLabel fontSize="sm">Açıklama (Opsiyonel):</FormLabel>
                        <Textarea name="description" value={formState.description} onChange={handleInputChange} rows={3} bg={inputSelectBg} />
                    </FormControl>
                    <HStack spacing={3} mt={5} alignSelf="flex-start">
                        <Button type="submit" colorScheme="blue" leftIcon={<Icon as={FaSave}/>} isLoading={isSavingBranch || isAddingNewTopicFromModal || loading }>
                            {editingTopic ? 'Güncelle' : 'Ekle'}
                        </Button>
                        {(editingTopic || formState.name || formState.description || formState.branchId || formState.parentId || formState.examClassificationId) && (
                            <Button variant="ghost" onClick={resetForm} leftIcon={<Icon as={FaTimesCircle}/>}>Temizle/İptal</Button>
                        )}
                    </HStack>
                </VStack>
            </Box>

            <Modal isOpen={isEcModalOpen} onClose={onEcModalClose} isCentered>
                <ModalOverlay/><ModalContent bg={componentBg}><ModalHeader>Sınav Tipini {currentEc.id ? 'Düzenle' : 'Ekle'}</ModalHeader><ModalCloseButton />
                    <ModalBody pb={6}><FormControl isInvalid={!!ecError}><FormLabel>Sınav Tipi Adı:</FormLabel><Input value={currentEc.name} onChange={handleEcInputChange} placeholder="Örn: TUS, DUS" bg={inputSelectBg}/>{ecError && <FormErrorMessage>{ecError}</FormErrorMessage>}</FormControl></ModalBody>
                    <ModalFooter><Button variant='ghost' mr={3} onClick={onEcModalClose}>İptal</Button><Button colorScheme='teal' onClick={handleSaveEc} isLoading={isSavingEc}>Kaydet</Button></ModalFooter>
                </ModalContent>
            </Modal>
             <Modal isOpen={isBranchModalOpen} onClose={onBranchModalClose} isCentered>
                <ModalOverlay/><ModalContent bg={componentBg}><ModalHeader>Branşı {currentBranch.id ? 'Düzenle' : 'Ekle'}</ModalHeader><ModalCloseButton />
                    <ModalBody pb={6}><FormControl isInvalid={!!branchError}><FormLabel>Branş Adı:</FormLabel><Input value={currentBranch.name} onChange={handleBranchInputChange} placeholder="Örn: Kardiyoloji" bg={inputSelectBg}/>{branchError && <FormErrorMessage>{branchError}</FormErrorMessage>}</FormControl></ModalBody>
                    <ModalFooter><Button variant='ghost' mr={3} onClick={onBranchModalClose}>İptal</Button><Button colorScheme='purple' onClick={handleSaveBranch} isLoading={isSavingBranch}>Kaydet</Button></ModalFooter>
                </ModalContent>
            </Modal>
            <Modal isOpen={isNewTopicModalOpen} onClose={onNewTopicModalClose} isCentered>
                 <ModalOverlay/><ModalContent bg={componentBg}><ModalHeader>Yeni Konu/Kategori Ekle</ModalHeader><ModalCloseButton />
                    <ModalBody pb={6}><VStack spacing={4}>
                        <Text fontSize="sm" color="textMuted" w="full">
                            Bu konu/kategori, ana formda seçili olan Sınav Tipine ({examClassifications.find(ec=>ec.id === parseInt(formState.examClassificationId))?.name || 'N/A'})
                            ve Branşa ({branches.find(b=>b.id === parseInt(formState.branchId))?.name || 'N/A'}) eklenecektir.
                            {formState.parentId && allTopicsFlat.find(t=>t.id === parseInt(formState.parentId)) ? 
                            ` Üst konusu: "${allTopicsFlat.find(t=>t.id === parseInt(formState.parentId))?.name?.trim() || 'Seçili Üst Konu'}" olacaktır.` : 
                            ' Bu bir ana kategori (üst konu olmadan) olarak eklenecektir.'}
                        </Text>
                        <FormControl isRequired id="newTopicName" isInvalid={!!newTopicModalError && newTopicModalError.includes('Konu adı')}><FormLabel>Yeni Konu/Kategori Adı:</FormLabel><Input name="name" value={newTopicModalFormData.name} onChange={handleNewTopicModalInputChange} placeholder="Yeni konu/kategori adı" bg={inputSelectBg}/>{!!newTopicModalError && newTopicModalError.includes('Konu adı') && <FormErrorMessage>{newTopicModalError}</FormErrorMessage>}</FormControl>
                        <FormControl id="newTopicDescription"><FormLabel>Açıklama (Opsiyonel):</FormLabel><Textarea name="description" value={newTopicModalFormData.description} onChange={handleNewTopicModalInputChange} placeholder="Açıklama" bg={inputSelectBg}/></FormControl>
                        {!!newTopicModalError && !newTopicModalError.includes('Konu adı') && <Alert status="error" size="sm" variant="subtle" borderRadius="md"><AlertIcon as={FaExclamationTriangle}/>{newTopicModalError}</Alert>}
                    </VStack></ModalBody>
                    <ModalFooter><Button variant='ghost' mr={3} onClick={onNewTopicModalClose}>İptal</Button><Button colorScheme='blue' onClick={handleSaveNewTopicFromModal} isLoading={isAddingNewTopicFromModal}>Kaydet</Button></ModalFooter>
                </ModalContent>
            </Modal>

            <Heading as="h4" size="md" mt={10} mb={4} color="textPrimary">Mevcut Konular ve Kategoriler (Filtreli)</Heading>
            <HStack mb={4} spacing={4}>
                <FormControl id="filterEc">
                    <FormLabel fontSize="sm">Sınav Tipine Göre Filtrele:</FormLabel>
                    <Select placeholder="Tüm Sınav Tipleri" value={selectedFilterEcId} onChange={(e) => { setSelectedFilterEcId(e.target.value); setSelectedFilterBranchId(''); }} bg={inputSelectBg}>
                        {examClassifications.map(ec => <option key={ec.id} value={ec.id}>{ec.name}</option>)}
                    </Select>
                </FormControl>
                <FormControl id="filterBranch">
                    <FormLabel fontSize="sm">Branşa Göre Filtrele:</FormLabel>
                    <Select placeholder="Tüm Branşlar (Önce Sınav Tipi Seçin)" value={selectedFilterBranchId} onChange={(e) => setSelectedFilterBranchId(e.target.value)} isDisabled={!selectedFilterEcId} bg={inputSelectBg}>
                        {branches.filter(b => {
                            if (!selectedFilterEcId) return true; 
                            // Sadece seçili sınav tipine ait konuları olan branşları göster.
                            // Bu, allTopicsFlat veya topics üzerinden kontrol edilebilir.
                            // topics (enriched) kullanmak daha doğru olur.
                            return topics.some(topic => 
                                topic.branchId === b.id && 
                                topic.examClassificationId === parseInt(selectedFilterEcId) && 
                                !topic.parentId); // Ana kategori seviyesinde kontrol
                        }).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </Select>
                     {!selectedFilterEcId && <Text fontSize="xs" color="textMuted" mt={1}>Branşları görmek için önce Sınav Tipi seçin.</Text>}
                </FormControl>
            </HStack>

            {loading && !isDataReady ? (<Center p={5}><Spinner color="brand.500"/></Center>) : 
             !isDataReady && error ? null : // Hata zaten yukarıda gösteriliyor
             topicsToDisplay.length === 0 && (!selectedFilterEcId || !selectedFilterBranchId) && !error ? ( 
                <Alert status="info" variant="subtle" borderRadius="md"> <AlertIcon as={FaInfoCircle} /> Lütfen yukarıdan Sınav Tipi ve Branş seçerek konuları listeleyin veya yeni içerik ekleyin.</Alert>
            ) : topicsToDisplay.length === 0 && (selectedFilterEcId && selectedFilterBranchId) && !error ? (
                 <Alert status="info" variant="subtle" borderRadius="md"> <AlertIcon as={FaInfoCircle} /> Seçili filtrelere uygun konu bulunamadı.</Alert>
            ) : (
                <Box borderWidth="1px" borderRadius="lg" borderColor={borderColor} bg={componentBg} maxH="600px" overflowY="auto" boxShadow="sm">
                    {renderTopicsRecursive(topicsToDisplay, 0, selectedFilterEcId, selectedFilterBranchId)}
                </Box>
            )}

            <Modal isOpen={isDeleteConfirmOpen} onClose={onDeleteConfirmClose} isCentered>
                <ModalOverlay />
                <ModalContent bg={componentBg}>
                    <ModalHeader>{deleteType.charAt(0).toUpperCase() + deleteType.slice(1)} Silme Onayı</ModalHeader><ModalCloseButton />
                    <ModalBody>
                        {deleteType === 'topic' && `Konuyu ("${itemToDelete?.name}" - ID: ${itemToDelete?.id}) ve altındaki tüm alt konuları, bu konularla ilişkili dersleri ve soruları kalıcı olarak silmek istediğinizden emin misiniz?`}
                        {deleteType === 'branch' && `Branşı ("${itemToDelete?.name}" - ID: ${itemToDelete?.id}) ve bu branşla ilişkili tüm konuları, dersleri, soruları kalıcı olarak silmek istediğinizden emin misiniz?`}
                        {deleteType === 'ec' && `Sınav Tipini ("${itemToDelete?.name}" - ID: ${itemToDelete?.id}) ve bu sınav tipiyle ilişkili tüm konuları, dersleri, soruları kalıcı olarak silmek istediğinizden emin misiniz?`}
                        <Text fontWeight="bold" color="red.500" mt={2}>Bu işlem geri alınamaz!</Text>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant='ghost' mr={3} onClick={onDeleteConfirmClose} isDisabled={isSavingBranch || isSavingEc /* genel isDeleting state'i */}>İptal</Button>
                        <Button colorScheme='red' onClick={handleDeleteItemConfirm} isLoading={isSavingBranch || isSavingEc}> Sil </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}

export default TopicManagement;