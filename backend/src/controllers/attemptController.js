const { QuestionAttempt, Question } = require('../../models'); // Question modelini de alalım (belki lazım olur)

const recordAttempt = async (req, res) => {
  const { questionId, selectedAnswer, isCorrect } = req.body;
  const userId = req.user.id; // protect middleware'inden gelir

  if (questionId === undefined || selectedAnswer === undefined || isCorrect === undefined) {
    return res.status(400).json({ message: 'Eksik veri: questionId, selectedAnswer ve isCorrect zorunludur.' });
  }

  try {
    // İsteğe bağlı: Böyle bir soru var mı diye kontrol edilebilir
    // const questionExists = await Question.findByPk(questionId);
    // if (!questionExists) {
    //    return res.status(404).json({ message: 'Soru bulunamadı.' });
    // }

    const newAttempt = await QuestionAttempt.create({
      userId,
      questionId,
      selectedAnswer,
      isCorrect // Frontend'den gelen doğru/yanlış bilgisine güveniyoruz
    });
    res.status(201).json(newAttempt);

  } catch (error) {
    console.error('Soru denemesi kaydedilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası. Cevap kaydedilemedi.' });
  }
};

module.exports = {
  recordAttempt,
  // İleride istatistik getirme fonksiyonları eklenebilir
};
