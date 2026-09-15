import { initDB } from '../database/db';

export const getCategories = async () => {
  const db = await initDB();
  return db.getAll('categories');
};

export const getPaymentMethods = async () => {
  const db = await initDB();
  return db.getAll('paymentMethods');
};

export const getSettings = async () => {
  const db = await initDB();
  return db.get('settings', 'preferences');
};

export const updateSettings = async (settings) => {
  const db = await initDB();
  await db.put('settings', { ...settings, id: 'preferences' });
};
