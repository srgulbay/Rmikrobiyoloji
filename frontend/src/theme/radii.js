// frontend/src/theme/radii.js

// Kenar yuvarlaklıkları (borderRadius) için tanımlar.
// Modern ve şık bir görünüm için Chakra'nın varsayılanlarını
// biraz daha belirgin hale getirebilir veya kendi skalanızı oluşturabilirsiniz.

const radii = {
  none: "0",
  sm: "0.25rem",    // 4px (Hafif yuvarlaklık, örn: küçük etiketler, input içleri)
  base: "0.375rem", // 6px (Chakra'nın 'md' sine yakın, temel yuvarlaklık)
  md: "0.5rem",     // 8px (Butonlar, inputlar, alertler için iyi bir varsayılan - kodlarınızda sıkça kullanılıyor)
  lg: "0.75rem",    // 12px (Kartlar, modallar için daha belirgin yuvarlaklık - kodlarınızda sıkça kullanılıyor)
  xl: "1rem",       // 16px (Büyük konteynerler, özel vurgu alanları için - kodlarınızda kullanılıyor)
  "2xl": "1.5rem",  // 24px (Daha da büyük yuvarlaklıklar)
  "3xl": "2rem",    // 32px
  full: "9999px",   // Tamamen yuvarlak (Avatar, bazı butonlar için)
};

// Chakra UI'da 'radii' anahtarı 'borderRadius' token'ları için kullanılır.
// Örnek kullanım: <Box borderRadius="lg">...</Box>

export default radii;
