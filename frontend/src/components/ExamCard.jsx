import React from 'react';
import { Box, Heading, Icon, VStack, Text, useColorModeValue, Flex, Circle, Badge } from '@chakra-ui/react';
import { FiAward, FiBookOpen, FiBriefcase, FiGrid, FiStar } from 'react-icons/fi'; // FiStar eklendi
import { FaGraduationCap, FaUniversity, FaUsersCog } from 'react-icons/fa';

const tierStylingConfig = {
  'DIAMOND': { icon: FiAward, colorScheme: 'blue', accentShade: '500' },
  'GOLD': { icon: FaGraduationCap, colorScheme: 'yellow', accentShade: '400' },
  'SILVER': { icon: FaUniversity, colorScheme: 'cyan', accentShade: '500' },
  'BRONZE_TIP': { icon: FiBookOpen, colorScheme: 'orange', accentShade: '500' },
  'BRONZE_DIS': { icon: FiBookOpen, colorScheme: 'teal', accentShade: '400' },
  'BRONZE_ISG': { icon: FaUsersCog, colorScheme: 'purple', accentShade: '500' },
  'DEFAULT': { icon: FiGrid, colorScheme: 'green', accentShade: '500' }
};

function ExamCard({ exam, tierName, onClick, isTargetExam }) { // isTargetExam prop'u eklendi
  const styles = tierStylingConfig[tierName] || tierStylingConfig.DEFAULT;

  // Temel Renkler
  const cardBgBase = useColorModeValue('white', 'gray.750');
  const baseBorderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColorBase = useColorModeValue('gray.700', 'gray.100');

  // Tier'a Özel Renkler
  const accentColor = useColorModeValue(`${styles.colorScheme}.${styles.accentShade}`, `${styles.colorScheme}.${parseInt(styles.accentShade) > 200 ? parseInt(styles.accentShade) - 200 : 200}`);
  const hoverBorderColor = useColorModeValue(`${styles.colorScheme}.400`, `${styles.colorScheme}.500`);
  const focusRingColor = useColorModeValue(`${styles.colorScheme}.300`, `${styles.colorScheme}.500`);
  const iconWrapperBg = useColorModeValue(`${styles.colorScheme}.50`, `${styles.colorScheme}.800`); // Daha yumuşak ikon arka planı
  const iconFgColor = accentColor;
  const accentLineBg = accentColor; // Sol kenar çizgisi için

  // isTargetExam durumuna göre stiller
  const cardBg = isTargetExam ? useColorModeValue(`${styles.colorScheme}.50`, `${styles.colorScheme}.800`) : cardBgBase;
  const currentBorderColor = isTargetExam ? accentColor : baseBorderColor;
  const currentBoxShadow = isTargetExam ? 'xl' : 'lg'; // Hedef sınav daha belirgin gölge
  const cardOpacity = isTargetExam ? 1 : 0.85; // Pasif sınavlar biraz daha soluk

  return (
    <Box
      as="button"
      onClick={() => onClick(exam)}
      bg={cardBg}
      borderWidth={isTargetExam ? "2px" : "1px"} // Hedef sınavın kenarlığı daha kalın
      borderColor={currentBorderColor}
      borderRadius="xl"
      boxShadow={currentBoxShadow}
      textAlign="left"
      w="100%"
      minH={{ base: "150px", md: "170px" }}
      p={{ base: 4, md: 5 }}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="flex-start"
      transition="all 0.25s cubic-bezier(0.645, 0.045, 0.355, 1), opacity 0.25s ease-in-out"
      position="relative"
      overflow="hidden"
      opacity={cardOpacity} // Pasifler için opaklık
      _before={isTargetExam ? { // Sadece hedef sınav için sol kenar çizgisi
        content: '""',
        position: 'absolute',
        top: '50%',
        left: 0,
        transform: 'translateY(-50%)',
        width: '6px', // Daha kalın
        height: '80%', // Daha uzun
        bg: accentLineBg,
        borderTopRightRadius: 'md',
        borderBottomRightRadius: 'md',
        boxShadow: `1px 0 8px ${accentColor}`,
      } : {}}
      _hover={{
        opacity: 1, // Hover'da tüm kartlar tam opak
        transform: 'translateY(-6px) scale(1.02)', // Hafif büyüme ve yukarı kalkma
        boxShadow: 'xl',
        borderColor: hoverBorderColor,
        _before: isTargetExam ? { // Hedef sınavın çizgisi için hover efekti
          boxShadow: `2px 0 12px ${accentColor}`,
        } : {}
      }}
      _active={{
        transform: 'translateY(-2px) scale(0.99)',
        boxShadow: 'lg',
      }}
      _focusVisible={{
        outline: 'none',
        ring: '3px',
        ringColor: focusRingColor,
        ringOffset: '1px',
        borderColor: hoverBorderColor,
        opacity: 1,
      }}
    >
      {isTargetExam && ( // Sadece hedef sınav için bir "etiket" veya ikon
        <Badge 
            position="absolute" 
            top="10px" 
            right="10px" 
            colorScheme={styles.colorScheme}
            variant="solid"
            fontSize="xs"
            px={2}
            py={0.5}
            borderRadius="full"
        >
            <Icon as={FiStar} mr="4px" verticalAlign="middle"/> Hedefim
        </Badge>
      )}
      <Flex align="center" w="full">
        <Circle 
            size={{base:"48px", md:"56px"}} 
            bg={iconWrapperBg} 
            mr={4} 
            flexShrink={0}
            border="2px solid"
            borderColor={isTargetExam ? accentColor : useColorModeValue(`${styles.colorScheme}.200`, `${styles.colorScheme}.600`)}
            boxShadow={isTargetExam ? `0 0 10px ${accentColor}` : "inner"}
        >
          <Icon as={styles.icon} boxSize={{base:"22px", md:"28px"}} color={iconFgColor} />
        </Circle>
        
        <VStack align="flex-start" spacing={0} flex="1" minW="0">
          <Heading
            as="h3"
            fontSize={{ base: "md", md: "lg" }}
            fontWeight="semibold"
            color={isTargetExam ? accentColor : headingColorBase} // Hedef sınav başlığı daha vurgulu
            noOfLines={3}
            lineHeight="short"
          >
            {exam.displayName || exam.name}
          </Heading>
        </VStack>
      </Flex>
    </Box>
  );
}
export default ExamCard;
