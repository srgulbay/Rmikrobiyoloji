import React from 'react';
import {
  Box,
  Heading,
  Text,
  Icon,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  HStack,
  VStack,
  Divider,
  Alert,
  AlertIcon,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  FaChartBar,FaBrain, FaQuestion, FaChartLine, 
  FaHourglassHalf, FaCalendarAlt 
} from 'react-icons/fa';
import { FiActivity, FiCheckCircle, FiTrendingUp, FiTrendingDown, FiMinusCircle, FiZap, } from "react-icons/fi";
import { Line } from 'react-chartjs-2';

function OverviewTab({
  summaryStats,
  globalAvgData,
  weeklyProgressData,
  weeklyChartOptions,
  weeklyChartData,
  performanceTrend,
  activityLevel,
  consistencyScore,
  // Stil propları
  cardBg,
  borderColor,
  headingColor,
  textColor,
  textMutedColor,
}) {
  
  const statBg = useColorModeValue("gray.50", "gray.700");
  const analysisBoxBg = useColorModeValue("gray.50", "gray.700");
  const chartBoxBg = useColorModeValue("gray.50", "gray.700");
  const alertInfoBg = useColorModeValue("blue.50", "rgba(49,130,206,0.1)");
  const alertInfoBorderColor = useColorModeValue("blue.200", "blue.700");
  const alertInfoTitleColor = useColorModeValue("blue.700", "blue.200");

  return (
    <VStack spacing={{base:6, md:8}} align="stretch">
      {summaryStats && (
        <Card variant="outline" bg={cardBg} borderColor={borderColor} boxShadow="lg" borderRadius="xl">
          <CardHeader pb={3} borderBottomWidth="1px" borderColor={borderColor}>
            <Heading size="lg" color={headingColor} display="flex" alignItems="center">
              <Icon as={FiActivity} mr={3} color="brand.400"/>Performans Özetin
            </Heading>
          </CardHeader>
          <CardBody>
            <StatGroup flexWrap={{base: "wrap", lg: "nowrap"}} gap={{base:4, md:6}}>
              <Stat bg={statBg} p={5} borderRadius="lg" boxShadow="md" flex="1" minW={{base:"full", sm:"200px"}}>
                <HStack justifyContent="space-between" mb={2}>
                  <StatLabel color={textMutedColor} fontSize="sm">Toplam Çözülen Soru</StatLabel>
                  <Icon as={FaQuestion} color={textMutedColor}/>
                </HStack>
                <StatNumber fontSize={{base:"2xl", md:"4xl"}} color={headingColor} fontWeight="bold">
                  {summaryStats.totalAttempts || 0}
                </StatNumber>
              </Stat>

              <Stat bg={statBg} p={5} borderRadius="lg" boxShadow="md" flex="1" minW={{base:"full", sm:"200px"}}>
                <HStack justifyContent="space-between" mb={2}>
                  <StatLabel color={textMutedColor} fontSize="sm">Doğru Cevap Sayısı</StatLabel>
                  <Icon as={FiCheckCircle} color="green.400"/>
                </HStack>
                <StatNumber fontSize={{base:"2xl", md:"4xl"}} color="green.400" fontWeight="bold">
                  {summaryStats.correctAttempts || 0}
                </StatNumber>
              </Stat>

              <Stat bg={statBg} p={5} borderRadius="lg" boxShadow="md" flex="1" minW={{base:"full", sm:"200px"}}>
                <HStack justifyContent="space-between" mb={2}>
                  <StatLabel color={textMutedColor} fontSize="sm">Genel Başarı Oranın</StatLabel>
                  <Icon 
                    as={summaryStats.accuracy >= 80 ? FiTrendingUp : summaryStats.accuracy >= 50 ? FiMinusCircle : FiTrendingDown} 
                    color={summaryStats.accuracy >= 80 ? 'green.400' : summaryStats.accuracy >= 50 ? 'yellow.400' : 'red.400'}
                  />
                </HStack>
                <StatNumber 
                  fontSize={{base:"2xl", md:"4xl"}} 
                  color={summaryStats.accuracy >= 80 ? 'green.400' : summaryStats.accuracy >= 50 ? 'yellow.400' : 'red.400'} 
                  fontWeight="bold"
                >
                  %{summaryStats.accuracy != null ? summaryStats.accuracy.toFixed(1) : 0}
                </StatNumber>
                {globalAvgData && summaryStats.accuracy != null && (
                  <StatHelpText color={textMutedColor} fontSize="xs" mt={1}>
                    Platform Ort: %{globalAvgData.overallAccuracy.toFixed(1)}
                    {summaryStats.accuracy > globalAvgData.overallAccuracy ? 
                      <StatArrow type="increase" /> : 
                      (summaryStats.accuracy < globalAvgData.overallAccuracy ? <StatArrow type="decrease" /> : null)}
                  </StatHelpText>
                )}
              </Stat>
            </StatGroup>
          </CardBody>
        </Card>
      )}

      <Divider my={2} borderColor={borderColor}/>

      <Card variant="outline" bg={cardBg} borderColor={borderColor} boxShadow="lg" borderRadius="xl">
        <CardHeader pb={3} borderBottomWidth="1px" borderColor={borderColor}>
            <Heading size="lg" color={headingColor} display="flex" alignItems="center">
                <Icon as={FaChartBar} mr={3} color="brand.400"/>Güncel Analizlerin
            </Heading>
        </CardHeader>
        <CardBody>
            <VStack spacing={4} align="stretch" p={1}>
                <HStack bg={analysisBoxBg} p={4} borderRadius="md" boxShadow="sm"> 
                    <Icon 
                        as={performanceTrend.trend === 'improving' ? FiTrendingUp : performanceTrend.trend === 'declining' ? FiTrendingDown : FiMinusCircle} 
                        color={performanceTrend.trend === 'improving' ? 'green.400' : performanceTrend.trend === 'declining' ? 'red.400' : 'yellow.400'} 
                        boxSize={6} mr={2}
                    /> 
                    <Box>
                        <Text fontWeight="semibold" color={headingColor} fontSize="md">Performans Trendi:</Text> 
                        <Text color={textColor} fontSize="sm">{performanceTrend.description}</Text> 
                    </Box>
                </HStack>
                <HStack bg={analysisBoxBg} p={4} borderRadius="md" boxShadow="sm"> 
                    <Icon 
                        as={activityLevel.level === 'increasing' ? FiZap : activityLevel.level === 'decreasing' ? FaHourglassHalf : FaCalendarAlt} 
                        color={activityLevel.level === 'increasing' ? 'green.400' : activityLevel.level === 'decreasing' ? 'red.400' : 'yellow.400'} 
                        boxSize={6} mr={2}
                    /> 
                    <Box>
                        <Text fontWeight="semibold" color={headingColor} fontSize="md">Aktivite Seviyesi:</Text> 
                        <Text color={textColor} fontSize="sm">{activityLevel.description}</Text> 
                    </Box>
                </HStack>
                <HStack bg={analysisBoxBg} p={4} borderRadius="md" boxShadow="sm"> 
                    <Icon 
                        as={FaBrain} 
                        color={consistencyScore.score === 'high' ? 'green.400' : consistencyScore.score === 'medium' ? 'yellow.400' : consistencyScore.score === 'low' ? 'red.400' : textMutedColor} 
                        boxSize={6} mr={2}
                    /> 
                    <Box>
                        <Text fontWeight="semibold" color={headingColor} fontSize="md">Konu Tutarlılığı:</Text> 
                        <Text color={textColor} fontSize="sm">{consistencyScore.description} {consistencyScore.value && `(Std. Sapma: ${consistencyScore.value})`}</Text> 
                    </Box>
                </HStack>
            </VStack>
        </CardBody>
      </Card>
      
      <Divider my={2} borderColor={borderColor}/>

      {weeklyProgressData.length > 1 ? (
        <Card variant="outline" bg={cardBg} borderColor={borderColor} boxShadow="xl" borderRadius="xl">
          <CardHeader borderBottomWidth="1px" borderColor={borderColor}>
              <Heading size="lg" color={headingColor} display="flex" alignItems="center">
                <Icon as={FaChartLine} mr={3} color="brand.400"/>Haftalık Gelişim
              </Heading>
          </CardHeader>
          <CardBody>
            <Box h={{base: "280px", sm:"320px", md: "400px"}} p={{base:0, md:2}} borderRadius="lg">
              <Line options={weeklyChartOptions} data={weeklyChartData} />
            </Box>
          </CardBody>
        </Card>
      ) : !loading && (
        <Alert status="info" variant="subtle" borderRadius="lg" bg={alertInfoBg} borderColor={alertInfoBorderColor} borderWidth="1px" p={5}>
            <AlertIcon color={alertInfoTitleColor} boxSize={6}/> 
            <VStack align="flex-start" spacing={0} ml={2}>
              <Text fontWeight="semibold" color={alertInfoTitleColor} fontSize="md">Haftalık Gelişim Grafiği</Text>
              <Text fontSize="sm" color={textMutedColor}>Grafiğinizin oluşması için en az 2 haftalık aktif veri gerekmektedir. Lütfen düzenli olarak soru çözmeye devam edin.</Text>
            </VStack>
        </Alert>
      )}
    </VStack>
  );
}

export default OverviewTab;
