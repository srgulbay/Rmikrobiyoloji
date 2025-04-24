import React from 'react';

function TopicCard({ topic, onSelectTopic, isSelected }) {
  const hierarchyIconMap = { "Genel Mikrobiyoloji": "fas fa-microscope", "İmmünoloji": "fas fa-shield-alt", "Bakteriyoloji": "fas fa-bacteria", "Viroloji": "fas fa-virus", "Mikoloji": "fas fa-mushroom", "Parazitoloji": "fas fa-bug", "Enfeksiyon Hastalıkları": "fas fa-biohazard", "Laboratuvar Uygulamaları": "fas fa-flask-vial", "default": "fas fa-folder" }; // Alt konu için farklı ikon?
  const iconClass = hierarchyIconMap[topic.name] || hierarchyIconMap["default"];

  // Tıklanınca tüm topic objesini gönder
  const handleClick = () => { onSelectTopic(topic); };

  const cardStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: 'var(--space-m)', textAlign: 'left', flexDirection: 'row', transition: 'all 0.2s ease', marginBottom: 'var(--space-s)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-secondary)', backgroundColor: isSelected ? 'var(--surface-accent)' : 'var(--bg-secondary)', boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)' };
  const cardHoverStyle = { backgroundColor: isSelected ? 'var(--surface-accent)' :'var(--bg-tertiary)', transform: 'translateX(4px)', boxShadow: 'var(--shadow-md)' };

  return (
    <article
      className="hierarchy-nav-card"
      style={cardStyle}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onMouseOver={(e) => { if(!isSelected) Object.assign(e.currentTarget.style, cardHoverStyle);}}
      onMouseOut={(e) => { if(!isSelected) Object.assign(e.currentTarget.style, {backgroundColor: 'var(--bg-secondary)', transform: 'none', boxShadow: 'var(--shadow-sm)' });}}
      onFocus={(e) => { if(!isSelected) Object.assign(e.currentTarget.style, cardHoverStyle);}}
      onBlur={(e) => { if(!isSelected) Object.assign(e.currentTarget.style, {backgroundColor: 'var(--bg-secondary)', transform: 'none', boxShadow: 'var(--shadow-sm)' });}}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleClick(); } }}
    >
      <div className="card-icon" style={{flexShrink: 0, width: '40px', height: '40px', marginRight: 'var(--space-m)', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
         <i className={iconClass} aria-hidden="true" style={{fontSize: '1.8rem', color: 'var(--accent-primary)'}}></i>
      </div>
      <h3 style={{flexGrow: 1, margin: 0, fontSize: 'var(--font-size-base)', fontWeight: '500', color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)'}}>{topic.name}</h3>
      {/* Alt konusu varsa chevron göster */}
      {topic.children && topic.children.length > 0 && (
         <i className="fas fa-chevron-right hierarchy-chevron" style={{marginLeft: 'var(--space-m)', color: 'var(--text-muted)', fontSize: '1em', transition: 'transform 0.2s ease, color 0.2s ease'}}></i>
      )}
    </article>
  );
}
export default TopicCard;