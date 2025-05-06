// src/pages/AdminPage.jsx

import React, { useState, useEffect, useCallback, Fragment, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Editor } from '@tinymce/tinymce-react';
import DOMPurify from 'dompurify';
// import AdminStatsOverview from '../components/AdminStatsOverview'; // Artık bu dosyada tanımlı

// --- Chakra UI Imports ---
import {
  Box,
  Container,
  Center,
  Heading,
  Tabs, // Sekmeli yapı için
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner, // Yükleme göstergesi
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast, // Bildirimler için
  useDisclosure, // Modal için
  Button,
  IconButton,
  Icon,
  Table, // Tablolar için
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge, // Roller için
  Select, // Rol/Konu seçimi
  FormControl, // Formlar için
  FormLabel,
  Input,
  Textarea,
  SimpleGrid, // Form veya grid düzeni için
  Modal, // Onay/Bilgi Modalları için
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack, // Dikey yığınlama
  HStack, // Yatay dizilim
  Text,
  Link as ChakraLink, // Linkler
  Stat, StatLabel, StatNumber, StatGroup, // İstatistikler için
  List, ListItem, // Konu hiyerarşisi için
  useColorModeValue // Açık/Koyu mod renkleri
} from '@chakra-ui/react';

// --- React Icons Imports ---
import {
    FaUsers, FaTags, FaChalkboardTeacher, FaQuestionCircle, FaUserEdit, FaTrashAlt,
    FaChartBar, FaFolderOpen, FaFileAlt, FaSave, FaTimesCircle, FaPlus, FaUpload,
    FaExclamationTriangle, FaInfoCircle, FaRedo
} from 'react-icons/fa';

// API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Uzmanlık Alanları (Tek bir yerde tanımlı)
const specializations = [
    "YDUS", "TUS", "DUS", "Tıp Fakültesi Dersleri", "Diş Hekimliği Fakültesi Dersleri", "Diğer"
];

// === Alt Bileşenler (Chakra UI ile Refactor Edilmiş) ===

