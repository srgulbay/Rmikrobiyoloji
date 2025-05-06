const { QuestionAttempt, Question, Topic, User, WordleScore, sequelize } = require('../../models');
const { Op, fn, col, literal } = require("sequelize");

const getMyStatsSummary = async (req, res) => {
  const userId = req.user.id;
  try {
    const totalAttempts = await QuestionAttempt.count({ where: { userId: userId } });
    const correctAttempts = await QuestionAttempt.count({ where: { userId: userId, isCorrect: true } });
    const accuracy = totalAttempts > 0 ? ((correctAttempts / totalAttempts) * 100).toFixed(2) : 0;
    res.status(200).json({ totalAttempts, correctAttempts, accuracy: parseFloat(accuracy) });
  } catch (error) {
    console.error('Kullanıcı özet istatistikleri getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Özet istatistikler getirilemedi.' });
  }
};

const calculateDetailedStatsForUser = async (userId) => {
    const attempts = await QuestionAttempt.findAll({
        where: { userId: userId },
        include: [{
            model: Question,
            as: 'Question',
            attributes: ['id', 'topicId'],
            include: [{
                model: Topic,
                as: 'topic',
                attributes: ['id', 'name', 'parentId']
            }]
        }],
        attributes: ['isCorrect', 'id'],
        raw: true,
        nest: true,
    });
    const statsByTopic = {};
    const allTopics = {};
    const topics = await Topic.findAll({ attributes: ['id', 'name', 'parentId'], raw: true });
    topics.forEach(t => { allTopics[t.id] = { name: t.name, parentId: t.parentId }; });
    const getFullTopicName = (topicId) => {
        if (!allTopics[topicId]) return 'Bilinmeyen Konu';
        return allTopics[topicId].name;
    };
    attempts.forEach(attempt => {
        const topicInfo = attempt.Question?.topic;
        if (!topicInfo || !topicInfo.id) { return; }
        const topicId = topicInfo.id;
        const fullTopicName = getFullTopicName(topicId);
        if (!statsByTopic[topicId]) {
            statsByTopic[topicId] = { topicId: topicId, topicName: fullTopicName, totalAttempts: 0, correctAttempts: 0, };
        }
        statsByTopic[topicId].totalAttempts += 1;
        if (attempt.isCorrect) { statsByTopic[topicId].correctAttempts += 1; }
    });
    const result = Object.values(statsByTopic).map(topicStat => {
        const accuracy = topicStat.totalAttempts > 0 ? ((topicStat.correctAttempts / topicStat.totalAttempts) * 100).toFixed(2) : 0;
        return { ...topicStat, accuracy: parseFloat(accuracy) };
    });
    return result;
};

const getMyDetailedStats = async (req, res) => {
    const userId = req.user.id;
    try {
        const detailedStats = await calculateDetailedStatsForUser(userId);
        res.status(200).json(detailedStats);
    } catch (error) {
        console.error(`Kullanıcı ID ${userId} için detaylı istatistikler getirilirken hata:`, error);
        res.status(500).json({ message: 'Sunucu hatası. Detaylı istatistikler getirilemedi.' });
    }
};

const getUserDetailedStatsForAdmin = async (req, res) => {
    const userId = req.params.userId;
     try {
         const userExists = await User.findByPk(userId);
         if (!userExists) { return res.status(404).json({ message: 'Kullanıcı bulunamadı.' }); }
         const detailedStats = await calculateDetailedStatsForUser(userId);
         res.status(200).json(detailedStats);
     } catch (error) {
         console.error(`Admin tarafından Kullanıcı ID ${userId} için detaylı istatistikler getirilirken hata:`, error);
         res.status(500).json({ message: 'Sunucu hatası. Kullanıcı istatistikleri getirilemedi.' });
     }
};

const getAdminOverviewStats = async (req, res) => {
    const { specialization } = req.query;
    try {
        const whereClause = {}; const attemptWhereClause = {};
        if (specialization) { whereClause.specialization = specialization; }
        const users = await User.findAll({ where: whereClause, attributes: ['id'], raw: true });
        const userIds = users.map(u => u.id);
        if (userIds.length === 0 && specialization) { return res.status(200).json({ totalAttempts: 0, correctAttempts: 0, accuracy: 0, userCount: 0, filter: specialization }); }
        if (specialization) { attemptWhereClause.userId = { [Op.in]: userIds }; }
        const totalAttempts = await QuestionAttempt.count({ where: attemptWhereClause });
        const correctAttempts = await QuestionAttempt.count({ where: { ...attemptWhereClause, isCorrect: true } });
        const accuracy = totalAttempts > 0 ? ((correctAttempts / totalAttempts) * 100).toFixed(2) : 0;
        res.status(200).json({ totalAttempts, correctAttempts, accuracy: parseFloat(accuracy), userCount: userIds.length, filter: specialization || 'Tümü' });
    } catch (error) {
         console.error('Admin genel bakış istatistikleri getirilirken hata:', error);
         res.status(500).json({ message: 'Sunucu hatası. Genel bakış istatistikleri getirilemedi.' });
    }
};

