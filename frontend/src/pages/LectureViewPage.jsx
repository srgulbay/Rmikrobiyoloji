import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaExclamationTriangle, FaInfoCircle, FaRedo } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function LectureViewPage() {
    const { topicId } = useParams();
    const [lectures, setLectures] = useState([]);
    const [topicName, setTopicName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();
    const navigate = useNavigate();

    const backendLectureUrl = `${API_BASE_URL}/api/lectures`;
    const backendTopicUrl = `${API_BASE_URL}/api/topics`;

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        setLectures([]);
        setTopicName('');

        if (!token) {
            setError("İçeriği görmek için giriş yapmalısınız.");
            setLoading(false);
            return;
        }
        if (!topicId) {
            setError("Geçerli bir konu ID'si bulunamadı.");
            setLoading(false);
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Backend'in topicId parametresi ile hem o konuyu hem de alt konuları
            // getirecek şekilde güncellendiğini varsayıyoruz.
            // Bu yüzden ekstra bir includeSubtopics parametresine gerek yok.
            const lectureApiUrl = `${backendLectureUrl}?topicId=${topicId}`;
            console.log("Fetching lectures for topic (and descendants):", lectureApiUrl);

            const topicApiUrl = `${backendTopicUrl}/${topicId}`;

            const [lecturesRes, topicRes] = await Promise.all([
                axios.get(lectureApiUrl, config),
                axios.get(topicApiUrl, config) // Konu adını almak için
            ]);

            setLectures(lecturesRes.data || []);
            setTopicName(topicRes.data?.name || `Konu ID: ${topicId}`);

            if (!lecturesRes.data || lecturesRes.data.length === 0) {
                console.log("Bu konu ve alt konuları için konu anlatımı bulunamadı.");
            }

        } catch (err) {
            console.error("Konu anlatımı veya konu bilgisi çekilirken hata:", err);
            const errorMsg = err.response?.data?.message || 'İçerik yüklenirken bir hata oluştu.';
            setError(errorMsg);
            setTopicName(`Konu ID: ${topicId}`);
        } finally {
            setLoading(false);
        }
    }, [topicId, token, backendLectureUrl, backendTopicUrl]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
             <div className="container py-8 animate-pulse">
                 <div className="h-5 bg-[var(--bg-tertiary)] rounded w-1/4 mb-4"></div>
                 <div className="h-8 bg-[var(--bg-tertiary)] rounded w-1/2 mb-8"></div>
                 <div className="space-y-6">
                     <div className="h-48 bg-[var(--bg-secondary)] rounded-lg"></div>
                     <div className="h-48 bg-[var(--bg-secondary)] rounded-lg"></div>
                 </div>
            </div>
        );
    }

    return (
        <div className="container py-8">
            <Link to="/browse" className="btn btn-link mb-6 inline-flex items-center">
                <FaArrowLeft className="mr-2" /> Konulara Geri Dön
            </Link>

            <h1 className="h2 mb-8">{topicName} - Konu Anlatımları</h1>

            {error && (
                <div className="alert alert-danger mb-6" role="alert">
                    <FaExclamationTriangle className='alert-icon' />
                    <div className="alert-content">
                        <p className='font-semibold'>Hata!</p>
                        <p>{error}</p>
                         <button onClick={fetchData} className="btn btn-danger btn-sm mt-3">
                             <FaRedo className='btn-icon'/> Tekrar Dene
                         </button>
                    </div>
                </div>
            )}

            <div className="lecture-list">
                {!loading && lectures.length === 0 && !error && (
                    <div className="alert alert-info text-center" role="alert">
                        <FaInfoCircle className='alert-icon mb-2 mx-auto text-2xl' />
                        <div className="alert-content">Bu konu başlığı (ve alt başlıkları) için henüz konu anlatımı eklenmemiş.</div>
                    </div>
                )}

                {lectures.map((lecture) => (
                    <article key={lecture.id} className="lecture-item card mb-6 shadow-md hover:shadow-lg transition-shadow duration-300">
                        <div className='card-body'>
                            <h3 className="h4 mb-4 font-semibold">{lecture.title}</h3>
                             {/* Görsel */}
                            {lecture.imageUrl && (
                                <img
                                    src={lecture.imageUrl}
                                    alt={`${lecture.title} için görsel`}
                                    className="lecture-image max-w-xl mx-auto my-5 rounded-md shadow-sm" // Boyut ve stil ayarı
                                    loading="lazy"
                                />
                            )}
                            {/* İçerik */}
                             {/* Tailwind Prose sınıfı metin stilleri için kullanışlı olabilir */}
                            <div
                                className="lecture-content prose dark:prose-invert max-w-none prose-sm sm:prose-base lg:prose-lg xl:prose-xl"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lecture.content) }}
                            />
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}

export default LectureViewPage;
