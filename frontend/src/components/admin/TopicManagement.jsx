import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from 'react';
import axios from 'axios';
import {
    Box, Card, CardHeader, CardBody, Center, Heading, Flex, Spinner, Alert, AlertIcon, useToast, useDisclosure,
    Button, IconButton, Icon, Select, FormControl, FormLabel, Input, Textarea,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    VStack, HStack, Text, InputGroup, InputRightElement, useColorModeValue,
    FormErrorMessage, Tooltip, SimpleGrid, Tag, Divider
} from '@chakra-ui/react';
import { 
    FaTags, FaEdit, FaTrashAlt, FaFolderOpen, FaFileAlt, FaSave, 
    FaTimesCircle, FaPlus, FaSitemap, FaLevelDownAlt, FaBook, 
    FaBuilding, FaExclamationTriangle, FaFilter, FaSync // Yeni ikonlar
} from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const initialTopicFormState = { name: '', description: '', parentId: '', examClassificationId: '', branchId: '' };
const initialNewTopicModalFormState = { name: '', description: ''};

// Helper: Bir konunun ve tüm alt konularının ID'lerini toplar
const getAllDescendantIds = (topicId, allTopicsMap) => {
    const descendants = new Set();
    const queue = [topicId];
    const visited = new Set();

    while (queue.length > 0) {
        const currentId = queue.shift();
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const topic = allTopicsMap.get(currentId);
        if (topic && topic.children && topic.children.length > 0) {
            topic.children.forEach(child => {
                descendants.add(child.id);
                queue.push(child.id);
            });
        }
    }
    return descendants;
};

// Helper: TopicNode component'i (dosya içinde kalabilir veya ayrı dosyaya taşınabilir)
function TopicNode({ topic, level = 0, onEdit, onAddSubTopic, onDelete, isFilteredOut = false }) {
    const hasChildren = Array.isArray(topic.children) && topic.children.length > 0;
    const NodeIcon = hasChildren ? FaFolderOpen : FaFileAlt;

    const nodeHoverBg = useColorModeValue('gray.100', 'gray.700');
    const nodeBorderColor = useColorModeValue('gray.200', 'gray.600');
    const nodeTextColor = useColorModeValue('gray.800', 'gray.100');
    const nodeIconColor = useColorModeValue('blue.500', 'blue.300');
    
    // Filtrelenmişse soluk göster
    const itemOpacity = isFilteredOut ? 0.5 : 1;
    const itemPointerEvents = isFilteredOut ? 'none' : 'auto';

    return (
        <Flex
            alignItems="center" p={2} pl={level * 6 + 2}
            bg={useColorModeValue(level % 2 === 0 ? "gray.50" : "whiteAlpha.500", level % 2 === 0 ? "gray.800" : "gray.850")}
            _hover={{ bg: nodeHoverBg }} borderBottomWidth="1px" borderColor={nodeBorderColor}
            opacity={itemOpacity}
            pointerEvents={itemPointerEvents}
            title={isFilteredOut ? "Bu öğe mevcut filtrelere uymuyor ancak üst öğesi uyduğu için gösteriliyor." : topic.name}
        >
            <HStack spacing={2} flex={1} minW={0} alignItems="center">
                <Icon as={NodeIcon} color={nodeIconColor} mr={2}/>
                <Text isTruncated title={topic.name} fontWeight={level === 0 ? "semibold" : "normal"} color={nodeTextColor}>
                    {topic.name}
                </Text>
                <Text as="span" fontSize="xs" color="textMuted" ml={1} whiteSpace="nowrap">(ID: {topic.id})</Text>
                {topic.examClassificationName && <Tag size="xs" colorScheme="green" variant="subtle">{topic.examClassificationName}</Tag>}
                {topic.branchName && <Tag size="xs" colorScheme="purple" variant="subtle">{topic.branchName}</Tag>}
            </HStack>
            <HStack spacing={1}>
                <Tooltip label="Bu kategori altına alt konu/kategori ekle" fontSize="xs"><IconButton icon={<Icon as={FaLevelDownAlt} />} size="xs" variant="ghost" colorScheme="teal" onClick={() => onAddSubTopic(topic)} aria-label="Alt Öğe Ekle" /></Tooltip>
                <Tooltip label="Düzenle" fontSize="xs"><IconButton icon={<Icon as={FaEdit} />} size="xs" variant="ghost" colorScheme="blue" onClick={() => onEdit(topic)} aria-label="Düzenle" /></Tooltip>
                <Tooltip label="Sil" fontSize="xs"><IconButton icon={<Icon as={FaTrashAlt} />} size="xs" variant="ghost" colorScheme="red" onClick={() => onDelete(topic, 'topic')} aria-label="Sil" /></Tooltip>
            </HStack>
        </Flex>
    );
}
const buildTopicTree = (list) => {
    const map = {};
    const roots = [];
    if (!Array.isArray(list) || list.length === 0) return roots;

    list.forEach(node => {
        map[node.id] = { ...node, children: [] }; // Her düğümü kopyala ve çocukları için boş dizi ata
    });

    list.forEach(node => {
        if (node.parentId && map[node.parentId]) {
            map[node.parentId].children.push(map[node.id]);
        } else {
            roots.push(map[node.id]);
        }
    });
    return roots;
};

