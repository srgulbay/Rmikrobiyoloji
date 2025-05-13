// src/components/SiteSettingsManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Box, Heading, VStack, HStack, Button, Icon,
    FormControl, FormLabel, Input, Switch,
    useToast, Spinner, Alert, AlertIcon, Text,
    useColorModeValue, SimpleGrid, Center
} from '@chakra-ui/react';
import { FaCog, FaSave, FaExclamationTriangle } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function SiteSettingsManagement({ token }) {
    const [settings, setSettings] = useState({
        siteName: '',
        maintenanceMode: false,
        defaultUserRole: 'user',
        allowRegistrations: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const toast = useToast();

    // Style Hooks
    const componentBg = useColorModeValue("white", "gray.800");
    const formBg = useColorModeValue('purple.50', 'purple.900'); // Tematik bir arkaplan
    const formBorderColor = useColorModeValue('purple.300', 'purple.700'); // Tematik kenarlık
    const inputSelectBg = useColorModeValue("white", "gray.700");
    const borderColor = useColorModeValue("gray.200", "gray.600"); // Genel kenarlık
    const headingColor = useColorModeValue("gray.700", "gray.200"); // Başlık için renk
    const textColor = useColorModeValue("gray.600", "gray.400"); // Normal metinler için

    const fetchSettings = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${API_BASE_URL}/api/admin/settings`, config);
            if (response.data) {
                setSettings(prev => ({ ...prev, ...response.data }));
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Site ayarları yüklenirken bir hata oluştu.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(''); 
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`${API_BASE_URL}/api/admin/settings`, settings, config);
            toast({ title: "Başarılı", description: "Site ayarları güncellendi.", status: "success", duration: 3000, isClosable: true });
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Ayarlar kaydedilirken hata oluştu.';
            setError(errorMsg); 
            toast({ title: "Kaydetme Hatası", description: errorMsg, status: "error", duration: 5000, isClosable: true });
        } finally {
            setSaving(false);
        }
    }, [token, settings, toast]);

    if (loading) return <Center p={10}><Spinner size="xl" color="brand.500" thickness="3px" /></Center>;

    return (
        <Box p={{base: 2, md:4}} borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="lg" bg={componentBg}>
            <Heading as="h3" size="lg" display="flex" alignItems="center" gap={3} mb={6} color={headingColor}>
                <Icon as={FaCog} /> Site Ayarları ve Yapılandırma
            </Heading>

            {error && <Alert status="error" mb={6} borderRadius="md" variant="subtle"><AlertIcon as={FaExclamationTriangle} />{error}</Alert>}

            <Box as="form" onSubmit={handleSubmit} p={6} borderWidth="1px" borderRadius="lg" borderColor={formBorderColor} bg={formBg} boxShadow="md">
                <VStack spacing={6} align="stretch">
                    <FormControl id="siteName">
                        <FormLabel fontSize="sm" color={textColor}>Site Adı</FormLabel>
                        <Input 
                            name="siteName" 
                            value={settings.siteName} 
                            onChange={handleInputChange} 
                            bg={inputSelectBg}
                            focusBorderColor="purple.500"
                        />
                    </FormControl>

                    <SimpleGrid columns={{base: 1, md: 2}} spacing={6}>
                        <FormControl display="flex" alignItems="center" id="maintenanceModeSwitch">
                            <FormLabel htmlFor="maintenanceMode" mb="0" fontSize="sm" mr={3} color={textColor}>
                                Bakım Modu Aktif:
                            </FormLabel>
                            <Switch 
                                id="maintenanceMode" 
                                name="maintenanceMode"
                                isChecked={settings.maintenanceMode} 
                                onChange={handleInputChange} 
                                colorScheme="pink"
                            />
                        </FormControl>

                        <FormControl display="flex" alignItems="center" id="allowRegistrationsSwitch">
                            <FormLabel htmlFor="allowRegistrations" mb="0" fontSize="sm" mr={3} color={textColor}>
                                Yeni Kayıtlara İzin Ver:
                            </FormLabel>
                            <Switch 
                                id="allowRegistrations" 
                                name="allowRegistrations"
                                isChecked={settings.allowRegistrations} 
                                onChange={handleInputChange} 
                                colorScheme="green"
                            />
                        </FormControl>
                    </SimpleGrid>
                    
                    {/*
                     <FormControl id="defaultUserRoleSelect">
                         <FormLabel fontSize="sm" color={textColor}>Varsayılan Kullanıcı Rolü (Kayıtta)</FormLabel>
                         <Select name="defaultUserRole" value={settings.defaultUserRole} onChange={handleInputChange} bg={inputSelectBg} focusBorderColor="purple.500">
                             <option value="user">User</option>
                             <option value="subscriber">Subscriber (Örnek)</option>
                         </Select>
                     </FormControl>
                    */}
                     <Text fontSize="xs" color="textMuted" mt={1}>Not: Bu ayarların tam olarak etkili olabilmesi için backend tarafında ilgili mantıkların bulunması gerekmektedir.</Text>


                    <Button 
                        type="submit" 
                        colorScheme="purple" 
                        leftIcon={<FaSave />} 
                        isLoading={saving}
                        loadingText="Kaydediliyor..."
                        alignSelf="flex-start"
                        mt={4}
                    >
                        Ayarları Kaydet
                    </Button>
                </VStack>
            </Box>
        </Box>
    );
}

export default SiteSettingsManagement;