// src/theme.js
import { extendTheme } from '@chakra-ui/react';

// Mevcut CSS değişkenlerinizi Chakra formatına çevirmek için bir başlangıç noktası
const theme = extendTheme({
  // Renkler: OKLCH renklerini Chakra'nın renk skalalarına (veya kendi tanımlayacağınız skalalara)
  // eşlemeniz gerekecek. Bu genellikle bir renk dönüştürme aracı veya Chakra'nın
  // varsayılan renk paletini ('blue', 'gray', 'green' vb.) kullanarak yapılır.
  // Şimdilik örnek bir 'brand' rengi tanımlayalım:
  colors: {
    brand: { // --hue-primary (238) mavi bir tonu temsil ediyor varsayalım
      50: '#e3f2fd', // Çok Açık
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#2196f3', // Ana Renk (Yaklaşık --lightness-brand-light / --lightness-brand-dark)
      600: '#1e88e5', // Hover (Yaklaşık --accent-primary-hover)
      700: '#1976d2', // Active (Yaklaşık --accent-primary-active)
      800: '#1565c0',
      900: '#0d47a1', // Çok Koyu
    },
    // Diğer renkleri (success, error, warning, neutral tonları) buraya ekleyebilirsiniz.
    // Örneğin: success: { 50: ..., 100: ..., ..., 500: '#4caf50', ... }
  },

  // Yazı Tipleri
  fonts: {
    body: `'Inter', 'Poppins', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`, // --font-family-base [cite: 868]
    heading: `'Inter', 'Poppins', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`, // --font-family-heading [cite: 868]
    mono: `'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace`, // --font-family-mono [cite: 869]
  },

  // Yazı Boyutları (Anahtar isimleri Chakra'nın beklediği şekilde)
  fontSizes: {
    xs: "0.75rem",   // --font-size-xs [cite: 869]
    sm: "0.875rem",   // --font-size-sm [cite: 869]
    md: "1rem",      // --font-size-base [cite: 869]
    lg: "1.125rem",   // --font-size-md [cite: 869]
    xl: "1.25rem",   // --font-size-lg [cite: 869]
    '2xl': "1.5rem",    // --font-size-xl [cite: 870]
    '3xl': "1.875rem",  // --font-size-2xl [cite: 870]
    '4xl': "2.25rem",  // --font-size-3xl [cite: 870]
    '5xl': "3rem",     // --font-size-4xl [cite: 870]
    // İhtiyaç varsa diğerlerini ekleyin
  },

   // Yazı Kalınlıkları
   fontWeights: {
      normal: 400, // --font-weight-normal [cite: 871]
      medium: 500, // --font-weight-medium [cite: 871]
      semibold: 600, // --font-weight-semibold [cite: 871]
      bold: 700, // --font-weight-bold [cite: 871]
    },

  // Satır Yükseklikleri
  lineHeights: {
      tight: 1.25,   // --line-height-tight [cite: 870]
      normal: 1.5,   // --line-height-normal [cite: 870]
      base: 1.7,     // --line-height-base [cite: 870]
      loose: 1.9,    // --line-height-loose [cite: 870]
  },

  // Boşluklar (Margin/Padding için)
  space: {
    1: "0.25rem",  // --space-1 [cite: 871]
    2: "0.5rem",   // --space-2 [cite: 871]
    3: "0.75rem",  // --space-3 [cite: 871]
    4: "1rem",     // --space-4 [cite: 872]
    5: "1.25rem",  // --space-5 [cite: 872]
    6: "1.5rem",   // --space-6 [cite: 872]
    8: "2rem",     // --space-8 [cite: 872]
    10: "2.5rem",   // --space-10 [cite: 872]
    12: "3rem",    // --space-12 [cite: 872]
    16: "4rem",    // --space-16 [cite: 873]
    // İhtiyaç varsa diğerlerini ekleyin (Chakra genelde 4'ün katlarını kullanır)
  },

  // Kenar Yarıçapları
  radii: {
    none: '0',
    sm: '0.25rem', // --border-radius-sm [cite: 873]
    base: '0.5rem',// --border-radius-md [cite: 873] (Chakra'da base genelde md'dir)
    md: '0.5rem', // --border-radius-md [cite: 873]
    lg: '1rem',   // --border-radius-lg [cite: 873]
    xl: '1.5rem',  // --border-radius-xl [cite: 873]
    pill: '9999px',// --border-radius-pill [cite: 873]
    full: '9999px',// --border-radius-pill [cite: 873] (Chakra'da full kullanılır)
  },

  // Gölgeler (Yaklaşık eşleşmeler, renkleri temanıza göre ayarlamanız gerekir)
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // --shadow-sm [cite: 874]
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)', // --shadow-md [cite: 875] (Chakra'da base genelde md'dir)
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)', // --shadow-md [cite: 875]
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)', // --shadow-lg [cite: 876]
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)', // --shadow-xl [cite: 877]
    inner: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)', // --shadow-inner [cite: 878]
    // Chakra'nın outline gibi başka gölgeleri de vardır.
  },

  // Z-Index (İhtiyaç duyulursa)
  zIndices: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000, // --z-index-dropdown [cite: 879]
    sticky: 1100,   // --z-index-sticky [cite: 879] (Chakra'dan biraz yüksek)
    banner: 1200,
    overlay: 1300,
    modal: 1400,    // --z-index-modal [cite: 879] (Chakra'dan biraz yüksek)
    popover: 1500,  // --z-index-popover [cite: 879] (Chakra'dan biraz yüksek)
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,  // --z-index-tooltip [cite: 879] (Chakra'dan biraz yüksek)
  },

  // Semantic Tokens (Açık/Koyu mod renklerini yönetmek için)
  // Bu kısım, :root ve body.dark-mode [cite: 863, 889] içindeki değişkenleri buraya taşımak için kullanılır.
  // OKLCH renklerini Chakra'nın anlayacağı değerlere (hex, rgb, veya renk skalası tokenları) çevirmeniz gerekir.
  semanticTokens: {
    colors: {
      // Örnekler:
      bgPrimary: { default: 'white', _dark: 'gray.800' }, // --bg-primary [cite: 881, 889] karşılığı (yaklaşık)
      bgSecondary: { default: 'gray.50', _dark: 'gray.700' }, // --bg-secondary [cite: 881, 889] karşılığı (yaklaşık)
      textPrimary: { default: 'gray.800', _dark: 'whiteAlpha.900' }, // --text-primary [cite: 882, 890] karşılığı (yaklaşık)
      textSecondary: { default: 'gray.600', _dark: 'whiteAlpha.700' }, // --text-secondary [cite: 882, 890] karşılığı (yaklaşık)
      textMuted: { default: 'gray.500', _dark: 'gray.400' }, // --text-muted [cite: 882, 890] karşılığı (yaklaşık)
      accent: { default: 'brand.500', _dark: 'brand.300' }, // --accent-primary [cite: 883, 891] karşılığı (yaklaşık)
      accentHover: { default: 'brand.600', _dark: 'brand.200' }, // --accent-primary-hover [cite: 884, 891] karşılığı (yaklaşık)
      borderPrimary: { default: 'gray.200', _dark: 'whiteAlpha.300' }, // --border-primary [cite: 884, 892] karşılığı (yaklaşık)
      // Feedback renkleri için de benzer tanımlamalar yapılabilir:
      feedbackSuccess: { default: 'green.500', _dark: 'green.300' }, // --feedback-success [cite: 886, 894]
      feedbackSuccessBg: { default: 'green.50', _dark: 'green.900' }, // --feedback-success-bg [cite: 886, 894]
      feedbackError: { default: 'red.500', _dark: 'red.300' }, // --feedback-error [cite: 886, 894]
      feedbackErrorBg: { default: 'red.50', _dark: 'red.900' }, // --feedback-error-bg [cite: 887, 894]
      // ... warning, info ...
    },
    // Diğer semantic tokenlar (shadows vb.) eklenebilir.
  },

  // Bileşenlerin varsayılan stillerini veya varyantlarını burada özelleştirebilirsiniz.
  components: {
    // Örneğin Button:
    Button: {
      // Varsayılan stil
      baseStyle: {
         fontWeight: 'semibold', // --font-weight-semibold [cite: 871]
         borderRadius: 'md', // --border-radius-md [cite: 873]
      },
      // Renk şemasına göre stiller (colorScheme='brand')
      variants: {
        solid: (props) => ({ // Varsayılan 'solid' varyantını özelleştirme
           bg: props.colorScheme === 'brand' ? 'accent' : `${props.colorScheme}.500`, // 'brand' ise semantic token, değilse renk skalası
           color: 'white',
          _hover: {
             bg: props.colorScheme === 'brand' ? 'accentHover' : `${props.colorScheme}.600`,
             _disabled: { // disabled durumunda hover efektini engelle
                bg: props.colorScheme === 'brand' ? 'accent' : `${props.colorScheme}.500`,
             }
           },
           _active: {
              bg: props.colorScheme === 'brand' ? 'brand.700' : `${props.colorScheme}.700`, // Örnek
           },
           _disabled: {
              opacity: 0.5,
              cursor: 'not-allowed',
              // bg: 'gray.300', // Örnek bir disabled rengi
           }
        }),
         // Eski '.btn-secondary' için 'ghost' veya 'outline' varyantını özelleştirebilir veya yeni bir varyant oluşturabilirsiniz.
         secondary: {
             bg: 'bgSecondary',
             color: 'textPrimary',
             border: '1px solid',
             borderColor: 'borderPrimary',
             _hover: { bg: 'bgTertiary', borderColor: 'borderStrong' },
             _active: { bg: 'bgQuaternary', borderColor: 'borderStrong' },
         },
         // ...diğer varyantlar (ghost, link, danger, success vb.)
      },
      // Boyutlar
       sizes: {
         sm: { fontSize: 'sm', px: 3, py: 2 }, // --btn-sm [cite: 980]
         md: { fontSize: 'base', px: 5, py: 3 }, // --btn [cite: 954]
         lg: { fontSize: 'md', px: 6, py: 4 }, // --btn-lg [cite: 980]
       },
    },
     // Input, Card, Table gibi diğer bileşenler için de benzer özelleştirmeler...
  },

   // Global stiller (body, html vb. için) - ChakraProvider genellikle bir reset uygular,
   // ancak üzerine yazmak veya eklemek isterseniz burayı kullanabilirsiniz.
   styles: {
      global: (props) => ({
        body: {
          fontFamily: 'body', // Temadaki body fontunu kullan
          color: 'textPrimary', // Semantic token
          bg: 'bgPrimary', // Semantic token
          transitionProperty: 'background-color',
          transitionDuration: 'normal',
          lineHeight: 'base', // Temadaki base line height
        },
        // '*::placeholder': {
        //   color: 'gray.400',
        // },
        // '*::-webkit-scrollbar': { ... } // Scrollbar stilleri tema üzerinden de yönetilebilir
      }),
    },

});

export default theme;