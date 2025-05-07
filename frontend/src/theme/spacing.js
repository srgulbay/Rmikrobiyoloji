// frontend/src/theme/spacing.js

// Chakra UI'ın varsayılan boşluk (space) skalası genellikle 4px tabanlıdır.
// (0.5: 2px, 1: 4px, 1.5: 6px, 2: 8px, ...)
// Bu skalayı projenizin ihtiyaçlarına göre genişletebilir veya isimlendirmeleri değiştirebilirsiniz.
// "Canlı ve modern" bir tema için bu skalayı biraz daha modüler ve anlaşılır hale getirebiliriz.

const space = {
  px: "1px",
  0: "0",
  0.5: "0.125rem", // 2px
  1: "0.25rem",   // 4px (xs spacing)
  1.5: "0.375rem",// 6px
  2: "0.5rem",    // 8px (sm spacing) - Örn: HStack spacing={2}
  2.5: "0.625rem",// 10px
  3: "0.75rem",   // 12px
  3.5: "0.875rem",// 14px
  4: "1rem",      // 16px (md spacing, base padding) - Örn: p={4}, spacing={4}
  5: "1.25rem",   // 20px
  6: "1.5rem",    // 24px (lg spacing, section padding) - Örn: mb={6}, py={6}
  7: "1.75rem",   // 28px
  8: "2rem",      // 32px (xl spacing) - Örn: py={8}, mb={8}
  9: "2.25rem",   // 36px
  10: "2.5rem",   // 40px
  11: "2.75rem",  // 44px
  12: "3rem",     // 48px
  14: "3.5rem",   // 56px
  16: "4rem",     // 64px
  20: "5rem",     // 80px
  24: "6rem",     // 96px
  28: "7rem",     // 112px
  32: "8rem",     // 128px
  36: "9rem",     // 144px
  40: "10rem",    // 160px
  44: "11rem",    // 176px
  48: "12rem",    // 192px
  52: "13rem",    // 208px
  56: "14rem",    // 224px
  60: "15rem",    // 240px
  64: "16rem",    // 256px
  72: "18rem",    // 288px
  80: "20rem",    // 320px
  96: "24rem",    // 384px
};

// Boyutlar (Width/Height) için de bu space skalasını kullanabiliriz
// veya ayrı bir 'sizes' objesi tanımlayabiliriz.
// Chakra UI, 'sizes' objesini genellikle Container maxW, Avatar size gibi şeyler için kullanır.
// Şimdilik 'space' yeterli olacaktır, 'sizes' objesini ana tema dosyasında (index.js)
// veya ihtiyaç duyulursa ayrı bir 'sizes.js' dosyasında tanımlayabiliriz.
// Örneğin, 'container.sm', 'container.md' gibi değerler 'sizes' altında tanımlanır.

export default space;
