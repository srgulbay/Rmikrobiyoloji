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
  Spinner // Spinner eklendi
} from '@chakra-ui/react';
import { FaPlay, FaFilter } from 'react-icons/fa';
import { FiSettings } from 'react-icons/fi';

function QuizSetupInterface({
  setupMode,
  onSetupModeChange,
  setupFilters,
  onSetupFilterChange,
  examClassifications,
  branchesForSetup,
  topicsForSetup,
  onStartQuiz,
  isFetchingFilters, // Dropdownlar için yükleme durumu
  isLoadingQuiz,    // "Başlat" butonu için yükleme durumu
  generalError,
  // Stil propları (ana component'ten gelebilir veya burada tanımlanabilir)
  setupBoxBg,
  borderColor,
  headingColor,
  textColor,
  textMutedColor,
  inputSelectBg
}) {

  const localSetupBoxBg = setupBoxBg || useColorModeValue("white", "gray.750");
  const localBorderColor = borderColor || useColorModeValue("gray.200", "gray.600");
  const localHeadingColor = headingColor || useColorModeValue('gray.700', 'gray.100');
  const localTextColor = textColor || useColorModeValue('gray.600', 'gray.300');
  const localTextMutedColor = textMutedColor || useColorModeValue("gray.500", "gray.400");
  const localInputSelectBg = inputSelectBg || useColorModeValue("white", "gray.600");


  return (
    <Container maxW="container.md" py={{ base: 6, md: 10 }}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl" textAlign="center" color={localHeadingColor} display="flex" alignItems="center" justifyContent="center">
          <Icon as={FiSettings} mr={3} /> Soru Çözme Ayarları
        </Heading>

        {generalError && (
           <Alert status="warning" variant="subtle" borderRadius="md">
              <AlertIcon /> {generalError}
           </Alert>
        )}

        <Card variant="outline" bg={localSetupBoxBg} borderColor={localBorderColor} boxShadow="xl" borderRadius="xl">
          <CardHeader pb={3} borderBottomWidth="1px" borderColor={localBorderColor}>
              <Heading as="h2" size="lg" color={localHeadingColor} mb={0}>1. Mod Seçimi</Heading>
          </CardHeader>
          <CardBody p={6}>
              <RadioGroup onChange={onSetupModeChange} value={setupMode}>
              <Stack direction={{base: "column", sm: "row"}} spacing={5}>
                  <Radio value="practice" colorScheme="blue" size="lg" borderColor={localBorderColor}>
                  <Box>
                      <Text fontWeight="semibold" color={localTextColor} fontSize="md">Pratik Modu</Text>
                      <Text fontSize="sm" color={localTextMutedColor} ml={1}>(Süresiz, açıklamalar gösterilir)</Text>
                  </Box>
                  </Radio>
                  <Radio value="deneme" colorScheme="purple" size="lg" borderColor={localBorderColor}>
                  <Box>
                      <Text fontWeight="semibold" color={localTextColor} fontSize="md">Deneme Modu</Text>
                      <Text fontSize="sm" color={localTextMutedColor} ml={1}>(Süreli, açıklamalar gösterilmez)</Text>
                  </Box>
                  </Radio>
              </Stack>
              </RadioGroup>
          </CardBody>
        </Card>

        {setupMode && (
          <ScaleFade initialScale={0.95} in={true}>
          <Card variant="outline" bg={localSetupBoxBg} borderColor={localBorderColor} boxShadow="xl" borderRadius="xl">
              <CardHeader pb={3} borderBottomWidth="1px" borderColor={localBorderColor}>
                  <Heading as="h2" size="lg" color={localHeadingColor} mb={0}>
                    2. Kapsamı Belirleyin 
                    <Text as="span" fontSize="sm" fontWeight="normal" color={localTextMutedColor}> (Opsiyonel)</Text>
                  </Heading>
              </CardHeader>
              <CardBody p={6}>
                  <VStack spacing={5} align="stretch">
                      <FormControl id="setupExamClassification">
                      <FormLabel fontSize="sm" color={localTextMutedColor} fontWeight="medium">Sınav Türü:</FormLabel>
                      <Select 
                          name="examClassificationId" 
                          placeholder={isFetchingFilters && setupFilters.examClassificationId === '' ? "Yükleniyor..." : "-- Sınav Türü Seçin --"}
                          value={setupFilters.examClassificationId} 
                          onChange={onSetupFilterChange}
                          bg={localInputSelectBg}
                          borderColor={localBorderColor}
                          isDisabled={isFetchingFilters}
                          focusBorderColor="brand.400"
                      >
                          {examClassifications.map(ec => <option key={ec.id} value={ec.id}>{ec.name}</option>)}
                      </Select>
                      </FormControl>

                      <FormControl id="setupBranch" isDisabled={!setupFilters.examClassificationId || isFetchingFilters}>
                      <FormLabel fontSize="sm" color={localTextMutedColor} fontWeight="medium">Branş:</FormLabel>
                      <Select 
                          name="branchId" 
                          placeholder={isFetchingFilters && setupFilters.examClassificationId && !setupFilters.branchId ? "Yükleniyor..." : "-- Branş Seç (Seçili Sınavın Tümü) --"}
                          value={setupFilters.branchId} 
                          onChange={onSetupFilterChange}
                          bg={localInputSelectBg}
                          borderColor={localBorderColor}
                          isDisabled={isFetchingFilters || !setupFilters.examClassificationId}
                          focusBorderColor="brand.400"
                      >
                          {branchesForSetup.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </Select>
                      {!setupFilters.examClassificationId && <Text fontSize="xs" color={localTextMutedColor} mt={1}>Branşları listelemek için önce Sınav Türü seçin.</Text>}
                      {setupFilters.examClassificationId && branchesForSetup.length === 0 && !isFetchingFilters && <Text fontSize="xs" color={localTextMutedColor} mt={1}>Bu sınav türü için uygun branş bulunamadı.</Text>}
                      </FormControl>

                      <FormControl id="setupTopic" isDisabled={!setupFilters.branchId || isFetchingFilters}>
                      <FormLabel fontSize="sm" color={localTextMutedColor} fontWeight="medium">Konu:</FormLabel>
                      <Select 
                          name="topicId" 
                          placeholder={isFetchingFilters && setupFilters.branchId && !setupFilters.topicId ? "Yükleniyor..." : "-- Konu Seç (Seçili Branşın Tümü) --"}
                          value={setupFilters.topicId} 
                          onChange={onSetupFilterChange}
                          bg={localInputSelectBg}
                          borderColor={localBorderColor}
                          isDisabled={isFetchingFilters || !setupFilters.branchId}
                          focusBorderColor="brand.400"
                      >
                          {topicsForSetup.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </Select>
                      {!setupFilters.branchId && <Text fontSize="xs" color={localTextMutedColor} mt={1}>Konuları listelemek için önce Branş seçin.</Text>}
                      {setupFilters.branchId && topicsForSetup.length === 0 && !isFetchingFilters && <Text fontSize="xs" color={localTextMutedColor} mt={1}>Bu branş için uygun ana konu bulunamadı.</Text>}
                      </FormControl>
                      <Text fontSize="xs" color={localTextMutedColor} mt={1}>
                        Hiçbir Sınav/Branş/Konu seçmezseniz, seçtiğiniz moda göre genel bir soru havuzundan rastgele sorular getirilir (Pratik Modu) veya Deneme Modu için en azından bir Sınav Türü seçmeniz önerilir.
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
            mt={8} // Bir önceki Box'tan biraz daha fazla boşluk
            onClick={onStartQuiz}
            isLoading={isLoadingQuiz}
            loadingText="Başlatılıyor..."
            leftIcon={<Icon as={FaPlay} />}
            isDisabled={
                !setupMode || // Mod seçilmeli
                (setupMode === 'deneme' && !setupFilters.examClassificationId && !setupFilters.branchId) // Deneme için en az sınav veya branş
            }
            boxShadow="lg"
            _hover={{boxShadow:"xl", transform:"translateY(-2px)"}}
            py={7}
          >
            {setupMode === 'deneme' ? "Denemeyi Başlat" : "Pratiği Başlat"}
          </Button>
        )}
      </VStack>
    </Container>
  );
}

export default QuizSetupInterface;
