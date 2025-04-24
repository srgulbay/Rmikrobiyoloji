import React, { Fragment } from 'react';

// Recursive Konu Düğümü
function TopicNode({ topic, onTopicSelect, selectedTopicId, level = 0 }) {
  const isSelected = topic.id === selectedTopicId;

  const handleSelect = (e) => {
    e.stopPropagation();
    // Eğer zaten seçili ise seçimi kaldır (null yap), değilse seç
    onTopicSelect(isSelected ? null : topic.id);
  };

  return (
    <Fragment key={topic.id}>
      <div
        onClick={handleSelect}
        style={{
          marginLeft: `${level * 15}px`, // Girinti
          padding: '6px 8px',
          cursor: 'pointer',
          fontWeight: isSelected ? 'bold' : 'normal',
          backgroundColor: isSelected ? '#d0d0d0' : 'transparent',
          borderBottom: '1px solid #f0f0f0',
          userSelect: 'none' // Metin seçilmesini engelle
        }}
        title={topic.description || topic.name} // Açıklama varsa göster
      >
        {topic.name}
      </div>
      {/* Alt konular varsa onları da render et */}
      {topic.children && topic.children.length > 0 && (
        <div style={{ marginLeft: '5px', borderLeft: '1px solid #e0e0e0' }}>
          {topic.children.map(child => (
            <TopicNode
              key={child.id}
              topic={child}
              onTopicSelect={onTopicSelect}
              selectedTopicId={selectedTopicId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </Fragment>
  );
}

// Ana Navigasyon Component'i
function TopicTreeNav({ topics, onTopicSelect, selectedTopicId }) {
  if (!topics || topics.length === 0) {
    return <p>Konu bulunamadı.</p>;
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', height: '80vh', overflowY: 'auto' }}>
      <h4>Konular</h4>
      {/* Tümünü Göster Seçeneği */}
      <div
         onClick={() => onTopicSelect(null)} // null ID göndererek tümünü seç
         style={{ padding: '6px 8px', cursor: 'pointer', fontWeight: selectedTopicId === null ? 'bold' : 'normal', backgroundColor: selectedTopicId === null ? '#d0d0d0' : 'transparent', borderBottom: '1px solid #ccc', marginBottom: '5px' }}
      >
        Tüm Konular
      </div>
      {/* Ağacın köklerini render et */}
      {topics.map(rootTopic => (
        <TopicNode
          key={rootTopic.id}
          topic={rootTopic}
          onTopicSelect={onTopicSelect}
          selectedTopicId={selectedTopicId}
          level={0}
        />
      ))}
    </div>
  );
}

export default TopicTreeNav;