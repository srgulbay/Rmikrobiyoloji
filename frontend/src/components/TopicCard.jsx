import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Flex,
  Heading,
  Text,
  HStack,
  Button, // IconButton yerine Button veya stilize edilmiş Box kullanılabilir
  Icon,
  Circle,
  useColorModeValue,
  VStack,
  ScaleFade,
  Badge,
  IconButton, // IconButton hala kullanılabilir
  Tooltip,
  useToast,
  Spinner // Spinner eklendi
} from '@chakra-ui/react';
import {
  FaMicroscope, FaShieldAlt, FaBacteria, FaVirus, FaFlask,
  FaBug, FaBiohazard, FaFolder, FaChevronRight, FaFolderOpen, FaBook,
  FaPlusCircle
} from 'react-icons/fa';
import { FiPlusSquare, FiChevronsRight } from 'react-icons/fi'; // Daha modern ikonlar

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const topicIconMap = {
  "Genel Mikrobiyoloji": FaMicroscope, "Temel Mikrobiyoloji": FaMicroscope,
  "İmmünoloji": FaShieldAlt, "Bakteriyoloji": FaBacteria, "Viroloji": FaVirus,
  "Mikoloji": FaFlask, "Parazitoloji": FaBug, "Enfeksiyon Hastalıkları": FaBiohazard,
  "Klinik Mikrobiyoloji": FaBiohazard, "Laboratuvar Uygulamaları": FaFlask,
  "Moleküler Mikrobiyoloji": FaFlask, "Besin Mikrobiyolojisi": FaBook,
  "Su Mikrobiyolojisi": FaBook,
  "default": FaFolder
};

