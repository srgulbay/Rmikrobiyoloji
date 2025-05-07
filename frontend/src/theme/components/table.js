// frontend/src/theme/components/table.js
import { mode } from '@chakra-ui/theme-tools';

const Table = {
  baseStyle: {
    table: {
      fontVariantNumeric: 'lining-nums tabular-nums', // Sayıların hizalanması için
      borderCollapse: 'collapse', // Kenarlıkların birleşmesi
      width: 'full',
    },
    th: {
      fontFamily: 'heading', // Başlık fontu
      fontWeight: 'semibold', // Başlık kalınlığı
      textTransform: 'none', // Büyük harf yok
      letterSpacing: 'wide',
      textAlign: 'start', // Metni sola yasla (varsayılan)
      borderBottomWidth: '1px', // Başlık altı çizgisi
      // Renk ve kenarlık rengi varyanta göre ayarlanacak
    },
    td: {
      textAlign: 'start',
      borderBottomWidth: '1px', // Hücre altı çizgisi
      // Renk ve kenarlık rengi varyanta göre ayarlanacak
    },
    caption: { // Tablo başlığı (TableCaption)
      mt: 4,
      fontFamily: 'body',
      textAlign: 'center',
      fontSize: 'sm',
      // Renk varyanta göre ayarlanacak
    },
  },
  variants: {
    // Sade stil (UserManagement Stats Modal)
    simple: (props) => ({
      th: {
        color: mode('gray.600', 'gray.400')(props), // Başlık rengi
        borderColor: mode('gray.200', 'gray.700')(props), // semanticTokens.borderPrimary
      },
      td: {
        borderColor: mode('gray.200', 'gray.700')(props), // semanticTokens.borderPrimary
        color: mode('gray.700', 'gray.200')(props), // Hücre metin rengi
      },
      caption: {
        color: mode('gray.600', 'gray.400')(props),
      },
      tbody: {
         tr: {
            _hover: { // Satır üzerine gelince hafif arkaplan
                bg: mode('gray.50', 'gray.700')(props),
                // boxShadow: 'inset 0 0 0 1px var(--chakra-colors-gray-100)', // Opsiyonel kenarlık efekti
                // cursor: 'pointer', // Eğer satırlar tıklanabilirse
             }
         }
      }
    }),
    // Çizgili stil (Kodlarınızda sıkça kullanılıyor)
    striped: (props) => ({
      th: {
        color: mode('gray.600', 'gray.400')(props),
        borderBottomWidth: '1px',
        borderColor: mode('gray.200', 'gray.700')(props), // semanticTokens.borderPrimary
      },
      td: {
        borderBottomWidth: '1px',
        borderColor: mode('gray.200', 'gray.700')(props), // semanticTokens.borderPrimary
        color: mode('gray.700', 'gray.200')(props),
      },
      caption: {
        color: mode('gray.600', 'gray.400')(props),
      },
      tbody: {
        tr: {
          '&:nth-of-type(odd)': { // Tekil satırlar
            bg: mode('blackAlpha.50', 'whiteAlpha.50')(props), // Çok hafif çizgili arkaplan (bgTertiary)
          },
          _hover: { // Satır üzerine gelince
             bg: mode('gray.100', 'gray.700')(props), // Hover arkaplanı (çizgiliyi geçersiz kılar)
             // boxShadow: 'inset 0 0 0 1px var(--chakra-colors-gray-200)', // Opsiyonel kenarlık
          }
        },
      },
      thead: { // Başlık satırının arkaplanı (kodlarınızda bg="bgTertiary" vardı)
        th: {
           bg: mode('gray.50', 'gray.800')(props), // Hafif başlık arkaplanı (semanticTokens.bgSecondary)
           // Veya daha belirgin: bg: mode('gray.100', 'gray.700')(props) (semanticTokens.bgTertiary)
        }
      }
    }),
    // Stilsiz
    unstyled: {
      th: { borderBottomWidth: 0, paddingX: 0, paddingY: 0 },
      td: { borderBottomWidth: 0, paddingX: 0, paddingY: 0 },
    },
     // "Modern/Şık" bir varyant: Daha fazla boşluk, ince çizgiler
    stylish: (props) => ({
        table: {
            borderCollapse: 'separate', // Kenarlıkları ayır
            borderSpacing: '0', // Başlangıçta boşluk yok
        },
        thead: {
            th: {
               color: mode('gray.500', 'gray.500')(props),
               fontWeight: 'medium',
               textTransform: 'uppercase', // Bu stilde büyük harf daha iyi durabilir
               fontSize: 'xs',
               letterSpacing: 'wider',
               border: 0, // Kenarlık yok
               borderBottomWidth: '1px', // Sadece altta ince çizgi
               borderColor: mode('gray.200', 'gray.700')(props),
               bg: 'transparent', // Başlık arkaplanı yok
               '&:first-of-type': { borderTopLeftRadius: 'lg' }, // Köşeleri yuvarlat
               '&:last-of-type': { borderTopRightRadius: 'lg' }
            }
        },
        tbody: {
             tr: {
                 color: mode('gray.700', 'gray.200')(props),
                 _hover: {
                     bg: mode('brand.50', 'brand.900')(props), // Marka rengiyle hover
                     boxShadow: 'md', // Hafif gölge
                     color: mode('brand.800', 'brand.100')(props),
                     '&:first-of-type td:first-of-type': { borderBottomLeftRadius: 'lg' }, // Hover'da köşeleri yuvarlat
                     '&:first-of-type td:last-of-type': { borderBottomRightRadius: 'lg' }
                 },
                 '&:last-of-type': { // Son satırın alt çizgisini kaldır
                     td: {
                         borderBottomWidth: 0
                     }
                 },
                 td: {
                     borderBottomWidth: '1px', // İnce satır arası çizgi
                     borderColor: mode('gray.100', 'gray.700')(props), // Çok hafif kenarlık
                     py: 4, // Daha fazla dikey boşluk
                 }
             }
        },
        tfoot: { // Footer stili gerekirse
            tr: {
                '&:last-of-type': {
                    th: { borderBottomWidth: 0 }
                }
            }
        },
        caption: {
            color: mode('gray.500', 'gray.400')(props),
            py: 4,
        }
    }),
  },
  sizes: {
    // Küçük boyut (kodlarınızda kullanılıyor)
    sm: {
      th: { px: '0.75rem', py: '0.5rem', fontSize: 'xs' }, // 12px padding, 8px dikey
      td: { px: '0.75rem', py: '0.5rem', fontSize: 'sm' }, // 12px padding, 8px dikey
      caption: { px: '0.75rem', py: '0.5rem', fontSize: 'xs' },
    },
    // Orta boyut (varsayılan)
    md: {
      th: { px: '1rem', py: '0.75rem', fontSize: 'sm' }, // 16px padding, 12px dikey
      td: { px: '1rem', py: '0.75rem', fontSize: 'md' }, // 16px padding, 12px dikey
      caption: { px: '1rem', py: '0.75rem', fontSize: 'sm' },
    },
    // Büyük boyut
    lg: {
      th: { px: '1.5rem', py: '1rem', fontSize: 'md' }, // 24px padding, 16px dikey
      td: { px: '1.5rem', py: '1rem', fontSize: 'lg' }, // 24px padding, 16px dikey
      caption: { px: '1.5rem', py: '1rem', fontSize: 'md' },
    },
  },
  defaultProps: {
    variant: 'simple', // Daha temiz bir varsayılan
    size: 'md',
    colorScheme: 'gray', // Renk şeması genellikle tablo için relevant değil ama prop olarak var
  },
};

export default Table;
