import React from 'react';
import {
    Container,
    Heading,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Alert,
    AlertIcon,
    Icon // <-- EKLENDİ
} from '@chakra-ui/react';
import { FaChartBar, FaUsers, FaTags, FaChalkboardTeacher, FaQuestionCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext'; // Bu yolun projenize göre doğru olduğundan emin olun
import AdminStatsOverview from '../components/AdminStatsOverview';
import UserManagement from '../components/UserManagement';
import TopicManagement from '../components/TopicManagement';
import LectureManagement from '../components/LectureManagement';
import QuestionManagement from '../components/QuestionManagement';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function AdminPage() {
    const { token } = useAuth();

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
    if (!token) {
        return (
            <Container mt={6}>
                <Alert status="warning" textAlign="center">
                    <AlertIcon /> Bu sayfaya erişim için giriş yapmalısınız.
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxW="container.xl" py={8}>
            <Heading as="h1" size="xl" textAlign="center" mb={8} color="textPrimary">
                Yönetim Paneli
            </Heading>
            <Tabs isLazy variant="soft-rounded" colorScheme="blue">
                <TabList flexWrap="wrap" justifyContent="center" mb={6}>
                    <Tab><Icon as={FaChartBar} mr={2} /> İstatistikler</Tab>
                    <Tab><Icon as={FaUsers} mr={2} /> Kullanıcılar</Tab>
                    <Tab><Icon as={FaTags} mr={2} /> Konular</Tab>
                    <Tab><Icon as={FaChalkboardTeacher} mr={2} /> Konu Anlatımları</Tab>
                    <Tab><Icon as={FaQuestionCircle} mr={2} /> Sorular</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel p={0}>
                        <AdminStatsOverview token={token} />
                    </TabPanel>
                    <TabPanel p={0}>
                        <UserManagement token={token} />
                    </TabPanel>
                    <TabPanel p={0}>
                        <TopicManagement token={token} />
                    </TabPanel>
                    <TabPanel p={0}>
                        <LectureManagement token={token} />
                    </TabPanel>
                    <TabPanel p={0}>
                        <QuestionManagement token={token} />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Container>
    );
}

export default AdminPage;