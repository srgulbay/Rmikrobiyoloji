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
    Icon
} from '@chakra-ui/react';
import { 
    FaChartBar, FaUsers, FaSitemap, FaChalkboardTeacher, 
    FaQuestionCircle, FaBullhorn, FaCog, FaComments, FaFileContract, FaHistory 
} from 'react-icons/fa'; // FaTags yerine FaSitemap ve yeni ikonlar eklendi
import { useAuth } from '../context/AuthContext'; 

// Mevcut Admin Komponentleri
import AdminStatsOverview from '../components/AdminStatsOverview';
import UserManagement from '../components/UserManagement';
import TopicManagement from '../components/TopicManagement';
import LectureManagement from '../components/LectureManagement';
import QuestionManagement from '../components/QuestionManagement';

// Yeni Eklenen Admin Komponentleri (Yollarını kendi projenize göre düzenleyin)
import AnnouncementsManagement from '../components/AnnouncementsManagement';
import SiteSettingsManagement from '../components/SiteSettingsManagement';
import FeedbackManagement from '../components/FeedbackManagement';
import ExamSimulationManagement from '../components/ExamSimulationManagement';
import ActivityLogViewer from '../components/ActivityLogViewer';


const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function AdminPage() {
    const { token } = useAuth();

    if (!API_BASE_URL) {
        console.error("VITE_API_URL environment variable is not set!");
        return (
            <Container mt={6}>
                <Alert status="error" textAlign="center" borderRadius="md">
                    <AlertIcon /> Uygulama yapılandırma hatası: API adresi bulunamadı.
                </Alert>
            </Container>
        );
    }
    if (!token) {
        return (
            <Container mt={6}>
                <Alert status="warning" textAlign="center" borderRadius="md">
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
            <Tabs isLazy variant="soft-rounded" colorScheme="brand" defaultIndex={0}> {/* colorScheme "brand" veya "blue" olabilir */}
                <TabList flexWrap="wrap" justifyContent="center" mb={6}>
                    <Tab><Icon as={FaChartBar} mr={2} /> İstatistikler</Tab>
                    <Tab><Icon as={FaUsers} mr={2} /> Kullanıcılar</Tab>
                    <Tab><Icon as={FaSitemap} mr={2} /> İçerik Hiyerarşisi</Tab> {/* FaTags -> FaSitemap ve isim değişikliği */}
                    <Tab><Icon as={FaChalkboardTeacher} mr={2} /> Konu Anlatımları</Tab>
                    <Tab><Icon as={FaQuestionCircle} mr={2} /> Sorular</Tab>
                    <Tab><Icon as={FaFileContract} mr={2} /> Deneme Sınavları</Tab>
                    <Tab><Icon as={FaBullhorn} mr={2} /> Duyurular</Tab>
                    <Tab><Icon as={FaComments} mr={2} /> Geri Bildirimler</Tab>
                    <Tab><Icon as={FaCog} mr={2} /> Site Ayarları</Tab>
                    <Tab><Icon as={FaHistory} mr={2} /> Aktivite Logları</Tab>
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
                    <TabPanel p={0}>
                        <ExamSimulationManagement token={token} />
                    </TabPanel>
                    <TabPanel p={0}>
                        <AnnouncementsManagement token={token} />
                    </TabPanel>
                    <TabPanel p={0}>
                        <FeedbackManagement token={token} />
                    </TabPanel>
                    <TabPanel p={0}>
                        <SiteSettingsManagement token={token} />
                    </TabPanel>
                    <TabPanel p={0}>
                        <ActivityLogViewer token={token} />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Container>
    );
}

export default AdminPage;