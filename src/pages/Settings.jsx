import { useState, useEffect, useRef } from 'react';
import { initDB } from '../database/db';
import { exportBackup, importBackup } from '../utils/backupRestore';

const SettingsPage = () => {
  const [theme, setTheme] = useState('system');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('dark');
      setTheme('dark');
    } else {
      root.classList.remove('dark');
      setTheme('light');
    }
  };

  const clearData = async () => {
    if (window.confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
      const db = await initDB();
      await db.clear('transactions');
      alert('Data cleared successfully.');
      window.location.reload();
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (window.confirm('Importing this backup will replace your local data. Proceed?')) {
      try {
        await importBackup(file);
        alert('Backup imported successfully!');
        window.location.reload();
      } catch (err) {
        alert('Invalid backup file: ' + err.message);
      }
    }
    e.target.value = null; // reset
  };

  return (
    <div className="p-4 pt-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Appearance</h3>
          <div className="flex justify-between items-center">
            <span>Dark Mode</span>
            <button 
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Data</h3>
          <button 
            className="w-full text-left py-3 border-b border-gray-100 dark:border-slate-800"
            onClick={exportBackup}
          >
            Export Backup
          </button>
          <button 
            className="w-full text-left py-3 border-b border-gray-100 dark:border-slate-800"
            onClick={handleImportClick}
          >
            Import Backup
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />
          <button 
            className="w-full text-left py-3 text-red-600 dark:text-red-400 font-medium"
            onClick={clearData}
          >
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
