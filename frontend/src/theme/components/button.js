// frontend/src/theme/components/button.js
import { mode } from '@chakra-ui/theme-tools'; // getColorSchemeContrast kaldırıldı

const Button = {
  // Temel stil tüm buton varyantları için geçerlidir
  baseStyle: {
    fontWeight: 'semibold',
    textTransform: 'none',
    borderRadius: 'md',
    letterSpacing: 'wide',
    transitionProperty: 'common',
    transitionDuration: 'normal',
    _focusVisible: {
      boxShadow: 'outline',
      outline: 'none',
    },
    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
      boxShadow: 'none',
    },
  },
  // Farklı buton varyantları için stiller
  variants: {
    // Dolgulu (Solid) Butonlar
    solid: (props) => {
       const { colorScheme: c } = props; // theme kaldırıldı, getColorSchemeContrast kullanılmıyor

       // Koyu mod için arkaplan rengi (Örnek: .300 tonu)
       const darkBg = `${c}.300`;

       // Açık mod metin rengi: Genellikle beyaz, gri için koyu
       const lightColor = c === 'gray' ? 'gray.800' : 'white';
       // Koyu mod metin rengi: Genellikle koyu gri/siyah,
       // açık renkli arkaplanlarda (örn: yellow.300) koyu,
       // koyu renkli arkaplanlarda (örn: gray.300) açık olabilir.
       // Genel bir kural olarak .300 tonları için koyu metin varsayalım:
       const darkColor = c === 'gray' ? 'whiteAlpha.900' : 'gray.800'; // Gri scheme hariç koyu metin

       return {
          bg: mode(`${c}.500`, darkBg)(props), // Arkaplan rengi
          color: mode(lightColor, darkColor)(props), // Metin rengi mode ile ayarlandı

          _hover: {
              bg: mode(`${c}.600`, `${c}.400`)(props),
              transform: 'translateY(-2px)',
              boxShadow: 'md',
              _disabled: {
                  bg: mode(`${c}.500`, darkBg)(props),
                  transform: 'none',
                  boxShadow: 'none',
              },
          },
          _active: {
              bg: mode(`${c}.700`, `${c}.500`)(props),
              transform: 'translateY(0px)',
              boxShadow: 'sm',
          },
       }
    },
    // Dış Çizgili (Outline) Butonlar
    outline: (props) => ({
      border: '2px solid',
      borderColor: mode(`${props.colorScheme}.500`, `${props.colorScheme}.300`)(props),
      color: mode(`${props.colorScheme}.600`, `${props.colorScheme}.200`)(props),
      _hover: {
        bg: mode(`${props.colorScheme}.50`, `whiteAlpha.100`)(props),
        borderColor: mode(`${props.colorScheme}.600`, `${props.colorScheme}.400`)(props),
        color: mode(`${props.colorScheme}.700`, `${props.colorScheme}.100`)(props),
        transform: 'translateY(-1px)',
      },
      _active: {
        bg: mode(`${props.colorScheme}.100`, `whiteAlpha.200`)(props),
        transform: 'translateY(0px)',
      },
    }),
    // Hayalet (Ghost) Butonlar
    ghost: (props) => ({
      color: mode(`${props.colorScheme}.600`, `${props.colorScheme}.200`)(props),
      _hover: {
        bg: mode(`${props.colorScheme}.50`, `whiteAlpha.100`)(props),
        color: mode(`${props.colorScheme}.700`, `${props.colorScheme}.100`)(props),
      },
      _active: {
        bg: mode(`${props.colorScheme}.100`, `whiteAlpha.200`)(props),
      },
    }),
    // Link Gibi Görünen Butonlar
    link: (props) => ({
      color: mode(`${props.colorScheme}.600`, `${props.colorScheme}.200`)(props),
      textDecoration: 'none',
      fontWeight: 'medium',
      _hover: {
        color: mode(`${props.colorScheme}.700`, `${props.colorScheme}.100`)(props),
        textDecoration: 'underline',
      },
      _active: {
        color: mode(`${props.colorScheme}.800`, `${props.colorScheme}.50`)(props),
      },
      height: 'auto', px: 0, py: 0,
    }),
    // İkincil Buton (Örnek)
    secondary: (props) => ({
       border: '1px solid',
       borderColor: 'borderPrimary', // Semantic token
       color: 'textSecondary', // Semantic token
       bg: 'transparent',
       _hover: {
         bg: 'bgTertiary',
         borderColor: 'borderSecondary',
         color: 'textPrimary',
       },
       _active: {
         bg: mode('gray.200', 'gray.600')(props),
         borderColor: 'borderSecondary',
       }
     }),
  },
  // Farklı buton boyutları
  sizes: {
    xs: { h: '1.75rem', minW: '1.75rem', fontSize: 'xs', px: '0.5rem' },
    sm: { h: '2.25rem', minW: '2.25rem', fontSize: 'sm', px: '0.75rem' },
    md: { h: '2.75rem', minW: '2.75rem', fontSize: 'md', px: '1rem' },
    lg: { h: '3.25rem', minW: '3.25rem', fontSize: 'lg', px: '1.5rem' },
  },
  // Varsayılan olarak kullanılacak props'lar
  defaultProps: {
    variant: 'solid',
    size: 'md',
    colorScheme: 'brand',
  },
};

export default Button;