const { QuestionAttempt, Question, Topic, User, WordleScore, sequelize } = require('../../models');
const { Op, fn, col, literal } = require("sequelize");

const WEAK_TOPIC_ACCURACY_THRESHOLD = 65;
const WEAK_TOPIC_MIN_ATTEMPTS = 5;

const getMyStatsSummary = async (req, res) => {
  const userId = req.user.id;
  try {
    const totalAttempts = await QuestionAttempt.count({ where: { userId: userId } });
    const correctAttempts = await QuestionAttempt.count({ where: { userId: userId, isCorrect: true } });
    const accuracy = totalAttempts > 0 ? parseFloat(((correctAttempts / totalAttempts) * 100).toFixed(2)) : 0;
    res.status(200).json({ totalAttempts, correctAttempts, accuracy });
  } catch (error) {
    console.error('Kullanıcı özet istatistikleri getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Özet istatistikler getirilemedi.' });
  }
};

const calculateDetailedStatsForUser = async (userId) => {
    try {
        const attempts = await QuestionAttempt.findAll({
            where: { userId: userId },
            include: [{
                model: Question,
                as: 'question',
                attributes: ['id', 'topicId'],
                required: true,
                include: [{
                    model: Topic,
                    as: 'topic',
                    attributes: ['id', 'name'],
                    required: true
                }]
            }],
            attributes: ['isCorrect', 'id'],
            raw: true,
            nest: true,
        });
        const statsByTopic = {};
        attempts.forEach(attempt => {
            const topicInfo = attempt.question?.topic;
            if (!topicInfo || !topicInfo.id) { return; }
            const topicId = topicInfo.id;
            const topicName = topicInfo.name;
            if (!statsByTopic[topicId]) {
                statsByTopic[topicId] = { topicId: topicId, topicName: topicName, totalAttempts: 0, correctAttempts: 0, };
            }
            statsByTopic[topicId].totalAttempts += 1;
            if (attempt.isCorrect) { statsByTopic[topicId].correctAttempts += 1; }
        });
        const result = Object.values(statsByTopic).map(topicStat => {
            const accuracy = topicStat.totalAttempts > 0 ? parseFloat(((topicStat.correctAttempts / topicStat.totalAttempts) * 100).toFixed(2)) : 0;
            return { ...topicStat, accuracy };
        });
        return result;
    } catch (error) {
         console.error(`calculateDetailedStatsForUser (${userId}) hatası:`, error);
         throw error;
    }
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
        const userWhereClause = {}; const attemptWhereClause = {};
        if (specialization) { userWhereClause.specialization = specialization; }
        const users = await User.findAll({ where: userWhereClause, attributes: ['id'], raw: true });
        const userIds = users.map(u => u.id);
        const userCount = userIds.length;
        if (userCount === 0 && specialization) {
             return res.status(200).json({ totalAttempts: 0, correctAttempts: 0, accuracy: 0, userCount: 0, filter: specialization });
        }
        if (userCount > 0) {
            attemptWhereClause.userId = { [Op.in]: userIds };
        } else if (specialization) {
             return res.status(200).json({ totalAttempts: 0, correctAttempts: 0, accuracy: 0, userCount: 0, filter: specialization });
        }
        const totalAttempts = await QuestionAttempt.count({ where: attemptWhereClause });
        const correctAttempts = await QuestionAttempt.count({ where: { ...attemptWhereClause, isCorrect: true } });
        const accuracy = totalAttempts > 0 ? parseFloat(((correctAttempts / totalAttempts) * 100).toFixed(2)) : 0;
        res.status(200).json({ totalAttempts, correctAttempts, accuracy, userCount, filter: specialization || 'Tümü' });
    } catch (error) {
         console.error('Admin genel bakış istatistikleri getirilirken hata:', error);
         res.status(500).json({ message: 'Sunucu hatası. Genel bakış istatistikleri getirilemedi.' });
    }
};

