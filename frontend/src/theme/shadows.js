// frontend/src/theme/shadows.js

// Gölge (boxShadow) tanımları.
// Modern tasarımlar genellikle yumuşak ve katmanlı gölgeler kullanır.
// Chakra UI'ın varsayılanları bu konuda iyi bir başlangıç sunar.
// Renkler (rgba'daki siyah tonu) tema renklerinizle (örn: gray.900'ün bir varyasyonu)
// veya koyu mod için farklı değerlerle ayarlanabilir, ancak genellikle siyahın
// düşük opaklıktaki halleri iyi çalışır.

// Chakra'nın varsayılan base/md gölgesine benzer bir yapı
const md = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)";
// Daha belirgin bir gölge, LoginPage/RegisterPage container'ları için ideal (xl)
const xl = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)";

const shadows = {
  // Çok hafif, ince bir gölge (örn: hover efektleri için başlangıç)
  xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  // Hafif bir gölge (örn: küçük kartlar, buton hover'ları)
  sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
  // Standart gölge (kartlar, modallar için - kodlarınızda 'md' olarak geçiyor)
  base: md, // 'base' ve 'md' aynı olabilir veya 'base' biraz daha hafif olabilir.
  md: md,
  // Daha belirgin bir gölge (vurgulu kartlar, dropdown menüler)
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -4px rgba(0, 0, 0, 0.07)",
  // Büyük ve belirgin gölge (ana konteynerler, pop-up'lar - kodlarınızda 'xl' olarak geçiyor)
  xl: xl,
  // Çok büyük ve yayvan gölge (genellikle özel durumlar için)
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",

  // İç gölge (input içleri, basılı butonlar için kullanılabilir)
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",
  // "inset 0 1px 2px 0 rgba(0,0,0,0.06), inset 0 1px 3px 0 rgba(0,0,0,0.1)", // Daha belirgin iç gölge

  // Odaklanma (focus) için dış çizgi (outline) benzeri gölge.
  // Chakra'nın varsayılan outline'ı genellikle erişilebilirlik için iyidir.
  // theme.config.js içinde focusVisiblePolyfill: false ayarı ile yönetilebilir.
  // İsterseniz özel bir 'outline' gölgesi tanımlayabilirsiniz.
  // Örneğin: `0 0 0 3px rgba(66, 153, 225, 0.6)` (Chakra'nın mavi focus rengi)
  outline: `0 0 0 3px rgba(59, 130, 246, 0.4)`, // Tailwind Blue-500 %40 opaklık
  // Kırmızı outline (hata durumları için)
  outlineError: `0 0 0 3px rgba(239, 68, 68, 0.4)`, // Tailwind Red-500 %40 opaklık

  // Animasyonlu / Katmanlı gölgeler için (daha gelişmiş)
  // Örn: hover'da değişen gölge
  interactiveSmHover: `0 4px 8px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)`,
  interactiveMdHover: `0 8px 12px -3px rgba(0, 0, 0, 0.1), 0 3px 5px -3px rgba(0, 0, 0, 0.08)`,

  // Yükseltilmiş ('lifted') görünüm için daha yumuşak ve geniş gölge
  lifted: "0px 5px 25px -5px rgba(0,0,0,0.1), 0px 5px 10px -6px rgba(0,0,0,0.1)",
  // Daha derin yükseltilmiş görünüm
  deepLifted: "0px 10px 30px -5px rgba(0,0,0,0.12), 0px 8px 15px -8px rgba(0,0,0,0.1)",
};

export default shadows;
