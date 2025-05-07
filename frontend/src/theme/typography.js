// frontend/src/theme/typography.js

// "Canlı, modern, şık" bir tema için Google Fonts'tan popüler fontlar seçilebilir.
// Örnek: 'Inter' gövde metni için, 'Lexend' veya 'Manrope' başlıklar için.
// Bu fontları index.html veya App.js dosyanızda import etmeniz gerekebilir.
// <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lexend:wght@400;500;600;700&display=swap" rel="stylesheet">

const fonts = {
  // heading: "'Lexend', sans-serif", // Modern, şık bir sans-serif başlık fontu
  // body: "'Inter', sans-serif",     // Çok okunaklı bir gövde fontu
  // mono: "'Fira Code', 'Input Mono', monospace", // Kod ve mono metinler için
  // Projenizin içeriği (mikrobiyoloji) düşünülerek daha formal ve okunaklı fontlar da tercih edilebilir.
  // Şimdilik Chakra'nın varsayılanına yakın, sistem fontlarını kullanan bir yapı bırakalım,
  // isterseniz yukarıdaki gibi Google Fonts entegrasyonu yapabilirsiniz.
  heading: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`,
  body: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`,
  mono: `SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,
};

// Kodlarınızda kullanılan (xl, lg, md, sm, xs, 3xl, 5xl) boyutlara uygun bir skala.
// Chakra'nın varsayılanına göre biraz daha tutarlı bir artış ve modern bir görünüm hedeflendi.
const fontSizes = {
  xs: "0.75rem",    // 12px
  sm: "0.875rem",   // 14px - FormLabel, TextMuted için ideal
  md: "1rem",       // 16px - Temel gövde metni, inputlar
  lg: "1.125rem",   // 18px - Alt başlıklar, vurgulu metinler (MyStatsPage'de Heading size lg)
  xl: "1.25rem",    // 20px - Ana başlıklar (AdminPage, LoginPage Heading size xl)
  "2xl": "1.5rem",  // 24px - Daha büyük başlıklar
  "3xl": "1.875rem",// 30px - Önemli sayılar (MyStatsPage StatNumber)
  "4xl": "2.25rem", // 36px
  "5xl": "3rem",    // 48px - Çok büyük sayılar/başlıklar (SolvePage, MyStatsPage)
  "6xl": "3.75rem", // 60px
  // İhtiyaç duyulursa daha büyük boyutlar eklenebilir.
};

const fontWeights = {
  hairline: 100,
  thin: 200,
  light: 300,
  normal: 400,     // Standart gövde metni
  medium: 500,     // FormLabel, bazı butonlar
  semibold: 600,   // Başlıklar, vurgulu metinler
  bold: 700,       // Güçlü vurgu, bazı başlıklar
  extrabold: 800,
  black: 900,
};

// Kodlarınızda 'base', 'tall', 'tight' kullanılmış.
const lineHeights = {
  normal: "normal",
  none: 1,
  shorter: 1.25,     // 'tight' yerine kullanılabilir
  short: 1.375,
  base: 1.5,         // Standart paragraf satır yüksekliği
  tall: 1.625,       // Daha ferah paragraflar (LectureViewPage p)
  taller: "2",
  "3": ".75rem",    // 12px (Çok sıkışık)
  "4": "1rem",      // 16px
  "5": "1.25rem",
  "6": "1.5rem",    // base ile aynı
  "7": "1.75rem",
  "8": "2rem",      // taller ile aynı
  "9": "2.25rem",
  "10": "2.5rem",
};

const letterSpacings = {
  tighter: "-0.05em",
  tight: "-0.025em",
  normal: "0",
  wide: "0.025em",
  wider: "0.05em",    // Kodunuzda 'wider' kullanılmış (SolvePage correctAnswer)
  widest: "0.1em",
};

const typography = {
  fonts,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
};

export default typography;
