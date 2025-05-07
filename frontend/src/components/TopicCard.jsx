import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text, // Açıklama için (opsiyonel)
  Icon,
  Circle, // İkon arka planı için
  // useStyleConfig kaldırıldı, doğrudan stil props kullanıyoruz
  useColorModeValue, // Spesifik renkler ve _hover/_active/_focus için
  VStack, // Dikey hizalama için
  // Spacer kaldırıldı, Flex ile yönetiliyor
} from '@chakra-ui/react';
// İkonlar
import {
  FaMicroscope, FaShieldAlt, FaBacteria, FaVirus, FaFlask,
  FaBug, FaBiohazard, FaFolder, FaChevronRight, FaFolderOpen
} from 'react-icons/fa';

// Konu -> İkon Eşleştirmesi (Aynı kalabilir)
const topicIconMap = {
  "Genel Mikrobiyoloji": FaMicroscope,
  "İmmünoloji": FaShieldAlt,
  "Bakteriyoloji": FaBacteria,
  "Viroloji": FaVirus,
  "Mikoloji": FaFlask,
  "Parazitoloji": FaBug,
  "Enfeksiyon Hastalıkları": FaBiohazard,
  "Laboratuvar Uygulamaları": FaFlask,
  "default": FaFolder // Varsayılan ikon
};

// TopicCard Component'i (Tema ile Uyumlu ve Gelişmiş Tasarım)
function TopicCard({ topic, onSelectTopic, ...props }) {

  const hasChildren = topic.children && topic.children.length > 0;
  // İkonu belirle: Eşleşme varsa onu, yoksa alt konu durumuna göre klasör ikonunu kullan
  const IconComponent = topicIconMap[topic.name] || (hasChildren ? FaFolderOpen : topicIconMap["default"]);

  const handleClick = () => {
    onSelectTopic(topic);
  };

  // --- Tema Değerlerini veya Özel Renkleri Al ---
  // Kartın ana arkaplanı ve kenarlığı için semantic token'ları kullan
  // bg="bgPrimary" veya bg="bgSecondary" olabilir. 'bgPrimary' (white/gray.800) daha yaygın kart arkaplanı.
  // borderColor="borderPrimary" veya "borderSecondary".
  // Not: Eğer tema dosyasında Card component'i için varsayılan stil tanımladıysanız (örn: variant="elevated"),
  // bu bg ve borderColor'ı burada tekrar belirtmek yerine Card component'ini kullanmak daha iyi olabilir.
  // Şimdilik Box ile devam ediyoruz ve semantic token kullanıyoruz.
  const cardBg = "bgPrimary"; // Semantic Token
  const borderColor = "borderPrimary"; // Semantic Token

  // Hover ve Active durumları için özel renkler (useColorModeValue ile)
  // Bunları temanıza özel semantic token'lar olarak da tanımlayabilirsiniz.
  const hoverBg = useColorModeValue('gray.50', 'gray.700'); // Veya bgSecondary
  const activeBg = useColorModeValue('gray.100', 'gray.600');
  const hoverBorderColor = useColorModeValue('brand.300', 'brand.500'); // Hover kenarlık rengi
  const focusBorderColor = useColorModeValue('brand.400', 'brand.400'); // Focus kenarlık rengi
  const focusBoxShadow = useColorModeValue('0 0 0 3px var(--chakra-colors-brand-200)', '0 0 0 3px var(--chakra-colors-brand-700)'); // Focus gölgesi

  // İkon alanı için özel renkler (useColorModeValue ile)
  const iconBg = useColorModeValue('brand.100', 'brand.800');
  const iconColor = useColorModeValue('brand.600', 'brand.200');

  return (
    <Box
      as="button" // Erişilebilirlik ve tıklanabilirlik
      onClick={handleClick}
      p={5} // Temadan space.5
      bg={cardBg} // Semantic Token
      borderWidth="1px"
      borderColor={borderColor} // Semantic Token
      borderRadius="lg" // Temadan radii.lg
      boxShadow="base" // Temadan shadows.base (veya md)
      textAlign="left"
      w="100%"
      transition="all 0.2s ease-in-out" // Temadan alınabilir veya sabit
      // Tema hover/active/focus stilleri özelleştirildi
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: 'lg', // Temadan shadows.lg
        borderColor: hoverBorderColor, // Özel hover kenarlık rengi
        bg: hoverBg // Özel hover arkaplanı
      }}
      _active={{
        transform: 'translateY(-1px)',
        boxShadow: 'md', // Temadan shadows.md
        bg: activeBg // Özel active arkaplanı
      }}
      _focusVisible={{ // Klavye ile focus
        borderColor: focusBorderColor,
        boxShadow: focusBoxShadow // Özel focus gölgesi
      }}
      {...props} // Diğer props'ları (örn: key) aktar
    >
      <Flex align="center">
        {/* İkon Alanı */}
        <Circle size="44px" bg={iconBg} color={iconColor} mr={4}>
          <Icon as={IconComponent} boxSize="20px" />
        </Circle>

        {/* Başlık Alanı */}
        <VStack align="flex-start" spacing={0} flex="1" minW={0}>
           {/* Heading tema boyutunu (sm) ve font ağırlığını (semibold) kullanır */}
          <Heading
            as="h3"
            size="sm"
            fontWeight="semibold"
            noOfLines={2}
            // Renk belirtilmediği için varsayılan metin rengini (textPrimary) alır
          >
            {topic.name}
          </Heading>
          {/* Opsiyonel Açıklama (Yorumda) */}
          {/* {topic.description && (
            <Text fontSize="xs" color="textMuted" noOfLines={1}> // textMuted semantic token kullanır
              {topic.description}
            </Text>
          )} */}
        </VStack>

        {/* Chevron (Alt konu varsa) */}
        {/* Icon semantic token (textMuted) kullanır */}
        <Icon
            as={FaChevronRight}
            color="textMuted"
            opacity={hasChildren ? 0.8 : 0}
            transition="transform 0.2s ease, opacity 0.2s ease"
            ml={3}
             // _groupHover yerine _hover (Box 'button' olduğu için grup gibi davranır)
            _hover={{
              transform: hasChildren ? 'translateX(4px)' : 'none',
            }}
            aria-hidden={!hasChildren}
          />
      </Flex>
    </Box>
  );
}

export default TopicCard;