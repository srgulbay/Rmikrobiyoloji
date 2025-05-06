import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
const API_BASE_URL = import.meta.env.VITE_API_URL;

function QuestionList({ selectedTopicId }) {
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();
const backendUrl      = `${API_BASE_URL}/api/questions`;
const backendTopicUrl = `${API_BASE_URL}/api/topics`;

  // Alt konu ID'lerini bulan recursive fonksiyon
  const getAllDescendantIds = useCallback((topicId, topicsMap, includeSelf = true) => {
    let ids = includeSelf ? [topicId] : [];
    const directChildren = Object.values(topicsMap).filter(topic => topic.parentId === topicId);
    directChildren.forEach(child => {
      ids = ids.concat(getAllDescendantIds(child.id, topicsMap, true));
    });
    return ids;
  }, []);

  // Konuları state'te tutalım
  const [topicsMap, setTopicsMap] = useState({});
  useEffect(() => {
    if (!token) return;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    axios.get(backendTopicUrl, config) // Ağaç yapısını alıyoruz
      .then(response => {
          // Düz map oluşturalım kolay erişim için
          const map = {};
          const flattenForMap = (nodes) => {
              if (!nodes) return;
              nodes.forEach(node => {
                  map[node.id] = node; // Çocukları da ekleyelim mi? Şimdilik sadece ID, name, parentId yeterli olabilir
                  if (node.children) flattenForMap(node.children);
              });
          }
          flattenForMap(response.data);
          setTopicsMap(map);
      })
      .catch(err => console.error("Konuları çekerken hata (QuestionList):", err));
  }, [token, backendTopicUrl]);


  useEffect(() => {
    setLoading(true);
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    axios.get(backendUrl, config) // Filtresiz tüm soruları çek
      .then(response => { setAllQuestions(response.data || []); setError(''); })
      .catch(error => { console.error("Soruları çekerken hata:", error); setError('Sorular yüklenirken bir hata oluştu.'); setAllQuestions([]); })
      .finally(() => { setLoading(false); });
  }, [token, backendUrl]);

  // Filtrelenmiş sorular
  const filteredQuestions = useMemo(() => {
    if (selectedTopicId === null || selectedTopicId === undefined) {
      return allQuestions;
    }
    // Seçilen konu ve TÜM alt konularının ID'lerini bul
    const relevantTopicIds = getAllDescendantIds(selectedTopicId, topicsMap, true); // Kendini de dahil et
    console.log("Filtering questions for topic IDs:", relevantTopicIds); // Debug
    return allQuestions.filter(q => q.topic?.id && relevantTopicIds.includes(q.topic.id));

  }, [allQuestions, selectedTopicId, topicsMap, getAllDescendantIds]);


  const stripHtml = (html) => { if (!html) return ''; return html.replace(/<[^>]*>?/gm, ''); };

  if (loading) return <p>Sorular yükleniyor...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Soru Havuzu {selectedTopicId !== null ? `(Filtre: Konu ID ${selectedTopicId} ve Alt Konuları)` : '(Tümü)'}</h2>
      {filteredQuestions.length === 0 ? (
        <p>Gösterilecek soru bulunamadı.</p>
      ) : (
         <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th>ID</th><th>Metin (Başlangıcı)</th><th>Konu</th><th>Zorluk</th><th>Sınıf.</th><th>Görsel</th></tr></thead>
            <tbody>
                {filteredQuestions.map((q) => (
                    <tr key={q.id}>
                        <td>{q.id}</td>
                        <td title={stripHtml(q.text)}>{stripHtml(q.text).substring(0, 70)}...</td>
                        <td>{q.topic?.name || '-'}</td>
                        <td>{q.difficulty}</td>
                        <td>{q.classification}</td>
                        <td>{q.imageUrl ? 'Var' : '-'}</td>
                    </tr>
                ))}
            </tbody>
         </table>
      )}
    </div>
  );
}

export default QuestionList;
