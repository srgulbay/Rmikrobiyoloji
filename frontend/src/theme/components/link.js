// frontend/src/theme/components/link.js
import { mode } from '@chakra-ui/theme-tools';

const Link = {
  baseStyle: (props) => ({
    // color: mode('brand.600', 'brand.300')(props), // Ana marka rengini kullan
    // Veya daha klasik bir link rengi:
    color: mode('blue.600', 'blue.300')(props), // Chakra'nın mavi tonları
    textDecoration: 'none', // Varsayılan olarak alt çizgi yok
    transitionProperty: 'common',
    transitionDuration: 'fast', // Hızlı geçiş efekti
    cursor: 'pointer',
    fontWeight: 'medium', // Linkler genellikle normal metinden biraz daha kalındır
    _hover: {
      textDecoration: 'underline', // Üzerine gelince altını çiz
      color: mode('blue.700', 'blue.400')(props),
      // opacity: 0.8, // Hafif soluklaştırma efekti (isteğe bağlı)
    },
    _active: { // Tıklama anında
      color: mode('blue.800', 'blue.500')(props),
      // opacity: 0.7,
    },
    _focusVisible: { // Klavye ile odaklanıldığında
      outline: 'none', // Tarayıcı varsayılanını kaldır
      boxShadow: 'outline', // Temadaki shadows.outline (mavi tonlu)
      borderRadius: 'sm', // Hafif yuvarlak köşe (gölge için)
    },
  }),
  variants: {
    // Varsayılan inline varyant (baseStyle ile aynı)
    inline: (props) => ({
        // Base style'ı kullanır
    }),
    // Daha az dikkat çeken linkler için
    subtle: (props) => ({
        color: mode('gray.600', 'gray.400')(props), // semanticTokens.textSecondary
        fontWeight: 'normal',
        _hover: {
            color: mode('gray.800', 'gray.200')(props), // semanticTokens.textPrimary
            textDecoration: 'underline',
        },
        _active: {
            color: mode('gray.900', 'gray.100')(props),
        }
    }),
     // Özel bir "breadcrumb" link varyantı (eğer gerekirse)
     breadcrumb: (props) => ({
        color: mode('gray.600', 'gray.400')(props), // semanticTokens.textSecondary
        fontSize: 'sm',
        fontWeight: 'normal',
        _hover: {
            color: mode('brand.600', 'brand.300')(props), // Vurgu rengi (semanticTokens.accent)
            textDecoration: 'underline',
        },
         '&[aria-current="page"]': { // Aktif breadcrumb öğesi
            color: mode('gray.800', 'whiteAlpha.900')(props), // semanticTokens.textPrimary
            fontWeight: 'semibold',
            cursor: 'default',
            textDecoration: 'none',
            _hover: { // Aktif öğenin hover stili olmasın
                 color: mode('gray.800', 'whiteAlpha.900')(props),
                 textDecoration: 'none',
            }
         }
     }),
  },
  defaultProps: {
    // variant: 'inline' // Varsayılan olarak inline
  },
};

export default Link;
