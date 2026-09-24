import { X } from 'lucide-react';

export default function IngredientChip({ ingredient, onRemove }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: 'rgba(78, 205, 196, 0.2)',
      border: '1px solid var(--secondary)',
      padding: '0.5rem 1rem',
      borderRadius: '9999px',
      color: 'var(--text-main)',
      fontSize: '0.95rem',
      transition: 'all 0.2s ease',
      cursor: 'default'
    }}>
      {ingredient}
      <button 
        onClick={() => onRemove(ingredient)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.1rem',
          borderRadius: '50%',
          transition: 'color 0.2s ease'
        }}
        onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <X size={16} />
      </button>
    </div>
  );
}
