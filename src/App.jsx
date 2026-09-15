import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, List, PieChart, Wallet, Settings } from 'lucide-react';
import { seedDatabase } from './database/db';

import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import Transactions from './pages/Transactions';
import Statistics from './pages/Statistics';
import SettingsPage from './pages/Settings';

const BottomNav = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'text-blue-500' : 'text-gray-400';

  return (
    <div className="fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-around items-center h-16 px-2 pb-safe">
      <Link to="/" className={`flex flex-col items-center p-2 ${isActive('/')}`}>
        <Home size={24} />
        <span className="text-[10px] mt-1">Home</span>
      </Link>
      <Link to="/transactions" className={`flex flex-col items-center p-2 ${isActive('/transactions')}`}>
        <List size={24} />
        <span className="text-[10px] mt-1">Transactions</span>
      </Link>
      <Link to="/add" className="flex flex-col items-center p-2 -mt-6">
        <div className="bg-blue-600 rounded-full p-3 shadow-lg shadow-blue-500/30 text-white">
          <span className="text-xl font-bold leading-none">+</span>
        </div>
      </Link>
      <Link to="/statistics" className={`flex flex-col items-center p-2 ${isActive('/statistics')}`}>
        <PieChart size={24} />
        <span className="text-[10px] mt-1">Stats</span>
      </Link>
      <Link to="/settings" className={`flex flex-col items-center p-2 ${isActive('/settings')}`}>
        <Settings size={24} />
        <span className="text-[10px] mt-1">Settings</span>
      </Link>
    </div>
  );
};

const App = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    seedDatabase().then(() => {
      setIsReady(true);
    });
  }, []);

  if (!isReady) {
    return <div className="flex h-screen items-center justify-center dark:bg-slate-950 dark:text-white">Loading...</div>;
  }

  return (
    <Router>
      <div className="min-h-screen pb-20 dark:bg-slate-950 dark:text-white">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddTransaction />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  );
};

export default App;