// --- AdminStatsOverview Component ---
function AdminStatsOverview({ token }) {
    const [overviewStats, setOverviewStats] = useState(null);
    const [userSummaries, setUserSummaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSpec, setSelectedSpec] = useState('');
    const toast = useToast();

    const backendOverviewUrl = `${API_BASE_URL}/api/stats/admin/overview`;
    const backendUserSummariesUrl = `${API_BASE_URL}/api/stats/admin/user-summaries`;

    const fetchStats = useCallback(async (filter = '') => {
        setLoading(true); setError(''); setUserSummaries([]); setOverviewStats(null);
        if (!token) { setError("Yetkilendirme token'ı bulunamadı."); setLoading(false); return; }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            let overviewUrl = backendOverviewUrl;
            let userSummariesUrl = backendUserSummariesUrl;
            if (filter) {
                const queryParam = `?specialization=${encodeURIComponent(filter)}`;
                overviewUrl += queryParam;
                userSummariesUrl += queryParam;
            }
            const [overviewRes, summariesRes] = await Promise.all([
                axios.get(overviewUrl, config),
                axios.get(userSummariesUrl, config)
            ]);
            setOverviewStats(overviewRes.data);
            setUserSummaries(summariesRes.data || []);
        } catch (err) {
            console.error("Admin istatistikleri çekerken hata:", err);
            const errorMsg = err.response?.data?.message || 'İstatistikler yüklenirken bir hata oluştu.';
            setError(errorMsg);
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        } finally {
            setLoading(false);
        }
    }, [token, backendOverviewUrl, backendUserSummariesUrl, toast]);

    useEffect(() => { fetchStats(selectedSpec); }, [fetchStats, selectedSpec]);

    const handleFilterChange = (event) => setSelectedSpec(event.target.value);

    if (loading) return <Center p={10}><Spinner size="xl" /></Center>;

    return (
        <VStack spacing={6} align="stretch">
            <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3}>
                <Icon as={FaChartBar} /> Genel Bakış ve Kullanıcı Performansları
            </Heading>

            {error && (
                <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <FormControl id="spec-filter">
                <FormLabel>Uzmanlık Alanına Göre Filtrele:</FormLabel>
                <Select value={selectedSpec} onChange={handleFilterChange} placeholder="Tümü">
                    {specializations.map(spec => (<option key={spec} value={spec}>{spec}</option>))}
                </Select>
            </FormControl>

            {/* Genel İstatistik Özeti */}
            {overviewStats && (
                <Box borderWidth="1px" borderRadius="lg" p={6} borderColor="borderPrimary" bg="bgSecondary">
                    <Heading as="h4" size="md" mb={4}>Genel Özet ({overviewStats.filter})</Heading>
                    <StatGroup>
                        <Stat>
                            <StatLabel>Kullanıcı Sayısı</StatLabel>
                            <StatNumber>{overviewStats.userCount}</StatNumber>
                        </Stat>
                        <Stat>
                            <StatLabel>Toplam Deneme</StatLabel>
                            <StatNumber>{overviewStats.totalAttempts}</StatNumber>
                        </Stat>
                        <Stat>
                            <StatLabel>Doğru Sayısı</StatLabel>
                            <StatNumber color="green.500">{overviewStats.correctAttempts}</StatNumber>
                        </Stat>
                         <Stat>
                            <StatLabel>Başarı Oranı</StatLabel>
                            <StatNumber color={overviewStats.accuracy >= 80 ? 'green.500' : overviewStats.accuracy >= 50 ? 'yellow.500' : 'red.500'}>
                                %{overviewStats.accuracy}
                            </StatNumber>
                        </Stat>
                    </StatGroup>
                </Box>
            )}

            {/* Kullanıcı Performans Listesi */}
            <Box>
                <Heading as="h4" size="md" mb={4}>Kullanıcı Performansları ({selectedSpec || 'Tümü'})</Heading>
                {userSummaries.length === 0 && !loading ? (
                     <Alert status="info" borderRadius="md">
                         <AlertIcon /> Filtreye uygun kullanıcı veya deneme bulunamadı.
                     </Alert>
                ) : (
                    <TableContainer borderWidth="1px" borderRadius="md" borderColor="borderSecondary">
                        <Table variant="striped" size="sm">
                            <Thead bg="bgTertiary">
                                <Tr>
                                    <Th>Kullanıcı Adı</Th>
                                    <Th isNumeric>Toplam Deneme</Th>
                                    <Th isNumeric>Doğru Sayısı</Th>
                                    <Th isNumeric>Başarı Oranı (%)</Th>
                                    {/* <Th>Detay</Th> */}
                                </Tr>
                            </Thead>
                            <Tbody>
                                {userSummaries.map(userStat => (
                                    <Tr key={userStat.userId}>
                                        <Td>{userStat.username} <Text as="span" fontSize="xs" color="textMuted">(ID: {userStat.userId})</Text></Td>
                                        <Td isNumeric>{userStat.totalAttempts}</Td>
                                        <Td isNumeric>{userStat.correctAttempts}</Td>
                                        <Td isNumeric color={userStat.accuracy >= 80 ? 'green.600' : userStat.accuracy >= 50 ? 'yellow.600' : 'red.600'}>
                                            {userStat.accuracy}%
                                        </Td>
                                        {/* Detay linki eklenebilir */}
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        </VStack>
    );
}

// --- User Management Component ---
function UserManagement({ token }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user: adminUser } = useAuth();
    const toast = useToast();
    const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
    const { isOpen: isStatsOpen, onOpen: onStatsOpen, onClose: onStatsClose } = useDisclosure();
    const [actionUser, setActionUser] = useState(null); // Silme/Rol onayı için
    const [actionType, setActionType] = useState(''); // 'delete' or 'role'
    const [newRole, setNewRole] = useState(''); // Rol değişimi için
    const [userStats, setUserStats] = useState([]); // Kullanıcı istatistikleri için
    const [statsLoading, setStatsLoading] = useState(false);

    const backendUserUrl = `${API_BASE_URL}/api/users`;
    const backendStatsUrl = `${API_BASE_URL}/api/stats/admin/user`;

    const fetchUsers = useCallback(async () => {
        setLoading(true); setError('');
        if (!token) { setError("Yetkilendirme token'ı bulunamadı."); setLoading(false); return; }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(backendUserUrl, config);
            setUsers(response.data || []);
        } catch (err) {
            console.error("Kullanıcıları çekerken hata:", err);
            setError(err.response?.data?.message || 'Kullanıcılar yüklenirken bir hata oluştu.');
            setUsers([]);
        } finally { setLoading(false); }
    }, [token, backendUserUrl]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const openConfirmation = (type, user, role = '') => {
        if (user.id === adminUser?.id && (type === 'delete' || type === 'role')) {
            toast({ title: "İşlem İptal", description: type === 'delete' ? "Kendinizi silemezsiniz." : "Kendi rolünüzü buradan değiştiremezsiniz.", status: "warning", duration: 3000, isClosable: true });
            return;
        }
        setActionUser(user);
        setActionType(type);
        if (type === 'role') setNewRole(role);
        onConfirmOpen();
    };

    const handleConfirmAction = async () => {
        setError('');
        onConfirmClose(); // Modalı kapat
        if (!actionUser || !actionType) return;

        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            if (actionType === 'delete') {
                await axios.delete(`${backendUserUrl}/${actionUser.id}`, config);
                toast({ title: "Başarılı", description: `Kullanıcı (${actionUser.username}) silindi.`, status: "success", duration: 3000, isClosable: true });
            } else if (actionType === 'role') {
                if (!newRole) {
                    toast({ title: "Hata", description: "Geçerli bir rol seçilmedi.", status: "error", duration: 3000, isClosable: true });
                    return;
                }
                await axios.put(`${backendUserUrl}/${actionUser.id}/role`, { role: newRole }, config);
                toast({ title: "Başarılı", description: `${actionUser.username} rolü ${newRole} olarak güncellendi.`, status: "success", duration: 3000, isClosable: true });
            }
            fetchUsers(); // Listeyi yenile
        } catch (err) {
            console.error(`Kullanıcı ${actionType} işlemi sırasında hata:`, err);
            const errorMsg = err.response?.data?.message || `Kullanıcı ${actionType === 'delete' ? 'silinirken' : 'rolü güncellenirken'} bir hata oluştu.`;
            setError(errorMsg); // Sayfada genel hata göster
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        } finally {
            setActionUser(null);
            setActionType('');
            setNewRole('');
        }
    };

    const handleViewUserStats = async (user) => {
        setActionUser(user); // Hangi kullanıcının istatistiklerine bakılacak
        setStatsLoading(true);
        setError('');
        setUserStats([]); // Önceki veriyi temizle
        onStatsOpen(); // Modalı aç
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const statsUrl = `${backendStatsUrl}/${user.id}/detailed`;
            const response = await axios.get(statsUrl, config);
            setUserStats(response.data || []);
        } catch (err) {
            console.error(`Kullanıcı ${user.id} istatistikleri getirilirken hata:`, err);
            const errorMsg = err.response?.data?.message || 'İstatistikler getirilemedi.';
             // Modal içinde hata göstermek daha iyi olabilir
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
            setError(errorMsg); // Genel hata da set edilebilir
            onStatsClose(); // Hata olursa modalı kapatabiliriz
        } finally {
            setStatsLoading(false);
        }
    };

    if (loading) return <Center p={10}><Spinner size="xl" /></Center>;

    return (
        <Box> {/* Eski admin-section yerine Box */}
            <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3} mb={6}>
                <Icon as={FaUsers} /> Kullanıcı Yönetimi
            </Heading>

            {error && (
                <Alert status="error" borderRadius="md" mb={4}>
                    <AlertIcon /> {error}
                </Alert>
            )}

            {users.length === 0 && !loading ? (
                <Alert status="info" borderRadius="md">
                    <AlertIcon /> Kullanıcı bulunamadı.
                </Alert>
            ) : (
                <TableContainer borderWidth="1px" borderRadius="md" borderColor="borderSecondary">
                    <Table variant="striped" size="sm">
                        <Thead bg="bgTertiary">
                            <Tr>
                                <Th>ID</Th>
                                <Th>Kullanıcı Adı</Th>
                                <Th>Rol</Th>
                                <Th>Uzmanlık</Th>
                                <Th>Kayıt Tarihi</Th>
                                <Th isNumeric>İşlemler</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {users.map((user) => (
                                <Tr key={user.id}>
                                    <Td>{user.id}</Td>
                                    <Td>{user.username}</Td>
                                    <Td>
                                        <Badge colorScheme={user.role === 'admin' ? 'green' : 'gray'} variant="solid">
                                            {user.role}
                                        </Badge>
                                    </Td>
                                    <Td>{user.specialization || '-'}</Td>
                                    <Td>{new Date(user.createdAt).toLocaleDateString()}</Td>
                                    <Td isNumeric>
                                        <HStack spacing={1} justify="flex-end">
                                             {/* Rol Değiştirme */}
                                             <Select
                                                 size="xs"
                                                 w="90px" // Sabit genişlik
                                                 variant="outline"
                                                 defaultValue={user.role}
                                                 onChange={(e) => openConfirmation('role', user, e.target.value)}
                                                 isDisabled={user.id === adminUser?.id}
                                                 aria-label={`${user.username} için rol seç`}
                                                 onClick={(e) => e.stopPropagation()} // Trigger modal instead of row hover etc.
                                             >
                                                <option value="user">user</option>
                                                <option value="admin">admin</option>
                                            </Select>
                                            {/* İstatistikler Butonu */}
                                            <IconButton
                                                icon={<Icon as={FaChartBar} />}
                                                size="xs"
                                                variant="ghost"
                                                colorScheme="blue"
                                                onClick={() => handleViewUserStats(user)}
                                                aria-label="Kullanıcı İstatistikleri"
                                                title="Kullanıcı İstatistikleri"
                                            />
                                            {/* Sil Butonu */}
                                            <IconButton
                                                icon={<Icon as={FaTrashAlt} />}
                                                size="xs"
                                                variant="ghost"
                                                colorScheme="red"
                                                onClick={() => openConfirmation('delete', user)}
                                                isDisabled={user.id === adminUser?.id}
                                                aria-label="Kullanıcıyı Sil"
                                                title="Kullanıcıyı Sil"
                                            />
                                        </HStack>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </TableContainer>
            )}

            {/* Onay Modalı */}
            <Modal isOpen={isConfirmOpen} onClose={onConfirmClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>İşlem Onayı</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {actionType === 'delete' && `Kullanıcıyı (${actionUser?.username} - ID: ${actionUser?.id}) silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`}
                        {actionType === 'role' && `Kullanıcı (${actionUser?.username} - ID: ${actionUser?.id}) rolünü "${newRole}" olarak değiştirmek istediğinize emin misiniz?`}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant='ghost' mr={3} onClick={onConfirmClose}>İptal</Button>
                        <Button colorScheme={actionType === 'delete' ? 'red' : 'green'} onClick={handleConfirmAction}>
                            Onayla
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

             {/* Kullanıcı İstatistikleri Modalı */}
            <Modal isOpen={isStatsOpen} onClose={onStatsClose} size="xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Kullanıcı İstatistikleri: {actionUser?.username}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {statsLoading ? (
                            <Center><Spinner /></Center>
                        ) : userStats.length > 0 ? (
                            <TableContainer>
                                <Table variant="simple" size="sm">
                                    <Thead>
                                        <Tr>
                                            <Th>Konu</Th>
                                            <Th isNumeric>Deneme</Th>
                                            <Th isNumeric>Doğru</Th>
                                            <Th isNumeric>Başarı (%)</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {userStats.map(stat => (
                                            <Tr key={stat.topicId}>
                                                <Td>{stat.topicName}</Td>
                                                <Td isNumeric>{stat.totalAttempts}</Td>
                                                <Td isNumeric>{stat.correctAttempts}</Td>
                                                <Td isNumeric color={stat.accuracy >= 80 ? 'green.500' : stat.accuracy >= 50 ? 'yellow.500' : 'red.500'}>
                                                    {stat.accuracy}%
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Text>Bu kullanıcı için istatistik verisi bulunamadı.</Text>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={onStatsClose}>Kapat</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </Box>
    );
}

// --- Topic Management Component ---
function TopicManagement({ token }) {
    const [topics, setTopics] = useState([]);
    const [allTopicsFlat, setAllTopicsFlat] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [editingTopic, setEditingTopic] = useState(null);
    const [formState, setFormState] = useState({ name: '', description: '', parentId: '' });
    const toast = useToast();
    const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
    const [topicToDelete, setTopicToDelete] = useState(null);

    const backendUrl = `${API_BASE_URL}/api/topics`;

     const flattenTopicsForSelect = useCallback((nodes, list = [], level = 0) => {
        nodes.forEach(node => {
            list.push({ id: node.id, name: '\u00A0'.repeat(level * 4) + node.name });
            if (node.children) flattenTopicsForSelect(node.children, list, level + 1);
        });
        return list;
    }, []); // Bağımlılık yok

    const fetchTopics = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(backendUrl, config);
            const treeData = response.data || [];
            setTopics(treeData);
            setAllTopicsFlat(flattenTopicsForSelect(treeData)); // Select için düz listeyi oluştur
        } catch (err) {
             console.error("Konuları çekerken hata:", err);
             setError(err.response?.data?.message || 'Konular yüklenirken bir hata oluştu.');
             setTopics([]); setAllTopicsFlat([]);
        } finally { setLoading(false); }
    }, [token, backendUrl, flattenTopicsForSelect]);

    useEffect(() => { fetchTopics(); }, [fetchTopics]);

    const handleInputChange = (e) => { const { name, value } = e.target; setFormState(prev => ({ ...prev, [name]: value })); };

    const handleFormSubmit = async (e) => {
        e.preventDefault(); setFormError('');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const topicData = { name: formState.name.trim(), description: formState.description.trim(), parentId: formState.parentId === '' ? null : parseInt(formState.parentId, 10) };
        if (!topicData.name) { setFormError("Konu adı boş bırakılamaz."); return; }

        try {
            let message = '';
            if (editingTopic) {
                await axios.put(`${backendUrl}/${editingTopic.id}`, topicData, config);
                message = 'Konu başarıyla güncellendi!';
            } else {
                await axios.post(backendUrl, topicData, config);
                message = 'Konu başarıyla eklendi!';
            }
            resetForm();
            fetchTopics();
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
        setFormState({ name: topicDataToEdit.name, description: topicDataToEdit.description || '', parentId: topicDataToEdit.parentId === null ? '' : String(topicDataToEdit.parentId) });
        setFormError('');
        document.getElementById('topic-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const openDeleteConfirmation = (topic) => {
        setTopicToDelete(topic);
        onDeleteConfirmOpen();
    };

     const handleDeleteConfirm = async () => {
         if (!topicToDelete) return;
         setError('');
         onDeleteConfirmClose();
         try {
             const config = { headers: { Authorization: `Bearer ${token}` } };
             await axios.delete(`${backendUrl}/${topicToDelete.id}`, config);
             toast({ title: "Başarılı", description: `Konu (${topicToDelete.name}) silindi.`, status: "success", duration: 3000, isClosable: true });
             fetchTopics(); // Listeyi yenile
         } catch (err) {
             console.error("Konu silinirken hata:", err);
             const errorMsg = err.response?.data?.message || 'Konu silinirken bir hata oluştu.';
             setError(errorMsg); // Genel hata listesi için
             toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
         } finally {
             setTopicToDelete(null);
         }
     };

    const resetForm = () => { setEditingTopic(null); setFormState({ name: '', description: '', parentId: '' }); setFormError(''); };

    // Recursive Topic Node (Chakra ile stilize edilmiş)
    const TopicNode = ({ topic, level = 0 }) => (
         <Flex
             className='topic-node-item' // Sınıf adı referans için kalabilir
             justify="space-between"
             align="center"
             py={2} // Daha sıkışık
             px={4}
             borderBottomWidth="1px"
             borderColor="borderSecondary"
             ml={`${level * 1.5}rem`} // Girinti için Chakra spacing yerine rem
             bg={level > 0 ? useColorModeValue(`gray.${50 + level * 50}`, `gray.${800 - level * 50}`) : 'transparent'} // Girintiye göre hafif renk farkı
             _last={{ borderBottomWidth: 0 }}
             _hover={{ bg: 'bgTertiary' }}
         >
            <HStack spacing={3} flex={1} minW={0}> {/* Taşan isimler için */}
                 <Icon as={topic.children?.length ? FaFolderOpen : FaFileAlt} color="textMuted" />
                 <Text isTruncated title={topic.name}>[{topic.id}] {topic.name}</Text>
             </HStack>
             <HStack spacing={1} className='topic-actions'>
                 <IconButton icon={<Icon as={FaUserEdit} />} size="xs" variant="ghost" colorScheme="blue" onClick={() => handleEdit(topic)} aria-label="Düzenle" title="Düzenle" />
                 <IconButton icon={<Icon as={FaTrashAlt} />} size="xs" variant="ghost" colorScheme="red" onClick={() => openDeleteConfirmation(topic)} aria-label="Sil" title="Sil" />
             </HStack>
        </Flex>
    );

    // Recursive Render Fonksiyonu
     const renderTopics = (topics, level = 0) => {
         return topics.map(topic => (
             // Fragment yerine Box kullanılabilir veya doğrudan TopicNode
             <React.Fragment key={topic.id}>
                 <TopicNode topic={topic} level={level} />
                 {Array.isArray(topic.children) && topic.children.length > 0 && (
                      renderTopics(topic.children, level + 1)
                 )}
             </React.Fragment>
         ));
     };

    if (loading) return <Center p={10}><Spinner size="xl" /></Center>;

    return (
        <Box> {/* Eski admin-section */}
            <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3} mb={6}>
                 <Icon as={FaTags} /> Konu Yönetimi
             </Heading>

            {error && (
                <Alert status="error" borderRadius="md" mb={4}>
                     <AlertIcon /> {error}
                </Alert>
             )}

            {/* Konu Formu */}
             <Box id="topic-form-section" as="form" onSubmit={handleFormSubmit} p={6} borderWidth="1px" borderRadius="lg" borderColor="blue.200" bg="blue.50" _dark={{bg:"blue.900", borderColor:"blue.700"}} mb={8}>
                <Heading as="h4" size="md" mb={5}>{editingTopic ? `Konu Düzenle (ID: ${editingTopic.id})` : 'Yeni Konu Ekle'}</Heading>

                {formError && <Alert status="warning" borderRadius="md" mb={4}><AlertIcon />{formError}</Alert>}

                <VStack spacing={4}>
                    <FormControl isRequired isInvalid={formError.includes('Konu adı')}>
                        <FormLabel fontSize="sm">Konu Adı:</FormLabel>
                        <Input name="name" value={formState.name} onChange={handleInputChange} bg={useColorModeValue('white', 'gray.800')}/>
                        {formError.includes('Konu adı') && <FormErrorMessage>{formError}</FormErrorMessage>}
                    </FormControl>
                    <FormControl>
                        <FormLabel fontSize="sm">Açıklama (Opsiyonel):</FormLabel>
                        <Textarea name="description" value={formState.description} onChange={handleInputChange} rows={3} bg={useColorModeValue('white', 'gray.800')} />
                    </FormControl>
                    <FormControl>
                        <FormLabel fontSize="sm">Üst Konu:</FormLabel>
                        <Select
                            name="parentId"
                            value={formState.parentId}
                            onChange={handleInputChange}
                            placeholder="-- Ana Kategori --"
                            bg={useColorModeValue('white', 'gray.800')}
                         >
                             {allTopicsFlat
                                .filter(o => !editingTopic || o.id !== editingTopic.id) // Kendini listeden çıkar
                                .map(o => (<option key={o.id} value={o.id}>{o.name}</option>))}
                        </Select>
                    </FormControl>
                     <HStack spacing={3} mt={5} alignSelf="flex-start">
                         <Button type="submit" colorScheme="blue" leftIcon={<Icon as={FaSave}/>}>
                             {editingTopic ? 'Güncelle' : 'Ekle'}
                         </Button>
                         {editingTopic && (
                             <Button variant="ghost" onClick={resetForm} leftIcon={<Icon as={FaTimesCircle}/>}>
                                  İptal
                             </Button>
                         )}
                     </HStack>
                 </VStack>
             </Box>

            {/* Mevcut Konular Listesi */}
             <Heading as="h4" size="md" mb={4}>Mevcut Konular (Hiyerarşik)</Heading>
             {topics.length === 0 && !loading ? (
                 <Alert status="info" borderRadius="md">
                     <AlertIcon /> Konu bulunamadı.
                 </Alert>
             ) : (
                  <Box borderWidth="1px" borderRadius="md" borderColor="borderSecondary" bg="bgPrimary" maxH="500px" overflowY="auto">
                      {renderTopics(topics, 0)}
                  </Box>
             )}

              {/* Silme Onay Modalı */}
            <Modal isOpen={isDeleteConfirmOpen} onClose={onDeleteConfirmClose} isCentered>
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
                        <Button colorScheme='red' onClick={handleDeleteConfirm}>
                            Sil
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </Box>
    );
}

// --- Lecture Management Component ---
function LectureManagement({ token }) {
    const [lectures, setLectures] = useState([]);
    const [topicsTree, setTopicsTree] = useState([]); // Form select için ağaç yapısı
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [editingLecture, setEditingLecture] = useState(null);
    const [formState, setFormState] = useState({ title: '', content: '', topicId: '', imageUrl: '' });
    const [isUploading, setIsUploading] = useState(false);
    const editorRef = useRef(null);
    const toast = useToast();
    const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
    const [lectureToDelete, setLectureToDelete] = useState(null);

    const backendLectureUrl = `${API_BASE_URL}/api/lectures`;
    const backendTopicUrl = `${API_BASE_URL}/api/topics`;
    const backendUploadUrl = `${API_BASE_URL}/api/upload/image`;

    const fetchData = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [lecturesRes, topicsRes] = await Promise.all([
                axios.get(backendLectureUrl, config),
                axios.get(backendTopicUrl, config)
            ]);
            setLectures(lecturesRes.data || []);
            setTopicsTree(topicsRes.data || []);
        } catch (err) { console.error("Lecture/Topic Verisi çekerken hata:", err); setError(err.response?.data?.message || 'Veriler yüklenirken hata oluştu.'); setLectures([]); setTopicsTree([]); }
        finally { setLoading(false); }
    }, [token, backendLectureUrl, backendTopicUrl]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleInputChange = (e) => { const { name, value } = e.target; setFormState(prev => ({ ...prev, [name]: value })); };
    const handleEditorChange = (content, editor) => { setFormState(prev => ({ ...prev, content: content })); };

    const handleFormSubmit = async (e) => {
        e.preventDefault(); setFormError('');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        if (!formState.topicId) { setFormError('Lütfen bir konu seçin.'); return; }
        const editorContent = editorRef.current ? editorRef.current.getContent() : formState.content;
        if (!formState.title || !editorContent || editorContent.trim() === '<p><br data-mce-bogus="1"></p>' || editorContent.trim() === '<p><br></p>') {
             setFormError('Başlık ve İçerik alanları zorunludur.'); return;
        }
        const lectureData = { title: formState.title, content: editorContent, topicId: parseInt(formState.topicId, 10), imageUrl: formState.imageUrl.trim() === '' ? null : formState.imageUrl };

        try {
            let message = '';
            if (editingLecture) {
                await axios.put(`${backendLectureUrl}/${editingLecture.id}`, lectureData, config);
                message = 'Konu anlatımı güncellendi!';
            } else {
                await axios.post(backendLectureUrl, lectureData, config);
                message = 'Konu anlatımı eklendi!';
            }
            resetForm();
            fetchData();
            toast({ title: "Başarılı", description: message, status: "success", duration: 3000, isClosable: true });
        } catch (err) {
             console.error("Konu anlatımı kaydedilirken hata:", err);
             const errorMsg = err.response?.data?.message || 'Konu anlatımı kaydedilirken bir hata oluştu.';
             setFormError(errorMsg);
             toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        }
    };

    const handleEdit = (lecture) => {
        setEditingLecture(lecture);
        setFormState({ title: lecture.title, content: lecture.content || '', topicId: lecture.topic?.id ? String(lecture.topic.id) : '', imageUrl: lecture.imageUrl || '' });
        setFormError('');
        if (editorRef.current) editorRef.current.setContent(lecture.content || '');
        document.getElementById('lecture-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

     const openDeleteConfirmation = (lecture) => {
        setLectureToDelete(lecture);
        onDeleteConfirmOpen();
    };

     const handleDeleteConfirm = async () => {
         if (!lectureToDelete) return;
         setError('');
         onDeleteConfirmClose();
         try {
             const config = { headers: { Authorization: `Bearer ${token}` } };
             await axios.delete(`${backendLectureUrl}/${lectureToDelete.id}`, config);
             toast({ title: "Başarılı", description: `Konu anlatımı (${lectureToDelete.title}) silindi.`, status: "success", duration: 3000, isClosable: true });
             fetchData(); // Listeyi yenile
         } catch (err) {
             console.error("Konu anlatımı silinirken hata:", err);
             const errorMsg = err.response?.data?.message || 'Konu anlatımı silinirken bir hata oluştu.';
             setError(errorMsg);
             toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
         } finally {
             setLectureToDelete(null);
         }
     };

    const resetForm = () => {
         setEditingLecture(null);
         setFormState({ title: '', content: '', topicId: '', imageUrl: '' });
         setFormError('');
         if (editorRef.current) editorRef.current.setContent('');
     };

    const handleImageUpload = useCallback((blobInfo, progress) => new Promise((resolve, reject) => {
         if (!token) { reject('Yetkilendirme tokenı bulunamadı.'); return; }
         setIsUploading(true); const formData = new FormData(); formData.append('file', blobInfo.blob(), blobInfo.filename());
         axios.post(backendUploadUrl, formData, { headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` } })
         .then(res => { if (res.data?.location) { const imageUrl = res.data.location.startsWith('http') ? res.data.location : API_BASE_URL + res.data.location; resolve(imageUrl); } else { reject('Sunucudan geçersiz cevap formatı.'); } })
         .catch(err => { console.error('Resim yüklenirken hata:', err); const errorMsg = err.response?.data?.message || err.message || 'Resim yüklenemedi.'; reject(`HTTP Error: ${err.response?.status} - ${errorMsg}`); })
         .finally(() => { setIsUploading(false); });
    }), [token, backendUploadUrl]);

    const renderTopicOptions = useCallback((nodes, level = 0) => {
         let options = [];
         nodes.forEach(node => {
             options.push(<option key={node.id} value={node.id}>{'\u00A0'.repeat(level * 4) + node.name}</option>);
             if (node.children?.length) options = options.concat(renderTopicOptions(node.children, level + 1));
         });
         return options;
     }, []);

    if (loading) return <Center p={10}><Spinner size="xl" /></Center>;

    return (
        <Box> {/* Eski admin-section */}
            <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3} mb={6}>
                 <Icon as={FaChalkboardTeacher} /> Konu Anlatımı Yönetimi
            </Heading>

            {error && (
                <Alert status="error" borderRadius="md" mb={4}>
                    <AlertIcon /> {error}
                </Alert>
            )}

             <Box id="lecture-form-section" as="form" onSubmit={handleFormSubmit} p={6} borderWidth="1px" borderRadius="lg" borderColor="green.200" bg="green.50" _dark={{bg:"green.900", borderColor:"green.700"}} mb={8}>
                 <Heading as="h4" size="md" mb={5}>{editingLecture ? `Konu Anlatımı Düzenle (ID: ${editingLecture.id})` : 'Yeni Konu Anlatımı Ekle'}</Heading>

                 {formError && <Alert status="warning" borderRadius="md" mb={4}><AlertIcon />{formError}</Alert>}
                 {isUploading && (
                      <Alert status="info" borderRadius="md" mb={4}>
                          <Spinner size="sm" mr={3}/> Resim yükleniyor...
                      </Alert>
                  )}

                 <VStack spacing={4}>
                     <FormControl isRequired isInvalid={formError.includes('Başlık')}>
                         <FormLabel fontSize="sm">Başlık:</FormLabel>
                         <Input name="title" value={formState.title} onChange={handleInputChange} isDisabled={isUploading} bg={useColorModeValue('white', 'gray.800')}/>
                     </FormControl>

                     <FormControl isRequired isInvalid={formError.includes('İçerik')}>
                         <FormLabel fontSize="sm">İçerik:</FormLabel>
                         {/* Editörün yüklenmesi biraz zaman alabilir, placeholder eklenebilir */}
                         <Box borderWidth="1px" borderRadius="md" borderColor={useColorModeValue('gray.200', 'gray.700')} overflow="hidden">
                             <Editor
                                 apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                 onInit={(evt, editor) => editorRef.current = editor}
                                 value={formState.content}
                                 init={{
                                     height: 350, menubar: false,
                                     plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount'],
                                     toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | code removeformat | fullscreen preview | help',
                                     images_upload_handler: handleImageUpload, automatic_uploads: true, file_picker_types: 'image media',
                                     relative_urls: false, remove_script_host: false,
                                     skin: useColorModeValue("oxide", "oxide-dark"),
                                     content_css: useColorModeValue("default", "dark")
                                 }}
                                 onEditorChange={handleEditorChange}
                                 disabled={isUploading}
                             />
                         </Box>
                     </FormControl>

                     <FormControl>
                         <FormLabel fontSize="sm">Görsel URL (Opsiyonel):</FormLabel>
                         <Input name="imageUrl" value={formState.imageUrl} onChange={handleInputChange} placeholder="https://..." isDisabled={isUploading} bg={useColorModeValue('white', 'gray.800')}/>
                         <Text fontSize="xs" color="textMuted" mt={1}>Editörden resim eklemeniz önerilir.</Text>
                     </FormControl>

                     <FormControl isRequired isInvalid={formError.includes('konu seçin')}>
                         <FormLabel fontSize="sm">Ait Olduğu Konu:</FormLabel>
                         <Select name="topicId" value={formState.topicId} onChange={handleInputChange} placeholder="-- Konu Seçin --" isDisabled={isUploading} bg={useColorModeValue('white', 'gray.800')}>
                            {renderTopicOptions(topicsTree)}
                         </Select>
                     </FormControl>

                      <HStack spacing={3} mt={5} alignSelf="flex-start">
                         <Button type="submit" colorScheme="green" isLoading={isUploading} loadingText="Kaydediliyor..." leftIcon={<Icon as={FaSave}/>}>
                             {editingLecture ? 'Güncelle' : 'Ekle'}
                         </Button>
                         {editingLecture && (
                             <Button variant="ghost" onClick={resetForm} isDisabled={isUploading} leftIcon={<Icon as={FaTimesCircle}/>}>
                                 İptal
                             </Button>
                         )}
                     </HStack>
                 </VStack>
             </Box>

              <Heading as="h4" size="md" mb={4}>Mevcut Konu Anlatımları</Heading>
              {lectures.length === 0 && !loading ? (
                   <Alert status="info" borderRadius="md"> <AlertIcon /> Konu anlatımı bulunamadı. </Alert>
               ) : (
                   <TableContainer borderWidth="1px" borderRadius="md" borderColor="borderSecondary">
                       <Table variant="striped" size="sm">
                           <Thead bg="bgTertiary">
                               <Tr>
                                   <Th>ID</Th>
                                   <Th>Başlık</Th>
                                   <Th>Konu</Th>
                                   <Th>Görsel URL</Th>
                                   <Th isNumeric>İşlemler</Th>
                               </Tr>
                           </Thead>
                           <Tbody>
                               {lectures.map((lecture) => (
                                   <Tr key={lecture.id}>
                                       <Td>{lecture.id}</Td>
                                       <Td>{lecture.title}</Td>
                                       <Td>{lecture.topic?.name || '-'}</Td>
                                       <Td>
                                            {lecture.imageUrl ? (
                                                 <ChakraLink href={lecture.imageUrl} isExternal color="blue.500" fontSize="xs">
                                                      {lecture.imageUrl.substring(0, 30)}...
                                                 </ChakraLink>
                                             ) : '-'}
                                         </Td>
                                       <Td isNumeric>
                                            <HStack spacing={1} justify="flex-end">
                                                <IconButton icon={<Icon as={FaUserEdit} />} size="xs" variant="ghost" colorScheme="blue" onClick={() => handleEdit(lecture)} aria-label="Düzenle" title="Düzenle"/>
                                                <IconButton icon={<Icon as={FaTrashAlt} />} size="xs" variant="ghost" colorScheme="red" onClick={() => openDeleteConfirmation(lecture)} aria-label="Sil" title="Sil"/>
                                            </HStack>
                                       </Td>
                                   </Tr>
                               ))}
                           </Tbody>
                       </Table>
                   </TableContainer>
               )}

                {/* Silme Onay Modalı */}
                <Modal isOpen={isDeleteConfirmOpen} onClose={onDeleteConfirmClose} isCentered>
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

// --- Question Management Component ---
function QuestionManagement({ token }) {
    const [questions, setQuestions] = useState([]);
    const [topicsTree, setTopicsTree] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [editingQuestion, setEditingQuestion] = useState(null);
    const initialFormState = { text: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '', correctAnswer: '', classification: 'Çalışma Sorusu', topicId: '', imageUrl: '' };
    const [formState, setFormState] = useState(initialFormState);
    const [isUploading, setIsUploading] = useState(false);
    const [bulkInput, setBulkInput] = useState('');
    const [bulkError, setBulkError] = useState('');
    const [bulkSuccess, setBulkSuccess] = useState('');
    const [bulkLoading, setBulkLoading] = useState(false);
    const editorRef = useRef(null);
    const toast = useToast();
    const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
    const [questionToDelete, setQuestionToDelete] = useState(null);

    const backendQuestionUrl = `${API_BASE_URL}/api/questions`;
    const backendTopicUrl = `${API_BASE_URL}/api/topics`;
    const backendUploadUrl = `${API_BASE_URL}/api/upload/image`;

    const fetchData = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [questionsRes, topicsRes] = await Promise.all([
                axios.get(backendQuestionUrl, config),
                axios.get(backendTopicUrl, config)
            ]);
            setQuestions(questionsRes.data || []);
            setTopicsTree(topicsRes.data || []);
        } catch (err) { console.error("Soru/Konu verisi çekerken hata:", err); setError(err.response?.data?.message || 'Sorular veya konular yüklenirken bir hata oluştu.'); setQuestions([]); setTopicsTree([]); }
        finally { setLoading(false); }
    }, [token, backendQuestionUrl, backendTopicUrl]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleInputChange = (e) => { const { name, value } = e.target; setFormState(prev => ({ ...prev, [name]: value })); };
    const handleQuestionEditorChange = (content, editor) => { setFormState(prev => ({ ...prev, text: content })); };

    const handleFormSubmit = async (e) => {
        e.preventDefault(); setFormError('');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        if (!formState.topicId) { setFormError('Lütfen bir konu seçin.'); return; }
        const editorContent = editorRef.current ? editorRef.current.getContent() : formState.text;
        if (!editorContent || editorContent.trim() === '<p><br data-mce-bogus="1"></p>' || editorContent.trim() === '<p><br></p>') { setFormError('Soru Metni zorunludur.'); return; }
        if (!formState.optionA || !formState.optionB || !formState.optionC || !formState.optionD || !formState.optionE || !formState.correctAnswer) { setFormError('Lütfen Seçenekler (A-E) ve Doğru Cevap alanlarını doldurun.'); return; }

        const questionData = {
            text: editorContent, optionA: formState.optionA, optionB: formState.optionB, optionC: formState.optionC, optionD: formState.optionD, optionE: formState.optionE,
            correctAnswer: formState.correctAnswer.toUpperCase(), classification: formState.classification, topicId: parseInt(formState.topicId, 10),
            imageUrl: formState.imageUrl.trim() === '' ? null : formState.imageUrl
        };

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
            fetchData();
            toast({ title: "Başarılı", description: message, status: "success", duration: 3000, isClosable: true });
        } catch (err) {
             console.error("Soru kaydedilirken hata:", err);
             const errorMsg = err.response?.data?.message || 'Soru kaydedilirken bir hata oluştu.';
             setFormError(errorMsg);
             toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        }
    };

    const handleEdit = (question) => {
         setEditingQuestion(question);
         setFormState({
             text: question.text || '', optionA: question.optionA || '', optionB: question.optionB || '', optionC: question.optionC || '', optionD: question.optionD || '', optionE: question.optionE || '',
             correctAnswer: question.correctAnswer || '', classification: question.classification || 'Çalışma Sorusu', topicId: question.topic?.id ? String(question.topic.id) : '', imageUrl: question.imageUrl || ''
         });
         setFormError('');
         if (editorRef.current) editorRef.current.setContent(question.text || '');
         document.getElementById('question-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
     };

     const openDeleteConfirmation = (question) => {
        setQuestionToDelete(question);
        onDeleteConfirmOpen();
    };

     const handleDeleteConfirm = async () => {
         if (!questionToDelete) return;
         setError('');
         onDeleteConfirmClose();
         try {
             const config = { headers: { Authorization: `Bearer ${token}` } };
             await axios.delete(`${backendQuestionUrl}/${questionToDelete.id}`, config);
             toast({ title: "Başarılı", description: `Soru (ID: ${questionToDelete.id}) silindi.`, status: "success", duration: 3000, isClosable: true });
             fetchData();
         } catch (err) {
             console.error("Soru silinirken hata:", err);
             const errorMsg = err.response?.data?.message || 'Soru silinirken bir hata oluştu.';
             setError(errorMsg);
             toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
         } finally {
             setQuestionToDelete(null);
         }
     };

    const resetForm = () => {
        setEditingQuestion(null); setFormState(initialFormState); setFormError('');
        if (editorRef.current) editorRef.current.setContent('');
     };

    const handleImageUpload = useCallback((blobInfo, progress) => new Promise((resolve, reject) => {
        if (!token) { reject('Yetkilendirme tokenı bulunamadı.'); return; }
        setIsUploading(true); const formData = new FormData(); formData.append('file', blobInfo.blob(), blobInfo.filename());
        axios.post(backendUploadUrl, formData, { headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` } })
        .then(res => { if (res.data?.location) { const imageUrl = res.data.location.startsWith('http') ? res.data.location : API_BASE_URL + res.data.location; resolve(imageUrl); } else { reject('Sunucudan geçersiz cevap formatı.'); } })
        .catch(err => { console.error('Resim yüklenirken hata:', err); const errorMsg = err.response?.data?.message || err.message || 'Resim yüklenemedi.'; reject(`HTTP Error: ${err.response?.status} - ${errorMsg}`); })
        .finally(() => { setIsUploading(false); });
    }), [token, backendUploadUrl]);

     const handleBulkSubmit = async () => {
         setBulkError(''); setBulkSuccess(''); setBulkLoading(true);
         let questionsArray;
         try {
             questionsArray = JSON.parse(bulkInput);
             if (!Array.isArray(questionsArray)) throw new Error("Veri bir JSON dizisi olmalı.");
         } catch (parseError) { setBulkError(`Geçersiz JSON formatı: ${parseError.message}`); setBulkLoading(false); return; }
         if (questionsArray.length === 0) { setBulkError('Eklenecek soru bulunamadı.'); setBulkLoading(false); return; }

         try {
             const config = { headers: { Authorization: `Bearer ${token}` } };
             const response = await axios.post(`${backendQuestionUrl}/bulk`, questionsArray, config);
             const successMsg = response.data.message || `${response.data.addedCount || 0} soru başarıyla eklendi.`;
             setBulkSuccess(successMsg);
             toast({ title: "Başarılı", description: successMsg, status: "success", duration: 4000, isClosable: true });
             if (response.data.validationErrors?.length > 0) {
                 const errorDetails = response.data.validationErrors.map(e => `[Sıra: ${e.index}] ${e.error}`).join(', ');
                 setBulkError(`Bazı sorular eklenemedi: ${errorDetails}`);
                 toast({ title: "Uyarı", description: `Bazı sorular eklenemedi. Detaylar form alanında gösteriliyor.`, status: "warning", duration: 6000, isClosable: true });
             } else {
                 setBulkInput(''); // Sadece hiç validation hatası yoksa temizle
             }
             fetchData();
         } catch (err) {
             console.error("Toplu soru eklenirken hata:", err);
             const errorMsg = err.response?.data?.message || 'Toplu soru eklenirken bir hata oluştu.';
             setBulkError(errorMsg);
             if (err.response?.data?.validationErrors) {
                 setBulkError(prev => `${prev} Hatalar: ${err.response.data.validationErrors.map(e => `[Sıra: ${e.index}] ${e.error}`).join(', ')}`);
             }
             toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
         } finally { setBulkLoading(false); }
     };

    const renderTopicOptions = useCallback((nodes, level = 0) => {
        let options = [];
        nodes.forEach(node => {
            options.push(<option key={node.id} value={node.id}>{'\u00A0'.repeat(level * 4) + node.name}</option>);
            if (node.children?.length) options = options.concat(renderTopicOptions(node.children, level + 1));
        });
        return options;
     }, []);

    if (loading) return <Center p={10}><Spinner size="xl" /></Center>;

    // Helper function to strip HTML for table display
    const stripHtml = (html) => {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    }

    return (
        <Box> {/* Eski admin-section */}
             <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3} mb={6}>
                 <Icon as={FaQuestionCircle} /> Soru Yönetimi
            </Heading>

            {error && ( <Alert status="error" borderRadius="md" mb={4}> <AlertIcon /> {error} </Alert> )}

             {/* Soru Formu */}
            <Box id="question-form-section" as="form" onSubmit={handleFormSubmit} p={6} borderWidth="1px" borderRadius="lg" borderColor="orange.200" bg="orange.50" _dark={{bg:"orange.900", borderColor:"orange.700"}} mb={8}>
                 <Heading as="h4" size="md" mb={5}>{editingQuestion ? `Soru Düzenle (ID: ${editingQuestion.id})` : 'Yeni Soru Ekle'}</Heading>
                 {formError && <Alert status="warning" borderRadius="md" mb={4}><AlertIcon />{formError}</Alert>}
                 {isUploading && <Alert status="info" borderRadius="md" mb={4}><Spinner size="sm" mr={3}/> Resim yükleniyor...</Alert>}

                 <VStack spacing={4}>
                    <FormControl isRequired isInvalid={formError.includes('Soru Metni')}>
                        <FormLabel fontSize="sm">Soru Metni:</FormLabel>
                         <Box borderWidth="1px" borderRadius="md" borderColor={useColorModeValue('gray.200', 'gray.700')} overflow="hidden">
                            <Editor
                                apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                onInit={(evt, editor) => editorRef.current = editor}
                                value={formState.text}
                                init={{ /* ... TinyMCE init props ... */
                                    height: 250, menubar: false,
                                    plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount'],
                                    toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | code removeformat | fullscreen preview | help',
                                    images_upload_handler: handleImageUpload, automatic_uploads: true, file_picker_types: 'image media',
                                    relative_urls: false, remove_script_host: false,
                                    skin: useColorModeValue("oxide", "oxide-dark"),
                                    content_css: useColorModeValue("default", "dark")
                                }}
                                onEditorChange={handleQuestionEditorChange}
                                disabled={isUploading}
                            />
                        </Box>
                        {formError.includes('Soru Metni') && <FormErrorMessage>{formError}</FormErrorMessage>}
                    </FormControl>

                    <Heading as="h5" size="sm" alignSelf="flex-start" mt={4}>Seçenekler ve Doğru Cevap</Heading>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                        {['A', 'B', 'C', 'D', 'E'].map(opt => (
                            <FormControl key={opt} isRequired isInvalid={formError.includes('Seçenekler')}>
                                <FormLabel fontSize="sm">Seçenek {opt}:</FormLabel>
                                <Input name={`option${opt}`} value={formState[`option${opt}`]} onChange={handleInputChange} isDisabled={isUploading} bg={useColorModeValue('white', 'gray.800')}/>
                            </FormControl>
                        ))}
                         <FormControl isRequired isInvalid={formError.includes('Doğru Cevap')} w={{base:"full", md:"auto"}}>
                            <FormLabel fontSize="sm">Doğru Cevap:</FormLabel>
                            <Select name="correctAnswer" value={formState.correctAnswer} onChange={handleInputChange} placeholder="Seç" isDisabled={isUploading} bg={useColorModeValue('white', 'gray.800')}>
                                {['A', 'B', 'C', 'D', 'E'].map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                            </Select>
                        </FormControl>
                    </SimpleGrid>
                    {formError.includes('Seçenekler') && <Text fontSize="xs" color="red.500" mt={-2} w="full">{formError}</Text>}


                    <Heading as="h5" size="sm" alignSelf="flex-start" mt={4}>Diğer Bilgiler</Heading>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                        <FormControl>
                            <FormLabel fontSize="sm">Sınıflandırma:</FormLabel>
                            <Select name="classification" value={formState.classification} onChange={handleInputChange} isDisabled={isUploading} bg={useColorModeValue('white', 'gray.800')}>
                                <option value="Çalışma Sorusu">Çalışma Sorusu</option>
                                <option value="Çıkmış Benzeri">Çıkmış Benzeri</option>
                            </Select>
                        </FormControl>
                        <FormControl isRequired isInvalid={formError.includes('konu seçin')}>
                            <FormLabel fontSize="sm">Konu:</FormLabel>
                            <Select name="topicId" value={formState.topicId} onChange={handleInputChange} placeholder="-- Konu Seçin --" isDisabled={isUploading || loading} bg={useColorModeValue('white', 'gray.800')}>
                                {renderTopicOptions(topicsTree)}
                            </Select>
                             {formError.includes('konu seçin') && <FormErrorMessage>{formError}</FormErrorMessage>}
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">Görsel URL (Opsiyonel):</FormLabel>
                            <Input name="imageUrl" value={formState.imageUrl} onChange={handleInputChange} placeholder="https://..." isDisabled={isUploading} bg={useColorModeValue('white', 'gray.800')}/>
                        </FormControl>
                    </SimpleGrid>

                     <HStack spacing={3} mt={5} alignSelf="flex-start">
                        <Button type="submit" colorScheme="orange" isLoading={isUploading} loadingText="Kaydediliyor..." leftIcon={<Icon as={FaSave}/>}>
                            {editingQuestion ? 'Güncelle' : 'Ekle'}
                        </Button>
                        {editingQuestion && (
                            <Button variant="ghost" onClick={resetForm} isDisabled={isUploading} leftIcon={<Icon as={FaTimesCircle}/>}> İptal </Button>
                        )}
                    </HStack>
                 </VStack>
            </Box>

             {/* Toplu Soru Ekleme */}
             <Box p={6} borderWidth="1px" borderRadius="lg" borderColor="gray.300" borderStyle="dashed" bg="bgSecondary" _dark={{borderColor:"gray.600"}} mb={8}>
                 <Heading as="h4" size="md" mb={2}>Toplu Soru Ekle (JSON)</Heading>
                 <Text fontSize="sm" color="textMuted" mb={3}>
                    JSON formatında soru dizisi yapıştırın. Gerekli alanlar: `text`, `optionA`...`optionE`, `correctAnswer`, `topicId`. Opsiyonel: `classification`, `imageUrl`.
                 </Text>
                 <Textarea
                     fontFamily="mono"
                     fontSize="xs"
                     rows={10}
                     placeholder='[{"text": "<p>Soru metni...</p>", ...}]'
                     value={bulkInput}
                     onChange={(e) => setBulkInput(e.target.value)}
                     isDisabled={bulkLoading}
                     bg={useColorModeValue('white', 'gray.800')}
                     mb={3}
                 />
                 {bulkError && <Alert status="error" borderRadius="md" mb={3} fontSize="sm"><AlertIcon />{bulkError}</Alert>}
                 {bulkSuccess && <Alert status="success" borderRadius="md" mb={3} fontSize="sm"><AlertIcon />{bulkSuccess}</Alert>}
                 <Button
                    onClick={handleBulkSubmit}
                    isLoading={bulkLoading}
                    loadingText="Ekleniyor..."
                    isDisabled={!bulkInput.trim()}
                    colorScheme="blue"
                    leftIcon={<Icon as={FaUpload}/>}
                 >
                     Toplu Soruları Ekle
                 </Button>
             </Box>

            {/* Mevcut Sorular Tablosu */}
            <Heading as="h4" size="md" mb={4}>Mevcut Sorular</Heading>
            {questions.length === 0 && !loading ? (
                 <Alert status="info" borderRadius="md"> <AlertIcon /> Soru bulunamadı. </Alert>
             ) : (
                 <TableContainer borderWidth="1px" borderRadius="md" borderColor="borderSecondary">
                     <Table variant="striped" size="sm">
                         <Thead bg="bgTertiary">
                             <Tr>
                                 <Th>ID</Th>
                                 <Th maxW="300px">Metin (Başlangıcı)</Th> {/* Genişlik sınırı */}
                                 <Th>Konu</Th>
                                 <Th>Sınıf.</Th>
                                 <Th isNumeric>İşlemler</Th>
                             </Tr>
                         </Thead>
                         <Tbody>
                             {questions.map((q) => (
                                 <Tr key={q.id}>
                                     <Td>{q.id}</Td>
                                     <Td maxW="300px" whiteSpace="normal" title={stripHtml(q.text)}> {/* Taşan metin için */}
                                         {stripHtml(q.text).substring(0, 80)}...
                                     </Td>
                                     <Td>{q.topic?.name || '-'}</Td>
                                     <Td>{q.classification || '-'}</Td>
                                     <Td isNumeric>
                                         <HStack spacing={1} justify="flex-end">
                                             <IconButton icon={<Icon as={FaUserEdit} />} size="xs" variant="ghost" colorScheme="blue" onClick={() => handleEdit(q)} aria-label="Düzenle" title="Düzenle"/>
                                             <IconButton icon={<Icon as={FaTrashAlt} />} size="xs" variant="ghost" colorScheme="red" onClick={() => openDeleteConfirmation(q)} aria-label="Sil" title="Sil"/>
                                         </HStack>
                                     </Td>
                                 </Tr>
                             ))}
                         </Tbody>
                     </Table>
                 </TableContainer>
             )}

            {/* Silme Onay Modalı */}
            <Modal isOpen={isDeleteConfirmOpen} onClose={onDeleteConfirmClose} isCentered>
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


// --- Ana Admin Sayfası Component'i (Chakra UI Tabs ile) ---
function AdminPage() {
    const { token } = useAuth();
    const toast = useToast(); // Genel bildirimler için

    // API URL kontrolü (aynı kalabilir)
    if (!API_BASE_URL) {
         console.error("VITE_API_URL environment variable is not set!");
         return (
             <Container mt={6}>
                 <Alert status="error" textAlign="center">
                    <AlertIcon /> Uygulama yapılandırma hatası: API adresi bulunamadı.
                 </Alert>
             </Container>
         );
    }
    // Token kontrolü (aynı kalabilir, belki daha iyi bir component kullanılır)
    if (!token) {
         return (
             <Container mt={6}>
                 <Alert status="warning" textAlign="center">
                    <AlertIcon /> Bu sayfaya erişim için giriş yapmalısınız.
                 </Alert>
                 {/* Giriş linki eklenebilir */}
             </Container>
         );
    }

    // Başlık rengi
    const headingColor = useColorModeValue("gray.700", "whiteAlpha.900");

    return (
        // Eski admin-page-container yerine Chakra Container
        <Container maxW="container.xl" py={8}> {/* Daha geniş container */}
             <Heading as="h1" size="xl" textAlign="center" mb={8} color={headingColor}>
                 Yönetim Paneli
             </Heading>

            {/* Sekmeli Yapı */}
            <Tabs isLazy variant="soft-rounded" colorScheme="blue"> {/* Farklı varyantlar: line, enclosed, soft-rounded, solid-rounded */}
                <TabList flexWrap="wrap" justifyContent="center" mb={6}>
                    <Tab><Icon as={FaChartBar} mr={2}/> İstatistikler</Tab>
                    <Tab><Icon as={FaUsers} mr={2}/> Kullanıcılar</Tab>
                    <Tab><Icon as={FaTags} mr={2}/> Konular</Tab>
                    <Tab><Icon as={FaChalkboardTeacher} mr={2}/> Konu Anlatımları</Tab>
                    <Tab><Icon as={FaQuestionCircle} mr={2}/> Sorular</Tab>
                </TabList>

                <TabPanels>
                    {/* İstatistikler Sekmesi */}
                    <TabPanel p={0}> {/* İç padding'i sıfırla, alt componentler kendi padding'ini yönetsin */}
                         <AdminStatsOverview token={token} />
                    </TabPanel>

                    {/* Kullanıcı Yönetimi Sekmesi */}
                    <TabPanel p={0}>
                         <UserManagement token={token} />
                    </TabPanel>

                    {/* Konu Yönetimi Sekmesi */}
                    <TabPanel p={0}>
                         <TopicManagement token={token} />
                    </TabPanel>

                    {/* Konu Anlatımı Yönetimi Sekmesi */}
                    <TabPanel p={0}>
                         <LectureManagement token={token} />
                    </TabPanel>

                    {/* Soru Yönetimi Sekmesi */}
                    <TabPanel p={0}>
                         <QuestionManagement token={token} />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Container>
    );
}

export default AdminPage;