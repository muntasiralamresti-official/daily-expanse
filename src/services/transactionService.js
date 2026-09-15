import { initDB } from '../database/db';

export const addTransaction = async (transaction) => {
  const db = await initDB();
  const tx = {
    ...transaction,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await db.put('transactions', tx);
  return tx;
};

export const getTransactions = async () => {
  const db = await initDB();
  return db.getAllFromIndex('transactions', 'date');
};

export const deleteTransaction = async (id) => {
  const db = await initDB();
  await db.delete('transactions', id);
};

export const updateTransaction = async (transaction) => {
  const db = await initDB();
  transaction.updatedAt = Date.now();
  await db.put('transactions', transaction);
  return transaction;
};
