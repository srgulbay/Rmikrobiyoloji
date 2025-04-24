import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Zayıf konu belirleme eşikleri
const WEAK_TOPIC_ACCURACY_THRESHOLD = 65; // Başarı %65'in altındaysa
const WEAK_TOPIC_MIN_ATTEMPTS = 5;      // En az 5 deneme yapılmışsa

function MyStatsPage() {
  const [summaryStats, setSummaryStats] = useState(null); // Özet state
  const [detailedStats, setDetailedStats] = useState([]); // Detaylı state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, user } = useAuth();

  const backendSummaryUrl = 'http://localhost:3001/api/stats/my-summary';
  const backendDetailedUrl = 'http://localhost:3001/api/stats/my-detailed';

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
      // Detaylı istatistikleri başarı oranına göre (düşükten yükseğe) sıralayalım
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

  // Zayıf konuları belirle (useMemo ile gereksiz hesaplamayı önle)
  const weakTopics = useMemo(() => {
      return detailedStats.filter(stat =>
          stat.accuracy < WEAK_TOPIC_ACCURACY_THRESHOLD &&
          stat.totalAttempts >= WEAK_TOPIC_MIN_ATTEMPTS
      );
  }, [detailedStats]);


  if (loading) return <p>İstatistikler yükleniyor...</p>;
  if (error) return <p style={{ color: 'red' }}>Hata: {error}</p>;

  return (
    <div>
      <h2>İstatistiklerim ({user?.username})</h2>

      {/* Özet İstatistikler */}
      {summaryStats && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #eee' }}>
           <h3>Özet</h3>
           <ul>
             <li>Toplam Çözülen Soru: {summaryStats.totalAttempts}</li>
             <li>Doğru Cevap Sayısı: {summaryStats.correctAttempts}</li>
             <li>Genel Başarı Oranı: %{summaryStats.accuracy}</li>
           </ul>
        </div>
      )}

      <hr />

      {/* Detaylı İstatistikler */}
      <h3>Konu Bazlı Başarı</h3>
      {detailedStats.length === 0 ? (
         <p>Henüz konu bazlı istatistik oluşturacak kadar soru çözülmedi.</p>
      ) : (
         <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
               <tr>
                  <th>Konu</th>
                  <th>Toplam Deneme</th>
                  <th>Doğru Sayısı</th>
                  <th>Başarı Oranı (%)</th>
               </tr>
            </thead>
            <tbody>
               {detailedStats.map(topicStat => {
                   const isWeak = weakTopics.some(wt => wt.topicId === topicStat.topicId);
                   return (
                       <tr key={topicStat.topicId} style={{ backgroundColor: isWeak ? 'rgba(255, 0, 0, 0.1)' : 'inherit' }}>
                         <td>{topicStat.topicName}</td>
                         <td>{topicStat.totalAttempts}</td>
                         <td>{topicStat.correctAttempts}</td>
                         <td style={{ fontWeight: isWeak ? 'bold' : 'normal' }}>{topicStat.accuracy}%</td>
                      </tr>
                   );
               })}
            </tbody>
         </table>
      )}

{/* Zayıf Konular Listesi */}
{weakTopics.length > 0 && (
         <div style={{ marginTop: '20px', padding: '10px', border: '1px solid red', backgroundColor: 'rgba(255,0,0,0.05)' }}>
            {/* Düzeltilmiş H4 Satırı */}
            <h4>Tekrar Etmeniz Önerilen Konular (Başarı %{WEAK_TOPIC_ACCURACY_THRESHOLD} altında ve en az {WEAK_TOPIC_MIN_ATTEMPTS} deneme)</h4>
            <ul>
               {weakTopics.map(wt => (
                   <li key={wt.topicId}>{wt.topicName} (%{wt.accuracy})</li>
               ))}
            </ul>
         </div>
      )}

    </div>
  );
}

export default MyStatsPage;