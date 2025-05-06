import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Token için
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
// Uzmanlık alanları listesi (RegisterPage'deki ile aynı olabilir)
const specializations = [
    "YDUS", "TUS", "DUS", "Tıp Fakültesi Dersleri", "Diş Hekimliği Fakültesi Dersleri", "Diğer"
];


function AdminStatsOverview() {
    const [overviewStats, setOverviewStats] = useState(null); // Genel özet için
    const [userSummaries, setUserSummaries] = useState([]); // Kullanıcı listesi için
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSpec, setSelectedSpec] = useState('');
    const { token } = useAuth();

    const backendOverviewUrl = `${API_BASE_URL}/api/stats/admin/overview`;
    const backendUserSummariesUrl = `${API_BASE_URL}/api/stats/admin/user-summaries`; // Yeni endpoint

    // Hem genel özeti hem de kullanıcı listesini çeken fonksiyon
    const fetchStats = useCallback(async (filter = '') => {
        setLoading(true);
        setError('');
        setUserSummaries([]); // Önceki listeyi temizle
        setOverviewStats(null); // Önceki özeti temizle

        if (!token) { setError("Yetkilendirme token'ı bulunamadı."); setLoading(false); return; }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            let overviewUrl = backendOverviewUrl;
            let userSummariesUrl = backendUserSummariesUrl;

            if (filter) {
                const queryParam = `?specialization=${encodeURIComponent(filter)}`;
                overviewUrl += queryParam;
                userSummariesUrl += queryParam;
            }

            console.log("Fetching Overview Stats from:", overviewUrl);
            console.log("Fetching User Summaries from:", userSummariesUrl);

            // İki isteği aynı anda atalım
            const [overviewRes, summariesRes] = await Promise.all([
                axios.get(overviewUrl, config),
                axios.get(userSummariesUrl, config)
            ]);

            setOverviewStats(overviewRes.data);
            setUserSummaries(summariesRes.data || []); // Dizi gelmezse boş dizi ata

        } catch (err) {
            console.error("İstatistikleri çekerken hata:", err);
            const errorMsg = err.response?.data?.message || 'İstatistikler yüklenirken bir hata oluştu.';
            setError(errorMsg);
            setOverviewStats(null);
            setUserSummaries([]);
        } finally {
            setLoading(false);
        }
    }, [token, backendOverviewUrl, backendUserSummariesUrl]); // URL'leri bağımlılıklara ekle

    useEffect(() => {
        fetchStats(selectedSpec);
    }, [fetchStats, selectedSpec]);

    const handleFilterChange = (event) => {
        setSelectedSpec(event.target.value);
    };

    if (loading) return <p>Genel İstatistikler yükleniyor...</p>;

    return (

         // Ana div'e stil ekleyelim
         <div className="admin-section" style={{ padding: '15px', border: '1px solid var(--border-secondary)', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--bg-secondary)', marginBottom:'var(--space-l)' }}>
            <h3>Genel Bakış ve Kullanıcı Performansları</h3>
            {error && <p style={{ color: 'red' }}>Hata: {error}</p>}

            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="spec-filter">Uzmanlık Alanına Göre Filtrele: </label>
                <select id="spec-filter" value={selectedSpec} onChange={handleFilterChange}>
                    <option value="">Tümü</option>
                    {specializations.map(spec => ( <option key={spec} value={spec}>{spec}</option> ))}
                </select>
            </div>

            {/* Genel İstatistik Özeti */}
            {overviewStats && (
                <div style={{ marginBottom:'20px', paddingBottom:'15px', borderBottom:'1px solid var(--border-primary)'}}>
                    <h4>Genel Özet ({overviewStats.filter})</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                        <div style={{padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)'}}><strong>Kullanıcı Sayısı:</strong> {overviewStats.userCount}</div>
                        <div style={{padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)'}}><strong>Toplam Deneme:</strong> {overviewStats.totalAttempts}</div>
                        <div style={{padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)'}}><strong>Doğru Sayısı:</strong> {overviewStats.correctAttempts}</div>
                        <div style={{padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)'}}><strong>Başarı Oranı:</strong> %{overviewStats.accuracy}</div>
                    </div>
                </div>
            )}

            {/* Kullanıcı Performans Listesi */}
            <h4>Kullanıcı Performansları ({selectedSpec || 'Tümü'})</h4>
            {userSummaries.length === 0 && !loading ? (
                 <p>Filtreye uygun kullanıcı veya deneme bulunamadı.</p>
            ) : (
                <div style={{overflowX:'auto'}}>
                    <table border="1" style={{ width: '100%', borderCollapse: 'collapse', minWidth:'500px' }}>
                        <thead>
                            <tr>
                                <th>Kullanıcı Adı</th>
                                <th>Toplam Deneme</th>
                                <th>Doğru Sayısı</th>
                                <th>Başarı Oranı (%)</th>
                                {/* İleride buraya detay linki eklenebilir */}
                            </tr>
                        </thead>
                        <tbody>
                            {userSummaries.map(userStat => (
                                <tr key={userStat.userId}>
                                    <td>{userStat.username} (ID: {userStat.userId})</td>
                                    <td>{userStat.totalAttempts}</td>
                                    <td>{userStat.correctAttempts}</td>
                                    <td>{userStat.accuracy}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AdminStatsOverview;
