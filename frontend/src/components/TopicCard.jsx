import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text, 
  Icon,
  Circle,
  useColorModeValue,
  VStack,
  ScaleFade, // Giriş animasyonu için
  Badge // Opsiyonel: Konuyla ilgili ek bilgi için (örn: soru sayısı)
} from '@chakra-ui/react';
import {
  FaMicroscope, FaShieldAlt, FaBacteria, FaVirus, FaFlask,
  FaBug, FaBiohazard, FaFolder, FaChevronRight, FaFolderOpen, FaBook // FaBook eklendi
} from 'react-icons/fa';

// İkon eşleştirmesini genişletebilir veya özelleştirebilirsiniz
const topicIconMap = {
  "Genel Mikrobiyoloji": FaMicroscope,
  "Temel Mikrobiyoloji": FaMicroscope,
  "İmmünoloji": FaShieldAlt,
  "Bakteriyoloji": FaBacteria,
  "Viroloji": FaVirus,
  "Mikoloji": FaFlask, // Mantarlar için daha uygun olabilir
  "Parazitoloji": FaBug,
  "Enfeksiyon Hastalıkları": FaBiohazard,
  "Klinik Mikrobiyoloji": FaBiohazard,
  "Laboratuvar Uygulamaları": FaFlask,
  "Moleküler Mikrobiyoloji": FaFlask,
  "Besin Mikrobiyolojisi": FaBook, // Örnek
  "Su Mikrobiyolojisi": FaBook,   // Örnek
  "default": FaFolder // Varsayılan ikon
};

function TopicCard({ topic, onSelectTopic, index, ...props }) { // index prop'u eklendi (stagger animasyonu için)
  const hasChildren = topic.children && topic.children.length > 0;
  
  // İkon seçimi: topic.iconName gibi bir alan varsa onu kullan, yoksa topicIconMap'ten bak
  const IconComponent = topic.iconName || topicIconMap[topic.name] || (hasChildren ? FaFolderOpen : topicIconMap["default"]);

  const handleClick = () => {
    onSelectTopic(topic);
  };

  const cardBg = useColorModeValue('white', 'gray.750');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBorderColor = useColorModeValue('brand.400', 'brand.500');
  const focusRingColor = useColorModeValue('brand.300', 'brand.500');
  
  const iconCircleBg = useColorModeValue('brand.50', 'brand.700');
  const iconColor = useColorModeValue('brand.600', 'brand.200');
  const headingColor = useColorModeValue('gray.700', 'gray.100');
  const descriptionColor = useColorModeValue('gray.500', 'gray.400');
  const chevronColor = useColorModeValue('gray.400', 'gray.500');

  // Kart için ek bilgi (örn: alt konu sayısı veya soru sayısı - bu veri topic objesinden gelmeli)
  const topicInfoBadge = topic.subTopicCount ? `${topic.subTopicCount} Alt Konu` : topic.questionCount ? `${topic.questionCount} Soru` : null;

  return (
    <ScaleFade initialScale={0.95} in={true} transition={{ enter: { duration: 0.3, delay: (index || 0) * 0.05 } }}>
      <Box
        as="button"
        onClick={handleClick}
        p={5} // Biraz daha ferah padding
        bg={cardBg}
        borderWidth="1px"
        borderColor={cardBorderColor}
        borderRadius="xl" // Daha yuvarlak köşeler
        boxShadow="md" // Daha belirgin bir başlangıç gölgesi
        textAlign="left"
        w="100%"
        h="100%" // SimpleGrid'de kartların aynı yüksekliği alması için
        display="flex" // Flexbox ile iç düzen
        flexDirection="column" // İçerik dikeyde
        justifyContent="space-between" // Başlık yukarı, chevron/badge aşağı
        transition="all 0.25s ease-out, transform 0.2s ease-out, border-color 0.2s ease-out, box-shadow 0.2s ease-out"
        _hover={{
          transform: 'translateY(-5px) scale(1.01)', // Hafif kalkma ve büyüme
          boxShadow: 'xl', // Daha derin gölge
          borderColor: hoverBorderColor,
          bg: hoverBg
        }}
        _active={{
          transform: 'translateY(-2px) scale(0.99)',
          boxShadow: 'lg',
        }}
        _focusVisible={{ 
          outline: "none",
          ring: "3px",
          ringColor: focusRingColor,
          ringOffset: "1px",
          borderColor: hoverBorderColor
        }}
        {...props}
      >
        <Flex align="center" w="full" mb={3}> {/* İkon ve başlık için */}
          <Circle size="44px" bg={iconCircleBg} color={iconColor} mr={4} flexShrink={0} boxShadow="inner">
            <Icon as={IconComponent} boxSize="20px" />
          </Circle>
          <VStack align="flex-start" spacing={0} flex="1" minW={0}>
            <Heading
              as="h3"
              size="sm"
              fontWeight="semibold" // medium -> semibold
              noOfLines={2}
              color={headingColor}
              title={topic.name}
            >
              {topic.name}
            </Heading>
            {topic.description && (
              <Text fontSize="xs" color={descriptionColor} noOfLines={1} mt="1px" title={topic.description}>
                {topic.description}
              </Text>
            )}
          </VStack>
        </Flex>

        <Flex w="full" justifyContent="flex-end" alignItems="center" mt="auto" pt={2}>
          {topicInfoBadge && (
            <Badge colorScheme="gray" variant="subtle" fontSize="0.65rem" mr={hasChildren ? 2 : 0}>
              {topicInfoBadge}
            </Badge>
          )}
          {hasChildren && (
            <Icon
              as={FaChevronRight}
              color={chevronColor}
              opacity={0.8}
              boxSize="1em"
              transition="transform 0.2s ease-in-out"
              _groupHover={{ transform: 'translateX(2px)' }} // Ana kart hover olduğunda (Box'a _groupHover eklenmeli)
                                                              // Veya direkt Box'ın _hover'ına eklenebilir
            />
          )}
        </Flex>
      </Box>
    </ScaleFade>
  );
}

export default TopicCard;
