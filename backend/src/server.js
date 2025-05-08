process.env.NODE_ENV = 'production';

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');
const questionRoutes = require('./routes/questionRoutes');
const lectureRoutes = require('./routes/lectureRoutes');
const userRoutes = require('./routes/userRoutes');
const topicRoutes = require('./routes/topicRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const attemptRoutes = require('./routes/attemptRoutes');
const statsRoutes = require('./routes/statsRoutes');
const lectureViewRoutes = require('./routes/lectureViewRoutes'); // Yeni route import edildi

dotenv.config();
const app = express();

app.use((req, res, next) => { console.log(`>>> İstek Alındı: ${req.method} ${req.originalUrl}`); next(); });
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use((req, res, next) => { console.log(`>>> Temel Middleware Sonrası. Path: ${req.path}`); next(); }); // Bu log azaltılabilir
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => { res.send('Rmikrobiyoloji Backend Sunucusu Çalışıyor!'); });
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/users', userRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/lecture-views', lectureViewRoutes); // Yeni route eklendi

app.use((req, res, next) => { console.log(`>>> !!! Rota Bulunamadı (404): ${req.method} ${req.originalUrl}`); res.status(404).send("Üzgünüz, aradığınız sayfa bulunamadı!"); });

connectDB();

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Sunucu ${PORT} portunda çalışıyor`);
});