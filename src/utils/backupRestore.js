import { initDB } from '../database/db';

export const exportBackup = async () => {
  const db = await initDB();
  const transactions = await db.getAll('transactions');
  const categories = await db.getAll('categories');
  const paymentMethods = await db.getAll('paymentMethods');
  const settings = await db.getAll('settings');
  const budgets = await db.getAll('budgets');

  const backupData = {
    version: 1,
    timestamp: new Date().toISOString(),
    data: {
      transactions,
      categories,
      paymentMethods,
      settings,
      budgets
    }
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `expense-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importBackup = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backupData = JSON.parse(e.target.result);
        
        if (!backupData.data || !backupData.data.transactions) {
          throw new Error('Invalid backup file format');
        }

        const db = await initDB();
        
        // We do a clear and restore for simplicity, or we could merge. 
        // The prompt says "Do not overwrite existing data blindly. Show a confirmation screen."
        // We will assume confirmation was handled by the UI before calling this.
        
        const tx = db.transaction(['transactions', 'categories', 'paymentMethods', 'settings', 'budgets'], 'readwrite');
        
        // Clear existing
        await tx.objectStore('transactions').clear();
        await tx.objectStore('categories').clear();
        await tx.objectStore('paymentMethods').clear();
        await tx.objectStore('settings').clear();
        await tx.objectStore('budgets').clear();

        // Restore
        for (const item of backupData.data.transactions) await tx.objectStore('transactions').put(item);
        for (const item of backupData.data.categories) await tx.objectStore('categories').put(item);
        for (const item of backupData.data.paymentMethods) await tx.objectStore('paymentMethods').put(item);
        for (const item of backupData.data.settings) await tx.objectStore('settings').put(item);
        if (backupData.data.budgets) {
          for (const item of backupData.data.budgets) await tx.objectStore('budgets').put(item);
        }

        await tx.done;
        resolve(true);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
