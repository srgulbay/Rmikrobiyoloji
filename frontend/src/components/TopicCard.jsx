import React from 'react';
// İkonları import etmeye devam ediyoruz
import {
    FaMicroscope, FaShieldAlt, FaBacteria, FaVirus, FaFlask,
    FaBug, FaBiohazard, FaFolder, FaChevronRight
} from 'react-icons/fa'; // Veya fa6

// Konu -> İkon Component Eşleştirmesi (Güncel haliyle)
const topicIconMap = {
  "Genel Mikrobiyoloji": FaMicroscope,
  "İmmünoloji": FaShieldAlt,
  "Bakteriyoloji": FaBacteria,
  "Viroloji": FaVirus,
  "Mikoloji": FaFlask, // Veya FaMushroom (fa6)
  "Parazitoloji": FaBug,
  "Enfeksiyon Hastalıkları": FaBiohazard,
  "Laboratuvar Uygulamaları": FaFlask,
  "default": FaFolder
};

// TopicCard Component'i
function TopicCard({ topic, onSelectTopic, className = '' }) {

  const IconComponent = topicIconMap[topic.name] || topicIconMap["default"];
  const hasChildren = topic.children && topic.children.length > 0;

  const handleClick = () => {
    onSelectTopic(topic);
  };

  // Temel sınıflara card-interactive ekleyerek hover efektlerini güçlendirelim
  const combinedClassName = `hierarchy-nav-card card-interactive ${className}`.trim();

  return (
    // button elementi tıklanabilirlik için iyi bir seçim
    <button
      className={combinedClassName}
      onClick={handleClick}
      type="button"
    >
      {/* İkon Alanı - Daha belirgin */}
      <div className="card-icon">
         {/* İkon Component'i */}
         <IconComponent aria-hidden="true" />
         {/* CSS Notu: .card-icon svg { ... } seçicisi ile renk/boyut ayarlanmalı */}
      </div>

      {/* Konu Başlığı - Daha okunaklı */}
      <h3 className="card-title">
        {topic.name}
      </h3>

      {/* Chevron (Alt konu varsa) - Daha belirgin */}
      {hasChildren && (
         <FaChevronRight className="hierarchy-chevron" aria-hidden="true" />
      )}
    </button>
  );
}

export default TopicCard;
