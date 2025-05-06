import React, { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopicCard from '../components/TopicCard';
import { FaArrowLeft, FaBookOpen, FaPencilAlt, FaExclamationTriangle, FaInfoCircle, FaFolder, FaListAlt, FaRedo } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// --- Helper Fonksiyonlar (Component Dışında) ---
const findTopicAndPathById = (id, nodes, currentPath = []) => {
    for (const node of nodes) {
        const newPath = [...currentPath, { id: node.id, name: node.name }];
        if (node.id === id) {
            return { topic: node, path: newPath };
        }
        if (node.children) {
            const found = findTopicAndPathById(id, node.children, newPath);
            if (found) return found;
        }
    }
    return null;
};

const getTopicFromPath = (pathIds, tree) => {
    if (!pathIds || pathIds.length === 0) return null;
    let currentLevel = tree;
    let topic = null;
    for (const id of pathIds) {
        topic = currentLevel?.find(t => t.id === id);
        if (!topic) return null;
        currentLevel = topic.children;
    }
    return topic;
};
// --- Helper Fonksiyonlar Sonu ---

function TopicBrowserPage() {
    const [topicTree, setTopicTree] = useState([]);
    const [currentPathIds, setCurrentPathIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const backendTopicUrl = `${API_BASE_URL}/api/topics`;

    const fetchTopics = useCallback(async () => {
        setLoading(true); setError('');
        if (!token) { setError("Konuları görmek için giriş yapmalısınız."); setLoading(false); return;}
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(backendTopicUrl, config);
            setTopicTree(response.data || []);
        } catch (err) {
            console.error("Konu ağacı çekilirken hata:", err);
            const errorMsg = err.response?.data?.message || 'Konular yüklenirken bir sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [token, backendTopicUrl]);

    useEffect(() => { fetchTopics(); }, [fetchTopics]);

    const { activeTopic, currentTopics } = useMemo(() => {
        const topic = getTopicFromPath(currentPathIds, topicTree);
        const children = currentPathIds.length === 0 ? topicTree : topic?.children || [];
        return { activeTopic: topic, currentTopics: children };
    }, [currentPathIds, topicTree]);

    const handleTopicSelect = useCallback((selectedTopic) => {
        setError('');
        setCurrentPathIds(prevPath => [...prevPath, selectedTopic.id]);
    }, []);

    const handleGoBack = useCallback(() => {
        setError('');
        setCurrentPathIds(prevPath => prevPath.slice(0, -1));
    }, []);

     const breadcrumbItems = useMemo(() => {
        const items = [{ id: null, name: 'Konular', isLink: currentPathIds.length > 0 }];
        let currentLevel = topicTree;
        currentPathIds.forEach((pathId, index) => {
            const found = currentLevel?.find(t => t.id === pathId);
            if (found) {
                items.push({ id: pathId, name: found.name, isLink: index < currentPathIds.length - 1 });
                currentLevel = found.children;
            }
        });
        return items;
    }, [currentPathIds, topicTree]);

    const navigateToPath = useCallback((index) => {
        setCurrentPathIds(currentPathIds.slice(0, index));
    }, [currentPathIds]);

    // ÖNEMLİ NOT: handleContentNavigation fonksiyonu doğru topicId ile yönlendirme yapar.
    // Ancak 'lecture' tipinde yönlendirilen LectureViewPage component'inin
    // ve backend'deki /api/lectures endpoint'inin, tıpkı sorular için yapıldığı gibi,
    // gelen topicId'ye ait TÜM ALT KONULARIN derslerini de getirecek şekilde
    // güncellenmesi GEREKMEKTEDİR. Bu dosyadaki değişiklikler tek başına yeterli değildir.
    const handleContentNavigation = (type, topicId) => {
        if (!topicId) return;
        if (type === 'lecture') {
            navigate(`/lectures/topic/${topicId}`); // LectureViewPage'in tüm dersleri çekmesi lazım
        } else if (type === 'quiz') {
            navigate(`/solve?topicId=${topicId}`); // SolvePage zaten tüm soruları çekiyor
        }
    };

// --- Render Bölümü Başlangıcı ---
// --- Render Bölümü ---

    if (loading) {
        // İyileştirilmiş İskelet Yükleme Ekranı
        return (
            <div className="container py-8 animate-pulse">
                <div className="h-5 bg-[var(--bg-tertiary)] rounded w-1/2 mb-6"></div> {/* Breadcrumb Skeleton */}
                <div className="h-8 bg-[var(--bg-tertiary)] rounded w-32 mb-6"></div> {/* Back Button Skeleton */}
                <div className="h-24 bg-[var(--bg-secondary)] rounded-lg mb-8"></div> {/* Active Topic Skeleton */}
                <div className="card-grid">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-20 bg-[var(--bg-secondary)] rounded-md"></div> // Card Skeleton
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        // İyileştirilmiş Hata Ekranı
        return (
            <div className="container mt-6">
                <div className="card card-accented-error text-center py-8">
                    <FaExclamationTriangle className='mb-4 text-[3rem] text-[var(--feedback-error)] mx-auto' />
                    <h3 className='h4 mb-3 text-[var(--text-primary)]'>Bir Hata Oluştu</h3>
                    <p className="text-muted mb-5">{error}</p>
                    <button onClick={fetchTopics} className="btn btn-danger">
                        <FaRedo className='btn-icon' /> Tekrar Dene
                    </button>
                </div>
            </div>
        );
    }

    // Ana İçerik Render
    return (
        <main className="topic-browser-page container py-8">

            {/* Navigasyon Alanı (Breadcrumb ve Geri Butonu) */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb" style={{ marginBottom: 0, padding: 0 }}>
                        {breadcrumbItems.map((item, index) => {
                            const isLast = index === breadcrumbItems.length - 1;
                            return (
                                <li key={item.id || 'home'} className={`breadcrumb-item ${isLast ? 'active' : ''}`}>
                                    {!isLast && item.id !== null ? (
                                        <a href="#" onClick={(e) => { e.preventDefault(); navigateToPath(index); }}>
                                            {item.name}
                                        </a>
                                    ) : (
                                        <span aria-current={isLast ? 'page' : undefined}>
                                            {item.name}
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </nav>
                {currentPathIds.length > 0 && (
                    <button onClick={handleGoBack} className="btn btn-ghost btn-sm flex-shrink-0">
                        <FaArrowLeft className='btn-icon' />
                        Geri ({breadcrumbItems[breadcrumbItems.length - 2]?.name || 'Konular'})
                    </button>
                )}
            </div>

             {/* Aktif Konu Başlığı ve Aksiyonları */}
             {activeTopic && (
                 <div className='active-topic-section mb-8 p-6 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] shadow-sm'>
                      <div className='flex flex-wrap justify-between items-center gap-4'>
                          <div>
                                <h2 className='h2 mb-1'>{activeTopic.name}</h2>
                                {activeTopic.description && <p className='text-muted mb-0 text-sm'>{activeTopic.description}</p>}
                          </div>
                           <div className="action-buttons flex gap-3 flex-shrink-0">
                               <button
                                   onClick={() => handleContentNavigation('lecture', activeTopic.id)}
                                   className='btn btn-secondary'
                                   title={`${activeTopic.name} Konu Anlatımı (Alt konular dahil)`} // Title güncellendi
                               >
                                   <FaBookOpen className='btn-icon' />
                                   Konu Anlatımı
                               </button>
                               <button
                                    onClick={() => handleContentNavigation('quiz', activeTopic.id)}
                                    className='btn btn-primary'
                                    title={`${activeTopic.name} ve Alt Konuları İçin Soru Çöz`}
                                >
                                   <FaPencilAlt className='btn-icon' />
                                   Soruları Çöz
                               </button>
                           </div>
                      </div>
                 </div>
             )}


            {/* Alt Konular veya Boş Durum Mesajı */}
            {currentTopics.length > 0 ? (
                <>
                     {activeTopic && <h3 className="h4 mb-4 text-[var(--text-secondary)]">Alt Konular</h3>}
                     <div className="card-grid">
                         {currentTopics.map(topic => (
                             <TopicCard
                                 key={topic.id}
                                 topic={topic}
                                 onSelectTopic={handleTopicSelect}
                                 className="card-interactive"
                             />
                         ))}
                     </div>
                 </>
            ) : (
                 !loading && (
                    currentPathIds.length > 0 ? (
                        <div className="text-center text-muted py-5 italic">
                            Bu konuda başka alt başlık bulunmuyor.
                        </div>
                    ) : (
                        <div className="card text-center py-8">
                            <FaFolder className='mb-4 text-4xl text-[var(--text-muted)] mx-auto' />
                            <h3 className="h4 mb-3">Henüz Konu Eklenmemiş</h3>
                            <p className="text-muted">İçeriklere göz atmak için lütfen Yönetim Panelinden konuları ekleyin.</p>
                       </div>
                   )
                 )
            )}
        </main>
    );
} // TopicBrowserPage Sonu

export default TopicBrowserPage;
