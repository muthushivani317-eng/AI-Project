import { useState, useEffect } from 'react';
import { Heart, Trash2, Clock, Flame } from 'lucide-react';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = () => {
    fetch('/api/favorites')
      .then(res => res.json())
      .then(data => {
        setFavorites(data.favorites);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemove = async (id) => {
    try {
      await fetch(`/api/favorites/${id}`, { method: 'DELETE' });
      fetchFavorites();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="app-container" style={{ textAlign: 'center', paddingTop: '5rem' }}>Loading favorites...</div>;
  }

  return (
    <div className="favorites-page" style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Heart size={32} color="var(--primary)" />
        <h1 style={{ margin: 0, fontSize: '2.5rem' }}>Favorite Recipes</h1>
      </div>
      
      {favorites.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No favorites yet. Generate a recipe and save it!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {favorites.map((item) => {
            let recipe;
            try {
              recipe = JSON.parse(item.recipe_content);
            } catch (e) {
              return null;
            }
            
            return (
              <div key={item.id} className="glass-panel feature-card" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <button 
                  onClick={() => handleRemove(item.id)}
                  style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.5rem' }}
                  title="Remove from favorites"
                >
                  <Trash2 size={20} />
                </button>
                <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem', paddingRight: '2rem' }}>{recipe.recipe_name || 'Untitled Recipe'}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>
                  {recipe.description || 'No description available.'}
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--secondary)' }}>
                    <Clock size={16} /> {recipe.cooking_time || 'N/A'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)' }}>
                    <Flame size={16} /> {recipe.difficulty || 'N/A'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
