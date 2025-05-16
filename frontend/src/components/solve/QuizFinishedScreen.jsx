import React from 'react';
import {
  Container,
  Heading,
  Text,
  Button,
  Icon,
  Card,
  CardBody,
  CardHeader, // CardHeader eklendi
  List,
  ListItem,
  HStack,
  VStack,
  useColorModeValue,
  Divider, // Divider eklendi
  Box,    // Box eklendi
  Flex    // Flex eklendi
} from '@chakra-ui/react';
import { FaRedo, FaListAlt, FaTrophy, FaCheckCircle, FaTimesCircle, FaQuestionCircle, FaClock } from 'react-icons/fa';
import { FiAward } from 'react-icons/fi'; // Daha modern bir kupa ikonu
import { Link as RouterLink } from 'react-router-dom';

const formatTime = totalSeconds => {
    if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

function QuizFinishedScreen({
  quizState,
  onRestartQuizSetup,
  // Stil propları artık içeride useColorModeValue ile alınacak
}) {
  const { questions, score, quizMode, quizFixedDurationSeconds, timeElapsed, quizTitle, isSrsMode } = quizState;
  
  const accuracy = questions.length > 0 ? ((score / questions.length) * 100) : 0;
  const accuracyColorScheme = accuracy >= 85 ? 'green' : accuracy >= 60 ? 'yellow' : 'red';
  const timeTakenOrRemaining = (quizMode === 'deneme' && !isSrsMode && quizFixedDurationSeconds != null)
    ? quizFixedDurationSeconds - timeElapsed 
    : timeElapsed;

  // Layout ile tutarlı stil değişkenleri
  const mainBg = useColorModeValue('gray.100', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const textMutedColor = useColorModeValue('gray.500', 'gray.400');
  const accentColor = useColorModeValue('brand.500', 'brand.300');
  const trophyIconColor = useColorModeValue('yellow.400', 'yellow.300'); // Kupa ikonu için

  const resultTitle = isSrsMode 
    ? "Tekrar Tamamlandı!" 
    : (quizMode === 'deneme' ? 'Deneme Tamamlandı!' : 'Pratik Tamamlandı!');

  return (
    <Container maxW="container.lg" py={{base: 6, md: 10}} centerContent>
      <Card 
        textAlign="center" 
        p={{base:5, md:8}} 
        variant="outline" 
        w="full" 
        maxW="xl" // Kartı biraz daha genişletebiliriz
        bg={cardBg} 
        borderColor={borderColor} 
        boxShadow="xl" // Daha belirgin gölge
        borderRadius="xl" // Daha yuvarlak köşeler
      >
        <CardHeader pb={3}>
          <VStack spacing={3}>
            <Icon as={FiAward} boxSize={{base:"48px", md:"64px"}} color={trophyIconColor} />
            <Heading as="h2" size={{base:"xl", md:"2xl"}} color={headingColor} fontWeight="bold">
              {resultTitle}
            </Heading>
            <Text fontSize={{base:"md", md:"lg"}} color={textColor} fontStyle="italic">
              "{quizTitle}"
            </Text>
          </VStack>
        </CardHeader>
        <Divider my={6} borderColor={borderColor} />
        <CardBody>
          <List spacing={4} my={6} fontSize={{base:"sm", md:"md"}} textAlign="left">
            { (quizMode === 'deneme' && !isSrsMode && quizFixedDurationSeconds != null) &&
              <ListItem display="flex" justifyContent="space-between" alignItems="center" py={1}>
                  <HStack color={textMutedColor}><Icon as={FaClock} /> <Text>Kullanılan Süre:</Text></HStack>
                  <Text fontWeight="semibold" color={textColor}>{formatTime(timeTakenOrRemaining < 0 ? 0 : timeTakenOrRemaining)}</Text>
              </ListItem>
            }
             { (quizMode === 'deneme' && !isSrsMode && quizFixedDurationSeconds != null) &&
              <ListItem display="flex" justifyContent="space-between" alignItems="center" py={1}>
                  <HStack color={textMutedColor}><Icon as={FaStopwatch} /> <Text>Toplam Süre:</Text></HStack>
                  <Text fontWeight="semibold" color={textColor}>{formatTime(quizFixedDurationSeconds)}</Text>
              </ListItem>
            }
            { quizMode === 'practice' && !isSrsMode &&
                <ListItem display="flex" justifyContent="space-between" alignItems="center" py={1}>
                    <HStack color={textMutedColor}><Icon as={FaClock} /> <Text>Harcanan Süre:</Text></HStack>
                    <Text fontWeight="semibold" color={textColor}>{formatTime(timeElapsed)}</Text>
                </ListItem>
            }
            {!isSrsMode && ( // SRS modunda Toplam Soru, Doğru, Yanlış göstermeyelim, tek soru vardı.
                <>
                    <ListItem display="flex" justifyContent="space-between" alignItems="center" py={1}>
                        <HStack color={textMutedColor}><Icon as={FaQuestionCircle} /> <Text>Toplam Soru:</Text></HStack>
                        <Text fontWeight="semibold" color={textColor}>{questions.length}</Text>
                    </ListItem>
                    <ListItem display="flex" justifyContent="space-between" alignItems="center" py={1}>
                        <HStack color="green.500"><Icon as={FaCheckCircle} /> <Text>Doğru Cevap:</Text></HStack>
                        <Text fontWeight="semibold" color="green.500">{score}</Text>
                    </ListItem>
                    <ListItem display="flex" justifyContent="space-between" alignItems="center" py={1}>
                        <HStack color="red.500"><Icon as={FaTimesCircle} /> <Text>Yanlış Cevap:</Text></HStack>
                        <Text fontWeight="semibold" color="red.500">{questions.length - score}</Text>
                    </ListItem>
                </>
            )}
          </List>
          
          {!isSrsMode && (
            <VStack spacing={2} my={8}>
              <Text fontSize={{base:"lg", md:"xl"}} fontWeight="semibold" color={textColor}>Başarı Oranınız:</Text>
              <Text fontSize={{base:"4xl", md:"5xl"}} fontWeight="bold" color={`${accuracyColorScheme}.500`}>
                %{accuracy.toFixed(0)}
              </Text>
            </VStack>
          )}

          {isSrsMode && (
            <Text fontSize="lg" color={textColor} my={8}>
                Bu soru için değerlendirmeniz kaydedildi. Antrenör seansınıza devam edebilirsiniz.
            </Text>
          )}

          <VStack spacing={4} justifyContent="center" mt={8} w="full">
              {isSrsMode ? (
                <Button 
                    colorScheme="brand" 
                    size="lg" 
                    onClick={() => navigate(quizState.srsReturnPath || '/digital-coach')} // quizState'ten srsReturnPath'i al
                    leftIcon={<Icon as={FaArrowLeft} />}
                    w={{base:"full", sm:"auto"}}
                    px={10} py={7}
                    boxShadow="lg" _hover={{boxShadow:"xl", transform:"translateY(-1px)"}}
                >
                    Antrenör Seansına Dön
                </Button>
              ) : (
                <HStack spacing={4} direction={{base:"column", sm:"row"}} w="full" justifyContent="center">
                    <Button 
                        colorScheme="brand" 
                        size="lg" 
                        onClick={onRestartQuizSetup} 
                        leftIcon={<Icon as={FaRedo} />}
                        w={{base:"full", sm:"auto"}}
                        px={8} py={6}
                        boxShadow="lg" _hover={{boxShadow:"xl", transform:"translateY(-1px)"}}
                    >
                        Yeni Test Kur
                    </Button>
                    <Button 
                        as={RouterLink} 
                        to="/browse" 
                        variant="outline" 
                        colorScheme="gray" // Daha nötr bir görünüm
                        size="lg"
                        w={{base:"full", sm:"auto"}}
                        px={8} py={6}
                        leftIcon={<Icon as={FaListAlt} />}
                    >
                        Konu Seçimine Dön
                    </Button>
                </HStack>
              )}
          </VStack>
        </CardBody>
      </Card>
    </Container>
  );
}

export default QuizFinishedScreen;
