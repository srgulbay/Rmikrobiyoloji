import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
// İkonları import edelim
import { FaChartBar, FaExclamationTriangle, FaInfoCircle, FaListAlt, FaRedo, FaExclamationCircle } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Zayıf konu belirleme eşikleri
const WEAK_TOPIC_ACCURACY_THRESHOLD = 65;
const WEAK_TOPIC_MIN_ATTEMPTS = 5;

function MyStatsPage() {
    const [summaryStats, setSummaryStats] = useState(null);
    const [detailedStats, setDetailedStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token, user } = useAuth();

    const backendSummaryUrl  = `${API_BASE_URL}/api/stats/my-summary`;
    const backendDetailedUrl = `${API_BASE_URL}/api/stats/my-detailed`;

    // --- Fonksiyonlar (Değişiklik Yok) ---
    const fetchMyStats = useCallback(async () => {
        setLoading(true); setError('');
        if (!token) { setError("Giriş yapmadığınız için istatistikler getirilemedi."); setLoading(false); return; }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [summaryRes, detailedRes] = await Promise.all([
                axios.get(backendSummaryUrl, config),
                axios.get(backendDetailedUrl, config)
            ]);
            setSummaryStats(summaryRes.data);
            const sortedDetailedStats = Array.isArray(detailedRes.data)
               ? detailedRes.data.sort((a, b) => a.accuracy - b.accuracy)
               : [];
            setDetailedStats(sortedDetailedStats);
        } catch (err) {
            console.error("İstatistikleri çekerken hata:", err);
            setError(err.response?.data?.message || 'İstatistikler yüklenirken bir hata oluştu.');
            setSummaryStats(null); setDetailedStats([]);
        } finally { setLoading(false); }
    }, [token, backendSummaryUrl, backendDetailedUrl]);

    useEffect(() => { fetchMyStats(); }, [fetchMyStats]);

    const weakTopics = useMemo(() => {
        return detailedStats.filter(stat =>
            stat.accuracy < WEAK_TOPIC_ACCURACY_THRESHOLD &&
            stat.totalAttempts >= WEAK_TOPIC_MIN_ATTEMPTS
        );
    }, [detailedStats]);
    // --- Fonksiyonlar Sonu ---


    // --- Render Bölümü ---
    if (loading) {
        // İstatistik sayfası için skeleton
        return (
            <div className="container py-8">
                <div className="skeleton skeleton-title skeleton-animated w-1/3 mx-auto mb-8"></div>
                {/* Summary Skeleton */}
                <div className="card skeleton-animated mb-8" style={{ padding: 'var(--space-6)' }}>
                    <div className="skeleton skeleton-text skeleton-animated mx-auto mb-4" style={{width: '40%', height:'1.2rem'}}></div>
                    <div className="d-grid gap-4" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))'}}>
                         <div className="skeleton skeleton-animated" style={{height: '60px', borderRadius: 'var(--border-radius-md)'}}></div>
                         <div className="skeleton skeleton-animated" style={{height: '60px', borderRadius: 'var(--border-radius-md)'}}></div>
                         <div className="skeleton skeleton-animated" style={{height: '60px', borderRadius: 'var(--border-radius-md)'}}></div>
                    </div>
                </div>
                 {/* Table Skeleton */}
                 <div className="skeleton skeleton-text skeleton-animated mb-4" style={{width: '50%', height:'1.2rem'}}></div>
                 <div className="skeleton skeleton-animated" style={{ height: '200px', borderRadius: 'var(--border-radius-md)' }}></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-6">
                <div className="alert alert-danger" role="alert">
                    <FaExclamationTriangle className='alert-icon' />
                    <div className="alert-content">{error}</div>
                </div>
                <button onClick={fetchMyStats} className="btn btn-secondary mt-4">
                    <FaRedo className='btn-icon'/> Tekrar Dene
                 </button>
            </div>
        );
    }

    // Veri yoksa gösterilecek mesaj
     if (!summaryStats && detailedStats.length === 0) {
         return (
             <div className="container mt-6">
                 <div className="alert alert-info text-center" role="alert">
                     <FaInfoCircle className='alert-icon' />
                     <div className="alert-content">Henüz görüntülenecek istatistik verisi bulunmuyor. Biraz soru çözmeye ne dersin?</div>
                     {/* Soru çözme sayfasına link */}
                     {/* <Link to="/solve" className="btn btn-primary mt-4">Soru Çözmeye Başla</Link> */}
                 </div>
             </div>
         );
     }

    return (
        // Ana container ve dikey boşluk
        <div className="my-stats-page container py-8">
            {/* Sayfa Başlığı */}
            <h1 className="text-center mb-8">İstatistiklerim ({user?.username})</h1>

            {/* Özet İstatistikler */}
            {summaryStats && (
                // Daha önce admin panelinde kullandığımız yapıya benzer
                <div className="stats-summary-section card mb-8">
                    <h3 className='d-flex align-center justify-center gap-3'>
                        <FaChartBar /> Özet İstatistikler
                    </h3>
                    {/* Grid yapısı */}
                    <div className="stats-summary-grid">
                        <div className="summary-box">
                            <strong>Toplam Çözülen Soru</strong>
                            <span className="stat-value">{summaryStats.totalAttempts}</span>
                        </div>
                        <div className="summary-box">
                            <strong>Doğru Cevap Sayısı</strong>
                            <span className="stat-value text-success">{summaryStats.correctAttempts}</span>
                        </div>
                        <div className="summary-box">
                             <strong>Genel Başarı Oranı</strong>
                             {/* Başarı oranına göre renk */}
                             <span className={`stat-value ${summaryStats.accuracy >= 80 ? 'text-success' : summaryStats.accuracy >= 50 ? 'text-warning' : 'text-danger'}`}>
                                 %{summaryStats.accuracy}
                             </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Ayırıcı yerine boşluk bırakmak yeterli */}

            {/* Detaylı İstatistikler */}
            <div className='detailed-stats-section mb-8'>
                <h3 className='mb-4 d-flex align-center gap-3'>
                    <FaListAlt /> Konu Bazlı Başarı
                </h3>
                {detailedStats.length === 0 ? (
                    <div className="alert alert-info">
                        <FaInfoCircle className='alert-icon'/>
                        <div className="alert-content">Henüz konu bazlı istatistik oluşturacak kadar soru çözülmedi.</div>
                    </div>
                ) : (
                    // Stilize edilmiş tabloyu kullan
                    <div className="table-container">
                        <table className="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>Konu</th>
                                    <th className='text-center'>Toplam Deneme</th>
                                    <th className='text-center'>Doğru Sayısı</th>
                                    <th className='text-center'>Başarı Oranı (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detailedStats.map(topicStat => {
                                    const isWeak = weakTopics.some(wt => wt.topicId === topicStat.topicId);
                                    // Satıra .is-weak sınıfını ekle
                                    return (
                                        <tr key={topicStat.topicId} className={isWeak ? 'is-weak' : ''}>
                                            <td>{topicStat.topicName}</td>
                                            <td className='text-center'>{topicStat.totalAttempts}</td>
                                            <td className='text-center'>{topicStat.correctAttempts}</td>
                                            {/* Başarı oranını ve isWeak durumunu göster */}
                                            <td className={`text-center font-semibold ${isWeak ? 'text-danger' : topicStat.accuracy >= 80 ? 'text-success' : topicStat.accuracy >= 50 ? 'text-warning' : ''}`}>
                                                 {topicStat.accuracy}%
                                                 {isWeak && <FaExclamationCircle className="ml-2" title="Zayıf Konu"/>}
                                             </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Zayıf Konular Listesi */}
            {weakTopics.length > 0 && (
                // Özel alert sınıfını kullan veya alert-warning/danger
                <div className="weak-topics-alert alert alert-warning">
                    <h4 className='alert-title d-flex align-center gap-2'>
                        <FaExclamationTriangle /> Tekrar Etmeniz Önerilen Konular
                    </h4>
                    <div className="alert-content">
                         <p className='text-sm text-muted mb-3'>
                              (Başarı %{WEAK_TOPIC_ACCURACY_THRESHOLD} altında ve en az {WEAK_TOPIC_MIN_ATTEMPTS} deneme)
                         </p>
                        <ul className='list-disc pl-5'> {/* Madde işaretli liste */}
                            {weakTopics.map(wt => (
                                <li key={wt.topicId} className="mb-1">
                                    {wt.topicName}
                                    <span className='text-sm text-muted ml-2'>%{wt.accuracy}</span>
                                    {/* Opsiyonel: Bu konuya ait sorulara gitme linki */}
                                    {/* <Link to={`/solve?topicId=${wt.topicId}`} className="btn btn-link btn-xs ml-3">Pratik Yap</Link> */}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyStatsPage;
