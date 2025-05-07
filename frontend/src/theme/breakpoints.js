// frontend/src/theme/breakpoints.js

// Chakra UI'ın varsayılan breakpoint'leri genellikle şunlardır:
// sm: "30em", // ~480px
// md: "48em", // ~768px
// lg: "62em", // ~992px
// xl: "80em", // ~1280px
// "2xl": "96em", // ~1536px

// Bu değerler çoğu proje için iyi bir başlangıç noktasıdır.
// "em" birimi kullanılması, kullanıcıların tarayıcı font boyutu
// ayarlarına göre ölçeklenmeyi sağladığı için erişilebilirlik açısından iyidir.

// Projenizin ihtiyaçlarına göre bu değerleri özelleştirebilirsiniz.
// Örneğin, daha küçük bir "xs" breakpoint ekleyebilir veya mevcut değerleri değiştirebilirsiniz.
// Şimdilik standart değerleri kullanalım, bu kodlarınızla uyumlu olacaktır.

const breakpoints = {
  base: "0em",    // 0px (Chakra bunu örtük olarak yönetir, ancak açıkça belirtmek iyi olabilir)
  sm: "30em",     // ~480px - Mobil yatay, küçük tabletler
  md: "48em",     // ~768px - Tabletler, küçük laptoplar (kodlarınızda sıkça kullanılıyor)
  lg: "62em",     // ~992px - Laptoplar, standart masaüstü (kodlarınızda kullanılıyor)
  xl: "80em",     // ~1280px - Geniş masaüstü ekranları
  "2xl": "96em",  // ~1536px - Çok geniş masaüstü ekranları
};

// Breakpoint'leri createBreakpoints fonksiyonu ile oluşturmak yerine
// doğrudan bir obje olarak dışa aktarmak daha yaygındır ve Chakra UI tarafından desteklenir.
// import { createBreakpoints } from "@chakra-ui/theme-tools";
// const breakpoints = createBreakpoints({ ... });

export default breakpoints;
