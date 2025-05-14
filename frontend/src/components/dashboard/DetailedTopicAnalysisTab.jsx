import React from 'react';
import {
  Box,
  Heading,
  Text,
  Icon,
  Card,
  Alert,
  AlertIcon,
  AlertDescription, // AlertDescription eklendi
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
} from '@chakra-ui/react';
import { FaBrain, FaBookOpen, FaPencilAlt, FaInfoCircle } from 'react-icons/fa';
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
  // Stil propları
  cardBg,
  borderColor,
  headingColor,
  textColor,
  textMutedColor,
  weakTopicRowBg, // weakTopicCardBg yerine row için
  strongTopicRowBg, // strongTopicCardBg yerine row için
}) {
  const navigate = useNavigate();
  const tableHeaderBg = useColorModeValue("gray.50", "gray.700");
  const hoverBg = useColorModeValue("blackAlpha.50", "whiteAlpha.100");
  const defaultRowBg = useColorModeValue("white", "gray.800"); // veya cardBg

  if (!detailedStats || detailedStats.length === 0) {
    return (
      <Alert status="info" variant="subtle" borderRadius="lg" bg={useColorModeValue("blue.50", "rgba(49,130,206,0.1)")} borderColor={useColorModeValue("blue.200", "blue.700")} borderWidth="1px" p={5}>
        <AlertIcon color="blue.500" />
        <AlertDescription color={useColorModeValue("blue.700", "blue.200")} fontSize="md">
          Henüz konu bazlı detaylı istatistik oluşturacak kadar soru çözmediniz. Lütfen daha fazla pratik yapın.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Heading as="h3" size="lg" color={headingColor} display="flex" alignItems="center" id="weak-topics-section">
        <Icon as={FaBrain} mr={3} color="teal.400"/> Detaylı Konu Performansınız
      </Heading>
      <Card variant="outline" bg={cardBg} borderColor={borderColor} boxShadow="xl" borderRadius="xl">
        <TableContainer>
          <Table variant="simple" size={{base: "sm", md: "md"}}>
            <Thead bg={tableHeaderBg}>
              <Tr>
                <Th color={textMutedColor} py={4} px={{base:2, md:4}} fontSize="sm" whiteSpace="nowrap">Konu Adı</Th>
                <Th textAlign="center" color={textMutedColor} py={4} px={{base:1, md:2}} fontSize="sm">Deneme</Th>
                <Th textAlign="center" color={textMutedColor} py={4} px={{base:1, md:2}} fontSize="sm">Doğru</Th>
                <Th textAlign="center" color={textMutedColor} py={4} px={{base:1, md:2}} fontSize="sm">Başarı</Th>
                <Th color={textMutedColor} py={4} px={{base:1, md:2}} display={{base:"none", lg:"table-cell"}} fontSize="sm">Harcanan Süre</Th>
                <Th color={textMutedColor} py={4} px={{base:1, md:2}} fontSize="sm" pl={{base:2, md:4}}>Durum/Aksiyon</Th>
              </Tr>
            </Thead>
            <Tbody>
              {detailedStats.map(topicStat => {
                const isMarkedAsWeak = weakTopics.some(wt => wt.topicId === topicStat.topicId);
                const isMarkedAsStrong = strongTopics.some(st => st.topicId === topicStat.topicId);
                const timeData = timeSpentPerTopicData.find(ts => ts.topicId === topicStat.topicId);
                let statusBadge;
                let currentRowBg = defaultRowBg;

                if (isMarkedAsWeak) {
                  statusBadge = <Badge colorScheme="red" variant="solid" fontSize="xs" px={2} py={1}>Geliştir</Badge>;
                  currentRowBg = weakTopicRowBg || useColorModeValue("red.50", "rgba(254, 178, 178, 0.1)");
                } else if (isMarkedAsStrong) {
                  statusBadge = <Badge colorScheme="green" variant="solid" fontSize="xs" px={2} py={1}>Güçlü</Badge>;
                  currentRowBg = strongTopicRowBg || useColorModeValue("green.50", "rgba(72, 187, 120, 0.1)");
                } else if (topicStat.totalAttempts === 0){
                  statusBadge = <Badge colorScheme="gray" variant="outline" fontSize="xs" px={2} py={1}>Başlanmadı</Badge>;
                } else {
                  statusBadge = <Badge colorScheme="blue" variant="outline" fontSize="xs" px={2} py={1}>Orta</Badge>;
                }
                
                const accuracyColorValue = topicStat.accuracy >= 80 ? 'green.500' : topicStat.accuracy >= 60 ? 'yellow.500' : 'red.500';

                return (
                  <Tr 
                    key={topicStat.topicId} 
                    bg={currentRowBg} 
                    _hover={{bg: hoverBg}}
                    transition="background-color 0.2s ease-in-out"
                  >
                    <Td fontWeight="medium" color={textColor} maxW={{base:"100px", sm:"150px", md:"250px", lg:"none"}} whiteSpace="normal" py={3} px={{base:2, md:4}} title={topicStat.topicName}>{topicStat.topicName}</Td>
                    <Td textAlign="center" color={textColor} py={3} px={{base:1, md:2}}>{topicStat.totalAttempts}</Td>
                    <Td textAlign="center" color={textColor} py={3} px={{base:1, md:2}}>{topicStat.correctAttempts}</Td>
                    <Td textAlign="center" fontWeight="bold" color={accuracyColorValue} py={3} px={{base:1, md:2}}>
                      {topicStat.accuracy != null ? topicStat.accuracy.toFixed(1) : 'N/A'}%
                    </Td>
                    <Td display={{base:"none", lg:"table-cell"}} color={textColor} py={3} px={{base:1, md:2}}>{timeData ? formatTime(timeData.totalTimeSpentSeconds) : '-'}</Td>
                    <Td py={3} px={{base:2, md:4}}>
                      <VStack spacing={1} align="flex-start">
                        {statusBadge}
                        <HStack spacing={1}>
                          <Tooltip label={`${topicStat.topicName} Konu Anlatımı`} fontSize="xs" placement="top">
                            <IconButton icon={<FaBookOpen />} size="xs" variant="ghost" colorScheme="blue" aria-label="Konuyu Çalış" onClick={() => navigate(`/lectures/topic/${topicStat.topicId}`)}/>
                          </Tooltip>
                          <Tooltip label={`${topicStat.topicName} Pratik Yap`} fontSize="xs" placement="top">
                            <IconButton icon={<FaPencilAlt />} size="xs" variant="ghost" colorScheme="green" aria-label="Pratik Yap" onClick={() => navigate(`/solve?topicId=${topicStat.topicId}&mode=practice`)}/>
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
