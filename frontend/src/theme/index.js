// frontend/src/theme/index.js
import { extendTheme } from "@chakra-ui/react";

// 1. Tema Modüllerini Import Et
import colors from "./colors";       // Renk paletleri
import typography from "./typography"; // Fontlar, boyutlar, ağırlıklar vb.
import space from "./spacing";         // Boşluk ve boyut skalası (spacing.js 'space' olarak export ediliyor)
import breakpoints from "./breakpoints"; // Ekran kırılma noktaları
import radii from "./radii";         // Kenar yuvarlaklıkları
import shadows from "./shadows";       // Gölge stilleri
import styles from "./styles";         // Global stiller (body, a etiketleri vb.)

// 2. Bileşen Stillerini Import Et (Bunları bir sonraki adımda oluşturacağız)
import Button from "./components/button";
import Card from "./components/card";
import Input from "./components/input"; // Input, Textarea, Select için temel stil olabilir
import Alert from "./components/alert";
import Badge from "./components/badge";
import Tabs from "./components/tabs";
import Modal from "./components/modal";
import Table from "./components/table";
import Link from "./components/link";
// ... diğer bileşenler eklenecek

// 3. Tema Konfigürasyonu (Opsiyonel)
const config = {
  initialColorMode: "light", // Varsayılan renk modu ('light', 'dark', 'system')
  useSystemColorMode: false, // Kullanıcının sistem tercihini otomatik algılasın mı?
};

// 4. Semantik Token'lar (Kodlarınızdaki textPrimary, bgSecondary vb. için)
// Bu token'lar, renk moduna göre otomatik olarak değişir.
// Kullanım: <Text color="textPrimary">...</Text> veya <Box bg="bgPrimary">...</Box>
const semanticTokens = {
  colors: {
    // Metin Renkleri
    textPrimary: {
      default: "gray.700", // Açık mod için
      _dark: "whiteAlpha.900", // Koyu mod için
    },
    textSecondary: {
      default: "gray.600",
      _dark: "gray.400",
    },
    textMuted: { // Daha soluk metinler için (örn: UserStats ID, LectureViewPage notu)
      default: "gray.500",
      _dark: "gray.500", // Koyu modda da biraz soluk kalabilir veya gray.400
    },
    // Arkaplan Renkleri
    bgPrimary: { // Ana sayfa/konteyner arkaplanı (styles.global.body.bg ile uyumlu olmalı)
      default: "white", // Veya colors.gray[50] eğer styles.global'de öyleyse
      _dark: "gray.800",  // Veya colors.gray[900]
    },
    bgSecondary: { // Kartlar, bölümler için biraz farklı arkaplan (AdminStatsOverview, TopicNode, SolvePage Başlık)
      default: "gray.50",
      _dark: "gray.700", // Veya gray.800 eğer bgPrimary daha koyuysa
    },
    bgTertiary: { // Tablo başlıkları, daha az önemli arkaplanlar (MyStatsPage özet kutuları)
      default: "gray.100",
      _dark: "gray.600",
    },
    // Kenarlık Renkleri
    borderPrimary: { // Ana kenarlıklar (TopicBrowserPage Aktif Konu, SolvePage Başlık)
      default: "gray.200",
      _dark: "gray.700",
    },
    borderSecondary: { // Daha az önemli kenarlıklar (AdminStatsOverview Tablo, TopicNode)
      default: "gray.300", // Veya borderPrimary ile aynı olabilir
      _dark: "gray.600",
    },
    // Vurgu Rengi (Accent)
    accent: { // Breadcrumb hover gibi yerlerde kullanılabilir
      default: "brand.500", // Marka renginin bir tonu
      _dark: "brand.300",
    },
    // Form elemanları için
    inputBg: { // Login, Register sayfalarındaki inputlar
        default: 'gray.100',
        _dark: 'gray.700'
    },
    inputPlaceholder: {
        default: 'gray.500',
        _dark: 'gray.400'
    }
  },
  shadows: {
    // Örnek semantik gölge
    // cardShadow: {
    //   default: shadows.md,
    //   _dark: shadows.lg, // Koyu modda gölgeler farklı olabilir
    // }
  }
};


// 5. Tüm Parçaları Birleştir
const overrides = {
  config,
  styles,    // Global stiller
  colors,    // Ana renk paletleri (brand, gray, green vb.)
  shadows,   // Gölge tanımları
  radii,     // Kenar yuvarlaklıkları
  space,     // Boşluk skalası (Chakra 'space' olarak bekler, spacing.js'den 'space' olarak export etmiştik)
  breakpoints,
  ...typography, // fonts, fontSizes, fontWeights, lineHeights, letterSpacings'i kök dizine yayar

  semanticTokens, // Semantik token'ları ekle

  components: {
    Button,
    Card,
    Input, // Input, Textarea, Select bu temelden türeyebilir
    Alert,
    Badge,
    Tabs,
    Modal,
    Table,
    Link,
    // ...diğer bileşenler buraya eklenecek
  },
};

export default extendTheme(overrides);
