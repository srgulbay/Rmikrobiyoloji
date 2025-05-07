// frontend/src/theme/index.js
import { extendTheme } from "@chakra-ui/react";

// 1. Tema Modüllerini Import Et
import colors from "./colors";
import typography from "./typography";
import space from "./spacing";
import breakpoints from "./breakpoints";
import radii from "./radii";
import shadows from "./shadows";
import styles from "./styles";

// 2. Bileşen Stillerini Import Et
import Button from "./components/button";
import Card from "./components/card";
// GÜNCELLENDİ: Input, Select, Textarea için named import kullan
import { Input, Select, Textarea } from "./components/input";
import Alert from "./components/alert";
import Badge from "./components/badge";
import Tabs from "./components/tabs";
import Modal from "./components/modal";
import Table from "./components/table";
import Link from "./components/link";
// ... diğer bileşenler eklenecek

// 3. Tema Konfigürasyonu
const config = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

// 4. Semantik Token'lar
const semanticTokens = {
  colors: {
    textPrimary: { default: "gray.700", _dark: "whiteAlpha.900" },
    textSecondary: { default: "gray.600", _dark: "gray.400" },
    textMuted: { default: "gray.500", _dark: "gray.500" },
    bgPrimary: { default: "white", _dark: "gray.800" },
    bgSecondary: { default: "gray.50", _dark: "gray.700" },
    bgTertiary: { default: "gray.100", _dark: "gray.600" },
    borderPrimary: { default: "gray.200", _dark: "gray.700" },
    borderSecondary: { default: "gray.300", _dark: "gray.600" },
    accent: { default: "brand.500", _dark: "brand.300" },
    inputBg: { default: 'white', _dark: 'gray.700' }, // Input temasındaki bg ile tutarlı olmalı
    inputPlaceholder: { default: 'gray.500', _dark: 'gray.400' },
    // Başka semantic tokenlar eklenebilir
  },
  shadows: {
    // Örnek
    // cardShadow: { default: shadows.md, _dark: shadows.lg }
  }
};


// 5. Tüm Parçaları Birleştir
const overrides = {
  config,
  styles,
  colors,
  shadows,
  radii,
  space, // spacing.js'den gelen 'space' objesi
  breakpoints,
  ...typography, // typography objesini köke yay
  semanticTokens,
  components: {
    Button,
    Card,
    // GÜNCELLENDİ: Input, Select ve Textarea ayrı ayrı eklendi
    Input,
    Select,
    Textarea,
    Alert,
    Badge,
    Tabs,
    Modal,
    Table,
    Link,
    // ...diğer import edilen bileşen stilleri
  },
};

export default extendTheme(overrides);