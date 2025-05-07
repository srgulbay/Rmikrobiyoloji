// frontend/src/theme/components/tabs.js
// getColorSchemeContrast kaldırıldı
import { mode } from '@chakra-ui/theme-tools';

const Tabs = {
  baseStyle: (props) => ({
    root: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    },
    tablist: {
      display: 'flex',
      alignItems: 'center',
    },
    tab: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'semibold',
      fontSize: 'md',
      color: mode('gray.600', 'gray.400')(props),
      transitionProperty: 'common',
      transitionDuration: 'normal',
      whiteSpace: 'nowrap',
      _focusVisible: {
        zIndex: 1,
        boxShadow: 'outline',
      },
      _disabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
    tabpanel: {
      padding: 0,
    },
    indicator: {},
  }),
  variants: {
    'soft-rounded': (props) => {
      const { colorScheme: c } = props;
      // Manuel Kontrast Renkleri (.100 ve .700 arkaplanlar için)
      const lightSelectedColor = mode(`${c}.700`, `${c}.100`)(props); // Açık modda .100 bg -> .700 text, Koyu modda .700 bg -> .100 text
      const darkSelectedColor = mode(`${c}.700`, `${c}.100`)(props); // Yukarıdaki ile aynı mantık

      return {
        tab: {
          borderRadius: 'full',
          fontWeight: 'medium',
          color: mode('gray.700', 'gray.300')(props),
          paddingX: 4,
          paddingY: 2,
          _selected: {
            // GÜNCELLENDİ: mode ile manuel kontrast
            color: mode(lightSelectedColor, darkSelectedColor)(props),
            bg: mode(`${c}.100`, `${c}.700`)(props),
            boxShadow: mode('sm', 'none')(props),
          },
          _hover: {
            bg: mode(`${c}.50`, `${c}.800`)(props),
          },
          _active: {
            bg: mode(`${c}.200`, `${c}.600`)(props),
          }
        },
      };
    },
    line: (props) => {
      const { colorScheme: c, orientation } = props;
      const borderProp = orientation === 'vertical' ? 'borderStart' : 'borderBottom';
      const marginProp = orientation === 'vertical' ? 'marginStart' : 'marginBottom';

      return {
        tablist: {
          [borderProp]: '2px solid',
          borderColor: mode('gray.200', 'gray.700')(props),
        },
        tab: {
          [borderProp]: '2px solid',
          borderColor: 'transparent',
          [marginProp]: '-2px',
          color: mode('gray.600', 'gray.400')(props),
          _selected: {
            color: mode(`${c}.600`, `${c}.300`)(props),
            borderColor: 'currentColor',
          },
          _hover: {
            borderColor: mode('gray.300', 'gray.600')(props),
          },
          _active: {
            bg: mode('gray.100', 'gray.700')(props),
          },
        },
      };
    },
    enclosed: (props) => {
      const { colorScheme: c } = props;
      return {
        tablist: {
            borderBottomColor: mode('gray.200', 'gray.700')(props),
            borderBottomWidth: '1px',
            mb: '-1px',
        },
        tab: {
          borderTopRadius: 'md',
          borderWidth: '1px',
          borderColor: 'transparent',
          mb: '-1px',
          bg: mode('gray.50', 'gray.800')(props),
          color: mode('gray.600', 'gray.400')(props),
          _selected: {
            color: mode(`${c}.700`, `${c}.100`)(props),
            bg: mode('white', 'gray.700')(props),
            borderColor: mode('gray.200', 'gray.700')(props),
            borderBottomColor: mode('white', 'gray.700')(props),
          },
        },
      };
    },
    pills: (props) => {
        const { colorScheme: c } = props;
        // Manuel Kontrast Renkleri (.500 ve .300 arkaplanlar için - Button solid gibi)
        const lightPillColor = ['yellow', 'cyan', 'gray'].includes(c) ? 'gray.800' : 'white';
        const darkPillColor = c === 'gray' ? 'whiteAlpha.900' : 'gray.800';

        return {
            tab: {
                borderRadius: 'lg',
                fontWeight: 'semibold',
                color: mode('gray.700', 'gray.300')(props),
                px: { base: 3, md: 4 },
                py: { base: 1.5, md: 2 },
                transition: 'all 0.3s ease-out',
                _selected: {
                    // GÜNCELLENDİ: mode ile manuel kontrast
                    color: mode(lightPillColor, darkPillColor)(props),
                    bg: mode(`${c}.500`, `${c}.300`)(props),
                    boxShadow: 'md',
                },
                _hover: {
                    bg: !props.isSelected ? mode('gray.100', 'gray.700')(props) : undefined,
                },
                _active: {
                    transform: 'scale(0.97)',
                }
            }
        }
    }
  },
  sizes: {
    sm: { tab: { fontSize: 'sm', px: 3, py: 1.5, }, },
    md: { tab: { fontSize: 'md', px: 4, py: 2, }, },
    lg: { tab: { fontSize: 'lg', px: 5, py: 2.5, }, },
  },
  defaultProps: {
    variant: 'soft-rounded',
    size: 'md',
    colorScheme: 'brand',
  },
};

export default Tabs;