import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Generator from './pages/Generator';
import History from './pages/History';
import Favorites from './pages/Favorites';
import ShoppingList from './pages/ShoppingList';
import { ChefHat, History as HistoryIcon, Heart, ShoppingBag } from 'lucide-react';

function NavLinks() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="nav-links" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
      <Link to="/generator" className={isActive('/generator') ? 'nav-link active' : 'nav-link'} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', textDecoration: 'none' }}>
        <ChefHat size={18} /> Create Recipe
      </Link>
      <Link to="/favorites" className={isActive('/favorites') ? 'nav-link active' : 'nav-link'} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', textDecoration: 'none' }}>
        <Heart size={18} /> Favorites
      </Link>
      <Link to="/shopping-list" className={isActive('/shopping-list') ? 'nav-link active' : 'nav-link'} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', textDecoration: 'none' }}>
        <ShoppingBag size={18} /> Shopping List
      </Link>
      <Link to="/history" className={isActive('/history') ? 'nav-link active' : 'nav-link'} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', textDecoration: 'none' }}>
        <HistoryIcon size={18} /> History
      </Link>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <nav className="navbar">
          <Link to="/" className="logo">
            <ChefHat size={32} color="var(--primary)" />
            Pantry-to-Plate AI
          </Link>
          <NavLinks />
        </nav>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/generator" element={<Generator />} />
          <Route path="/history" element={<History />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/shopping-list" element={<ShoppingList />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
