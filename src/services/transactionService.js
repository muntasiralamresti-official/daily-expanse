import { initDB, saveDB } from '../database/db';

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const addTransaction = async (transaction) => {
  const db = await initDB();
  const tx = { ...transaction, id: makeId(), createdAt: Date.now(), updatedAt: Date.now() };
  db.transactions.push(tx);
  await saveDB(db);
  return tx;
};

export const getTransactions = async () => {
  const db = await initDB();
  return [...db.transactions].sort((a, b) => a.date - b.date);
};

export const deleteTransaction = async (id) => {
  const db = await initDB();
  db.transactions = db.transactions.filter((tx) => tx.id !== id);
  await saveDB(db);
};

export const updateTransaction = async (transaction) => {
  const db = await initDB();
  db.transactions = db.transactions.map((tx) => tx.id === transaction.id ? { ...transaction, updatedAt: Date.now() } : tx);
  await saveDB(db);
  return transaction;
};
