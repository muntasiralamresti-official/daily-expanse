import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTransactions } from '../services/transactionService';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const txs = await getTransactions();
    // basic summary calculation
    let inc = 0, exp = 0;
    txs.forEach(t => {
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
    });
    setSummary({ income: inc, expense: exp, balance: inc - exp });
    setTransactions(txs.sort((a, b) => b.date - a.date).slice(0, 5));
  };

  const formatMoney = (amount) => `৳ ${amount.toLocaleString('en-IN')}`;

  return (
    <div className="p-4 pt-8">
      <h1 className="text-2xl font-bold mb-6">Overview</h1>
      
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg mb-6">
        <p className="text-blue-100 text-sm mb-1">Current Balance</p>
        <h2 className="text-3xl font-bold">{formatMoney(summary.balance)}</h2>
        
        <div className="flex justify-between mt-6 pt-4 border-t border-blue-500/30">
          <div>
            <p className="text-blue-200 text-xs mb-1">Income</p>
            <p className="font-semibold text-green-300">{formatMoney(summary.income)}</p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs mb-1">Expense</p>
            <p className="font-semibold text-red-300">{formatMoney(summary.expense)}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Recent Transactions</h3>
        <Link to="/transactions" className="text-blue-500 text-sm">See all</Link>
      </div>

      <div className="space-y-3">
        {transactions.length === 0 ? (
          <p className="text-center text-gray-500 py-8 bg-gray-50 dark:bg-slate-900 rounded-xl">
            কোনো transaction নেই।<br/>আজকের প্রথম খরচটি যোগ করুন।
          </p>
        ) : (
          transactions.map(tx => (
            <div key={tx.id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {/* Icon placeholder based on category later */}
                  <div className="w-6 h-6 flex items-center justify-center font-bold">{tx.note ? tx.note[0] : 'T'}</div>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{tx.note || 'Transaction'}</p>
                  <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                </div>
              </div>
              <p className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
