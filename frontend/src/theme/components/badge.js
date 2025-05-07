// frontend/src/theme/components/badge.js
// getColorSchemeContrast kaldırıldı
import { mode, transparentize } from '@chakra-ui/theme-tools';

const Badge = {
  baseStyle: {
    px: 2.5,
    py: 1,
    borderRadius: 'md',
    fontWeight: 'semibold',
    fontSize: 'xs',
    textTransform: 'none',
    lineHeight: 'short',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    transitionProperty: 'common',
    transitionDuration: 'fast',
  },
  variants: {
    // Dolgulu (Solid) Varyant
    solid: (props) => {
      const { colorScheme: c } = props; // theme kaldırıldı

      // Koyu mod için arkaplan rengi
      const darkBg = `${c}.300`; // Koyu modda rengin 300 tonu

      // Açık mod metin rengi: Genellikle beyaz, sarı/cyan/gri için koyu
      const lightColor = ['yellow', 'cyan', 'gray'].includes(c) ? 'gray.800' : 'white';
      // Koyu mod metin rengi: Genellikle koyu gri/siyah (.300 tonu için)
      // Gri renk şeması koyu modda farklı olabilir
      const darkColor = c === 'gray' ? 'whiteAlpha.900' : 'gray.800';

      return {
        bg: mode(`${c}.500`, darkBg)(props), // Arkaplan rengi
        color: mode(lightColor, darkColor)(props), // mode ile belirlenen metin rengi
      };
    },
    // Hafif Arkaplanlı (Subtle) Varyant
    subtle: (props) => {
      const { colorScheme: c, theme } = props; // transparentize için theme gerekli
      const darkSubtleBg = transparentize(`${c}.200`, 0.16)(theme);
      return {
        bg: mode(`${c}.100`, darkSubtleBg)(props),
        color: mode(`${c}.700`, `${c}.200`)(props),
      };
    },
    // Dış Çizgili (Outline) Varyant
    outline: (props) => {
      const { colorScheme: c } = props;
      const color = mode(`${c}.600`, `${c}.200`)(props); // Metin rengini al
      return {
        color: color, // Metin rengini ayarla
        // Gölge ile kenarlık efekti, metin rengini kullanır
        boxShadow: `inset 0 0 0px 1px ${color}`,
      };
    },
    // Pill (Hap) Varyantı
    pill: (props) => {
        const { colorScheme: c, theme } = props; // transparentize için theme gerekli
        const darkPillBg = transparentize(`${c}.300`, 0.2)(theme);
        return {
            borderRadius: 'full',
            px: 3,
            py: 1,
            fontSize: 'xs',
            fontWeight: 'medium',
            bg: mode(`${c}.100`, darkPillBg)(props),
            color: mode(`${c}.800`, `${c}.100`)(props),
            boxShadow: mode('xs', 'none')(props),
        };
    }
  },
  defaultProps: {
    variant: 'subtle',
    colorScheme: 'gray',
  },
};

export default Badge;