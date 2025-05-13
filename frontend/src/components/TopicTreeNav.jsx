import React, { Fragment } from 'react';
import { Box, Heading, Text, Icon, VStack, HStack, useColorModeValue } from '@chakra-ui/react';
import { FaFolder, FaFileAlt, FaList } from 'react-icons/fa'; // FaFolderOpen kaldırıldı

// Recursive Konu Düğümü (Chakra UI ile stilize edilmiş)
function TopicNodeChakra({ topic, onTopicSelect, selectedTopicId, level = 0 }) {
  const isSelected = topic.id === selectedTopicId;
  const hasChildren = topic.children && topic.children.length > 0;

  // Stil Hook'ları
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const selectedBg = useColorModeValue('blue.100', 'blue.700');
  const selectedColor = useColorModeValue('blue.700', 'blue.100');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const nodeIconColor = useColorModeValue('gray.500', 'gray.400');


  const handleSelect = (e) => {
    e.stopPropagation();
    onTopicSelect(isSelected ? null : topic.id);
  };

  const NodeIcon = hasChildren ? FaFolder : FaFileAlt;

  return (
    <Fragment>
      <HStack
        // key={topic.id} // Fragment'ın key'i yeterli, ancak performans için burada da tutulabilir.
        onClick={handleSelect}
        pl={level * 4 + 3} // Girinti için padding-left (seviyeye göre artar), ikon için de yer bırakır
        py={1.5} // Daha kompakt bir görünüm için py düşürüldü
        px={3}
        cursor="pointer"
        fontWeight={isSelected ? 'semibold' : 'normal'}
        bg={isSelected ? selectedBg : 'transparent'}
        color={isSelected ? selectedColor : textColor}
        borderBottomWidth="1px"
        borderColor={borderColor}
        userSelect="none"
        _hover={{ bg: isSelected ? selectedBg : hoverBg }}
        title={topic.description || topic.name}
        borderRadius="md"
        spacing={2.5} // İkon ve metin arası boşluk
        alignItems="center"
        w="full" // Genişliği tam yap
      >
        <Icon as={NodeIcon} color={isSelected ? selectedColor : nodeIconColor} boxSize="1em" />
        <Text noOfLines={1} fontSize="sm">{topic.name}</Text>
      </HStack>
      {hasChildren && (
        <Box> {/* Alt öğeler için ek bir girintiye gerek yok, TopicNodeChakra zaten kendi level'ına göre pl alıyor */}
          {topic.children.map(child => (
            <TopicNodeChakra
              key={child.id} // Her map elemanı için key gerekli
              topic={child}
              onTopicSelect={onTopicSelect}
              selectedTopicId={selectedTopicId}
              level={level + 1}
            />
          ))}
        </Box>
      )}
    </Fragment>
  );
}

// Ana Navigasyon Component'i
function TopicTreeNav({ topics, onTopicSelect, selectedTopicId, title = "Konular" }) {
  // Stil Hook'ları
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const selectedBg = useColorModeValue('blue.100', 'blue.700');
  const selectedColor = useColorModeValue('blue.700', 'blue.100');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.600', 'gray.300');
  const allTopicsTextColor = useColorModeValue('gray.700', 'gray.200');
  const allTopicsIconColor = useColorModeValue('gray.500', 'gray.400');
  const componentBg = useColorModeValue("white", "gray.800"); // bgPrimary yerine doğrudan tanımlama


  if (!topics) {
    return <Text p={4} color="textMuted" fontSize="sm">Konu listesi yükleniyor...</Text>;
  }
  if (topics.length === 0) {
    return <Text p={4} color="textMuted" fontSize="sm">Filtreye uygun konu bulunamadı.</Text>;
  }

  return (
    <Box 
        borderWidth="1px" 
        borderColor={borderColor} 
        borderRadius="lg" 
        p={3} 
        bg={componentBg}
        boxShadow="sm"
    >
      <Heading 
        as="h4" 
        size="sm" 
        mb={3} 
        color={headingColor} 
        px={2} 
        py={2} 
        borderBottomWidth="1px" 
        borderColor={borderColor}
      >
        {title}
      </Heading>
      <VStack 
        spacing={0.5} 
        align="stretch" 
        maxH="70vh" // Örnek bir maksimum yükseklik
        overflowY="auto" // İçerik taşarsa kaydırma çubuğu çıkar
        pr={1} // Kaydırma çubuğu için sağda biraz boşluk
      >
        <HStack
           onClick={() => onTopicSelect(null)}
           py={1.5}
           px={3}
           cursor="pointer"
           fontWeight={selectedTopicId === null ? 'semibold' : 'normal'}
           bg={selectedTopicId === null ? selectedBg : 'transparent'}
           color={selectedTopicId === null ? selectedColor : allTopicsTextColor}
           borderBottomWidth="1px"
           borderColor={borderColor}
           userSelect="none"
           _hover={{ bg: selectedTopicId === null ? selectedBg : hoverBg }}
           borderRadius="md"
           spacing={2.5}
           alignItems="center"
           w="full"
        >
            <Icon as={FaList} color={selectedTopicId === null ? selectedColor : allTopicsIconColor} boxSize="1em" />
            <Text fontSize="sm">Tüm Konular</Text>
        </HStack>
        {topics.map(rootTopic => (
          <TopicNodeChakra
            key={rootTopic.id}
            topic={rootTopic}
            onTopicSelect={onTopicSelect}
            selectedTopicId={selectedTopicId}
            level={0}
          />
        ))}
      </VStack>
    </Box>
  );
}

export default TopicTreeNav;