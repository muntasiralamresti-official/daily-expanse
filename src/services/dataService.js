import { initDB, saveDB } from '../database/db';

export const getCategories = async () => (await initDB()).categories;
export const getPaymentMethods = async () => (await initDB()).paymentMethods;
export const getSettings = async () => (await initDB()).settings;
export const updateSettings = async (settings) => {
  const db = await initDB();
  db.settings = { ...db.settings, ...settings, id: 'preferences' };
  await saveDB(db);
  return db.settings;
};