function TopicManagement({ token }) {
    const [topics, setTopics] = useState([]); // Hiyerarşik tüm konular (filtrelenmemiş, EC/Branch isimleriyle zenginleştirilmiş)
    const [allTopicsFlat, setAllTopicsFlat] = useState([]); // Formlar için düz liste
    const [examClassifications, setExamClassifications] = useState([]);
    const [branches, setBranches] = useState([]);
    
    
    const [loading, setLoading] = useState(true); // Ana veri yükleme
    const [formLoading, setFormLoading] = useState(false); // Form submit işlemleri için
    const [error, setError] = useState('');
    const [formError, setFormError] = useState(''); // Konu ekleme/düzenleme formu için özel hata
    
    const [editingTopic, setEditingTopic] = useState(null);
    const [formState, setFormState] = useState(initialTopicFormState);
    
    const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState('');

    const { isOpen: isEcModalOpen, onOpen: onEcModalOpen, onClose: onEcModalCloseOriginal } = useDisclosure();
    const [currentEc, setCurrentEc] = useState({ id: null, name: '' });
    const [ecError, setEcError] = useState('');
    const [isSavingEc, setIsSavingEc] = useState(false);

    const { isOpen: isBranchModalOpen, onOpen: onBranchModalOpen, onClose: onBranchModalCloseOriginal } = useDisclosure();
    const [currentBranch, setCurrentBranch] = useState({ id: null, name: '' });
    const [branchError, setBranchError] = useState('');
    const [isSavingBranch, setIsSavingBranch] = useState(false);
    
    const { isOpen: isNewTopicModalOpen, onOpen: onNewTopicModalOpen, onClose: onNewTopicModalCloseOriginal } = useDisclosure();
    const [newTopicModalFormData, setNewTopicModalFormData] = useState(initialNewTopicModalFormState);
    const [newTopicModalError, setNewTopicModalError] = useState('');
    const [isAddingNewTopicFromModal, setIsAddingNewTopicFromModal] = useState(false);

    const [selectedFilterEcId, setSelectedFilterEcId] = useState('');
    const [selectedFilterBranchId, setSelectedFilterBranchId] = useState('');

    const toast = useToast();
    const formSectionRef = useRef(null);
    

    const borderColor = useColorModeValue("gray.200", "gray.600");
    const topicFormBg = useColorModeValue("gray.50", "gray.850");
    const topicFormBorder = useColorModeValue("gray.200", "gray.700");
    const componentBg = useColorModeValue("white", "gray.800");
    const inputSelectBg = useColorModeValue("white", "gray.700");
    const textColor = useColorModeValue("gray.800", "gray.100");
    const textMutedColor = useColorModeValue("gray.500", "gray.400");
    const headingColor = useColorModeValue("gray.900", "gray.100");
    const listManagementBoxBg = useColorModeValue("gray.50", "gray.750");
    const topicNodeHoverBg = useColorModeValue("gray.100", "gray.700");

    const backendTopicUrl = `${API_BASE_URL}/api/topics`;
    const examClassificationsUrlApi = `${API_BASE_URL}/api/exam-classifications`;
    const branchesUrlApi = `${API_BASE_URL}/api/branches`;

    const onEcModalClose = () => { onEcModalCloseOriginal(); setCurrentEc({ id: null, name: '' }); setEcError(''); };
    const onBranchModalClose = () => { onBranchModalCloseOriginal(); setCurrentBranch({ id: null, name: '' }); setBranchError(''); };
    const onNewTopicModalClose = () => { onNewTopicModalCloseOriginal(); setNewTopicModalFormData(initialNewTopicModalFormState); setNewTopicModalError(''); };

    const flattenTopicsRecursive = useCallback((nodes, list = [], level = 0, parentPath = "") => {
        if (!Array.isArray(nodes)) return list;
        nodes.forEach(node => {
            const currentPathName = parentPath ? `${parentPath} > ${node.name}` : node.name;
            list.push({ 
                id: node.id, name: '\u00A0'.repeat(level * 4) + node.name, 
                displayName: currentPathName, branchId: node.branchId, 
                examClassificationId: node.examClassificationId, level: level 
            });
            if (Array.isArray(node.children)) flattenTopicsRecursive(node.children, list, level + 1, currentPathName);
        });
        return list;
    }, []);
    
    // enrichTopicsWithNames fonksiyonu artık doğrudan buildTopicTree'den dönen hiyerarşik yapı üzerinde çalışacak
    // veya fetchAllData içinde düz liste üzerinde çalışıp sonra buildTopicTree çağrılabilir.
    // Şimdilik, düz liste üzerinde çalışıp, sonra buildTopicTree'ye verilecek.
    const enrichRawTopicsWithNames = useCallback((rawTopicList, ecList, branchList) => {
        if (!Array.isArray(rawTopicList)) return [];
        return rawTopicList.map(topic => {
            const ec = ecList.find(e => e.id === topic.examClassificationId);
            const branch = branchList.find(b => b.id === topic.branchId);
            return {
                ...topic, // parentId, children gibi alanlar burada korunur
                examClassificationName: ec ? ec.name : undefined,
                branchName: branch ? branch.name : undefined,
            };
        });
    }, []);

    const fetchAllData = useCallback(async () => {
        if (!token) { setError("Yetkilendirme token'ı bulunamadı."); setLoading(false); return; }
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
            const rawTopicList = Array.isArray(topicsRes.data) ? topicsRes.data : []; // Backend'den düz liste geldiğini varsayıyoruz

            setExamClassifications(ecData);
            setBranches(branchData);
            
            const enrichedRawTopics = enrichRawTopicsWithNames(rawTopicList, ecData, branchData);
            const topicTree = buildTopicTree(enrichedRawTopics); // Hiyerarşiyi kur
            setTopics(topicTree); 
            setAllTopicsFlat(flattenTopicsRecursive(topicTree));
            
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Veriler yüklenirken bir hata oluştu.";
            setError(errorMsg);
            toast({ title: "Veri Yükleme Hatası", description: errorMsg, status: "error", duration: 5000 });
        } finally { setLoading(false); }
    }, [token, flattenTopicsRecursive, toast, enrichRawTopicsWithNames]); // enrichRawTopicsWithNames eklendi

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => {
            const newState = { ...prev, [name]: value };
            if (name === "examClassificationId") {
                newState.branchId = ''; newState.parentId = '';
            } else if (name === "branchId") {
                newState.parentId = '';
            }
            return newState;
        });
        setFormError('');
    };
    
    const handleNewTopicModalInputChange = (e) => {
        const { name, value } = e.target;
        setNewTopicModalFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleEcInputChange = (e) => setCurrentEc(prev => ({ ...prev, name: e.target.value }));
    const handleBranchInputChange = (e) => setCurrentBranch(prev => ({ ...prev, name: e.target.value }));

    const allTopicsMap = useMemo(() => {
        const map = new Map();
        const addNodeToMap = (node) => {
            map.set(node.id, node);
            if (node.children && node.children.length > 0) {
                node.children.forEach(addNodeToMap);
            }
        };
        topics.forEach(addNodeToMap);
        return map;
    }, [topics]);

    const parentTopicOptions = useMemo(() => {
        if (!formState.branchId || !formState.examClassificationId) return [];
        const branchIdNum = parseInt(formState.branchId);
        const ecIdNum = parseInt(formState.examClassificationId);
        
        let options = [];
        let editingTopicDescendantIds = new Set();
        if (editingTopic) {
            editingTopicDescendantIds = getAllDescendantIds(editingTopic.id, allTopicsMap);
            editingTopicDescendantIds.add(editingTopic.id); // Kendisi de parent olamaz
        }

        const buildOptions = (nodes, level = 0, currentPath = "") => {
            if (!Array.isArray(nodes)) return;
            nodes.forEach(node => {
                if (node.branchId === branchIdNum && node.examClassificationId === ecIdNum) {
                    if (!editingTopicDescendantIds.has(node.id)) { // Kendisi veya alt konusu olamaz
                         options.push({ id: node.id, name: '\u00A0'.repeat(level * 4) + node.name });
                    }
                }
                if (Array.isArray(node.children)) buildOptions(node.children, level + 1, currentPath);
            });
        };
        buildOptions(topics, 0); // Ana 'topics' (zenginleştirilmiş hiyerarşik) üzerinden build et
        return options;
    }, [formState.branchId, formState.examClassificationId, topics, editingTopic, allTopicsMap]);

    const filteredBranchesForForm = useMemo(() => {
        if (!formState.examClassificationId) return [];
        return branches.filter(b => Number(b.examClassificationId ?? b.examclassificationid) === Number(formState.examClassificationId));
    }, [branches, formState.examClassificationId]);

    const handleSaveEc = async () => {
        if (!currentEc.name.trim()) { setEcError("Sınav tipi adı boş olamaz."); return; }
        setIsSavingEc(true); setEcError('');
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (currentEc.id) {
                await axios.put(`${examClassificationsUrlApi}/${currentEc.id}`, { name: currentEc.name.trim() }, config);
            } else {
                await axios.post(examClassificationsUrlApi, { name: currentEc.name.trim() }, config);
            }
            toast({ title: "Başarılı", description: `Sınav tipi ${currentEc.id ? 'güncellendi' : 'eklendi'}.`, status: "success" });
            await fetchAllData();
            onEcModalClose();
        } catch (err) {
            const errorMsg = err.response?.data?.message || `Sınav tipi kaydedilirken hata.`;
            setEcError(errorMsg);
            toast({ title: "Hata", description: errorMsg, status: "error" });
        } finally { setIsSavingEc(false); }
    };

    const handleSaveBranch = async () => {
        if (!currentBranch.name.trim()) { setBranchError("Branş adı boş olamaz."); return; }
        if (!currentBranch.examClassificationId) { setBranchError("Lütfen bir sınav tipi seçin."); return; } // Branş için Sınav Tipi zorunlu
        setIsSavingBranch(true); setBranchError('');
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = { 
                name: currentBranch.name.trim(), 
                examClassificationId: parseInt(currentBranch.examClassificationId, 10)
            };
            let newBranchData;
            if (currentBranch.id) {
                await axios.put(`${branchesUrlApi}/${currentBranch.id}`, payload, config);
            } else {
                const response = await axios.post(branchesUrlApi, payload, config);
                newBranchData = response.data;
            }
            toast({ title: "Başarılı", description: `Branş ${currentBranch.id ? 'güncellendi' : 'eklendi'}.`, status: "success" });
            await fetchAllData();
            if (!currentBranch.id && newBranchData?.id && formState.examClassificationId === String(newBranchData.examClassificationId)) { 
                 setFormState(prev => ({ ...prev, branchId: String(newBranchData.id), parentId: '' }));
            }
            onBranchModalClose();
        } catch (err) {
            const errorMsg = err.response?.data?.message || `Branş kaydedilirken hata.`;
            setBranchError(errorMsg);
            toast({ title: "Hata", description: errorMsg, status: "error" });
        } finally { setIsSavingBranch(false); }
    };

    const handleSaveNewTopicFromModal = async () => {
        if (!newTopicModalFormData.name.trim()) { setNewTopicModalError("Konu adı boş bırakılamaz."); return; }
        if (!formState.branchId || !formState.examClassificationId) {
            setNewTopicModalError("Ana formdan bir Sınav Tipi ve Branş seçmelisiniz.");
            toast({ title: "Uyarı", description: "Yeni konu ekleyebilmek için lütfen önce ana formdan Sınav Tipi ve Branş seçin.", status: "warning" });
            return;
        }
        setIsAddingNewTopicFromModal(true); setNewTopicModalError('');
        const newTopicData = {
            name: newTopicModalFormData.name.trim(),
            description: newTopicModalFormData.description.trim() || null,
            examClassificationId: parseInt(formState.examClassificationId, 10),
            branchId: parseInt(formState.branchId, 10),
            parentId: formState.parentId === '' ? null : parseInt(formState.parentId, 10)
        };
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post(backendTopicUrl, newTopicData, config);
            const createdTopic = response.data;
            toast({ title: "Başarılı", description: `Konu (${newTopicData.name}) eklendi.`, status: "success" });
            await fetchAllData();
            if (createdTopic && createdTopic.id) {
                setFormState(prev => ({ ...prev, parentId: String(createdTopic.id) })); // Yeni ekleneni Üst Konu yap
            }
            onNewTopicModalClose();
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Konu eklenirken bir hata oluştu.';
            setNewTopicModalError(errorMsg);
            toast({ title: "Konu Ekleme Hatası", description: errorMsg, status: "error" });
        } finally { setIsAddingNewTopicFromModal(false); }
    };   
    const handleFormSubmit = async (e) => {
        e.preventDefault(); setFormError('');
        if (!formState.name.trim()) { setFormError("Konu adı boş bırakılamaz."); return; }
        if (!formState.examClassificationId) { setFormError("Lütfen bir sınav tipi seçin."); return; }
        if (!formState.branchId) { setFormError("Lütfen bir branş seçin."); return; }

        const topicData = {
            name: formState.name.trim(),
            description: formState.description.trim() || null, // Boşsa null gönder
            parentId: formState.parentId === '' ? null : parseInt(formState.parentId, 10),
            examClassificationId: parseInt(formState.examClassificationId, 10),
            branchId: parseInt(formState.branchId, 10)
        };

        if (editingTopic && topicData.parentId === editingTopic.id) {
            setFormError("Bir konu kendisinin üst konusu olamaz.");
            toast({ title: "Hiyerarşi Hatası", description: "Bir konu kendisinin üst konusu olamaz.", status: "error", duration: 5000 });
            return;
        }
        // Daha gelişmiş döngüsel bağımlılık kontrolü (editingTopic'in bir alt konusunu parent yapmasını engelleme)
        if (editingTopic && topicData.parentId) {
            const descendantsOfEditing = getAllDescendantIds(editingTopic.id, allTopicsMap);
            if (descendantsOfEditing.has(topicData.parentId)) {
                 setFormError("Bir konuyu kendi alt konularından birinin altına taşıyamazsınız.");
                 toast({ title: "Hiyerarşi Hatası", description: "Bir konuyu kendi alt konularından birinin altına taşıyamazsınız.", status: "error", duration: 5000 });
                 return;
            }
        }

        setFormLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            let message = '';
            if (editingTopic) {
                await axios.put(`${backendTopicUrl}/${editingTopic.id}`, topicData, config);
                message = 'Konu başarıyla güncellendi!';
            } else {
                await axios.post(backendTopicUrl, topicData, config);
                message = 'Konu başarıyla eklendi!';
            }
            resetForm();
            await fetchAllData(); // Veri setini komple yenile
            toast({ title: "Başarılı", description: message, status: "success", duration: 3000 });
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Konu kaydedilirken bir hata oluştu.';
            setFormError(errorMsg);
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000 });
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = (topic) => {
        setEditingTopic(topic); 
        setFormState({
            name: topic.name || '',
            description: topic.description || '',
            parentId: topic.parentId === null ? '' : String(topic.parentId),
            examClassificationId: topic.examClassificationId === null ? '' : String(topic.examClassificationId),
            branchId: topic.branchId === null ? '' : String(topic.branchId)
        });
        setFormError('');
        formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleAddSubTopic = (parentTopic) => {
        setEditingTopic(null);
        setFormState({
            name: '', description: '',
            parentId: String(parentTopic.id),
            branchId: String(parentTopic.branchId), 
            examClassificationId: String(parentTopic.examClassificationId) 
        });
        setFormError('');
        formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        toast({
            title: "Alt Konu Ekleniyor",
            description: `"${parentTopic.name}" konusuna alt konu eklemek için formu doldurun.`,
            status: "info", duration: 4000, isClosable: true,
        });
    };

    const openItemDeleteConfirmation = (item, type) => { setItemToDelete(item); setDeleteType(type); onDeleteConfirmOpen(); };
    
    const handleDeleteItemConfirm = async () => {
        if (!itemToDelete || !deleteType) return;
        onDeleteConfirmClose();
        setFormLoading(true); // Genel bir form yükleme state'i kullanalım
        let url = '';
        let itemName = itemToDelete.name;
        let itemTypeMsg = '';

        if (deleteType === 'topic') { url = `${backendTopicUrl}/${itemToDelete.id}`; itemTypeMsg = 'Konu'; }
        else if (deleteType === 'branch') { url = `${branchesUrlApi}/${itemToDelete.id}`; itemTypeMsg = 'Branş'; }
        else if (deleteType === 'ec') { url = `${examClassificationsUrlApi}/${itemToDelete.id}`; itemTypeMsg = 'Sınav Tipi';}
        else { toast({ title: "Geçersiz Silme Türü", status: "error" }); setFormLoading(false); return; }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(url, config);
            toast({ title: "Başarılı", description: `${itemTypeMsg} ("${itemName}") silindi.`, status: "success" });
            await fetchAllData();
            if(deleteType === 'topic' && editingTopic && editingTopic.id === itemToDelete.id) resetForm();
        } catch (err) {
            const errorMsg = err.response?.data?.message || `${itemTypeMsg} silinirken bir hata oluştu. Bu öğeyle ilişkili başka veriler olabilir.`;
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 6000 });
        } finally { setItemToDelete(null); setDeleteType(''); setFormLoading(false);}
    };
    const resetForm = () => { setEditingTopic(null); setFormState(initialTopicFormState); setFormError(''); };

    const topicsToDisplay = useMemo(() => {
        if (loading) return []; // Yükleniyorsa boş dizi veya skeleton için farklı bir kontrol
        
        let filtered = topics; // Başlangıçta tüm hiyerarşik konular

        const filterRecursively = (nodes, ecId, brId) => {
            if (!Array.isArray(nodes)) return [];
            return nodes.map(node => {
                // Çocukları önce işle ki, ebeveynin kalıp kalmayacağına karar verilebilsin
                const filteredChildren = node.children ? filterRecursively(node.children, ecId, brId) : [];
                
                const matchesEc = ecId ? node.examClassificationId === ecId : true;
                const matchesBranch = brId ? node.branchId === brId : true;

                if (matchesEc && matchesBranch) {
                    // Eğer bu node filtrelere uyuyorsa, filtrelenmiş çocuklarıyla birlikte döndür
                    return { ...node, children: filteredChildren };
                } else if (filteredChildren.length > 0) {
                    // Eğer bu node filtrelere uymuyor AMA çocuklarından bazıları uyuyorsa,
                    // bu node'u da (soluk veya işaretli) göstermek için döndür, ama çocuklarını da ekle
                    return { ...node, children: filteredChildren, isFilteredParent: true }; 
                }
                return null; // Bu node ve çocukları tamamen filtre dışı
            }).filter(Boolean); // null olanları çıkar
        };

        if (selectedFilterEcId || selectedFilterBranchId) {
            const ecIdNum = selectedFilterEcId ? parseInt(selectedFilterEcId, 10) : null;
            const branchIdNum = selectedFilterBranchId ? parseInt(selectedFilterBranchId, 10) : null;
            filtered = filterRecursively(topics, ecIdNum, branchIdNum);
        }
        // Eğer filtre yoksa, tüm konuları göster.
        // Ana kategorileri (parentId olmayanlar) göstermek için:
        // return filtered.filter(topic => !topic.parentId); 
        // VEYA tüm hiyerarşiyi göstermek için:
        return filtered;

    }, [topics, selectedFilterEcId, selectedFilterBranchId, loading]);

    const renderTopicsRecursive = useCallback((topicsToRender, level = 0) => {
        if (!Array.isArray(topicsToRender)) return null;
        return topicsToRender.map(topic => (
            <Fragment key={topic.id}>
                <TopicNode 
                    topic={topic} 
                    level={level} 
                    onEdit={handleEdit}
                    onAddSubTopic={handleAddSubTopic}
                    onDelete={openItemDeleteConfirmation}
                    isFilteredOut={topic.isFilteredParent && !( (selectedFilterEcId && topic.examClassificationId === parseInt(selectedFilterEcId)) && (selectedFilterBranchId && topic.branchId === parseInt(selectedFilterBranchId)) ) }
                />
                {Array.isArray(topic.children) && topic.children.length > 0 && (
                    renderTopicsRecursive(topic.children, level + 1)
                )}
            </Fragment>
        ));
    }, [handleEdit, handleAddSubTopic, openItemDeleteConfirmation, selectedFilterEcId, selectedFilterBranchId]);


    if (loading && !topics.length && !examClassifications.length && !branches.length) { // Sadece ilk yükleme için tam ekran spinner
        return <Center p={10} minH="70vh"><Spinner size="xl" color="brand.500" thickness="4px" /></Center>;
      }
    
      return (
        <Box p={{base:2, md:4}} borderWidth="1px" borderRadius="xl" borderColor={borderColor} boxShadow="2xl" bg={componentBg}>
          <Heading as="h2" size="lg" display="flex" alignItems="center" gap={3} mb={8} color={headingColor} borderBottomWidth="2px" borderColor={borderColor} pb={3}>
            <Icon as={FaSitemap} color="brand.500" /> İçerik Hiyerarşisi Yönetimi
          </Heading>
          
          {error && ( <Alert status="error" variant="subtle" borderRadius="md" mb={6} boxShadow="md"> <AlertIcon as={FaExclamationTriangle} /> {error} </Alert> )}
    
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{base:4, md:6}} mb={8}>
            <Card variant="outline" bg={listManagementBoxBg} borderColor={borderColor} borderRadius="lg" boxShadow="md">
              <CardHeader pb={2}>
                <Flex justifyContent="space-between" alignItems="center">
                    <Heading size="md" display="flex" alignItems="center" color={headingColor}><Icon as={FaBook} mr={2} color="green.400"/>Sınav Türleri</Heading>
                    <Button size="sm" colorScheme="green" variant="outline" leftIcon={<FaPlus />} onClick={() => { setCurrentEc({id: null, name: ''}); onEcModalOpen();}}>Yeni Ekle</Button>
                </Flex>
              </CardHeader>
              <CardBody pt={2} px={2}>
                <VStack spacing={1} align="stretch" maxHeight="250px" overflowY="auto" pr={2} sx={{ '&::-webkit-scrollbar': { width: '5px'}, '&::-webkit-scrollbar-thumb': { background: useColorModeValue('gray.300','gray.600'), borderRadius: '10px' }}}>
                    {examClassifications.length === 0 && <Text fontSize="sm" color={textMutedColor} textAlign="center" py={2}>Sınav tipi bulunmuyor.</Text>}
                    {examClassifications.map(ec => (
                        <Flex key={ec.id} justifyContent="space-between" alignItems="center" p={2} _hover={{bg: topicNodeHoverBg}} borderRadius="md">
                            <Text fontSize="sm" color={textColor}>{ec.name}</Text>
                            <HStack spacing={1}>
                                <Tooltip label="Düzenle" fontSize="xs"><IconButton icon={<FaEdit/>} size="xs" variant="ghost" colorScheme="blue" onClick={() => {setCurrentEc(ec); onEcModalOpen();}}/></Tooltip>
                                <Tooltip label="Sil" fontSize="xs"><IconButton icon={<FaTrashAlt/>} size="xs" variant="ghost" colorScheme="red" onClick={() => openItemDeleteConfirmation(ec, 'ec')}/></Tooltip>
                            </HStack>
                        </Flex>
                    ))}
                </VStack>
              </CardBody>
            </Card>
    
            <Card variant="outline" bg={listManagementBoxBg} borderColor={borderColor} borderRadius="lg" boxShadow="md">
              <CardHeader pb={2}>
                <Flex justifyContent="space-between" alignItems="center">
                    <Heading size="md" display="flex" alignItems="center" color={headingColor}><Icon as={FaBuilding} mr={2} color="purple.400"/>Branşlar</Heading>
                    <Button
  size="sm"
  colorScheme="purple"
  variant="outline"
  leftIcon={<FaPlus />}
  onClick={() => {
    setCurrentBranch({ id: null, name: '', examClassificationId: '' }); // <-- eksik alan eklendi
    onBranchModalOpen();
  }}
