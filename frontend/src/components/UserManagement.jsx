import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // ../context/AuthContext yolunun projenize göre doğru olduğundan emin olun
import {
    Box, Center, Heading,
    Spinner, Alert, AlertIcon, useToast, useDisclosure,
    Button, IconButton, Icon, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
    Badge, Select, FormControl,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    VStack, HStack, Text
} from '@chakra-ui/react';
import { FaUsers, FaChartBar, FaTrashAlt } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function UserManagement({ token }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user: adminUser } = useAuth();
    const toast = useToast();
    const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
    const { isOpen: isStatsOpen, onOpen: onStatsOpen, onClose: onStatsClose } = useDisclosure();
    const [actionUser, setActionUser] = useState(null);
    const [actionType, setActionType] = useState('');
    const [newRole, setNewRole] = useState('');
    const [userStats, setUserStats] = useState([]);
    const [statsLoading, setStatsLoading] = useState(false);

    const backendUserUrl = `${API_BASE_URL}/api/users`;
    const backendStatsUrl = `${API_BASE_URL}/api/stats/admin/user`;

    const fetchUsers = useCallback(async () => {
        setLoading(true); setError('');
        if (!token) { setError("Yetkilendirme token'ı bulunamadı."); setLoading(false); return; }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(backendUserUrl, config);
            setUsers(Array.isArray(response.data) ? response.data : []);
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
        setActionUser(user); setActionType(type);
        if (type === 'role') setNewRole(role);
        onConfirmOpen();
    };

    const handleConfirmAction = async () => {
        setError('');
        onConfirmClose();
        if (!actionUser || !actionType) return;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            if (actionType === 'delete') {
                await axios.delete(`${backendUserUrl}/${actionUser.id}`, config);
                toast({ title: "Başarılı", description: `Kullanıcı (${actionUser.username}) silindi.`, status: "success", duration: 3000, isClosable: true });
            } else if (actionType === 'role') {
                if (!newRole) { toast({ title: "Hata", description: "Geçerli bir rol seçilmedi.", status: "error", duration: 3000, isClosable: true }); return; }
                await axios.put(`${backendUserUrl}/${actionUser.id}/role`, { role: newRole }, config);
                toast({ title: "Başarılı", description: `${actionUser.username} rolü ${newRole} olarak güncellendi.`, status: "success", duration: 3000, isClosable: true });
            }
            fetchUsers();
        } catch (err) {
            console.error(`Kullanıcı ${actionType} işlemi sırasında hata:`, err);
            const errorMsg = err.response?.data?.message || `Kullanıcı ${actionType === 'delete' ? 'silinirken' : 'rolü güncellenirken'} bir hata oluştu.`;
            setError(errorMsg);
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        } finally { setActionUser(null); setActionType(''); setNewRole(''); }
    };

    const handleViewUserStats = async (user) => {
        setActionUser(user); setStatsLoading(true); setError(''); setUserStats([]);
        onStatsOpen();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const statsUrl = `${backendStatsUrl}/${user.id}/detailed`;
            const response = await axios.get(statsUrl, config);
            setUserStats(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error(`Kullanıcı ${user.id} istatistikleri getirilirken hata:`, err);
            const errorMsg = err.response?.data?.message || 'İstatistikler getirilemedi.';
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
            setError(errorMsg); onStatsClose(); // Hata durumunda istatistik modalını kapatabiliriz.
        } finally { setStatsLoading(false); }
    };

    if (loading) return <Center p={10}><Spinner size="xl" color="brand.500" /></Center>;

    return (
        <Box>
            <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3} mb={6}>
                <Icon as={FaUsers} /> Kullanıcı Yönetimi
            </Heading>

            {error && ( <Alert status="error" variant="subtle" borderRadius="md" mb={4}> <AlertIcon /> {error} </Alert> )}

            {users.length === 0 && !loading ? (
                <Alert status="info" variant="subtle" borderRadius="md"> <AlertIcon /> Kullanıcı bulunamadı. </Alert>
            ) : (
                <TableContainer borderWidth="1px" borderRadius="md" borderColor="borderSecondary">
                    <Table variant="striped" size="sm">
                        <Thead bg="bgTertiary">
                            <Tr>
                                <Th>ID</Th><Th>Kullanıcı Adı</Th><Th>Rol</Th><Th>Uzmanlık</Th><Th>Kayıt Tarihi</Th><Th isNumeric>İşlemler</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {users.map((user) => (
                                <Tr key={user.id} _hover={{ bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.100' }}}>
                                    <Td>{user.id}</Td>
                                    <Td>{user.username}</Td>
                                    <Td><Badge colorScheme={user.role === 'admin' ? 'green' : 'gray'} variant="solid">{user.role}</Badge></Td>
                                    <Td>{user.specialization || '-'}</Td>
                                    <Td>{new Date(user.createdAt).toLocaleDateString()}</Td>
                                    <Td isNumeric>
                                        <HStack spacing={1} justify="flex-end">
                                            <Select
                                                size="xs" w="90px" variant="outline"
                                                defaultValue={user.role}
                                                onChange={(e) => openConfirmation('role', user, e.target.value)}
                                                isDisabled={user.id === adminUser?.id}
                                                aria-label={`${user.username} için rol seç`}
                                                onClick={(e) => e.stopPropagation()} // Propagasyonu durdurarak Tr hoverını etkilememesi için
                                            >
                                                <option value="user">user</option>
                                                <option value="admin">admin</option>
                                            </Select>
                                            <IconButton icon={<Icon as={FaChartBar} />} size="xs" variant="ghost" colorScheme="blue" onClick={() => handleViewUserStats(user)} aria-label="Kullanıcı İstatistikleri" title="Kullanıcı İstatistikleri"/>
                                            <IconButton icon={<Icon as={FaTrashAlt} />} size="xs" variant="ghost" colorScheme="red" onClick={() => openConfirmation('delete', user)} isDisabled={user.id === adminUser?.id} aria-label="Kullanıcıyı Sil" title="Kullanıcıyı Sil"/>
                                        </HStack>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </TableContainer>
            )}
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
                        <Button colorScheme={actionType === 'delete' ? 'red' : 'green'} onClick={handleConfirmAction}>Onayla</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            <Modal isOpen={isStatsOpen} onClose={onStatsClose} size="xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Kullanıcı İstatistikleri: {actionUser?.username}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {statsLoading ? ( <Center><Spinner color="brand.500" /></Center>
                        ) : userStats.length > 0 ? (
                            <TableContainer><Table variant="simple" size="sm"><Thead><Tr><Th>Konu</Th><Th isNumeric>Deneme</Th><Th isNumeric>Doğru</Th><Th isNumeric>Başarı (%)</Th></Tr></Thead><Tbody>
                                {userStats.map(stat => (
                                    <Tr key={stat.topicId}><Td>{stat.topicName}</Td><Td isNumeric>{stat.totalAttempts}</Td><Td isNumeric>{stat.correctAttempts}</Td>
                                    <Td isNumeric color={stat.accuracy >= 80 ? 'green.500' : stat.accuracy >= 50 ? 'yellow.500' : 'red.500'}>{stat.accuracy}%</Td></Tr>
                                ))}
                            </Tbody></Table></TableContainer>
                        ) : ( <Text>Bu kullanıcı için istatistik verisi bulunamadı.</Text> )}
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={onStatsClose}>Kapat</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}

export default UserManagement;