function TopicCard({ topic, onSelectTopic, index, token, examClassificationId }) { // examClassificationId prop'u eklendi
  const hasChildren = topic.children && topic.children.length > 0;
  const IconComponent = topic.iconName || topicIconMap[topic.name] || (hasChildren ? FaFolderOpen : topicIconMap["default"]);
  
  const toast = useToast();
  const [isAddingToCoach, setIsAddingToCoach] = useState(false);
  const [isAdded, setIsAdded] = useState(false); // Başarıyla eklendi mi?

  // Layout ile tutarlı stil değişkenleri
  const cardDefaultBg = useColorModeValue('white', 'gray.750');
  const cardHoverBg = useColorModeValue('gray.50', 'gray.700');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  const cardHoverBorderColor = useColorModeValue('brand.400', 'brand.500');
  const focusRingColor = useColorModeValue('brand.300', 'brand.500');
  
  const iconCircleDefaultBg = useColorModeValue('gray.100', 'gray.600');
  const iconCircleHoverBg = useColorModeValue('brand.50', 'brand.800');
  const iconDefaultColor = useColorModeValue('gray.500', 'gray.400');
  const iconHoverColor = useColorModeValue('brand.600', 'brand.200');

  const headingDefaultColor = useColorModeValue('gray.700', 'gray.100');
  const headingHoverColor = useColorModeValue('brand.600', 'brand.200');
  const descriptionColor = useColorModeValue('gray.500', 'gray.400');
  const chevronDefaultColor = useColorModeValue('gray.400', 'gray.500');
  const chevronHoverColor = useColorModeValue('brand.500', 'brand.300');

  const badgeColorScheme = useColorModeValue("gray", "gray"); // Veya "blue", "teal"
  const addToCoachButtonColorScheme = isAdded ? "green" : "teal";


  const handleCardClick = (e) => {
    if (e.target.closest('.add-to-coach-button-wrapper')) {
      e.stopPropagation();
      return;
    }
    onSelectTopic(topic);
  };

  const handleAddItemToSRS = async () => {
    if (!token) {
      toast({ title: "Giriş Gerekli", description: "Bu özelliği kullanmak için giriş yapmalısınız.", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    // Branş ve Sınav Tipi Topic objesinden veya prop olarak gelmeli
    // Eğer topic.examClassificationId yoksa ve bu bir branş ekleme değilse,
    // genel bir konu olarak eklenir ve backend bunu Question'dan vs. bulmaya çalışır.
    // En iyisi topic objesinde bu bilgilerin olması veya TopicBrowserPage'den prop olarak gelmesi.
    // `examClassificationId` prop'u eklendi ve kullanılacak.
    if (itemType === 'branch' && !examClassificationId) {
        toast({ title: "Eksik Bilgi", description: "Bu branşı antrenöre eklemek için lütfen önce bir sınav türü seçin.", status: "warning", duration: 4000 });
        return;
    }


    setIsAddingToCoach(true);
    setIsAdded(false);
    try {
      const payload = {
        itemId: topic.id,
        itemType: 'topic', // Bu her zaman 'topic' mi olacak, yoksa 'branch' da olabilir mi?
                           // Eğer bu kart hem ana konu hem de alt konu için kullanılıyorsa 'topic' doğru.
                           // Eğer bu kart bir branşı da temsil edebiliyorsa, itemType dinamik olmalı.
                           // Şimdilik 'topic' varsayalım.
        examClassificationId: topic.examClassificationId || examClassificationId || null // Prop'tan gelen veya topic objesinden
      };
      
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${API_BASE_URL}/api/srs/add-item`, payload, config);
      toast({
        title: response.data.summary?.added > 0 || response.data.summary?.updated > 0 ? "Antrenöre Eklendi!" : "Bilgi",
        description: response.data.message || `"${topic.name}" konusu ve içeriği Dijital Antrenör'e eklendi/güncellendi.`,
        status: response.data.summary?.added > 0 || response.data.summary?.updated > 0 ? "success" : "info",
        duration: 4000,
        isClosable: true,
      });
      if(response.data.summary?.added > 0 || response.data.summary?.updated > 0) {
        setIsAdded(true);
      }
    } catch (error) {
      console.error("SRS'e konu eklenirken hata:", error);
      toast({
        title: "Ekleme Başarısız!",
        description: error.response?.data?.message || "Konu Antrenöre eklenirken bir sorun oluştu.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAddingToCoach(false);
    }
  };

  return (
    <ScaleFade initialScale={0.95} in={true} transition={{ enter: { duration: 0.35, delay: (index || 0) * 0.05 } }}>
      <Box
        as="div" // Button yerine div, tüm kart tıklanabilir
        onClick={handleCardClick}
        cursor="pointer"
        p={5}
        bg={cardDefaultBg}
        borderWidth="1px"
        borderColor={cardBorderColor}
        borderRadius="xl"
        boxShadow="lg"
        textAlign="left"
        w="100%"
        h="100%" // Yüksekliği eşitlemek için (SimpleGrid'de align="stretch" ile desteklenmeli)
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        transition="all 0.25s cubic-bezier(0.645, 0.045, 0.355, 1)"
        _groupHover={{ // Eğer bir üst grup hover'ı varsa (örn: TopicBrowserPage'de)
            transform: 'translateY(-4px)',
            boxShadow: 'xl',
            borderColor: cardHoverBorderColor,
        }}
        _hover={{ // Kartın kendi üzerine gelince
            transform: 'translateY(-4px)',
            boxShadow: 'xl',
            borderColor: cardHoverBorderColor,
        }}
        _active={{
          transform: 'translateY(-1px) scale(0.99)',
          boxShadow: 'lg',
        }}
        _focusVisible={{
          outline: "none", ring: "3px", ringColor: focusRingColor,
          ringOffset: "1px", borderColor: cardHoverBorderColor
        }}
        position="relative" // İçeriği pozisyonlamak için
        overflow="hidden" // Köşelerden taşan efektleri gizle
      >
        {/* Üst Kısım: İkon ve Başlık */}
        <Flex align="center" w="full" mb={4} flexGrow={1}>
          <Circle 
            size={{base:"44px", md:"52px"}} // Boyut ayarlandı
            bg={iconCircleDefaultBg} 
            color={iconDefaultColor} 
            mr={4} 
            flexShrink={0} 
            boxShadow="inner"
            transition="all 0.2s ease-out"
            _groupHover={{ bg: iconCircleHoverBg, color: iconHoverColor, boxShadow:"sm" }}
          >
            <Icon as={IconComponent} boxSize={{base:"20px", md:"24px"}} />
          </Circle>
          <VStack align="flex-start" spacing="2px" flex="1" minW={0}>
            <Heading
              as="h3"
              size="sm" // Başlık boyutu
              fontWeight="semibold"
              noOfLines={2}
              color={headingDefaultColor}
              _groupHover={{ color: headingHoverColor }}
              transition="color 0.2s ease-out"
              title={topic.name}
              lineHeight="shorter"
            >
              {topic.name}
            </Heading>
            {topic.description && (
              <Text fontSize="xs" color={descriptionColor} noOfLines={1} title={topic.description}>
                {topic.description}
              </Text>
            )}
          </VStack>
        </Flex>

        {/* Alt Kısım: Buton ve Detaylar */}
        <Flex w="full" justifyContent="space-between" alignItems="center" mt="auto" pt={3} borderTopWidth="1px" borderColor={cardBorderColor}>
          <Box className="add-to-coach-button-wrapper">
            <Tooltip label={isAdded ? "Antrenörde Mevcut" : "Bu Konuyu ve İçeriğini Antrenöre Ekle"} fontSize="xs" placement="top" hasArrow>
              <IconButton
                aria-label="Antrenöre Ekle"
                icon={isAdded ? <FaCheckCircle /> : <FiPlusSquare />}
                size="md" // Biraz büyütüldü
                variant="ghost"
                colorScheme={addToCoachButtonColorScheme}
                onClick={handleAddItemToSRS}
                isLoading={isAddingToCoach}
                isDisabled={isAdded && !isAddingToCoach} // Eklendiyse ve yüklenmiyorsa disable
                isRound
                _hover={{ bg: useColorModeValue(`${addToCoachButtonColorScheme}.100`, `${addToCoachButtonColorScheme}.700`) }}
              />
            </Tooltip>
          </Box>
          <HStack spacing={2} align="center">
            {(topic.subTopicCount > 0 || topic.questionCount > 0) && (
              <Badge
                colorScheme={badgeColorScheme}
                variant={useColorModeValue("subtle", "outline")}
                fontSize="xs" // Biraz küçültüldü
                px={2.5} py={1} // Padding ayarlandı
                borderRadius="full" // Tam yuvarlak
              >
                {topic.subTopicCount ? `${topic.subTopicCount} Alt Konu` : (topic.questionCount ? `${topic.questionCount} Soru` : '')}
              </Badge>
            )}
            {hasChildren && (
              <Icon as={FiChevronsRight} color={chevronDefaultColor} _groupHover={{color: chevronHoverColor}} opacity={0.9} boxSize="1.2em" />
            )}
          </HStack>
        </Flex>
      </Box>
    </ScaleFade>
  );
}

export default TopicCard;
