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
    AlertDescription,
    Flex, // Düzen için
    Spacer, // Boşluk itmek için
    Badge, // Skor için
    Icon, // İkonlar için
    Center // Ortalama için
} from '@chakra-ui/react';
import { FaTrophy, FaSpinner } from 'react-icons/fa'; // İkonlar

function Leaderboard({ data, loading, error }) {
    // Yükleme Durumu
    if (loading) {
        // Chakra Spinner ile ortalanmış yükleme göstergesi
        return <Center p={4}><Spinner color="brand.500" /></Center>;
    }

    // Hata Durumu
    if (error) {
        // Chakra Alert ile hata mesajı
        return (
            <Alert status="warning" variant="subtle" borderRadius="md" fontSize="sm" mt={4}>
                <AlertIcon />
                {error}
            </Alert>
        );
    }

    // Veri Yok Durumu
    if (!data || data.length === 0) {
         // Chakra Text ile mesaj
        return <Text textAlign="center" p={4} color="textMuted" fontSize="sm">Henüz lider tablosu verisi yok.</Text>;
    }

    // Lider Tablosu Render
    return (
        // Eski div.leaderboard.mt-6 yerine Box
        <Box mt={6}>
            {/* Eski h4 yerine Chakra Heading */}
            <Heading as="h4" size="md" mb={3} display="flex" alignItems="center" justifyContent="center" gap={2}>
                 {/* İkon */}
                <Icon as={FaTrophy} color="yellow.400" /> Lider Tablosu (Top 10)
            </Heading>

            {/* Eski ol yerine Chakra List */}
            <List spacing={2}>
                {data.map((entry, index) => (
                    // Eski li yerine Chakra ListItem ve Flex
                    <ListItem
                        key={entry.userId || index}
                        p={2}
                        borderRadius="md"
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        // İlk sırayı vurgula
                        bg={index === 0 ? "bgTertiary" : "transparent"}
                        // İlk 3'ü kalın yap
                        fontWeight={index < 3 ? 'semibold' : 'normal'}
                    >
                        <Flex align="center">
                            {/* Sıra numarası */}
                            <Text as="span" w={6} mr={3} textAlign="right" color="textMuted" fontSize="sm">
                                {index + 1}.
                            </Text>
                            {/* Kullanıcı adı */}
                            <Text as="span" noOfLines={1}> {/* Uzun isimler için taşmayı önle */}
                                {(entry.user?.username) || `Kullanıcı ${entry.userId}`}
                            </Text>
                        </Flex>
                        {/* Skor (Badge veya Text ile) */}
                        <Badge colorScheme="brand" variant="solid" fontSize="sm" px={2}>
                            {entry.score} Puan
                        </Badge>
                         {/* Veya:
                         <Text fontWeight="bold" color="accent">{entry.score} Puan</Text>
                         */}
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}

export default Leaderboard;