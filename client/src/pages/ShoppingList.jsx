import { useState, useEffect } from 'react';
import { ShoppingBag, Trash2, CheckCircle, Circle, Trash } from 'lucide-react';

export default function ShoppingList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = () => {
    fetch('/api/shopping-list')
      .then(res => res.json())
      .then(data => {
        setItems(data.items);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleToggle = async (id, currentStatus) => {
    try {
      await fetch(`/api/shopping-list/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus })
      });
      fetchItems();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/shopping-list/${id}`, { method: 'DELETE' });
      fetchItems();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear the entire shopping list?")) return;
    try {
      await fetch(`/api/shopping-list`, { method: 'DELETE' });
      fetchItems();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="app-container" style={{ textAlign: 'center', paddingTop: '5rem' }}>Loading shopping list...</div>;
  }

  return (
    <div className="shopping-list-page" style={{ animation: 'fadeIn 0.5s ease', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ShoppingBag size={32} color="var(--primary)" />
          <h1 style={{ margin: 0, fontSize: '2.5rem' }}>Shopping List</h1>
        </div>
        {items.length > 0 && (
          <button onClick={handleClearAll} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}>
            <Trash size={16} /> Clear All
          </button>
        )}
      </div>
      
      {items.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Your shopping list is empty. Generate a recipe and add missing ingredients here!</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {items.map((item) => (
              <li 
                key={item.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '1rem',
                  borderBottom: '1px solid var(--card-border)',
                  background: item.completed ? 'rgba(255,255,255,0.02)' : 'transparent',
                  opacity: item.completed ? 0.6 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, cursor: 'pointer' }} onClick={() => handleToggle(item.id, item.completed)}>
                  {item.completed ? (
                    <CheckCircle size={24} color="var(--success)" />
                  ) : (
                    <Circle size={24} color="var(--text-muted)" />
                  )}
                  <span style={{ fontSize: '1.1rem', textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'var(--text-muted)' : 'var(--text-main)' }}>
                    {item.item_name}
                  </span>
                </div>
                <button 
                  onClick={() => handleDelete(item.id)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' }}
                  title="Remove item"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
