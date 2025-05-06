import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
const API_BASE_URL = import.meta.env.VITE_API_URL;

function LectureList({ selectedTopicId }) {
  const [allLectures, setAllLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const backendUrl      = `${API_BASE_URL}/api/lectures`;
const backendTopicUrl = `${API_BASE_URL}/api/topics`;
  
  // Alt konu ID'lerini bulan recursive fonksiyon
  const getAllDescendantIds = useCallback((topicId, topicsMap, includeSelf = true) => {
    let ids = includeSelf ? [topicId] : [];
    const directChildren = Object.values(topicsMap).filter(topic => topic.parentId === topicId);
    directChildren.forEach(child => {
      ids = ids.concat(getAllDescendantIds(child.id, topicsMap, true)); // true -> kendini de dahil et
    });
    return ids;
  }, []);


  // Filtrelenmiş dersler
  const filteredLectures = useMemo(() => {
    console.log("Filtering lectures for topicId:", selectedTopicId);
    if (selectedTopicId === null || selectedTopicId === undefined) {
      return allLectures;
    }
    // TODO: Alt konuları dahil etmek için:
    // 1. Tüm topic verisini (ağaç veya düz liste + map) al.
    // 2. seçilen topicId'nin tüm alt ID'lerini bul (getAllDescendantIds).
    // 3. Filter'ı `allDescendantIds.includes(lecture.topic?.id)` şeklinde yap.
    // Şimdilik sadece direkt eşleşme:
    return allLectures.filter(lecture => lecture.topic?.id === selectedTopicId);
  }, [allLectures, selectedTopicId]); // getAllDescendantIds ve topicsMap bağımlılığı eklenecek


  useEffect(() => {
    setLoading(true);
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    // Sadece dersleri çekelim, filtrelemeyi sonra yapalım
    axios.get(backendUrl, config)
      .then(response => {
        setAllLectures(response.data || []);
        setError('');
      })
      .catch(error => {
        console.error("Konu anlatımlarını çekerken hata:", error);
        setError('Konu anlatımları yüklenirken bir hata oluştu.');
        setAllLectures([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, backendUrl]); // Token değişirse yeniden çek


  if (loading) return <p>Konu anlatımları yükleniyor...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Konu Anlatımları {selectedTopicId !== null ? `(Filtre: Konu ID ${selectedTopicId})` : '(Tümü)'}</h2>
      {filteredLectures.length === 0 ? (
        <p>Gösterilecek konu anlatımı bulunamadı.</p>
      ) : (
        <div>
          {filteredLectures.map((lecture) => (
            <div key={lecture.id} style={{ border: '1px solid #eee', marginBottom: '15px', padding: '10px' }}>
              <h3>{lecture.title}</h3>
              <p><strong>Konu:</strong> {lecture.topic?.name || 'Belirtilmemiş'}</p>
              {lecture.imageUrl && ( <img src={lecture.imageUrl} alt={`${lecture.title} için görsel`} style={{ maxWidth: '300px', marginBottom: '10px', display:'block' }} /> )}
              <hr style={{margin: '10px 0'}}/>
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lecture.content) }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LectureList;
