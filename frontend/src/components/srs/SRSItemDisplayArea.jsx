import React from 'react';
import DOMPurify from 'dompurify';
import {
  Box,
  Heading,
  Text,
  VStack,
  Collapse,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { FaQuestionCircle, FaBookReader, FaClone, FaBrain } from 'react-icons/fa';

function SRSItemDisplayArea({
  currentItem,
  isAnswerShown,
  headingColor: propHeadingColor,
  textColor: propTextColor,
  textMutedColor: propTextMutedColor, // prop olarak alabiliriz
  borderColor: propBorderColor,
  promptBg: propPromptBg,
  answerBg: propAnswerBg
}) {
  const headingColor = propHeadingColor || useColorModeValue("gray.700", "gray.100");
  // textMutedColor prop'tan veya varsayılan tema renginden alınsın
  const textMutedColor = propTextMutedColor || useColorModeValue("gray.500", "gray.400");
  const textColor = propTextColor || useColorModeValue("gray.600", "gray.300");
  const borderColor = propBorderColor || useColorModeValue("gray.200", "gray.600");
  const promptBg = propPromptBg || useColorModeValue("gray.50", "gray.800");
  const answerBg = propAnswerBg || useColorModeValue("gray.100", "gray.700");

  if (!currentItem || !currentItem.itemData) {
    return <Text color={textColor}>Tekrar öğesi yüklenemedi.</Text>;
  }

  const { itemType, itemData } = currentItem;

  let displayContent = null;
  let promptIcon = FaBrain;

  switch (itemType) {
    case 'flashcard':
      promptIcon = FaClone;
      displayContent = (
        <VStack spacing={4} align="stretch" w="full">
          <Heading size="md" color={textColor} fontWeight="normal">
            Bu bilgi kartını hatırlamaya çalışın:
          </Heading>
          <Box
            minH="100px" w="full" p={4} fontSize="lg" lineHeight="tall"
            borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={promptBg}
            display="flex" alignItems="center" justifyContent="center"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(itemData.frontText || "") }}
            sx={{ '& img': { maxW: '90%', h: 'auto', my:3, borderRadius:'md', display:'block', mx:'auto', boxShadow:'sm' }, '& p': {mb:2} }}
          />
          <Collapse in={isAnswerShown} animateOpacity unmountOnExit style={{width: "100%"}}>
            <Box mt={3} pt={3} borderTopWidth="2px" borderStyle="dashed" borderColor={borderColor}>
              <Heading size="sm" color={headingColor} mb={3} textAlign="center" fontWeight="semibold" p={2} bg={useColorModeValue("gray.100", "gray.800")} borderRadius="md">
                Kartın Arka Yüzü
              </Heading>
              <Box
                minH="100px" w="full" p={4} bg={answerBg} borderRadius="lg"
                fontSize="md" lineHeight="tall" boxShadow="inner"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(itemData.backText || "") }}
                sx={{ '& img': { maxW: '90%', h:'auto', my:3, borderRadius:'md' }, '& p': {mb:2}}}
              />
            </Box>
          </Collapse>
        </VStack>
      );
      break;

    case 'question':
      promptIcon = FaQuestionCircle;
      displayContent = (
        <VStack spacing={3} align="center" w="full">
          <Icon as={promptIcon} boxSize="32px" color={headingColor} />
          <Heading size="md" color={textColor} fontWeight="normal" textAlign="center">
            Soru Tekrarı
          </Heading>
          <Text color={textColor} fontSize="lg" textAlign="center">
            Sıradaki soruyu çözmeye ve değerlendirmeye hazır mısınız?
          </Text>
          <Text color={textMutedColor} fontSize="sm" fontStyle="italic" textAlign="center" noOfLines={2} title={DOMPurify.sanitize(itemData.text || "", {RETURN_DOM_FRAGMENT: false, RETURN_DOM: false}).textContent}>
            İpucu: "{(DOMPurify.sanitize(itemData.text || "", {RETURN_DOM_FRAGMENT: false, RETURN_DOM: false}).textContent || '').substring(0, 70)}..."
          </Text>
        </VStack>
      );
      break;

    case 'topic_summary': // TERMİNOLOJİ DEĞİŞİKLİĞİ BURADA
      promptIcon = FaBookReader;
      displayContent = (
        <VStack spacing={3} align="center" w="full">
          <Icon as={promptIcon} boxSize="32px" color={headingColor} />
          <Heading size="md" color={textColor} fontWeight="normal" textAlign="center">
            Konu Tekrarı {/* "Konu Özeti Tekrarı" yerine "Konu Tekrarı" */}
          </Heading>
          <Text color={textColor} fontSize="lg" textAlign="center">
            "{itemData.name || 'Bilinmeyen Konu'}" konusunun ana hatlarını hatırlamaya çalışın.
          </Text>
          <Text color={textMutedColor} fontSize="sm" fontStyle="italic" textAlign="center">
            Hazır olduğunuzda konu anlatımını inceleyebilir veya bu konunun sorularını çözebilirsiniz.
          </Text>
        </VStack>
      );
      break;

    default:
      displayContent = <Text color={textColor}>Bilinmeyen tekrar öğesi türü: {itemType}</Text>;
  }

  return (
    <VStack spacing={4} align="stretch" w="full" justifyContent="center" flexGrow={1}>
      {displayContent}
    </VStack>
  );
}

export default SRSItemDisplayArea;
