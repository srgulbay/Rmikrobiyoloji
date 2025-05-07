// frontend/src/theme/components/input.js
import { mode } from '@chakra-ui/theme-tools';

// Input, Textarea ve Select için ortak temel stiller
const commonFieldStyles = (props) => ({
  bg: mode('white', 'gray.700')(props), // semanticTokens.inputBg ile eşleşmeli
  borderColor: mode('gray.300', 'gray.600')(props), // semanticTokens.borderPrimary veya borderSecondary
  borderRadius: 'md', // Temadaki radii.md
  color: mode('gray.800', 'whiteAlpha.900')(props), // semanticTokens.textPrimary
  transitionProperty: 'common',
  transitionDuration: 'normal',
  _placeholder: {
    color: mode('gray.500', 'gray.400')(props), // semanticTokens.inputPlaceholder
  },
  _hover: {
    borderColor: mode('gray.400', 'gray.500')(props),
  },
  _focusVisible: {
    borderColor: mode('brand.500', 'brand.300')(props),
    boxShadow: `0 0 0 1px ${mode(props.theme.colors.brand[500], props.theme.colors.brand[300])(props)}`,
    zIndex: 1,
  },
  _disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    bg: mode('gray.100', 'gray.750')(props), // gray.750 yoksa gray.700 kullanın
    borderColor: mode('gray.200', 'gray.600')(props),
  },
  _invalid: {
    borderColor: mode('red.500', 'red.300')(props),
    boxShadow: `0 0 0 1px ${mode(props.theme.colors.red[500], props.theme.colors.red[300])(props)}`,
  },
});

const Input = {
  baseStyle: {
    field: {
      width: '100%',
      minWidth: 0,
      outline: 0,
      position: 'relative',
      appearance: 'none',
    },
    addon: {} // Gerekirse Addon stilleri
  },
  variants: {
    outline: (props) => ({ field: { borderWidth: '1px', ...commonFieldStyles(props), } }),
    filled: (props) => ({
      field: {
        borderWidth: '1px', borderColor: 'transparent', bg: mode('gray.100', 'gray.750')(props), ...commonFieldStyles(props),
        _hover: { bg: mode('gray.200', 'gray.650')(props), borderColor: 'transparent', },
        _focusVisible: { bg: mode('white', 'gray.700')(props), borderColor: mode('brand.500', 'brand.300')(props), boxShadow: `0 0 0 1px ${mode(props.theme.colors.brand[500], props.theme.colors.brand[300])(props)}`,},
      },
    }),
    flushed: (props) => ({
      field: {
        borderBottomWidth: '1px', borderRadius: '0', px: '0', bg: 'transparent', ...commonFieldStyles(props),
        _hover: { borderColor: mode('gray.400', 'gray.500')(props), },
        _focusVisible: { borderColor: mode('brand.500', 'brand.300')(props), boxShadow: 'none', },
      },
    }),
    stylish: (props) => ({ // Örnek modern varyant
        field: {
            borderWidth: '1px', borderColor: 'transparent', bg: mode('gray.50', 'gray.800')(props), borderRadius: 'lg', boxShadow: 'sm', color: mode('gray.900', 'whiteAlpha.900')(props), transitionProperty: 'common', transitionDuration: 'fast',
            _placeholder: { color: mode('gray.500', 'gray.400')(props), },
            _hover: { borderColor: mode('brand.200', 'brand.600')(props), },
            _focusVisible: { borderColor: 'transparent', bg: mode('white', 'gray.700')(props), boxShadow: `0 0 0 2px ${mode(props.theme.colors.brand[400], props.theme.colors.brand[400])(props)}, ${props.theme.shadows.md}`, zIndex: 1, },
        }
    })
  },
  sizes: {
    lg: { field: { fontSize: 'lg', px: 4, h: '3.25rem', borderRadius: 'md' }, addon: { fontSize: 'lg', px: 4, h: '3.25rem', borderRadius: 'md' },},
    md: { field: { fontSize: 'md', px: 4, h: '2.75rem', borderRadius: 'md' }, addon: { fontSize: 'md', px: 4, h: '2.75rem', borderRadius: 'md' },},
    sm: { field: { fontSize: 'sm', px: 3, h: '2.25rem', borderRadius: 'sm' }, addon: { fontSize: 'sm', px: 3, h: '2.25rem', borderRadius: 'sm' },},
    xs: { field: { fontSize: 'xs', px: 2, h: '1.75rem', borderRadius: 'sm' }, addon: { fontSize: 'xs', px: 2, h: '1.75rem', borderRadius: 'sm' },}
  },
  defaultProps: { variant: 'outline', size: 'md', },
};

