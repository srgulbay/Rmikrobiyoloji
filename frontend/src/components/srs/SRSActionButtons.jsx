import React from 'react';
import { Flex, Box, Button, Icon, HStack, useColorModeValue } from '@chakra-ui/react';
import {
  FaEye, FaQuestionCircle, FaBookOpen, FaPencilAlt
} from 'react-icons/fa';
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

function SRSActionButtons({
  currentItem,
  isAnswerShown,
  isSubmittingResult,
  onShowAnswerClick,
  onNavigateToItemAction,
  onSubmitFlashcardFeedback,
  onSolveTopicQuestionsClick,
}) {
  if (!currentItem || !currentItem.itemType) {
    return null;
  }

  const { itemType } = currentItem;

  // Stil değişkenleri (Layout ve diğerleriyle tutarlılık için)
  const buttonTextColor = useColorModeValue("white", "gray.900");
  const brandButtonBg = useColorModeValue("brand.500", "brand.300");
  const brandButtonHoverBg = useColorModeValue("brand.600", "brand.400");

  const tealButtonBg = useColorModeValue("teal.500", "teal.300");
  const tealButtonHoverBg = useColorModeValue("teal.600", "teal.400");
  
  const blueButtonBg = useColorModeValue("blue.500", "blue.300");
  const blueButtonHoverBg = useColorModeValue("blue.600", "blue.400");

  const redButtonBg = useColorModeValue("red.500", "red.400");
  const redButtonHoverBg = useColorModeValue("red.600", "red.500");

  const greenButtonBg = useColorModeValue("green.500", "green.400");
  const greenButtonHoverBg = useColorModeValue("green.600", "green.500");


  let primaryActionContent = null;
  let secondaryActionContent = null; // Konu Tekrarı için ikinci buton

  if (itemType === 'flashcard') {
    if (!isAnswerShown) {
      primaryActionContent = (
        <Button
          bg={blueButtonBg}
          color={buttonTextColor}
          _hover={{ bg: blueButtonHoverBg }}
          onClick={onShowAnswerClick}
          leftIcon={<Icon as={FaEye} />}
          isLoading={isSubmittingResult}
          w={{ base: "full", sm: "auto" }}
          size="lg" px={10} py={7} boxShadow="lg" borderRadius="lg"
        >
          Cevabı Göster
        </Button>
      );
    } else {
      primaryActionContent = (
        <>
          <Button
            bg={redButtonBg}
            color={buttonTextColor}
            _hover={{ bg: redButtonHoverBg }}
            onClick={() => onSubmitFlashcardFeedback(false)}
            leftIcon={<Icon as={FiXCircle} />}
            isLoading={isSubmittingResult}
            w={{ base: "full", sm: "48%" }} size="lg" py={7} boxShadow="lg" borderRadius="lg"
          >
            Tekrar Etmem Gerek
          </Button>
          <Button
            bg={greenButtonBg}
            color={buttonTextColor}
            _hover={{ bg: greenButtonHoverBg }}
            onClick={() => onSubmitFlashcardFeedback(true)}
            leftIcon={<Icon as={FiCheckCircle} />}
            isLoading={isSubmittingResult}
            w={{ base: "full", sm: "48%" }} size="lg" py={7} boxShadow="lg" borderRadius="lg"
          >
            Doğru Hatırladım
          </Button>
        </>
      );
    }
  } else if (itemType === 'question') {
    primaryActionContent = (
      <Button
        bg={brandButtonBg}
        color={buttonTextColor}
        _hover={{ bg: brandButtonHoverBg }}
        onClick={onNavigateToItemAction}
        leftIcon={<Icon as={FaQuestionCircle} />}
        w={{ base: "full", sm: "auto" }}
        size="lg" px={10} py={7} boxShadow="lg" borderRadius="lg"
        isDisabled={isSubmittingResult}
      >
        Soruyu Çöz & Değerlendir
      </Button>
    );
  } else if (itemType === 'topic_summary') {
    primaryActionContent = (
      <Button
        bg={brandButtonBg}
        color={buttonTextColor}
        _hover={{ bg: brandButtonHoverBg }}
        onClick={onNavigateToItemAction}
        leftIcon={<Icon as={FaBookOpen} />}
        w={{ base: "full", md: "auto" }}
        size="lg" px={8} py={7} boxShadow="lg" borderRadius="lg"
        isDisabled={isSubmittingResult}
      >
        Konu Anlatımını İncele
      </Button>
    );
    secondaryActionContent = (
      <Button
        bg={tealButtonBg}
        color={buttonTextColor}
        _hover={{bg: tealButtonHoverBg}}
        // variant="outline" // İsterseniz outline kalabilir veya solid yapılabilir
        onClick={onSolveTopicQuestionsClick}
        leftIcon={<Icon as={FaPencilAlt} />}
        w={{ base: "full", md: "auto" }}
        size="lg" px={8} py={7} boxShadow="lg" borderRadius="lg"
        isDisabled={isSubmittingResult}
      >
        Bu Konunun Sorularını Çöz
      </Button>
    );
  }

  return (
    <Flex
      direction={{ base: "column", sm: itemType === 'topic_summary' ? "column" : "row", md: itemType === 'topic_summary' ? "row" : "row" }}
      w="full"
      gap={4}
      justifyContent={
        (itemType === 'flashcard' && isAnswerShown) || itemType === 'topic_summary'
          ? "space-around"
          : "center"
      }
      alignItems="center" // Butonları dikeyde ortala (özellikle tek buton olduğunda)
    >
      {primaryActionContent}
      {secondaryActionContent && ( // Sadece topic_summary için ikinci butonu render et
         <Box w={{ base: "full", md: "auto" }}> {/* Mobil için tam genişlik, masaüstü için otomatik */}
            {secondaryActionContent}
         </Box>
      )}
    </Flex>
  );
}

export default SRSActionButtons;
