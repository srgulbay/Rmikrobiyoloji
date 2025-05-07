// frontend/src/theme/components/modal.js
import { mode } from '@chakra-ui/theme-tools';

const Modal = {
  baseStyle: (props) => ({
    overlay: {
      bg: 'blackAlpha.600', // Yarı saydam siyah overlay
      // Modern bir blur efekti (Tarayıcı desteğini kontrol edin)
      // backdropFilter: 'blur(8px) saturate(150%)',
      // Firefox için eski yöntem (daha az performanslı olabilir)
      // '@supports (backdrop-filter: none) or (-webkit-backdrop-filter: none)': {
      //    backdropFilter: 'blur(8px) saturate(150%)',
      // },
      // '@supports not (backdrop-filter: none)': { // Fallback for browsers without backdrop-filter
      //   bg: 'rgba(0, 0, 0, 0.7)', // Daha koyu bir overlay
      // },
      zIndex: 'modal', // Chakra'nın zIndex skalasından 'modal'
    },
    dialogContainer: { // Modalı ortalamak için kullanılan Flex container
      display: 'flex',
      zIndex: 'modal',
      justifyContent: 'center',
      alignItems: props.isCentered ? 'center' : 'flex-start', // isCentered prop'una göre hizalama
      overflow: 'auto', // İçerik sığmazsa kaydırma sağlar
      overscrollBehaviorY: 'none', // Sayfanın kendisinin kaymasını engelle
    },
    dialog: { // ModalContent'in kendisi
      borderRadius: 'xl', // Daha modern ve yumuşak köşeler için 'lg' veya 'xl'
      bg: mode('white', 'gray.700')(props), // semanticTokens.bgPrimary
      color: 'inherit', // Metin rengi body'den miras alınır
      my: '3.75rem', // Dikeyde boşluk (özellikle mobil ve isCentered=false için)
      mx: 'auto', // Yatayda ortalama
      zIndex: 'modal',
      boxShadow: mode('lg', 'dark-lg')(props), // Açık modda lg, koyu modda daha belirgin bir gölge
      overflow: 'hidden', // border-radius'ün düzgün çalışması için
      maxH: 'calc(100% - 7.5rem)', // Dikey boşlukları hesaba katarak maksimum yükseklik
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      px: { base: 4, md: 6 },
      py: 4,
      fontSize: 'xl',
      fontWeight: 'semibold',
      // borderBottomWidth: '1px', // Opsiyonel alt çizgi
      // borderColor: mode('gray.100', 'gray.600')(props),
    },
    closeButton: {
      position: 'absolute',
      top: 3, // Biraz içeriden başlasın
      right: 3,
      borderRadius: 'md', // Buton stiliyle uyumlu
      bg: 'transparent',
      color: mode('gray.500', 'gray.300')(props),
      transitionProperty: 'common',
      transitionDuration: 'normal',
      _hover: {
        bg: mode('gray.100', 'whiteAlpha.100')(props),
        color: mode('gray.700', 'whiteAlpha.700')(props),
        transform: 'scale(1.1)',
      },
      _active: {
        bg: mode('gray.200', 'whiteAlpha.200')(props),
        transform: 'scale(0.95)',
      },
      _focusVisible: {
        boxShadow: 'outline',
        bg: mode('gray.100', 'whiteAlpha.100')(props),
      },
    },
    body: {
      px: { base: 4, md: 6 },
      py: { base: 4, md: 5 },
      flex: '1', // İçeriğin büyümesini sağlar
      // scrollBehavior="inside" prop'u verildiğinde overflow otomatik olarak ayarlanır
      // Gerekirse manuel overflow: 'auto' eklenebilir.
    },
    footer: {
      px: { base: 4, md: 6 },
      py: 4,
      // borderTopWidth: '1px', // Opsiyonel üst çizgi
      // borderColor: mode('gray.100', 'gray.600')(props),
      display: 'flex',
      justifyContent: 'flex-end', // Butonları sağa yasla
      gap: 3, // Butonlar arası boşluk
    },
  }),
  // Farklı modal boyutları için 'dialog' (ModalContent) stilleri
  sizes: {
    xs: { dialog: { maxW: 'xs' } },
    sm: { dialog: { maxW: 'sm' } },
    md: { dialog: { maxW: 'md' } }, // Varsayılan
    lg: { dialog: { maxW: 'lg' } },
    xl: { dialog: { maxW: 'xl' } }, // UserManagement İstatistik Modalı
    '2xl': { dialog: { maxW: '2xl' } },
    '3xl': { dialog: { maxW: '3xl' } },
    '4xl': { dialog: { maxW: '4xl' } },
    '5xl': { dialog: { maxW: '5xl' } },
    '6xl': { dialog: { maxW: '6xl' } },
    full: { // Tam ekran modalı
      dialog: {
        maxW: '100vw',
        minH: '100vh',
        my: 0, // Dikey boşlukları sıfırla
        borderRadius: 0, // Köşe yuvarlaklığını sıfırla
      }
    },
  },
  defaultProps: {
    size: 'md',
    // isCentered prop'u bileşen kullanımında belirlenir.
    // motionPreset: 'slideInBottom' // Varsayılan giriş animasyonu (Chakra UI'ın kendi animasyonları)
  },
};

export default Modal;
