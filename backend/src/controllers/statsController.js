const { QuestionAttempt, Question, Topic, User, sequelize } = require('../../models');
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

module.exports = {
  getMyStatsSummary,
  getMyDetailedStats,
  getUserDetailedStatsForAdmin,
  getAdminOverviewStats,
  getQuestionStats
};
