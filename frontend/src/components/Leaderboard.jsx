import React from 'react';
import {
    Box,
    Heading,
    Text,
    List,
    ListItem,
    Spinner, // Yükleme göstergesi
    Alert,
    AlertIcon,
    // AlertDescription kaldırıldı, error string doğrudan kullanılıyor
    Flex, // Düzen için
    // Spacer kaldırıldı, Flex justifyContent kullanılıyor
    Badge, // Skor için
    Icon, // İkonlar için
    Center // Ortalama için
} from '@chakra-ui/react';
import { FaTrophy } from 'react-icons/fa'; // FaSpinner kaldırıldı, Chakra Spinner kullanılıyor

// Leaderboard Bileşeni (Tema ile Uyumlu)
function Leaderboard({ data, loading, error }) {
    // Yükleme Durumu
    if (loading) {
        // Chakra Spinner tema stilini kullanır (varsayılan veya colorScheme ile)
        return (
            <Center p={4}>
                <Spinner color="brand.500" thickness="3px" speed="0.7s" size="lg" />
            </Center>
        );
    }

    // Hata Durumu
    if (error) {
        // Chakra Alert tema stilini (subtle, warning) kullanır
        return (
            <Alert status="warning" variant="subtle" borderRadius="md" fontSize="sm" mt={4}>
                <AlertIcon />
                {error}
            </Alert>
        );
    }

    // Veri Yok Durumu
    if (!data || data.length === 0) {
         // Chakra Text tema stilini ve semantic token'ı kullanır
        return (
            <Text textAlign="center" p={4} color="textMuted" fontSize="sm">
                Henüz lider tablosu verisi yok.
            </Text>
        );
    }

    // Lider Tablosu Render
    return (
        // Box tema boşluklarını kullanır
        <Box mt={6}>
            {/* Heading tema stilini (md) kullanır */}
            <Heading as="h4" size="md" mb={3} display="flex" alignItems="center" justifyContent="center" gap={2}>
                {/* Icon tema rengini (yellow) kullanır */}
                <Icon as={FaTrophy} color="yellow.400" /> Lider Tablosu (Top 10)
            </Heading>

            {/* List ve ListItem tema stillerini ve semantic token'ları kullanır */}
            <List spacing={2}>
                {data.slice(0, 10).map((entry, index) => ( // Sadece ilk 10'u göster
                    <ListItem
                        key={entry.userId || index}
                        p={2}
                        borderRadius="md" // Tema radii.md
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        bg={index === 0 ? "bgTertiary" : "transparent"} // Semantic Token
                        fontWeight={index < 3 ? 'semibold' : 'normal'} // Tema fontWeights
                         _hover={{ bg: index !== 0 ? 'bgTertiary' : undefined }} // Hover efekti (ilk sıra hariç)
                         transition="background-color 0.1s ease-in-out"
                    >
                        <Flex align="center" minW="0"> {/* Taşmayı önlemek için minW */}
                            {/* Sıra numarası - Text tema stilini ve semantic token'ı kullanır */}
                            <Text as="span" w={6} mr={3} textAlign="right" color="textMuted" fontSize="sm">
                                {index + 1}.
                            </Text>
                            {/* Kullanıcı adı - Text tema stilini kullanır */}
                            <Text as="span" noOfLines={1} title={entry.user?.username || `Kullanıcı ${entry.userId}`}> {/* title ekle */}
                                {(entry.user?.username) || `Kullanıcı ${entry.userId}`}
                            </Text>
                        </Flex>
                        {/* Skor - Badge tema stilini (solid, brand, sm) kullanır */}
                        <Badge colorScheme="brand" variant="solid" fontSize="xs" px={2}> {/* Daha küçük font */}
                            {entry.score} Puan
                        </Badge>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}

export default Leaderboard;