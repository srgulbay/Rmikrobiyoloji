import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
// Chakra UI Bileşenlerini Import Et
import {
    Box,
    Heading,
    Text,
    Spinner, // Yükleme göstergesi
    Alert,   // Hata/Bilgi mesajları
    AlertIcon,
    AlertDescription,
    Table,   // Tablo için
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer, // Tablo sarmalayıcı
    Center, // Ortalama için
    useColorModeValue // Opsiyonel, doğrudan semantic token kullanılabilir
} from '@chakra-ui/react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function QuestionList({ selectedTopicId }) {
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const backendUrl      = `${API_BASE_URL}/api/questions`;
  const backendTopicUrl = `${API_BASE_URL}/api/topics`;
  const [topicsMap, setTopicsMap] = useState({});

  // --- Logic (Aynı Kalır) ---
  const getAllDescendantIds = useCallback((topicId, topicsMapData, includeSelf = true) => {
    let ids = includeSelf && topicId !== null ? [topicId] : []; // topicId null değilse ekle
    const directChildren = Object.values(topicsMapData).filter(topic => topic.parentId === topicId);
    directChildren.forEach(child => {
      ids = ids.concat(getAllDescendantIds(child.id, topicsMapData, true));
    });
    // Tekrarları kaldır ve null/undefined filtrele
    return [...new Set(ids.filter(id => id !== null && id !== undefined))];
  }, []);

  useEffect(() => {
    if (!token) return;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    axios.get(backendTopicUrl, config)
      .then(response => {
          const map = {};
          const flattenForMap = (nodes) => {
              if (!Array.isArray(nodes)) return; // Dizi kontrolü
              nodes.forEach(node => {
                  map[node.id] = node;
                  if (Array.isArray(node.children)) flattenForMap(node.children); // Dizi kontrolü
              });
          }
          flattenForMap(Array.isArray(response.data) ? response.data : []); // Gelen verinin dizi olduğundan emin ol
          setTopicsMap(map);
      })
      .catch(err => console.error("Konuları çekerken hata (QuestionList):", err));
  }, [token, backendTopicUrl]);


  useEffect(() => {
    setLoading(true); setError('');
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    axios.get(backendUrl, config)
      .then(response => { setAllQuestions(Array.isArray(response.data) ? response.data : []); }) // Gelen verinin dizi olduğundan emin ol
      .catch(error => { console.error("Soruları çekerken hata:", error); setError('Sorular yüklenirken bir hata oluştu.'); setAllQuestions([]); })
      .finally(() => { setLoading(false); });
  }, [token, backendUrl]);

  const filteredQuestions = useMemo(() => {
    // selectedTopicId null veya undefined ise tüm soruları döndür
    if (selectedTopicId === null || selectedTopicId === undefined) {
      return allQuestions;
    }
    // Seçilen konu ve alt konularının ID'lerini bul
    const relevantTopicIds = getAllDescendantIds(selectedTopicId, topicsMap, true);
    // console.log("Filtering questions for topic IDs:", relevantTopicIds);
    // topicId'si relevantTopicIds içinde olan soruları filtrele
    return allQuestions.filter(q => q.topic?.id !== null && q.topic?.id !== undefined && relevantTopicIds.includes(q.topic.id));
  }, [allQuestions, selectedTopicId, topicsMap, getAllDescendantIds]);


  const stripHtml = (html) => { if (!html) return ''; return html.replace(/<[^>]*>?/gm, ''); };

  // --- Render Bölümü (Chakra UI ve Tema ile Uyumlu) ---

  if (loading) {
      // Chakra UI Spinner
      return (
          <Center py={10}>
              <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="brand.500" size="xl" />
              <Text ml={4} color="textSecondary">Sorular yükleniyor...</Text>
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
        {/* Eski h2 yerine Heading, tema stillerini kullanır */}
        <Heading as="h2" size="lg" mb={4}>
            Soru Havuzu {selectedTopicId !== null && selectedTopicId !== undefined ? `(Filtre: Konu ID ${selectedTopicId} ve Alt Konuları)` : '(Tümü)'}
        </Heading>

        {filteredQuestions.length === 0 ? (
            // Eski p yerine Alert veya Text
            <Alert status="info" variant="subtle" borderRadius="md">
                <AlertIcon />
                <AlertDescription>Bu filtreye uygun soru bulunamadı.</AlertDescription>
            </Alert>
        ) : (
            // Eski table yerine Chakra Table ve TableContainer
            // Tema stilini (varsayılan: simple veya striped) ve boyutunu (varsayılan: md) kullanır
             <TableContainer borderWidth="1px" borderColor="borderSecondary" borderRadius="md">
                 <Table variant="striped" size="sm"> {/* Boyut 'sm' olarak ayarlandı, 'md' de olabilir */}
                     {/* Thead tema stilini kullanır */}
                     <Thead>
                         <Tr>
                             <Th>ID</Th>
                             <Th>Metin (Başlangıcı)</Th>
                             <Th>Konu</Th>
                             {/* <Th>Zorluk</Th> */} {/* Zorluk verisi yok gibi görünüyor, kaldırıldı */}
                             <Th>Sınıf.</Th>
                             <Th>Görsel</Th>
                         </Tr>
                     </Thead>
                     {/* Tbody tema stilini kullanır */}
                     <Tbody>
                         {filteredQuestions.map((q) => (
                             // Tr ve Td tema stillerini kullanır
                             <Tr key={q.id} _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}> {/* Temadan hover efekti */}
                                 <Td>{q.id}</Td>
                                 <Td maxW="350px" whiteSpace="normal" title={stripHtml(q.text)}> {/* Genişlik ve kaydırma */}
                                      {stripHtml(q.text).substring(0, 70)}...
                                 </Td>
                                 <Td>{q.topic?.name || '-'}</Td>
                                 {/* <Td>{q.difficulty || '-'}</Td> */} {/* Zorluk verisi yok */}
                                 <Td>{q.classification || '-'}</Td>
                                 <Td>{q.imageUrl ? 'Var' : '-'}</Td>
                             </Tr>
                         ))}
                     </Tbody>
                 </Table>
             </TableContainer>
        )}
    </Box>
  );
}

export default QuestionList;