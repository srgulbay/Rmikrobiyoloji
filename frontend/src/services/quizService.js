import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WORDLE_QUESTIONS_URL = `${API_BASE_URL}/api/questions/wordle-practice`; // Yeni endpoint

export const fetchWordleQuestions = async (token) => {
    if (!token) {
        throw new Error("Yetkilendirme token'ı bulunamadı.");
    }
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(WORDLE_QUESTIONS_URL, config);
        return response.data || []; // Veriyi veya boş dizi döndür
    } catch (error) {
        console.error("Kelime pratiği soruları servis hatası:", error);
        // Hata objesini veya özel bir mesajı fırlatabiliriz
        throw new Error(error.response?.data?.message || 'Sorular getirilirken bir sunucu hatası oluştu.');
    }
};

// Buraya başka quiz/soru ile ilgili API servis fonksiyonları da eklenebilir
