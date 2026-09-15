import { initDB, saveDB } from '../database/db';

export const monthKey = (date = new Date()) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const getMonthlyBudget = async (key = monthKey()) => {
  const db = await initDB();
  return Number(db.budgets?.find((b) => b.month === key)?.amount || 0);
};

export const setMonthlyBudget = async (amount, key = monthKey()) => {
  const db = await initDB();
  if (!Array.isArray(db.budgets)) db.budgets = [];
  const value = Math.max(0, Number(amount) || 0);
  const existing = db.budgets.find((b) => b.month === key);
  if (existing) {
    existing.amount = value;
    existing.updatedAt = Date.now();
  } else {
    db.budgets.push({ month: key, amount: value, updatedAt: Date.now() });
  }
  await saveDB(db);
  return value;
};
