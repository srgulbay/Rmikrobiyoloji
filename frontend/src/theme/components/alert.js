// frontend/src/theme/components/alert.js
import { mode, getColor, getColorSchemeContrast } from '@chakra-ui/theme-tools';

// Alert bileşeni için renk şemasına (status) göre renkleri belirleyen yardımcı fonksiyon
const getAlertColors = (props, type = 'bg') => {
  const { theme, colorScheme: c, status } = props;
  const colorScheme = c || status; // Eğer colorScheme prop'u verilmemişse status'u kullan

  // Renk paletinden ilgili renkleri al
  // Örn: colorScheme 'green' ise green.500, green.50 vb.
  // Not: Bu renklerin temanızdaki colors.js'de tanımlı olması gerekir.
  const lightBg = getColor(theme, `${colorScheme}.50`, colorScheme);
  const darkBg = getColor(theme, `${colorScheme}.800`, colorScheme); // Koyu modda daha koyu bir arkaplan
  const accentColorLight = getColor(theme, `${colorScheme}.500`, colorScheme);
  const accentColorDark = getColor(theme, `${colorScheme}.300`, colorScheme);
  const textColorLight = getColor(theme, `${colorScheme}.700`, colorScheme);
  const textColorDark = getColor(theme, `${colorScheme}.100`, colorScheme);
  const solidBgLight = getColor(theme, `${colorScheme}.500`, colorScheme);
  const solidBgDark = getColor(theme, `${colorScheme}.400`, colorScheme);

  switch (type) {
    case 'subtle-bg':
      return mode(lightBg, darkBg)(props);
    case 'subtle-text':
      return mode(textColorLight, textColorDark)(props);
    case 'left-accent-border':
    case 'top-accent-border':
      return mode(accentColorLight, accentColorDark)(props);
    case 'solid-bg':
      return mode(solidBgLight, solidBgDark)(props);
    case 'solid-text':
      // Solid varyantında metin rengi genellikle arkaplanla kontrast oluşturur
      return mode(
        getColorSchemeContrast(theme, colorScheme, solidBgLight), // Açık modda kontrast renk
        getColorSchemeContrast(theme, colorScheme, solidBgDark)   // Koyu modda kontrast renk
      )(props) || mode('white', 'gray.900')(props); // Fallback
    default:
      return mode(accentColorLight, accentColorDark)(props); // İkon rengi için
  }
};

const Alert = {
  baseStyle: (props) => ({
    container: {
      px: 4, // Yatay padding
      py: 3, // Dikey padding
      borderRadius: 'md', // Temadaki radii.md
      alignItems: 'flex-start', // İkon ve metinlerin dikeyde başlangıca hizalanması
      // transitionProperty: 'common', // Renk geçişleri için
      // transitionDuration: 'normal',
    },
    icon: {
      flexShrink: 0,
      marginEnd: 3, // İkon ile metin arası boşluk (rtl desteği için marginEnd)
      w: 5, // İkon genişliği
      h: 5, // İkon yüksekliği
      // Renk, varyanta ve statüye göre ayarlanacak
    },
    title: {
      fontWeight: 'semibold', // Başlık font ağırlığı
      lineHeight: 'short', // Satır yüksekliği
      // Renk, varyanta ve statüye göre ayarlanacak
    },
    description: {
      lineHeight: 'base', // Açıklama satır yüksekliği
      // Renk, varyanta ve statüye göre ayarlanacak
    },
    spinner: { // Yükleme durumu için spinner
      // Gerekirse stil eklenebilir
    }
  }),
  variants: {
    // Hafif arkaplanlı, metin rengi vurgulu (kodlarınızda kullanılıyor)
    subtle: (props) => ({
      container: {
        bg: getAlertColors(props, 'subtle-bg'),
      },
      icon: {
        color: getAlertColors(props, 'icon-color'), // Genellikle accent rengi
      },
      title: {
        color: getAlertColors(props, 'subtle-text'),
      },
      description: {
        color: getAlertColors(props, 'subtle-text'),
      },
    }),
    // Sol kenarı çizgili (kodlarınızda kullanılıyor)
    'left-accent': (props) => ({
      container: {
        paddingStart: 3, // Sol padding (rtl desteği için paddingStart)
        borderStartWidth: '4px', // Sol kenarlık kalınlığı
        borderStartColor: getAlertColors(props, 'left-accent-border'),
        bg: mode('gray.50', 'gray.700')(props), // Hafif bir arkaplan (semanticTokens.bgSecondary)
      },
      icon: {
        color: getAlertColors(props, 'icon-color'),
      },
      // title ve description renkleri varsayılan metin renklerini kullanabilir (textPrimary, textSecondary)
    }),
    // Üst kenarı çizgili
    'top-accent': (props) => ({
      container: {
        paddingTop: 2,
        borderTopWidth: '4px',
        borderTopColor: getAlertColors(props, 'top-accent-border'),
        bg: mode('gray.50', 'gray.700')(props),
      },
      icon: {
        color: getAlertColors(props, 'icon-color'),
      },
    }),
    // Tamamen dolgulu
    solid: (props) => ({
      container: {
        bg: getAlertColors(props, 'solid-bg'),
        color: getAlertColors(props, 'solid-text'), // Metin rengi arkaplanla kontrast olmalı
      },
      icon: {
        // Solid varyantta ikon rengi genellikle metin rengiyle aynı veya biraz daha açık/koyu olabilir
        color: getAlertColors(props, 'solid-text'),
        opacity: 0.8, // İkonu biraz daha soluk yapabiliriz
      },
      title: {
         // color prop'u container'dan miras alınır
      },
      description: {
         // color prop'u container'dan miras alınır
      }
    }),
    // "Modern/Şık" bir varyant: Hafif gölgeli, daha yumuşak
    stylish: (props) => ({
        container: {
            borderRadius: 'lg', // Daha yumuşak köşeler
            bg: mode('white', 'gray.700')(props), // Temiz bir arkaplan
            borderWidth: '1px',
            borderColor: getAlertColors(props, 'left-accent-border'), // Kenarlık status renginde
            boxShadow: mode(props.theme.shadows.sm, props.theme.shadows.md)(props), // Hafif bir gölge
            padding: 5, // Biraz daha fazla padding
            _dark: {
                borderColor: getAlertColors(props, 'left-accent-border'), // Koyu modda da kenarlık rengi
            }
        },
        icon: {
            color: getAlertColors(props, 'icon-color'),
            boxSize: 6, // Biraz daha büyük ikon
        },
        title: {
            color: mode('gray.800', 'whiteAlpha.900')(props),
        },
        description: {
            color: mode('gray.600', 'gray.300')(props),
        }
    })
  },
  defaultProps: {
    variant: 'subtle', // Varsayılan alert varyantı
    // colorScheme (status) prop ile otomatik ayarlanır.
  },
};

export default Alert;
