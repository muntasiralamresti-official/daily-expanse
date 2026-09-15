import { useEffect, useState } from 'react';
import { getTransactions } from '../services/transactionService';

const Statistics = () => {
  const [transactions, setTransactions] = useState([]);
  
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const txs = await getTransactions();
    setTransactions(txs);
  };

  const formatMoney = (amount) => `৳ ${amount.toLocaleString('en-IN')}`;

  const income = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);

  return (
    <div className="p-4 pt-8">
      <h1 className="text-2xl font-bold mb-6">Statistics</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
          <p className="text-sm text-red-600 dark:text-red-400 mb-1">Total Expense</p>
          <p className="text-xl font-bold text-red-700 dark:text-red-300">{formatMoney(expense)}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
          <p className="text-sm text-green-600 dark:text-green-400 mb-1">Total Income</p>
          <p className="text-xl font-bold text-green-700 dark:text-green-300">{formatMoney(income)}</p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-800">
        <h3 className="font-semibold mb-4 text-center">Net Balance: {formatMoney(income - expense)}</h3>
        <p className="text-sm text-center text-gray-500">More detailed charts coming soon.</p>
      </div>
    </div>
  );
};

export default Statistics;
