// frontend/src/theme/components/card.js
import { mode } from '@chakra-ui/theme-tools';

const Card = {
  // Temel stil tüm Card ve alt bileşenleri için geçerlidir
  baseStyle: (props) => ({
    container: { // Card'ın ana sarmalayıcısı için
      bg: mode('white', 'gray.700')(props), // semanticTokens.bgSecondary de kullanılabilir
      borderRadius: 'lg', // Temadaki radii.lg (0.75rem veya 12px)
      borderWidth: '1px',
      borderColor: mode('gray.200', 'gray.600')(props), // semanticTokens.borderPrimary
      boxShadow: mode('sm', 'md')(props), // Hafif bir varsayılan gölge, koyu modda biraz daha belirgin
      overflow: 'hidden', // İçerik taşmalarını ve borderRadius'ün düzgün görünmesini sağlar
      display: 'flex',
      flexDirection: 'column',
      position: 'relative', // İçerideki absolute konumlandırmalar için
      transitionProperty: 'common',
      transitionDuration: 'slow', // 300ms, boxShadow ve transform için daha yumuşak geçiş
    },
    header: {
      paddingX: { base: 4, md: 6 },
      paddingTop: { base: 4, md: 5 },
      paddingBottom: { base: 2, md: 3 }, // Body'den önce daha az boşluk
      fontSize: 'xl',
      fontWeight: 'semibold',
      borderBottomWidth: '1px',
      borderColor: mode('gray.100', 'gray.600')(props),
    },
    body: {
      paddingX: { base: 4, md: 6 },
      paddingY: { base: 4, md: 5 },
      flex: '1', // Eğer Card içinde header/footer varsa body'nin esnemesini sağlar
    },
    footer: {
      paddingX: { base: 4, md: 6 },
      paddingTop: { base: 3, md: 4 }, // Body'den sonra
      paddingBottom: { base: 4, md: 5 },
      borderTopWidth: '1px',
      borderColor: mode('gray.100', 'gray.600')(props),
    },
  }),
  // Farklı kart varyantları
  variants: {
    // Kodlarınızda sıkça kullanılıyor
    outline: (props) => ({
      container: {
        borderWidth: '1px', // Net bir kenarlık
        borderColor: mode('gray.300', 'gray.600')(props), // semanticTokens.borderSecondary
        boxShadow: 'none', // Outline varyantında gölge olmasın veya çok hafif (xs)
        bg: mode('transparent', 'gray.700')(props), // Arkaplanı transparan veya çok hafif
        _hover: {
          borderColor: mode('brand.400', 'brand.500')(props),
          boxShadow: 'md', // Hafif bir hover gölgesi
        }
      }
    }),
    // Gölgeli, yükseltilmiş kartlar (varsayılan olabilir)
    elevated: (props) => ({
      container: {
        bg: mode('white', 'gray.700')(props), // semanticTokens.bgSecondary
        borderWidth: '1px',
        borderColor: mode('gray.200', 'gray.600')(props), // semanticTokens.borderPrimary
        boxShadow: mode('lg', 'xl')(props), // Belirgin gölge
        _hover: {
          boxShadow: mode('xl', '2xl')(props), // Hover'da gölgeyi artır
          transform: 'translateY(-4px) scale(1.01)', // Hafif yukarı ve büyütme efekti
        },
      }
    }),
    // Hafif dolgulu, az gölgeli kartlar
    filled: (props) => ({
      container: {
        bg: mode('gray.100', 'gray.750')(props), // gray.750 için colors.js'de tanımlama gerekebilir veya gray.800 kullanılabilir.
                                                 // semanticTokens.bgTertiary
        borderWidth: '1px',
        borderColor: mode('gray.200', 'gray.650')(props), // gray.650 için de tanımlama
        boxShadow: 'sm',
        _hover: {
          bg: mode('gray.200', 'gray.700')(props),
          boxShadow: 'md',
        }
      }
    }),
    // "Şık" bir varyant: Belki ince bir gradient kenarlık veya özel bir arkaplan
    stylish: (props) => ({
        container: {
            borderRadius: 'xl',
            bg: mode('white', 'gray.800')(props),
            borderWidth: '1px',
            borderColor: 'transparent', // Başlangıçta transparan
            // İnce bir gradient kenarlık efekti (pseudo-element ile veya borderImage ile daha kompleks)
            // Veya basitçe _before ile bir çizgi eklenebilir
            _before: {
                content: `""`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 'inherit', // Ana border radius'u alsın
                padding: '1px', // Kenarlık kalınlığı
                bg: `linear-gradient(135deg, ${mode(props.theme.colors.brand[300], props.theme.colors.brand[600])(props)}, ${mode(props.theme.colors.blue[400], props.theme.colors.blue[700])(props)})`,
                WebkitMask:
                  'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'destination-out',
                maskComposite: 'exclude',
                zIndex: -1, // Kart içeriğinin altında kalsın
                opacity: 0,
                transition: 'opacity 0.3s ease-in-out',
            },
            boxShadow: 'lg',
            _hover: {
                transform: 'translateY(-5px)',
                boxShadow: 'xl',
                _before: {
                    opacity: 1,
                }
            }
        }
    }),
  },
  // Farklı boyutlar için padding ayarları
  sizes: {
    sm: {
      header: { paddingX: 3, paddingTop: 3, paddingBottom: 1.5, fontSize: 'md' },
      body: { paddingX: 3, paddingY: 3 },
      footer: { paddingX: 3, paddingTop: 1.5, paddingBottom: 3 },
    },
    md: { // Varsayılan boyut
      header: { paddingX: { base: 4, md: 5 }, paddingTop: { base: 4, md: 4 }, paddingBottom: { base: 2, md: 2 }, fontSize: 'lg' },
      body: { paddingX: { base: 4, md: 5 }, paddingY: { base: 4, md: 4 } },
      footer: { paddingX: { base: 4, md: 5 }, paddingTop: { base: 2, md: 3 }, paddingBottom: { base: 4, md: 4 } },
    },
    lg: { // LectureViewPage'de kullanılıyor
      container: { borderRadius: 'xl' }, // Daha büyük kartlar için daha büyük yuvarlaklık
      header: { paddingX: { base: 5, md: 7 }, paddingTop: { base: 5, md: 6 }, paddingBottom: { base: 3, md: 4 }, fontSize: 'xl' },
      body: { paddingX: { base: 5, md: 7 }, paddingY: { base: 5, md: 6 } },
      footer: { paddingX: { base: 5, md: 7 }, paddingTop: { base: 3, md: 4 }, paddingBottom: { base: 5, md: 6 } },
    },
  },
  // Varsayılan olarak kullanılacak props'lar
  defaultProps: {
    variant: 'elevated', // Daha modern ve gölgeli bir varsayılan
    size: 'md',
  },
};

export default Card;
