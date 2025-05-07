import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
// Chakra UI Bileşenlerini Import Et
import {
    Box,
    Heading,
    Text,
    Spinner,
    Alert,
    AlertIcon,
    AlertDescription,
    Card,       // Her ders için kart
    CardHeader, // Kart başlığı (opsiyonel)
    CardBody,   // Kart içeriği
    Image,      // Resim
    Divider,    // Ayırıcı
    VStack,     // Dikey yığınlama
    Center,     // Ortalama için
    Tag,        // Konu etiketi için
    HStack      // Konu etiketi için
} from '@chakra-ui/react';
import { FaInfoCircle } from 'react-icons/fa'; // Bilgi ikonu için

const API_BASE_URL = import.meta.env.VITE_API_URL;

function LectureList({ selectedTopicId }) {
  const [allLectures, setAllLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const backendUrl      = `${API_BASE_URL}/api/lectures`;
  const backendTopicUrl = `${API_BASE_URL}/api/topics`;
  const [topicsMap, setTopicsMap] = useState({}); // Konuları ID'ye göre saklamak için

  // --- Logic ---

  // Alt konu ID'lerini bulan recursive fonksiyon (Aynı kalır)
  const getAllDescendantIds = useCallback((topicId, topicsMapData, includeSelf = true) => {
    let ids = includeSelf && topicId !== null ? [topicId] : [];
    const directChildren = Object.values(topicsMapData).filter(topic => topic.parentId === topicId);
    directChildren.forEach(child => {
      ids = ids.concat(getAllDescendantIds(child.id, topicsMapData, true));
    });
    return [...new Set(ids.filter(id => id !== null && id !== undefined))];
  }, []);

  // Konuları çek ve map oluştur
  useEffect(() => {
    if (!token) return;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    axios.get(backendTopicUrl, config)
      .then(response => {
          const map = {};
          const flattenForMap = (nodes) => {
              if (!Array.isArray(nodes)) return;
              nodes.forEach(node => {
                  map[node.id] = node; // Tüm node bilgisini saklayalım
                  if (Array.isArray(node.children)) flattenForMap(node.children);
              });
          }
          flattenForMap(Array.isArray(response.data) ? response.data : []);
          setTopicsMap(map);
      })
      .catch(err => console.error("Konuları çekerken hata (LectureList):", err));
  }, [token, backendTopicUrl]);

  // Dersleri çek
  useEffect(() => {
    setLoading(true); setError('');
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    axios.get(backendUrl, config)
      .then(response => {
        setAllLectures(Array.isArray(response.data) ? response.data : []);
      })
      .catch(error => {
        console.error("Konu anlatımlarını çekerken hata:", error);
        setError('Konu anlatımları yüklenirken bir hata oluştu.');
        setAllLectures([]);
      })
      .finally(() => { setLoading(false); });
  }, [token, backendUrl]);

  // Filtrelenmiş dersler (Alt konuları dahil edecek şekilde GÜNCELLENDİ)
  const filteredLectures = useMemo(() => {
    if (selectedTopicId === null || selectedTopicId === undefined || Object.keys(topicsMap).length === 0) {
      // Eğer konu seçilmemişse veya konular yüklenmemişse tüm dersleri göster
      return allLectures;
    }
    // Seçilen konu ve TÜM alt konularının ID'lerini bul
    const relevantTopicIds = getAllDescendantIds(selectedTopicId, topicsMap, true);
    // console.log("Filtering lectures for topic IDs:", relevantTopicIds); // Debug
    return allLectures.filter(lecture => lecture.topic?.id !== null && lecture.topic?.id !== undefined && relevantTopicIds.includes(lecture.topic.id));
  }, [allLectures, selectedTopicId, topicsMap, getAllDescendantIds]);


  // --- Render Bölümü (Chakra UI ve Tema ile Uyumlu) ---

  if (loading) {
      // Chakra UI Spinner
      return (
          <Center py={10}>
              <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="brand.500" size="xl" />
              <Text ml={4} color="textSecondary">Konu anlatımları yükleniyor...</Text>
          </Center>
      );
  }

  if (error) {
      // Chakra UI Alert
      return (
          <Alert status="error" variant="subtle" borderRadius="md" mt={4}>
              <AlertIcon />
              <AlertDescription>{error}</AlertDescription>
          </Alert>
      );
  }

  // Ana İçerik Render
  return (
    // Eski div yerine Box
    <Box>
      {/* Eski h2 yerine Heading, tema stilini kullanır */}
      <Heading as="h2" size="lg" mb={4}>
        Konu Anlatımları {selectedTopicId !== null && selectedTopicId !== undefined ? `(Filtre: ${topicsMap[selectedTopicId]?.name || `ID ${selectedTopicId}`} ve Alt Konuları)` : '(Tümü)'}
      </Heading>

      {filteredLectures.length === 0 ? (
        // Eski p yerine Alert veya Text
        <Alert status="info" variant="subtle" borderRadius="md">
            <AlertIcon as={FaInfoCircle}/>
            <AlertDescription>Bu filtreye uygun konu anlatımı bulunamadı.</AlertDescription>
        </Alert>
      ) : (
         // Eski div yerine VStack (Kartlar arası boşluk için)
        <VStack spacing={6} align="stretch">
          {filteredLectures.map((lecture) => (
             // Eski div yerine Card, tema stilini (varsayılan: elevated veya outline) kullanır
            <Card key={lecture.id} variant="outline" size="md">
               {/* CardBody tema padding'ini kullanır */}
              <CardBody>
                  {/* Eski h3 yerine Heading */}
                <Heading as="h3" size="md" mb={3}>{lecture.title}</Heading>
                {/* Konu bilgisi için Tag veya Text */}
                <HStack mb={3}>
                    <Text fontSize="sm" color="textMuted">Konu:</Text>
                    <Tag size="sm" variant="subtle" colorScheme="blue">
                        {lecture.topic?.name || 'Belirtilmemiş'}
                    </Tag>
                </HStack>

                {/* Resim */}
                {lecture.imageUrl && (
                  <Image
                    src={lecture.imageUrl}
                    alt={`${lecture.title} için görsel`}
                    borderRadius="md" // Temadan
                    boxShadow="sm" // Temadan
                    maxW="xl" // Daha büyük resim için ayarlanabilir
                    mb={4}
                    mx="auto" // Resmi ortala
                    display="block"
                    loading="lazy"
                  />
                )}
                {/* Ayırıcı */}
                <Divider my={4}/>
                {/* HTML İçerik */}
                 <Box
                    className="lecture-html-content-list" // Farklı sınıf adı gerekebilir
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lecture.content) }}
                    sx={{ // LectureViewPage ile aynı veya benzer stiller kullanılabilir
                        'h1, h2, h3, h4, h5, h6': { my: 3, fontWeight:'semibold', lineHeight:'tight', fontSize: 'md' }, // Boyutlar liste için ayarlanabilir
                        'p': { mb: 3, lineHeight: 'base' },
                        'ul, ol': { pl: 5, mb: 3 },
                        'li': { mb: 1 },
                        'img': { my: 3, borderRadius: 'md', maxW: '100%', height: 'auto' },
                        'a': { color: 'brand.500', textDecoration: 'underline', _hover: { color: 'brand.600'} },
                        'code': { fontFamily:'mono', bg:'bgTertiary', px:1, py:'1px', rounded:'sm', fontSize:'sm'},
                        'pre': { fontFamily:'mono', bg:'bgSecondary', p:3, rounded:'md', overflowX:'auto', fontSize:'sm', borderWidth:'1px', borderColor:'borderSecondary', my:4}
                    }}
                />
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}
    </Box>
  );
}

export default LectureList;