>
  Yeni Ekle
</Button>
                </Flex>
              </CardHeader>
              <CardBody pt={2} px={2}>
                 <VStack spacing={1} align="stretch" maxHeight="250px" overflowY="auto" pr={2} sx={{ '&::-webkit-scrollbar': { width: '5px'}, '&::-webkit-scrollbar-thumb': { background: useColorModeValue('gray.300','gray.600'), borderRadius: '10px' }}}>
                    {branches.length === 0 && <Text fontSize="sm" color={textMutedColor} textAlign="center" py={2}>Branş bulunmuyor.</Text>}
                    {branches.map(b => (
                        <Flex key={b.id} justifyContent="space-between" alignItems="center" p={1.5} _hover={{bg: topicNodeHoverBg}} borderRadius="md">
                            <Text fontSize="sm" color={textColor}>{b.name} <Text as="span" fontSize="xs" color={textMutedColor}>({examClassifications.find(ec => ec.id === b.examClassificationId)?.name || 'Genel'})</Text></Text>
                            <HStack spacing={1}>
                                <Tooltip label="Düzenle" fontSize="xs"><IconButton icon={<FaEdit/>} size="xs" variant="ghost" colorScheme="blue" onClick={() => {setCurrentBranch(b); onBranchModalOpen();}}/></Tooltip>
                                <Tooltip label="Sil" fontSize="xs"><IconButton icon={<FaTrashAlt/>} size="xs" variant="ghost" colorScheme="red" onClick={() => openItemDeleteConfirmation(b, 'branch')}/></Tooltip>
                            </HStack>
                        </Flex>
                    ))}
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
    
          <Box ref={formSectionRef} id="topic-form-section" as="form" onSubmit={handleFormSubmit} p={{base:4, md:6}} borderWidth="1px" borderRadius="xl" borderColor={topicFormBorder} bg={topicFormBg} mb={8} boxShadow="xl">
              <Heading as="h4" size="lg" mb={6} color={headingColor} borderBottomWidth="1px" borderColor={borderColor} pb={3}>
                {editingTopic ? `Konu/Kategori Düzenle: "${editingTopic.name}" (ID: ${editingTopic.id})` : 'Yeni Konu/Kategori Ekle'}
              </Heading>
              {formError && <Alert status="error" variant="subtle" borderRadius="md" mb={4}><AlertIcon as={FaExclamationTriangle} />{formError}</Alert>}
              <VStack spacing={5}>
                  <SimpleGrid columns={{base: 1, md: 2}} spacing={5} w="full">
                    <FormControl isRequired id="topicExamClassification" isInvalid={!!formError && formError.includes('Sınav tipi')}>
                        <FormLabel fontSize="sm" fontWeight="medium" color={textColor}>Sınav Tipi</FormLabel>
                        <Select name="examClassificationId" value={formState.examClassificationId} onChange={handleInputChange} placeholder="-- Sınav Tipi Seçin --" bg={inputSelectBg} focusBorderColor="brand.400">
                            {examClassifications.map(ec => (<option key={ec.id} value={ec.id}>{ec.name}</option>))}
                        </Select>
                         {!!formError && formError.includes('Sınav tipi') && <FormErrorMessage>Lütfen bir sınav tipi seçin.</FormErrorMessage>}
                    </FormControl>
                    <FormControl isRequired id="topicBranch" isInvalid={!!formError && formError.includes('Branş')}>
                        <FormLabel fontSize="sm" fontWeight="medium" color={textColor}>Branş</FormLabel>
                         <Select name="branchId" value={formState.branchId} onChange={handleInputChange} placeholder="-- Branş Seçin --" isDisabled={!formState.examClassificationId || filteredBranchesForForm.length === 0} bg={inputSelectBg} focusBorderColor="brand.400">
                            {filteredBranchesForForm.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
                        </Select>
                        {!formState.examClassificationId && <Text fontSize="xs" color={textMutedColor} mt={1}>Branş seçebilmek için önce Sınav Tipi seçin.</Text>}
                        {formState.examClassificationId && filteredBranchesForForm.length === 0 && <Text fontSize="xs" color="red.400" mt={1}>Seçili Sınav Tipi için tanımlı branş yok. Önce branş ekleyin.</Text>}
                    </FormControl>
                  </SimpleGrid>
                  <FormControl isRequired id="topicName" isInvalid={!!formError && formError.includes('Konu adı')}>
                      <FormLabel fontSize="sm" fontWeight="medium" color={textColor}>Konu/Kategori Adı</FormLabel>
                      <Input name="name" value={formState.name} onChange={handleInputChange} bg={inputSelectBg} focusBorderColor="brand.400"/>
                      {!!formError && formError.includes('Konu adı') && <FormErrorMessage>Konu adı boş olamaz.</FormErrorMessage>}
                  </FormControl>
                  <FormControl id="topicParent">
                      <FormLabel fontSize="sm" fontWeight="medium" color={textColor}>Üst Konu/Kategori (Opsiyonel)</FormLabel>
                       <InputGroup>
                          <Select
                              name="parentId" value={formState.parentId} onChange={handleInputChange}
                              placeholder="-- Yok (Ana Kategori Olacak) --"
                              isDisabled={!formState.branchId || !formState.examClassificationId} bg={inputSelectBg} focusBorderColor="brand.400"
                          >
                              {parentTopicOptions.map(o => (<option key={o.id} value={o.id}>{o.name}</option>))}
                          </Select>
                          <InputRightElement width="auto" mr={1}>
                              <Tooltip label="Mevcut üst konu altına veya ana kategori olarak hızlıca yeni bir konu/kategori ekle" fontSize="xs">
                                <Button h="1.75rem" size="sm" onClick={onNewTopicModalOpen} isDisabled={!formState.branchId || !formState.examClassificationId} leftIcon={<FaPlus/>} colorScheme="gray" variant="outline">
                                    Hızlı Ekle
                                </Button>
                              </Tooltip>
                          </InputRightElement>
                      </InputGroup>
                       {(!formState.branchId || !formState.examClassificationId) && <Text fontSize="xs" color={textMutedColor} mt={1}>Üst konu seçmek veya yeni konu eklemek için Sınav Tipi ve Branş seçilmelidir.</Text>}
                  </FormControl>
                  <FormControl id="topicDescription">
                      <FormLabel fontSize="sm" fontWeight="medium" color={textColor}>Açıklama (Opsiyonel)</FormLabel>
                      <Textarea name="description" value={formState.description} onChange={handleInputChange} rows={3} bg={inputSelectBg} focusBorderColor="brand.400"/>
                  </FormControl>
                  <HStack spacing={4} mt={6} alignSelf="flex-start">
                      <Button type="submit" colorScheme="brand" leftIcon={<Icon as={FaSave}/>} isLoading={formLoading} loadingText={editingTopic ? 'Güncelleniyor...' : 'Ekleniyor...'}>
                          {editingTopic ? 'Değişiklikleri Kaydet' : 'Yeni Konu Ekle'}
                      </Button>
                      {(editingTopic || formState.name || formState.description || formState.branchId || formState.parentId || formState.examClassificationId) && (
                          <Button variant="outline" onClick={resetForm} leftIcon={<Icon as={FaTimesCircle}/>} isDisabled={formLoading}>Formu Temizle/İptal</Button>
                      )}
                  </HStack>
              </VStack>
          </Box>
    
          <Divider my={8} borderColor={borderColor}/>
    
          <Heading as="h4" size="lg" mt={8} mb={6} color={headingColor} display="flex" alignItems="center">
            <Icon as={FaFilter} mr={2} color="brand.400" /> Mevcut Konu Hiyerarşisi
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
              <FormControl id="filterEc">
                  <FormLabel fontSize="sm" color={textMutedColor} fontWeight="medium">Sınav Tipine Göre Filtrele:</FormLabel>
                  <Select placeholder="Tüm Sınav Tipleri" value={selectedFilterEcId} onChange={(e) => { setSelectedFilterEcId(e.target.value); setSelectedFilterBranchId(''); }} bg={inputSelectBg} focusBorderColor="brand.400">
                      {examClassifications.map(ec => <option key={ec.id} value={ec.id}>{ec.name}</option>)}
                  </Select>
              </FormControl>
              <FormControl id="filterBranch">
                  <FormLabel fontSize="sm" color={textMutedColor} fontWeight="medium">Branşa Göre Filtrele:</FormLabel>
                  <Select placeholder="Tüm Branşlar" value={selectedFilterBranchId} onChange={(e) => setSelectedFilterBranchId(e.target.value)} isDisabled={!selectedFilterEcId || branches.filter(b => Number(b.examClassificationId) === Number(selectedFilterEcId)).length === 0} bg={inputSelectBg} focusBorderColor="brand.400">
                      {branches.filter(b => selectedFilterEcId ? Number(b.examClassificationId) === Number(selectedFilterEcId) : true)
                               .map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </Select>
                  {!selectedFilterEcId && <Text fontSize="xs" color={textMutedColor} mt={1}>Branşları görmek için önce Sınav Tipi seçin.</Text>}
                  {selectedFilterEcId && branches.filter(b => Number(b.examClassificationId) === Number(selectedFilterEcId)).length === 0 && <Text fontSize="xs" color="red.400" mt={1}>Seçili Sınav Tipine ait branş bulunmuyor.</Text>}
              </FormControl>
          </SimpleGrid>
          <Button size="sm" onClick={fetchAllData} isLoading={loading} leftIcon={<FaSync />} mb={4} variant="outline">Listeyi Yenile</Button>
    
    
          {loading && topicsToDisplay.length === 0 ? (<Center p={5}><Spinner color="brand.500"/></Center>) : 
           !loading && topicsToDisplay.length === 0 && (selectedFilterEcId || selectedFilterBranchId) ? ( 
              <Alert status="info" variant="subtle" borderRadius="md" boxShadow="sm"> <AlertIcon as={FaInfoCircle} /> Seçili filtrelere uygun konu/kategori bulunamadı.</Alert>
          ) : !loading && topicsToDisplay.length === 0 ? (
              <Alert status="info" variant="subtle" borderRadius="md" boxShadow="sm"> <AlertIcon as={FaInfoCircle} /> Gösterilecek konu/kategori yok. Lütfen yukarıdan filtre seçin veya yeni içerik ekleyin.</Alert>
          ) : (
              <Box borderWidth="1px" borderRadius="lg" borderColor={borderColor} bg={componentBg} maxH={{base:"500px", md:"700px"}} overflowY="auto" boxShadow="md"
                sx={{ '&::-webkit-scrollbar': { width: '6px'}, '&::-webkit-scrollbar-thumb': { background: useColorModeValue('gray.300','gray.600'), borderRadius: '10px' }}}>
                  {renderTopicsRecursive(topicsToDisplay, 0)}
              </Box>
          )}
    
          <Modal isOpen={isEcModalOpen} onClose={onEcModalClose} isCentered>
              <ModalOverlay/><ModalContent bg={componentBg}><ModalHeader>Sınav Tipini {currentEc.id ? 'Düzenle' : 'Ekle'}</ModalHeader><ModalCloseButton />
                  <ModalBody pb={6}><FormControl isInvalid={!!ecError} isRequired><FormLabel>Sınav Tipi Adı:</FormLabel><Input value={currentEc.name} onChange={handleEcInputChange} placeholder="Örn: TUS, DUS" bg={inputSelectBg}/>{ecError && <FormErrorMessage>{ecError}</FormErrorMessage>}</FormControl></ModalBody>
                  <ModalFooter><Button variant='ghost' mr={3} onClick={onEcModalClose}>İptal</Button><Button colorScheme='green' onClick={handleSaveEc} isLoading={isSavingEc}>Kaydet</Button></ModalFooter>
              </ModalContent>
          </Modal>
<Modal isOpen={isBranchModalOpen} onClose={onBranchModalClose} isCentered>
  <ModalOverlay />
  <ModalContent bg={componentBg}>
    <ModalHeader>Branşı {currentBranch.id ? 'Düzenle' : 'Ekle'}</ModalHeader>
    <ModalCloseButton />
    <ModalBody pb={6}>
      <VStack spacing={4}>
        <FormControl isRequired>
          <FormLabel fontSize="sm">Bağlı Olduğu Sınav Tipi:</FormLabel>
          <Select
            placeholder="-- Sınav Tipi Seçin --"
            value={currentBranch.examClassificationId || ''}
            onChange={(e) => setCurrentBranch(prev => ({ ...prev, examClassificationId: parseInt(e.target.value, 10) }))}
            bg={inputSelectBg}
            focusBorderColor="purple.400"
          >
            {examClassifications.map(ec => (
              <option key={ec.id} value={ec.id}>{ec.name}</option>
            ))}
          </Select>
        </FormControl>

        <FormControl isInvalid={!!branchError} isRequired>
          <FormLabel>Branş Adı:</FormLabel>
          <Input
            value={currentBranch.name}
            onChange={handleBranchInputChange}
            placeholder="Örn: Kardiyoloji"
            bg={inputSelectBg}
            focusBorderColor="purple.400"
          />
          {branchError && <FormErrorMessage>{branchError}</FormErrorMessage>}
        </FormControl>
      </VStack>
    </ModalBody>
    <ModalFooter>
      <Button variant='ghost' mr={3} onClick={onBranchModalClose}>İptal</Button>
      <Button colorScheme='purple' onClick={handleSaveBranch} isLoading={isSavingBranch}>Kaydet</Button>
    </ModalFooter>
  </ModalContent>
</Modal>
          <Modal isOpen={isNewTopicModalOpen} onClose={onNewTopicModalClose} isCentered>
               <ModalOverlay/><ModalContent bg={componentBg}><ModalHeader>Hızlı Yeni Konu/Kategori Ekle</ModalHeader><ModalCloseButton />
                  <ModalBody pb={6}><VStack spacing={4}>
                      <Text fontSize="sm" color={textMutedColor} w="full">
                          Bu öğe, ana formda seçili olan Sınav Tipi: <Text as="span" fontWeight="bold">"{examClassifications.find(ec=>ec.id === parseInt(formState.examClassificationId))?.name || 'Seçilmedi'}"</Text>
                          ve Branş: <Text as="span" fontWeight="bold">"{branches.find(b=>b.id === parseInt(formState.branchId))?.name || 'Seçilmedi'}"</Text> altına eklenecektir.
                          {formState.parentId && allTopicsFlat.find(t=>t.id === parseInt(formState.parentId)) ? 
                          ` Üst konusu: "${allTopicsFlat.find(t=>t.id === parseInt(formState.parentId))?.name?.trim() || 'Seçili Üst Konu'}" olacaktır.` : 
                          ' Bu bir ana kategori olarak eklenecektir.'}
                      </Text>
                      <FormControl isRequired id="newTopicNameModal" isInvalid={!!newTopicModalError && newTopicModalError.includes('Konu adı')}><FormLabel>Yeni Konu/Kategori Adı:</FormLabel><Input name="name" value={newTopicModalFormData.name} onChange={handleNewTopicModalInputChange} placeholder="Yeni konu/kategori adı" bg={inputSelectBg}/>{!!newTopicModalError && newTopicModalError.includes('Konu adı') && <FormErrorMessage>{newTopicModalError}</FormErrorMessage>}</FormControl>
                      <FormControl id="newTopicDescriptionModal"><FormLabel>Açıklama (Opsiyonel):</FormLabel><Textarea name="description" value={newTopicModalFormData.description} onChange={handleNewTopicModalInputChange} placeholder="Açıklama" bg={inputSelectBg}/></FormControl>
                      {!!newTopicModalError && !newTopicModalError.includes('Konu adı') && <Alert status="error" size="sm" variant="subtle" borderRadius="md"><AlertIcon as={FaExclamationTriangle}/>{newTopicModalError}</Alert>}
                  </VStack></ModalBody>
                  <ModalFooter><Button variant='ghost' mr={3} onClick={onNewTopicModalClose}>İptal</Button><Button colorScheme='blue' onClick={handleSaveNewTopicFromModal} isLoading={isAddingNewTopicFromModal}>Ekle ve Üst Konu Olarak Seç</Button></ModalFooter>
              </ModalContent>
          </Modal>
    
          <Modal isOpen={isDeleteConfirmOpen} onClose={onDeleteConfirmClose} isCentered>
              <ModalOverlay />
              <ModalContent bg={componentBg}>
                  <ModalHeader color={headingColor}>{deleteType === 'topic' ? 'Konu' : deleteType === 'branch' ? 'Branş' : 'Sınav Tipi'} Silme Onayı</ModalHeader><ModalCloseButton />
                  <ModalBody>
                      <Text mb={2}>
                        {deleteType === 'topic' && `"${itemToDelete?.name}" (ID: ${itemToDelete?.id}) başlıklı konuyu/kategoriyi silmek istediğinizden emin misiniz?`}
                        {deleteType === 'branch' && `"${itemToDelete?.name}" (ID: ${itemToDelete?.id}) başlıklı branşı silmek istediğinizden emin misiniz? Bu branşa bağlı tüm konular da silinecektir.`}
                        {deleteType === 'ec' && `"${itemToDelete?.name}" (ID: ${itemToDelete?.id}) başlıklı sınav tipini silmek istediğinizden emin misiniz? Bu sınav tipine bağlı tüm branşlar ve konular da silinecektir.`}
                      </Text>
                      <Text fontWeight="bold" color="red.500">Bu işlem geri alınamaz ve ilişkili tüm alt öğeler (alt konular, dersler, sorular) de kalıcı olarak silinebilir!</Text>
                  </ModalBody>
                  <ModalFooter>
                      <Button variant='ghost' mr={3} onClick={onDeleteConfirmClose} isDisabled={formLoading}>İptal</Button>
                      <Button colorScheme='red' onClick={handleDeleteItemConfirm} isLoading={formLoading}> Evet, Sil </Button>
                  </ModalFooter>
              </ModalContent>
          </Modal>
        </Box>
      );
    }
    
    export default TopicManagement;