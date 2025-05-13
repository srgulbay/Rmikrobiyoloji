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
} from '@chakra-ui/react';
import {
  FaMicroscope, FaShieldAlt, FaBacteria, FaVirus, FaFlask,
  FaBug, FaBiohazard, FaFolder, FaChevronRight, FaFolderOpen
} from 'react-icons/fa';

const topicIconMap = {
  "Genel Mikrobiyoloji": FaMicroscope,
  "İmmünoloji": FaShieldAlt,
  "Bakteriyoloji": FaBacteria,
  "Viroloji": FaVirus,
  "Mikoloji": FaFlask,
  "Parazitoloji": FaBug,
  "Enfeksiyon Hastalıkları": FaBiohazard,
  "Laboratuvar Uygulamaları": FaFlask,
  "default": FaFolder
};

function TopicCard({ topic, onSelectTopic, ...props }) {
  const hasChildren = topic.children && topic.children.length > 0;
  const IconComponent = topicIconMap[topic.name] || (hasChildren ? FaFolderOpen : topicIconMap["default"]);

  const handleClick = () => {
    onSelectTopic(topic);
  };

  // Stil Hook'ları ve Değişkenleri
  const cardBg = useColorModeValue('white', 'gray.750'); // Açık modda beyaz, koyu modda gray.750
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600'); // Kenarlık rengi
  
  const hoverBg = useColorModeValue('gray.50', 'gray.700'); 
  const activeBg = useColorModeValue('gray.100', 'gray.600');
  const hoverBorderColor = useColorModeValue('brand.300', 'brand.500'); 
  const focusBorderColor = useColorModeValue('brand.400', 'brand.400'); 
  const focusBoxShadow = useColorModeValue('0 0 0 2px var(--chakra-colors-brand-300)', '0 0 0 2px var(--chakra-colors-brand-600)'); // Focus gölgesi inceltildi

  const iconBg = useColorModeValue('brand.100', 'brand.800');
  const iconColor = useColorModeValue('brand.600', 'brand.200');
  const chevronColor = useColorModeValue('gray.500', 'gray.400'); // Chevron ikonu için renk

  return (
    <Box
      as="button"
      onClick={handleClick}
      p={4} // Padding biraz azaltıldı (5 -> 4)
      bg={cardBg}
      borderWidth="1px"
      borderColor={cardBorderColor}
      borderRadius="lg"
      boxShadow="base"
      textAlign="left"
      w="100%"
      transition="all 0.2s ease-in-out, border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out" // Geçişlere borderColor ve boxShadow eklendi
      _hover={{
        transform: 'translateY(-3px)', // Daha hassas bir hover efekti
        boxShadow: 'md', // Gölge biraz daha belirgin
        borderColor: hoverBorderColor,
        bg: hoverBg 
      }}
      _active={{
        transform: 'translateY(-1px)',
        boxShadow: 'sm', // Aktifken gölge biraz daha az
        bg: activeBg
      }}
      _focusVisible={{ 
        outline: "none", // Tarayıcı varsayılan outline'ını kaldır
        borderColor: focusBorderColor,
        boxShadow: focusBoxShadow
      }}
      {...props}
    >
      <Flex align="center">
        <Circle size="40px" bg={iconBg} color={iconColor} mr={3}> {/* Boyut ve margin ayarlandı */}
          <Icon as={IconComponent} boxSize="18px" /> {/* İkon boyutu ayarlandı */}
        </Circle>

        <VStack align="flex-start" spacing={0} flex="1" minW={0}>
          <Heading
            as="h3"
            size="sm"
            fontWeight="medium" // semibold -> medium (daha yumuşak)
            noOfLines={2}
            color="textPrimary" // Varsayılan metin rengi için (temanızda tanımlıysa)
          >
            {topic.name}
          </Heading>
          {topic.description && ( // Açıklama varsa göster
            <Text fontSize="xs" color="textMuted" noOfLines={1} mt={0.5}>
              {topic.description}
            </Text>
          )}
        </VStack>

        <Icon
            as={FaChevronRight}
            color={chevronColor} // textMuted yerine tanımlı değişken
            opacity={hasChildren ? 0.7 : 0} // Opaklık biraz artırıldı
            transition="transform 0.2s ease, opacity 0.2s ease"
            ml={3}
            boxSize="1em"
            // _hover Box'ın _hover'ı tarafından tetikleneceği için burada ayrıca _hover'a gerek olmayabilir,
            // ancak istenirse eklenebilir.
            // _groupHover (eğer bir üst Flex/Box'a .group class'ı verilirse) daha kontrollü olabilir.
            aria-hidden={!hasChildren}
          />
      </Flex>
    </Box>
  );
}

export default TopicCard;