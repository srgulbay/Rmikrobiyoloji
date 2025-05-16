import React from 'react';
import {
  Box,
  Heading,
  Text,
  Icon,
  Card,
  Alert,
  AlertIcon,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  VStack,
  HStack,
  IconButton,
  Tooltip,
  Badge,
  useColorModeValue,
  Flex // Flex eklendi
} from '@chakra-ui/react';
import { FaBrain, FaBookOpen, FaPencilAlt, FaInfoCircle, FaChartLine } from 'react-icons/fa'; // FaChartLine eklendi
import { FiChevronRight } from 'react-icons/fi'; // Daha modern bir ikon
import { useNavigate } from 'react-router-dom';

const formatTime = totalSeconds => {
    if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

function DetailedTopicAnalysisTab({
  detailedStats,
  weakTopics,
  strongTopics,
  timeSpentPerTopicData,
  // Stil propları artık içeride useColorModeValue ile alınacak
}) {
  const navigate = useNavigate();

  // Layout ile tutarlı stil değişkenleri
  const mainCardBg = useColorModeValue("white", "gray.800");
  const mainBorderColor = useColorModeValue("gray.200", "gray.700");
  const mainHeadingColor = useColorModeValue("gray.700", "whiteAlpha.900");
  const mainTextColor = useColorModeValue("gray.600", "gray.300");
  const mainTextMutedColor = useColorModeValue("gray.500", "gray.400");
  const accentColor = useColorModeValue("brand.500", "brand.300");

  const tableHeaderBg = useColorModeValue("gray.50", "gray.750"); // Tablo başlığı için daha koyu
  const tableHoverBg = useColorModeValue("gray.100", "rgba(45,55,72,0.5)"); // gray.700 yerine alpha ile
  
  // Renkleri prop olarak almak yerine burada tanımlıyoruz, parent'tan gelenleri kullanmayacağız.
  const weakTopicRowBgActual = useColorModeValue("red.50", "rgba(254, 178, 178, 0.08)");
  const strongTopicRowBgActual = useColorModeValue("green.50", "rgba(72, 187, 120, 0.08)");
  const defaultRowBgActual = useColorModeValue("transparent", "transparent"); // Kartın kendi bg'si


  if (!detailedStats || detailedStats.length === 0) {
    return (
      <Alert 
        status="info" 
        variant="subtle" 
        borderRadius="xl" // Daha yuvarlak
        bg={useColorModeValue("blue.50", "rgba(49,130,206,0.15)")} 
        borderColor={useColorModeValue("blue.200", "blue.700")} 
        borderWidth="1px" 
        p={6} // Daha fazla padding
        boxShadow="lg" // Gölge
        flexDirection="column" // İkon ve metin alt alta
        textAlign="center"
      >
        <AlertIcon as={FaInfoCircle} boxSize="40px" color={useColorModeValue("blue.500", "blue.300")} mb={3}/>
        <AlertDescription color={useColorModeValue("blue.700", "blue.200")} fontSize="lg" fontWeight="medium">
          Detaylı analiz için henüz yeterli veriniz bulunmuyor.
        </AlertDescription>
        <Text color={mainTextMutedColor} fontSize="md" mt={2}>
            Platformda daha fazla pratik yaparak Dijital Mentor'un size özel analizler sunmasını sağlayabilirsiniz.
        </Text>
      </Alert>
    );
  }

  return (
    <VStack spacing={8} align="stretch">
      <Flex align="center" gap={3}>
        <Icon as={FaChartLine} boxSize={{base:7, md:8}} color={accentColor}/>
        <Heading as="h3" size={{base:"lg", md:"xl"}} color={mainHeadingColor} fontWeight="bold">
          Detaylı Konu Performans Analizi
        </Heading>
      </Flex>
      
      <Card variant="outline" bg={mainCardBg} borderColor={mainBorderColor} boxShadow="2xl" borderRadius="xl" overflow="hidden">
        <TableContainer>
          <Table variant="simple" size={{base: "sm", md: "md"}}>
            <Thead bg={tableHeaderBg}>
              <Tr>
                <Th color={mainTextMutedColor} py={4} px={{base:3, md:4}} fontSize="sm" whiteSpace="nowrap" textTransform="none" letterSpacing="wide">Konu Adı</Th>
                <Th textAlign="center" color={mainTextMutedColor} py={4} px={{base:1, md:2}} fontSize="sm" textTransform="none">Deneme</Th>
                <Th textAlign="center" color={mainTextMutedColor} py={4} px={{base:1, md:2}} fontSize="sm" textTransform="none">Doğru</Th>
                <Th textAlign="center" color={mainTextMutedColor} py={4} px={{base:1, md:2}} fontSize="sm" textTransform="none">Başarı (%)</Th>
                <Th color={mainTextMutedColor} py={4} px={{base:1, md:2}} display={{base:"none", lg:"table-cell"}} fontSize="sm" textTransform="none">Harcanan Süre</Th>
                <Th color={mainTextMutedColor} py={4} px={{base:2, md:4}} fontSize="sm" pl={{base:2, md:4}} textTransform="none">Durum & Aksiyonlar</Th>
              </Tr>
            </Thead>
            <Tbody>
              {detailedStats.map(topicStat => {
                const isMarkedAsWeak = weakTopics.some(wt => wt.topicId === topicStat.topicId);
                const isMarkedAsStrong = strongTopics.some(st => st.topicId === topicStat.topicId);
                const timeData = timeSpentPerTopicData.find(ts => ts.topicId === topicStat.topicId);
                
                let statusBadge;
                let currentRowBg = defaultRowBgActual;
                let statusTextColor = mainTextColor;

                if (isMarkedAsWeak) {
                  statusBadge = <Badge colorScheme="red" variant="solid" borderRadius="full" px={3} py={1}>Geliştir</Badge>;
                  currentRowBg = weakTopicRowBgActual;
                  statusTextColor = useColorModeValue("red.700", "red.200");
                } else if (isMarkedAsStrong) {
                  statusBadge = <Badge colorScheme="green" variant="solid" borderRadius="full" px={3} py={1}>Güçlü</Badge>;
                  currentRowBg = strongTopicRowBgActual;
                  statusTextColor = useColorModeValue("green.700", "green.200");
                } else if (topicStat.totalAttempts === 0){
                  statusBadge = <Badge colorScheme="gray" variant="outline" borderRadius="full" px={3} py={1}>Başlanmadı</Badge>;
                } else {
                  statusBadge = <Badge colorScheme="blue" variant="outline" borderRadius="full" px={3} py={1}>Orta</Badge>;
                }
                
                const accuracyColorValue = topicStat.accuracy >= 80 ? useColorModeValue("green.600", "green.300") 
                                         : topicStat.accuracy >= 60 ? useColorModeValue("yellow.600", "yellow.300") 
                                         : useColorModeValue("red.600", "red.300");

                return (
                  <Tr 
                    key={topicStat.topicId} 
                    bg={currentRowBg} 
                    _hover={{bg: tableHoverBg}}
                    transition="background-color 0.2s ease-in-out"
                  >
                    <Td fontWeight="medium" color={statusTextColor} maxW={{base:"120px", sm:"180px", md:"250px", lg:"none"}} whiteSpace="normal" py={3} px={{base:3, md:4}} title={topicStat.topicName}>{topicStat.topicName}</Td>
                    <Td textAlign="center" color={mainTextColor} py={3} px={{base:1, md:2}}>{topicStat.totalAttempts}</Td>
                    <Td textAlign="center" color={mainTextColor} py={3} px={{base:1, md:2}}>{topicStat.correctAttempts}</Td>
                    <Td textAlign="center" fontWeight="bold" color={accuracyColorValue} py={3} px={{base:1, md:2}} fontSize="md">
                      {topicStat.accuracy != null ? topicStat.accuracy.toFixed(1) : 'N/A'}%
                    </Td>
                    <Td display={{base:"none", lg:"table-cell"}} color={mainTextColor} py={3} px={{base:1, md:2}}>{timeData ? formatTime(timeData.totalTimeSpentSeconds) : '-'}</Td>
                    <Td py={3} px={{base:2, md:4}}>
                      <VStack spacing={2} align="flex-start">
                        {statusBadge}
                        <HStack spacing={1}>
                          <Tooltip label={`${topicStat.topicName} Konu Anlatımı`} fontSize="xs" placement="top" hasArrow>
                            <IconButton icon={<FaBookOpen />} size="sm" variant="ghost" colorScheme="blue" aria-label="Konuyu Çalış" onClick={() => navigate(`/lectures/topic/${topicStat.topicId}`)} borderRadius="full"/>
                          </Tooltip>
                          <Tooltip label={`${topicStat.topicName} Pratik Yap`} fontSize="xs" placement="top" hasArrow>
                            <IconButton icon={<FaPencilAlt />} size="sm" variant="ghost" colorScheme="green" aria-label="Pratik Yap" onClick={() => navigate(`/solve?topicId=${topicStat.topicId}&mode=practice`)} borderRadius="full"/>
                          </Tooltip>
                        </HStack>
                      </VStack>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      </Card>
    </VStack>
  );
}

export default DetailedTopicAnalysisTab;