const Select = {
  baseStyle: (props) => ({ // props eklendi
    field: {
      ...Input.baseStyle.field, // Input'tan temel field stillerini miras al
      appearance: 'none',
      paddingBottom: '1px',
      lineHeight: 'normal',
      cursor: 'pointer',
    },
    icon: {
      color: mode('gray.600', 'whiteAlpha.600')(props), // props kullanıldı
      fontSize: '1.25rem',
      // right: '0.5rem' // Chakra bunu yönetir
    },
  }),
  variants: {
    outline: (props) => ({ field: { borderWidth: '1px', ...commonFieldStyles(props), } }),
    filled: (props) => ({ field: { ...Input.variants.filled(props).field, } }),
    flushed: (props) => ({ field: { ...Input.variants.flushed(props).field, } }),
    stylish: (props) => ({ field: { ...Input.variants.stylish(props).field, } })
  },
  sizes: {
    lg: { field: Input.sizes.lg.field, icon: { insetEnd: '0.75rem' } },
    md: { field: Input.sizes.md.field, icon: { insetEnd: '0.5rem' } },
    sm: { field: Input.sizes.sm.field, icon: { insetEnd: '0.5rem' } },
    xs: { field: Input.sizes.xs.field, icon: { insetEnd: '0.25rem' } },
  },
  defaultProps: { variant: 'outline', size: 'md', },
};

const Textarea = {
  baseStyle: (props) => ({
    width: '100%', minRows: 3, outline: 0, position: 'relative', appearance: 'none',
    paddingY: '0.5rem', minHeight: '5rem', lineHeight: 'short',
    ...commonFieldStyles(props), // props eklendi
  }),
  variants: {
    outline: (props) => ({ borderWidth: '1px', ...commonFieldStyles(props), }),
    filled: (props) => ({
        borderWidth: '1px', borderColor: 'transparent', bg: mode('gray.100', 'gray.750')(props), ...commonFieldStyles(props),
        _hover: { bg: mode('gray.200', 'gray.650')(props), borderColor: 'transparent', },
        _focusVisible: { bg: mode('white', 'gray.700')(props), borderColor: mode('brand.500', 'brand.300')(props), boxShadow: `0 0 0 1px ${mode(props.theme.colors.brand[500], props.theme.colors.brand[300])(props)}`,},
    }),
    flushed: (props) => ({
        borderBottomWidth: '1px', borderRadius: '0', px: '0', bg: 'transparent', ...commonFieldStyles(props),
        _hover: { borderColor: mode('gray.400', 'gray.500')(props), },
        _focusVisible: { borderColor: mode('brand.500', 'brand.300')(props), boxShadow: 'none', },
    }),
    stylish: (props) => ({ ...Input.variants.stylish(props).field, minHeight: '6rem', })
  },
  sizes: {
    lg: { fontSize: 'lg', px: 4, borderRadius: 'md' },
    md: { fontSize: 'md', px: 4, borderRadius: 'md' },
    sm: { fontSize: 'sm', px: 3, borderRadius: 'sm' },
    xs: { fontSize: 'xs', px: 2, borderRadius: 'sm' }
  },
  defaultProps: { variant: 'outline', size: 'md', },
};

// Named export kullan
export { Input, Select, Textarea };
