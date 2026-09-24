import { useState, useEffect, useMemo } from 'react';
import { 
  History as HistoryIcon, Clock, Flame, Users, Search, 
  Heart, Trash2, X, ChefHat, ShoppingBag
} from 'lucide-react';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest First');
  
  // Pagination
  const [visibleCount, setVisibleCount] = useState(9);
  
  // Modals
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // stores item ID to delete

  // Favorites tracking (so we can visually show if something is favorited)
  const [favorites, setFavorites] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/history');
      if (!res.ok) throw new Error('Failed to load history');
      const data = await res.json();
      setHistory(data.history);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await fetch('/api/favorites');
      if (res.ok) {
        const data = await res.json();
        // Extract recipe names or IDs to check if already favorited
        setFavorites(data.favorites);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchFavorites();
  }, []);

  // Helpers to parse recipe safely
  const getRecipeData = (item) => {
    try {
      return JSON.parse(item.recipe_content);
    } catch (e) {
      return null;
    }
  };

  const getTitle = (recipe) => recipe.title || recipe.recipe_title || recipe.name || 'Recipe';
  
  const getTimeMinutes = (recipe) => {
    const t = recipe.time_minutes || recipe.time || recipe.cooking_time || recipe.duration;
    if (!t) return null;
    return String(t).replace(/min(utes)?/i, '').trim() + ' min';
  };

  const getDifficulty = (recipe) => recipe.difficulty || null;
  const getServings = (recipe) => recipe.servings || null;
  const getCuisine = (recipe) => recipe.cuisine || null;
  
  const handleFavorite = async (recipeObj, e) => {
    e.stopPropagation(); // prevent modal open
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recipe_name: getTitle(recipeObj), 
          recipe_content: JSON.stringify(recipeObj) 
        })
      });
      if (res.ok) {
        fetchFavorites(); // refresh favorites list
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isFavorited = (recipeObj) => {
    const title = getTitle(recipeObj);
    return favorites.some(fav => {
      try {
        const favRec = JSON.parse(fav.recipe_content);
        return getTitle(favRec) === title;
      } catch (e) {
        return fav.recipe_name === title;
      }
    });
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory(history.filter(h => h.id !== id));
        setShowDeleteConfirm(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddShoppingList = async (missingIngredients) => {
    if (!missingIngredients || missingIngredients.length === 0) return;
    try {
      const res = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: missingIngredients })
      });
      if (res.ok) {
        setSaveSuccess('Added to Shopping List!');
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter and Sort Logic
  const processedHistory = useMemo(() => {
    let filtered = history.map(item => {
      const recipe = getRecipeData(item);
      return { item, recipe };
    }).filter(x => x.recipe !== null);

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(({ recipe }) => {
        const title = getTitle(recipe).toLowerCase();
        const desc = (recipe.description || '').toLowerCase();
        const ingredients = (recipe.available_ingredients || []).join(' ').toLowerCase() + ' ' + (recipe.missing_ingredients || []).join(' ').toLowerCase();
        return title.includes(q) || desc.includes(q) || ingredients.includes(q);
      });
    }

    // Filters
    if (cuisineFilter !== 'All') {
      filtered = filtered.filter(({ recipe }) => {
        const c = getCuisine(recipe);
        return c && c.toLowerCase() === cuisineFilter.toLowerCase();
      });
    }
    
    if (difficultyFilter !== 'All') {
      filtered = filtered.filter(({ recipe }) => {
        const d = getDifficulty(recipe);
        return d && d.toLowerCase() === difficultyFilter.toLowerCase();
      });
    }

    if (timeFilter !== 'All') {
      filtered = filtered.filter(({ recipe }) => {
        const t = parseInt(getTimeMinutes(recipe) || '0');
        if (timeFilter === 'Under 15 min') return t > 0 && t < 15;
        if (timeFilter === '15–30 min') return t >= 15 && t <= 30;
        if (timeFilter === '30–60 min') return t > 30 && t <= 60;
        if (timeFilter === '60+ min') return t > 60;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'Newest First') return new Date(b.item.created_at) - new Date(a.item.created_at);
      if (sortBy === 'Oldest First') return new Date(a.item.created_at) - new Date(b.item.created_at);
      if (sortBy === 'Name A–Z') return getTitle(a.recipe).localeCompare(getTitle(b.recipe));
      if (sortBy === 'Name Z–A') return getTitle(b.recipe).localeCompare(getTitle(a.recipe));
      return 0;
    });

    return filtered;
  }, [history, searchQuery, cuisineFilter, difficultyFilter, timeFilter, sortBy]);

  const visibleHistory = processedHistory.slice(0, visibleCount);
  
  // Calculate Stats
  const totalRecipes = history.length;
  const totalFavorites = favorites.length;
  const latestRecipeDate = history.length > 0 ? new Date(history[0].created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'None';

  return (
    <div className="history-page" style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '4rem' }}>
      
      {/* Header & Stats */}
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <HistoryIcon size={32} color="var(--primary)" />
          <h1 style={{ margin: 0, fontSize: '2.5rem' }}>Generation History</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2rem' }}>
          Your previously generated AI recipes, all in one place.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--card-border)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{totalRecipes}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Total Recipes</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--card-border)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{totalFavorites}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Favorites</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--card-border)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '0.5rem' }}>{latestRecipeDate}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Latest Recipe</div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            className="input-glass" 
            placeholder="Search your recipes (e.g., chicken, rice)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '3rem', width: '100%' }}
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Cuisine</label>
            <select className="input-glass" value={cuisineFilter} onChange={e => setCuisineFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="South Indian">South Indian</option>
              <option value="North Indian">North Indian</option>
              <option value="Italian">Italian</option>
              <option value="Chinese">Chinese</option>
              <option value="Mexican">Mexican</option>
              <option value="American">American</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Difficulty</label>
            <select className="input-glass" value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Cooking Time</label>
            <select className="input-glass" value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="Under 15 min">Under 15 min</option>
              <option value="15–30 min">15–30 min</option>
              <option value="30–60 min">30–60 min</option>
              <option value="60+ min">60+ min</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Sort By</label>
            <select className="input-glass" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="Newest First">Newest First</option>
              <option value="Oldest First">Oldest First</option>
              <option value="Name A–Z">Name A–Z</option>
              <option value="Name Z–A">Name Z–A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {[1,2,3].map(i => (
            <div key={i} className="glass-panel" style={{ height: '300px', opacity: 0.5, animation: 'pulse 1.5s infinite' }}></div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.2rem' }}>Unable to load your recipe history.</p>
          <button className="btn-secondary" onClick={fetchHistory}>Try Again</button>
        </div>
      ) : processedHistory.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍳</div>
          <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>
            {history.length === 0 ? "No recipes yet" : "No recipes found"}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            {history.length === 0 
              ? "Generate your first AI-powered recipe and it will appear here." 
              : "Try adjusting your search or filters."}
          </p>
          {history.length === 0 && (
            <a href="/" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
              Create Recipe
            </a>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {visibleHistory.map(({ item, recipe }) => {
              const timeStr = getTimeMinutes(recipe);
              const diffStr = getDifficulty(recipe);
              const servStr = getServings(recipe);
              const cuisStr = getCuisine(recipe);
              const isFav = isFavorited(recipe);

              return (
                <div key={item.id} className="glass-panel feature-card" style={{ 
                  display: 'flex', flexDirection: 'column', position: 'relative',
                  transition: 'all 0.3s ease', cursor: 'pointer',
                  border: '1px solid var(--card-border)'
                }} onClick={() => setSelectedRecipe({ item, recipe })}>
                  
                  {/* Actions Container */}
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', zIndex: 2 }}>
                    <button 
                      onClick={(e) => handleFavorite(recipe, e)}
                      style={{ background: 'rgba(0,0,0,0.3)', border: 'none', color: isFav ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', backdropFilter: 'blur(4px)' }}
                      title={isFav ? "Favorited" : "Favorite"}
                    >
                      <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(item.id); }}
                      style={{ background: 'rgba(0,0,0,0.3)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', backdropFilter: 'blur(4px)' }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem', paddingRight: '4rem' }}>{getTitle(recipe)}</h3>
                  
                  {cuisStr && (
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(78, 205, 196, 0.1)', color: 'var(--secondary)', borderRadius: '1rem', alignSelf: 'flex-start', marginBottom: '1rem' }}>
                      {cuisStr}
                    </span>
                  )}
                  
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {recipe.description || 'No description available.'}
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                    {timeStr && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}><Clock size={14} color="var(--secondary)" /> {timeStr}</div>}
                    {diffStr && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}><Flame size={14} color="var(--primary)" /> {diffStr}</div>}
                    {servStr && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}><Users size={14} color="var(--success)" /> {servStr} serv</div>}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 'bold' }}>View Recipe →</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {visibleCount < processedHistory.length && (
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <button className="btn-secondary" onClick={() => setVisibleCount(prev => prev + 9)}>
                Load More
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', animation: 'scaleUp 0.3s ease' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Delete this recipe from history?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => handleDelete(showDeleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* View Recipe Modal */}
      {selectedRecipe && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }} onClick={() => setSelectedRecipe(null)}>
          <div className="glass-panel recipe-result" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', animation: 'slideUp 0.4s ease' }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedRecipe(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-main)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            
            {/* Modal Content - Similar to Generator View */}
            <div style={{ paddingRight: '2rem' }}>
              <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '2rem' }}>{getTitle(selectedRecipe.recipe)}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>{selectedRecipe.recipe.description}</p>
            </div>

            {saveSuccess && <p style={{ color: 'var(--success)', marginBottom: '1rem' }}>{saveSuccess}</p>}

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              {getTimeMinutes(selectedRecipe.recipe) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
                  <Clock size={18} color="var(--secondary)" /> <span>{getTimeMinutes(selectedRecipe.recipe)}</span>
                </div>
              )}
              {getDifficulty(selectedRecipe.recipe) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
                  <Flame size={18} color="var(--primary)" /> <span>{getDifficulty(selectedRecipe.recipe)}</span>
                </div>
              )}
              {getServings(selectedRecipe.recipe) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
                  <Users size={18} color="var(--success)" /> <span>{getServings(selectedRecipe.recipe)} Servings</span>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {selectedRecipe.recipe.available_ingredients && selectedRecipe.recipe.available_ingredients.length > 0 && (
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h3 style={{ color: 'var(--success)', marginBottom: '1rem', fontSize: '1.1rem' }}>Available Ingredients</h3>
                  <ul style={{ listStylePosition: 'inside', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                    {selectedRecipe.recipe.available_ingredients.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '0.5rem' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedRecipe.recipe.missing_ingredients && selectedRecipe.recipe.missing_ingredients.length > 0 && (
                <div style={{ background: 'rgba(255, 107, 107, 0.05)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255, 107, 107, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.1rem' }}>Missing Ingredients</h3>
                    <button onClick={() => handleAddShoppingList(selectedRecipe.recipe.missing_ingredients)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <ShoppingBag size={12} /> Add to List
                    </button>
                  </div>
                  <ul style={{ listStylePosition: 'inside', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    {selectedRecipe.recipe.missing_ingredients.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '0.5rem' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>Cooking Steps</h3>
              <ol style={{ paddingLeft: '1.5rem' }}>
                {selectedRecipe.recipe.steps?.map((step, idx) => (
                  <li key={idx} style={{ marginBottom: '1rem', lineHeight: '1.6' }}>{step}</li>
                ))}
              </ol>
            </div>

            {selectedRecipe.recipe.tip && (
              <div style={{ background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.1) 0%, rgba(78, 205, 196, 0.02) 100%)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--secondary)' }}>
                <h4 style={{ color: 'var(--secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ChefHat size={18} /> Chef's Tip
                </h4>
                <p style={{ color: 'var(--text-main)', margin: 0 }}>{selectedRecipe.recipe.tip}</p>
              </div>
            )}
            
          </div>
        </div>
      )}
      
    </div>
  );
}
