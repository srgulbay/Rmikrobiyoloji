import React, { useState, useEffect, useCallback, useRef, Fragment } from 'react'; // Fragment eklendi
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Editor } from '@tinymce/tinymce-react';
import DOMPurify from 'dompurify';
import AdminStatsOverview from '../components/AdminStatsOverview';

// --- UserManagement Component'i ---
function UserManagement({ token }) {
    const [users, setUsers] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const { user: adminUser } = useAuth(); const backendUserUrl = 'http://localhost:3001/api/users'; const backendStatsUrl = 'http://localhost:3001/api/stats/admin/user';
    const fetchUsers = useCallback(async () => { setLoading(true); setError(''); if (!token) { setError("Yetkilendirme token'ı bulunamadı."); setLoading(false); return; } try { const config = { headers: { Authorization: `Bearer ${token}` } }; const response = await axios.get(backendUserUrl, config); setUsers(response.data); } catch (err) { console.error("Kullanıcıları çekerken hata:", err); setError(err.response?.data?.message || 'Kullanıcılar yüklenirken bir hata oluştu.'); setUsers([]); } finally { setLoading(false); } }, [token, backendUserUrl]);
    useEffect(() => { fetchUsers(); }, [fetchUsers]);
    const handleRoleChange = async (userId, newRole) => { if (!newRole) { alert('Lütfen bir rol seçin.'); return; } if (userId === adminUser?.id) { alert("Kendi rolünüzü buradan değiştiremezsiniz."); fetchUsers(); return; } if (!window.confirm(`Kullanıcı ID <span class="math-inline">\{userId\} için rolü "</span>{newRole}" olarak değiştirmek istediğinize emin misiniz?`)) { return; } setError(''); try { const config = { headers: { Authorization: `Bearer ${token}` } }; const updateUrl = backendUserUrl + '/' + userId + '/role'; await axios.put(updateUrl, { role: newRole }, config); alert('Rol başarıyla güncellendi!'); fetchUsers(); } catch (err) { console.error("Rol güncellenirken hata:", err); setError(err.response?.data?.message || 'Rol güncellenirken bir hata oluştu.'); } };
    const handleDeleteUser = async (userId, username) => { if (userId === adminUser?.id) { alert("Kendinizi silemezsiniz!"); return; } if (window.confirm(`Kullanıcıyı silmek istediğinizden emin misiniz: ${username} (ID: ${userId})`)) { setError(''); try { const config = { headers: { Authorization: `Bearer ${token}` } }; const deleteUrl = backendUserUrl + '/' + userId; await axios.delete(deleteUrl, config); alert(`Kullanıcı (${username}) başarıyla silindi!`); fetchUsers(); } catch (err) { console.error("Kullanıcı silinirken hata:", err); setError(err.response?.data?.message || 'Kullanıcı silinirken bir hata oluştu.'); } } };
    const handleViewUserStats = async (userId, username) => { setError(''); alert(`Kullanıcı ${username} (ID: ${userId}) için istatistikler getiriliyor...`); try { const config = { headers: { Authorization: `Bearer ${token}` } }; const statsUrl = backendStatsUrl + '/' + userId + '/detailed'; const response = await axios.get(statsUrl, config); console.log('API Response Data:', response.data); let statsText = `--- ${username} İstatistikleri ---\n\n`; if (Array.isArray(response.data) && response.data.length > 0) { response.data.forEach(stat => { statsText += `Konu: ${stat.topicName}\n`; statsText += `Toplam Deneme: ${stat.totalAttempts}\n`; statsText += `Doğru Sayısı: ${stat.correctAttempts}\n`; statsText += `Başarı Oranı: %${stat.accuracy}\n`; statsText += `--------------------------\n`; }); } else { statsText += "Bu kullanıcı için henüz istatistik verisi bulunamadı veya veri formatı beklenenden farklı."; console.log("Beklenen dizi formatı alınamadı."); } alert(statsText); } catch (err) { console.error(`Kullanıcı ${userId} istatistikleri getirilirken hata:`, err); if(err.response) { console.error("Axios Hata Detayı (data):", err.response.data); console.error("Axios Hata Detayı (status):", err.response.status); } else if (err.request) { console.error("Axios Hata Detayı (request):", err.request); } else { console.error('Axios Hata Detayı (config/other):', err.message); } alert(`Hata: ${err.response?.data?.message || 'İstatistikler getirilemedi.'}`); setError(`Kullanıcı ${userId} istatistikleri getirilemedi.`); } };
    if (loading) return <p>Kullanıcılar yükleniyor...</p>;
    return ( <div><h3>Kullanıcılar</h3> {error && <p style={{ color: 'red' }}>Hata: {error}</p>} {users.length === 0 && !loading ? (<p>Kullanıcı bulunamadı.</p>) : (<table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}><thead><tr><th>ID</th><th>Kullanıcı Adı</th><th>Rol</th><th>Uzmanlık</th><th>Kayıt Tarihi</th><th>İşlemler</th></tr></thead><tbody>{users.map((user) => (<tr key={user.id}><td>{user.id}</td><td>{user.username}</td><td>{user.role}</td><td>{user.specialization || '-'}</td><td>{new Date(user.createdAt).toLocaleDateString()}</td><td><select defaultValue={user.role} id={`role-select-${user.id}`} style={{ marginRight: '5px' }} disabled={user.id === adminUser?.id}><option value="user">user</option><option value="admin">admin</option></select><button style={{ marginRight: '5px' }} disabled={user.id === adminUser?.id} onClick={() => { const el = document.getElementById(`role-select-${user.id}`); if(el) handleRoleChange(user.id, el.value); }}>Rolü Güncelle</button><button style={{ marginRight: '5px', backgroundColor: 'lightblue' }} onClick={() => handleViewUserStats(user.id, user.username)}>İstatistikler</button><button style={{backgroundColor: 'red', color: 'white'}} disabled={user.id === adminUser?.id} onClick={() => handleDeleteUser(user.id, user.username)}>Sil</button></td></tr>))}</tbody></table>)}</div> );
}

