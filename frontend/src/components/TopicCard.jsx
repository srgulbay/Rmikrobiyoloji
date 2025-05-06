// src/components/TopicCard.jsx

import React from 'react';
import {
  Box, // Button yerine Box kullanacağız, tıklanabilirlik için as="button"
  Flex,
  Heading,
  Text, // Açıklama için (opsiyonel)
  Icon,
  Circle, // İkon arka planı için
  useStyleConfig, // Tema varyantları için (opsiyonel)
  useColorModeValue, // Açık/Koyu mod renkleri
  VStack, // Dikey hizalama için
  Spacer // Boşluk itmek için
} from '@chakra-ui/react';
// İkonlar
import {
  FaMicroscope, FaShieldAlt, FaBacteria, FaVirus, FaFlask,
  FaBug, FaBiohazard, FaFolder, FaChevronRight, FaFolderOpen // Açık klasör ikonu
} from 'react-icons/fa';

// Konu -> İkon Eşleştirmesi (Aynen kalabilir)
const topicIconMap = {
  "Genel Mikrobiyoloji": FaMicroscope,
  "İmmünoloji": FaShieldAlt,
  "Bakteriyoloji": FaBacteria,
  "Viroloji": FaVirus,
  "Mikoloji": FaFlask,
  "Parazitoloji": FaBug,
  "Enfeksiyon Hastalıkları": FaBiohazard,
  "Laboratuvar Uygulamaları": FaFlask,
  "default": FaFolder // Alt konusu olmayan için
};

// TopicCard Component'i (Daha Gelişmiş Tasarım)
function TopicCard({ topic, onSelectTopic, ...props }) {

  // Alt konu varsa açık klasör, yoksa normal klasör ikonu kullanabiliriz.
  const hasChildren = topic.children && topic.children.length > 0;
  const IconComponent = topicIconMap[topic.name] || (hasChildren ? FaFolderOpen : topicIconMap["default"]);

  const handleClick = () => {
    onSelectTopic(topic);
  };

  // Kart için arka plan ve ikon rengi
  const cardBg = useColorModeValue('white', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  const activeBg = useColorModeValue('gray.100', 'gray.500');
  const iconBg = useColorModeValue('brand.100', 'brand.800');
  const iconColor = useColorModeValue('brand.600', 'brand.200');

  return (
    <Box
      as="button" // Erişilebilirlik ve tıklanabilirlik için button
      onClick={handleClick}
      p={5} // Padding artırıldı
      bg={cardBg}
      borderWidth="1px"
      borderColor={useColorModeValue('gray.200', 'gray.600')}
      borderRadius="lg" // Daha yuvarlak köşeler
      boxShadow="base" // Hafif gölge
      textAlign="left"
      w="100%"
      transition="all 0.2s ease-in-out"
      _hover={{
        transform: 'translateY(-4px)', // Hover'da hafif yukarı kalkma
        boxShadow: 'lg', // Hover'da daha belirgin gölge
        borderColor: 'brand.300',
        bg: hoverBg
      }}
      _active={{
        transform: 'translateY(-1px)', // Tıklama anında hafifçe aşağı inme
        boxShadow: 'md',
        bg: activeBg
      }}
      _focusVisible={{ // Klavye ile focus olduğunda belirgin halka
        borderColor: 'brand.400',
        boxShadow: `0 0 0 3px var(--chakra-colors-brand-200)`
      }}
      {...props}
    >
      <Flex align="center">
        {/* İkon Alanı (Renkli Daire İçinde) */}
        <Circle size="44px" bg={iconBg} color={iconColor} mr={4}>
          <Icon as={IconComponent} boxSize="20px" />
        </Circle>

        {/* Başlık ve Açıklama Alanı */}
        <VStack align="flex-start" spacing={0} flex="1" minW={0}>
          <Heading
            as="h3"
            size="sm" // Biraz daha belirgin başlık
            fontWeight="semibold" // Daha kalın
            noOfLines={2} // En fazla 2 satır
          >
            {topic.name}
          </Heading>
          {/* Opsiyonel: Kısa açıklama eklenebilir */}
          {/* {topic.description && (
            <Text fontSize="xs" color="textMuted" noOfLines={1}>
              {topic.description}
            </Text>
          )} */}
        </VStack>

        {/* Chevron (Alt konu varsa) */}
        <Icon
            as={FaChevronRight}
            color="textMuted"
            opacity={hasChildren ? 0.8 : 0} // Alt konu yoksa gizle
            transition="transform 0.2s ease, opacity 0.2s ease"
            ml={3} // Başlıktan ayırmak için
            _groupHover={{ // Box'a role="group" eklemeye gerek yok, as="button" yeterli
              transform: hasChildren ? 'translateX(4px)' : 'none',
            }}
            aria-hidden={!hasChildren}
          />
      </Flex>
    </Box>
  );
}

export default TopicCard;