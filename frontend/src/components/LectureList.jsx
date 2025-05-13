import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import {
    Box,
    Heading,
    Text,
    Spinner,
    Alert,
    AlertIcon,
    AlertDescription,
    Card,
    CardBody,
    Image,
    Divider,
    VStack,
    Center,
    Tag,
    HStack,
    StackDivider,
    Icon, // Icon importu eklendi
    useColorModeValue // useColorModeValue importu zaten vardı
} from '@chakra-ui/react';
import { FaInfoCircle, FaBook, FaBuilding, FaTag } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper to find a single topic by ID from the tree
const findTopicByIdRecursive = (nodes, targetId) => {
    if (!Array.isArray(nodes)) return null;
    for (const node of nodes) {
        if (node.id === targetId) return node;
        if (node.children) {
            const found = findTopicByIdRecursive(node.children, targetId);
            if (found) return found;
        }
    }
    return null;
};

function LectureList({ selectedTopicId, selectedExamClassificationId, selectedBranchId  }) {
    const [allLectures, setAllLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();
  
    const [topicsTree, setTopicsTree] = useState([]);
    const [branches, setBranches] = useState([]);
    const [examClassifications, setExamClassifications] = useState([]);

    // Style Hooks
    const componentBg = useColorModeValue("gray.50", "gray.800"); // Ana arkaplan
    const cardBg = useColorModeValue("white", "gray.750");
    const cardBorderColor = useColorModeValue("gray.200", "gray.600");
    const headingColor = useColorModeValue("gray.700", "gray.200");
    const textColor = useColorModeValue("gray.600", "gray.400"); // Genel metinler için
    const mutedTextColor = useColorModeValue("gray.500", "gray.500"); // Daha soluk metinler
    const dividerColor = useColorModeValue("gray.200", "gray.600");
    const iconTeal = useColorModeValue("teal.500", "teal.300");
    const iconPurple = useColorModeValue("purple.500", "purple.300");
    const iconBlue = useColorModeValue("blue.500", "blue.300");

    // HTML içerik için stil objesi (sx prop'u ile kullanılacak)
    const htmlContentSx = {
        'h1, h2, h3, h4, h5, h6': { my: 3, fontWeight:'semibold', lineHeight:'tight', fontSize: 'md', color: headingColor },
        'p': { mb: 3, lineHeight: 'tall', color: textColor },
        'ul, ol': { pl: 5, mb: 3, color: textColor },
        'li': { mb: 1 },
        'img': { my: 3, borderRadius: 'md', maxW: '100%', height: 'auto', boxShadow: 'sm' },
        'a': { color: 'brand.500', textDecoration: 'underline', _hover: { color: 'brand.600'} },
        'code': { fontFamily:'mono', bg: useColorModeValue('gray.100', 'gray.700') , px:1, py:'1px', rounded:'sm', fontSize:'sm'},
        'pre': { fontFamily:'mono', bg: useColorModeValue('gray.100', 'gray.700'), p:3, rounded:'md', overflowX:'auto', fontSize:'sm', borderWidth:'1px', borderColor:dividerColor, my:4}
    };


    const getAllDescendantIds = useCallback((topicId, topicTreeNodes, includeSelf = true) => {
        let ids = [];
        if (includeSelf && topicId !== null) {
            ids.push(topicId);
        }
        const findChildrenRecursive = (currentTopicId, nodes) => {
            const topic = findTopicByIdRecursive(nodes, currentTopicId);
            if (topic && topic.children && topic.children.length > 0) {
                topic.children.forEach(child => {
                    ids.push(child.id);
                    findChildrenRecursive(child.id, nodes);
                });
            }
        };
        if (topicId !== null) {
          findChildrenRecursive(topicId, topicTreeNodes);
        }
        return [...new Set(ids.filter(id => id !== null && id !== undefined))];
    }, []);
  
    useEffect(() => {
        if (!token) {
            setLoading(false);
            setError("Yetkilendirme token'ı bulunamadı.");
            return;
        }
        setLoading(true); setError('');

        const fetchData = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [lecturesRes, topicsRes, branchesRes, ecRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/lectures`, config),
                    axios.get(`${API_BASE_URL}/api/topics`, config),
                    axios.get(`${API_BASE_URL}/api/branches`, config),
                    axios.get(`${API_BASE_URL}/api/exam-classifications`, config)
                ]);
                setAllLectures(Array.isArray(lecturesRes.data) ? lecturesRes.data : []);
                setTopicsTree(Array.isArray(topicsRes.data) ? topicsRes.data : []);
                setBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []);
                setExamClassifications(Array.isArray(ecRes.data) ? ecRes.data : []);
            } catch (err) {
                console.error("LectureList verileri çekilirken hata:", err);
                setError('Veriler yüklenirken bir hata oluştu.');
                setAllLectures([]); setTopicsTree([]); setBranches([]); setExamClassifications([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);


    const filteredLectures = useMemo(() => {
        if (!allLectures.length || !topicsTree.length) return []; // examClassifications ve branches kontrolü de eklenebilir, ancak filtreleme için öncelikli değiller.

        let lecturesToFilter = allLectures;

        if (selectedExamClassificationId !== null && selectedExamClassificationId !== undefined) {
            const ecIdNum = parseInt(selectedExamClassificationId);
            lecturesToFilter = lecturesToFilter.filter(lecture => lecture.examClassificationId === ecIdNum);
        }
        
        if (selectedBranchId !== null && selectedBranchId !== undefined) {
            const branchIdNum = parseInt(selectedBranchId);
            lecturesToFilter = lecturesToFilter.filter(lecture => {
                const topic = findTopicByIdRecursive(topicsTree, lecture.topicId);
                return topic && topic.branchId === branchIdNum;
            });
        }

        if (selectedTopicId !== null && selectedTopicId !== undefined) {
            const relevantTopicIds = getAllDescendantIds(parseInt(selectedTopicId), topicsTree, true);
            return lecturesToFilter.filter(lecture => 
                lecture.topicId !== null && 
                lecture.topicId !== undefined && 
                relevantTopicIds.includes(lecture.topicId)
            );
        }
        
        return lecturesToFilter;

    }, [allLectures, selectedTopicId, selectedExamClassificationId, selectedBranchId, topicsTree, getAllDescendantIds]);

    const filterHeading = useMemo(() => {
        if (loading && !examClassifications.length && !branches.length && !topicsTree.length) return "Konu Anlatımları Yükleniyor...";
        
        let parts = [];
        if (selectedExamClassificationId) {
            const ec = examClassifications.find(e => e.id === parseInt(selectedExamClassificationId));
            if(ec) parts.push(ec.name);
        }
        if (selectedBranchId) {
            const branch = branches.find(b => b.id === parseInt(selectedBranchId));
            if(branch && !parts.includes(branch.name)) parts.push(branch.name); // Tekrarı engelle
        }
        if (selectedTopicId) {
            const topicNode = findTopicByIdRecursive(topicsTree, parseInt(selectedTopicId));
            if (topicNode) {
                const topicNameWithSuffix = topicNode.name + " (ve alt konuları)";
                if (!parts.includes(topicNode.name) && !parts.includes(topicNameWithSuffix)) { 
                     parts.push(topicNameWithSuffix);
                } else {
                     const lastPartIndex = parts.findIndex(p => p === topicNode.name || p === topicNode.name + " (ve alt konuları)");
                     if (lastPartIndex !== -1 && parts[lastPartIndex] !== topicNameWithSuffix) {
                        parts[lastPartIndex] = topicNameWithSuffix;
                     } else if (!parts.includes(topicNameWithSuffix)){
                        parts.push(topicNameWithSuffix);
                     }
                }
            }
        }

        if (parts.length > 0) {
            return `Konu Anlatımları (Filtre: ${parts.join(" / ")})`;
        }
        return "Konu Anlatımları (Tümü)";
    }, [selectedTopicId, selectedExamClassificationId, selectedBranchId, topicsTree, examClassifications, branches, loading]);


    if (loading) {
      return (
          <Center py={10}>
              <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="brand.500" size="xl" />
              <Text ml={4} color={textColor}>Konu anlatımları yükleniyor...</Text>
          </Center>
      );
    }

    if (error) {
      return (
          <Alert status="error" variant="subtle" borderRadius="md" mt={4}>
              <AlertIcon />
              <AlertDescription>{error}</AlertDescription>
          </Alert>
      );
    }

    return (
        <Box p={{base:2, md:4}} bg={componentBg} borderRadius="lg">
            <Heading as="h2" size="lg" mb={6} color={headingColor}>
                {filterHeading}
            </Heading>

            {filteredLectures.length === 0 ? (
                <Alert status="info" variant="subtle" borderRadius="md">
                    <AlertIcon as={FaInfoCircle}/>
                    <AlertDescription>Bu filtreye uygun konu anlatımı bulunamadı.</AlertDescription>
                </Alert>
            ) : (
                <VStack spacing={6} align="stretch">
                {filteredLectures.map((lecture) => {
                    const topic = lecture.topicId ? findTopicByIdRecursive(topicsTree, lecture.topicId) : null;
                    const branch = topic && topic.branchId ? branches.find(b => b.id === topic.branchId) : null;
                    const ec = lecture.examClassificationId ? examClassifications.find(e => e.id === lecture.examClassificationId) : null;

                    return (
                        <Card key={lecture.id} variant="outline" size="md" borderWidth="1px" borderColor={cardBorderColor} bg={cardBg} boxShadow="sm">
                        <CardBody p={{base: 4, md: 6}}>
                            <Heading as="h3" size="md" mb={4} color={headingColor}>{lecture.title}</Heading>
                            <VStack spacing={2} align="flex-start" fontSize="sm" color={mutedTextColor} mb={4} divider={<StackDivider borderColor={dividerColor}/>}>
                                {ec && <HStack><Icon as={FaBook} color={iconTeal} /> <Text>Sınav Tipi: {ec.name}</Text></HStack>}
                                {branch && <HStack><Icon as={FaBuilding} color={iconPurple}/> <Text>Branş: {branch.name}</Text></HStack>}
                                {topic && <HStack><Icon as={FaTag} color={iconBlue}/> <Text>Konu: {topic.name}</Text></HStack>}
                            </VStack>

                            {lecture.imageUrl && (
                            <Center my={5}> {/* Center eklendi */}
                                <Image
                                    src={lecture.imageUrl}
                                    alt={`${lecture.title} için görsel`}
                                    borderRadius="md"
                                    boxShadow="md"
                                    maxW={{ base: '100%', md: 'xl' }}
                                    objectFit="contain"
                                    loading="lazy"
                                />
                            </Center>
                            )}
                            <Divider my={4} borderColor={dividerColor}/>
                            <Box
                                className="lecture-html-content-list"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lecture.content) }}
                                sx={htmlContentSx} // Stil objesi kullanıldı
                            />
                        </CardBody>
                        </Card>
                    );
                })}
                </VStack>
            )}
        </Box>
    );
}

export default LectureList;