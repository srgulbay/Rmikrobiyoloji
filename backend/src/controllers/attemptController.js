const { QuestionAttempt, Question } = require('../../models');

const recordAttempt = async (req, res) => {
  const { questionId, selectedAnswer, isCorrect, timeTaken } = req.body;
  const userId = req.user.id;

  if (questionId === undefined || selectedAnswer === undefined || isCorrect === undefined) {
    return res.status(400).json({ message: 'Eksik veri: questionId, selectedAnswer ve isCorrect zorunludur.' });
  }

  const validTimeTaken = (typeof timeTaken === 'number' && timeTaken >= 0) ? Math.round(timeTaken) : null;

  try {
    const newAttempt = await QuestionAttempt.create({
      userId,
      questionId: parseInt(questionId, 10),
      selectedAnswer: String(selectedAnswer),
      isCorrect: Boolean(isCorrect),
      timeTaken: validTimeTaken
    });
    res.status(201).json(newAttempt);

  } catch (error) {
    console.error('Soru denemesi kaydedilirken hata:', error);
     if (error.name === 'SequelizeValidationError') {
       const messages = error.errors.map(err => err.message).join('. ');
       return res.status(400).json({ message: `Doğrulama hatası: ${messages}` });
    }
    res.status(500).json({ message: 'Sunucu hatası. Cevap kaydedilemedi.' });
  }
};

module.exports = {
  recordAttempt,
};