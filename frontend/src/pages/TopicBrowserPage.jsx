import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopicCard from '../components/TopicCard'; // TopicCard component'i import edildi

function TopicBrowserPage() {
  const [topicTree, setTopicTree] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [currentTopics, setCurrentTopics] = useState([]); // Gösterilecek güncel seviye konuları
  const [selectedForContent, setSelectedForContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  const backendTopicUrl = 'http://localhost:3001/api/topics';

  const fetchTopics = useCallback(async () => {
    setLoading(true); setError('');
    if (!token) { setError("Konuları görmek için giriş yapmalısınız."); setLoading(false); return;}
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(backendTopicUrl, config);
      setTopicTree(response.data || []);
    } catch (err) { console.error("Konu ağacı çekilirken hata:", err); setError('Konular yüklenirken bir hata oluştu.'); }
    finally { setLoading(false); }
  }, [token, backendTopicUrl]);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  // currentPath veya topicTree değiştiğinde gösterilecek konuları ayarla
  useEffect(() => {
    let currentLevelData = topicTree;
    let isValidPath = true;
    try {
        currentPath.forEach(pathId => {
            const nextLevel = currentLevelData.find(topic => topic.id === pathId);
            if (nextLevel && nextLevel.children) {
                currentLevelData = nextLevel.children;
            } else {
                isValidPath = false; // Path'in devamı yok veya children yok
                // Eğer path'in sonuna geldiysek (çocuk yoksa), bu içerik gösterilecek durumdur
                if (nextLevel && (!nextLevel.children || nextLevel.children.length === 0)) {
                     // Hata fırlatma, bu normal durum olabilir
                } else {
                     throw new Error("Invalid path segment"); // Geçersiz path durumu
                }
            }
        });

         if (isValidPath) {
             setCurrentTopics(currentLevelData);
             setSelectedForContent(null);
         } else if (currentPath.length > 0) {
             // Geçersiz path sonu, son geçerli konuyu bulup içerik için seçelim
             let finalTopic = null;
             let searchLevel = topicTree;
             currentPath.forEach(pathId => {
                 const found = searchLevel?.find(t => t.id === pathId);
                 if (found) {
                     finalTopic = found;
                     searchLevel = found.children;
                 } else {
                     finalTopic = null; // Güvenlik önlemi
                 }
             });
             if (finalTopic && (!finalTopic.children || finalTopic.children.length === 0)) {
                  setSelectedForContent(finalTopic);
                  setCurrentTopics([]);
             } else {
                  // Path vardı ama son eleman alt eleman içeriyorsa veya bulunamadıysa başa dönelim
                  console.error("Path valid değil veya son eleman alt eleman içeriyor.");
                  setCurrentPath([]); // Başa dön
                  setCurrentTopics(topicTree);
                  setSelectedForContent(null);
             }
         } else {
             // Path boşsa (ilk yükleme)
             setCurrentTopics(topicTree);
             setSelectedForContent(null);
         }

    } catch(e) {
        console.error("Current topics ayarlanırken hata:", e);
        setCurrentPath([]); // Hata durumunda başa dön
        setCurrentTopics(topicTree);
        setSelectedForContent(null);
    }

  }, [currentPath, topicTree]);

  const handleTopicSelect = (selectedTopic) => {
    setError('');
    if (selectedTopic.children && selectedTopic.children.length > 0) {
      setCurrentPath(prevPath => [...prevPath, selectedTopic.id]);
    } else {
      setSelectedForContent(selectedTopic);
      setCurrentTopics([]);
    }
  };

  const handleGoBack = () => {
    setError('');
    setCurrentPath(prevPath => prevPath.slice(0, -1));
    setSelectedForContent(null);
  };

   const handleContentNavigation = (type) => {
       if (!selectedForContent) return;
       if (type === 'lecture') { navigate(`/lectures/topic/${selectedForContent.id}`); }
       else if (type === 'quiz') { navigate(`/solve/${selectedForContent.id}`); }
   };

  let currentPathNames = ['Konular'];
  let searchLevelForNames = topicTree;
  currentPath.forEach(pathId => {
      const found = searchLevelForNames?.find(t => t.id === pathId);
      if (found) { currentPathNames.push(found.name); searchLevelForNames = found.children; }
  });

  if (loading) return <p>Konular yükleniyor...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <main>
      <h2>{currentPathNames.join(' > ')}</h2>
      {currentPath.length > 0 && !selectedForContent && ( <button onClick={handleGoBack} className="btn btn-secondary" style={{ marginBottom: 'var(--space-l)' }}> &lt; Geri ({currentPathNames[currentPathNames.length - 2] || 'Konular'}) </button> )}

      {!selectedForContent ? (
          // --- HATA BURADAYDI: topics yerine currentTopics kullanılmalı ---
          currentTopics.length === 0 && currentPath.length > 0 ? (
             <div>
                <p>Bu konu altında başka alt konu bulunmuyor.</p>
                {/* Son seviyede içerik seçme butonlarını gösterelim */}
                 <button onClick={() => handleContentNavigation('lecture')} className='btn btn-secondary' style={{marginRight: '10px'}}> <i className="fas fa-book-open"></i> Konu Anlatımını Oku </button>
                 <button onClick={() => handleContentNavigation('quiz')} className='btn btn-primary'> <i className="fas fa-pencil-alt"></i> Soruları Çöz </button>
             </div>
          ) : currentTopics.length === 0 && currentPath.length === 0 ? (
              <p>Henüz hiç konu eklenmemiş.</p>
          ): (
              <div className="card-grid">
                {currentTopics.map(topic => ( <TopicCard key={topic.id} topic={topic} onSelectTopic={handleTopicSelect} /> ))}
              </div>
          )
      ) : (
          <div className='card' style={{textAlign: 'center'}}>
               <h3>{selectedForContent.name}</h3>
               {selectedForContent.description && <p>{selectedForContent.description}</p>}
               <p>Bu konuyla ilgili ne yapmak istersiniz?</p>
               <button onClick={() => handleContentNavigation('lecture')} className='btn btn-secondary' style={{marginRight: '10px'}}> <i className="fas fa-book-open"></i> Konu Anlatımını Oku </button>
               <button onClick={() => handleContentNavigation('quiz')} className='btn btn-primary'> <i className="fas fa-pencil-alt"></i> Soruları Çöz </button>
               <br />
               <button onClick={handleGoBack} className="btn btn-secondary" style={{marginTop: '20px', background: 'var(--bg-tertiary)'}}> &lt; Başka Konu Seç </button>
          </div>
      )}
    </main>
  );
}

export default TopicBrowserPage;