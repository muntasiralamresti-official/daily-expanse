import { openDB } from 'idb';

const DB_NAME = 'daily_expense_db';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('transactions')) {
        const store = db.createObjectStore('transactions', { keyPath: 'id' });
        store.createIndex('date', 'date');
        store.createIndex('categoryId', 'categoryId');
        store.createIndex('type', 'type');
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('paymentMethods')) {
        db.createObjectStore('paymentMethods', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('budgets')) {
        const store = db.createObjectStore('budgets', { keyPath: 'id' });
        store.createIndex('month', 'month');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    },
  });
};

export const defaultCategories = [
  { id: 'c1', name: 'Food', icon: 'pizza', type: 'expense', createdAt: Date.now() },
  { id: 'c2', name: 'Transport', icon: 'car', type: 'expense', createdAt: Date.now() },
  { id: 'c3', name: 'Shopping', icon: 'shopping-bag', type: 'expense', createdAt: Date.now() },
  { id: 'c4', name: 'Bills', icon: 'file-text', type: 'expense', createdAt: Date.now() },
  { id: 'c5', name: 'Education', icon: 'book', type: 'expense', createdAt: Date.now() },
  { id: 'c6', name: 'Salary', icon: 'dollar-sign', type: 'income', createdAt: Date.now() },
  { id: 'c7', name: 'Freelance', icon: 'laptop', type: 'income', createdAt: Date.now() }
];

export const defaultPaymentMethods = [
  { id: 'p1', name: 'Cash', icon: 'banknote' },
  { id: 'p2', name: 'bKash', icon: 'smartphone' },
  { id: 'p3', name: 'Nagad', icon: 'smartphone' },
  { id: 'p4', name: 'Bank', icon: 'building' }
];

export const seedDatabase = async () => {
  const db = await initDB();
  const tx = db.transaction(['categories', 'paymentMethods', 'settings'], 'readwrite');
  
  const categoriesCount = await tx.objectStore('categories').count();
  if (categoriesCount === 0) {
    for (const cat of defaultCategories) {
      await tx.objectStore('categories').put(cat);
    }
  }

  const pmCount = await tx.objectStore('paymentMethods').count();
  if (pmCount === 0) {
    for (const pm of defaultPaymentMethods) {
      await tx.objectStore('paymentMethods').put(pm);
    }
  }
  
  const settingsCount = await tx.objectStore('settings').count();
  if (settingsCount === 0) {
    await tx.objectStore('settings').put({ id: 'preferences', currency: 'BDT', theme: 'system', appLock: false });
  }

  await tx.done;
};
