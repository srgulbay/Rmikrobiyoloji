import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WORDLE_QUESTIONS_URL = `${API_BASE_URL}/api/questions/wordle-practice`; // Yeni endpoint

export const fetchWordleQuestions = async (token) => {
    if (!token) {
        // Token yoksa hata fırlatmak, çağıran yerde yönetilmesini sağlar
        throw new Error("Yetkilendirme token'ı bulunamadı.");
    }
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(WORDLE_QUESTIONS_URL, config);
        // API'den gelen verinin her zaman dizi olmasını beklemek daha güvenli
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error("Kelime pratiği soruları servis hatası:", error);
        // Daha açıklayıcı bir hata mesajı fırlat
        const message = error.response?.data?.message || 'Sorular getirilirken bir sunucu hatası oluştu.';
        throw new Error(message);
    }
};

// Buraya başka quiz/soru ile ilgili API servis fonksiyonları da eklenebilir
// Örneğin:
// export const fetchStandardQuestions = async (token, topicId = null) => { ... }
// export const submitAttempt = async (token, attemptData) => { ... }