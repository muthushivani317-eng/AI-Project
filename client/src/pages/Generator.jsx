import { useState } from 'react';
import IngredientChip from '../components/IngredientChip';
import { ChefHat, Plus, Heart, ShoppingBag, Clock, Users, Flame } from 'lucide-react';

export default function Generator() {
  const [ingredients, setIngredients] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  
  const [cuisine, setCuisine] = useState('Any');
  const [diet, setDiet] = useState('No Preference');
  const [time, setTime] = useState('Any');
  const [servings, setServings] = useState(1);

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [validationResults, setValidationResults] = useState(null);
  const [spellingSuggestion, setSpellingSuggestion] = useState(null);

  const cuisines = ['Any', 'South Indian', 'North Indian', 'Chinese', 'Italian', 'Mexican', 'American'];
  const diets = ['No Preference', 'Vegetarian', 'Vegan', 'Non-Vegetarian', 'Gluten-Free'];
  const times = ['Any', 'Under 15 minutes', '30 minutes', '45 minutes', '60 minutes'];

  const handleAddIngredient = (e) => {
    e.preventDefault();
    if (!currentInput.trim()) return;

    const newIngredients = currentInput
      .split(',')
      .map(item => item.trim())
      .filter(item => item !== '');

    // Case-insensitive deduplication
    const uniqueNew = newIngredients.filter(item => !ingredients.some(i => i.toLowerCase() === item.toLowerCase()));
    
    // Normalize capitalization (e.g. "rice" -> "Rice")
    const finalNew = uniqueNew.map(item => {
      return item
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    });

    if (finalNew.length > 0) {
      setIngredients([...ingredients, ...finalNew]);
    }
    setCurrentInput('');
    setValidationResults(null);
    setSpellingSuggestion(null);
    setError('');
  };

  const handleRemoveIngredient = (ingredientToRemove) => {
    setIngredients(ingredients.filter(i => i !== ingredientToRemove));
  };

  const generateRecipe = async () => {
    console.log("========== GENERATE START ==========");
    console.log("[1] BUTTON CLICKED");
    console.log("[2] INGREDIENTS:", ingredients);
    console.log("[3] CUISINE:", cuisine);
    console.log("[4] DIET:", diet);
    console.log("[5] TIME:", time);
    console.log("[6] SERVINGS:", servings);

    if (ingredients.length === 0) {
      setError("Please enter at least one food ingredient.");
      return;
    }
    
    setLoading(true);
    setError('');
    setRecipe(null);
    setSaveSuccess('');
    setValidationResults(null);
    setSpellingSuggestion(null);

    try {
      const validateRes = await fetch('/api/validate-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients })
      });
      const validateData = await validateRes.json();
      
      if (!validateRes.ok || !validateData.success) {
        throw new Error(validateData.error || "Validation failed.");
      }
      
      const validation = validateData.validation;
      
      if (validation.invalid.length > 0) {
        setValidationResults(validation);
        setError("Some ingredients need attention.");
        setLoading(false);
        return;
      }
      
      if (Object.keys(validation.suggestions).length > 0) {
        const original = Object.keys(validation.suggestions)[0];
        const suggestion = validation.suggestions[original];
        setSpellingSuggestion({ original, suggestion });
        setLoading(false);
        return;
      }
      
    } catch (err) {
      console.error("[ERROR] Validation failed:", err);
      setError(err.message || "Unable to validate ingredients.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
    
    try {
      console.log("[7] STARTING FETCH");
      console.log("[8] API URL:", "/api/generate-recipe (via Vite proxy → 127.0.0.1:5000)");
      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, cuisine, diet, time, servings }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log("[9] RESPONSE RECEIVED");
      console.log("[10] STATUS:", response.status);
      
      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        console.error("[ERROR] Failed to parse JSON:", jsonErr);
        throw new Error("Backend returned invalid JSON. Please check if the Flask server is running.");
      }
      console.log("[11] RESPONSE JSON:", data);
      
      if (!response.ok) {
        throw new Error(data.error || `Backend returned error status: ${response.status}`);
      }
      
      console.log("[12] RECIPES:", data.recipes);
      if (data.success && Array.isArray(data.recipes) && data.recipes.length > 0) {
        console.log("[13] SETTING RECIPE");
        setRecipe(data.recipes[0]);
      } else {
        throw new Error(data.error || "No recipes returned by backend. Check Flask logs.");
      }
      
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.error("[ERROR] FETCH TIMED OUT AFTER 2 MINUTES");
        setError("Request timed out. The AI is taking too long. Please try again.");
      } else {
        console.error("[ERROR] FETCH FAILED:", err);
        setError(err.message || "Unable to generate recipes. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFavorite = async () => {
    if (!recipe) return;
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recipe_name: recipe.title, 
          recipe_content: JSON.stringify(recipe) 
        })
      });
      if (res.ok) {
        setSaveSuccess('Saved to Favorites!');
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddShoppingList = async () => {
    if (!recipe || !recipe.missing_ingredients || recipe.missing_ingredients.length === 0) return;
    try {
      const res = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: recipe.missing_ingredients })
      });
      if (res.ok) {
        setSaveSuccess('Added to Shopping List!');
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="generator-page">
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h2>What do you have in your pantry?</h2>
        
        <form onSubmit={handleAddIngredient} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <input 
            type="text" 
            className="input-glass" 
            placeholder="e.g. Rice, Tomato, Onion (Press Enter)" 
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
          />
          <button type="submit" className="btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Plus size={18} /> Add
          </button>
        </form>

        {ingredients.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem' }}>
            {ingredients.map(ing => (
              <IngredientChip key={ing} ingredient={ing} onRemove={handleRemoveIngredient} />
            ))}
            <button 
              onClick={() => setIngredients([])}
              className="btn-secondary"
              style={{ border: 'none', color: 'var(--primary)', padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
            >
              Clear All
            </button>
          </div>
        )}

        {validationResults && validationResults.invalid.length > 0 && (
          <div className="glass-panel" style={{ background: 'rgba(255,0,0,0.1)', padding: '1rem', marginBottom: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--primary)' }}>
            <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Some ingredients need attention.</h4>
            <div style={{ display: 'flex', gap: '2rem' }}>
              {validationResults.valid.length > 0 && (
                <div>
                  <strong style={{ color: 'var(--success)' }}>Valid:</strong>
                  <ul style={{ listStyleType: 'none', margin: 0, padding: 0 }}>
                    {validationResults.valid.map(item => <li key={item}>✓ {item}</li>)}
                  </ul>
                </div>
              )}
              <div>
                <strong style={{ color: 'var(--primary)' }}>Invalid:</strong>
                <ul style={{ listStyleType: 'none', margin: 0, padding: 0 }}>
                  {validationResults.invalid.map(item => <li key={item}>✗ {item}</li>)}
                </ul>
              </div>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Please remove or correct the invalid ingredients before generating recipes.
            </p>
          </div>
        )}

        {spellingSuggestion && (
          <div className="glass-panel" style={{ background: 'rgba(255,165,0,0.1)', padding: '1rem', marginBottom: '1.5rem', borderRadius: '0.5rem', border: '1px solid orange' }}>
            <p style={{ color: 'orange', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              ⚠ Did you mean "{spellingSuggestion.suggestion}"?
            </p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
              <button 
                type="button"
                className="btn-primary" 
                style={{ padding: '0.5rem 1rem' }}
                onClick={() => {
                  const newIngs = ingredients.map(i => i === spellingSuggestion.original ? spellingSuggestion.suggestion : i);
                  setIngredients(newIngs);
                  setSpellingSuggestion(null);
                  setError('');
                }}
              >
                Use {spellingSuggestion.suggestion}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Cuisine</label>
            <select className="input-glass" value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
              {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Dietary Preference</label>
            <select className="input-glass" value={diet} onChange={(e) => setDiet(e.target.value)}>
              {diets.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Cooking Time</label>
            <select className="input-glass" value={time} onChange={(e) => setTime(e.target.value)}>
              {times.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Servings</label>
            <input 
              type="number" 
              min="1" max="12" 
              className="input-glass" 
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </div>
        </div>

        <button 
          type="button"
          className="btn-primary" 
          onClick={generateRecipe} 
          disabled={loading || ingredients.length === 0}
          style={{ width: '100%', opacity: (loading || ingredients.length === 0) ? 0.7 : 1 }}
        >
          {loading ? (
            <span>AI is creating recipes from your pantry...</span>
          ) : (
            <>
              <ChefHat size={20} /> ✨ Generate Recipes
            </>
          )}
        </button>
        
        {error && <div className="error-message glass-panel" style={{ marginTop: '1rem', background: 'rgba(255,0,0,0.1)', border: '1px solid var(--primary)', textAlign: 'center', padding: '1rem' }}>{error}</div>}
      </div>

      {recipe && (
        <div className="glass-panel recipe-result" style={{ animation: 'slideUp 0.5s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ flex: '1' }}>
              <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '2.5rem' }}>{recipe.title}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>{recipe.description}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={handleSaveFavorite} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                <Heart size={18} /> Save Favorite
              </button>
            </div>
          </div>
          
          {saveSuccess && <p style={{ color: 'var(--success)', marginBottom: '1rem' }}>{saveSuccess}</p>}

          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
              <Clock size={18} color="var(--secondary)" /> <span>{recipe.time_minutes}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
              <Flame size={18} color="var(--primary)" /> <span>{recipe.difficulty}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
              <Users size={18} color="var(--success)" /> <span>{recipe.servings} Servings</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <h3 style={{ color: 'var(--success)', marginBottom: '1rem' }}>Available Ingredients</h3>
              <ul style={{ listStylePosition: 'inside', color: 'var(--text-main)' }}>
                {recipe.available_ingredients?.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>{item}</li>
                ))}
              </ul>
            </div>
            
            {recipe.missing_ingredients && recipe.missing_ingredients.length > 0 && (
              <div style={{ background: 'rgba(255, 107, 107, 0.05)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255, 107, 107, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>Missing Ingredients</h3>
                  <button onClick={handleAddShoppingList} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShoppingBag size={14} /> Add to List
                  </button>
                </div>
                <ul style={{ listStylePosition: 'inside', color: 'var(--text-muted)' }}>
                  {recipe.missing_ingredients.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '0.5rem' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>Cooking Steps</h3>
            <ol style={{ paddingLeft: '1.5rem' }}>
              {recipe.steps?.map((step, idx) => (
                <li key={idx} style={{ marginBottom: '1rem', lineHeight: '1.6' }}>{step}</li>
              ))}
            </ol>
          </div>

          {recipe.tip && (
            <div style={{ background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.1) 0%, rgba(78, 205, 196, 0.02) 100%)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--secondary)' }}>
              <h4 style={{ color: 'var(--secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ChefHat size={18} /> Chef's Tip
              </h4>
              <p style={{ color: 'var(--text-main)', margin: 0 }}>{recipe.tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
