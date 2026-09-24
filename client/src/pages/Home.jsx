import { Link } from 'react-router-dom';
import { Sparkles, Utensils, Search } from 'lucide-react';

export default function Home() {
  return (
    <div className="home-page" style={{ marginTop: '2rem' }}>
      
      {/* Hero Section */}
      <div className="hero-section glass-panel" style={{ 
        padding: '3rem 2rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '2rem'
      }}>
        <div style={{ flex: '1 1 400px', textAlign: 'left' }}>
          <h1 style={{ fontSize: '2.8rem' }}>AI-Powered Pantry-to-Plate<br />Recipe Assistant</h1>
          <p className="subtitle" style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
            Turn the ingredients you already have into delicious recipes with AI.
          </p>
          <p className="subtitle" style={{ fontSize: '1rem', marginBottom: '2rem' }}>
            Get personalized recipes based on your ingredients, preferences, and cooking time.
          </p>
          <Link to="/generator" className="btn-primary" style={{ display: 'inline-flex', padding: '1rem 2rem' }}>
            <Sparkles size={20} />
            Start Cooking
          </Link>
        </div>
        <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
          <img 
            src="/hero_ai_food.jpg" 
            alt="AI Food Generator" 
            style={{ 
              width: '100%', 
              maxWidth: '400px', 
              borderRadius: '1rem', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              border: '1px solid var(--card-border)'
            }} 
          />
        </div>
      </div>

      {/* Feature Cards */}
      <div className="features-grid">
        <div className="glass-panel feature-card">
          <Utensils size={36} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h3>Smart Recipe Generation</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
            Instantly generate creative recipes using only the available ingredients in your pantry.
          </p>
        </div>
        <div className="glass-panel feature-card">
          <Sparkles size={36} color="var(--secondary)" style={{ marginBottom: '1rem' }} />
          <h3>Personalized Suggestions</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
            Adjust recipes based on your favorite cuisine, dietary preferences, and available cooking time.
          </p>
        </div>
        <div className="glass-panel feature-card">
          <Search size={36} color="#fbbf24" style={{ marginBottom: '1rem' }} />
          <h3>Smart Missing Ingredients</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
            Identify common ingredients that might be missing to complete a perfect dish.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="how-it-works" style={{ marginTop: '5rem', padding: '4rem 0', borderTop: '1px solid var(--card-border)', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '3rem' }}>How It Works</h2>
        <div className="steps-container">
          {[
            { title: 'Enter Ingredients', desc: 'Tell us what you have' }, 
            { title: 'Customize Preferences', desc: 'Diet, time & cuisine' }, 
            { title: 'Let AI Generate', desc: 'Magic happens here' }, 
            { title: 'Start Cooking', desc: 'Enjoy your meal!' }
          ].map((step, idx) => (
            <div key={idx} className="step-card">
              <div className="step-number">{idx + 1}</div>
              <h4 style={{ margin: '1rem 0 0.5rem' }}>{step.title}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
