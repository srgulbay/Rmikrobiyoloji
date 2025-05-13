import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { Editor } from '@tinymce/tinymce-react';
import DOMPurify from 'dompurify';
import {
    Box, Center, Heading,
    Spinner, Alert, AlertIcon, useToast, useDisclosure,
    Button, IconButton, Icon, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
    Select, FormControl, FormLabel, Input, Textarea, SimpleGrid,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    VStack, HStack, Text,
    useColorModeValue, FormErrorMessage, Tooltip
} from '@chakra-ui/react';
import {
    FaQuestionCircle, FaEdit, FaTrashAlt, FaSave, FaTimesCircle, FaUpload, FaExclamationTriangle
} from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const findTopicByIdRecursive = (nodes, targetId) => {
    for (const node of nodes) {
        if (node.id === targetId) {
            return node;
        }
        if (node.children && node.children.length > 0) {
            const found = findTopicByIdRecursive(node.children, targetId);
            if (found) {
                return found;
            }
        }
    }
    return null;
};

function QuestionManagement({ token }) {
    // === 1. State Hooks ===
    const [questions, setQuestions] = useState([]);
    const [topicsTree, setTopicsTree] = useState([]);
    const [branches, setBranches] = useState([]);
    const [examClassifications, setExamClassifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [editingQuestion, setEditingQuestion] = useState(null);
    const initialFormState = { 
        text: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '', 
        correctAnswer: '', classification: 'Çalışma Sorusu', imageUrl: '', 
        explanation: '', examClassificationId: '', branchId: '', 
        selectedKonuId: '', selectedAltKonuId: ''
    };
    const [formState, setFormState] = useState(initialFormState);
    const [isUploading, setIsUploading] = useState(false);
    const [bulkInput, setBulkInput] = useState('');
    const [bulkError, setBulkError] = useState('');
    const [bulkSuccess, setBulkSuccess] = useState('');
    const [bulkLoading, setBulkLoading] = useState(false);
    const [questionToDelete, setQuestionToDelete] = useState(null);

    // === 2. Ref Hooks ===
    const questionEditorRef = useRef(null);
    const explanationEditorRef = useRef(null);
    const formSectionRef = useRef(null);

    // === 3. Context/Chakra UI Hooks ===
    const toast = useToast();
    const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
    
    // Style Hooks
    const questionFormBg = useColorModeValue('orange.50', 'orange.900');
    const questionFormBorder = useColorModeValue('orange.200', 'orange.700');
    const bulkBoxBorder = useColorModeValue('gray.300', 'gray.600');
    const bulkBoxBg = useColorModeValue("gray.50", "gray.850");
    const tinySkin = useColorModeValue("oxide", "oxide-dark");
    const tinyContentCss = useColorModeValue("default", "dark");
    const inputSelectBg = useColorModeValue("white", "gray.700");
    const editorBg = useColorModeValue("white", "gray.800");
    const tableHeaderBg = useColorModeValue("gray.100", "gray.750");
    const tableRowHoverBg = useColorModeValue("gray.50", "gray.800");
    const componentBg = useColorModeValue("white", "gray.800"); 
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const headingColor = useColorModeValue("gray.700", "gray.200");
    const textColorMuted = useColorModeValue("gray.500", "gray.400");


    // === 4. Memoization Hooks (useMemo) ===
    const konuOptionsForForm = useMemo(() => {
        if (!formState.examClassificationId || !formState.branchId || !topicsTree) return [];
        const ecIdNum = parseInt(formState.examClassificationId);
        const branchIdNum = parseInt(formState.branchId);
        let options = [];
        const buildOptions = (nodes, level = 0) => {
            if (!Array.isArray(nodes)) return;
            nodes.forEach(node => {
                if (node.examClassificationId === ecIdNum && node.branchId === branchIdNum) {
                    options.push({
                        id: node.id,
                        name: '\u00A0'.repeat(level * 4) + node.name,
                    });
                    if (Array.isArray(node.children)) {
                        buildOptions(node.children, level + 1);
                    }
                } else if (Array.isArray(node.children)) {
                     buildOptions(node.children, level);
                }
            });
        };
        buildOptions(topicsTree, 0);
        return options;
    }, [topicsTree, formState.examClassificationId, formState.branchId]);

    const altKonuOptions = useMemo(() => {
        if (!formState.selectedKonuId || !topicsTree) return [];
        const selectedKonu = findTopicByIdRecursive(topicsTree, parseInt(formState.selectedKonuId));
        if (selectedKonu && selectedKonu.children && selectedKonu.children.length > 0) {
            return selectedKonu.children.map(child => ({ id: child.id, name: child.name }));
        }
        return [];
    }, [formState.selectedKonuId, topicsTree]);

    // === 5. Callback Hooks (useCallback) ===
    const fetchData = useCallback(async () => {
        setLoading(true); setError('');
        if (!token) {
            setError("Yetkilendirme token'ı bulunamadı.");
            setLoading(false); return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [questionsRes, topicsRes, classificationsRes, branchesRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/questions`, config),
                axios.get(`${API_BASE_URL}/api/topics`, config),
                axios.get(`${API_BASE_URL}/api/exam-classifications`, config),
                axios.get(`${API_BASE_URL}/api/branches`, config)
            ]);
            setQuestions(Array.isArray(questionsRes.data) ? questionsRes.data : []);
            setTopicsTree(Array.isArray(topicsRes.data) ? topicsRes.data : []);
            setExamClassifications(Array.isArray(classificationsRes.data) ? classificationsRes.data : []);
            setBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []);
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Veriler yüklenirken bir hata oluştu.';
            setError(errorMsg);
            toast({ title: "Veri Yükleme Hatası", description: errorMsg, status: "error", duration: 3000, isClosable: true });
        } finally {
            setLoading(false);
        }
    }, [token, toast]);

    const resetForm = useCallback(() => {
        setEditingQuestion(null); 
        setFormState(initialFormState); 
        setFormError('');
        if (questionEditorRef.current) questionEditorRef.current.setContent('');
        if (explanationEditorRef.current) explanationEditorRef.current.setContent('');
    }, []); // initialFormState dışarıda tanımlı ve sabit olduğu için bağımlılık boş olabilir.

    const handleFormSubmit = useCallback(async (e) => {
        e.preventDefault(); 
        setFormError('');
        const finalTopicId = formState.selectedAltKonuId || formState.selectedKonuId;

        if (!finalTopicId) { setFormError('Lütfen bir konu (veya varsa alt konu) seçin.'); return; }
        if (!formState.examClassificationId) { setFormError('Lütfen bir sınav sınıflandırması seçin.'); return; }
        if (!formState.branchId) { setFormError('Lütfen bir branş seçin.'); return; }
        
        const questionTextContent = questionEditorRef.current ? questionEditorRef.current.getContent() : formState.text;
        const explanationContent = explanationEditorRef.current ? explanationEditorRef.current.getContent() : formState.explanation;

        if (!questionTextContent || questionTextContent.trim() === '<p><br data-mce-bogus="1"></p>' || questionTextContent.trim() === '<p><br></p>') {
            setFormError('Soru Metni zorunludur.'); return;
        }
        if (!formState.optionA.trim() || !formState.optionB.trim() || !formState.optionC.trim() || !formState.optionD.trim() || !formState.optionE.trim() || !formState.correctAnswer) {
            setFormError('Lütfen Seçenekler (A-E) ve Doğru Cevap alanlarını doldurun.'); return;
        }
        const questionData = {
            text: questionTextContent,
            optionA: formState.optionA, optionB: formState.optionB, optionC: formState.optionC,
            optionD: formState.optionD, optionE: formState.optionE,
            correctAnswer: formState.correctAnswer,
            classification: formState.classification,
            imageUrl: formState.imageUrl.trim() === '' ? null : formState.imageUrl.trim(),
            explanation: (explanationContent && explanationContent.trim() !== '<p><br data-mce-bogus="1"></p>' && explanationContent.trim() !== '<p><br></p>') ? explanationContent : null,
            topicId: parseInt(finalTopicId),
            examClassificationId: parseInt(formState.examClassificationId),
        };
        const config = { headers: { Authorization: `Bearer ${token}` } };
        setBulkLoading(true); // Genel bir saving state gibi kullanılabilir veya ayrı bir isSaving state
        try {
            let message = '';
            if (editingQuestion) {
                await axios.put(`<span class="math-inline">\{API\_BASE\_URL\}/api/questions/</span>{editingQuestion.id}`, questionData, config);
                message = 'Soru güncellendi!';
            } else {
                await axios.post(`${API_BASE_URL}/api/questions`, questionData, config);
                message = 'Soru eklendi!';
            }
            resetForm();
            await fetchData(); 
            toast({ title: "Başarılı", description: message, status: "success", duration: 3000, isClosable: true });
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Soru kaydedilirken bir hata oluştu.';
            setFormError(errorMsg);
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        } finally {
            setBulkLoading(false);
        }
    }, [token, formState, editingQuestion, toast, fetchData, resetForm]);

    const handleEdit = useCallback((question) => {
        setEditingQuestion(question);
        let topicBranchId = '';
        let mainTopicForEdit = '';
        let subTopicForEdit = '';

        if (question.topicId && topicsTree.length > 0) {
            const targetTopicNode = findTopicByIdRecursive(topicsTree, question.topicId);
            if (targetTopicNode) {
                topicBranchId = String(targetTopicNode.branchId || '');
                const parentOfTarget = targetTopicNode.parentId ? findTopicByIdRecursive(topicsTree, targetTopicNode.parentId) : null;
                if (parentOfTarget && parentOfTarget.examClassificationId === targetTopicNode.examClassificationId && parentOfTarget.branchId === targetTopicNode.branchId) {
                    mainTopicForEdit = String(parentOfTarget.id);
                    subTopicForEdit = String(targetTopicNode.id);
                } else {
                    mainTopicForEdit = String(targetTopicNode.id);
                    subTopicForEdit = '';
                }
            }
        }
        setFormState({
            text: question.text || '',
            optionA: question.optionA || '', optionB: question.optionB || '', optionC: question.optionC || '',
            optionD: question.optionD || '', optionE: question.optionE || '',
            correctAnswer: question.correctAnswer || '',
            classification: question.classification || 'Çalışma Sorusu',
            imageUrl: question.imageUrl || '',
            explanation: question.explanation || '',
            examClassificationId: question.examClassificationId ? String(question.examClassificationId) : '',
            branchId: topicBranchId,
            selectedKonuId: mainTopicForEdit, 
            selectedAltKonuId: subTopicForEdit 
        });
        setFormError('');
        if (questionEditorRef.current) questionEditorRef.current.setContent(question.text || '');
        if (explanationEditorRef.current) explanationEditorRef.current.setContent(question.explanation || '');
        formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [topicsTree]);

    const handleDeleteConfirm = useCallback(async () => { 
        if (!questionToDelete) return;
        onDeleteConfirmClose();
        setBulkLoading(true); // Genel bir saving state
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`<span class="math-inline">\{API\_BASE\_URL\}/api/questions/</span>{questionToDelete.id}`, config);
            toast({ title: "Başarılı", description: `Soru (ID: ${questionToDelete.id}) silindi.`, status: "success", duration: 3000, isClosable: true });
            await fetchData(); 
            if(editingQuestion && editingQuestion.id === questionToDelete.id) resetForm();
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Soru silinirken bir hata oluştu.';
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        } finally { 
            setQuestionToDelete(null); 
            setBulkLoading(false);
        }
    }, [token, questionToDelete, editingQuestion, toast, onDeleteConfirmClose, fetchData, resetForm]);

    const handleImageUpload = useCallback((blobInfo, progress) => new Promise((resolve, reject) => {
        if (!token) { reject('Yetkilendirme tokenı bulunamadı.'); return; }
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', blobInfo.blob(), blobInfo.filename());
        axios.post(`${API_BASE_URL}/api/upload/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (res.data?.location) {
                const imageUrl = res.data.location.startsWith('http') ? res.data.location : API_BASE_URL + res.data.location;
                resolve(imageUrl);
            } else { reject('Sunucudan geçersiz cevap formatı.'); }
        })
        .catch(err => {
            const errorMsg = err.response?.data?.message || err.message || 'Resim yüklenemedi.';
            reject(`HTTP Error: ${err.response?.status || 'Bilinmeyen'} - ${errorMsg}`);
        })
        .finally(() => { setIsUploading(false); });
    }), [token]);
    
    // === 6. useEffect Hooks ===
    useEffect(() => { fetchData(); }, [fetchData]);

    // === Regular Functions (Not Hooks) ===
    const handleFormInputChange = (e) => { 
        const { name, value } = e.target; 
        setFormState(prev => ({ ...prev, [name]: value })); 
        if (name === 'examClassificationId') {
            setFormState(prev => ({ ...prev, branchId: '', selectedKonuId: '', selectedAltKonuId: '' }));
        } else if (name === 'branchId') {
            setFormState(prev => ({ ...prev, selectedKonuId: '', selectedAltKonuId: '' }));
        } else if (name === 'selectedKonuId') {
            setFormState(prev => ({ ...prev, selectedAltKonuId: '' }));
        }
    };
    const handleQuestionEditorChange = (content) => { setFormState(prev => ({ ...prev, text: content })); };
    const handleExplanationEditorChange = (content) => { setFormState(prev => ({ ...prev, explanation: content })); };
    const openDeleteConfirmation = (question) => { setQuestionToDelete(question); onDeleteConfirmOpen(); };
    const stripHtml = (html) => { 
        if (!html) return '';
        const cleanHtml = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
        const doc = new DOMParser().parseFromString(cleanHtml, 'text/html');
        return doc.body.textContent || "";
    };
    const handleBulkSubmit = async () => { 
        setBulkError(''); setBulkSuccess(''); setBulkLoading(true);
        let questionsArray;
        try {
            questionsArray = JSON.parse(bulkInput);
            if (!Array.isArray(questionsArray)) throw new Error("Veri bir JSON dizisi olmalı.");
        } catch (parseError) {
            setBulkError(`Geçersiz JSON formatı: ${parseError.message}`);
            setBulkLoading(false); return;
        }
        if (questionsArray.length === 0) {
            setBulkError('Eklenecek soru bulunamadı.');
            setBulkLoading(false); return;
        }
        const questionsToCreate = [];
        const validationErrors = []; 
        const topicsFlatMap = new Map();
        const flattenForValidation = (nodes, map = new Map()) => {
            if (!Array.isArray(nodes)) return map;
            nodes.forEach(node => {
                map.set(node.id, {branchId: node.branchId, examClassificationId: node.examClassificationId });
                if (Array.isArray(node.children)) flattenForValidation(node.children, map);
            });
            return map;
        };
        flattenForValidation(topicsTree, topicsFlatMap);

        for (let i = 0; i < questionsArray.length; i++) {
            const q = questionsArray[i];
            if (!q.text || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.optionE || !q.correctAnswer || !q.topicId || !q.examClassificationId) {
                validationErrors.push({ index: i, error: `Zorunlu alanlar eksik.` }); continue;
            }
            const topicIdNum = parseInt(q.topicId, 10);
            const examClassificationIdNum = parseInt(q.examClassificationId, 10);
            if (isNaN(topicIdNum) || !topicsFlatMap.has(topicIdNum)) {
                validationErrors.push({ index: i, error: `Geçersiz konu ID (${q.topicId}).` }); continue;
            }
            if (isNaN(examClassificationIdNum) || !examClassifications.find(ec => ec.id === examClassificationIdNum)) {
                validationErrors.push({ index: i, error: `Geçersiz sınav tipi ID (${q.examClassificationId}).`}); continue;
            }
            const topicDetails = topicsFlatMap.get(topicIdNum);
            if (topicDetails.examClassificationId !== examClassificationIdNum) {
                 validationErrors.push({ index: i, error: `Konu (<span class="math-inline">\{topicIdNum\}\) ile Sınav Tipi \(</span>{examClassificationIdNum}) uyuşmuyor.` }); continue;
            }
            questionsToCreate.push({
                text: q.text, optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD, optionE: q.optionE,
                correctAnswer: String(q.correctAnswer).toUpperCase(),
                classification: q.classification || 'Çalışma Sorusu',
                topicId: topicIdNum,
                imageUrl: q.imageUrl || null,
                explanation: q.explanation || null,
                examClassificationId: examClassificationIdNum
            });
        }
        if (validationErrors.length > 0 && questionsToCreate.length === 0) {
             setBulkError(`Geçerli soru yok. Hatalar: ${validationErrors.map(e=> `[Sıra ${e.index+1}]: ${e.error}`).join('; ')}`);
             setBulkLoading(false); return;
        }
         if (validationErrors.length > 0 && questionsToCreate.length > 0) {
            toast({ title: "Bazı Sorular Atlandı", description: `${validationErrors.length} soru hatalı. ${questionsToCreate.length} soru gönderilecek.`, status: "warning", duration: 7000, isClosable: true});
            setBulkError(`Atlanan hatalı sorular: ${validationErrors.map(e=> `[Sıra ${e.index+1}]: ${e.error}`).join('; ')}.`);
        } else { setBulkError(''); }

        if (questionsToCreate.length > 0) {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const response = await axios.post(`${API_BASE_URL}/api/questions/bulk`, questionsToCreate, config);
                const addedCount = response.data.addedCount || 0;
                let successMsg = response.data.message || `${addedCount} soru başarıyla eklendi.`;
                if (response.data.validationErrors && response.data.validationErrors.length > 0) {
                     const backendErrorDetails = response.data.validationErrors.map(e => `[${e.index +1}]: ${e.error}`).join('; ');
                     setBulkError(prev => `${prev ? prev + ' | ' : ''}Sunucu Hataları: ${backendErrorDetails}`);
                     successMsg = `${addedCount} eklendi, ${response.data.validationErrors.length} sunucu hatası.`;
                }
                setBulkSuccess(successMsg);
                toast({ title: "Toplu Ekleme Sonucu", description: successMsg, status: (response.data.validationErrors?.length > 0) ? "warning" : "success", duration: 7000, isClosable: true });
                if (validationErrors.length === 0 && (!response.data.validationErrors || response.data.validationErrors.length === 0)) setBulkInput(''); 
                await fetchData(); 
            } catch (err) {
                const errorMsg = err.response?.data?.message || 'Toplu soru eklerken sunucu hatası.';
                let detailedError = errorMsg;
                if (err.response?.data?.validationErrors) detailedError += ' Detaylar: ' + err.response.data.validationErrors.map(e => `[Sıra: ${e.index+1}] ${e.error}`).join('; ');
                setBulkError(prev => `<span class="math-inline">\{prev ? prev \+ '; ' \: ''\}</span>{detailedError}`);
                toast({ title: "Toplu Ekleme Hatası", description: detailedError, status: "error", duration: 7000, isClosable: true });
            }
        }
        setBulkLoading(false);
    };

    if (loading) return <Center p={10}><Spinner size="xl" color="brand.500" thickness="3px" /></Center>;

    return (
        <Box p={4} borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="lg" bg={componentBg}>
            <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3} mb={6} color={headingColor}><Icon as={FaQuestionCircle} /> Soru Yönetimi</Heading>
            {error && ( <Alert status="error" variant="subtle" borderRadius="md" mb={4}> <AlertIcon as={FaExclamationTriangle} /> {error} </Alert> )}

            <Box ref={formSectionRef} id="question-form-section" as="form" onSubmit={handleFormSubmit} p={6} borderWidth="1px" borderRadius="lg" borderColor={questionFormBorder} bg={questionFormBg} mb={8} boxShadow="md">
                <Heading as="h4" size="md" mb={5} color={headingColor}>{editingQuestion ? `Soru Düzenle (ID: ${editingQuestion.id})` : 'Yeni Soru Ekle'}</Heading>
                {formError && <Alert status="warning" variant="subtle" borderRadius="md" mb={4}><AlertIcon as={FaExclamationTriangle}/>{formError}</Alert>}
                {isUploading && <Alert status="info" variant="subtle" borderRadius="md" mb={4}><Spinner size="sm" mr={3}/> Resim yükleniyor...</Alert>}
                <VStack spacing={4} align="stretch">
                    <Heading as="h5" size="sm" alignSelf="flex-start" mt={2} mb={0} color={headingColor}>Soru Kapsamı</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl isRequired id="q-examClassificationId" isInvalid={!!formError && formError.includes('Sınav Sınıflandırması')}>
                            <FormLabel fontSize="sm">Sınav Tipi:</FormLabel>
                            <Select name="examClassificationId" value={formState.examClassificationId} onChange={handleFormInputChange} placeholder="-- Sınav Türü Seçin --" bg={inputSelectBg}>
                                {examClassifications.map(ec => (<option key={ec.id} value={ec.id}>{ec.name}</option>))}
                            </Select>
                        </FormControl>
                        <FormControl isRequired id="q-branchId" isInvalid={!!formError && formError.includes('Branş')}>
                            <FormLabel fontSize="sm">Branş:</FormLabel>
                            <Select name="branchId" value={formState.branchId} onChange={handleFormInputChange} placeholder="-- Branş Seçin --" isDisabled={!formState.examClassificationId} bg={inputSelectBg}>
                                {branches.map(branch => (<option key={branch.id} value={branch.id}>{branch.name}</option>))}
                            </Select>
                            {!formState.examClassificationId && <Text fontSize="xs" color={textColorMuted} mt={1}>Önce Sınav Tipi seçin.</Text>}
                        </FormControl>
                    </SimpleGrid>
                    <FormControl isRequired id="q-selectedKonuId" isInvalid={!!formError && (formError.includes('Konu') || formError.includes('konu seçin'))}>
                        <FormLabel fontSize="sm">Konu:</FormLabel>
                        <Select name="selectedKonuId" value={formState.selectedKonuId} onChange={handleFormInputChange} placeholder="-- Konu Seçin --" isDisabled={!formState.examClassificationId || !formState.branchId} bg={inputSelectBg}>
                            {konuOptionsForForm.map(topic => (<option key={topic.id} value={topic.id}>{topic.name}</option>))}
                        </Select>
                        {(!formState.examClassificationId || !formState.branchId) && <Text fontSize="xs" color={textColorMuted} mt={1}>Önce Sınav Tipi ve Branş seçin.</Text>}
                    </FormControl>
                    {altKonuOptions.length > 0 && (
                        <FormControl id="q-selectedAltKonuId">
                            <FormLabel fontSize="sm">Alt Konu (Opsiyonel):</FormLabel>
                            <Select name="selectedAltKonuId" value={formState.selectedAltKonuId} onChange={handleFormInputChange} placeholder="-- Alt Konu Seçmeyin / Ana Konuyu Kullan --" bg={inputSelectBg}>
                                {altKonuOptions.map(subTopic => (<option key={subTopic.id} value={subTopic.id}>{subTopic.name}</option>))}
                            </Select>
                        </FormControl>
                    )}

                    <Heading as="h5" size="sm" alignSelf="flex-start" mt={4} mb={0} color={headingColor}>Soru Detayları</Heading>
                    <FormControl isRequired id="q-text" isInvalid={!!formError && formError.includes('Soru Metni')} mt={2}>
                        <FormLabel fontSize="sm">Soru Metni:</FormLabel>
                        <Box borderWidth="1px" borderRadius="md" borderColor={borderColor} overflow="hidden" bg={editorBg}>
                            <Editor 
                                apiKey={import.meta.env.VITE_TINYMCE_API_KEY} onInit={(evt, editor) => questionEditorRef.current = editor} value={formState.text}
                                init={{
                                    height: 250, menubar: false,
                                    plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount'],
                                    toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | code removeformat | fullscreen preview | help',
                                    images_upload_handler: handleImageUpload, automatic_uploads: true, file_picker_types: 'image media', relative_urls: false, remove_script_host: false, skin: tinySkin, content_css: tinyContentCss
                                }} onEditorChange={handleQuestionEditorChange} disabled={isUploading} 
                            />
                        </Box>
                         {!!formError && formError.includes('Soru Metni') && <FormErrorMessage>{formError}</FormErrorMessage>}
                    </FormControl>
                     <Heading as="h5" size="sm" alignSelf="flex-start" mt={4} mb={0} color={headingColor}>Seçenekler ve Doğru Cevap</Heading>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full" mt={2}>
                        {['A', 'B', 'C', 'D', 'E'].map(opt => (
                            <FormControl key={opt} isRequired id={`q-option${opt}`} isInvalid={!!formError && formError.includes('Seçenekler')}>
                                <FormLabel fontSize="sm" mt={0}>Seçenek {opt}:</FormLabel>
                                <Input name={`option${opt}`} value={formState[`option${opt}`]} onChange={handleFormInputChange} isDisabled={isUploading} bg={inputSelectBg}/>
                            </FormControl>
                        ))}
                        <FormControl isRequired id="q-correctAnswer" isInvalid={!!formError && formError.includes('Doğru Cevap')} w={{base:"full", md:"auto"}}>
                            <FormLabel fontSize="sm" mt={0}>Doğru Cevap:</FormLabel>
                            <Select name="correctAnswer" value={formState.correctAnswer} onChange={handleFormInputChange} placeholder="Seç" isDisabled={isUploading} bg={inputSelectBg}>
                                {['A', 'B', 'C', 'D', 'E'].map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                            </Select>
                        </FormControl>
                    </SimpleGrid>
                    {(!!formError && (formError.includes('Seçenekler') || formError.includes('Doğru Cevap'))) && <FormErrorMessage fontSize="xs" mt={-2} w="full">{formError}</FormErrorMessage>}
                    
                    <Heading as="h5" size="sm" alignSelf="flex-start" mt={4} mb={0} color={headingColor}>Ek Bilgiler</Heading>
                     <FormControl mt={2} id="q-explanation">
                        <FormLabel fontSize="sm">Açıklama (Opsiyonel):</FormLabel>
                        <Box borderWidth="1px" borderRadius="md" borderColor={borderColor} overflow="hidden" bg={editorBg}>
                            <Editor 
                                apiKey={import.meta.env.VITE_TINYMCE_API_KEY} onInit={(evt, editor) => explanationEditorRef.current = editor} value={formState.explanation}
                                init={{
                                    height: 150, menubar: false,
                                    plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount'],
                                    toolbar: 'undo redo | bold italic | bullist numlist | link image | code', skin: tinySkin, content_css: tinyContentCss, images_upload_handler: handleImageUpload, automatic_uploads: true, file_picker_types: 'image media', relative_urls: false, remove_script_host: false,
                                }} onEditorChange={handleExplanationEditorChange} disabled={isUploading} 
                            />
                        </Box>
                    </FormControl>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full" mt={2}>
                        <FormControl id="q-classification">
                            <FormLabel fontSize="sm">Soru Tipi (Sınıflandırma):</FormLabel>
                            <Select name="classification" value={formState.classification} onChange={handleFormInputChange} isDisabled={isUploading} bg={inputSelectBg}>
                                <option value="Çalışma Sorusu">Çalışma Sorusu</option>
                                <option value="Çıkmış Benzeri">Çıkmış Benzeri</option>
                                <option value="Deneme Sınavı Sorusu">Deneme Sınavı Sorusu</option>
                            </Select>
                        </FormControl>
                         <FormControl id="q-imageUrl">
                            <FormLabel fontSize="sm">Görsel URL (Opsiyonel):</FormLabel>
                            <Input name="imageUrl" value={formState.imageUrl} onChange={handleFormInputChange} placeholder="https://..." isDisabled={isUploading} bg={inputSelectBg}/>
                            <Text fontSize="xs" color={textColorMuted} mt={1}>Soru metni içindeki resimler için editörü kullanın.</Text>
                        </FormControl>
                    </SimpleGrid>

                    <HStack spacing={3} mt={5} alignSelf="flex-start">
                        <Button type="submit" colorScheme="orange" isLoading={isUploading || loading || bulkLoading} loadingText="Kaydediliyor..." leftIcon={<Icon as={FaSave}/>}>
                            {editingQuestion ? 'Güncelle' : 'Ekle'}
                        </Button>
                        {(editingQuestion || formState.text || formState.examClassificationId || formState.branchId || formState.selectedKonuId) && ( 
                            <Button variant="ghost" onClick={resetForm} isDisabled={isUploading || loading || bulkLoading} leftIcon={<Icon as={FaTimesCircle}/>}> Temizle/İptal </Button> 
                        )}
                    </HStack>
                </VStack>
            </Box>

            <Box p={6} borderWidth="1px" borderRadius="lg" borderColor={bulkBoxBorder} borderStyle="dashed" bg={bulkBoxBg} mb={8} boxShadow="sm">
                <Heading as="h4" size="md" mb={2} color={headingColor}>Toplu Soru Ekle (JSON)</Heading>
                <Text fontSize="sm" color={textColorMuted} mb={3}>
                     JSON formatında soru dizisi yapıştırın. Gerekli alanlar: `text` (HTML içerebilir), `optionA`...`optionE`, `correctAnswer` (A,B,C,D,E), `topicId` (sayısal, oluşturduğunuz en alt seviye konunun ID'si), `examClassificationId` (sayısal, konu ile uyumlu olmalı). Opsiyonel: `classification` (string), `imageUrl` (string), `explanation` (HTML içerebilir).
                </Text>
                <Textarea fontFamily="mono" fontSize="xs" rows={10} placeholder='[{"text": "<p>Soru 1 metni...</p>", "optionA": "Cevap A", ..., "correctAnswer": "A", "topicId": 123, "examClassificationId": 1, "explanation": "<p>Açıklama...</p>"}]'
                    value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} isDisabled={bulkLoading || isUploading} mb={3} bg={inputSelectBg} />
                {bulkError && <Alert status="error" variant="subtle" whiteSpace="pre-wrap" borderRadius="md" mb={3} fontSize="sm"><AlertIcon as={FaExclamationTriangle}/>{bulkError}</Alert>}
                {bulkSuccess && <Alert status="success" variant="subtle" whiteSpace="pre-wrap" borderRadius="md" mb={3} fontSize="sm"><AlertIcon />{bulkSuccess}</Alert>}
                <Button onClick={handleBulkSubmit} isLoading={bulkLoading} loadingText="Ekleniyor..." isDisabled={!bulkInput.trim() || isUploading} colorScheme="blue" leftIcon={<Icon as={FaUpload}/>} >
                    Toplu Soruları Ekle
                </Button>
            </Box>

            <Heading as="h4" size="md" mb={4} color={headingColor}>Mevcut Sorular</Heading>
            {loading && questions.length === 0 && !error ? null : 
             questions.length === 0 && !error ? (
                <Alert status="info" variant="subtle" borderRadius="md"> <AlertIcon /> Soru bulunamadı. </Alert>
            ) : !error && questions.length > 0 ? (
                <TableContainer borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="sm">
                 <Table variant="striped" size="sm">
  <Thead bg={tableHeaderBg}>
    <Tr>
      <Th>ID</Th>
      <Th maxW="200px">Metin</Th>
      <Th>Sınav Tipi</Th>
      <Th>Branş</Th>
      <Th>Konu (ID)</Th>
      <Th>Sınıf.</Th>
      <Th isNumeric>İşlemler</Th>
    </Tr>
  </Thead>
  <Tbody>
                        {questions.map((q) => {
                            let topicName = '-';
                            let branchName = '-';
                            const topicNode = q.topicId ? findTopicByIdRecursive(topicsTree, q.topicId) : null;
                            if (topicNode) {
                                topicName = topicNode.name;
                                const branch = branches.find(b => b.id === topicNode.branchId);
                                if(branch) branchName = branch.name;
                            }
                            const examClassificationName = examClassifications.find(ec => ec.id === q.examClassificationId)?.name || '-';
                            
                            return (
                                <Tr key={q.id} _hover={{ bg: tableRowHoverBg }}>
                                    <Td>{q.id}</Td>
                                    <Td maxW="200px" whiteSpace="normal" title={stripHtml(q.text)}>{stripHtml(q.text).substring(0, 60)}{stripHtml(q.text).length > 60 ? "..." : ""}</Td>
                                    <Td>{examClassificationName}</Td>
                                    <Td>{branchName}</Td>
                                    <Td>{topicName} <Text as="span" fontSize="xs" color={textColorMuted}>({q.topicId || '-'})</Text></Td>
                                    <Td>{q.classification || '-'}</Td>
                                    <Td isNumeric><HStack spacing={1} justify="flex-end">
                                        <Tooltip label="Düzenle" fontSize="xs"><IconButton icon={<Icon as={FaEdit} />} size="xs" variant="ghost" colorScheme="blue" onClick={() => handleEdit(q)} aria-label="Düzenle"/></Tooltip>
                                        <Tooltip label="Sil" fontSize="xs"><IconButton icon={<Icon as={FaTrashAlt} />} size="xs" variant="ghost" colorScheme="red" onClick={() => openDeleteConfirmation(q)} aria-label="Sil"/></Tooltip>
                                    </HStack></Td>
                                </Tr>
                            );
                        })}
                    </Tbody></Table>
                </TableContainer>
            ) : null }

            <Modal isOpen={isDeleteConfirmOpen} onClose={onDeleteConfirmClose} isCentered>
                <ModalOverlay />
                <ModalContent bg={componentBg}>
                    <ModalHeader>Soru Silme Onayı</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        Soruyu (ID: {questionToDelete?.id}) silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!
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

export default QuestionManagement;