import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'; // useMemo eklendi
import axios from 'axios';
import { Editor } from '@tinymce/tinymce-react';
import {
    Box, Center, Heading,
    Spinner, Alert, AlertIcon, useToast, useDisclosure,
    Button, IconButton, Icon, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
    Select, FormControl, FormLabel, Input, Textarea,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    VStack, HStack, Text, Link as ChakraLink, SimpleGrid, // SimpleGrid eklendi
    useColorModeValue, FormErrorMessage
} from '@chakra-ui/react';
import { FaChalkboardTeacher, FaUserEdit, FaTrashAlt, FaSave, FaTimesCircle, FaUpload } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Konu ağacında belirli bir ID'ye sahip konuyu ve ebeveynlerini bulan yardımcı fonksiyon
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


function LectureManagement({ token }) {
    const [lectures, setLectures] = useState([]);
    const [topicsTree, setTopicsTree] = useState([]); // Hiyerarşik konu ağacı
    const [branches, setBranches] = useState([]); // YENİ: Branşlar için state
    const [examClassifications, setExamClassifications] = useState([]);
    
    const [loading, setLoading] = useState(true);
    // const [loadingDropdowns, setLoadingDropdowns] = useState(true); // loading state'i genel olarak kullanılacak
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [editingLecture, setEditingLecture] = useState(null);
    
    const initialLectureFormState = { 
        title: '', content: '', imageUrl: '', examClassificationId: '',
        // topicId artık doğrudan formState'te değil, aşamalı seçimlerden sonra belirlenecek.
        // Ancak backend'e gönderilecek lectureData içinde olacak.
    };
    const [lectureFormData, setLectureFormData] = useState(initialLectureFormState); // Ana form verileri (başlık, içerik vs.)

    // YENİ: Aşamalı konu seçimi için state'ler
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [selectedL1TopicId, setSelectedL1TopicId] = useState(''); // Ana Kategori
    const [selectedL2TopicId, setSelectedL2TopicId] = useState(''); // Kategori altındaki Konu
    const [selectedL3TopicId, setSelectedL3TopicId] = useState(''); // Konu altındaki Alt Konu (nihai topicId)


    const [isUploading, setIsUploading] = useState(false);
    const editorRef = useRef(null);
    const toast = useToast();
    const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
    const [lectureToDelete, setLectureToDelete] = useState(null);

    const lectureFormBg = useColorModeValue('green.50', 'green.900');
    const lectureFormBorder = useColorModeValue('green.200', 'green.700');
    const tinySkin = useColorModeValue("oxide", "oxide-dark");
    const tinyContentCss = useColorModeValue("default", "dark");

    const backendLectureUrl = `${API_BASE_URL}/api/lectures`;
    const backendTopicUrl = `${API_BASE_URL}/api/topics`;
    const backendBranchesUrl = `${API_BASE_URL}/api/branches`; // YENİ: Branş API endpoint'i
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
            const [lecturesRes, topicsRes, classificationsRes, branchesRes] = await Promise.all([ // branchesRes eklendi
                axios.get(backendLectureUrl, config),
                axios.get(backendTopicUrl, config),
                axios.get(examClassificationsUrl, config),
                axios.get(backendBranchesUrl, config) // Branşlar çekiliyor
            ]);
            setLectures(Array.isArray(lecturesRes.data) ? lecturesRes.data : []);
            setTopicsTree(Array.isArray(topicsRes.data) ? topicsRes.data : []);
            setExamClassifications(Array.isArray(classificationsRes.data) ? classificationsRes.data : []);
            setBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []); // Branş state'i güncelleniyor
        } catch (err) {
            console.error("Lecture/Topic/Classification/Branch Verisi çekerken hata:", err);
            const errorMsg = err.response?.data?.message || 'Veriler yüklenirken hata oluştu.';
            setError(errorMsg);
            setLectures([]); setTopicsTree([]); setExamClassifications([]); setBranches([]);
            toast({ title: "Veri Yükleme Hatası", description: errorMsg, status: "error", duration: 3000, isClosable: true });
        } finally {
            setLoading(false);
        }
    }, [token, backendLectureUrl, backendTopicUrl, examClassificationsUrl, backendBranchesUrl, toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Aşamalı Dropdown Seçenekleri
    const branchOptions = useMemo(() => branches, [branches]);

    const l1TopicOptions = useMemo(() => { // Ana Kategoriler
        if (!selectedBranchId) return [];
        return topicsTree.filter(topic => topic.branchId === parseInt(selectedBranchId) && !topic.parentId);
    }, [selectedBranchId, topicsTree]);

    const l2TopicOptions = useMemo(() => { // Konular
        if (!selectedL1TopicId) return [];
        const parentTopic = findTopicPathById(topicsTree, parseInt(selectedL1TopicId))?.pop();
        return parentTopic?.children || [];
    }, [selectedL1TopicId, topicsTree]);

    const l3TopicOptions = useMemo(() => { // Alt Konular
        if (!selectedL2TopicId) return [];
        const parentTopic = findTopicPathById(topicsTree, parseInt(selectedL2TopicId))?.pop();
        return parentTopic?.children || [];
    }, [selectedL2TopicId, topicsTree]);


    // Dropdown Değişiklik Handler'ları
    const handleBranchChange = (e) => {
        setSelectedBranchId(e.target.value);
        setSelectedL1TopicId('');
        setSelectedL2TopicId('');
        setSelectedL3TopicId('');
    };
    const handleL1TopicChange = (e) => {
        setSelectedL1TopicId(e.target.value);
        setSelectedL2TopicId('');
        setSelectedL3TopicId('');
    };
    const handleL2TopicChange = (e) => {
        setSelectedL2TopicId(e.target.value);
        setSelectedL3TopicId('');
    };
    const handleL3TopicChange = (e) => {
        setSelectedL3TopicId(e.target.value);
    };
    
    // Ana form verileri için input change handler
    const handleLectureDataInputChange = (e) => { 
        const { name, value } = e.target; 
        setLectureFormData(prev => ({ ...prev, [name]: value })); 
    };
    const handleEditorChange = (content, editor) => { 
        setLectureFormData(prev => ({ ...prev, content: content })); 
    };

    const getFinalTopicId = useCallback(() => {
        return selectedL3TopicId || selectedL2TopicId || selectedL1TopicId || null;
    }, [selectedL1TopicId, selectedL2TopicId, selectedL3TopicId]);


    const handleFormSubmit = async (e) => {
        e.preventDefault(); setFormError('');
        const finalTopicId = getFinalTopicId();

        if (!finalTopicId) { setFormError('Lütfen bir konu (en alt seviyeye kadar) seçin.'); return; }
        if (!lectureFormData.examClassificationId) { setFormError('Lütfen bir sınav sınıflandırması seçin.'); return; }
        
        const editorContent = editorRef.current ? editorRef.current.getContent() : lectureFormData.content;
        if (!lectureFormData.title.trim() || !editorContent || editorContent.trim() === '<p><br data-mce-bogus="1"></p>' || editorContent.trim() === '<p><br></p>') {
            setFormError('Başlık ve İçerik alanları zorunludur.');
            return;
        }

        const lecturePayload = {
            ...lectureFormData, // title, content, imageUrl, examClassificationId
            topicId: parseInt(finalTopicId),
            // lectureFormData'dan title ve content trim edilebilir, imageUrl kontrol edilebilir
            title: lectureFormData.title.trim(),
            imageUrl: lectureFormData.imageUrl.trim() === '' ? null : lectureFormData.imageUrl.trim(),
        };

        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            let message = '';
            if (editingLecture) {
                await axios.put(`${backendLectureUrl}/${editingLecture.id}`, lecturePayload, config);
                message = 'Konu anlatımı güncellendi!';
            } else {
                await axios.post(backendLectureUrl, lecturePayload, config);
                message = 'Konu anlatımı eklendi!';
            }
            resetForm(); // Bu resetForm hem lectureFormData'yı hem de selected ID'leri sıfırlamalı
            await fetchData(); // Verileri yenilemek için fetchData yeterli
            toast({ title: "Başarılı", description: message, status: "success", duration: 3000, isClosable: true });
        } catch (err) {
            console.error("Konu anlatımı kaydedilirken hata:", err);
            const errorMsg = err.response?.data?.message || 'Konu anlatımı kaydedilirken bir hata oluştu.';
            setFormError(errorMsg);
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        }
    };

    const handleEdit = useCallback((lecture) => {
        setEditingLecture(lecture);
        setLectureFormData({
            title: lecture.title || '',
            content: lecture.content || '',
            imageUrl: lecture.imageUrl || '',
            examClassificationId: lecture.examClassificationId ? String(lecture.examClassificationId) : ''
        });
        
        // Topic path'ini bul ve state'leri ayarla
        if (lecture.topicId && topicsTree.length > 0) {
            const path = findTopicPathById(topicsTree, lecture.topicId);
            if (path && path.length > 0) {
                const targetTopic = path[path.length - 1];
                setSelectedBranchId(targetTopic.branchId ? String(targetTopic.branchId) : '');

                setSelectedL1TopicId(path[0] ? String(path[0].id) : '');
                setSelectedL2TopicId(path[1] && path[0].id !== path[1].id ? String(path[1].id) : '');
                setSelectedL3TopicId(path[2] && path[1] && path[1].id !== path[2].id ? String(path[2].id) : '');
                
                // Eğer path[0] hedef topic ise L1'e ata, diğerlerini boşalt
                if (path.length === 1) {
                     setSelectedL2TopicId(''); setSelectedL3TopicId('');
                }
                // Eğer path[1] hedef topic ise L2'ye ata, L3'ü boşalt
                else if (path.length === 2) {
                     setSelectedL3TopicId('');
                }
            } else {
                // Topic bulunamazsa veya path boşsa, seçimleri sıfırla
                setSelectedBranchId(''); setSelectedL1TopicId(''); setSelectedL2TopicId(''); setSelectedL3TopicId('');
            }
        } else {
            setSelectedBranchId(''); setSelectedL1TopicId(''); setSelectedL2TopicId(''); setSelectedL3TopicId('');
        }

        setFormError('');
        if (editorRef.current) editorRef.current.setContent(lecture.content || '');
        document.getElementById('lecture-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [topicsTree]); // topicsTree bağımlılığı eklendi

    const openDeleteConfirmation = (lecture) => { setLectureToDelete(lecture); onDeleteConfirmOpen(); };

    const handleDeleteConfirm = async () => {
        if (!lectureToDelete) return;
        // setError(''); 
        onDeleteConfirmClose();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`${backendLectureUrl}/${lectureToDelete.id}`, config);
            toast({ title: "Başarılı", description: `Konu anlatımı (${lectureToDelete.title}) silindi.`, status: "success", duration: 3000, isClosable: true });
            await fetchData();
            if(editingLecture && editingLecture.id === lectureToDelete.id) resetForm();
        } catch (err) {
            console.error("Konu anlatımı silinirken hata:", err);
            const errorMsg = err.response?.data?.message || 'Konu anlatımı silinirken bir hata oluştu.';
            setError(errorMsg); // Genel hata state'i
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        } finally { setLectureToDelete(null); }
    };

    const resetForm = () => {
        setEditingLecture(null); 
        setLectureFormData(initialLectureFormState); 
        setFormError('');
        setSelectedBranchId('');
        setSelectedL1TopicId('');
        setSelectedL2TopicId('');
        setSelectedL3TopicId('');
        if (editorRef.current) editorRef.current.setContent('');
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
            } else {
                reject('Sunucudan geçersiz cevap formatı.');
            }
        })
        .catch(err => {
            console.error('Resim yüklenirken hata:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Resim yüklenemedi.';
            reject(`HTTP Error: ${err.response?.status || 'Bilinmeyen'} - ${errorMsg}`);
        })
        .finally(() => { setIsUploading(false); });
    }), [token, backendUploadUrl]);
    
    // Eski renderTopicOptions fonksiyonu artık kullanılmayacak.

    if (loading) return <Center p={10}><Spinner size="xl" color="brand.500" /></Center>;

    const finalSelectedTopicIdForSubmit = getFinalTopicId();

    return (
        <Box>
            <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3} mb={6}>
                <Icon as={FaChalkboardTeacher} /> Konu Anlatımı Yönetimi
            </Heading>
            {error && ( <Alert status="error" variant="subtle" borderRadius="md" mb={4}> <AlertIcon /> {error} </Alert> )}
            
            <Box id="lecture-form-section" as="form" onSubmit={handleFormSubmit} p={6} borderWidth="1px" borderRadius="lg" borderColor={lectureFormBorder} bg={lectureFormBg} mb={8}>
                <Heading as="h4" size="md" mb={5}>{editingLecture ? `Konu Anlatımı Düzenle (ID: ${editingLecture.id})` : 'Yeni Konu Anlatımı Ekle'}</Heading>
                {formError && <Alert status="warning" variant="subtle" borderRadius="md" mb={4}><AlertIcon />{formError}</Alert>}
                {isUploading && ( <Alert status="info" variant="subtle" borderRadius="md" mb={4}><Spinner size="sm" mr={3}/> Resim yükleniyor...</Alert>)}
                
                <VStack spacing={4} align="stretch">
                    <FormControl isRequired isInvalid={!!formError && formError.includes('Başlık')}>
                        <FormLabel fontSize="sm">Başlık:</FormLabel>
                        <Input name="title" value={lectureFormData.title} onChange={handleLectureDataInputChange} isDisabled={isUploading} />
                         {!!formError && formError.includes('Başlık') && <FormErrorMessage>{formError}</FormErrorMessage>}
                    </FormControl>
                    <FormControl isRequired isInvalid={!!formError && formError.includes('İçerik')}>
                        <FormLabel fontSize="sm">İçerik:</FormLabel>
                        <Box borderWidth="1px" borderRadius="md" borderColor="borderPrimary" overflow="hidden">
                            <Editor
                                apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                onInit={(evt, editor) => editorRef.current = editor}
                                value={lectureFormData.content}
                                init={{ /* ... (TinyMCE init aynı) ... */
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
                    <FormControl>
                        <FormLabel fontSize="sm">Görsel URL (Opsiyonel):</FormLabel>
                        <Input name="imageUrl" value={lectureFormData.imageUrl} onChange={handleLectureDataInputChange} placeholder="https://..." isDisabled={isUploading} />
                        <Text fontSize="xs" color="textMuted" mt={1}>Editörden resim eklemeniz önerilir. Burası ana görsel linki içindir.</Text>
                    </FormControl>
                    <FormControl isRequired isInvalid={!!formError && formError.includes('Sınav Sınıflandırması')}>
                        <FormLabel fontSize="sm">Sınav Sınıflandırması:</FormLabel>
                        <Select name="examClassificationId" value={lectureFormData.examClassificationId} onChange={handleLectureDataInputChange} placeholder="-- Sınıflandırma Seçin --" isDisabled={isUploading || loading}>
                            {examClassifications.map(ec => (<option key={ec.id} value={ec.id}>{ec.name}</option>))}
                        </Select>
                        {!!formError && formError.includes('Sınav Sınıflandırması') && <FormErrorMessage>{formError}</FormErrorMessage>}
                    </FormControl>

                    {/* YENİ: Aşamalı Konu Seçimi */}
                    <Heading as="h5" size="sm" mt={4} mb={2} alignSelf="flex-start">Ait Olduğu Konu Hiyerarşisi</Heading>
                    <SimpleGrid columns={{base: 1, md: 2, lg:4}} spacing={4} w="full">
                        <FormControl>
                            <FormLabel fontSize="sm">1. Branş:</FormLabel>
                            <Select placeholder="-- Branş Seçin --" value={selectedBranchId} onChange={handleBranchChange} isDisabled={loading}>
                                {branchOptions.map(branch => (
                                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">2. Ana Kategori:</FormLabel>
                            <Select placeholder="-- Ana Kategori Seçin --" value={selectedL1TopicId} onChange={handleL1TopicChange} isDisabled={!selectedBranchId || l1TopicOptions.length === 0 || loading}>
                                {l1TopicOptions.map(topic => (
                                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">3. Konu:</FormLabel>
                            <Select placeholder="-- Konu Seçin --" value={selectedL2TopicId} onChange={handleL2TopicChange} isDisabled={!selectedL1TopicId || l2TopicOptions.length === 0 || loading}>
                                {l2TopicOptions.map(topic => (
                                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">4. Alt Konu:</FormLabel>
                            <Select placeholder="-- Alt Konu Seçin --" value={selectedL3TopicId} onChange={handleL3TopicChange} isDisabled={!selectedL2TopicId || l3TopicOptions.length === 0 || loading}>
                                {l3TopicOptions.map(topic => (
                                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                                ))}
                            </Select>
                        </FormControl>
                    </SimpleGrid>
                    {/* Nihai seçilen konuyu göstermek için bir Text (opsiyonel) */}
                    {/* <Text fontSize="xs" color="textMuted" mt={1}>Seçilen Konu ID: {finalSelectedTopicIdForSubmit || "Henüz seçilmedi"}</Text> */}
                     {!!formError && formError.includes('Lütfen bir konu') && <Text color="red.500" fontSize="sm" mt={2}>{formError}</Text>}


                    <HStack spacing={3} mt={5} alignSelf="flex-start">
                        <Button type="submit" colorScheme="green" isLoading={isUploading || loading} loadingText="Kaydediliyor..." leftIcon={<Icon as={FaSave}/>}>{editingLecture ? 'Güncelle' : 'Ekle'}</Button>
                        {editingLecture && (<Button variant="ghost" onClick={resetForm} isDisabled={isUploading || loading} leftIcon={<Icon as={FaTimesCircle}/>}>İptal</Button>)}
                    </HStack>
                </VStack>
            </Box>

            {/* Mevcut Konu Anlatımları Tablosu (Aynı) */}
            <Heading as="h4" size="md" mb={4}>Mevcut Konu Anlatımları</Heading>
            {/* ... (tablo aynı) ... */}
             {lectures.length === 0 && !loading && !error ? (
                <Alert status="info" variant="subtle" borderRadius="md"> <AlertIcon /> Konu anlatımı bulunamadı. </Alert>
            ) : (
                <TableContainer borderWidth="1px" borderRadius="md" borderColor="borderSecondary">
                    <Table variant="striped" size="sm"><Thead bg="bgTertiary"><Tr><Th>ID</Th> <Th>Başlık</Th> <Th>Konu Adı (ID)</Th><Th>Sınav Türü</Th> <Th>Görsel URL</Th> <Th isNumeric>İşlemler</Th></Tr></Thead>
                        <Tbody>
                            {lectures.map((lecture) => {
                                // lecture.topicId kullanarak topicsTree'den tam konuyu ve adını bul.
                                // Bu işlem maliyetli olabilir, optimizasyon gerekebilir.
                                // Şimdilik, lecture.topic varsa onu, yoksa ID'yi gösterelim.
                                // Backend'den lecture.topic nesnesinin gelmesi idealdir.
                                let topicName = '-';
                                if (lecture.topic) { // Eğer backend topic nesnesini lecture ile birlikte gönderiyorsa
                                    topicName = lecture.topic.name;
                                } else if (lecture.topicId && topicsTree.length > 0) {
                                    const path = findTopicPathById(topicsTree, lecture.topicId);
                                    if (path && path.length > 0) {
                                        topicName = path[path.length -1].name;
                                    }
                                }
                                return (
                                    <Tr key={lecture.id} _hover={{ bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.100' }}}>
                                        <Td>{lecture.id}</Td>
                                        <Td>{lecture.title}</Td>
                                        <Td>{topicName} {lecture.topicId ? `(${lecture.topicId})` : ''}</Td>
                                        <Td>{examClassifications.find(ec => ec.id === lecture.examClassificationId)?.name || '-'}</Td>
                                        <Td>{lecture.imageUrl ? (<ChakraLink href={lecture.imageUrl} isExternal color="blue.500" fontSize="xs" maxW="150px" isTruncated title={lecture.imageUrl}>{lecture.imageUrl}</ChakraLink>) : '-'}</Td>
                                        <Td isNumeric><HStack spacing={1} justify="flex-end">
                                            <IconButton icon={<Icon as={FaUserEdit} />} size="xs" variant="ghost" colorScheme="blue" onClick={() => handleEdit(lecture)} aria-label="Düzenle" title="Düzenle"/>
                                            <IconButton icon={<Icon as={FaTrashAlt} />} size="xs" variant="ghost" colorScheme="red" onClick={() => openDeleteConfirmation(lecture)} aria-label="Sil" title="Sil"/>
                                        </HStack></Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>
                </TableContainer>
            )}

            {/* Silme Onay Modalı (Aynı) */}
            <Modal isOpen={isDeleteConfirmOpen} onClose={onDeleteConfirmClose} isCentered>
                {/* ... (içerik aynı) ... */}
                 <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Konu Anlatımı Silme Onayı</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        Konu anlatımını ({lectureToDelete?.title} - ID: {lectureToDelete?.id}) silmek istediğinizden emin misiniz?
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

export default LectureManagement;