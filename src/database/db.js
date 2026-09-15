import AsyncStorage from '@react-native-async-storage/async-storage';

const DB_KEY = 'daily_expanse_db_v1';

export const defaultCategories = [
  { id: 'c1', name: 'Food', icon: 'utensils', type: 'expense' },
  { id: 'c2', name: 'Transport', icon: 'car', type: 'expense' },
  { id: 'c3', name: 'Shopping', icon: 'shopping-bag', type: 'expense' },
  { id: 'c4', name: 'Bills', icon: 'file-text', type: 'expense' },
  { id: 'c5', name: 'Education', icon: 'book-open', type: 'expense' },
  { id: 'c6', name: 'Salary', icon: 'banknote', type: 'income' },
  { id: 'c7', name: 'Freelance', icon: 'laptop', type: 'income' }
];

export const defaultPaymentMethods = [
  { id: 'p1', name: 'Cash', icon: 'banknote' },
  { id: 'p2', name: 'bKash', icon: 'smartphone' },
  { id: 'p3', name: 'Nagad', icon: 'smartphone' },
  { id: 'p4', name: 'Bank', icon: 'building-2' }
];

const emptyDb = () => ({
  transactions: [],
  categories: defaultCategories,
  paymentMethods: defaultPaymentMethods,
  budgets: [],
  settings: { id: 'preferences', currency: 'BDT', theme: 'system', appLock: false }
});

export const initDB = async () => {
  const raw = await AsyncStorage.getItem(DB_KEY);
  if (!raw) {
    const db = emptyDb();
    await AsyncStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }
  return JSON.parse(raw);
};

export const saveDB = async (db) => {
  await AsyncStorage.setItem(DB_KEY, JSON.stringify(db));
  return db;
};

export const seedDatabase = async () => {
  const db = await initDB();
  if (!db.categories?.length) db.categories = defaultCategories;
  if (!db.paymentMethods?.length) db.paymentMethods = defaultPaymentMethods;
  if (!db.settings) db.settings = emptyDb().settings;
  await saveDB(db);
};
