import React from 'react';
import {
  Box,
  Card,
  // CardHeader, // Kullanılmıyor
  // CardBody,   // Kullanılmıyor
  // CardFooter, // Kullanılmıyor
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  Badge,
  // SimpleGrid, // Kullanılmıyor
  useColorModeValue,
  Divider,
  Flex
} from '@chakra-ui/react';
import { FaUserCircle, FaEnvelope, FaBriefcase, FaGraduationCap, FaCalendarAlt, FaIdBadge } from 'react-icons/fa';
import { FiUser, FiMail, FiBriefcase, FiTarget, FiCalendar, FiShield } from 'react-icons/fi'; // Daha modern ikonlar

const InfoRow = ({ label, value, icon, badgeText, badgeColorScheme, valueColor }) => {
  const defaultTextColor = useColorModeValue("gray.700", "gray.100"); // Ana metin için daha parlak
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const iconColor = useColorModeValue("brand.500", "brand.300"); // İkonlar için vurgu rengi

  return (
    <Flex 
      direction={{ base: "column", sm: "row" }} 
      justify="space-between" 
      align={{ base: "flex-start", sm: "center" }} 
      py={4} // Dikey padding artırıldı
      w="full"
    >
      <HStack spacing={3} mb={{ base: 2, sm: 0 }} minW={{sm:"200px"}}> {/* Label için minimum genişlik */}
        {icon && <Icon as={icon} color={iconColor} boxSize={5} />}
        <Text fontWeight="medium" color={labelColor} fontSize="md">{label}:</Text>
      </HStack>
      <HStack flexShrink={0}> {/* Değerin taşmasını engelle */}
        <Text color={valueColor || defaultTextColor} fontSize="md" fontWeight="medium" wordBreak="break-word" textAlign={{base:"left", sm:"right"}}>
            {value || <Text as="span" fontStyle="italic" color={labelColor}>Belirtilmemiş</Text>}
        </Text>
        {badgeText && (
          <Badge 
            colorScheme={badgeColorScheme || "gray"} 
            variant="solid" // Daha dolgun badge
            ml={2} px={3} py={1} // Padding artırıldı
            borderRadius="full" // Tam yuvarlak
            fontSize="xs"
            textTransform="none" // Büyük harf zorunluluğu kaldırıldı
          >
            {badgeText}
          </Badge>
        )}
      </HStack>
    </Flex>
  );
};

function UserInfoDisplay({ user, examClassifications = [] }) {
  // Layout ile tutarlı stil değişkenleri
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("gray.700", "whiteAlpha.900");
  const accentColor = useColorModeValue("brand.500", "brand.300");

  if (!user) {
    return (
        <Card variant="outline" bg={cardBg} borderColor={borderColor} boxShadow="xl" borderRadius="xl" p={{base:5, md:8}} mt={8}>
            <Text color={headingColor} fontSize="lg">Kullanıcı bilgileri yüklenemedi veya bulunamadı.</Text>
        </Card>
    );
  }

  const defaultExam = examClassifications.find(
    ec => ec.id === user.defaultClassificationId
  );

  const userRoleDisplay = user.role === 'admin' ? 'Yönetici' : 'Kullanıcı';
  const userRoleColorScheme = user.role === 'admin' ? 'purple' : 'blue';

  return (
    <Card 
        variant="outline" 
        bg={cardBg} 
        borderColor={borderColor} 
        boxShadow="xl" 
        borderRadius="xl" 
        p={{base: 5, md: 8}} // Padding artırıldı
        mt={8} // ProfilePage içindeki diğer sekmelerle aynı hizada olması için
    >
      <VStack spacing={0} align="stretch"> {/* Divider'lar arası boşluk için spacing={0} */}
        <Heading 
            as="h2" 
            size="lg" 
            color={headingColor} 
            mb={8} // Alt boşluk artırıldı
            display="flex" 
            alignItems="center"
            fontWeight="semibold"
        >
          <Icon as={FiUser} mr={3} color={accentColor} boxSize={7}/> Profil Bilgilerim
        </Heading>
        
        <InfoRow 
            label="Kullanıcı Adı" 
            value={user.username} 
            icon={FiUser} 
        />
        <Divider borderColor={borderColor} my={1}/> {/* my={1} ile daha az boşluk */}
        <InfoRow 
            label="E-posta Adresi" 
            value={user.email} 
            icon={FiMail} 
            badgeText={user.isEmailVerified ? "Doğrulanmış" : "Doğrulanmamış"}
            badgeColorScheme={user.isEmailVerified ? "green" : "yellow"}
        />
        <Divider borderColor={borderColor} my={1}/>
        <InfoRow 
            label="Kullanıcı Rolü" 
            value={userRoleDisplay} 
            icon={FiShield} // Daha uygun bir ikon
            badgeText={userRoleDisplay}
            badgeColorScheme={userRoleColorScheme}
        />
        <Divider borderColor={borderColor} my={1}/>
        <InfoRow 
            label="Uzmanlık Alanı" 
            value={user.specialization} 
            icon={FiBriefcase} 
        />
        <Divider borderColor={borderColor} my={1}/>
        <InfoRow 
            label="Varsayılan Sınav Hedefi" 
            value={defaultExam ? defaultExam.name : (user.defaultClassificationId ? 'Bilinmeyen Sınav' : '')} // 'Belirtilmemiş' yerine boş string
            icon={FiTarget} // Daha uygun bir ikon
        />
        <Divider borderColor={borderColor} my={1}/>
        <InfoRow 
            label="Kayıt Tarihi" 
            value={new Date(user.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour:'2-digit', minute: '2-digit' })} 
            icon={FiCalendar} 
        />
      </VStack>
    </Card>
  );
}

export default UserInfoDisplay;
