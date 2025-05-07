// frontend/src/theme/colors.js

// Ana marka renginiz ve tonları (LoginPage, TopicBrowserPage, MyStatsPage vb. yerlerde kullanılıyor)
// Örnek bir "canlı mavi" tonu seçelim, siz kendi marka renginize göre uyarlayabilirsiniz.
// Coolors.co gibi sitelerden modern paletler bulabilirsiniz.
// Bu örnekte parlak ve enerjik bir mavi ve onun tonları kullanılacaktır.
// Örnek: https://coolors.co/palette/00b4d8-0096c7-0077b6-023e8a-03045e
const brand = {
  50: '#E0F7FA',  // Çok açık mavi (hover, bg için)
  100: '#B2EBF2', // Açık mavi
  200: '#80DEEA', // Biraz daha koyu açık mavi
  300: '#4DD0E1', // Orta açık mavi
  400: '#26C6DA', // Canlı mavi
  500: '#00BCD4', // Ana marka rengi (Butonlar, linkler için)
  600: '#00ACC1', // Biraz daha koyu marka rengi (hover için)
  700: '#0097A7', // Koyu marka rengi
  800: '#00838F', // Çok koyu marka rengi
  900: '#006064', // En koyu marka rengi (koyu tema için ana renk olabilir)
};

// Nötr renkler (AdminPage, LoginPage ve genel arayüzde kullanılıyor)
const gray = {
  50: '#F8FAFC',  // Çok açık gri (açık mod arkaplanı)
  100: '#F1F5F9', // Açık gri (input arkaplanı, hover)
  200: '#E2E8F0', // Kenarlıklar için ideal
  300: '#CBD5E1', // Pasif metinler, kenarlıklar
  400: '#94A3B8', // İkincil metinler
  500: '#64748B', // Ana metinler (açık modda)
  600: '#475569', // Daha koyu metinler
  700: '#334155', // Koyu modda input arkaplanı, başlıklar
  800: '#1E293B', // Koyu modda kart arkaplanı
  900: '#0F172A', // Çok koyu gri (koyu mod arkaplanı)
};

// Durum renkleri (Alert, Badge, başarı/hata mesajları için)
const green = { // Başarı, onay (AdminPage, UserManagement)
  50: '#E6FFFA',
  100: '#B2F5EA',
  200: '#81E6D9',
  300: '#4FD1C5',
  400: '#38B2AC',
  500: '#319795', // Ana yeşil
  600: '#2C7A7B',
  700: '#285E61',
  800: '#234E52',
  900: '#1D4044',
};

const red = { // Hata, silme (AdminPage, TopicManagement)
  50: '#FFF5F5',
  100: '#FED7D7',
  200: '#FEB2B2',
  300: '#FC8181',
  400: '#F56565',
  500: '#E53E3E', // Ana kırmızı
  600: '#C53030',
  700: '#9B2C2C',
  800: '#822727',
  900: '#63171B',
};

const orange = { // Uyarı, dikkat (AdminPage - QuestionForm, MyStatsPage)
  50: '#FFFAF0',
  100: '#FEEBC8',
  200: '#FBD38D',
  300: '#F6AD55',
  400: '#ED8936',
  500: '#DD6B20', // Ana turuncu
  600: '#C05621',
  700: '#9C4221',
  800: '#7B341E',
  900: '#652B19',
};

const yellow = { // Bilgi, diğer uyarılar (AdminStatsOverview, MyStatsPage)
  50: '#FFFFF0',
  100: '#FEFCBF',
  200: '#FAF089',
  300: '#F6E05E',
  400: '#ECC94B',
  500: '#D69E2E', // Ana sarı
  600: '#B7791F',
  700: '#975A16',
  800: '#744210',
  900: '#5F370E',
};

// Kodlarınızda gördüğüm diğer renk şemaları (blue, TopicForm/LectureForm için)
// 'brand' ile aynı veya çok yakınsa birleştirilebilir. Farklı bir accent ise kalabilir.
const blue = { // Admin formları için kullanılabilir
  50: '#EBF8FF',
  100: '#BEE3F8',
  200: '#90CDF4',
  300: '#63B3ED',
  400: '#4299E1',
  500: '#3182CE', // Ana mavi
  600: '#2B6CB0',
  700: '#2C5282',
  800: '#2A4365',
  900: '#1A365D',
};

// Semantik renk isimleri (global.js içinde mode() ile tanımlanacak)
// Bunları doğrudan burada tanımlamak yerine, useColorModeValue ile
// global stillerde veya bileşen bazlı stillerde kullanmak daha esnek olabilir.
// Şimdilik sadece ana paletleri dışa aktaralım.

const colors = {
  transparent: 'transparent',
  black: '#000',
  white: '#FFF',
  brand,
  gray,
  green,
  red,
  orange,
  yellow,
  blue, // Admin paneli formları için eklediğimiz mavi
  // Semantik renkler için (global stillerde tanımlanacaklar)
  // Örnek:
  // textPrimary: mode(gray[700], whiteAlpha[900])(props),
  // bgPrimary: mode(white, gray[800])(props),
};

export default colors;
