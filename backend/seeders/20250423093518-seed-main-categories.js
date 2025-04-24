
'use strict';



/** @type {import('sequelize-cli').Migration} */

module.exports = {

  async up (queryInterface, Sequelize) {

    // NOT: Bu seeder artık Topic eklemiyor, sadece Question ekliyor.

    // Topic'ler bir önceki 'seed-main-categories' seeder'ı ile eklendi.

    await queryInterface.bulkInsert('Questions', [

      {

        text: 'Aşağıdakilerden hangisi prokaryotik hücre yapısına sahiptir?',

        optionA: 'Maya', optionB: 'Bakteri', optionC: 'Amip', optionD: 'Alg', optionE: 'Mantar',

        correctAnswer: 'B', difficulty: 'easy', imageUrl: null,

        topicId: 1, // Genel Mikrobiyoloji (ID: 1)

        createdAt: new Date(), updatedAt: new Date()

      },

      {

        text: 'Gram boyama yönteminde mor renk veren bakterilere ne ad verilir?',

        optionA: 'Gram Negatif', optionB: 'Aside Dirençli', optionC: 'Gram Pozitif', optionD: 'Spiroket', optionE: 'Mikoplazma',

        correctAnswer: 'C', difficulty: 'easy', imageUrl: 'https://example.com/images/gram_stain.jpg',

        topicId: 3, // Bakteriyoloji (ID: 3)

        createdAt: new Date(), updatedAt: new Date()

      },

      {

        text: 'Bakterilerde konjugasyonun temel işlevi nedir?',

        optionA: 'Hücre bölünmesi', optionB: 'Genetik materyal aktarımı', optionC: 'Endospor oluşumu', optionD: 'Hareket', optionE: 'Fagositoz',

        correctAnswer: 'B', difficulty: 'medium', imageUrl: null,

        topicId: 3, // Bakteriyoloji (ID: 3)

        createdAt: new Date(), updatedAt: new Date()

      },

      // --- POST ile eklediğimiz soruyu tekrar ekleyebiliriz ---

      {

        text: 'Fotosentez nerede gerçekleşir?',

        optionA: 'Mitokondri', optionB: 'Ribozom', optionC: 'Kloroplast', optionD: 'Çekirdek', optionE: 'Lizozom',

        correctAnswer: 'C', difficulty: 'easy', imageUrl: 'https://example.com/images/chloroplast.png',

        topicId: 1, // Genel Mikrobiyoloji (ID: 1)

        createdAt: new Date(), updatedAt: new Date()

       }

    ], {});

  },



  async down (queryInterface, Sequelize) {

    // Sadece bu seeder'ın eklediği soruları silmek zor olacağından, tüm soruları silelim

    await queryInterface.bulkDelete('Questions', null, {});

    // Bu seeder artık Topic silmemeli

    // await queryInterface.bulkDelete('Topics', null, {});

  }

};

