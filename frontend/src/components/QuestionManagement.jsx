import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'; // useMemo eklendi
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
    useColorModeValue, FormErrorMessage
} from '@chakra-ui/react';
import {
    FaQuestionCircle, FaUserEdit, FaTrashAlt, FaSave, FaTimesCircle, FaUpload
} from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Konu ağacında belirli bir ID'ye sahip konuyu ve ebeveynlerini bulan yardımcı fonksiyon
// LectureManagement'taki ile aynı, burada da kullanılabilir.
const findTopicPathById = (nodes, targetId, currentPath = []) => {
    for (const node of nodes) {
        const newPath = [...currentPath, node];
        if (node.id === targetId) {
            return newPath;
        }
        if (node.children && node.children.length > 0) {
            const foundPath = findTopicPathById(node.children, targetId, newPath);
            if (foundPath) {
                return foundPath;
            }
        }
    }
    return null;
};


function QuestionManagement({ token }) {
    const [questions, setQuestions] = useState([]);
    const [topicsTree, setTopicsTree] = useState([]); // Hiyerarşik konu ağacı
    const [branches, setBranches] = useState([]); // YENİ: Branşlar
    const [examClassifications, setExamClassifications] = useState([]);
    
    const [loading, setLoading] = useState(true);
    // const [loadingDropdowns, setLoadingDropdowns] = useState(true); // Genel 'loading' state'i kullanılacak
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [editingQuestion, setEditingQuestion] = useState(null);
    
    // formState'den topicId çıkarıldı, çünkü aşamalı seçimlerle yönetilecek.
    // initialFormState topicId olmadan başlayacak, handleEdit'te ve dropdown seçimlerinde güncellenecek.
    const initialFormState = { 
        text: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '', 
        correctAnswer: '', classification: 'Çalışma Sorusu', imageUrl: '', 
        explanation: '', examClassificationId: '' 
    };
    const [formState, setFormState] = useState(initialFormState); // Ana Soru Form Verileri
    const [currentTopicIdForForm, setCurrentTopicIdForForm] = useState(''); // Backend'e gönderilecek nihai topicId

    // YENİ: Aşamalı konu seçimi için state'ler
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [selectedL1TopicId, setSelectedL1TopicId] = useState(''); // Ana Kategori
    const [selectedL2TopicId, setSelectedL2TopicId] = useState(''); // Kategori altındaki Konu
    const [selectedL3TopicId, setSelectedL3TopicId] = useState(''); // Konu altındaki Alt Konu


    const [isUploading, setIsUploading] = useState(false);
    const [bulkInput, setBulkInput] = useState('');
    const [bulkError, setBulkError] = useState('');
    const [bulkSuccess, setBulkSuccess] = useState('');
    const [bulkLoading, setBulkLoading] = useState(false);
    const questionEditorRef = useRef(null);
    const explanationEditorRef = useRef(null);
    const toast = useToast();
    const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
    const [questionToDelete, setQuestionToDelete] = useState(null);

    const questionFormBg = useColorModeValue('orange.50', 'orange.900');
    const questionFormBorder = useColorModeValue('orange.200', 'orange.700');
    const bulkBoxBorder = useColorModeValue('gray.300', 'gray.600');
    const tinySkin = useColorModeValue("oxide", "oxide-dark");
    const tinyContentCss = useColorModeValue("default", "dark");

    const backendQuestionUrl = `${API_BASE_URL}/api/questions`;
    const backendTopicUrl = `${API_BASE_URL}/api/topics`;
    const backendBranchesUrl = `${API_BASE_URL}/api/branches`; // YENİ
    const backendUploadUrl = `${API_BASE_URL}/api/upload/image`;
    const examClassificationsUrl = `${API_BASE_URL}/api/exam-classifications`;

    const fetchData = useCallback(async () => {
        setLoading(true); setError('');
        if (!token) {
            setError("Yetkilendirme token'ı bulunamadı.");
            setLoading(false); return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // Branşlar da fetch edilecek
            const [questionsRes, topicsRes, classificationsRes, branchesRes] = await Promise.all([
                axios.get(backendQuestionUrl, config),
                axios.get(backendTopicUrl, config),
                axios.get(examClassificationsUrl, config),
                axios.get(backendBranchesUrl, config) // Branşlar çekiliyor
            ]);
            setQuestions(Array.isArray(questionsRes.data) ? questionsRes.data : []);
            setTopicsTree(Array.isArray(topicsRes.data) ? topicsRes.data : []);
            setExamClassifications(Array.isArray(classificationsRes.data) ? classificationsRes.data : []);
            setBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []); // Branş state'i güncelleniyor
        } catch (err) {
            console.error("Soru/Konu/Classification/Branch verisi çekerken hata:", err);
            const errorMsg = err.response?.data?.message || 'Veriler yüklenirken bir hata oluştu.';
            setError(errorMsg);
            setQuestions([]); setTopicsTree([]); setExamClassifications([]); setBranches([]);
            toast({ title: "Veri Yükleme Hatası", description: errorMsg, status: "error", duration: 3000, isClosable: true });
        } finally {
            setLoading(false);
        }
    }, [token, backendQuestionUrl, backendTopicUrl, examClassificationsUrl, backendBranchesUrl, toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Aşamalı Dropdown Seçenekleri
    const branchOptions = useMemo(() => branches, [branches]);

    const l1TopicOptions = useMemo(() => {
        if (!selectedBranchId) return [];
        return topicsTree.filter(topic => topic.branchId === parseInt(selectedBranchId) && !topic.parentId);
    }, [selectedBranchId, topicsTree]);

    const l2TopicOptions = useMemo(() => {
        if (!selectedL1TopicId) return [];
        const parentTopic = findTopicPathById(topicsTree, parseInt(selectedL1TopicId))?.pop();
        return parentTopic?.children || [];
    }, [selectedL1TopicId, topicsTree]);

    const l3TopicOptions = useMemo(() => {
        if (!selectedL2TopicId) return [];
        const parentTopic = findTopicPathById(topicsTree, parseInt(selectedL2TopicId))?.pop();
        return parentTopic?.children || [];
    }, [selectedL2TopicId, topicsTree]);

    // Dropdown Değişiklik Handler'ları ve currentTopicIdForForm güncellemesi
    const handleBranchChange = (e) => {
        const newBranchId = e.target.value;
        setSelectedBranchId(newBranchId);
        setSelectedL1TopicId('');
        setSelectedL2TopicId('');
        setSelectedL3TopicId('');
        setCurrentTopicIdForForm(''); // Branş değişince nihai konu sıfırlanır
    };
    const handleL1TopicChange = (e) => {
        const newL1TopicId = e.target.value;
        setSelectedL1TopicId(newL1TopicId);
        setSelectedL2TopicId('');
        setSelectedL3TopicId('');
        setCurrentTopicIdForForm(newL1TopicId); // L1 seçilince, nihai konu bu olur (L2/L3 seçilene kadar)
    };
    const handleL2TopicChange = (e) => {
        const newL2TopicId = e.target.value;
        setSelectedL2TopicId(newL2TopicId);
        setSelectedL3TopicId('');
        setCurrentTopicIdForForm(newL2TopicId); // L2 seçilince, nihai konu bu olur (L3 seçilene kadar)
    };
    const handleL3TopicChange = (e) => {
        const newL3TopicId = e.target.value;
        setSelectedL3TopicId(newL3TopicId);
        setCurrentTopicIdForForm(newL3TopicId); // L3 seçilince, nihai konu bu olur
    };
    
    // Diğer form elemanları için input change handler
    const handleQuestionDataInputChange = (e) => { 
        const { name, value } = e.target; 
        setFormState(prev => ({ ...prev, [name]: value })); 
    };
    const handleQuestionEditorChange = (content) => { setFormState(prev => ({ ...prev, text: content })); };
    const handleExplanationEditorChange = (content) => { setFormState(prev => ({ ...prev, explanation: content })); };


    const handleFormSubmit = async (e) => {
        e.preventDefault(); setFormError('');
        
        if (!currentTopicIdForForm) { setFormError('Lütfen bir konu (en alt seviyeye kadar) seçin.'); return; }
        if (!formState.examClassificationId) { setFormError('Lütfen bir sınav sınıflandırması seçin.'); return; }

        const questionTextContent = questionEditorRef.current ? questionEditorRef.current.getContent() : formState.text;
        const explanationContent = explanationEditorRef.current ? explanationEditorRef.current.getContent() : formState.explanation;

        if (!questionTextContent || questionTextContent.trim() === '<p><br data-mce-bogus="1"></p>' || questionTextContent.trim() === '<p><br></p>') {
            setFormError('Soru Metni zorunludur.'); return;
        }
        if (!formState.optionA.trim() || !formState.optionB.trim() || !formState.optionC.trim() || !formState.optionD.trim() || !formState.optionE.trim() || !formState.correctAnswer) {
            setFormError('Lütfen Seçenekler (A-E) ve Doğru Cevap alanlarını doldurun.'); return;
        }

        const questionData = {
            ...formState, // text, optionA-E, correctAnswer, classification, imageUrl, explanation, examClassificationId
            topicId: parseInt(currentTopicIdForForm),
            // Gerekirse trim/null kontrolleri burada da yapılabilir
            text: questionTextContent, // editörden gelen son hali
            explanation: (explanationContent && explanationContent.trim() !== '<p><br data-mce-bogus="1"></p>' && explanationContent.trim() !== '<p><br></p>') ? explanationContent : null,
            imageUrl: formState.imageUrl.trim() === '' ? null : formState.imageUrl.trim(),
        };

        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            let message = '';
            if (editingQuestion) {
                await axios.put(`${backendQuestionUrl}/${editingQuestion.id}`, questionData, config);
                message = 'Soru güncellendi!';
            } else {
                await axios.post(backendQuestionUrl, questionData, config);
                message = 'Soru eklendi!';
            }
            resetForm();
            await fetchData(); 
            toast({ title: "Başarılı", description: message, status: "success", duration: 3000, isClosable: true });
        } catch (err) {
            console.error("Soru kaydedilirken hata:", err);
            const errorMsg = err.response?.data?.message || 'Soru kaydedilirken bir hata oluştu.';
            setFormError(errorMsg);
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        }
    };

    const handleEdit = useCallback((question) => {
        setEditingQuestion(question);
        // formState'i doldur (topicId hariç, o aşamalı seçimle gelecek)
        setFormState({
            text: question.text || '',
            optionA: question.optionA || '', optionB: question.optionB || '', optionC: question.optionC || '',
            optionD: question.optionD || '', optionE: question.optionE || '',
            correctAnswer: question.correctAnswer || '',
            classification: question.classification || 'Çalışma Sorusu',
            // topicId: String(question.topicId || ''), // Bu satır artık currentTopicIdForForm ile yönetilecek
            imageUrl: question.imageUrl || '',
            explanation: question.explanation || '',
            examClassificationId: question.examClassificationId ? String(question.examClassificationId) : ''
        });
        
        // Topic path'ini bul ve aşamalı dropdown state'lerini ayarla
        if (question.topicId && topicsTree.length > 0 && branches.length > 0) {
            const path = findTopicPathById(topicsTree, question.topicId);
            if (path && path.length > 0) {
                const targetTopic = path[path.length - 1];
                setSelectedBranchId(targetTopic.branchId ? String(targetTopic.branchId) : '');

                // Path'e göre L1, L2, L3 ID'lerini ayarla
                // Path'teki ilk eleman L1 (ana kategori) olmalı (eğer targetTopic bir ana kategori değilse)
                // Bu mantık LectureManagement'taki ile aynı olmalı
                setSelectedL1TopicId(path[0] ? String(path[0].id) : '');
                setSelectedL2TopicId(path[1] && path[0].id !== path[1].id ? String(path[1].id) : '');
                setSelectedL3TopicId(path[2] && path[1] && path[1].id !== path[2].id ? String(path[2].id) : '');
                
                if (path.length === 1) {
                     setSelectedL2TopicId(''); setSelectedL3TopicId('');
                } else if (path.length === 2) {
                     setSelectedL3TopicId('');
                }
                setCurrentTopicIdForForm(String(question.topicId)); // Nihai topicId'yi de ayarla
            } else {
                setSelectedBranchId(''); setSelectedL1TopicId(''); setSelectedL2TopicId(''); setSelectedL3TopicId('');
                setCurrentTopicIdForForm('');
            }
        } else {
            setSelectedBranchId(''); setSelectedL1TopicId(''); setSelectedL2TopicId(''); setSelectedL3TopicId('');
            setCurrentTopicIdForForm('');
        }

        setFormError('');
        if (questionEditorRef.current) questionEditorRef.current.setContent(question.text || '');
        if (explanationEditorRef.current) explanationEditorRef.current.setContent(question.explanation || '');
        document.getElementById('question-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [topicsTree, branches]); // branches bağımlılığı eklendi


    const openDeleteConfirmation = (question) => { setQuestionToDelete(question); onDeleteConfirmOpen(); };

    const handleDeleteConfirm = async () => {
        // ... (handleDeleteConfirm içeriği aynı kalıyor, refresh için fetchData kullanıyor) ...
        if (!questionToDelete) return;
        setError(''); onDeleteConfirmClose();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`${backendQuestionUrl}/${questionToDelete.id}`, config);
            toast({ title: "Başarılı", description: `Soru (ID: ${questionToDelete.id}) silindi.`, status: "success", duration: 3000, isClosable: true });
            await fetchData(); 
            if(editingQuestion && editingQuestion.id === questionToDelete.id) resetForm();
        } catch (err) {
            console.error("Soru silinirken hata:", err);
            const errorMsg = err.response?.data?.message || 'Soru silinirken bir hata oluştu.';
            setError(errorMsg); 
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        } finally { setQuestionToDelete(null); }
    };

    const resetForm = () => {
        setEditingQuestion(null); 
        setFormState(initialFormState); 
        setFormError('');
        setSelectedBranchId('');
        setSelectedL1TopicId('');
        setSelectedL2TopicId('');
        setSelectedL3TopicId('');
        setCurrentTopicIdForForm('');
        if (questionEditorRef.current) questionEditorRef.current.setContent('');
        if (explanationEditorRef.current) explanationEditorRef.current.setContent('');
    };

    const handleImageUpload = useCallback(/* ... (handleImageUpload aynı) ... */ (blobInfo, progress) => new Promise((resolve, reject) => {
        if (!token) { reject('Yetkilendirme tokenı bulunamadı.'); return; }
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', blobInfo.blob(), blobInfo.filename());
        axios.post(backendUploadUrl, formData, {
            headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (res.data?.location) {
                const imageUrl = res.data.location.startsWith('http') ? res.data.location : API_BASE_URL + res.data.location;
                resolve(imageUrl);
            } else { reject('Sunucudan geçersiz cevap formatı.'); }
        })
        .catch(err => {
            console.error('Resim yüklenirken hata:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Resim yüklenemedi.';
            reject(`HTTP Error: ${err.response?.status || 'Bilinmeyen'} - ${errorMsg}`);
        })
        .finally(() => { setIsUploading(false); });
    }), [token, backendUploadUrl]);

    const handleBulkSubmit = async () => {/* ... (Bulk submit şimdilik aynı, topicId'yi doğrudan bekliyor) ... */ 
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
        const topicIdsSet = new Set(); 
        questionsArray.forEach(q => { if (q.topicId) topicIdsSet.add(parseInt(q.topicId,10)); }); 

        let existingTopicsMap = new Map(); 
        const flattenForValidation = (nodes, map = new Map()) => {
            if (!Array.isArray(nodes)) return map;
            nodes.forEach(node => {
                map.set(node.id, true);
                if (Array.isArray(node.children)) flattenForValidation(node.children, map);
            });
            return map;
        };
        existingTopicsMap = flattenForValidation(topicsTree); 

        for (let i = 0; i < questionsArray.length; i++) {
            const q = questionsArray[i];
            if (!q.text || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.optionE || !q.correctAnswer || !q.topicId || !q.examClassificationId) {
                validationErrors.push({ index: i, error: `Zorunlu alanlar eksik (Soru metni, Seçenekler A-E, Doğru Cevap, Konu ID, Sınav Sınıflandırma ID).` }); continue;
            }
            const topicIdNum = parseInt(q.topicId, 10);
            if (isNaN(topicIdNum) || !existingTopicsMap.has(topicIdNum)) {
                validationErrors.push({ index: i, error: `Geçersiz veya bulunamayan konu ID'si (${q.topicId}).` }); continue;
            }
            const examClassificationIdNum = parseInt(q.examClassificationId, 10);
            if (isNaN(examClassificationIdNum) || !examClassifications.find(ec => ec.id === examClassificationIdNum)) {
                validationErrors.push({ index: i, error: `Geçersiz veya bulunamayan sınav sınıflandırma ID'si (${q.examClassificationId}).`}); continue;
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
             setBulkError(`Eklenecek geçerli soru bulunamadı. Hatalar: ${validationErrors.map(e=> `[Sıra ${e.index+1}]: ${e.error}`).join('; ')}`);
             setBulkLoading(false); return;
        }
         if (validationErrors.length > 0 && questionsToCreate.length > 0) {
            setBulkError(`Bazı sorular doğrulama hataları nedeniyle atlandı: ${validationErrors.map(e=> `[Sıra ${e.index+1}]: ${e.error}`).join('; ')}. ${questionsToCreate.length} soru gönderilecek.`);
        }


        if (questionsToCreate.length > 0) {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const response = await axios.post(`${backendQuestionUrl}/bulk`, questionsToCreate, config);
                const addedCount = response.data.addedCount || (Array.isArray(response.data.createdQuestions) ? response.data.createdQuestions.length : questionsToCreate.length - (response.data.validationErrors?.length || 0));
                const successMsg = response.data.message || `${addedCount} soru başarıyla eklendi.`;
                
                let combinedSuccess = successMsg;
                if (validationErrors.length > 0) { 
                    combinedSuccess += ` ${validationErrors.length} soru ön doğrulama hataları nedeniyle gönderilmedi.`;
                }
                if (response.data.validationErrors?.length > 0) { 
                     const backendErrorDetails = response.data.validationErrors.map(e => `[Gönderilen Soru Index: ${e.index +1}] ${e.error}`).join('; ');
                     setBulkError(prev => `${prev ? prev + ' | ' : ''}Sunucudan dönen ek hatalar: ${backendErrorDetails}`);
                     combinedSuccess += ` Sunucudan ${response.data.validationErrors.length} soru için ek hata döndü.`;
                }

                setBulkSuccess(combinedSuccess);
                toast({ title: "Toplu Ekleme Sonucu", description: combinedSuccess, status: (validationErrors.length > 0 || response.data.validationErrors?.length > 0) ? "warning" : "success", duration: 7000, isClosable: true });

                if (validationErrors.length === 0 && (!response.data.validationErrors || response.data.validationErrors.length === 0)) {
                    setBulkInput(''); 
                }
                await fetchData(); 
            } catch (err) {
                console.error("Toplu soru eklenirken hata:", err);
                const errorMsg = err.response?.data?.message || 'Toplu soru eklenirken bir sunucu hatası oluştu.';
                let detailedError = errorMsg;
                if (err.response?.data?.validationErrors) {
                    detailedError += ' Detaylar: ' + err.response.data.validationErrors.map(e => `[Sıra: ${e.index+1}] ${e.error}`).join('; ');
                }
                setBulkError(prev => `${prev ? prev + '; ' : ''}${detailedError}`);
                toast({ title: "Toplu Ekleme Hatası", description: detailedError, status: "error", duration: 7000, isClosable: true });
            }
        }
        setBulkLoading(false);
    };

    // Eski renderTopicOptions fonksiyonu artık kullanılmayacak (formda).
    // Ama tablodaki konu adını göstermek için topicsTree'yi düzleştirmek gerekebilir (handleEdit'teki gibi) veya backend'den topic.name gelmeli.
    
    const stripHtml = (html) => {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }), 'text/html');
        return doc.body.textContent || "";
    }

    if (loading) return <Center p={10}><Spinner size="xl" color="brand.500" /></Center>;

    return (
        <Box>
            <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3} mb={6}><Icon as={FaQuestionCircle} /> Soru Yönetimi</Heading>
            {error && ( <Alert status="error" variant="subtle" borderRadius="md" mb={4}> <AlertIcon /> {error} </Alert> )}

            <Box id="question-form-section" as="form" onSubmit={handleFormSubmit} p={6} borderWidth="1px" borderRadius="lg" borderColor={questionFormBorder} bg={questionFormBg} mb={8}>
                <Heading as="h4" size="md" mb={5}>{editingQuestion ? `Soru Düzenle (ID: ${editingQuestion.id})` : 'Yeni Soru Ekle'}</Heading>
                {formError && <Alert status="warning" variant="subtle" borderRadius="md" mb={4}><AlertIcon />{formError}</Alert>}
                {isUploading && <Alert status="info" variant="subtle" borderRadius="md" mb={4}><Spinner size="sm" mr={3}/> Resim yükleniyor...</Alert>}
                <VStack spacing={4} align="stretch">
                    {/* Soru Metni, Açıklama, Seçenekler (Aynı kalıyor) */}
                    <FormControl isRequired isInvalid={!!formError && formError.includes('Soru Metni')}>
                        <FormLabel fontSize="sm">Soru Metni:</FormLabel>
                        <Box borderWidth="1px" borderRadius="md" borderColor="borderPrimary" overflow="hidden">
                            <Editor /* ... (Editor props aynı) ... */ 
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
                    <FormControl mt={4}>
                        <FormLabel fontSize="sm">Açıklama (Opsiyonel):</FormLabel>
                        <Box borderWidth="1px" borderRadius="md" borderColor="borderPrimary" overflow="hidden">
                            <Editor /* ... (Editor props aynı) ... */ 
                                apiKey={import.meta.env.VITE_TINYMCE_API_KEY} onInit={(evt, editor) => explanationEditorRef.current = editor} value={formState.explanation}
                                init={{
                                    height: 150, menubar: false,
                                    plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount'],
                                    toolbar: 'undo redo | bold italic | bullist numlist | link image | code', skin: tinySkin, content_css: tinyContentCss, images_upload_handler: handleImageUpload, automatic_uploads: true, file_picker_types: 'image media', relative_urls: false, remove_script_host: false,
                                }} onEditorChange={handleExplanationEditorChange} disabled={isUploading} 
                            />
                        </Box>
                    </FormControl>
                    <Heading as="h5" size="sm" alignSelf="flex-start" mt={4} mb={2}>Seçenekler ve Doğru Cevap</Heading>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                        {['A', 'B', 'C', 'D', 'E'].map(opt => (
                            <FormControl key={opt} isRequired isInvalid={!!formError && formError.includes('Seçenekler')}>
                                <FormLabel fontSize="sm">Seçenek {opt}:</FormLabel>
                                <Input name={`option${opt}`} value={formState[`option${opt}`]} onChange={handleQuestionDataInputChange} isDisabled={isUploading}/>
                            </FormControl>
                        ))}
                        <FormControl isRequired isInvalid={!!formError && formError.includes('Doğru Cevap')} w={{base:"full", md:"auto"}}>
                            <FormLabel fontSize="sm">Doğru Cevap:</FormLabel>
                            <Select name="correctAnswer" value={formState.correctAnswer} onChange={handleQuestionDataInputChange} placeholder="Seç" isDisabled={isUploading}>
                                {['A', 'B', 'C', 'D', 'E'].map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                            </Select>
                        </FormControl>
                    </SimpleGrid>
                    {(!!formError && (formError.includes('Seçenekler') || formError.includes('Doğru Cevap'))) && <Text fontSize="xs" color="red.500" mt={-2} w="full">{formError.includes('Lütfen Seçenekler') ? formError : 'Seçenekler ve Doğru Cevap alanları zorunludur.'}</Text>}
                    
                    <Heading as="h5" size="sm" alignSelf="flex-start" mt={4} mb={2}>Diğer Bilgiler</Heading>
                    
                    {/* Sınıflandırma, Sınav Sınıflandırması, Görsel URL */}
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full"> {/* md:3 -> md:2 */}
                        <FormControl>
                            <FormLabel fontSize="sm">Sınıflandırma (Soru Tipi):</FormLabel>
                            <Select name="classification" value={formState.classification} onChange={handleQuestionDataInputChange} isDisabled={isUploading}>
                                <option value="Çalışma Sorusu">Çalışma Sorusu</option>
                                <option value="Çıkmış Benzeri">Çıkmış Benzeri</option>
                            </Select>
                        </FormControl>
                        <FormControl isRequired isInvalid={!!formError && formError.includes('sınav sınıflandırması')}>
                            <FormLabel fontSize="sm">Sınav Sınıflandırması (Hedef Kitle):</FormLabel>
                            <Select name="examClassificationId" value={formState.examClassificationId} onChange={handleQuestionDataInputChange} placeholder="-- Sınav Türü Seçin --" isDisabled={isUploading || loading}>
                                {examClassifications.map(ec => (<option key={ec.id} value={ec.id}>{ec.name}</option>))}
                            </Select>
                            {!!formError && formError.includes('sınav sınıflandırması') && <FormErrorMessage>{formError.includes('Lütfen bir sınav sınıflandırması seçin') ? formError : 'Lütfen bir sınav sınıflandırması seçin.'}</FormErrorMessage>}
                        </FormControl>
                         <FormControl gridColumn={{md: "span 2"}}> {/* Görsel URL'yi tam satır yapalım */}
                            <FormLabel fontSize="sm">Görsel URL (Opsiyonel):</FormLabel>
                            <Input name="imageUrl" value={formState.imageUrl} onChange={handleQuestionDataInputChange} placeholder="https://..." isDisabled={isUploading}/>
                            <Text fontSize="xs" color="textMuted" mt={1}>Soru metni içindeki resimler için editörü kullanın.</Text>
                        </FormControl>
                    </SimpleGrid>

                    {/* YENİ: Aşamalı Konu Seçimi */}
                    <Heading as="h5" size="sm" mt={4} mb={2} alignSelf="flex-start">Sorunun Ait Olduğu Konu Hiyerarşisi</Heading>
                    <SimpleGrid columns={{base: 1, md: 2, lg:4}} spacing={4} w="full">
                        <FormControl isRequired={!currentTopicIdForForm}> {/* En az bir konu seviyesi seçilmeli */}
                            <FormLabel fontSize="sm">1. Branş:</FormLabel>
                            <Select placeholder="-- Branş Seçin --" value={selectedBranchId} onChange={handleBranchChange} isDisabled={loading}>
                                {branchOptions.map(branch => (
                                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl isRequired={selectedBranchId && !selectedL1TopicId && l1TopicOptions.length > 0}>
                            <FormLabel fontSize="sm">2. Ana Kategori:</FormLabel>
                            <Select placeholder="-- Ana Kategori Seçin --" value={selectedL1TopicId} onChange={handleL1TopicChange} isDisabled={!selectedBranchId || l1TopicOptions.length === 0 || loading}>
                                {l1TopicOptions.map(topic => (
                                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl isRequired={selectedL1TopicId && !selectedL2TopicId && l2TopicOptions.length > 0}>
                            <FormLabel fontSize="sm">3. Konu:</FormLabel>
                            <Select placeholder="-- Konu Seçin --" value={selectedL2TopicId} onChange={handleL2TopicChange} isDisabled={!selectedL1TopicId || l2TopicOptions.length === 0 || loading}>
                                {l2TopicOptions.map(topic => (
                                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl isRequired={selectedL2TopicId && !selectedL3TopicId && l3TopicOptions.length > 0}>
                            <FormLabel fontSize="sm">4. Alt Konu:</FormLabel>
                            <Select placeholder="-- Alt Konu Seçin --" value={selectedL3TopicId} onChange={handleL3TopicChange} isDisabled={!selectedL2TopicId || l3TopicOptions.length === 0 || loading}>
                                {l3TopicOptions.map(topic => (
                                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                                ))}
                            </Select>
                        </FormControl>
                    </SimpleGrid>
                    {!!formError && formError.includes('Lütfen bir konu') && <Text color="red.500" fontSize="sm" mt={2}>{formError}</Text>}


                    <HStack spacing={3} mt={5} alignSelf="flex-start">
                        <Button type="submit" colorScheme="orange" isLoading={isUploading || loading || bulkLoading} loadingText="Kaydediliyor..." leftIcon={<Icon as={FaSave}/>}>
                            {editingQuestion ? 'Güncelle' : 'Ekle'}
                        </Button>
                        {editingQuestion && ( <Button variant="ghost" onClick={resetForm} isDisabled={isUploading || loading || bulkLoading} leftIcon={<Icon as={FaTimesCircle}/>}> İptal </Button> )}
                    </HStack>
                </VStack>
            </Box>

            {/* Toplu Soru Ekleme (Aynı) */}
            <Box p={6} borderWidth="1px" borderRadius="lg" borderColor={bulkBoxBorder} borderStyle="dashed" bg="bgSecondary" mb={8}>
                 {/* ... (Bulk submit içeriği aynı) ... */}
                <Heading as="h4" size="md" mb={2}>Toplu Soru Ekle (JSON)</Heading>
                <Text fontSize="sm" color="textMuted" mb={3}>
                    JSON formatında soru dizisi yapıştırın. Gerekli alanlar: `text` (HTML içerebilir), `optionA`...`optionE`, `correctAnswer` (A,B,C,D,E), `topicId` (sayısal, geçerli bir konu ID'si), `examClassificationId` (sayısal). Opsiyonel: `classification` (string), `imageUrl` (string), `explanation` (HTML içerebilir).
                </Text>
                <Textarea fontFamily="mono" fontSize="xs" rows={10} placeholder='[{"text": "<p>Soru 1 metni...</p>", "optionA": "Cevap A", ..., "correctAnswer": "A", "topicId": 123, "examClassificationId": 1, "explanation": "<p>Açıklama...</p>"}]'
                    value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} isDisabled={bulkLoading || isUploading} mb={3} />
                {bulkError && <Alert status="error" variant="subtle" whiteSpace="pre-wrap" borderRadius="md" mb={3} fontSize="sm"><AlertIcon />{bulkError}</Alert>}
                {bulkSuccess && <Alert status="success" variant="subtle" whiteSpace="pre-wrap" borderRadius="md" mb={3} fontSize="sm"><AlertIcon />{bulkSuccess}</Alert>}
                <Button onClick={handleBulkSubmit} isLoading={bulkLoading} loadingText="Ekleniyor..." isDisabled={!bulkInput.trim() || isUploading} colorScheme="blue" leftIcon={<Icon as={FaUpload}/>} >
                    Toplu Soruları Ekle
                </Button>
            </Box>

            {/* Mevcut Sorular Tablosu (Aynı) */}
            <Heading as="h4" size="md" mb={4}>Mevcut Sorular</Heading>
             {/* ... (tablo aynı, topic.name gösterimi LectureManagement'taki gibi güncellenebilir) ... */}
            {questions.length === 0 && !loading && !error ? (
                <Alert status="info" variant="subtle" borderRadius="md"> <AlertIcon /> Soru bulunamadı. </Alert>
            ) : (
                <TableContainer borderWidth="1px" borderRadius="md" borderColor="borderSecondary">
                    <Table variant="striped" size="sm"><Thead bg="bgTertiary"><Tr>
                        <Th>ID</Th> <Th maxW="300px">Metin</Th> <Th>Konu Adı (ID)</Th> <Th>Sınav Türü</Th> <Th>Sınıf.</Th> <Th isNumeric>İşlemler</Th>
                    </Tr></Thead><Tbody>
                        {questions.map((q) => {
                            let topicName = '-';
                            if (q.topic) { 
                                topicName = q.topic.name;
                            } else if (q.topicId && topicsTree.length > 0) {
                                const path = findTopicPathById(topicsTree, q.topicId);
                                if (path && path.length > 0) {
                                    topicName = path[path.length -1].name;
                                }
                            }
                            return (
                                <Tr key={q.id} _hover={{ bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.100' }}}>
                                    <Td>{q.id}</Td>
                                    <Td maxW="300px" whiteSpace="normal" title={stripHtml(q.text)}>{stripHtml(q.text).substring(0, 80)}...</Td>
                                    <Td>{topicName} {q.topicId ? `(${q.topicId})` : ''}</Td>
                                    <Td>{examClassifications.find(ec => ec.id === q.examClassificationId)?.name || '-'}</Td>
                                    <Td>{q.classification || '-'}</Td>
                                    <Td isNumeric><HStack spacing={1} justify="flex-end">
                                        <IconButton icon={<Icon as={FaUserEdit} />} size="xs" variant="ghost" colorScheme="blue" onClick={() => handleEdit(q)} aria-label="Düzenle" title="Düzenle"/>
                                        <IconButton icon={<Icon as={FaTrashAlt} />} size="xs" variant="ghost" colorScheme="red" onClick={() => openDeleteConfirmation(q)} aria-label="Sil" title="Sil"/>
                                    </HStack></Td>
                                </Tr>
                            );
                        })}
                    </Tbody></Table>
                </TableContainer>
            )}

            {/* Silme Onay Modalı (Aynı) */}
            <Modal isOpen={isDeleteConfirmOpen} onClose={onDeleteConfirmClose} isCentered>
                 {/* ... (içerik aynı) ... */}
                <ModalOverlay />
                <ModalContent>
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