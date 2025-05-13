import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { Editor } from '@tinymce/tinymce-react';
import {
    Box, Center, Heading,
    Spinner, Alert, AlertIcon, useToast, useDisclosure,
    Button, IconButton, Icon, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
    Select, FormControl, FormLabel, Input, Textarea, SimpleGrid,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    VStack, HStack, Text, Link as ChakraLink,
    useColorModeValue, FormErrorMessage, Tooltip
} from '@chakra-ui/react';
import { FaChalkboardTeacher, FaEdit, FaTrashAlt, FaSave, FaTimesCircle, FaUpload, FaExclamationTriangle } from 'react-icons/fa';

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

function LectureManagement({ token }) {
    // State Hooks
    const [lectures, setLectures] = useState([]);
    const [topicsTree, setTopicsTree] = useState([]);
    const [branches, setBranches] = useState([]);
    const [examClassifications, setExamClassifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [editingLecture, setEditingLecture] = useState(null);
    const initialLectureFormState = { 
        title: '', content: '', imageUrl: '', 
        examClassificationId: '', branchId: '',
        selectedKonuId: '', selectedAltKonuId: '' 
    };
    const [lectureFormData, setLectureFormData] = useState(initialLectureFormState);
    const [isUploading, setIsUploading] = useState(false);

    // Ref Hooks
    const editorRef = useRef(null);
    const formSectionRef = useRef(null);

    // Chakra UI Hooks
    const toast = useToast();
    const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
    const [lectureToDelete, setLectureToDelete] = useState(null);

    // Style Hooks
    const componentBg = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const lectureFormBg = useColorModeValue('green.50', 'green.900');
    const lectureFormBorder = useColorModeValue('green.200', 'green.700');
    const inputSelectBg = useColorModeValue("white", "gray.700");
    const editorBg = useColorModeValue("white", "gray.800");
    const tableHeaderBg = useColorModeValue("gray.100", "gray.750");
    const tableRowHoverBg = useColorModeValue("gray.50", "gray.800");
    const tinySkin = useColorModeValue("oxide", "oxide-dark");
    const tinyContentCss = useColorModeValue("default", "dark");

    // API URL Constants
    const backendLectureUrl = `${API_BASE_URL}/api/lectures`;
    const backendTopicUrl = `${API_BASE_URL}/api/topics`;
    const backendBranchesUrl = `${API_BASE_URL}/api/branches`;
    const backendUploadUrl = `${API_BASE_URL}/api/upload/image`;
    const examClassificationsUrlApi = `${API_BASE_URL}/api/exam-classifications`;

    const fetchData = useCallback(async () => {
        setLoading(true); setError('');
        if (!token) {
            setError("Yetkilendirme token'ı bulunamadı.");
            setLoading(false); return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [lecturesRes, topicsRes, classificationsRes, branchesRes] = await Promise.all([
                axios.get(backendLectureUrl, config),
                axios.get(backendTopicUrl, config),
                axios.get(examClassificationsUrlApi, config),
                axios.get(backendBranchesUrl, config)
            ]);
            setLectures(Array.isArray(lecturesRes.data) ? lecturesRes.data : []);
            setTopicsTree(Array.isArray(topicsRes.data) ? topicsRes.data : []);
            setExamClassifications(Array.isArray(classificationsRes.data) ? classificationsRes.data : []);
            setBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []);
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Veriler yüklenirken hata oluştu.';
            setError(errorMsg);
            toast({ title: "Veri Yükleme Hatası", description: errorMsg, status: "error", duration: 3000, isClosable: true });
        } finally {
            setLoading(false);
        }
    }, [token, toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const konuOptionsForForm = useMemo(() => {
        if (!lectureFormData.examClassificationId || !lectureFormData.branchId || !topicsTree) return [];
        const ecIdNum = parseInt(lectureFormData.examClassificationId);
        const branchIdNum = parseInt(lectureFormData.branchId);
        let options = [];
        const buildOptions = (nodes, level = 0) => {
            if (!Array.isArray(nodes)) return;
            nodes.forEach(node => {
                if (node.examClassificationId === ecIdNum && node.branchId === branchIdNum) {
                    options.push({ id: node.id, name: '\u00A0'.repeat(level * 4) + node.name });
                    if (Array.isArray(node.children)) buildOptions(node.children, level + 1);
                } else if (Array.isArray(node.children)) {
                     buildOptions(node.children, level); // Farklı EC/Branş ise alt kırılımları da kontrol et
                }
            });
        };
        buildOptions(topicsTree, 0);
        return options;
    }, [topicsTree, lectureFormData.examClassificationId, lectureFormData.branchId]);

    const altKonuOptions = useMemo(() => {
        if (!lectureFormData.selectedKonuId || !topicsTree) return [];
        const selectedKonu = findTopicByIdRecursive(topicsTree, parseInt(lectureFormData.selectedKonuId));
        if (selectedKonu && selectedKonu.children && selectedKonu.children.length > 0) {
            return selectedKonu.children.map(child => ({ id: child.id, name: child.name }));
        }
        return [];
    }, [lectureFormData.selectedKonuId, topicsTree]);
    
    const handleLectureDataInputChange = (e) => { 
        const { name, value } = e.target; 
        setLectureFormData(prev => ({ ...prev, [name]: value })); 
        if (name === 'examClassificationId') {
            setLectureFormData(prev => ({ ...prev, branchId: '', selectedKonuId: '', selectedAltKonuId: '' }));
        } else if (name === 'branchId') {
            setLectureFormData(prev => ({ ...prev, selectedKonuId: '', selectedAltKonuId: '' }));
        } else if (name === 'selectedKonuId') {
            setLectureFormData(prev => ({ ...prev, selectedAltKonuId: '' }));
        }
    };
    const handleEditorChange = (content) => { 
        setLectureFormData(prev => ({ ...prev, content: content })); 
    };

    const getFinalTopicId = useCallback(() => {
        return lectureFormData.selectedAltKonuId || lectureFormData.selectedKonuId || null;
    }, [lectureFormData.selectedAltKonuId, lectureFormData.selectedKonuId]);


    const handleFormSubmit = async (e) => {
        e.preventDefault(); setFormError('');
        const finalTopicId = getFinalTopicId();

        if (!finalTopicId) { setFormError('Lütfen bir konu (veya varsa alt konu) seçin.'); return; }
        if (!lectureFormData.examClassificationId) { setFormError('Lütfen bir sınav sınıflandırması seçin.'); return; }
        // Branch ID, seçilen konu üzerinden (finalTopicId) backend'de belirlenebilir veya payload'a eklenebilir.
        // Şimdilik finalTopicId ve examClassificationId gönderiliyor.
        
        const editorContent = editorRef.current ? editorRef.current.getContent() : lectureFormData.content;
        if (!lectureFormData.title.trim() || !editorContent || editorContent.trim() === '<p><br data-mce-bogus="1"></p>' || editorContent.trim() === '<p><br></p>') {
            setFormError('Başlık ve İçerik alanları zorunludur.');
            return;
        }
        setIsSaving(true);
        const lecturePayload = {
            title: lectureFormData.title.trim(),
            content: editorContent,
            imageUrl: lectureFormData.imageUrl.trim() === '' ? null : lectureFormData.imageUrl.trim(),
            examClassificationId: parseInt(lectureFormData.examClassificationId),
            topicId: parseInt(finalTopicId),
        };

        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            let message = '';
            if (editingLecture) {
                await axios.put(`<span class="math-inline">\{backendLectureUrl\}/</span>{editingLecture.id}`, lecturePayload, config);
                message = 'Konu anlatımı güncellendi!';
            } else {
                await axios.post(backendLectureUrl, lecturePayload, config);
                message = 'Konu anlatımı eklendi!';
            }
            resetForm();
            await fetchData();
            toast({ title: "Başarılı", description: message, status: "success", duration: 3000, isClosable: true });
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Konu anlatımı kaydedilirken bir hata oluştu.';
            setFormError(errorMsg);
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = useCallback((lecture) => {
        setEditingLecture(lecture);
        let topicBranchId = '';
        let mainTopicForEdit = '';
        let subTopicForEdit = '';

        if (lecture.topicId && topicsTree.length > 0) {
            const targetTopicNode = findTopicByIdRecursive(topicsTree, lecture.topicId);
            if (targetTopicNode) {
                topicBranchId = String(targetTopicNode.branchId || '');
                const parentOfTarget = targetTopicNode.parentId ? findTopicByIdRecursive(topicsTree, targetTopicNode.parentId) : null;
                if (parentOfTarget && 
                    parentOfTarget.examClassificationId === targetTopicNode.examClassificationId && 
                    parentOfTarget.branchId === targetTopicNode.branchId) {
                    mainTopicForEdit = String(parentOfTarget.id);
                    subTopicForEdit = String(targetTopicNode.id);
                } else {
                    mainTopicForEdit = String(targetTopicNode.id);
                    subTopicForEdit = '';
                }
            }
        }
        
        setLectureFormData({
            title: lecture.title || '',
            content: lecture.content || '',
            imageUrl: lecture.imageUrl || '',
            examClassificationId: lecture.examClassificationId ? String(lecture.examClassificationId) : '',
            branchId: topicBranchId,
            selectedKonuId: mainTopicForEdit,
            selectedAltKonuId: subTopicForEdit
        });
        
        setFormError('');
        if (editorRef.current) editorRef.current.setContent(lecture.content || '');
        formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [topicsTree]);

    const openDeleteConfirmation = (lecture) => { setLectureToDelete(lecture); onDeleteConfirmOpen(); };

    const handleDeleteConfirm = useCallback(async () => {
        if (!lectureToDelete) return;
        onDeleteConfirmClose();
        setIsSaving(true); // Silme işlemi için de loading
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`<span class="math-inline">\{backendLectureUrl\}/</span>{lectureToDelete.id}`, config);
            toast({ title: "Başarılı", description: `Konu anlatımı (${lectureToDelete.title}) silindi.`, status: "success", duration: 3000, isClosable: true });
            await fetchData();
            if(editingLecture && editingLecture.id === lectureToDelete.id) resetForm();
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Konu anlatımı silinirken bir hata oluştu.';
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        } finally { 
            setLectureToDelete(null); 
            setIsSaving(false);
        }
    }, [token, lectureToDelete, editingLecture, toast, onDeleteConfirmClose, fetchData, /*resetForm eklenecek*/ ]);
    
    const resetForm = useCallback(() => {
        setEditingLecture(null); 
        setLectureFormData(initialLectureFormState); 
        setFormError('');
        if (editorRef.current) editorRef.current.setContent('');
    }, []); // initialFormState dışarıda tanımlı ve sabitse bağımlılık boş olabilir.

    // handleDeleteConfirm'in resetForm'a bağımlılığını düzeltmek için yukarı taşıdık.
    // Şimdi handleDeleteConfirm'in bağımlılıklarına resetForm'u ekleyebiliriz.
    // const handleDeleteConfirm = useCallback(async () => { ... }, [..., resetForm]);

    const handleImageUpload = useCallback((blobInfo, progress) => new Promise((resolve, reject) => {
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
            } else {
                reject('Sunucudan geçersiz cevap formatı.');
            }
        })
        .catch(err => {
            const errorMsg = err.response?.data?.message || err.message || 'Resim yüklenemedi.';
            reject(`HTTP Error: ${err.response?.status || 'Bilinmeyen'} - ${errorMsg}`);
        })
        .finally(() => { setIsUploading(false); });
    }), [token, backendUploadUrl]); // API_BASE_URL sabit olduğu için çıkarıldı
    

    if (loading) return <Center p={10}><Spinner size="xl" color="brand.500" thickness="3px" /></Center>;

    return (
        <Box p={4} borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="lg" bg={componentBg}>
            <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3} mb={6} color="textPrimary">
                <Icon as={FaChalkboardTeacher} /> Konu Anlatımı Yönetimi
            </Heading>
            {error && ( <Alert status="error" variant="subtle" borderRadius="md" mb={4}> <AlertIcon as={FaExclamationTriangle}/> {error} </Alert> )}
            
            <Box ref={formSectionRef} id="lecture-form-section" as="form" onSubmit={handleFormSubmit} p={6} borderWidth="1px" borderRadius="lg" borderColor={lectureFormBorder} bg={lectureFormBg} mb={8} boxShadow="md">
                <Heading as="h4" size="md" mb={5}>{editingLecture ? `Konu Anlatımı Düzenle (ID: ${editingLecture.id})` : 'Yeni Konu Anlatımı Ekle'}</Heading>
                {formError && <Alert status="warning" variant="subtle" borderRadius="md" mb={4}><AlertIcon as={FaExclamationTriangle} />{formError}</Alert>}
                {isUploading && ( <Alert status="info" variant="subtle" borderRadius="md" mb={4}><Spinner size="sm" mr={3}/> Resim yükleniyor...</Alert>)}
                
                <VStack spacing={4} align="stretch">
                    <Heading as="h5" size="sm" alignSelf="flex-start" mt={2} mb={0}>Konu Anlatımı Kapsamı</Heading>
                     <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl isRequired id="lec-examClassificationId" isInvalid={!!formError && formError.includes('Sınav Sınıflandırması')}>
                            <FormLabel fontSize="sm">Sınav Tipi:</FormLabel>
                            <Select name="examClassificationId" value={lectureFormData.examClassificationId} onChange={handleLectureDataInputChange} placeholder="-- Sınav Türü Seçin --" bg={inputSelectBg}>
                                {examClassifications.map(ec => (<option key={ec.id} value={ec.id}>{ec.name}</option>))}
                            </Select>
                        </FormControl>
                        <FormControl isRequired id="lec-branchId" isInvalid={!!formError && formError.includes('Branş')}>
                            <FormLabel fontSize="sm">Branş:</FormLabel>
                            <Select name="branchId" value={lectureFormData.branchId} onChange={handleLectureDataInputChange} placeholder="-- Branş Seçin --" isDisabled={!lectureFormData.examClassificationId} bg={inputSelectBg}>
                                {branches.map(branch => (<option key={branch.id} value={branch.id}>{branch.name}</option>))}
                            </Select>
                            {!lectureFormData.examClassificationId && <Text fontSize="xs" color="textMuted" mt={1}>Önce Sınav Tipi seçin.</Text>}
                        </FormControl>
                    </SimpleGrid>
                    <FormControl isRequired id="lec-selectedKonuId" isInvalid={!!formError && (formError.includes('Konu') || formError.includes('konu seçin'))}>
                        <FormLabel fontSize="sm">Konu:</FormLabel>
                        <Select name="selectedKonuId" value={lectureFormData.selectedKonuId} onChange={handleLectureDataInputChange} placeholder="-- Konu Seçin --" isDisabled={!lectureFormData.examClassificationId || !lectureFormData.branchId} bg={inputSelectBg}>
                            {konuOptionsForForm.map(topic => (<option key={topic.id} value={topic.id}>{topic.name}</option>))}
                        </Select>
                         {(!lectureFormData.examClassificationId || !lectureFormData.branchId) && <Text fontSize="xs" color="textMuted" mt={1}>Önce Sınav Tipi ve Branş seçin.</Text>}
                    </FormControl>
                    {altKonuOptions.length > 0 && (
                        <FormControl id="lec-selectedAltKonuId">
                            <FormLabel fontSize="sm">Alt Konu (Opsiyonel):</FormLabel>
                            <Select name="selectedAltKonuId" value={lectureFormData.selectedAltKonuId} onChange={handleLectureDataInputChange} placeholder="-- Alt Konu Seçmeyin / Bu Konuyu Kullan --" bg={inputSelectBg}>
                                {altKonuOptions.map(subTopic => (<option key={subTopic.id} value={subTopic.id}>{subTopic.name}</option>))}
                            </Select>
                        </FormControl>
                    )}

                    <Heading as="h5" size="sm" alignSelf="flex-start" mt={4} mb={0}>Konu Anlatımı Detayları</Heading>
                    <FormControl isRequired id="lec-title" isInvalid={!!formError && formError.includes('Başlık')} mt={2}>
                        <FormLabel fontSize="sm">Başlık:</FormLabel>
                        <Input name="title" value={lectureFormData.title} onChange={handleLectureDataInputChange} isDisabled={isUploading} bg={inputSelectBg} />
                         {!!formError && formError.includes('Başlık') && <FormErrorMessage>{formError}</FormErrorMessage>}
                    </FormControl>
                    <FormControl isRequired id="lec-content" isInvalid={!!formError && formError.includes('İçerik')}>
                        <FormLabel fontSize="sm">İçerik:</FormLabel>
                        <Box borderWidth="1px" borderRadius="md" borderColor={borderColor} overflow="hidden" bg={editorBg}> {/* borderColor güncellendi */}
                            <Editor
                                apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                onInit={(evt, editor) => editorRef.current = editor}
                                value={lectureFormData.content}
                                init={{
                                    height: 350, menubar: false,
                                    plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount'],
                                    toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | code removeformat | fullscreen preview | help',
                                    images_upload_handler: handleImageUpload,
                                    automatic_uploads: true,
                                    file_picker_types: 'image media',
                                    relative_urls: false, remove_script_host: false,
                                    skin: tinySkin, content_css: tinyContentCss
                                }}
                                onEditorChange={handleEditorChange}
                                disabled={isUploading}
                            />
                        </Box>
                        {!!formError && formError.includes('İçerik') && <FormErrorMessage>{formError}</FormErrorMessage>}
                    </FormControl>
                    <FormControl id="lec-imageUrl">
                        <FormLabel fontSize="sm">Görsel URL (Opsiyonel):</FormLabel>
                        <Input name="imageUrl" value={lectureFormData.imageUrl} onChange={handleLectureDataInputChange} placeholder="https://..." isDisabled={isUploading} bg={inputSelectBg} />
                        <Text fontSize="xs" color="textMuted" mt={1}>Editörden resim eklemeniz önerilir. Burası ana görsel linki içindir.</Text>
                    </FormControl>
                    
                    <HStack spacing={3} mt={5} alignSelf="flex-start">
                        <Button type="submit" colorScheme="green" isLoading={isSaving || isUploading} loadingText="Kaydediliyor..." leftIcon={<Icon as={FaSave}/>}>{editingLecture ? 'Güncelle' : 'Ekle'}</Button>
                        {(editingLecture || lectureFormData.title || lectureFormData.examClassificationId || lectureFormData.branchId || lectureFormData.selectedKonuId) && (
                            <Button variant="ghost" onClick={resetForm} isDisabled={isSaving || isUploading} leftIcon={<Icon as={FaTimesCircle}/>}>Temizle/İptal</Button>
                        )}
                    </HStack>
                </VStack>
            </Box>

            <Heading as="h4" size="md" mb={4} color="textPrimary">Mevcut Konu Anlatımları</Heading>
             {loading && lectures.length === 0 ? null : // Ana yükleme spinner'ı zaten yukarıda
              lectures.length === 0 && !error ? (
                <Alert status="info" variant="subtle" borderRadius="md"> <AlertIcon /> Konu anlatımı bulunamadı. </Alert>
            ) : !error && lectures.length > 0 ? (
                <TableContainer borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="sm">
                  <Table variant="striped" size="sm">
  <Thead bg={tableHeaderBg}>
    <Tr>
      <Th>ID</Th>
      <Th>Başlık</Th>
      <Th>Sınav Tipi</Th>
      <Th>Branş</Th>
      <Th>Konu (ID)</Th>
      <Th>Görsel</Th>
      <Th isNumeric>İşlemler</Th>
    </Tr>
  </Thead>
  <Tbody>
                            {lectures.map((lecture) => {
                                let topicName = '-';
                                let branchName = '-';
                                const topicNode = lecture.topicId ? findTopicByIdRecursive(topicsTree, lecture.topicId) : null;
                                if (topicNode) {
                                    topicName = topicNode.name;
                                    const branch = branches.find(b => b.id === topicNode.branchId);
                                    if(branch) branchName = branch.name;
                                }
                                const examClassificationName = examClassifications.find(ec => ec.id === lecture.examClassificationId)?.name || '-';
                                return (
                                    <Tr key={lecture.id} _hover={{ bg: tableRowHoverBg }}>
                                        <Td>{lecture.id}</Td>
                                        <Td maxW="250px" whiteSpace="normal" title={lecture.title}>{lecture.title.substring(0,50)}{lecture.title.length > 50 ? "..." : ""}</Td>
                                        <Td>{examClassificationName}</Td>
                                        <Td>{branchName}</Td>
                                        <Td>{topicName} <Text as="span" fontSize="xs" color="textMuted">({lecture.topicId || '-'})</Text></Td>
                                        <Td>{lecture.imageUrl ? (<ChakraLink href={lecture.imageUrl} isExternal color="blue.500" fontSize="xs" maxW="100px" isTruncated title={lecture.imageUrl}>Link</ChakraLink>) : '-'}</Td>
                                        <Td isNumeric><HStack spacing={1} justify="flex-end">
                                            <Tooltip label="Düzenle" fontSize="xs"><IconButton icon={<Icon as={FaEdit} />} size="xs" variant="ghost" colorScheme="blue" onClick={() => handleEdit(lecture)} aria-label="Düzenle"/></Tooltip>
                                            <Tooltip label="Sil" fontSize="xs"><IconButton icon={<Icon as={FaTrashAlt} />} size="xs" variant="ghost" colorScheme="red" onClick={() => openDeleteConfirmation(lecture)} aria-label="Sil"/></Tooltip>
                                        </HStack></Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>
                </TableContainer>
            ) : null}

            <Modal isOpen={isDeleteConfirmOpen} onClose={onDeleteConfirmClose} isCentered>
                 <ModalOverlay />
                <ModalContent bg={componentBg}>
                    <ModalHeader>Konu Anlatımı Silme Onayı</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        Konu anlatımını ("{lectureToDelete?.title}" - ID: {lectureToDelete?.id}) silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                    </ModalBody>
                    <ModalFooter>
                        <Button variant='ghost' mr={3} onClick={onDeleteConfirmClose} isDisabled={isSaving}>İptal</Button>
                        <Button colorScheme='red' onClick={handleDeleteConfirm} isLoading={isSaving} loadingText="Siliniyor..."> Sil </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}

export default LectureManagement;