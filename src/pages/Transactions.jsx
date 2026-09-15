import { useEffect, useState } from 'react';
import { getTransactions, deleteTransaction } from '../services/transactionService';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const txs = await getTransactions();
    setTransactions(txs.sort((a, b) => b.date - a.date));
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this transaction?')) {
      await deleteTransaction(id);
      loadTransactions();
    }
  };

  const formatMoney = (amount) => `৳ ${amount.toLocaleString('en-IN')}`;
  
  const filteredTxs = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  // Group by date
  const grouped = filteredTxs.reduce((acc, tx) => {
    const dateStr = new Date(tx.date).toLocaleDateString();
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(tx);
    return acc;
  }, {});

  return (
    <div className="p-4 pt-8">
      <h1 className="text-2xl font-bold mb-4">Transactions</h1>
      
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300'}`}>All</button>
        <button onClick={() => setFilter('expense')} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filter === 'expense' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300'}`}>Expense</button>
        <button onClick={() => setFilter('income')} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filter === 'income' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300'}`}>Income</button>
      </div>

      <div className="space-y-6">
        {Object.keys(grouped).length === 0 ? (
          <p className="text-center text-gray-500 py-10">No transactions found.</p>
        ) : (
          Object.keys(grouped).map(dateStr => (
            <div key={dateStr}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{dateStr}</h3>
              <div className="space-y-3">
                {grouped[dateStr].map(tx => (
                  <div key={tx.id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        <div className="w-6 h-6 flex items-center justify-center font-bold">{tx.note ? tx.note[0] : 'T'}</div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{tx.note || 'Transaction'}</p>
                        <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                      </p>
                      <button onClick={() => handleDelete(tx.id)} className="text-red-400 p-1">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Transactions;
