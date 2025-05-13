import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    Box, Center, Heading,
    Spinner, Alert, AlertIcon, useToast, useDisclosure,
    Button, IconButton, Icon, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
    Badge, Select,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    VStack, HStack, Text, useColorModeValue, Tooltip, Tag
} from '@chakra-ui/react';
import { FaUsers, FaChartBar, FaTrashAlt, FaBook } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function UserManagement({ token }) {
    // React Hooks (Strictly at the top level)
    const [users, setUsers] = useState([]);
    const [examClassifications, setExamClassifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionUser, setActionUser] = useState(null);
    const [actionType, setActionType] = useState('');
    const [newRole, setNewRole] = useState('');
    const [userStats, setUserStats] = useState([]);
    const [statsLoading, setStatsLoading] = useState(false);

    const { user: adminUser } = useAuth();
    const toast = useToast();
    const disclosure1 = useDisclosure();
    const disclosure2 = useDisclosure();
    const tableHeaderBg = useColorModeValue("gray.100", "gray.700");
    const rowHoverBg = useColorModeValue('gray.50', 'gray.800');

    const isConfirmOpen = disclosure1.isOpen;
    const onConfirmOpen = disclosure1.onOpen;
    const onConfirmClose = disclosure1.onClose;

    const isStatsOpen = disclosure2.isOpen;
    const onStatsOpen = disclosure2.onOpen;
    const onStatsClose = disclosure2.onClose;

    const backendUserUrl = `${API_BASE_URL}/api/users`;
    const backendStatsUrl = `${API_BASE_URL}/api/stats/admin/user`;
    const examClassificationsUrlApi = `${API_BASE_URL}/api/exam-classifications`;

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        if (!token) {
            setError("Yetkilendirme token'ı bulunamadı.");
            setLoading(false);
            return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [usersRes, ecRes] = await Promise.all([
                axios.get(backendUserUrl, config),
                axios.get(examClassificationsUrlApi, config)
            ]);
            setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
            setExamClassifications(Array.isArray(ecRes.data) ? ecRes.data : []);
        } catch (err) {
            console.error("Kullanıcı veya Sınav Tipi verileri çekilirken hata:", err);
            setError(err.response?.data?.message || 'Veriler yüklenirken bir hata oluştu.');
            setUsers([]);
            setExamClassifications([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const openConfirmation = useCallback((type, userToActOn, role = '') => {
        if (adminUser && userToActOn.id === adminUser.id && (type === 'delete' || type === 'role')) {
            toast({
                title: "İşlem İptal",
                description: type === 'delete' ? "Kendinizi silemezsiniz." : "Kendi rolünüzü buradan değiştiremezsiniz.",
                status: "warning",
                duration: 3000,
                isClosable: true
            });
            return;
        }
        setActionUser(userToActOn);
        setActionType(type);
        if (type === 'role') setNewRole(role);
        onConfirmOpen();
    }, [adminUser, onConfirmOpen, toast]);

    const handleConfirmAction = useCallback(async () => {
        setError('');
        onConfirmClose();
        if (!actionUser || !actionType) return;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            if (actionType === 'delete') {
                await axios.delete(`${backendUserUrl}/${actionUser.id}`, config);
                toast({
                    title: "Başarılı",
                    description: `Kullanıcı (${actionUser.username}) silindi.`,
                    status: "success",
                    duration: 3000,
                    isClosable: true
                });
            } else if (actionType === 'role') {
                if (!newRole) {
                    toast({
                        title: "Hata",
                        description: "Geçerli bir rol seçilmedi.",
                        status: "error",
                        duration: 3000,
                        isClosable: true
                    });
                    return;
                }
                await axios.put(`${backendUserUrl}/${actionUser.id}/role`, { role: newRole }, config);
                toast({
                    title: "Başarılı",
                    description: `${actionUser.username} rolü ${newRole} olarak güncellendi.`,
                    status: "success",
                    duration: 3000,
                    isClosable: true
                });
            }
            fetchData();
        } catch (err) {
            console.error(`Kullanıcı ${actionType} işlemi sırasında hata:`, err);
            const errorMsg = err.response?.data?.message || `Kullanıcı ${actionType === 'delete' ? 'silinirken' : 'rolü güncellenirken'} bir hata oluştu.`;
            setError(errorMsg);
            toast({
                title: "Hata",
                description: errorMsg,
                status: "error",
                duration: 5000,
                isClosable: true
            });
        } finally {
            setActionUser(null);
            setActionType('');
            setNewRole('');
        }
    }, [actionUser, actionType, newRole, token, toast, onConfirmClose, fetchData]);

    const handleViewUserStats = useCallback(async (userToView) => {
        setActionUser(userToView);
        setStatsLoading(true);
        setError('');
        setUserStats([]);
        onStatsOpen();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const statsUrl = `${backendStatsUrl}/${userToView.id}/detailed`;
            const response = await axios.get(statsUrl, config);
            setUserStats(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error(`Kullanıcı ${userToView.id} istatistikleri getirilirken hata:`, err);
            const errorMsg = err.response?.data?.message || 'İstatistikler getirilemedi.';
            toast({ title: "Hata", description: errorMsg, status: "error", duration: 5000, isClosable: true });
            setError(errorMsg);
        } finally {
            setStatsLoading(false);
        }
    }, [token, toast, onStatsOpen]);

    if (loading) return <Center p={10}><Spinner size="xl" color="brand.500" /></Center>;

    return (
        <Box>
        <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3} mb={6}>
          <Icon as={FaUsers} /> Kullanıcı Yönetimi
        </Heading>
      
        {error && !statsLoading && (
          <Alert status="error" variant="subtle" borderRadius="md" mb={4}>
            <AlertIcon /> {error}
          </Alert>
        )}
      
        {users.length === 0 && !loading ? (
          <Alert status="info" variant="subtle" borderRadius="md">
            <AlertIcon /> Kullanıcı bulunamadı.
          </Alert>
        ) : (
          <TableContainer
            borderWidth="1px"
            borderRadius="lg"
            borderColor="borderSecondary"
            boxShadow="sm"
          >
            <Table variant="simple" size="sm">
              <Thead bg={tableHeaderBg}>
                <Tr>
                  <Th>ID</Th>
                  <Th>Kullanıcı Adı</Th>
                  <Th>Rol</Th>
                  <Th>Uzmanlık</Th>
                  <Th>Hedef Sınav</Th>
                  <Th>Kayıt Tarihi</Th>
                  <Th isNumeric>İşlemler</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((userItm) => {
                  const defaultEcName = userItm.defaultClassificationId
                    ? examClassifications.find((ec) => ec.id === userItm.defaultClassificationId)?.name || '-'
                    : '-';
      
                  return (
                    <Tr key={userItm.id} _hover={{ bg: rowHoverBg }}>
                      <Td>{userItm.id}</Td>
                      <Td fontWeight="medium">{userItm.username}</Td>
                      <Td>
                        <Badge
                          colorScheme={userItm.role === 'admin' ? 'pink' : 'blue'}
                          variant="subtle"
                          px={2}
                          py={0.5}
                          borderRadius="md"
                        >
                          {userItm.role}
                        </Badge>
                      </Td>
                      <Td>{userItm.specialization || '-'}</Td>
                      <Td>
                        {defaultEcName !== '-' ? (
                          <Tag size="sm" colorScheme="teal" variant="outline">
                            <Icon as={FaBook} mr={1} />
                            {defaultEcName}
                          </Tag>
                        ) : (
                          '-'
                        )}
                      </Td>
                      <Td>{new Date(userItm.createdAt).toLocaleDateString()}</Td>
                      <Td isNumeric>
                        <HStack spacing={1} justify="flex-end">
                          <Select
                            size="xs"
                            w="auto"
                            variant="outline"
                            value={userItm.role}
                            onChange={(e) => openConfirmation('role', userItm, e.target.value)}
                            isDisabled={adminUser && userItm.id === adminUser.id}
                            aria-label={`${userItm.username} için rol seç`}
                            onClick={(e) => e.stopPropagation()}
                            borderColor="borderSecondary"
                            borderRadius="md"
                            _focus={{ borderColor: 'brand.500' }}
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </Select>
                          <Tooltip label="Kullanıcı İstatistikleri" fontSize="xs">
                            <IconButton
                              icon={<Icon as={FaChartBar} />}
                              size="xs"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => handleViewUserStats(userItm)}
                              aria-label="Kullanıcı İstatistikleri"
                            />
                          </Tooltip>
                          <Tooltip label="Kullanıcıyı Sil" fontSize="xs">
                            <IconButton
                              icon={<Icon as={FaTrashAlt} />}
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => openConfirmation('delete', userItm)}
                              isDisabled={adminUser && userItm.id === adminUser.id}
                              aria-label="Kullanıcıyı Sil"
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>
    );
}

export default UserManagement;