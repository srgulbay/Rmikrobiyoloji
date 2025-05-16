process.env.NODE_ENV = 'production';

// 🌟 .env.local dosyasını da yüklemek için bu satırı .env'den önce yazın:
require('dotenv').config({ path: '.env.local' });

// 🌟 İsteğe bağlı: .env dosyasını da okuyarak varsayılanları yükleyebilirsin
require('dotenv').config();

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/database');

// Rota importları
const pushSubscriptionRoutes = require('./routes/pushSubscriptionRoutes');
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');
const questionRoutes = require('./routes/questionRoutes');
const lectureRoutes = require('./routes/lectureRoutes');
const userRoutes = require('./routes/userRoutes');
const topicRoutes = require('./routes/topicRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const attemptRoutes = require('./routes/attemptRoutes');
const statsRoutes = require('./routes/statsRoutes');
const lectureViewRoutes = require('./routes/lectureViewRoutes');
const examClassificationRoutes = require('./routes/examClassificationRoutes');
const branchRoutes = require('./routes/branchRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const announcementAdminRoutes = require('./routes/announcementAdminRoutes'); // YENİ: Admin duyuru rotaları
const srsRoutes = require('./routes/srsRoutes'); // YENİ: SRS rotaları
const flashcardAdminRoutes = require('./routes/flashcardAdminRoutes'); // YENİ

dotenv.config();
const app = express();

app.use((req, res, next) => { next(); });
app.use(cors()); 
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' })); 

const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

app.get('/', (req, res) => { res.send('Rmikrobiyoloji Backend Sunucusu Çalışıyor! Güncel Sürüm.'); });

// API Rotaları
app.use('/api/srs', srsRoutes); // YENİ: SRS rotaları eklendi
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/users', userRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/lecture-views', lectureViewRoutes);
app.use('/api/exam-classifications', examClassificationRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/announcements', announcementAdminRoutes); // YENİ: Admin duyuru rotaları eklendi
app.use('/api/push', pushSubscriptionRoutes);
app.use('/api/admin/flashcards', flashcardAdminRoutes); // YENİ

app.use((req, res, next) => { 
  res.status(404).json({ message: "Üzgünüz, aradığınız kaynak bulunamadı!" }); 
});

connectDB();

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Rmikrobiyoloji Sunucusu ${PORT} portunda çalışıyor`);
});
