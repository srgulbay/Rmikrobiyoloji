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
  AlertTitle, // AlertTitle eklendi
  AlertDescription,
  useColorModeValue,
  Flex, // Flex eklendi
  Progress // Progress eklendi (opsiyonel, analizler için)
} from '@chakra-ui/react';
import { 
  FaChartBar,FaBrain, FaQuestion, FaChartLine, 
  FaHourglassHalf, FaCalendarAlt, FaInfoCircle // FaInfoCircle eklendi
} from 'react-icons/fa';
import { FiActivity, FiCheckCircle, FiTrendingUp, FiTrendingDown, FiMinusCircle, FiZap, FiCpu, FiBarChart2 } from "react-icons/fi"; // Ek ikonlar
import { Line } from 'react-chartjs-2';

function OverviewTab({
  summaryStats,
  globalAvgData,
  weeklyProgressData, // Bu, weeklyChartData'yı oluşturmak için kullanılacak
  weeklyChartOptions,
  weeklyChartData,    // Bu doğrudan kullanılacak
  performanceTrend,
  activityLevel,
  consistencyScore,
  loading, // Ana DashboardPage'den gelen genel yükleme durumu
  // Stil propları kaldırıldı, içeride tanımlanacak
}) {
  
  // Layout ile tutarlı stil değişkenleri
  const mainCardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("gray.700", "whiteAlpha.900");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const textMutedColor = useColorModeValue("gray.500", "gray.400");
  const accentColor = useColorModeValue("brand.500", "brand.300");

  // Stat kartları için arkaplan
  const statCardBg = useColorModeValue("gray.50", "gray.750");
  const analysisBoxBg = useColorModeValue("gray.50", "gray.750"); // Güncel Analizler için
  const chartCardBg = useColorModeValue("white", "gray.800"); // Grafik kartı için

  const alertInfoBgResolved = useColorModeValue("blue.50", "rgba(49,130,206,0.15)");
  const alertInfoBorderColorResolved = useColorModeValue("blue.200", "blue.600");
  const alertInfoTitleColorResolved = useColorModeValue("blue.700", "blue.200");


  return (
    <VStack spacing={{base:6, md:8}} align="stretch">
      {/* Performans Özeti Kartı */}
      {summaryStats && (
        <Card variant="outline" bg={mainCardBg} borderColor={borderColor} boxShadow="xl" borderRadius="xl">
          <CardHeader pb={4} borderBottomWidth="1px" borderColor={borderColor}>
            <Heading size="lg" color={headingColor} display="flex" alignItems="center">
              <Icon as={FiBarChart2} mr={3} color={accentColor} boxSize={6}/>Performans Özetin
            </Heading>
          </CardHeader>
          <CardBody p={{base:4, md:6}}>
            <StatGroup flexWrap={{base: "wrap", lg: "nowrap"}} gap={{base:4, md:6}}>
              <Stat bg={statCardBg} p={5} borderRadius="lg" boxShadow="md" flex="1" minW={{base:"calc(50% - 8px)", sm:"220px"}}>
                <HStack justifyContent="space-between" mb={2}>
                  <StatLabel color={textMutedColor} fontSize="sm" fontWeight="medium">Toplam Çözülen Soru</StatLabel>
                  <Icon as={FaQuestion} color={textMutedColor} boxSize={4}/>
                </HStack>
                <StatNumber fontSize={{base:"3xl", md:"4xl"}} color={headingColor} fontWeight="bold">
                  {summaryStats.totalAttempts || 0}
                </StatNumber>
              </Stat>

              <Stat bg={statCardBg} p={5} borderRadius="lg" boxShadow="md" flex="1" minW={{base:"calc(50% - 8px)", sm:"220px"}}>
                <HStack justifyContent="space-between" mb={2}>
                  <StatLabel color={textMutedColor} fontSize="sm" fontWeight="medium">Doğru Cevap Sayısı</StatLabel>
                  <Icon as={FiCheckCircle} color="green.400" boxSize={4}/>
                </HStack>
                <StatNumber fontSize={{base:"3xl", md:"4xl"}} color={useColorModeValue("green.500", "green.300")} fontWeight="bold">
                  {summaryStats.correctAttempts || 0}
                </StatNumber>
              </Stat>

              <Stat bg={statCardBg} p={5} borderRadius="lg" boxShadow="md" flex="1" minW={{base:"full", lg:"220px"}}> {/* Geniş ekranda tam sığsın */}
                <HStack justifyContent="space-between" mb={2}>
                  <StatLabel color={textMutedColor} fontSize="sm" fontWeight="medium">Genel Başarı Oranın</StatLabel>
                  <Icon 
                    as={summaryStats.accuracy >= 80 ? FiTrendingUp : summaryStats.accuracy >= 50 ? FiMinusCircle : FiTrendingDown} 
                    color={summaryStats.accuracy >= 80 ? 'green.400' : summaryStats.accuracy >= 50 ? 'yellow.400' : 'red.400'}
                    boxSize={4}
                  />
                </HStack>
                <StatNumber 
                  fontSize={{base:"3xl", md:"4xl"}} 
                  color={summaryStats.accuracy >= 80 ? useColorModeValue("green.500", "green.300") 
                          : summaryStats.accuracy >= 50 ? useColorModeValue("yellow.500", "yellow.300") 
                          : useColorModeValue("red.500", "red.300")} 
                  fontWeight="bold"
                >
                  %{summaryStats.accuracy != null ? summaryStats.accuracy.toFixed(1) : "0.0"}
                </StatNumber>
                {globalAvgData && summaryStats.accuracy != null && (
                  <StatHelpText color={textMutedColor} fontSize="xs" mt={1}>
                    Platform Ort: %{globalAvgData.overallAccuracy != null ? globalAvgData.overallAccuracy.toFixed(1) : "N/A"}
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

      <Divider my={{base:4, md:6}} borderColor={borderColor}/>

      {/* Güncel Analizler Kartı */}
      <Card variant="outline" bg={mainCardBg} borderColor={borderColor} boxShadow="xl" borderRadius="xl">
        <CardHeader pb={4} borderBottomWidth="1px" borderColor={borderColor}>
            <Heading size="lg" color={headingColor} display="flex" alignItems="center">
                <Icon as={FiCpu} mr={3} color={accentColor} boxSize={6}/>Güncel Analizlerin
            </Heading>
        </CardHeader>
        <CardBody p={{base:4, md:6}}>
            <VStack spacing={5} align="stretch">
                {[performanceTrend, activityLevel, consistencyScore].map((analysis, index) => {
                    let iconComp = FiActivity;
                    let iconColorVal = textMutedColor;
                    let title = "";

                    if (index === 0) { // Performance Trend
                        title = "Performans Trendi:";
                        iconComp = analysis.trend === 'improving' ? FiTrendingUp : analysis.trend === 'declining' ? FiTrendingDown : FiMinusCircle;
                        iconColorVal = analysis.trend === 'improving' ? 'green.400' : analysis.trend === 'declining' ? 'red.400' : 'yellow.400';
                    } else if (index === 1) { // Activity Level
                        title = "Aktivite Seviyesi:";
                        iconComp = analysis.level === 'increasing' ? FiZap : analysis.level === 'decreasing' ? FaHourglassHalf : FaCalendarAlt;
                        iconColorVal = analysis.level === 'increasing' ? 'green.400' : analysis.level === 'decreasing' ? 'red.400' : 'yellow.400';
                    } else { // Consistency Score
                        title = "Konu Tutarlılığı:";
                        iconComp = FaBrain;
                        iconColorVal = analysis.score === 'high' ? 'green.400' : analysis.score === 'medium' ? 'yellow.400' : analysis.score === 'low' ? 'red.400' : textMutedColor;
                    }
                    
                    return (
                        analysis && analysis.description && ( // Sadece description varsa göster
                            <Flex key={title} bg={analysisBoxBg} p={4} borderRadius="lg" boxShadow="md" alignItems="center"> 
                                <Icon as={iconComp} color={iconColorVal} boxSize={7} mr={4}/> 
                                <Box>
                                    <Text fontWeight="semibold" color={headingColor} fontSize="md">{title}</Text> 
                                    <Text color={textColor} fontSize="sm" lineHeight="short">{analysis.description} 
                                        {index === 2 && analysis.value && ` (Std. Sapma: ${analysis.value})`}
                                    </Text> 
                                </Box>
                            </Flex>
                        )
                    )
                })}
            </VStack>
        </CardBody>
      </Card>
      
      <Divider my={{base:4, md:6}} borderColor={borderColor}/>

      {/* Haftalık Gelişim Grafiği Kartı */}
      {weeklyProgressData && weeklyProgressData.length > 1 ? (
        <Card variant="outline" bg={chartCardBg} borderColor={borderColor} boxShadow="xl" borderRadius="xl">
          <CardHeader pb={4} borderBottomWidth="1px" borderColor={borderColor}>
              <Heading size="lg" color={headingColor} display="flex" alignItems="center">
                <Icon as={FaChartLine} mr={3} color={accentColor} boxSize={6}/>Haftalık Gelişim Grafiği
              </Heading>
          </CardHeader>
          <CardBody p={{base:2, md:4}}> {/* Grafik için padding ayarlandı */}
            <Box h={{base: "280px", sm:"320px", md: "400px"}} borderRadius="lg" overflow="hidden">
              <Line options={weeklyChartOptions} data={weeklyChartData} />
            </Box>
          </CardBody>
        </Card>
      ) : !loading && ( // loading prop'u ana DashboardPage'den gelmeli
        <Alert 
            status="info" variant="subtle" borderRadius="xl" 
            bg={alertInfoBgResolved} borderColor={alertInfoBorderColorResolved} 
            borderWidth="1px" p={6} boxShadow="lg"
            flexDirection="column" textAlign="center"
        >
            <AlertIcon color={alertInfoTitleColorResolved} boxSize={8} mb={2}/> 
            <AlertTitle fontWeight="semibold" color={alertInfoTitleColorResolved} fontSize="lg">Haftalık Gelişim Grafiği</AlertTitle>
            <AlertDescription fontSize="md" color={textMutedColor} mt={2}>
                Grafiğinizin oluşması için en az 2 haftalık aktif veri gerekmektedir. Lütfen düzenli olarak soru çözmeye devam edin.
            </AlertDescription>
        </Alert>
      )}
    </VStack>
  );
}

export default OverviewTab;
