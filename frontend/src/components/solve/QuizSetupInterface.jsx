import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Icon,
  VStack,
  Stack,
  Card,
  CardHeader,
  CardBody,
  FormControl,
  FormLabel,
  Select,
  Radio,
  RadioGroup,
  useColorModeValue,
  Alert,
  AlertIcon,
  ScaleFade,
  Spinner,
  Divider, // Divider eklendi
  Flex // Flex eklendi
} from '@chakra-ui/react';
import { FaPlay, FaFilter, FaCogs } from 'react-icons/fa'; // FaCogs eklendi
import { FiSettings, FiZap, FiEdit3 } from 'react-icons/fi'; // FiZap ve FiEdit3 eklendi

function QuizSetupInterface({
  setupMode,
  onSetupModeChange,
  setupFilters,
  onSetupFilterChange,
  examClassifications,
  branchesForSetup,
  topicsForSetup,
  onStartQuiz,
  isFetchingFilters,
  isLoadingQuiz,
  generalError,
}) {

  // Layout ile tutarlı stil değişkenleri
  const cardBg = useColorModeValue("white", "gray.800"); // Kartlar için
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const textMutedColor = useColorModeValue("gray.500", "gray.400");
  const inputSelectBg = useColorModeValue("white", "gray.700"); // Input ve Select arkaplanı
  const focusBorderColor = useColorModeValue("brand.500", "brand.300"); // Odaklanma rengi
  const radioBorderColor = useColorModeValue("gray.300", "gray.600");

  return (
    <Container maxW="container.lg" py={{ base: 6, md: 10 }}> {/* Sayfa geneli padding artırıldı */}
      <VStack spacing={{base: 6, md:8}} align="stretch">
        <Flex direction="column" align="center" mb={4}>
          <Icon as={FiSettings} boxSize={{base:10, md:12}} color={focusBorderColor} mb={3} />
          <Heading as="h1" size={{base:"lg", md:"xl"}} textAlign="center" color={headingColor} fontWeight="bold">
            Soru Çözme Alanı Ayarları
          </Heading>
          <Text color={textMutedColor} fontSize={{base:"sm", md:"md"}} mt={1} textAlign="center">
            Çalışma modunu ve odaklanmak istediğin kapsamı belirle.
          </Text>
        </Flex>

        {generalError && (
           <Alert status="error" variant="subtle" borderRadius="lg" boxShadow="md"> {/* Hata için daha belirgin stil */}
              <AlertIcon /> {generalError}
           </Alert>
        )}

        <Card variant="outline" bg={cardBg} borderColor={borderColor} boxShadow="xl" borderRadius="xl">
          <CardHeader pb={4} borderBottomWidth="1px" borderColor={borderColor}>
              <Heading as="h2" size="lg" color={headingColor} display="flex" alignItems="center">
                <Icon as={FiZap} mr={3} color={focusBorderColor}/>1. Mod Seçimi
              </Heading>
          </CardHeader>
          <CardBody p={{base:4, md:6}}>
              <RadioGroup onChange={onSetupModeChange} value={setupMode}>
              <Stack direction={{base: "column", sm: "row"}} spacing={5}>
                  <Radio 
                    value="practice" 
                    colorScheme="blue" 
                    size="lg" 
                    borderColor={radioBorderColor}
                    p={2} // Radio etrafına padding
                    borderWidth="1px" // Kenarlık
                    borderRadius="md"
                    _hover={{bg: useColorModeValue("blue.50", "blue.800_10") }}
                    w="full"
                  >
                    <Box pl={2}>
                      <Text fontWeight="semibold" color={textColor} fontSize="md">Pratik Modu</Text>
                      <Text fontSize="sm" color={textMutedColor}>(Süresiz, açıklamalar gösterilir)</Text>
                    </Box>
                  </Radio>
                  <Radio 
                    value="deneme" 
                    colorScheme="purple" 
                    size="lg" 
                    borderColor={radioBorderColor}
                    p={2}
                    borderWidth="1px"
                    borderRadius="md"
                    _hover={{bg: useColorModeValue("purple.50", "purple.800_10") }}
                    w="full"
                  >
                    <Box pl={2}>
                      <Text fontWeight="semibold" color={textColor} fontSize="md">Deneme Modu</Text>
                      <Text fontSize="sm" color={textMutedColor}>(Süreli, açıklamalar gösterilmez)</Text>
                    </Box>
                  </Radio>
              </Stack>
              </RadioGroup>
          </CardBody>
        </Card>

        {setupMode && (
          <ScaleFade initialScale={0.97} in={true} transition={{enter: {duration: 0.3}}}>
          <Card variant="outline" bg={cardBg} borderColor={borderColor} boxShadow="xl" borderRadius="xl">
              <CardHeader pb={4} borderBottomWidth="1px" borderColor={borderColor}>
                  <Heading as="h2" size="lg" color={headingColor} display="flex" alignItems="center">
                    <Icon as={FaFilter} mr={3} color={focusBorderColor}/>
                    2. Kapsamı Belirleyin
                    <Text as="span" fontSize="sm" fontWeight="normal" color={textMutedColor} ml={2}> (Opsiyonel)</Text>
                  </Heading>
              </CardHeader>
              <CardBody p={{base:4, md:6}}>
                  <VStack spacing={5} align="stretch">
                      <FormControl id="setupExamClassification">
                      <FormLabel fontSize="sm" color={textMutedColor} fontWeight="medium">Sınav Türü:</FormLabel>
                      <Select
                          name="examClassificationId"
                          placeholder={isFetchingFilters && !setupFilters.examClassificationId ? "Yükleniyor..." : "-- Sınav Türü Seçin --"}
                          value={setupFilters.examClassificationId}
                          onChange={onSetupFilterChange}
                          bg={inputSelectBg}
                          borderColor={borderColor}
                          isDisabled={isFetchingFilters}
                          focusBorderColor={focusBorderColor}
                          borderRadius="md"
                          size="md"
                      >
                          {examClassifications.map(ec => <option key={ec.id} value={ec.id}>{ec.name}</option>)}
                      </Select>
                      </FormControl>

                      <FormControl id="setupBranch" isDisabled={!setupFilters.examClassificationId || isFetchingFilters}>
                      <FormLabel fontSize="sm" color={textMutedColor} fontWeight="medium">Branş:</FormLabel>
                      <Select
                          name="branchId"
                          placeholder={isFetchingFilters && setupFilters.examClassificationId && !setupFilters.branchId ? "Yükleniyor..." : "-- Branş Seç (Seçili Sınavın Tümü) --"}
                          value={setupFilters.branchId}
                          onChange={onSetupFilterChange}
                          bg={inputSelectBg}
                          borderColor={borderColor}
                          isDisabled={isFetchingFilters || !setupFilters.examClassificationId}
                          focusBorderColor={focusBorderColor}
                          borderRadius="md"
                          size="md"
                      >
                          {branchesForSetup.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </Select>
                      {!setupFilters.examClassificationId && <Text fontSize="xs" color={textMutedColor} mt={1}>Branşları listelemek için önce Sınav Türü seçin.</Text>}
                      {setupFilters.examClassificationId && branchesForSetup.length === 0 && !isFetchingFilters && <Text fontSize="xs" color={textMutedColor} mt={1}>Bu sınav türü için uygun branş bulunamadı.</Text>}
                      </FormControl>

                      <FormControl id="setupTopic" isDisabled={!setupFilters.branchId || isFetchingFilters}>
                      <FormLabel fontSize="sm" color={textMutedColor} fontWeight="medium">Konu:</FormLabel>
                      <Select
                          name="topicId"
                          placeholder={isFetchingFilters && setupFilters.branchId && !setupFilters.topicId ? "Yükleniyor..." : "-- Konu Seç (Seçili Branşın Tümü) --"}
                          value={setupFilters.topicId}
                          onChange={onSetupFilterChange}
                          bg={inputSelectBg}
                          borderColor={borderColor}
                          isDisabled={isFetchingFilters || !setupFilters.branchId}
                          focusBorderColor={focusBorderColor}
                          borderRadius="md"
                          size="md"
                      >
                          {topicsForSetup.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </Select>
                      {!setupFilters.branchId && <Text fontSize="xs" color={textMutedColor} mt={1}>Konuları listelemek için önce Branş seçin.</Text>}
                      {setupFilters.branchId && topicsForSetup.length === 0 && !isFetchingFilters && <Text fontSize="xs" color={textMutedColor} mt={1}>Bu branş için uygun ana konu bulunamadı.</Text>}
                      </FormControl>
                      <Text fontSize="xs" color={textMutedColor} mt={1} fontStyle="italic">
                        Kapsam seçmezseniz, modunuza göre genel bir soru havuzundan rastgele sorular getirilir. Deneme Modu için en az bir Sınav Türü seçmeniz önerilir.
                      </Text>
                  </VStack>
              </CardBody>
          </Card>
          </ScaleFade>
        )}

        {setupMode && (
          <Button
            colorScheme="brand"
            size="lg"
            width="full"
            mt={6} // Üstteki kartla arasına boşluk
            onClick={onStartQuiz}
            isLoading={isLoadingQuiz}
            loadingText="Başlatılıyor..."
            leftIcon={<Icon as={FaPlay} />}
            isDisabled={
                !setupMode ||
                (setupMode === 'deneme' && !setupFilters.examClassificationId) // Deneme için Sınav Türü zorunlu
            }
            boxShadow="lg"
            _hover={{boxShadow:"xl", transform:"translateY(-2px)"}}
            py={7} // Buton yüksekliği
            borderRadius="lg" // Buton köşeleri
            letterSpacing="wide" // Harf aralığı
            fontWeight="bold"
          >
            {setupMode === 'deneme' ? "Denemeyi Başlat" : "Pratiği Başlat"}
          </Button>
        )}
      </VStack>
    </Container>
  );
}

export default QuizSetupInterface;