const getQuestionStats = async (req, res) => {
    try {
        const stats = await QuestionAttempt.findAll({
            attributes: [
                'questionId',
                [fn('COUNT', col('QuestionAttempt.id')), 'totalAttempts'],
                [fn('SUM', literal("CASE WHEN \"isCorrect\" THEN 1 ELSE 0 END")), 'correctAttempts']
            ],
            group: ['questionId'],
            raw: true
        });
        const statsMap = {};
        stats.forEach(stat => {
            const total = parseInt(stat.totalAttempts, 10);
            const correct = parseInt(stat.correctAttempts, 10) || 0;
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
        if (specialization) { userWhereClause.specialization = specialization; }
        const usersWithStats = await User.findAll({
            where: userWhereClause,
            attributes: [ 'id', 'username',
                [fn('COUNT', col('QuestionAttempts.id')), 'totalAttempts'],
                [fn('SUM', literal("CASE WHEN \"QuestionAttempts\".\"isCorrect\" = true THEN 1 ELSE 0 END")), 'correctAttempts']
            ],
            include: [{ model: QuestionAttempt, as: 'QuestionAttempts', attributes: [], required: false }],
            group: ['User.id'], order: [['username', 'ASC']],
        });
        const results = usersWithStats.map(user => {
            const userData = user.dataValues ? user.dataValues : user;
            const total = parseInt(userData.totalAttempts || 0, 10);
            const correct = parseInt(userData.correctAttempts || 0, 10);
            const accuracy = total > 0 ? parseFloat(((correct / total) * 100).toFixed(2)) : 0;
            return { userId: userData.id, username: userData.username, totalAttempts: total, correctAttempts: correct, accuracy: accuracy };
        });
        res.status(200).json(results);
    } catch (error) {
        console.error('Admin kullanıcı özetleri getirilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası. Kullanıcı özetleri getirilemedi.' });
    }
};

const recordWordleScore = async (req, res) => {
    const { score } = req.body; const userId = req.user.id;
    if (score === undefined || typeof score !== 'number' || score < 0) { return res.status(400).json({ message: 'Geçersiz skor değeri.' }); }
    try {
        const newScore = await WordleScore.create({ userId: userId, score: Math.round(score) });
        res.status(201).json({ message: 'Skor başarıyla kaydedildi.', score: newScore });
    } catch (error) {
        console.error("Wordle skoru kaydedilirken hata:", error);
        res.status(500).json({ message: "Skor kaydedilirken sunucu hatası oluştu." });
    }
};

const getWordleLeaderboard = async (req, res) => {
    try {
        const topScores = await WordleScore.findAll({
            limit: 10, order: [['score', 'DESC']], attributes: ['userId', 'score', 'createdAt'],
            include: [{ model: User, as: 'user', attributes: ['username'] }],
        });
        res.status(200).json(topScores);
    } catch (error) {
        console.error("Lider tablosu getirilirken hata:", error);
        res.status(500).json({ message: "Lider tablosu getirilirken bir sunucu hatası oluştu." });
    }
};

const getMyTopicErrors = async (req, res) => {
    const userId = req.user.id;
    try {
        const attemptsByTopic = await QuestionAttempt.findAll({
            where: { userId },
            attributes: [
                [col('question.topicId'), 'topicId'], // Düzeltildi: 'Question' yerine 'question' (alias)
                [col('question->topic.name'), 'topicName'], // Düzeltildi: 'Question->Topic' yerine 'question->topic' (raw:true notasyonu)
                [fn('COUNT', col('QuestionAttempt.id')), 'totalAttempts'],
                [fn('SUM', literal("CASE WHEN \"QuestionAttempt\".\"isCorrect\" = true THEN 1 ELSE 0 END")), 'correctAttempts']
            ],
            include: [{
                model: Question,
                as: 'question', // Alias 'question'
                attributes: [],
                required: true,
                include: [{
                    model: Topic,
                    as: 'topic', // Alias 'topic'
                    attributes: [],
                    required: true
                }]
            }],
            group: [
                col('question.topicId'), // Düzeltildi
                col('question->topic.name') // Düzeltildi
            ],
            raw: true,
        });

        const weakTopics = attemptsByTopic
            .map(stat => {
                const total = parseInt(stat.totalAttempts, 10);
                const correct = parseInt(stat.correctAttempts, 10) || 0;
                const accuracy = total > 0 ? parseFloat(((correct / total) * 100).toFixed(2)) : 0;
                return {
                    topicId: stat.topicId,
                    topicName: stat.topicName,
                    totalAttempts: total,
                    correctAttempts: correct,
                    accuracy: accuracy
                };
            })
            .filter(stat => stat.accuracy < WEAK_TOPIC_ACCURACY_THRESHOLD && stat.totalAttempts >= WEAK_TOPIC_MIN_ATTEMPTS)
            .sort((a, b) => a.accuracy - b.accuracy);

        res.status(200).json(weakTopics);

    } catch (error) {
        console.error(`Kullanıcı ID ${userId} için zayıf konular getirilirken hata:`, error);
        // Orijinal hatayı da loglamak faydalı olabilir
        // console.error('Original Error:', error.original);
        res.status(500).json({ message: 'Sunucu hatası. Zayıf konular getirilemedi.' });
    }
};

const getGlobalAverages = async (req, res) => {
    try {
        const totalAttempts = await QuestionAttempt.count();
        const correctAttempts = await QuestionAttempt.count({ where: { isCorrect: true } });
        const overallAccuracy = totalAttempts > 0 ? parseFloat(((correctAttempts / totalAttempts) * 100).toFixed(2)) : 0;
        res.status(200).json({ overallAccuracy });
    } catch (error) {
         console.error('Genel ortalamalar getirilirken hata:', error);
         res.status(500).json({ message: 'Sunucu hatası. Genel ortalamalar getirilemedi.' });
    }
};

const getMyWeeklyProgress = async (req, res) => {
    const userId = req.user.id;
    const numberOfWeeks = parseInt(req.query.weeks || '8', 10);

    if (isNaN(numberOfWeeks) || numberOfWeeks <= 0) {
        return res.status(400).json({ message: 'Geçersiz hafta sayısı.' });
    }

    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - (numberOfWeeks * 7));
        startDate.setHours(0, 0, 0, 0);

        const weeklyData = await QuestionAttempt.findAll({
            where: {
                userId: userId,
                createdAt: { [Op.gte]: startDate }
            },
            attributes: [
                [sequelize.fn('DATE_TRUNC', 'week', sequelize.col('createdAt')), 'weekStartDate'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalAttempts'],
                [sequelize.fn('SUM', sequelize.literal("CASE WHEN \"isCorrect\" = true THEN 1 ELSE 0 END")), 'correctAttempts']
            ],
            group: [sequelize.fn('DATE_TRUNC', 'week', sequelize.col('createdAt'))],
            order: [[sequelize.fn('DATE_TRUNC', 'week', sequelize.col('createdAt')), 'ASC']],
            raw: true
        });

        const resultsMap = new Map();
        weeklyData.forEach(week => {
            const dateString = new Date(week.weekStartDate).toISOString().split('T')[0];
            const total = parseInt(week.totalAttempts, 10);
            const correct = parseInt(week.correctAttempts || 0, 10);
            const accuracy = total > 0 ? parseFloat(((correct / total) * 100).toFixed(2)) : 0;
            resultsMap.set(dateString, { weekStartDate: dateString, totalAttempts: total, accuracy: accuracy });
        });

        const finalResults = [];
        let currentDate = new Date(startDate);
        const dayOfWeek = startDate.getDay();
        const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        currentDate = new Date(startDate.setDate(diff));
        currentDate.setHours(0,0,0,0);

        for (let i = 0; i < numberOfWeeks; i++) {
            const dateString = currentDate.toISOString().split('T')[0];
            if (resultsMap.has(dateString)) {
                finalResults.push(resultsMap.get(dateString));
            } else {
                finalResults.push({ weekStartDate: dateString, totalAttempts: 0, accuracy: 0 });
            }
            currentDate.setDate(currentDate.getDate() + 7);
        }

        res.status(200).json(finalResults);

    } catch (error) {
        console.error(`Kullanıcı ID ${userId} için haftalık gelişim getirilirken hata:`, error);
        res.status(500).json({ message: 'Sunucu hatası. Haftalık gelişim verisi getirilemedi.' });
    }
};

module.exports = {
  getMyStatsSummary,
  getMyDetailedStats,
  getUserDetailedStatsForAdmin,
  getAdminOverviewStats,
  getQuestionStats,
  getAdminUserSummaries,
  recordWordleScore,
  getWordleLeaderboard,
  getMyTopicErrors,
  getGlobalAverages,
  getMyWeeklyProgress
};