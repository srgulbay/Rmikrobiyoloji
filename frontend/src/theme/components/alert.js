// frontend/src/theme/components/alert.js
// getColorSchemeContrast kaldırıldı
import { mode, getColor, transparentize } from '@chakra-ui/theme-tools';

// Alert bileşeni için renk şemasına (status) göre renkleri belirleyen yardımcı fonksiyon
const getAlertColors = (props, type = 'bg') => {
  const { theme, colorScheme: c, status } = props;
  const colorScheme = c || status; // Eğer colorScheme prop'u verilmemişse status'u kullan

  // Renk paletinden ilgili renkleri al
  const lightBg = getColor(theme, `${colorScheme}.50`, colorScheme);
  const darkBg = getColor(theme, `${colorScheme}.800`, colorScheme);
  const accentColorLight = getColor(theme, `${colorScheme}.500`, colorScheme);
  const accentColorDark = getColor(theme, `${colorScheme}.300`, colorScheme);
  const textColorLight = getColor(theme, `${colorScheme}.700`, colorScheme);
  const textColorDark = getColor(theme, `${colorScheme}.100`, colorScheme);
  const solidBgLight = getColor(theme, `${colorScheme}.500`, colorScheme);
  const solidBgDark = getColor(theme, `${colorScheme}.400`, colorScheme); // Koyu mod solid için .400 tonu

  // Solid varyant metin rengi için manuel kontrast belirleme
  // Açık mod: Genellikle beyaz, sarı/cyan gibi çok açık renklerde siyah/koyu gri
  const solidTextColorLight = ['yellow', 'cyan', 'gray'].includes(colorScheme) ? 'blackAlpha.800' : 'white';
  // Koyu mod: Genellikle koyu gri/siyah, .400 tonları genellikle açıktır
  const solidTextColorDark = 'gray.900'; // Veya 'black'

  switch (type) {
    case 'subtle-bg':
      return mode(lightBg, darkBg)(props);
    case 'subtle-text':
      return mode(textColorLight, textColorDark)(props);
    case 'left-accent-border':
    case 'top-accent-border':
    case 'icon-color': // İkon rengi için de accent kullanalım
      return mode(accentColorLight, accentColorDark)(props);
    case 'solid-bg':
      return mode(solidBgLight, solidBgDark)(props);
    case 'solid-text':
      // GÜNCELLENDİ: getColorSchemeContrast yerine mode ile manuel kontrast
      return mode(solidTextColorLight, solidTextColorDark)(props);
    default: // Varsayılan olarak ikon rengini veya accent'i döndür
      return mode(accentColorLight, accentColorDark)(props);
  }
};

const Alert = {
  baseStyle: (props) => ({
    container: {
      px: 4,
      py: 3,
      borderRadius: 'md',
      alignItems: 'flex-start',
    },
    icon: {
      flexShrink: 0,
      marginEnd: 3,
      w: 5,
      h: 5,
      // Renk artık varyant içinde belirleniyor (getAlertColors ile)
      color: getAlertColors(props, 'icon-color'),
    },
    title: {
      fontWeight: 'semibold',
      lineHeight: 'short',
      // Renk prop'u container'dan veya varianttan miras alınır
    },
    description: {
      lineHeight: 'base',
      // Renk prop'u container'dan veya varianttan miras alınır
    },
    spinner: {}
  }),
  variants: {
    subtle: (props) => ({
      container: {
        bg: getAlertColors(props, 'subtle-bg'),
      },
      // İkon, başlık ve açıklama renkleri baseStyle'dan veya container'dan miras alınabilir
      // veya burada özel olarak ayarlanabilir:
      // icon: { color: getAlertColors(props, 'icon-color') },
      // title: { color: getAlertColors(props, 'subtle-text') },
      // description: { color: getAlertColors(props, 'subtle-text') },
    }),
    'left-accent': (props) => ({
      container: {
        paddingStart: 3,
        borderStartWidth: '4px',
        borderStartColor: getAlertColors(props, 'left-accent-border'),
        bg: mode('gray.50', 'gray.700')(props), // semanticTokens.bgSecondary
      },
      // icon: { color: getAlertColors(props, 'icon-color') },
      // title/description varsayılan metin renklerini kullanır
    }),
    'top-accent': (props) => ({
      container: {
        paddingTop: 2,
        borderTopWidth: '4px',
        borderTopColor: getAlertColors(props, 'top-accent-border'),
        bg: mode('gray.50', 'gray.700')(props),
      },
      // icon: { color: getAlertColors(props, 'icon-color') },
    }),
    solid: (props) => ({
      container: {
        bg: getAlertColors(props, 'solid-bg'),
        color: getAlertColors(props, 'solid-text'), // Hesaplanan kontrast rengi
      },
      icon: {
        color: getAlertColors(props, 'solid-text'), // Metinle aynı renk
      },
    }),
    stylish: (props) => ({
        container: {
            borderRadius: 'lg',
            bg: mode('white', 'gray.700')(props),
            borderWidth: '1px',
            borderColor: getAlertColors(props, 'left-accent-border'),
            boxShadow: mode(props.theme.shadows.sm, props.theme.shadows.md)(props),
            padding: 5,
            _dark: {
                borderColor: getAlertColors(props, 'left-accent-border'),
            }
        },
        icon: {
            color: getAlertColors(props, 'icon-color'),
            boxSize: 6,
        },
        title: {
            color: mode('gray.800', 'whiteAlpha.900')(props), // textPrimary
        },
        description: {
            color: mode('gray.600', 'gray.300')(props), // textSecondary
        }
    })
  },
  defaultProps: {
    variant: 'subtle',
  },
};

export default Alert;