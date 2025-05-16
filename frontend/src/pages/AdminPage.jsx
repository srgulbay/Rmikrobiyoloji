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
    Icon,
    useColorModeValue // useColorModeValue eklendi (textPrimary için)
} from '@chakra-ui/react';
import { 
    FaChartBar, FaUsers, FaSitemap, FaChalkboardTeacher, 
    FaQuestionCircle, FaBullhorn, FaCog, FaComments, FaFileContract, FaHistory,
    FaClone // Flash kartlar için ikon (FaLightbulb da olabilir)
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext'; 

// Admin Komponentleri
import AdminStatsOverview from '../components/AdminStatsOverview';
import UserManagement from '../components/UserManagement';
import TopicManagement from '../components/TopicManagement'; // İçerik Hiyerarşisi
import LectureManagement from '../components/LectureManagement';
import QuestionManagement from '../components/QuestionManagement';
import ExamSimulationManagement from '../components/ExamSimulationManagement';
import AnnouncementsManagement from '../components/AnnouncementsManagement';
import SiteSettingsManagement from '../components/SiteSettingsManagement';
import FeedbackManagement from '../components/FeedbackManagement';
import ActivityLogViewer from '../components/ActivityLogViewer';
import FlashcardManagement from '../components/admin/FlashcardManagement'; // YENİ: Flash Kart Yönetimi Component'i

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function AdminPage() {
    const { token } = useAuth();
    const textPrimaryColor = useColorModeValue("gray.700", "gray.100"); // textPrimary için
    const tabSelectedBg = useColorModeValue('brand.500', 'brand.300'); // Seçili tab için renk
    const tabSelectedColor = useColorModeValue('white', 'gray.900'); // Seçili tab metin rengi
    const borderColor = useColorModeValue("gray.200", "gray.700"); // Açık ve koyu mod için otomatik renk
    const cardBg = useColorModeValue("white", "gray.750"); // Kart arka plan rengi
    const tabBg = useColorModeValue("white", "gray.800"); // Sekme arka plan rengi
    const tabTextColor = useColorModeValue("gray.700", "gray.200"); // Sekme metin rengi
    const tabBorderColor = useColorModeValue("gray.200", "gray.600"); // Sekme kenarlık rengi
    const tabHoverBg = useColorModeValue("gray.100", "gray.700"); // Sekme üzerine gelince arka plan rengi
    const tabHoverColor = useColorModeValue("gray.800", "white"); // Sekme üzerine gelince metin rengi
    const tabActiveBg = useColorModeValue("brand.500", "brand.300"); // Aktif sekme arka plan rengi
    const tabActiveColor = useColorModeValue("white", "gray.900"); // Aktif sekme metin rengi
    const tabInactiveBg = useColorModeValue("white", "gray.800"); // Pasif sekme arka plan rengi
    const tabInactiveColor = useColorModeValue("gray.700", "gray.200"); // Pasif sekme metin rengi
    const tabBorderRadius = "md"; // Sekme kenar yuvarlama
    const tabPadding = { base: 3, md: 4 }; // Sekme iç boşlukları
    const tabMargin = { base: 1, md: 0 }; // Sekme dış boşlukları
    const tabMarginBottom = { base: 6, md: 0 }; // Sekme alt boşluğu
    const tabMarginRight = { base: 0, md: 6 }; // Sekme sağ boşluğu
    const tabWidth = { base: "auto", md: "full" }; // Sekme genişliği
    const tabFlexDirection = { base: "row", md: "column" }; // Sekme yönlendirmesi
    const tabFlexAlign = { base: "center", md: "flex-start" }; // Sekme hizalaması
    const tabFlexJustify = { base: "center", md: "flex-start" }; // Sekme içerik hizalaması
    const tabFlexWrap = { base: "nowrap", md: "wrap" }; // Sekme sarma
    const tabFlexGrow = { base: 1, md: 0 }; // Sekme esneme oranı
    const tabFlexShrink = { base: 0, md: 1 }; // Sekme küçülme oranı
    const tabFlexBasis = { base: "auto", md: "100%" }; // Sekme temel genişliği
    const tabFlexBasisMobile = { base: "100%", md: "auto" }; // Mobilde sekme temel genişliği
    const tabFlexBasisDesktop = { base: "auto", md: "100%" }; // Masaüstünde sekme temel genişliği
    const tabFlexBasisVertical = { base: "auto", md: "100%" }; // Dikey sekme temel genişliği
    const tabFlexBasisHorizontal = { base: "100%", md: "auto" }; // Yatay sekme temel genişliği
    const tabFlexBasisVerticalMobile = { base: "100%", md: "auto" }; // Dikey sekme mobil temel genişliği
    const tabFlexBasisHorizontalMobile = { base: "auto", md: "100%" }; // Yatay sekme mobil temel genişliği
    const tabFlexBasisVerticalDesktop = { base: "auto", md: "100%" }; // Dikey sekme masaüstü temel genişliği 
    const tabFlexBasisHorizontalDesktop = { base: "100%", md: "auto" }; // Yatay sekme masaüstü temel genişliği
    const tabFlexBasisVerticalDikey = { base: "auto", md: "100%" }; // Dikey sekme temel genişliği
    const tabFlexBasisHorizontalYatay = { base: "100%", md: "auto" }; // Yatay sekme temel genişliği
    const tabFlexBasisVerticalDikeyMobile = { base: "100%", md: "auto" }; // Dikey sekme mobil temel genişliği
    const tabFlexBasisHorizontalYatayMobile = { base: "auto", md: "100%" }; // Yatay sekme mobil temel genişliği
    const tabFlexBasisVerticalDikeyDesktop = { base: "auto", md: "100%" }; // Dikey sekme masaüstü temel genişliği
    const tabFlexBasisHorizontalYatayDesktop = { base: "100%", md: "auto" }; // Yatay sekme masaüstü temel genişliği
    const tabFlexBasisVerticalDikeyDikey = { base: "auto", md: "100%" }; // Dikey sekme temel genişliği
    const tabFlexBasisHorizontalYatayYatay = { base: "100%", md: "auto" }; // Yatay sekme temel genişliği
    const tabFlexBasisVerticalDikeyDikeyMobile = { base: "100%", md: "auto" }; // Dikey sekme mobil temel genişliği
    const tabFlexBasisHorizontalYatayYatayMobile = { base: "auto", md: "100%" }; // Yatay sekme mobil temel genişliği
    const tabFlexBasisVerticalDikeyDikeyDesktop = { base: "auto", md: "100%" }; // Dikey sekme masaüstü temel genişliği
    const tabFlexBasisHorizontalYatayYatayDesktop = { base: "100%", md: "auto" }; // Yatay sekme masaüstü temel genişliği
    const tabFlexBasisVerticalDikeyDikeyDikey = { base: "auto", md: "100%" }; // Dikey sekme temel genişliği
    const tabFlexBasisHorizontalYatayYatayYatay = { base: "100%", md: "auto" }; // Yatay sekme temel genişliği
    const tabFlexBasisVerticalDikeyDikeyDikeyMobile = { base: "100%", md: "auto" }; // Dikey sekme mobil temel genişliği
    const tabFlexBasisHorizontalYatayYatayYatayMobile = { base: "auto", md: "100%" }; // Yatay sekme mobil temel genişliği
    const tabFlexBasisVerticalDikeyDikeyDikeyDesktop = { base: "auto", md: "100%" }; // Dikey sekme masaüstü temel genişliği
    const tabFlexBasisHorizontalYatayYatayYatayDesktop = { base: "100%", md: "auto" }; // Yatay sekme masaüstü temel genişliği          

    if (!API_BASE_URL) {
        // Bu kontrol genellikle uygulamanın daha üst bir seviyesinde (örn: main.jsx) yapılmalı
        // veya bir context aracılığıyla sağlanmalı. Sayfa bazında yapmak tekrara yol açar.
        console.error("VITE_API_URL environment variable is not set!");
        return (
            <Container mt={6}>
                <Alert status="error" textAlign="center" borderRadius="md">
                    <AlertIcon /> Uygulama yapılandırma hatası: API adresi bulunamadı. Lütfen sistem yöneticisi ile iletişime geçin.
                </Alert>
            </Container>
        );
    }
    if (!token) { // Bu kontrol ProtectedRoute veya AdminRoute ile yapılmalı
        return (
            <Container mt={6}>
                <Alert status="warning" textAlign="center" borderRadius="md">
                    <AlertIcon /> Bu sayfaya erişim yetkiniz bulunmamaktadır. Lütfen giriş yapın.
                </Alert>
            </Container>
        );
    }

    // AdminPage'e erişim zaten AdminRoute ile korunuyorsa, burada tekrar token kontrolü gerekmeyebilir.
    // Ancak, token'ı alt component'lere prop olarak geçmek için burada tutmak mantıklı.

    const adminTabs = [
        { label: "İstatistikler", icon: FaChartBar, component: <AdminStatsOverview token={token} /> },
        { label: "Kullanıcılar", icon: FaUsers, component: <UserManagement token={token} /> },
        { label: "İçerik Hiyerarşisi", icon: FaSitemap, component: <TopicManagement token={token} /> },
        { label: "Flash Kartlar", icon: FaClone, component: <FlashcardManagement token={token} /> }, // YENİ SEKME
        { label: "Konu Anlatımları", icon: FaChalkboardTeacher, component: <LectureManagement token={token} /> },
        { label: "Sorular", icon: FaQuestionCircle, component: <QuestionManagement token={token} /> },
        { label: "Deneme Sınavları", icon: FaFileContract, component: <ExamSimulationManagement token={token} /> },
        { label: "Duyurular", icon: FaBullhorn, component: <AnnouncementsManagement token={token} /> },
        { label: "Geri Bildirimler", icon: FaComments, component: <FeedbackManagement token={token} /> },
        { label: "Site Ayarları", icon: FaCog, component: <SiteSettingsManagement token={token} /> },
        { label: "Aktivite Logları", icon: FaHistory, component: <ActivityLogViewer token={token} /> },
    ];

    return (
        <Container maxW="container.full" py={8} px={{base: 2, md: 6}}> {/* Kenar boşlukları için px eklendi */}
            <Heading as="h1" size="xl" textAlign="center" mb={10} color={textPrimaryColor}>
                Yönetim Paneli
            </Heading>
            <Tabs 
                isLazy 
                variant="soft-rounded" // "enclosed-colored" veya "line" da denenebilir
                colorScheme="brand" 
                defaultIndex={0} 
                orientation={{base: "horizontal", md: "vertical"}} // Mobilde yatay, masaüstünde dikey sekmeler
                align={{base: "center", md: "flex-start"}} // Dikey sekmeler için
            >
                <TabList 
                    flexDirection={{base: "row", md: "column"}} // Dikey sekmeler için
                    overflowX={{base: "auto", md: "hidden"}} // Mobilde yatay kaydırma
                    overflowY={{base: "hidden", md: "auto"}} // Masaüstünde dikey kaydırma
                    borderRightWidth={{base:0, md: "1px"}} // Dikey sekmelerde sağ kenarlık
                    borderBottomWidth={{base:"1px", md: 0}} // Yatay sekmelerde alt kenarlık
                    borderColor={borderColor}
                    mr={{base:0, md:6}} // Dikey sekmelerde sağ boşluk
                    mb={{base:6, md:0}} // Yatay sekmelerde alt boşluk
                    py={2}
                    sx={{
                        '&::-webkit-scrollbar': { width: '6px', height: '6px' },
                        '&::-webkit-scrollbar-thumb': { background: useColorModeValue('gray.300', 'gray.600'), borderRadius: '10px' },
                        '&::-webkit-scrollbar-track': { background: 'transparent' },
                    }}
                >
                    {adminTabs.map((tabInfo, index) => (
                        <Tab 
                            key={index} 
                            fontWeight="medium" 
                            borderRadius="md"
                            justifyContent={{base:"center", md:"flex-start"}} // Dikeyde sola yasla
                            w={{base:"auto", md:"full"}} // Dikeyde tam genişlik
                            _selected={{ color: tabSelectedColor, bg: tabSelectedBg, boxShadow:"md" }}
                            px={{base:3, md:4}}
                            py={2}
                            mb={{base:1, md:1}}
                            mr={{base:1, md:0}}
                        >
                            <Icon as={tabInfo.icon} mr={2} boxSize={4}/> {tabInfo.label}
                        </Tab>
                    ))}
                </TabList>
                <TabPanels flex="1" minW={0}> {/* İçeriğin kalan alanı kaplaması için */}
                    {adminTabs.map((tabInfo, index) => (
                        <TabPanel key={index} p={0}>
                            {tabInfo.component}
                        </TabPanel>
                    ))}
                </TabPanels>
            </Tabs>
        </Container>
    );
}

export default AdminPage;
