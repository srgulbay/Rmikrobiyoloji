import React from 'react';
import {
  Button,
  Flex,
  Heading,
  Icon,
  Box, // Box eklendi, Button yerine kullanılabilir
  useStyleConfig // İsteğe bağlı: Tema tabanlı varyant için
} from '@chakra-ui/react';
// İkonları import etmeye devam ediyoruz
import {
  FaMicroscope, FaShieldAlt, FaBacteria, FaVirus, FaFlask,
  FaBug, FaBiohazard, FaFolder, FaChevronRight
} from 'react-icons/fa'; // Veya fa6

// Konu -> İkon Component Eşleştirmesi (Aynen kalabilir)
const topicIconMap = {
  "Genel Mikrobiyoloji": FaMicroscope,
  "İmmünoloji": FaShieldAlt,
  "Bakteriyoloji": FaBacteria,
  "Viroloji": FaVirus,
  "Mikoloji": FaFlask, // Veya FaMushroom (fa6)
  "Parazitoloji": FaBug,
  "Enfeksiyon Hastalıkları": FaBiohazard,
  "Laboratuvar Uygulamaları": FaFlask,
  "default": FaFolder
};

// TopicCard Component'i (Chakra UI ile yeniden düzenlendi)
function TopicCard({ topic, onSelectTopic, ...props }) { // className kaldırıldı, diğer props'lar için ...props eklendi

  const IconComponent = topicIconMap[topic.name] || topicIconMap["default"];
  const hasChildren = topic.children && topic.children.length > 0;

  const handleClick = () => {
    onSelectTopic(topic);
  };

  // Tema'da özel bir 'outlineInteractive' varyantı tanımlanabilir
  // veya stil props'ları doğrudan kullanılabilir.
  // Stil props kullanarak örnek:
  return (
    <Button
      variant="outline" // Temel çerçeveli stil
      w="100%"          // Tam genişlik
      h="auto"          // İçeriğe göre yükseklik
      p={4}             // Padding (space.4)
      textAlign="left"
      justifyContent="flex-start" // İçeriği sola yasla
      alignItems="center"       // İçeriği dikeyde ortala
      onClick={handleClick}
      borderColor="borderSecondary" // Temadan renk
      bg="bgSecondary"           // Temadan renk
      color="textPrimary"          // Temadan renk
      borderRadius="md"          // Temadan yarıçap
      role="group"               // _groupHover için
      transition="all 0.2s ease-in-out" // Geçiş efekti
      _hover={{
        bg: 'bgTertiary',         // Temadan renk
        borderColor: 'accent',    // Temadan renk
        transform: 'translateY(-3px)',
        boxShadow: 'md'           // Temadan gölge
      }}
      _active={{ // Tıklama anı stili
        transform: 'translateY(-1px) scale(0.99)',
        boxShadow: 'inner',        // Temadan gölge
        bg: 'bgQuaternary'       // Temadan renk
      }}
      {...props} // Diğer Chakra props'larını geçirebilmek için
    >
      {/* İkon Alanı */}
      <Flex
        w="44px" h="44px"
        borderRadius="full" // Tam yuvarlak
        // Gradient için tema veya doğrudan stil
        bgGradient="linear(to-br, blue.50, blue.100)" // Örnek: Chakra renkleri (tema ile değiştirilebilir)
        _dark={{ bgGradient: "linear(to-br, blue.800, blue.700)"}} // Gece modu gradient'i
        alignItems="center"
        justifyContent="center"
        mr={4} // Sağdan boşluk (space.4)
        flexShrink={0}
        transition="transform 0.25s ease"
        _groupHover={{ transform: 'scale(1.1)' }} // Parent hover olduğunda
      >
        <Icon as={IconComponent} boxSize="1.6rem" color="accent" /> {/* Temadan renk */}
      </Flex>

      {/* Konu Başlığı */}
      <Heading
        as="h3"
        size="sm" // Temadan yazı boyutu (lg, md, sm...)
        fontWeight="medium" // Temadan
        color="inherit" // Parent'tan rengi al (Button rengi)
        lineHeight="1.4"
        flex="1" // Genişlemesini sağla
        mr={3} // Sağdaki ikon için boşluk (space.3)
      >
        {topic.name}
      </Heading>

      {/* Chevron (Alt konu varsa) */}
      {hasChildren && (
         <Icon
            as={FaChevronRight}
            color="textMuted" // Temadan renk
            opacity={0.8}
            transition="transform 0.15s ease, color 0.15s ease"
            _groupHover={{ // Parent hover olduğunda
                transform: 'translateX(4px)',
                color: 'accent', // Temadan renk
                opacity: 1
            }}
            aria-hidden="true"
          />
      )}
    </Button>
  );
}

export default TopicCard;