import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Token için

// Uzmanlık alanları listesi (RegisterPage'deki ile aynı olabilir)
const specializations = [
    "YDUS", "TUS", "DUS", "Tıp Fakültesi Dersleri", "Diş Hekimliği Fakültesi Dersleri", "Diğer"
];


function AdminStatsOverview() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSpec, setSelectedSpec] = useState(''); // Filtre için state ('', 'TUS', 'DUS' vb.)
    const { token } = useAuth(); // Admin token'ı

    const backendUrl = 'http://localhost:3001/api/stats/admin/overview';

    // İstatistikleri filtreye göre çeken fonksiyon
    const fetchOverviewStats = useCallback(async (filter = '') => {
        setLoading(true);
        setError('');
        if (!token) {
            setError("Yetkilendirme token'ı bulunamadı.");
            setLoading(false);
            return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            let url = backendUrl;
            if (filter) {
                // URL'ye query parametresi ekle (?specialization=TUS)
                url += `?specialization=${encodeURIComponent(filter)}`;
            }
            console.log("Fetching stats from:", url); // İstek atılan URL'yi logla
            const response = await axios.get(url, config);
            setStats(response.data);
        } catch (err) {
            console.error("Genel bakış istatistiklerini çekerken hata:", err);
            setError(err.response?.data?.message || 'Genel bakış istatistikleri yüklenirken bir hata oluştu.');
            setStats(null);
        } finally {
            setLoading(false);
        }
    }, [token, backendUrl]);

    // İlk yüklemede ve filtre değiştiğinde istatistikleri çek
    useEffect(() => {
        fetchOverviewStats(selectedSpec);
    }, [fetchOverviewStats, selectedSpec]); // selectedSpec değişince tekrar fetch et

    // Filtre dropdown'ı değiştiğinde
    const handleFilterChange = (event) => {
        setSelectedSpec(event.target.value);
    };


    if (loading) return <p>Genel İstatistikler yükleniyor...</p>;

    return (
        <div>
            <h3>Genel Bakış İstatistikleri</h3>
            {error && <p style={{ color: 'red' }}>Hata: {error}</p>}

            {/* Filtreleme Alanı */}
            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="spec-filter">Uzmanlık Alanına Göre Filtrele: </label>
                <select id="spec-filter" value={selectedSpec} onChange={handleFilterChange}>
                    <option value="">Tümü</option>
                    {specializations.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                    ))}
                </select>
            </div>

            {/* İstatistik Sonuçları */}
            {stats ? (
                <div>
                    <p><strong>Filtre:</strong> {stats.filter}</p>
                    <p><strong>Filtreye Uyan Kullanıcı Sayısı:</strong> {stats.userCount}</p>
                    <p><strong>Toplam Soru Çözme Denemesi (Filtre):</strong> {stats.totalAttempts}</p>
                    <p><strong>Toplam Doğru Cevap Sayısı (Filtre):</strong> {stats.correctAttempts}</p>
                    <p><strong>Genel Başarı Oranı (Filtre):</strong> %{stats.accuracy}</p>
                </div>
            ) : (
                 !loading && <p>İstatistik verisi bulunamadı.</p>
            )}
        </div>
    );
}

export default AdminStatsOverview; // Component'i export etmeyi unutma