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
  SimpleGrid,
  useColorModeValue,
  Flex
} from '@chakra-ui/react';
import { FiTarget, FiZap, FiActivity, FiCheckCircle } from 'react-icons/fi'; // Öneri tiplerine göre ikonlar
import { FaExclamationCircle, FaStar, FaSeedling, FaBookOpen, FaPencilAlt } from 'react-icons/fa'; // Diğer ikonlar
import { useNavigate } from 'react-router-dom';


function StrategicSuggestionsTab({
  studyPlanSuggestions,
  // Stil propları
  suggestionCardBg,
  suggestionCardBorder,
  headingColor,
  textColor,
  textMutedColor,
}) {
  const navigate = useNavigate();
  const defaultSuggestionIcon = FiTarget;
  const defaultIconColor = useColorModeValue("brand.500", "brand.300");

  const getSuggestionIconAndColor = (suggestion) => {
    switch (suggestion.type) {
      case 'Performans Uyarısı':
        return { icon: suggestion.icon || FiZap, color: suggestion.color || "red.500" };
      case 'Öncelikli Gelişim Alanı':
        return { icon: suggestion.icon || FaExclamationCircle, color: suggestion.color || "orange.500" };
      case 'Motivasyon ve Aktivite':
        return { icon: suggestion.icon || FiActivity, color: suggestion.color || "yellow.500" };
      case 'Tebrikler!':
        return { icon: suggestion.icon || FaStar, color: suggestion.color || "green.500" };
      case 'Gücünü Koru':
        return { icon: suggestion.icon || FaSeedling, color: suggestion.color || "teal.500" };
      case 'İyi Durumdasın':
         return { icon: suggestion.icon || FiCheckCircle, color: suggestion.color || "green.500"};
      default:
        return { icon: defaultSuggestionIcon, color: defaultIconColor };
    }
  };

  return (
    <VStack spacing={{base:4, md:6}} align="stretch">
      <Heading size="lg" color={headingColor} display="flex" alignItems="center" mb={2}>
        <Icon as={FiTarget} color="brand.500" mr={3} boxSize={7}/> Dijital Mentor Önerileri
      </Heading>
      {studyPlanSuggestions.length > 0 ? (
        <SimpleGrid columns={{base: 1, md: 2}} spacing={{base:4, md:6}}>
          {studyPlanSuggestions.map((suggestion) => {
            const { icon: SuggestionIcon, color: suggestionIconColor } = getSuggestionIconAndColor(suggestion);
            return (
              <Card 
                key={suggestion.id} 
                bg={suggestionCardBg} 
                borderColor={suggestionCardBorder} 
                borderWidth="1px" 
                boxShadow="lg" 
                variant="outline" 
                borderRadius="xl"
                display="flex" 
                flexDirection="column" 
                justifyContent="space-between"
                h="100%" // Kartların aynı yükseklikte olması için
              >
                <CardHeader pb={2} borderBottomWidth="1px" borderColor={suggestionCardBorder}>
                  <Flex direction={{base:"column", sm:"row"}} justify="space-between" align={{base:"flex-start", sm:"center"}} gap={2}>
                    <HStack spacing={3}>
                      <Icon as={SuggestionIcon} color={suggestionIconColor} boxSize={6}/>
                      <Heading size="sm" color={useColorModeValue("blue.700", "blue.200")} noOfLines={2} title={suggestion.title}>
                        {suggestion.title}
                      </Heading>
                    </HStack>
                    <Tag 
                        size="sm" 
                        colorScheme={suggestion.priority === 0 ? "red" : suggestion.priority === 1 ? "orange" : suggestion.priority === 2 ? "yellow" : "green"} 
                        variant="solid" 
                        borderRadius="full" 
                        alignSelf={{base:"flex-start", sm:"center"}}
                        mt={{base:1, sm:0}}
                    >
                        {suggestion.type}
                    </Tag>
                  </Flex>
                </CardHeader>
                <CardBody pt={4} flexGrow={1}>
                  <Text fontSize="sm" color={textColor} mb={4} lineHeight="base">
                    {suggestion.reason}
                  </Text>
                </CardBody>
                {suggestion.actions && suggestion.actions.length > 0 && (
                  <Flex p={4} borderTopWidth="1px" borderColor={suggestionCardBorder} justifyContent="flex-start">
                    <HStack spacing={3} wrap="wrap">
                      {suggestion.actions.map((action, index) => (
                        <Button 
                          key={`${suggestion.id}-action-${index}`} 
                          size="sm" 
                          colorScheme={action.colorScheme || "blue"} 
                          variant={action.variant || "outline"}
                          leftIcon={<Icon as={action.icon || FaPencilAlt} />} 
                          onClick={action.scrollTarget ? () => {
                              const tabList = document.querySelector('.chakra-tabs__tablist');
                              const tabs = tabList ? Array.from(tabList.querySelectorAll('.chakra-tabs__tab')) : [];
                              const targetTabIndex = 2; // "Detaylı Konu Analizi" sekmesinin indeksi (0'dan başlar)
                              
                              if (tabs.length > targetTabIndex && typeof tabs[targetTabIndex].click === 'function') {
                                  tabs[targetTabIndex].click();
                              } else {
                                  console.warn("Hedef sekme bulunamadı veya tıklanamadı.");
                              }

                              setTimeout(() => {
                                  const targetElement = document.getElementById(action.scrollTarget);
                                  if (targetElement) {
                                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  } else {
                                    console.warn(`Scroll hedefi bulunamadı: ${action.scrollTarget}`);
                                  }
                              }, 250); // Sekme geçişi için kısa bir gecikme
                          } : () => navigate(action.to)}
                          boxShadow="sm" 
                          _hover={{boxShadow:"md", transform:"translateY(-1px)"}}
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
            p={6} 
            boxShadow="lg"
            flexDirection="column"
            alignItems="center"
            textAlign="center"
        >
            <Icon as={FaStar} boxSize="32px" color="green.400" mb={3}/>
            <AlertTitle fontWeight="semibold" fontSize="xl" color={useColorModeValue("green.700", "green.200")}>
                Harika İlerliyorsun!
            </AlertTitle>
            <AlertDescription fontSize="md" color={textColor} mt={2} maxW="lg">
                Şu an için Dijital Mentorunun sana özel bir stratejik önerisi bulunmuyor. Bu tempoyla öğrenmeye ve pratik yapmaya devam et! Genel pratikler için soru çözebilir veya yeni konular keşfedebilirsin.
            </AlertDescription>
            <Button as={RouterLink} to="/solve" colorScheme="green" variant="outline" mt={5} size="md">
                Genel Pratik Yap
            </Button>
        </Alert>
      )}
    </VStack>
  );
}

export default StrategicSuggestionsTab;
