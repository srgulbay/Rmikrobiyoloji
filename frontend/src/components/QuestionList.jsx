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
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Center,
    useColorModeValue,
    Icon,
    HStack, // HStack kullanılıyorsa import edilmeli, mevcut kodda direkt kullanılmıyor ama ikon+text için faydalı olabilir
    Tag // Tag komponenti de kullanılabilir konu/sınıflandırma gösterimi için
} from '@chakra-ui/react';
import { FaBook, FaBuilding, FaTag, FaImage, FaInfoCircle } from 'react-icons/fa';

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

function QuestionList({ selectedTopicId, selectedExamClassificationId, selectedBranchId }) {
    const [allQuestions, setAllQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();

    const [topicsTree, setTopicsTree] = useState([]);
    const [branches, setBranches] = useState([]);
    const [examClassifications, setExamClassifications] = useState([]);

    // Style Hooks
    const tableHeaderBg = useColorModeValue("gray.100", "gray.750");
    const tableRowHoverBg = useColorModeValue('gray.50', 'gray.800');
    const componentBg = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const headingColor = useColorModeValue("gray.700", "gray.200");
    const textColor = useColorModeValue("gray.600", "gray.400");


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
                const [questionsRes, topicsRes, branchesRes, ecRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/questions`, config),
                    axios.get(`${API_BASE_URL}/api/topics`, config),
                    axios.get(`${API_BASE_URL}/api/branches`, config),
                    axios.get(`${API_BASE_URL}/api/exam-classifications`, config)
                ]);
                setAllQuestions(Array.isArray(questionsRes.data) ? questionsRes.data : []);
                setTopicsTree(Array.isArray(topicsRes.data) ? topicsRes.data : []);
                setBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []);
                setExamClassifications(Array.isArray(ecRes.data) ? ecRes.data : []);
            } catch (err) {
                console.error("QuestionList verileri çekilirken hata:", err);
                setError('Veriler yüklenirken bir hata oluştu.');
                setAllQuestions([]); setTopicsTree([]); setBranches([]); setExamClassifications([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const filteredQuestions = useMemo(() => {
        if (!allQuestions.length || !topicsTree.length || !examClassifications.length || !branches.length) return [];

        let questionsToFilter = allQuestions;

        if (selectedExamClassificationId !== null && selectedExamClassificationId !== undefined) {
            const ecIdNum = parseInt(selectedExamClassificationId);
            questionsToFilter = questionsToFilter.filter(q => q.examClassificationId === ecIdNum);
        }
        
        if (selectedBranchId !== null && selectedBranchId !== undefined) {
            const branchIdNum = parseInt(selectedBranchId);
            questionsToFilter = questionsToFilter.filter(q => {
                const topic = findTopicByIdRecursive(topicsTree, q.topicId);
                return topic && topic.branchId === branchIdNum;
            });
        }

        if (selectedTopicId !== null && selectedTopicId !== undefined) {
            const relevantTopicIds = getAllDescendantIds(parseInt(selectedTopicId), topicsTree, true);
            return questionsToFilter.filter(q => 
                q.topicId !== null && 
                q.topicId !== undefined && 
                relevantTopicIds.includes(q.topicId)
            );
        }
        
        return questionsToFilter;

    }, [allQuestions, selectedTopicId, selectedExamClassificationId, selectedBranchId, topicsTree, examClassifications, branches, getAllDescendantIds]);

    const filterHeading = useMemo(() => {
        if (loading && !examClassifications.length && !branches.length && !topicsTree.length) return "Soru Havuzu Yükleniyor...";
        
        let parts = [];
        if (selectedExamClassificationId) {
            const ec = examClassifications.find(e => e.id === parseInt(selectedExamClassificationId));
            if(ec) parts.push(ec.name);
        }
        if (selectedBranchId) {
            const branch = branches.find(b => b.id === parseInt(selectedBranchId));
            if(branch) parts.push(branch.name);
        }
        if (selectedTopicId) {
            const topicNode = findTopicByIdRecursive(topicsTree, parseInt(selectedTopicId));
            if (topicNode) {
                const topicNameWithSuffix = topicNode.name + " (ve alt konuları)";
                 if (!parts.includes(topicNode.name)) { 
                     parts.push(topicNameWithSuffix);
                 } else {
                     const lastPartIndex = parts.lastIndexOf(topicNode.name);
                     if (lastPartIndex !== -1 && parts[lastPartIndex] !== topicNameWithSuffix) {
                        parts[lastPartIndex] = topicNameWithSuffix;
                     } else if (!parts.includes(topicNameWithSuffix)){
                        parts.push(topicNameWithSuffix);
                     }
                 }
            }
        }

        if (parts.length > 0) {
            return `Soru Havuzu (Filtre: ${parts.join(" / ")})`;
        }
        return "Soru Havuzu (Tümü)";
    }, [selectedTopicId, selectedExamClassificationId, selectedBranchId, topicsTree, examClassifications, branches, loading]);

    const stripHtml = (html) => { 
      if (!html) return ''; 
      const cleanHtml = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
      const doc = new DOMParser().parseFromString(cleanHtml, 'text/html');
      return doc.body.textContent || "";
    };

    if (loading) {
      return (
          <Center py={10}>
              <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="brand.500" size="xl" />
              <Text ml={4} color="textSecondary">Sorular yükleniyor...</Text>
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
        <Box p={4} borderWidth="1px" borderRadius="lg" borderColor={borderColor} boxShadow="lg" bg={componentBg}>
            <Heading as="h2" size="lg" mb={6} color={headingColor}>
                {filterHeading}
            </Heading>

            {filteredQuestions.length === 0 ? (
                <Alert status="info" variant="subtle" borderRadius="md">
                    <AlertIcon as={FaInfoCircle}/>
                    <AlertDescription>Bu filtreye uygun soru bulunamadı.</AlertDescription>
                </Alert>
            ) : (
                 <TableContainer borderWidth="1px" borderColor={borderColor} borderRadius="lg" boxShadow="sm">
                     <Table variant="simple" size="sm">
                         <Thead bg={tableHeaderBg}>
                             <Tr>
                                 <Th>ID</Th>
                                 <Th maxW="250px">Metin (Önizleme)</Th>
                                 <Th><HStack spacing={1}><Icon as={FaBook} /><span>Sınav Tipi</span></HStack></Th>
                                 <Th><HStack spacing={1}><Icon as={FaBuilding} /><span>Branş</span></HStack></Th>
                                 <Th><HStack spacing={1}><Icon as={FaTag} /><span>Konu</span></HStack></Th>
                                 <Th>Soru Tipi</Th>
                                 <Th textAlign="center"><Icon as={FaImage} /> Görsel</Th>
                             </Tr>
                         </Thead>
                         <Tbody>
                             {filteredQuestions.map((q) => {
                                 const topic = q.topicId ? findTopicByIdRecursive(topicsTree, q.topicId) : null;
                                 const branchName = topic && topic.branchId ? (branches.find(b => b.id === topic.branchId)?.name || '-') : '-';
                                 const examClassificationName = q.examClassificationId ? (examClassifications.find(ec => ec.id === q.examClassificationId)?.name || '-') : '-';
                                 
                                 return (
                                 <Tr key={q.id} _hover={{ bg: tableRowHoverBg }}>
                                     <Td>{q.id}</Td>
                                     <Td maxW="250px" whiteSpace="normal" title={stripHtml(q.text)} fontSize="xs">
                                          {stripHtml(q.text).substring(0, 60)}{stripHtml(q.text).length > 60 ? "..." : ""}
                                     </Td>
                                     <Td>{examClassificationName}</Td>
                                     <Td>{branchName}</Td>
                                     <Td>{topic?.name || '-'}</Td>
                                     <Td><Tag size="sm" variant="outline" colorScheme="purple">{q.classification || '-'}</Tag></Td>
                                     <Td textAlign="center">{q.imageUrl ? <Icon as={FaImage} color="green.500" title={q.imageUrl}/> : '-'}</Td>
                                 </Tr>
                             );
                            })}
                         </Tbody>
                     </Table>
                 </TableContainer>
            )}
        </Box>
    );
}

export default QuestionList;