const getQuestionStats = async (req, res) => {
    try {
        const stats = await QuestionAttempt.findAll({
            attributes: [ 'questionId', [fn('COUNT', col('id')), 'totalAttempts'], [fn('SUM', literal("CASE WHEN \"isCorrect\" = true THEN 1 ELSE 0 END")), 'correctAttempts'] ],
            group: ['questionId'], raw: true
        });
        const statsMap = {};
        stats.forEach(stat => {
            const total = parseInt(stat.totalAttempts, 10); const correct = parseInt(stat.correctAttempts, 10);
            const accuracy = total > 0 ? parseFloat(((correct / total) * 100).toFixed(2)) : 0;
            statsMap[stat.questionId] = { totalAttempts: total, correctAttempts: correct, accuracy: accuracy };
        });
        res.status(200).json(statsMap);
    } catch (error) {
        console.error('Soru istatistikleri getirilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası. Soru istatistikleri getirilemedi.' });
    }
};
const getAdminUserSummaries = async (req, res) => {
    const { specialization } = req.query;
    try {
        const userWhereClause = {};
        if (specialization) {
            userWhereClause.specialization = specialization;
        }

        // İlgili kullanıcıları ve deneme sayılarını alalım
        const usersWithStats = await User.findAll({
            where: userWhereClause,
            attributes: [
                'id',
                'username',
                // Toplam deneme sayısı
                [fn('COUNT', col('QuestionAttempts.id')), 'totalAttempts'],
                // Toplam doğru sayısı (SUM CASE ile)
                [fn('SUM', literal("CASE WHEN \"QuestionAttempts\".\"isCorrect\" = true THEN 1 ELSE 0 END")), 'correctAttempts']
            ],
            include: [{
                model: QuestionAttempt,
                attributes: [], // Sadece join için, ayrı attribute getirme
                required: false // Henüz denemesi olmayan kullanıcılar da gelsin (LEFT JOIN)
            }],
            group: ['User.id', 'User.username'], // Kullanıcıya göre grupla
            order: [['username', 'ASC']], // İsime göre sırala
            raw: true, // Ham veri daha kolay işlenir
            // subQuery: false // Bazen GROUP BY ile include'da gerekir ama burada basit COUNT/SUM için gerekmeyebilir
        });

        // Başarı oranını hesapla ve formatla
        const results = usersWithStats.map(user => {
            const total = parseInt(user.totalAttempts || 0, 10);
            const correct = parseInt(user.correctAttempts || 0, 10);
            const accuracy = total > 0 ? parseFloat(((correct / total) * 100).toFixed(2)) : 0;
            return {
                userId: user.id,
                username: user.username,
                totalAttempts: total,
                correctAttempts: correct,
                accuracy: accuracy
            };
        });

        res.status(200).json(results);

    } catch (error) {
        console.error('Admin kullanıcı özetleri getirilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası. Kullanıcı özetleri getirilemedi.' });
    }
};
// --- YENİ FONKSİYON SONU ---
// Wordle oyun skorunu kaydet
const recordWordleScore = async (req, res) => {
    const { score } = req.body;
    const userId = req.user.id; // Middleware'den gelen kullanıcı ID'si

    // Basit doğrulama
    if (score === undefined || typeof score !== 'number' || score < 0) {
        return res.status(400).json({ message: 'Geçersiz skor değeri.' });
    }

    try {
        const newScore = await WordleScore.create({
            userId: userId,
            score: Math.round(score) // Tam sayıya yuvarla
        });
        res.status(201).json({ message: 'Skor başarıyla kaydedildi.', score: newScore });
    } catch (error) {
        console.error("Wordle skoru kaydedilirken hata:", error);
        res.status(500).json({ message: "Skor kaydedilirken sunucu hatası oluştu." });
    }
};

const getWordleLeaderboard = async (req, res) => {
    try {
        // Top 10 skoru al, kullanıcı adlarını join et
        const topScores = await WordleScore.findAll({
            limit: 10,
            order: [['score', 'DESC']], // Puana göre büyükten küçüğe sırala
            attributes: [
                'userId',
                'score',
                'createdAt' // Skurun ne zaman yapıldığını da alabiliriz
                // Eğer her kullanıcının *en yüksek* skorunu istiyorsak daha karmaşık bir sorgu gerekir
                // Örneğin: SELECT userId, MAX(score) as maxScore FROM WordleScores GROUP BY userId ORDER BY maxScore DESC LIMIT 10
                // Bu Sequelize ile subquery veya group/max ile yapılabilir:
                // attributes: ['userId', [sequelize.fn('MAX', sequelize.col('score')), 'maxScore']],
                // group: ['userId', 'user.id'], // User join edildiğinde group'a eklemek gerekir
                // order: [[sequelize.fn('MAX', sequelize.col('score')), 'DESC']],
            ],
            include: [{
                model: User,
                as: 'user', // Modeldeki ilişki adı
                attributes: ['username'] // Sadece kullanıcı adını al
            }],
        });

         // raw:true ve nest:true bazen include ile sorun çıkarabilir, alternatif:
         /*
         const topScores = await WordleScore.findAll({
             limit: 10,
             order: [['score', 'DESC']],
             attributes: ['userId', 'score', 'createdAt'],
             include: [{ model: User, as: 'user', attributes: ['username'] }]
         });
         // Gelen veriyi manuel olarak formatla (opsiyonel)
         const formattedScores = topScores.map(s => ({
             userId: s.userId,
             score: s.score,
             createdAt: s.createdAt,
             username: s.user?.username // user objesi içinden al
         }));
         */

        res.status(200).json(topScores); // Veya formattedScores
    } catch (error) {
        console.error("Lider tablosu getirilirken hata:", error);
        res.status(500).json({ message: "Lider tablosu getirilirken bir sunucu hatası oluştu." });
    }
};

module.exports = {
  getMyStatsSummary,
  getMyDetailedStats,
  getUserDetailedStatsForAdmin,
  getAdminOverviewStats,
  getQuestionStats,
  getAdminUserSummaries, // Yeni fonksiyonu export et
  recordWordleScore,
  getWordleLeaderboard // Yeni fonksiyonu export et
};
