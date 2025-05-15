import React from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  Badge,
  SimpleGrid,
  useColorModeValue,
  Divider,
  Flex
} from '@chakra-ui/react';
import { FaUser,FaUserCircle, FaEnvelope, FaBriefcase, FaGraduationCap, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaIdBadge } from 'react-icons/fa';

const InfoRow = ({ label, value, icon, badgeText, badgeColorScheme }) => {
  const textColor = useColorModeValue("gray.700", "gray.200");
  const labelColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "flex-start", sm: "center" }} py={3}>
      <HStack spacing={3} mb={{ base: 1, sm: 0 }}>
        {icon && <Icon as={icon} color={labelColor} />}
        <Text fontWeight="medium" color={labelColor} minW="120px">{label}:</Text>
      </HStack>
      <HStack>
        <Text color={textColor} wordBreak="break-word">{value || '-'}</Text>
        {badgeText && <Badge colorScheme={badgeColorScheme || "gray"} variant="subtle" ml={2} px={2} py={0.5} borderRadius="md">{badgeText}</Badge>}
      </HStack>
    </Flex>
  );
};

function UserInfoDisplay({ user, examClassifications = [] }) {
  const cardBg = useColorModeValue("white", "gray.750");
  const headingColor = useColorModeValue("gray.700", "gray.100");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  if (!user) {
    return <Text>Kullanıcı bilgileri yüklenemedi.</Text>;
  }

  const defaultExam = examClassifications.find(
    ec => ec.id === user.defaultClassificationId
  );

  return (
    <Card variant="outline" bg={cardBg} borderColor={borderColor} boxShadow="lg" borderRadius="xl" p={6}>
      <VStack spacing={5} align="stretch">
        <Heading as="h2" size="lg" color={headingColor} mb={2} display="flex" alignItems="center">
          <Icon as={FaUserCircle} mr={3} color="brand.500" /> Profil Bilgilerim
        </Heading>
        
        <InfoRow 
            label="Kullanıcı Adı" 
            value={user.username} 
            icon={FaUser} 
        />
        <Divider borderColor={borderColor} />
        <InfoRow 
            label="E-posta" 
            value={user.email} 
            icon={FaEnvelope} 
            badgeText={user.isEmailVerified ? "Doğrulanmış" : "Doğrulanmamış"}
            badgeColorScheme={user.isEmailVerified ? "green" : "yellow"}
        />
        <Divider borderColor={borderColor} />
        <InfoRow 
            label="Rol" 
            value={user.role} 
            icon={FaIdBadge}
            badgeText={user.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
            badgeColorScheme={user.role === 'admin' ? 'purple' : 'blue'}
        />
        <Divider borderColor={borderColor} />
        <InfoRow 
            label="Uzmanlık Alanı" 
            value={user.specialization} 
            icon={FaBriefcase} 
        />
        <Divider borderColor={borderColor} />
        <InfoRow 
            label="Varsayılan Sınav Hedefi" 
            value={defaultExam ? defaultExam.name : (user.defaultClassificationId ? 'Bilinmeyen Sınav Tipi' : 'Belirtilmemiş')} 
            icon={FaGraduationCap} 
        />
        <Divider borderColor={borderColor} />
        <InfoRow 
            label="Kayıt Tarihi" 
            value={new Date(user.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })} 
            icon={FaCalendarAlt} 
        />
      </VStack>
    </Card>
  );
}

export default UserInfoDisplay;