// --- Konu Yönetimi (Hiyerarşik Gösterimli) ---
function TopicManagement({ token }) {
    const [topics, setTopics] = useState([]); const [allTopicsFlat, setAllTopicsFlat] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [editingTopic, setEditingTopic] = useState(null); const [formState, setFormState] = useState({ name: '', description: '', parentId: '' }); const backendUrl = 'http://localhost:3001/api/topics';
    const flattenTopics = (topicNodes, flatList = []) => { for (const node of topicNodes) { flatList.push({ id: node.id, name: node.name }); if (node.children && node.children.length > 0) { flattenTopics(node.children, flatList); } } return flatList; };
    const fetchTopics = useCallback(async () => { setLoading(true); setError(''); try { const config = { headers: { Authorization: `Bearer ${token}` } }; const response = await axios.get(backendUrl, config); setTopics(response.data); setAllTopicsFlat(flattenTopics(response.data)); } catch (err) { console.error("Konuları çekerken hata:", err); setError(err.response?.data?.message || 'Konular yüklenirken bir hata oluştu.'); setTopics([]); setAllTopicsFlat([]); } finally { setLoading(false); } }, [token, backendUrl]);
    useEffect(() => { fetchTopics(); }, [fetchTopics]);
    const handleInputChange = (e) => { const { name, value } = e.target; setFormState(prev => ({ ...prev, [name]: value })); };
    const handleFormSubmit = async (e) => { e.preventDefault(); setError(''); const config = { headers: { Authorization: `Bearer ${token}` } }; const topicData = { name: formState.name, description: formState.description, parentId: formState.parentId === '' ? null : parseInt(formState.parentId, 10) }; try { if (editingTopic) { const updateUrl = backendUrl + '/' + editingTopic.id; await axios.put(updateUrl, topicData, config); alert('Konu başarıyla güncellendi!'); } else { await axios.post(backendUrl, topicData, config); alert('Konu başarıyla eklendi!'); } resetForm(); fetchTopics(); } catch (err) { console.error("Konu kaydedilirken hata:", err); setError(err.response?.data?.message || 'Konu kaydedilirken bir hata oluştu.'); } };
    const handleEdit = (topic) => { const { children, ...topicDataToEdit } = topic; setEditingTopic(topicDataToEdit); setFormState({ name: topicDataToEdit.name, description: topicDataToEdit.description || '', parentId: topicDataToEdit.parentId === null ? '' : String(topicDataToEdit.parentId) }); const formElement = document.getElementById('topic-form'); if (formElement) formElement.scrollIntoView({ behavior: 'smooth' }); };
    const handleDelete = async (topicId, topicName) => { if (window.confirm(`Konuyu ve altındaki TÜM alt konuları silmek istediğinizden emin misiniz: ${topicName} (ID: ${topicId})? Bu işlem ilişkili soruları ve konu anlatımlarını da etkileyebilir/silebilir!`)) { setError(''); try { const config = { headers: { Authorization: `Bearer ${token}` } }; const deleteUrl = backendUrl + '/' + topicId; await axios.delete(deleteUrl, config); alert('Konu başarıyla silindi!'); fetchTopics(); } catch (err) { console.error("Konu silinirken hata:", err); setError(err.response?.data?.message || 'Konu silinirken bir hata oluştu.'); } } };
    const resetForm = () => { setEditingTopic(null); setFormState({ name: '', description: '', parentId: '' }); };
    const TopicNode = ({ topic, level = 0 }) => ( <Fragment key={topic.id}><div style={{ marginLeft: `${level * 25}px`, padding: '8px 5px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: level > 0 ? `rgba(0,0,0,${level * 0.03})` : 'inherit' }}><span> [{topic.id}] {topic.name} {topic.description ? `- ${topic.description.substring(0,50)}...` : ''} (Parent: {topic.parentId ?? 'Yok'})</span><span> <button style={{ marginRight: '5px', fontSize: '0.8em', padding: '2px 5px' }} onClick={() => handleEdit(topic)}>Düzenle</button> <button style={{ backgroundColor: 'red', color: 'white', fontSize: '0.8em', padding: '2px 5px' }} onClick={() => handleDelete(topic.id, topic.name)}>Sil</button> </span></div>{topic.children && topic.children.length > 0 && ( topic.children.map(child => ( <TopicNode topic={child} level={level + 1} /> )) )}</Fragment> );
    if (loading) return <p>Konular yükleniyor...</p>;
    return ( <div><h3>Konu Yönetimi</h3><form id="topic-form" onSubmit={handleFormSubmit} style={{ marginBottom: '20px', padding: '15px', border: '1px solid lightblue' }}><h4>{editingTopic ? `Konu Düzenle (ID: ${editingTopic.id})` : 'Yeni Konu Ekle'}</h4>{error && <p style={{ color: 'red' }}>Hata: {error}</p>}<div><label>Konu Adı: </label><input type="text" name="name" value={formState.name} onChange={handleInputChange} required /></div><div style={{ marginTop: '10px' }}><label>Açıklama: </label><textarea name="description" value={formState.description} onChange={handleInputChange} rows="3" style={{ width: '90%' }} /></div><div style={{ marginTop: '10px' }}> <label>Üst Konu: </label> <select name="parentId" value={formState.parentId} onChange={handleInputChange}><option value="">-- Ana Kategori --</option>{allTopicsFlat.map(topic => ( !(editingTopic && topic.id === editingTopic.id) && <option key={topic.id} value={topic.id}>{topic.name} (ID: {topic.id})</option> ))}</select> </div><div style={{ marginTop: '15px' }}><button type="submit">{editingTopic ? 'Güncelle' : 'Ekle'}</button>{editingTopic && <button type="button" onClick={resetForm} style={{ marginLeft: '10px' }}>İptal</button>}</div></form><h4>Mevcut Konular (Hiyerarşik)</h4>{topics.length === 0 && !loading ? (<p>Konu bulunamadı.</p>) : ( <div style={{border: '1px solid #ccc', padding: '0', marginBottom: '20px'}}>{topics.map(rootTopic => ( <TopicNode key={rootTopic.id} topic={rootTopic} level={0} /> ))}</div> )}</div> );
}

// --- LectureManagement ---
function LectureManagement({ token }) {
    const [lectures, setLectures] = useState([]);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingLecture, setEditingLecture] = useState(null);
    const [formState, setFormState] = useState({
      title: '',
      content: '',
      topicId: '',
      imageUrl: '',
      newTopicName: ''
    });
    const [isUploading, setIsUploading] = useState(false);
    const backendLectureUrl = 'http://localhost:3001/api/lectures';
    const backendTopicUrl = 'http://localhost:3001/api/topics';
    const backendUploadUrl = 'http://localhost:3001/api/upload/image';
  
    const fetchData = useCallback(async () => {
      setLoading(true);
      setError('');
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [lecturesRes, topicsRes] = await Promise.all([
          axios.get(backendLectureUrl, config),
          axios.get(backendTopicUrl, config)
        ]);
        setLectures(lecturesRes.data);
        setTopics(topicsRes.data);
      } catch (err) {
        console.error("Veri çekerken hata:", err);
        setError(err.response?.data?.message || 'Konu anlatımları veya konular yüklenirken bir hata oluştu.');
        setLectures([]);
        setTopics([]);
      } finally {
        setLoading(false);
      }
    }, [token, backendLectureUrl, backendTopicUrl]);
  
    useEffect(() => { fetchData(); }, [fetchData]);
  
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormState(prev => ({ ...prev, [name]: value }));
    };
  
    const handleEditorChange = (content, editor) => {
      setFormState(prev => ({ ...prev, content: content }));
    };
  
    const handleFormSubmit = async (e) => {
      e.preventDefault();
      setError('');
      const config = { headers: { Authorization: `Bearer ${token}` } };
  
      let finalTopicId = formState.topicId;
  
      try {
        // Eğer yukarıdan konu seçilmemişse ve yeni konu adı girilmişse:
        if (!finalTopicId && formState.newTopicName.trim() !== '') {
          const topicRes = await axios.post(backendTopicUrl, {
            name: formState.newTopicName.trim(),
            description: '',
            parentId: null
          }, config);
          finalTopicId = topicRes.data.id;
        }
  
        if (!finalTopicId) {
          setError('Lütfen bir konu seçin ya da yeni bir konu adı girin.');
          return;
        }
  
        if (!formState.title || !formState.content || formState.content === '<p><br></p>') {
          setError('Başlık ve içerik zorunludur.');
          return;
        }
  
        const lectureData = {
          title: formState.title,
          content: formState.content,
          topicId: parseInt(finalTopicId),
          imageUrl: formState.imageUrl.trim() === '' ? null : formState.imageUrl
        };
  
        if (editingLecture) {
          const updateUrl = backendLectureUrl + '/' + editingLecture.id;
          await axios.put(updateUrl, lectureData, config);
          alert('Konu anlatımı başarıyla güncellendi!');
        } else {
          await axios.post(backendLectureUrl, lectureData, config);
          alert('Konu anlatımı başarıyla eklendi!');
        }
  
        resetForm();
        fetchData();
      } catch (err) {
        console.error("Kayıt sırasında hata:", err);
        setError(err.response?.data?.message || 'İşlem sırasında bir hata oluştu.');
      }
    };
  
    const handleEdit = (lecture) => {
      setEditingLecture(lecture);
      setFormState({
        title: lecture.title,
        content: lecture.content || '',
        topicId: lecture.topic?.id ? String(lecture.topic.id) : '',
        imageUrl: lecture.imageUrl || '',
        newTopicName: ''
      });
      window.scrollTo(0, document.body.scrollHeight - 300);
    };
  
    const handleDelete = async (lectureId, lectureTitle) => {
      if (window.confirm(`Konu anlatımını silmek istediğinizden emin misiniz: ${lectureTitle} (ID: ${lectureId})?`)) {
        setError('');
        try {
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const deleteUrl = backendLectureUrl + '/' + lectureId;
          await axios.delete(deleteUrl, config);
          alert('Konu anlatımı başarıyla silindi!');
          fetchData();
        } catch (err) {
          console.error("Konu anlatımı silinirken hata:", err);
          setError(err.response?.data?.message || 'Konu anlatımı silinirken bir hata oluştu.');
        }
      }
    };
  
    const resetForm = () => {
      setEditingLecture(null);
      setFormState({
        title: '',
        content: '',
        topicId: '',
        imageUrl: '',
        newTopicName: ''
      });
    };
  
    const handleImageUpload = (blobInfo, progress) => new Promise((resolve, reject) => {
      if (!token) {
        reject('Yetkilendirme tokenı bulunamadı.');
        return;
      }
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', blobInfo.blob(), blobInfo.filename());
      axios.post(backendUploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      }).then(res => {
        if (res.data && res.data.location) {
          resolve(res.data.location);
        } else {
          reject('Sunucudan geçersiz cevap formatı.');
        }
      }).catch(err => {
        console.error('Resim yüklenirken hata:', err);
        const errorMsg = err.response?.data?.message || err.message || 'Resim yüklenemedi.';
        reject(`HTTP Error: ${err.response?.status} - ${errorMsg}`);
      }).finally(() => {
        setIsUploading(false);
      });
    });
  
    if (loading) return <p>Konu anlatımları ve konular yükleniyor...</p>;
  
    return (
      <div>
        <h3>Konu Anlatımı Yönetimi</h3>
        <form onSubmit={handleFormSubmit} style={{ marginBottom: '20px', padding: '15px', border: '1px solid lightgreen' }}>
          <h4>{editingLecture ? `Konu Anlatımı Düzenle (ID: ${editingLecture.id})` : 'Yeni Konu Anlatımı Ekle'}</h4>
          {error && <p style={{ color: 'red' }}>Hata: {error}</p>}
          {isUploading && <p style={{ color: 'blue' }}>Resim yükleniyor...</p>}
          <div>
            <label>Başlık: </label>
            <input type="text" name="title" value={formState.title} onChange={handleInputChange} required />
          </div>
          <div style={{ marginTop: '10px' }}>
            <label>İçerik: </label>
            <Editor
              apiKey='llzergax4t1g57vzrb0lqif2fogx3o5lv0l6y68h3lh88b2j'
              value={formState.content}
              init={{
                height: 300,
                menubar: false,
                plugins: [ 'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount' ],
                toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image code | removeformat | help',
                images_upload_handler: handleImageUpload,
                automatic_uploads: true,
                file_picker_types: 'image',
              }}
              onEditorChange={handleEditorChange}
            />
          </div>
          <div style={{ marginTop: '10px' }}>
            <label>Görsel URL (Doğrudan Yapıştırma): </label>
            <input type="text" name="imageUrl" value={formState.imageUrl} onChange={handleInputChange} style={{ width: '90%' }} />
          </div>
          <div style={{ marginTop: '10px' }}>
            <label>Ait Olduğu Konu: </label>
            <select name="topicId" value={formState.topicId} onChange={handleInputChange}>
              <option value="">-- Konu Seçin --</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.id}>{topic.name} (ID: {topic.id})</option>
              ))}
            </select>
          </div>
          <div style={{ marginTop: '10px' }}>
            <label>Yeni Konu Adı (Eğer yukarıdan konu seçilmediyse):</label>
            <input
              type="text"
              name="newTopicName"
              value={formState.newTopicName}
              onChange={handleInputChange}
              placeholder="Yeni konu adı girin"
            />
          </div>
          <div style={{ marginTop: '15px' }}>
            <button type="submit" disabled={isUploading}>{editingLecture ? 'Güncelle' : 'Ekle'}</button>
            {editingLecture && (
              <button type="button" onClick={resetForm} style={{ marginLeft: '10px' }} disabled={isUploading}>
                İptal
              </button>
            )}
          </div>
        </form>
  
        {lectures.length === 0 && !loading ? (
          <p>Konu anlatımı bulunamadı.</p>
        ) : (
          <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Başlık</th>
                <th>Konu</th>
                <th>Görsel URL</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {lectures.map((lecture) => (
                <tr key={lecture.id}>
                  <td>{lecture.id}</td>
                  <td>{lecture.title}</td>
                  <td>{lecture.topic?.name || '-'}</td>
                  <td>{lecture.imageUrl || '-'}</td>
                  <td>
                    <button style={{ marginRight: '5px' }} onClick={() => handleEdit(lecture)}>Düzenle</button>
                    <button style={{ backgroundColor: 'red', color: 'white' }} onClick={() => handleDelete(lecture.id, lecture.title)}>Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

// --- QuestionManagement ---
function QuestionManagement({ token }) {
    const [questions, setQuestions] = useState([]); const [topics, setTopics] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [editingQuestion, setEditingQuestion] = useState(null); const initialFormState = { text: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '', correctAnswer: '', classification: 'Çalışma Sorusu', topicId: '', imageUrl: '' }; const [formState, setFormState] = useState(initialFormState); const [isUploading, setIsUploading] = useState(false); const [bulkInput, setBulkInput] = useState(''); const [bulkError, setBulkError] = useState(''); const [bulkSuccess, setBulkSuccess] = useState(''); const [bulkLoading, setBulkLoading] = useState(false); const backendQuestionUrl = 'http://localhost:3001/api/questions'; const backendTopicUrl = 'http://localhost:3001/api/topics'; const backendUploadUrl = 'http://localhost:3001/api/upload/image';
    const fetchData = useCallback(async () => { setLoading(true); setError(''); try { const config = { headers: { Authorization: `Bearer ${token}` } }; const [questionsRes, topicsRes] = await Promise.all([ axios.get(backendQuestionUrl, config), axios.get(backendTopicUrl, config) ]); setQuestions(questionsRes.data); setTopics(topicsRes.data); } catch (err) { console.error("Soru/Konu verisi çekerken hata:", err); setError(err.response?.data?.message || 'Sorular veya konular yüklenirken bir hata oluştu.'); setQuestions([]); setTopics([]); } finally { setLoading(false); } }, [token, backendQuestionUrl, backendTopicUrl]);
    useEffect(() => { fetchData(); }, [fetchData]);
    const handleInputChange = (e) => { const { name, value } = e.target; setFormState(prev => ({ ...prev, [name]: value })); }; const handleQuestionEditorChange = (content, editor) => { setFormState(prev => ({ ...prev, text: content })); };
    const handleFormSubmit = async (e) => { e.preventDefault(); setError(''); const config = { headers: { Authorization: `Bearer ${token}` } }; if (!formState.topicId) { setError('Lütfen bir konu seçin.'); return; } if (!formState.text || formState.text === '<p><br></p>') { setError('Soru Metni zorunludur.'); return; } if (!formState.optionA || !formState.optionB || !formState.optionC || !formState.optionD || !formState.optionE || !formState.correctAnswer) { setError('Lütfen Seçenekler (A-E) ve Doğru Cevap alanlarını doldurun.'); return; } const {difficulty, ...questionDataToSend} = formState; questionDataToSend.topicId = parseInt(formState.topicId, 10); questionDataToSend.imageUrl = formState.imageUrl.trim() === '' ? null : formState.imageUrl; try { if (editingQuestion) { const updateUrl = backendQuestionUrl + '/' + editingQuestion.id; await axios.put(updateUrl, questionDataToSend, config); alert('Soru başarıyla güncellendi!'); } else { await axios.post(backendQuestionUrl, questionDataToSend, config); alert('Soru başarıyla eklendi!'); } resetForm(); fetchData(); } catch (err) { console.error("Soru kaydedilirken hata:", err); setError(err.response?.data?.message || 'Soru kaydedilirken bir hata oluştu.'); } };
    const handleEdit = (question) => { setEditingQuestion(question); setFormState({ text: question.text || '', optionA: question.optionA || '', optionB: question.optionB || '', optionC: question.optionC || '', optionD: question.optionD || '', optionE: question.optionE || '', correctAnswer: question.correctAnswer || '', classification: question.classification || 'Çalışma Sorusu', topicId: question.topic?.id ? String(question.topic.id) : '', imageUrl: question.imageUrl || '' }); window.scrollTo(0, 0); };
    const handleDelete = async (questionId) => { if (window.confirm(`Soruyu silmek istediğinizden emin misiniz (ID: ${questionId})?`)) { setError(''); try { const config = { headers: { Authorization: `Bearer ${token}` } }; const deleteUrl = backendQuestionUrl + '/' + questionId; await axios.delete(deleteUrl, config); alert('Soru başarıyla silindi!'); fetchData(); } catch (err) { console.error("Soru silinirken hata:", err); setError(err.response?.data?.message || 'Soru silinirken bir hata oluştu.'); } } };
    const resetForm = () => { setEditingQuestion(null); setFormState(initialFormState); };
    const handleImageUpload = (blobInfo, progress) => new Promise((resolve, reject) => { if (!token) { reject('Yetkilendirme tokenı bulunamadı.'); return; } setIsUploading(true); const formData = new FormData(); formData.append('file', blobInfo.blob(), blobInfo.filename()); axios.post(backendUploadUrl, formData, { headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` } }).then(res => { if (res.data && res.data.location) { resolve(res.data.location); } else { reject('Sunucudan geçersiz cevap formatı.'); } }).catch(err => { console.error('Resim yüklenirken hata:', err); const errorMsg = err.response?.data?.message || err.message || 'Resim yüklenemedi.'; reject(`HTTP Error: ${err.response?.status} - ${errorMsg}`); }).finally(() => { setIsUploading(false); }); });
    const handleBulkSubmit = async () => { setBulkError(''); setBulkSuccess(''); setBulkLoading(true); let questionsArray; try { questionsArray = JSON.parse(bulkInput); if (!Array.isArray(questionsArray)) { throw new Error("Veri bir JSON dizisi olmalı."); } } catch (parseError) { setBulkError(`Geçersiz JSON formatı: ${parseError.message}`); setBulkLoading(false); return; } if (questionsArray.length === 0) { setBulkError('Eklenecek soru bulunamadı.'); setBulkLoading(false); return; } try { const config = { headers: { Authorization: `Bearer ${token}` } }; const response = await axios.post(`${backendQuestionUrl}/bulk`, questionsArray, config); setBulkSuccess(response.data.message || `${response.data.addedCount || 0} soru eklendi.`); if (response.data.validationErrors && response.data.validationErrors.length > 0) { setBulkError(`Bazı sorular eklenemedi: ${response.data.validationErrors.join(', ')}`); } setBulkInput(''); fetchData(); } catch (err) { console.error("Toplu soru eklenirken hata:", err); setBulkError(err.response?.data?.message || 'Toplu soru eklenirken bir hata oluştu.'); if (err.response?.data?.validationErrors) { setBulkError(prev => `${prev} Hatalar: ${err.response.data.validationErrors.join(', ')}`); } } finally { setBulkLoading(false); } };
    if (loading) return <p>Sorular ve konular yükleniyor...</p>;
    return ( <div><h3>Soru Yönetimi</h3><form onSubmit={handleFormSubmit} style={{ marginBottom: '20px', padding: '15px', border: '1px solid orange' }}><h4>{editingQuestion ? `Soru Düzenle (ID: ${editingQuestion.id})` : 'Yeni Soru Ekle'}</h4>{error && <p style={{ color: 'red' }}>Hata: {error}</p>}{isUploading && <p style={{ color: 'blue' }}>Resim yükleniyor...</p>}<div style={{ marginTop: '10px' }}><label>Soru Metni:</label><br/><Editor apiKey='llzergax4t1g57vzrb0lqif2fogx3o5lv0l6y68h3lh88b2j' value={formState.text} init={{ height: 250, menubar: false, plugins: [ 'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount' ], toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image code | removeformat | help', images_upload_handler: handleImageUpload, automatic_uploads: true, file_picker_types: 'image' }} onEditorChange={handleQuestionEditorChange} /></div><div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '10px'}}><div><label>Seçenek A:</label><input type="text" name="optionA" value={formState.optionA} onChange={handleInputChange} required /></div><div><label>Seçenek B:</label><input type="text" name="optionB" value={formState.optionB} onChange={handleInputChange} required /></div><div><label>Seçenek C:</label><input type="text" name="optionC" value={formState.optionC} onChange={handleInputChange} required /></div><div><label>Seçenek D:</label><input type="text" name="optionD" value={formState.optionD} onChange={handleInputChange} required /></div><div><label>Seçenek E:</label><input type="text" name="optionE" value={formState.optionE} onChange={handleInputChange} required /></div><div><label>Doğru Cevap:</label><input type="text" name="correctAnswer" placeholder='A, B..' value={formState.correctAnswer} onChange={handleInputChange} required maxLength="1" style={{ width: '50px' }} /></div></div><div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '10px'}}><div><label>Sınıflandırma:</label><select name="classification" value={formState.classification} onChange={handleInputChange}><option value="Çalışma Sorusu">Çalışma Sorusu</option><option value="Çıkmış Benzeri">Çıkmış Benzeri</option></select></div><div><label>Konu:</label><select name="topicId" value={formState.topicId} onChange={handleInputChange} required><option value="">-- Konu Seçin --</option>{topics.map(topic => (<option key={topic.id} value={topic.id}>{topic.name} (ID: {topic.id})</option>))}</select></div><div><label>Görsel URL (Opsiyonel):</label><input type="text" name="imageUrl" value={formState.imageUrl} onChange={handleInputChange} style={{width:'90%'}}/></div></div><div style={{ marginTop: '15px' }}> <button type="submit" disabled={isUploading}>{editingQuestion ? 'Güncelle' : 'Ekle'}</button> {editingQuestion && <button type="button" onClick={resetForm} style={{ marginLeft: '10px' }} disabled={isUploading}>İptal</button>} </div></form><div style={{ marginBottom: '20px', padding: '15px', border: '1px solid purple' }}><h4>Toplu Soru Ekle (JSON Formatında)</h4><p><small>Aşağıdaki alana belirtilen JSON formatında soru dizisi yapıştırın. Zorunlu alanlar: text, optionA-E, correctAnswer, topicId. Opsiyonel: classification, imageUrl, difficulty (otomatik 'medium' atanır).</small></p><textarea rows="10" style={{ width: '95%', fontFamily: 'monospace' }} placeholder='[{"text": "<p>Soru 1?</p>", "optionA":"A", ... "topicId": 1}]' value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} />{bulkError && <p style={{ color: 'red' }}>Toplu Ekleme Hatası: {bulkError}</p>}{bulkSuccess && <p style={{ color: 'green' }}>{bulkSuccess}</p>}<div style={{ marginTop: '10px' }}> <button onClick={handleBulkSubmit} disabled={bulkLoading}> {bulkLoading ? 'Ekleniyor...' : 'Toplu Soruları Ekle'} </button> </div></div>{questions.length === 0 && !loading ? (<p>Soru bulunamadı.</p>) : ( <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th>ID</th><th>Metin (Başlangıcı)</th><th>Konu</th><th>Zorluk</th><th>Sınıf.</th><th>İşlemler</th></tr></thead><tbody>{questions.map((q) => ( <tr key={q.id}><td>{q.id}</td><td title={q.text.replace(/<[^>]*>/g, '')}>{q.text.replace(/<[^>]*>/g, '').substring(0, 50)}...</td><td>{q.topic?.name || '-'}</td><td>{q.difficulty}</td><td>{q.classification}</td><td><button style={{ marginRight: '5px' }} onClick={() => handleEdit(q)}>Düzenle</button><button style={{ backgroundColor: 'red', color: 'white' }} onClick={() => handleDelete(q.id)}>Sil</button></td></tr> ))}</tbody></table> )}</div> );
}

// Ana Admin Sayfası Component'i
function AdminPage() {
  const { token } = useAuth();
  if (!token) { return <p>Erişim için giriş yapmalısınız.</p>; }
  return (
      <div>
          <h2>Yönetim Paneli</h2>
          <AdminStatsOverview />
          <hr style={{ margin: '30px 0' }}/>
          <UserManagement token={token} />
          <hr style={{ margin: '30px 0' }}/>
          <TopicManagement token={token} />
          <hr style={{ margin: '30px 0' }}/>
          <LectureManagement token={token} />
          <hr style={{ margin: '30px 0' }}/>
          <QuestionManagement token={token} />
      </div>
  );
}

export default AdminPage;