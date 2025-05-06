import React, { useState, useEffect, useCallback, Fragment, useRef } from 'react'; 
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Editor } from '@tinymce/tinymce-react';
import DOMPurify from 'dompurify';
import AdminStatsOverview from '../components/AdminStatsOverview';
// Gerekli ikonları import edelim
import { FaUsers, FaTags, FaChalkboardTeacher, FaQuestionCircle, FaUserEdit, FaTrashAlt, FaChartBar, FaFolderOpen, FaFileAlt, FaSave, FaTimesCircle, FaPlus, FaUpload, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- User Management Component ---
function UserManagement({ token }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user: adminUser } = useAuth();
    const backendUserUrl = `${API_BASE_URL}/api/users`;
    const backendStatsUrl = `${API_BASE_URL}/api/stats/admin/user`;

    const fetchUsers = useCallback(async () => {
        setLoading(true); setError('');
        if (!token) { setError("Yetkilendirme token'ı bulunamadı."); setLoading(false); return; }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(backendUserUrl, config);
            setUsers(response.data || []);
        } catch (err) {
            console.error("Kullanıcıları çekerken hata:", err);
            setError(err.response?.data?.message || 'Kullanıcılar yüklenirken bir hata oluştu.');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [token, backendUserUrl]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleRoleChange = async (userId, newRole) => {
        if (!newRole) { /* TODO: Use Modal/Toast instead of alert */ alert('Lütfen bir rol seçin.'); return; }
        if (userId === adminUser?.id) { /* TODO: Use Modal/Toast instead of alert */ alert("Kendi rolünüzü buradan değiştiremezsiniz."); fetchUsers(); return; }
        /* TODO: Use Modal instead of confirm */
        if (!window.confirm(`Kullanıcı ID ${userId} için rolü "${newRole}" olarak değiştirmek istediğinize emin misiniz?`)) { return; }
        setError('');
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const updateUrl = `${backendUserUrl}/${userId}/role`;
            await axios.put(updateUrl, { role: newRole }, config);
            /* TODO: Use Toast success instead of alert */ alert('Rol başarıyla güncellendi!');
            fetchUsers();
        } catch (err) {
            console.error("Rol güncellenirken hata:", err);
            setError(err.response?.data?.message || 'Rol güncellenirken bir hata oluştu.');
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (userId === adminUser?.id) { /* TODO: Use Modal/Toast instead of alert */ alert("Kendinizi silemezsiniz!"); return; }
        /* TODO: Use Modal instead of confirm */
        if (window.confirm(`Kullanıcıyı (${username} - ID: ${userId}) silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
            setError('');
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const deleteUrl = `${backendUserUrl}/${userId}`;
                await axios.delete(deleteUrl, config);
                 /* TODO: Use Toast success instead of alert */ alert(`Kullanıcı (${username}) başarıyla silindi!`);
                fetchUsers();
            } catch (err) {
                console.error("Kullanıcı silinirken hata:", err);
                setError(err.response?.data?.message || 'Kullanıcı silinirken bir hata oluştu.');
            }
        }
    };

    // TODO: Replace alert with a Modal component to show stats
    const handleViewUserStats = async (userId, username) => {
        setError('');
        /* TODO: Use Modal/Toast instead of alert */ alert(`Kullanıcı ${username} (ID: ${userId}) için istatistikler getiriliyor...`);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const statsUrl = `${backendStatsUrl}/${userId}/detailed`;
            const response = await axios.get(statsUrl, config);
            console.log('API Response Data:', response.data);
            let statsText = `--- ${username} İstatistikleri ---\n\n`;
            if (Array.isArray(response.data) && response.data.length > 0) {
                response.data.forEach(stat => {
                    statsText += `Konu: ${stat.topicName}\n`;
                    statsText += `Toplam Deneme: ${stat.totalAttempts}\n`;
                    statsText += `Doğru Sayısı: ${stat.correctAttempts}\n`;
                    statsText += `Başarı Oranı: %${stat.accuracy}\n`;
                    statsText += `--------------------------\n`;
                });
            } else {
                statsText += "Bu kullanıcı için henüz istatistik verisi bulunamadı.";
            }
            /* TODO: Use Modal/Toast instead of alert */ alert(statsText); // Replace with Modal display
        } catch (err) {
            console.error(`Kullanıcı ${userId} istatistikleri getirilirken hata:`, err);
             /* TODO: Use Modal/Toast instead of alert */ alert(`Hata: ${err.response?.data?.message || 'İstatistikler getirilemedi.'}`);
            setError(`Kullanıcı ${userId} istatistikleri getirilemedi.`);
        }
    };

    if (loading) return <div className='loading-indicator'><div className='spinner'></div> Kullanıcılar yükleniyor...</div>;

    return (
        // Her yönetim bölümü için .admin-section sınıfını kullan
        <div className="admin-section user-management">
            {/* Bölüm Başlığı */}
            <h3 className='d-flex align-center gap-3'>
                <FaUsers /> Kullanıcı Yönetimi
            </h3>

            {/* Hata Mesajı */}
            {error && (
                 <div className="alert alert-danger mb-4" role="alert">
                    <FaExclamationTriangle className='alert-icon' />
                    <div className="alert-content">{error}</div>
                 </div>
             )}

            {/* Kullanıcı Tablosu */}
            {users.length === 0 && !loading ? (
                 <div className="alert alert-info">
                     <FaInfoCircle className='alert-icon'/>
                     <div className="alert-content">Kullanıcı bulunamadı.</div>
                </div>
            ) : (
                <div className="table-container">
                    {/* Tabloya .table, .table-striped, .table-hover, .table-dense sınıflarını ekleyelim */}
                    <table className="table table-striped table-hover table-dense">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Kullanıcı Adı</th>
                                <th>Rol</th>
                                <th>Uzmanlık</th>
                                <th>Kayıt Tarihi</th>
                                <th className='text-right'>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.username}</td>
                                    <td>
                                        {/* Rolü badge ile gösterelim */}
                                        <span className={`badge ${user.role === 'admin' ? 'badge-success' : 'badge-secondary'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>{user.specialization || '-'}</td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    {/* İşlem butonları için .action-buttons */}
                                    <td className="action-buttons">
                                        {/* Rol Değiştirme */}
                                        <select
                                            defaultValue={user.role}
                                            id={`role-select-${user.id}`}
                                            className='form-select form-select-sm mr-2' // form-select ve küçük boyut
                                            disabled={user.id === adminUser?.id}
                                            style={{width: '100px', display:'inline-block', verticalAlign: 'middle'}} // Boyut ayarı
                                        >
                                            <option value="user">user</option>
                                            <option value="admin">admin</option>
                                        </select>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            disabled={user.id === adminUser?.id}
                                            onClick={() => { const el = document.getElementById(`role-select-${user.id}`); if(el) handleRoleChange(user.id, el.value); }}
                                            title="Rolü Güncelle"
                                        >
                                            <FaUserEdit /> {/* İkon */}
                                        </button>
                                        {/* İstatistikler Butonu */}
                                        <button
                                             className="btn btn-info btn-sm"
                                             onClick={() => handleViewUserStats(user.id, user.username)}
                                             title="Kullanıcı İstatistikleri"
                                        >
                                             <FaChartBar /> {/* İkon */}
                                        </button>
                                        {/* Sil Butonu */}
                                        <button
                                            className="btn btn-danger btn-sm"
                                            disabled={user.id === adminUser?.id}
                                            onClick={() => handleDeleteUser(user.id, user.username)}
                                            title="Kullanıcıyı Sil"
                                        >
                                            <FaTrashAlt /> {/* İkon */}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// --- Topic Management Component ---
function TopicManagement({ token }) {
    const [topics, setTopics] = useState([]); // Ağaç yapısı
    const [allTopicsFlat, setAllTopicsFlat] = useState([]); // Form için düz liste
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState(''); // Form için ayrı hata state'i
    const [editingTopic, setEditingTopic] = useState(null);
    const [formState, setFormState] = useState({ name: '', description: '', parentId: '' });
    const backendUrl = `${API_BASE_URL}/api/topics`;

    const flattenTopics = (nodes, list = [], level = 0) => {
        nodes.forEach(node => {
            list.push({ id: node.id, name: '\u00A0'.repeat(level * 4) + node.name }); // Girinti için boşluk
            if (node.children) flattenTopics(node.children, list, level + 1);
        });
        return list;
    };

    const fetchTopics = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(backendUrl, config);
            setTopics(response.data || []);
            // Hiyerarşik listeyi de düz listeye çevir (Form select için)
             // Düz liste oluştururken kök düğümleri ve çocukları dolaşalım
            const rootNodes = response.data || [];
            const flatList = [];
            const processNode = (node, level) => {
                 flatList.push({ id: node.id, name: '\u00A0'.repeat(level * 4) + node.name });
                 if (node.children && node.children.length > 0) {
                      node.children.forEach(child => processNode(child, level + 1));
                 }
             };
             rootNodes.forEach(node => processNode(node, 0));
             setAllTopicsFlat(flatList);

        } catch (err) { console.error("Konuları çekerken hata:", err); setError(err.response?.data?.message || 'Konular yüklenirken bir hata oluştu.'); setTopics([]); setAllTopicsFlat([]); }
        finally { setLoading(false); }
    }, [token, backendUrl]);

    useEffect(() => { fetchTopics(); }, [fetchTopics]);

    const handleInputChange = (e) => { const { name, value } = e.target; setFormState(prev => ({ ...prev, [name]: value })); };

    const handleFormSubmit = async (e) => {
        e.preventDefault(); setFormError('');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const topicData = { name: formState.name.trim(), description: formState.description.trim(), parentId: formState.parentId === '' ? null : parseInt(formState.parentId, 10) };

        if(!topicData.name){
            setFormError("Konu adı boş bırakılamaz.");
            return;
        }

        try {
            if (editingTopic) {
                await axios.put(`${backendUrl}/${editingTopic.id}`, topicData, config);
                 /* TODO: Use Toast success instead of alert */ alert('Konu başarıyla güncellendi!');
            } else {
                await axios.post(backendUrl, topicData, config);
                 /* TODO: Use Toast success instead of alert */ alert('Konu başarıyla eklendi!');
            }
            resetForm();
            fetchTopics(); // Listeyi yenile
        } catch (err) {
             console.error("Konu kaydedilirken hata:", err);
             setFormError(err.response?.data?.message || 'Konu kaydedilirken bir hata oluştu.');
        }
    };

    const handleEdit = (topic) => {
        const { children, ...topicDataToEdit } = topic; // children'ı ayır
        setEditingTopic(topicDataToEdit);
        setFormState({ name: topicDataToEdit.name, description: topicDataToEdit.description || '', parentId: topicDataToEdit.parentId === null ? '' : String(topicDataToEdit.parentId) });
        setFormError(''); // Düzenleme moduna geçerken form hatasını temizle
        // Forma scroll yapma
        const formElement = document.getElementById('topic-form');
        if (formElement) {
             formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

     const handleDelete = async (topicId, topicName) => {
        /* TODO: Use Modal instead of confirm */
         if (window.confirm(`Konuyu (${topicName} - ID: ${topicId}) ve altındaki tüm alt konuları ve ilişkili içerikleri (ders, soru vb.) silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
             setError(''); // Ana liste hatasını temizle
             try {
                 const config = { headers: { Authorization: `Bearer ${token}` } };
                 await axios.delete(`${backendUrl}/${topicId}`, config);
                  /* TODO: Use Toast success instead of alert */ alert('Konu başarıyla silindi!');
                 fetchTopics(); // Listeyi yenile
             } catch (err) {
                 console.error("Konu silinirken hata:", err);
                 setError(err.response?.data?.message || 'Konu silinirken bir hata oluştu.');
             }
         }
     };


    const resetForm = () => { setEditingTopic(null); setFormState({ name: '', description: '', parentId: '' }); setFormError(''); };

    // TopicNode'u stil sınıfları ve ikonlarla güncelleyelim
    const TopicNode = ({ topic, level = 0 }) => (
        // Fragment yerine doğrudan div, style'ı CSS değişkeni ile ayarlayalım
         <div className='topic-node-item' style={{ '--level': level }}>
            <span className='topic-name'>
                 {/* React Icons Kullanımı */}
                {topic.children?.length ? <FaFolderOpen /> : <FaFileAlt />}
                <span>[{topic.id}] {topic.name}</span>
             </span>
             <span className='topic-actions'>
                 <button onClick={() => handleEdit(topic)} className="btn btn-secondary btn-sm" title="Düzenle">
                     <FaUserEdit />
                 </button>
                 <button onClick={() => handleDelete(topic.id, topic.name)} className="btn btn-danger btn-sm" title="Sil">
                     <FaTrashAlt />
                 </button>
             </span>
        </div>
    );

    // Recursive render fonksiyonu
     const renderTopics = (topics, level = 0) => {
         return topics.map(topic => (
             <Fragment key={topic.id}>
                 <TopicNode topic={topic} level={level} />
                 {/* Alt konuları recursive olarak render et */}
                 {Array.isArray(topic.children) && topic.children.length > 0 && (
                      // Alt konular için bir sarmalayıcıya gerek yok, TopicNode kendi margin'ini ayarlıyor
                      renderTopics(topic.children, level + 1)
                 )}
             </Fragment>
         ));
     };

    if (loading) return <div className='loading-indicator'><div className='spinner'></div> Konular yükleniyor...</div>;

    return (
        <div className="admin-section topic-management">
            <h3 className='d-flex align-center gap-3'>
                 <FaTags /> Konu Yönetimi
             </h3>

            {error && (
                <div className="alert alert-danger mb-4" role="alert">
                     <FaExclamationTriangle className='alert-icon' />
                     <div className="alert-content">{error}</div>
                </div>
             )}

            {/* Konu Ekleme/Düzenleme Formu */}
            {/* admin-form-section sınıfını form'a uygula */}
             <form id="topic-form" onSubmit={handleFormSubmit} className="admin-form-section">
                <h4>{editingTopic ? `Konu Düzenle (ID: ${editingTopic.id})` : 'Yeni Konu Ekle'}</h4>

                {formError && <div className="alert alert-warning mb-4">{formError}</div>}

                <div className="form-group">
                    <label htmlFor="topicName" className='form-label'>Konu Adı:</label>
                    <input
                        type="text"
                        id="topicName"
                        name="name"
                        className='form-input' // Sınıfı uygula
                        value={formState.name}
                        onChange={handleInputChange}
                        required
                     />
                </div>

                <div className="form-group">
                    <label htmlFor="topicDescription" className='form-label'>Açıklama (Opsiyonel):</label>
                    <textarea
                        id="topicDescription"
                        name="description"
                        className='form-textarea' // Sınıfı uygula
                        value={formState.description}
                        onChange={handleInputChange}
                        rows="3"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="topicParent" className='form-label'>Üst Konu:</label>
                    <select
                        id="topicParent"
                        name="parentId"
                        className='form-select' // Sınıfı uygula
                        value={formState.parentId}
                        onChange={handleInputChange}
                        // Düzenleme sırasında kendini üst konu olarak seçmeyi engelle
                         disabled={loading}
                     >
                        <option value="">-- Ana Kategori --</option>
                        {/* Düzenleme modundaysa, mevcut konuyu listeden çıkar */}
                         {allTopicsFlat
                             .filter(o => !editingTopic || o.id !== editingTopic.id)
                             .map(o => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                         ))}
                    </select>
                </div>

                 {/* Butonlar için flex container */}
                 <div className='d-flex gap-3 mt-5'>
                     <button type="submit" className='btn btn-primary'>
                         <FaSave className='btn-icon'/>
                         {editingTopic ? 'Güncelle' : 'Ekle'}
                     </button>
                     {editingTopic && (
                         <button type="button" onClick={resetForm} className='btn btn-secondary'>
                              <FaTimesCircle className='btn-icon'/>
                              İptal
                         </button>
                     )}
                 </div>
            </form>

            {/* Mevcut Konular Listesi */}
             <h4>Mevcut Konular (Hiyerarşik)</h4>
             {topics.length === 0 && !loading ? (
                 <div className="alert alert-info">
                     <FaInfoCircle className='alert-icon'/>
                     <div className="alert-content">Konu bulunamadı.</div>
                 </div>
             ) : (
                  // topic-management-hierarchy sınıfını uygula
                  <div className='topic-management-hierarchy'>
                      {renderTopics(topics, 0)}
                  </div>
             )}
        </div>
    );
}

// --- Lecture Management Component ---
function LectureManagement({ token }) {
    const [lectures, setLectures] = useState([]);
    const [topicsTree, setTopicsTree] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState(''); // Form Error
    const [editingLecture, setEditingLecture] = useState(null);
    const [formState, setFormState] = useState({ title: '', content: '', topicId: '', imageUrl: '' });
    const [isUploading, setIsUploading] = useState(false);
    const editorRef = useRef(null); // TinyMCE ref

    const backendLectureUrl = `${API_BASE_URL}/api/lectures`;
    const backendTopicUrl = `${API_BASE_URL}/api/topics`;
    const backendUploadUrl = `${API_BASE_URL}/api/upload/image`;

    const fetchData = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [lecturesRes, topicsRes] = await Promise.all([
                axios.get(backendLectureUrl, config),
                axios.get(backendTopicUrl, config) // Hiyerarşik çekiyoruz
            ]);
            setLectures(lecturesRes.data || []);
            setTopicsTree(topicsRes.data || []); // Ağaç yapısını state'e al
        } catch (err) { console.error("Lecture/Topic Verisi çekerken hata:", err); setError(err.response?.data?.message || 'Veriler yüklenirken hata oluştu.'); setLectures([]); setTopicsTree([]); }
        finally { setLoading(false); }
    }, [token, backendLectureUrl, backendTopicUrl]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleInputChange = (e) => { const { name, value } = e.target; setFormState(prev => ({ ...prev, [name]: value })); };
    const handleEditorChange = (content, editor) => { setFormState(prev => ({ ...prev, content: content })); };

    const handleFormSubmit = async (e) => {
        e.preventDefault(); setFormError('');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        if (!formState.topicId) { setFormError('Lütfen bir konu seçin.'); return; }
        // TinyMCE içeriğini kontrol et (boş veya sadece <p><br></p> olmamalı)
        const editorContent = editorRef.current ? editorRef.current.getContent() : formState.content;
        if (!formState.title || !editorContent || editorContent.trim() === '<p><br data-mce-bogus="1"></p>' || editorContent.trim() === '<p><br></p>') {
             setFormError('Başlık ve İçerik alanları zorunludur.'); return;
        }
        const lectureData = { title: formState.title, content: editorContent, topicId: parseInt(formState.topicId, 10), imageUrl: formState.imageUrl.trim() === '' ? null : formState.imageUrl };
        try {
            if (editingLecture) {
                await axios.put(`${backendLectureUrl}/${editingLecture.id}`, lectureData, config);
            } else {
                await axios.post(backendLectureUrl, lectureData, config);
            }
             /* TODO: Use Toast success instead of alert */ alert(editingLecture ? 'Konu anlatımı güncellendi!' : 'Konu anlatımı eklendi!');
            resetForm();
            fetchData(); // Listeyi yenile
        } catch (err) { console.error("Konu anlatımı kaydedilirken hata:", err); setFormError(err.response?.data?.message || 'Konu anlatımı kaydedilirken bir hata oluştu.'); }
    };

    const handleEdit = (lecture) => {
        setEditingLecture(lecture);
        setFormState({ title: lecture.title, content: lecture.content || '', topicId: lecture.topic?.id ? String(lecture.topic.id) : '', imageUrl: lecture.imageUrl || '' });
        setFormError('');
        // TinyMCE içeriğini güncelle (ref üzerinden)
        if (editorRef.current) {
             editorRef.current.setContent(lecture.content || '');
        }
        const formElement = document.getElementById('lecture-form');
        if (formElement) {
             formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

     const handleDelete = async (lectureId, lectureTitle) => {
         /* TODO: Use Modal instead of confirm */
         if (window.confirm(`Konu anlatımını silmek istediğinizden emin misiniz: ${lectureTitle} (ID: ${lectureId})? Bu işlem ilişkili soruları etkilemeyecektir.`)) {
             setError('');
             try {
                 const config = { headers: { Authorization: `Bearer ${token}` } };
                 await axios.delete(`${backendLectureUrl}/${lectureId}`, config);
                  /* TODO: Use Toast success instead of alert */ alert('Konu anlatımı başarıyla silindi!');
                 fetchData(); // Listeyi yenile
             } catch (err) { console.error("Konu anlatımı silinirken hata:", err); setError(err.response?.data?.message || 'Konu anlatımı silinirken bir hata oluştu.'); }
         }
     };

    const resetForm = () => {
         setEditingLecture(null);
         setFormState({ title: '', content: '', topicId: '', imageUrl: '' });
         setFormError('');
         // TinyMCE içeriğini temizle
         if (editorRef.current) {
             editorRef.current.setContent('');
         }
     };


    // TinyMCE için resim yükleme handler'ı
     const handleImageUpload = useCallback((blobInfo, progress) => new Promise((resolve, reject) => {
         if (!token) { reject('Yetkilendirme tokenı bulunamadı.'); return; }
         setIsUploading(true);
         const formData = new FormData();
         formData.append('file', blobInfo.blob(), blobInfo.filename());

         axios.post(backendUploadUrl, formData, {
             headers: {
                 'Content-Type': 'multipart/form-data',
                 'Authorization': `Bearer ${token}`
             },
             // İlerleme durumu için (opsiyonel)
             // onUploadProgress: (progressEvent) => {
             //     const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
             //     // progress(percentCompleted); // TinyMCE'nin progress callback'i
             // }
         })
         .then(res => {
             if (res.data && res.data.location) {
                  // Tam URL'yi döndürdüğümüzden emin olalım
                 const imageUrl = res.data.location.startsWith('http') ? res.data.location : API_BASE_URL + res.data.location;
                 resolve(imageUrl);
             } else {
                 reject('Sunucudan geçersiz cevap formatı.');
             }
         })
         .catch(err => {
             console.error('Resim yüklenirken hata:', err);
             const errorMsg = err.response?.data?.message || err.message || 'Resim yüklenemedi.';
             reject(`HTTP Error: ${err.response?.status} - ${errorMsg}`);
         })
         .finally(() => {
             setIsUploading(false);
         });
     }), [token, backendUploadUrl]);

    // Select için hiyerarşik option'ları oluşturan recursive fonksiyon
     const renderTopicOptions = useCallback((nodes, level = 0) => {
         let options = [];
         nodes.forEach(node => {
             options.push(
                 <option key={node.id} value={node.id}>
                     {'\u00A0'.repeat(level * 4) + node.name}
                 </option>
             );
             if (node.children && node.children.length > 0) {
                 options = options.concat(renderTopicOptions(node.children, level + 1));
             }
         });
         return options;
     }, []); // Bağımlılığı yok, bir kere oluşturulması yeterli


    if (loading) return <div className='loading-indicator'><div className='spinner'></div> Konu anlatımları yükleniyor...</div>;

    return (
        <div className="admin-section lecture-management">
            <h3 className='d-flex align-center gap-3'>
                 <FaChalkboardTeacher /> Konu Anlatımı Yönetimi
            </h3>

            {error && (
                <div className="alert alert-danger mb-4" role="alert">
                     <FaExclamationTriangle className='alert-icon' />
                     <div className="alert-content">{error}</div>
                </div>
             )}

             {/* Ders Ekleme/Düzenleme Formu */}
             <form id="lecture-form" onSubmit={handleFormSubmit} className="admin-form-section">
                 <h4>{editingLecture ? `Konu Anlatımı Düzenle (ID: ${editingLecture.id})` : 'Yeni Konu Anlatımı Ekle'}</h4>

                 {formError && <div className="alert alert-warning mb-4">{formError}</div>}
                 {isUploading && (
                      <div className="alert alert-info d-flex align-center gap-2 mb-4">
                           <div className='spinner spinner-sm'></div> Resim yükleniyor...
                      </div>
                  )}

                 <div className="form-group">
                     <label htmlFor="lectureTitle" className='form-label'>Başlık:</label>
                     <input
                         type="text"
                         id="lectureTitle"
                         name="title"
                         className='form-input'
                         value={formState.title}
                         onChange={handleInputChange}
                         required
                     />
                 </div>

                 <div className="form-group">
                     <label htmlFor="lectureContent" className='form-label'>İçerik:</label>
                     {/* TinyMCE Editörü */}
                     <Editor
                         apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                         onInit={(evt, editor) => editorRef.current = editor} // Ref'i ata
                         value={formState.content} // Kontrollü component için value
                         init={{
                             height: 350, // Yükseklik artırıldı
                             menubar: false,
                             plugins: [
                                 'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor',
                                 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount'
                             ],
                             toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | code removeformat | fullscreen preview | help',
                             images_upload_handler: handleImageUpload,
                             automatic_uploads: true,
                             file_picker_types: 'image media', // Medya eklendi
                             relative_urls : false,
                             remove_script_host : false,
                             // content_css: '/tinymce-content.css' // İstersen editör içi için ayrı CSS
                             // content_style: 'body { font-family:var(--font-family-base); font-size:var(--font-size-base); color:var(--text-primary); }' // Veya inline
                             skin: (document.body.classList.contains('dark-mode') ? "oxide-dark" : "oxide"), // Tema uyumu
                             content_css: (document.body.classList.contains('dark-mode') ? "dark" : "default") // Tema uyumu
                         }}
                         onEditorChange={handleEditorChange} // State'i güncelle
                         disabled={isUploading}
                     />
                 </div>

                 <div className="form-group">
                      <label htmlFor="lectureImageUrl" className='form-label'>Görsel URL (Opsiyonel - Editörden eklenmesi önerilir):</label>
                      <input
                          type="text"
                          id="lectureImageUrl"
                          name="imageUrl"
                          className='form-input'
                          value={formState.imageUrl}
                          onChange={handleInputChange}
                          placeholder="https://..."
                      />
                  </div>

                  <div className="form-group">
                      <label htmlFor="lectureTopic" className='form-label'>Ait Olduğu Konu:</label>
                      <select
                          id="lectureTopic"
                          name="topicId"
                          className='form-select'
                          value={formState.topicId}
                          onChange={handleInputChange}
                          required
                          disabled={loading || isUploading} // Konu listesi yüklenirken veya resim yüklerken disable et
                       >
                           <option value="">-- Konu Seçin --</option>
                           {/* Hiyerarşik option'ları render et */}
                           {renderTopicOptions(topicsTree)}
                       </select>
                  </div>

                  <div className='d-flex gap-3 mt-5'>
                      <button type="submit" disabled={isUploading} className='btn btn-primary'>
                           {isUploading ? <><div className='spinner spinner-sm mr-2'></div> Yükleniyor...</> : <><FaSave className='btn-icon'/> {editingLecture ? 'Güncelle' : 'Ekle'}</>}
                      </button>
                      {editingLecture && (
                          <button type="button" onClick={resetForm} disabled={isUploading} className='btn btn-secondary'>
                               <FaTimesCircle className='btn-icon'/>
                               İptal
                          </button>
                      )}
                  </div>
             </form>

              {/* Mevcut Dersler Tablosu */}
              <h4 className='mt-8 mb-4'>Mevcut Konu Anlatımları</h4>
              {lectures.length === 0 && !loading ? (
                   <div className="alert alert-info">
                       <FaInfoCircle className='alert-icon'/>
                       <div className="alert-content">Konu anlatımı bulunamadı.</div>
                   </div>
               ) : (
                   <div className="table-container">
                       <table className="table table-striped table-hover table-dense">
                           <thead>
                               <tr>
                                   <th>ID</th>
                                   <th>Başlık</th>
                                   <th>Konu</th>
                                   <th>Görsel URL</th>
                                   <th className='text-right'>İşlemler</th>
                               </tr>
                           </thead>
                           <tbody>
                               {lectures.map((lecture) => (
                                   <tr key={lecture.id}>
                                       <td>{lecture.id}</td>
                                       <td>{lecture.title}</td>
                                       <td>{lecture.topic?.name || '-'}</td>
                                       <td>
                                            {lecture.imageUrl ? (
                                                 <a href={lecture.imageUrl} target="_blank" rel="noopener noreferrer" className='link-discreet'>
                                                      {lecture.imageUrl.substring(0, 30)}...
                                                 </a>
                                             ) : '-'}
                                         </td>
                                       <td className="action-buttons">
                                           <button onClick={() => handleEdit(lecture)} className="btn btn-secondary btn-sm" title="Düzenle">
                                               <FaUserEdit />
                                           </button>
                                           <button onClick={() => handleDelete(lecture.id, lecture.title)} className="btn btn-danger btn-sm" title="Sil">
                                               <FaTrashAlt />
                                           </button>
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
               )}
        </div>
    );
}

// --- Question Management Component ---
function QuestionManagement({ token }) {
    const [questions, setQuestions] = useState([]);
    const [topicsTree, setTopicsTree] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState(''); // Form Error
    const [editingQuestion, setEditingQuestion] = useState(null);
    const initialFormState = { text: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '', correctAnswer: '', classification: 'Çalışma Sorusu', topicId: '', imageUrl: '' };
    const [formState, setFormState] = useState(initialFormState);
    const [isUploading, setIsUploading] = useState(false);
    const [bulkInput, setBulkInput] = useState('');
    const [bulkError, setBulkError] = useState('');
    const [bulkSuccess, setBulkSuccess] = useState('');
    const [bulkLoading, setBulkLoading] = useState(false);
    const editorRef = useRef(null); // TinyMCE ref

    const backendQuestionUrl = `${API_BASE_URL}/api/questions`;
    const backendTopicUrl = `${API_BASE_URL}/api/topics`;
    const backendUploadUrl = `${API_BASE_URL}/api/upload/image`;

    const fetchData = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [questionsRes, topicsRes] = await Promise.all([
                axios.get(backendQuestionUrl, config),
                axios.get(backendTopicUrl, config)
            ]);
            setQuestions(questionsRes.data || []);
            setTopicsTree(topicsRes.data || []);
        } catch (err) { console.error("Soru/Konu verisi çekerken hata:", err); setError(err.response?.data?.message || 'Sorular veya konular yüklenirken bir hata oluştu.'); setQuestions([]); setTopicsTree([]); }
        finally { setLoading(false); }
    }, [token, backendQuestionUrl, backendTopicUrl]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleInputChange = (e) => { const { name, value } = e.target; setFormState(prev => ({ ...prev, [name]: value })); };
    const handleQuestionEditorChange = (content, editor) => { setFormState(prev => ({ ...prev, text: content })); };

    const handleFormSubmit = async (e) => {
        e.preventDefault(); setFormError('');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        if (!formState.topicId) { setFormError('Lütfen bir konu seçin.'); return; }
        const editorContent = editorRef.current ? editorRef.current.getContent() : formState.text;
         if (!editorContent || editorContent.trim() === '<p><br data-mce-bogus="1"></p>' || editorContent.trim() === '<p><br></p>') { setFormError('Soru Metni zorunludur.'); return; }
         if (!formState.optionA || !formState.optionB || !formState.optionC || !formState.optionD || !formState.optionE || !formState.correctAnswer) { setFormError('Lütfen Seçenekler (A-E) ve Doğru Cevap alanlarını doldurun.'); return; }

        const questionData = {
            text: editorContent,
            optionA: formState.optionA, optionB: formState.optionB, optionC: formState.optionC, optionD: formState.optionD, optionE: formState.optionE,
            correctAnswer: formState.correctAnswer.toUpperCase(), // Büyük harfe çevir
            classification: formState.classification,
            topicId: parseInt(formState.topicId, 10),
            imageUrl: formState.imageUrl.trim() === '' ? null : formState.imageUrl
        };
        try {
             if (editingQuestion) {
                 await axios.put(`${backendQuestionUrl}/${editingQuestion.id}`, questionData, config);
             } else {
                 await axios.post(backendQuestionUrl, questionData, config);
             }
             /* TODO: Use Toast success instead of alert */ alert(editingQuestion ? 'Soru güncellendi!' : 'Soru eklendi!');
             resetForm();
             fetchData(); // Listeyi yenile
        } catch (err) {
             console.error("Soru kaydedilirken hata:", err);
             setFormError(err.response?.data?.message || 'Soru kaydedilirken bir hata oluştu.');
        }
    };

    const handleEdit = (question) => {
         setEditingQuestion(question);
         setFormState({
             text: question.text || '',
             optionA: question.optionA || '', optionB: question.optionB || '', optionC: question.optionC || '', optionD: question.optionD || '', optionE: question.optionE || '',
             correctAnswer: question.correctAnswer || '',
             classification: question.classification || 'Çalışma Sorusu',
             topicId: question.topic?.id ? String(question.topic.id) : '',
             imageUrl: question.imageUrl || ''
         });
         setFormError('');
          // TinyMCE içeriğini güncelle
         if (editorRef.current) {
             editorRef.current.setContent(question.text || '');
         }
         const formElement = document.getElementById('question-form');
        if (formElement) {
             formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
     };

     const handleDelete = async (questionId) => {
         /* TODO: Use Modal instead of confirm */
         if (window.confirm(`Soruyu silmek istediğinizden emin misiniz (ID: ${questionId})? Bu işlem geri alınamaz!`)) {
             setError('');
             try {
                 const config = { headers: { Authorization: `Bearer ${token}` } };
                 await axios.delete(`${backendQuestionUrl}/${questionId}`, config);
                  /* TODO: Use Toast success instead of alert */ alert('Soru başarıyla silindi!');
                 fetchData(); // Listeyi yenile
             } catch (err) { console.error("Soru silinirken hata:", err); setError(err.response?.data?.message || 'Soru silinirken bir hata oluştu.'); }
         }
     };

    const resetForm = () => {
        setEditingQuestion(null);
        setFormState(initialFormState);
        setFormError('');
        if (editorRef.current) {
             editorRef.current.setContent('');
         }
     };

    // Image upload handler (LectureManagement ile aynı)
    const handleImageUpload = useCallback((blobInfo, progress) => new Promise((resolve, reject) => {
        if (!token) { reject('Yetkilendirme tokenı bulunamadı.'); return; }
        setIsUploading(true); const formData = new FormData(); formData.append('file', blobInfo.blob(), blobInfo.filename());
        axios.post(backendUploadUrl, formData, { headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` } })
        .then(res => { if (res.data && res.data.location) { const imageUrl = res.data.location.startsWith('http') ? res.data.location : API_BASE_URL + res.data.location; resolve(imageUrl); } else { reject('Sunucudan geçersiz cevap formatı.'); } })
        .catch(err => { console.error('Resim yüklenirken hata:', err); const errorMsg = err.response?.data?.message || err.message || 'Resim yüklenemedi.'; reject(`HTTP Error: ${err.response?.status} - ${errorMsg}`); })
        .finally(() => { setIsUploading(false); });
    }), [token, backendUploadUrl]);

     // Bulk submit handler
     const handleBulkSubmit = async () => {
         setBulkError(''); setBulkSuccess(''); setBulkLoading(true);
         let questionsArray;
         try {
             questionsArray = JSON.parse(bulkInput);
             if (!Array.isArray(questionsArray)) throw new Error("Veri bir JSON dizisi olmalı.");
         } catch (parseError) { setBulkError(`Geçersiz JSON formatı: ${parseError.message}`); setBulkLoading(false); return; }
         if (questionsArray.length === 0) { setBulkError('Eklenecek soru bulunamadı.'); setBulkLoading(false); return; }

         try {
             const config = { headers: { Authorization: `Bearer ${token}` } };
             const response = await axios.post(`${backendQuestionUrl}/bulk`, questionsArray, config);
              /* TODO: Use Toast success instead of alert */ setBulkSuccess(response.data.message || `${response.data.addedCount || 0} soru başarıyla eklendi.`);
             if (response.data.validationErrors && response.data.validationErrors.length > 0) {
                  /* TODO: Use Toast warning/error instead of alert */ setBulkError(`Bazı sorular eklenemedi: ${response.data.validationErrors.map(e => `[Sıra: ${e.index}] ${e.error}`).join(', ')}`);
             }
             setBulkInput(''); // Başarılı olursa input'u temizle
             fetchData(); // Listeyi yenile
         } catch (err) {
             console.error("Toplu soru eklenirken hata:", err);
              /* TODO: Use Toast error instead of alert */ setBulkError(err.response?.data?.message || 'Toplu soru eklenirken bir hata oluştu.');
             if (err.response?.data?.validationErrors) {
                 setBulkError(prev => `${prev} Hatalar: ${err.response.data.validationErrors.map(e => `[Sıra: ${e.index}] ${e.error}`).join(', ')}`);
             }
         } finally { setBulkLoading(false); }
     };

     // Topic options render (LectureManagement ile aynı)
      const renderTopicOptions = useCallback((nodes, level = 0) => {
          let options = [];
          nodes.forEach(node => {
              options.push( <option key={node.id} value={node.id}> {'\u00A0'.repeat(level * 4) + node.name} </option> );
              if (node.children && node.children.length > 0) { options = options.concat(renderTopicOptions(node.children, level + 1)); }
          });
          return options;
      }, []);

    if (loading) return <div className='loading-indicator'><div className='spinner'></div> Sorular yükleniyor...</div>;

    return (
        <div className="admin-section question-management">
             <h3 className='d-flex align-center gap-3'>
                 <FaQuestionCircle /> Soru Yönetimi
            </h3>

            {error && (
                <div className="alert alert-danger mb-4" role="alert">
                     <FaExclamationTriangle className='alert-icon' />
                     <div className="alert-content">{error}</div>
                </div>
             )}

             {/* Soru Ekleme/Düzenleme Formu */}
            <form id="question-form" onSubmit={handleFormSubmit} className="admin-form-section">
                 <h4>{editingQuestion ? `Soru Düzenle (ID: ${editingQuestion.id})` : 'Yeni Soru Ekle'}</h4>

                 {formError && <div className="alert alert-warning mb-4">{formError}</div>}
                 {isUploading && (
                      <div className="alert alert-info d-flex align-center gap-2 mb-4">
                           <div className='spinner spinner-sm'></div> Resim yükleniyor...
                      </div>
                  )}

                 <div className="form-group">
                      <label className='form-label'>Soru Metni:</label>
                      <Editor
                         apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                         onInit={(evt, editor) => editorRef.current = editor}
                         value={formState.text}
                         init={{
                             height: 250, menubar: false,
                             plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount'],
                             toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | code removeformat | fullscreen preview | help',
                             images_upload_handler: handleImageUpload, automatic_uploads: true, file_picker_types: 'image media',
                             relative_urls: false, remove_script_host: false,
                             skin: (document.body.classList.contains('dark-mode') ? "oxide-dark" : "oxide"),
                             content_css: (document.body.classList.contains('dark-mode') ? "dark" : "default")
                         }}
                         onEditorChange={handleQuestionEditorChange}
                         disabled={isUploading}
                      />
                 </div>

                 {/* Seçenekler için Grid */}
                  <h5>Seçenekler ve Doğru Cevap</h5>
                  <div className="form-grid-columns mb-4">
                      {['A', 'B', 'C', 'D', 'E'].map(opt => (
                          <div className="form-group" key={opt}>
                               <label htmlFor={`option${opt}`} className='form-label'>Seçenek {opt}:</label>
                               <input type="text" id={`option${opt}`} name={`option${opt}`} className='form-input' value={formState[`option${opt}`]} onChange={handleInputChange} required />
                          </div>
                      ))}
                      <div className="form-group">
                          <label htmlFor="correctAnswer" className='form-label'>Doğru Cevap:</label>
                          <select id="correctAnswer" name="correctAnswer" className='form-select' value={formState.correctAnswer} onChange={handleInputChange} required style={{width:'80px'}}>
                              <option value="">Seç</option>
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                              <option value="E">E</option>
                          </select>
                          {/* Eski input alternatifi */}
                          {/* <input type="text" name="correctAnswer" className='form-input' placeholder='A, B..' value={formState.correctAnswer} onChange={handleInputChange} required maxLength="1" style={{ width: '60px', textTransform: 'uppercase' }} /> */}
                      </div>
                  </div>

                  {/* Diğer Alanlar için Grid */}
                   <h5>Diğer Bilgiler</h5>
                   <div className="form-grid-columns">
                       <div className="form-group">
                           <label htmlFor="classification" className='form-label'>Sınıflandırma:</label>
                           <select id="classification" name="classification" className='form-select' value={formState.classification} onChange={handleInputChange}>
                               <option value="Çalışma Sorusu">Çalışma Sorusu</option>
                               <option value="Çıkmış Benzeri">Çıkmış Benzeri</option>
                               {/* Diğer sınıflandırmalar eklenebilir */}
                           </select>
                       </div>
                       <div className="form-group">
                           <label htmlFor="questionTopic" className='form-label'>Konu:</label>
                           <select id="questionTopic" name="topicId" className='form-select' value={formState.topicId} onChange={handleInputChange} required disabled={loading}>
                               <option value="">-- Konu Seçin --</option>
                               {renderTopicOptions(topicsTree)}
                           </select>
                       </div>
                       <div className="form-group">
                           <label htmlFor="questionImageUrl" className='form-label'>Görsel URL (Opsiyonel):</label>
                           <input type="text" id="questionImageUrl" name="imageUrl" className='form-input' value={formState.imageUrl} onChange={handleInputChange} placeholder="https://..."/>
                       </div>
                   </div>

                   <div className='d-flex gap-3 mt-5'>
                       <button type="submit" disabled={isUploading} className='btn btn-primary'>
                             {isUploading ? <><div className='spinner spinner-sm mr-2'></div> Yükleniyor...</> : <><FaSave className='btn-icon'/> {editingQuestion ? 'Güncelle' : 'Ekle'}</>}
                       </button>
                       {editingQuestion && (
                           <button type="button" onClick={resetForm} disabled={isUploading} className='btn btn-secondary'>
                                <FaTimesCircle className='btn-icon'/>
                                İptal
                           </button>
                       )}
                   </div>
            </form>

             {/* Toplu Soru Ekleme */}
             <div className="bulk-add-section">
                 <h4>Toplu Soru Ekle (JSON Formatında)</h4>
                 <p className='form-text mb-3'>Aşağıdaki alana belirtilen JSON formatında soru dizisi yapıştırın. Gerekli alanlar: `text`, `optionA`...`optionE`, `correctAnswer`, `topicId`. Opsiyonel: `classification`, `imageUrl`. </p>
                 <textarea
                     className='form-textarea mb-3'
                     rows="10"
                     placeholder='[{"text": "<p>Soru metni...</p>", "optionA": "A şıkkı", ..., "correctAnswer": "C", "topicId": 123, "classification": "Çalışma Sorusu"}, ...]'
                     value={bulkInput}
                     onChange={(e) => setBulkInput(e.target.value)}
                     disabled={bulkLoading}
                 />
                 {bulkError && <div className="alert alert-danger mb-3">{bulkError}</div>}
                 {bulkSuccess && <div className="alert alert-success mb-3">{bulkSuccess}</div>}
                 <div className='mt-4'>
                     <button onClick={handleBulkSubmit} disabled={bulkLoading || !bulkInput.trim()} className='btn btn-primary'>
                         {bulkLoading ? <><div className='spinner spinner-sm mr-2'></div> Ekleniyor...</> : <><FaUpload className='btn-icon'/> Toplu Soruları Ekle</>}
                     </button>
                 </div>
             </div>

            {/* Mevcut Sorular Tablosu */}
            <h4 className='mt-8 mb-4'>Mevcut Sorular</h4>
            {questions.length === 0 && !loading ? (
                 <div className="alert alert-info">
                     <FaInfoCircle className='alert-icon'/>
                     <div className="alert-content">Soru bulunamadı.</div>
                 </div>
             ) : (
                 <div className="table-container">
                     <table className="table table-striped table-hover table-dense">
                         <thead>
                             <tr>
                                 <th>ID</th>
                                 <th>Metin (Başlangıcı)</th>
                                 <th>Konu</th>
                                 {/* <th>Zorluk</th> difficulty kaldırıldı */}
                                 <th>Sınıf.</th>
                                 <th className='text-right'>İşlemler</th>
                             </tr>
                         </thead>
                         <tbody>
                             {questions.map((q) => (
                                 <tr key={q.id}>
                                     <td>{q.id}</td>
                                     {/* HTML taglarını temizleyip gösterelim */}
                                     <td title={q.text.replace(/<[^>]*>/g, '')}>
                                         {q.text.replace(/<[^>]*>/g, '').substring(0, 60)}...
                                     </td>
                                     <td>{q.topic?.name || '-'}</td>
                                     {/* <td>{q.difficulty || '-'}</td> */}
                                     <td>{q.classification || '-'}</td>
                                     <td className="action-buttons">
                                         <button onClick={() => handleEdit(q)} className='btn btn-secondary btn-sm' title="Düzenle">
                                             <FaUserEdit />
                                         </button>
                                         <button onClick={() => handleDelete(q.id)} className='btn btn-danger btn-sm' title="Sil">
                                             <FaTrashAlt />
                                         </button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             )}
        </div>
    );
}


// --- Ana Admin Sayfası Component'i ---
function AdminPage() {
    const { token } = useAuth();

    // API URL kontrolü
    if (!API_BASE_URL) {
         console.error("VITE_API_URL environment variable is not set!");
         return (
              <div className="container mt-6">
                  <div className="alert alert-danger text-center">
                      Uygulama yapılandırma hatası: API adresi bulunamadı. Lütfen `.env` dosyasını kontrol edin.
                  </div>
              </div>
          );
    }
    // Token kontrolü
    if (!token) {
         return (
              <div className="container mt-6">
                  <div className="alert alert-warning text-center">
                      Bu sayfaya erişim için giriş yapmalısınız.
                  </div>
                  {/* Giriş sayfasına link */}
                   {/* <Link to="/login" className='btn btn-primary d-block w-full max-w-xs mx-auto mt-4'>Giriş Yap</Link> */}
              </div>
          );
    }

    return (
        // Ana container ve sayfa sınıfı
        // paddingTop kaldırıldı, container'a genel padding verilebilir veya iç elementlere margin
        <div className="admin-page-container container py-8"> {/* py-8 eklendi */}
             {/* Sayfa başlığı */}
             <h2 className="text-center mb-8">Yönetim Paneli</h2> {/* mb-8 ve text-center yardımcı sınıfları */}

             {/* İstatistik Özeti */}
             <AdminStatsOverview />

             {/* Yönetim Bölümleri */}
             {/* Araya <hr> yerine admin-section'ın kendi margin'i yeterli */}
             <UserManagement token={token} />
             <TopicManagement token={token} />
             <LectureManagement token={token} />
             <QuestionManagement token={token} />
        </div>
    );
}

export default AdminPage;
