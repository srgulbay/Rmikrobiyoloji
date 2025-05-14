import React from 'react';
import {
  Container,
  Heading,
  Text,
  Button,
  Icon,
  Card,
  CardBody,
  List,
  ListItem,
  HStack,
  VStack, // VStack eklendi
  useColorModeValue,
} from '@chakra-ui/react';
import { FaRedo, FaListAlt, FaTrophy } from 'react-icons/fa'; // FaTrophy eklendi
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
  onRestartQuizSetup, // Yeniden kurulum için handler
  // Stil Propları
  cardBg,
  borderColor,
  stepIndicatorColor, // Başlık için
  textColor,
  textMutedColor,
}) {
  const { questions, score, quizMode, quizFixedDurationSeconds, timeElapsed, quizTitle } = quizState;
  
  const accuracy = questions.length > 0 ? ((score / questions.length) * 100) : 0;
  const accuracyColorScheme = accuracy >= 80 ? 'green' : accuracy >= 50 ? 'yellow' : 'red';
  const timeTakenOrRemaining = quizMode === 'deneme' && quizFixedDurationSeconds != null 
    ? quizFixedDurationSeconds - timeElapsed 
    : timeElapsed;

  const headingColorResolved = stepIndicatorColor || useColorModeValue('brand.600', 'brand.300');
  const cardBgResolved = cardBg || useColorModeValue("white", "gray.750");
  const borderColorResolved = borderColor || useColorModeValue("gray.200", "gray.600");
  const textColorResolved = textColor || useColorModeValue("gray.700", "gray.200");
  const textMutedColorResolved = textMutedColor || useColorModeValue("gray.500", "gray.400");


  return (
    <Container maxW="container.md" centerContent py={{base: 8, md: 10}}>
      <Card textAlign="center" p={{base:4, md:8}} variant="outline" w="full" bg={cardBgResolved} borderColor={borderColorResolved} boxShadow="xl" borderRadius="xl">
        <CardBody>
          <Icon as={FaTrophy} boxSize="48px" color={headingColorResolved} mb={4}/>
          <Heading as="h2" size="2xl" mb={3} color={headingColorResolved}>
            {quizMode === 'deneme' ? 'Deneme Tamamlandı!' : 'Pratik Tamamlandı!'}
          </Heading>
          <Text fontSize="lg" color={textColorResolved} mb={6}>
            {quizTitle}
          </Text>
          <List spacing={3} my={6} py={5} borderTopWidth="1px" borderBottomWidth="1px" borderColor={borderColorResolved} textAlign="left" fontSize={{base:"sm", md:"md"}}>
            <ListItem display="flex" justifyContent="space-between">
              <Text as="span" color={textMutedColorResolved}>
                  {quizMode === 'deneme' && quizFixedDurationSeconds != null ? 'Kullanılan Süre:' : 'Harcanan Süre:'}
              </Text>
              <Text as="span" fontWeight="semibold" color={textColorResolved}>{formatTime(timeTakenOrRemaining < 0 ? 0 : timeTakenOrRemaining)}</Text>
            </ListItem>
            {quizMode === 'deneme' && quizFixedDurationSeconds != null && 
              <ListItem display="flex" justifyContent="space-between">
                  <Text as="span" color={textMutedColorResolved}>Toplam Süre:</Text>
                  <Text as="span" fontWeight="semibold" color={textColorResolved}>{formatTime(quizFixedDurationSeconds)}</Text>
              </ListItem>
            }
            <ListItem display="flex" justifyContent="space-between">
                <Text as="span" color={textMutedColorResolved}>Toplam Soru:</Text>
                <Text as="span" fontWeight="semibold" color={textColorResolved}>{questions.length}</Text>
            </ListItem>
            <ListItem display="flex" justifyContent="space-between">
                <Text as="span" color={textMutedColorResolved}>Doğru Cevap:</Text>
                <Text as="span" fontWeight="semibold" color="green.500">{score}</Text>
            </ListItem>
            <ListItem display="flex" justifyContent="space-between">
                <Text as="span" color={textMutedColorResolved}>Yanlış Cevap:</Text>
                <Text as="span" fontWeight="semibold" color="red.500">{questions.length - score}</Text>
            </ListItem>
          </List>
          <VStack spacing={2} mb={6}>
            <Text fontSize={{base:"md", md:"lg"}} fontWeight="semibold" color={textColorResolved}>Başarı Oranınız:</Text>
            <Text fontSize={{base:"4xl", md:"5xl"}} fontWeight="bold" color={`${accuracyColorScheme}.500`}>
              %{accuracy.toFixed(0)} 
              {/* .toFixed(0) eklendi, ondalıksız göstermek için */}
            </Text>
          </VStack>
          <HStack spacing={4} justifyContent="center" mt={8} direction={{base:"column", sm:"row"}} w="full">
              <Button 
                colorScheme="brand" 
                size="lg" 
                onClick={onRestartQuizSetup} 
                leftIcon={<Icon as={FaRedo} />}
                w={{base:"full", sm:"auto"}}
                boxShadow="md" _hover={{boxShadow:"lg"}}
              >
                Yeni Test Kur
              </Button>
              <Button 
                as={RouterLink} 
                to="/browse" 
                variant="outline" 
                size="lg"
                w={{base:"full", sm:"auto"}}
                leftIcon={<Icon as={FaListAlt} />}
              >
                Konu Seçimine Dön
              </Button>
          </HStack>
        </CardBody>
      </Card>
    </Container>
  );
}

export default QuizFinishedScreen;
