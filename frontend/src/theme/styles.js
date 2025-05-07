// frontend/src/theme/styles.js
import { mode } from '@chakra-ui/theme-tools';

// Global stiller (body, html vb. için)
// Açık/Koyu mod için temel sayfa renklerini ve fontlarını ayarlar.
const styles = {
  global: (props) => ({
    // HTML ve Body Temel Ayarları
    'html, body': {
      fontFamily: 'body', // typography.js'den gelir
      color: mode('gray.800', 'whiteAlpha.900')(props), // Temel metin rengi (semanticTokens.textPrimary ile eşleşmeli)
      bg: mode('gray.50', 'gray.900')(props),           // Temel sayfa arkaplanı
      lineHeight: 'base', // typography.js'den gelir
      WebkitFontSmoothing: 'antialiased', // Fontları daha pürüzsüz gösterir
      MozOsxFontSmoothing: 'grayscale',
      transitionProperty: 'background-color, color', // Renk modu geçişleri için yumuşak animasyon
      transitionDuration: '0.2s',
      transitionTimingFunction: 'ease-in-out',
      height: '100%', // HTML ve Body'nin tam yüksekliği kaplamasını sağlar
    },

    // Bağlantılar (Linkler) için global stiller (theme/components/link.js ile tutarlı olmalı)
    'a': {
      color: mode('blue.600', 'blue.300')(props), // Varsayılan link rengi
      textDecoration: 'none',
      transition: 'color 0.2s ease-in-out, opacity 0.2s ease-in-out',
      _hover: {
        textDecoration: 'underline',
        color: mode('blue.700', 'blue.400')(props),
      },
      _active: {
        opacity: 0.8,
      }
    },

    // Başlıklar için varsayılan font ailesi
    'h1, h2, h3, h4, h5, h6': {
      fontFamily: 'heading', // typography.js'den gelir
      fontWeight: 'semibold',
    },

    // Seçim (::selection) Rengi
    '::selection': {
      // theme/colors.js içindeki renkleri kullanın
      background: mode('brand.200', 'brand.700')(props),
      color: mode('brand.900', 'brand.50')(props),
    },

    // Modern ve şık scrollbar (Webkit tabanlı tarayıcılar için)
    '::-webkit-scrollbar': {
      width: '10px',
      height: '10px',
    },
    '::-webkit-scrollbar-track': {
      // Direkt renk veya semantic token kullanılabilir (eğer tanımlıysa)
      background: mode('gray.100', 'gray.700')(props),
      borderRadius: '10px',
    },
    '::-webkit-scrollbar-thumb': {
      background: mode('brand.400', 'brand.500')(props),
      borderRadius: '10px',
      border: `2px solid ${mode('gray.100', 'gray.700')(props)}`,
      _hover: {
        background: mode('brand.500', 'brand.600')(props),
      },
    },

  }),
};

export default styles;
