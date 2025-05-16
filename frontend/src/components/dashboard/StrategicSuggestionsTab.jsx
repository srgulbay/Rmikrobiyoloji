import React from 'react';
import {
  Box,
  Heading,
  Text,
  Icon,
  Card,
  CardHeader,
  CardBody,
  VStack,
  HStack,
  Button,
  Tag,
  Alert,
  AlertIcon,
  AlertTitle, // AlertTitle eklendi
  AlertDescription, // AlertDescription eklendi
  SimpleGrid,
  useColorModeValue,
  Flex,
  Badge, // Badge eklendi (Tag yerine kullanılabilir)
  Divider // Divider eklendi
} from '@chakra-ui/react';
import { FiTarget, FiZap, FiActivity, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import { FaExclamationCircle, FaStar, FaSeedling, FaBookOpen, FaPencilAlt, FaLightbulb } from 'react-icons/fa';
import { useNavigate, Link as RouterLink } from 'react-router-dom'; // RouterLink eklendi

function StrategicSuggestionsTab({
  studyPlanSuggestions,
  // Stil propları artık içeride useColorModeValue ile alınacak
}) {
  const navigate = useNavigate();

  // Layout ile tutarlı stil değişkenleri
  const mainCardBg = useColorModeValue("white", "gray.800"); // Ana kartlar için
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("gray.700", "whiteAlpha.900");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const textMutedColor = useColorModeValue("gray.500", "gray.400");
  const accentColor = useColorModeValue("brand.500", "brand.300");

  // Öneri kartları için özel arkaplanlar (opsiyonel, mainCardBg de kullanılabilir)
  const suggestionCardBgActual = useColorModeValue("white", "gray.750");
  const suggestionCardBorderActual = borderColor;


  const getSuggestionVisuals = (suggestion) => {
    // İkon ve renkleri daha "teknolojik" veya "yapay zeka" temasına uygun seçebiliriz
    switch (suggestion.type) {
      case 'Performans Uyarısı':
        return { icon: FiZap, color: useColorModeValue("red.500", "red.300"), colorScheme: "red" };
      case 'Öncelikli Gelişim Alanı':
        return { icon: FaExclamationCircle, color: useColorModeValue("orange.500", "orange.300"), colorScheme: "orange" };
      case 'Motivasyon ve Aktivite':
        return { icon: FiActivity, color: useColorModeValue("yellow.500", "yellow.400"), colorScheme: "yellow" };
      case 'Tebrikler!':
      case 'İyi Durumdasın':
        return { icon: FaStar, color: useColorModeValue("green.500", "green.300"), colorScheme: "green" };
      case 'Gücünü Koru':
        return { icon: FaSeedling, color: useColorModeValue("teal.500", "teal.300"), colorScheme: "teal" };
      default:
        return { icon: FaLightbulb, color: accentColor, colorScheme: "brand" }; // FiTarget yerine FaLightbulb veya FiCpu
    }
  };

  return (
    <VStack spacing={{base:6, md:8}} align="stretch">
      <Flex align="center" gap={3}>
        <Icon as={FiTarget} boxSize={{base:7, md:8}} color={accentColor}/>
        <Heading as="h3" size={{base:"lg", md:"xl"}} color={headingColor} fontWeight="bold">
          Dijital Mentor Önerileri
        </Heading>
      </Flex>
      
      {studyPlanSuggestions.length > 0 ? (
        <SimpleGrid columns={{base: 1, lg: 2}} spacing={{base:5, md:6}}> {/* lg'de 2 sütun */}
          {studyPlanSuggestions.map((suggestion) => {
            const { icon: SuggestionIcon, color: suggestionIconColor, colorScheme: tagColorScheme } = getSuggestionVisuals(suggestion);
            return (
              <Card 
                key={suggestion.id} 
                bg={suggestionCardBgActual} 
                borderColor={suggestionCardBorderActual} 
                borderWidth="1px" 
                boxShadow="xl" // Daha belirgin gölge
                variant="outline" 
                borderRadius="xl" // Daha yuvarlak köşeler
                display="flex" 
                flexDirection="column" 
                justifyContent="space-between"
                h="100%"
                overflow="hidden" // Kart içinden taşmaları engelle
                transition="all 0.2s ease-out"
                _hover={{ transform: "translateY(-4px)", boxShadow: "2xl" }}
              >
                <CardHeader pb={3} borderBottomWidth="1px" borderColor={suggestionCardBorderActual} bg={useColorModeValue(`${tagColorScheme}.50`, `${tagColorScheme}.800`)} borderTopRadius="xl">
                  <Flex direction={{base:"column", sm:"row"}} justify="space-between" align={{base:"flex-start", sm:"center"}} gap={2}>
                    <HStack spacing={3}>
                      <Icon as={SuggestionIcon} color={suggestionIconColor} boxSize={7}/>
                      <Heading size="md" color={useColorModeValue(`${tagColorScheme}.700`, `${tagColorScheme}.100`)} noOfLines={1} title={suggestion.title}>
                        {suggestion.title}
                      </Heading>
                    </HStack>
                    <Badge
                        size="md" // Biraz daha büyük
                        colorScheme={tagColorScheme}
                        variant="solid"
                        borderRadius="full"
                        px={3} py={1} // Padding
                        alignSelf={{base:"flex-start", sm:"center"}}
                        mt={{base:2, sm:0}}
                        textTransform="none" // Öneri tipleri zaten büyük harfle başlıyor
                    >
                        {suggestion.type}
                    </Badge>
                  </Flex>
                </CardHeader>
                <CardBody pt={5} flexGrow={1}> {/* pt artırıldı */}
                  <Text fontSize="md" color={textColor} mb={4} lineHeight="tall"> {/* lineHeight artırıldı */}
                    {suggestion.reason}
                  </Text>
                </CardBody>
                {suggestion.actions && suggestion.actions.length > 0 && (
                  <Flex p={5} borderTopWidth="1px" borderColor={suggestionCardBorderActual} justifyContent="flex-end" bg={useColorModeValue("gray.50", "gray.700")}>
                    <HStack spacing={3} wrap="wrap" justifyContent="flex-end">
                      {suggestion.actions.map((action, index) => (
                        <Button 
                          key={`${suggestion.id}-action-${index}`} 
                          size="md" // Buton boyutu artırıldı
                          colorScheme={action.colorScheme || tagColorScheme} // Ana renk şemasıyla uyumlu
                          variant="solid" // Daha belirgin
                          leftIcon={<Icon as={action.icon || FaPencilAlt} />} 
                          onClick={action.scrollTarget ? () => {
                              const tabList = document.querySelector('.chakra-tabs__tablist');
                              const tabs = tabList ? Array.from(tabList.querySelectorAll('.chakra-tabs__tab')) : [];
                              const targetTabIndex = 2;
                              if (tabs.length > targetTabIndex && typeof tabs[targetTabIndex].click === 'function') {
                                  tabs[targetTabIndex].click();
                              }
                              setTimeout(() => {
                                  const targetElement = document.getElementById(action.scrollTarget);
                                  if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 250);
                          } : () => navigate(action.to)}
                          boxShadow="md" 
                          borderRadius="lg" // Daha yuvarlak buton
                          _hover={{boxShadow:"lg", transform:"translateY(-2px)"}}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </HStack>
                  </Flex>
                )}
              </Card>
            );
          })}
        </SimpleGrid>
      ) : (
        <Alert 
            status="success" 
            variant="subtle" 
            borderRadius="xl" 
            bg={useColorModeValue("green.50", "rgba(56,161,105,0.15)")} 
            borderColor={useColorModeValue("green.200", "green.700")} 
            borderWidth="1px" 
            p={{base:6, md:8}} // Padding artırıldı
            boxShadow="xl" // Gölge eklendi
            flexDirection="column"
            alignItems="center"
            textAlign="center"
        >
            <Icon as={FaStar} boxSize={{base:"32px", md:"40px"}} color={useColorModeValue("green.500", "green.300")} mb={4}/>
            <AlertTitle fontWeight="bold" fontSize={{base:"xl", md:"2xl"}} color={useColorModeValue("green.700", "green.100")}>
                Harika İlerliyorsun!
            </AlertTitle>
            <AlertDescription fontSize={{base:"md", md:"lg"}} color={textColor} mt={3} maxW="lg" lineHeight="tall">
                Şu an için Dijital Mentorunun sana özel bir stratejik önerisi bulunmuyor. Bu tempoyla öğrenmeye ve pratik yapmaya devam et!
            </AlertDescription>
            <Button 
                as={RouterLink} 
                to="/solve" 
                colorScheme="green" 
                variant="solid" // Daha belirgin
                mt={6} 
                size="lg" 
                px={8} py={6} 
                borderRadius="lg"
                leftIcon={<Icon as={FaPencilAlt}/>}
                boxShadow="md" _hover={{boxShadow:"lg"}}
            >
                Genel Pratik Yap
            </Button>
        </Alert>
      )}
    </VStack>
  );
}

export default StrategicSuggestionsTab;
