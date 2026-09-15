import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addTransaction } from '../services/transactionService';
import { getCategories, getPaymentMethods } from '../services/dataService';

const AddTransaction = () => {
  const navigate = useNavigate();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    loadFormOptions();
  }, []);

  const loadFormOptions = async () => {
    const cats = await getCategories();
    const pms = await getPaymentMethods();
    setCategories(cats);
    setPaymentMethods(pms);
    
    // Set defaults
    const typeCats = cats.filter(c => c.type === 'expense');
    if (typeCats.length > 0) setCategoryId(typeCats[0].id);
    if (pms.length > 0) setPaymentMethodId(pms[0].id);
  };

  useEffect(() => {
    // Update default category when type changes
    const typeCats = categories.filter(c => c.type === type);
    if (typeCats.length > 0) {
      setCategoryId(typeCats[0].id);
    }
  }, [type, categories]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;
    
    const tx = {
      type,
      amount: Number(amount),
      categoryId,
      paymentMethodId,
      date: new Date(date).getTime(),
      note
    };
    
    await addTransaction(tx);
    navigate('/');
  };

  return (
    <div className="p-4 pt-8 bg-gray-50 min-h-screen dark:bg-slate-950">
      <h1 className="text-2xl font-bold mb-6">Add Transaction</h1>
      
      <div className="flex bg-gray-200 dark:bg-slate-800 rounded-lg p-1 mb-6">
        <button 
          onClick={() => setType('expense')}
          className={`flex-1 py-2 text-center rounded-md font-medium text-sm transition-colors ${type === 'expense' ? 'bg-white text-red-600 shadow-sm dark:bg-slate-700 dark:text-red-400' : 'text-gray-500'}`}
        >
          Expense
        </button>
        <button 
          onClick={() => setType('income')}
          className={`flex-1 py-2 text-center rounded-md font-medium text-sm transition-colors ${type === 'income' ? 'bg-white text-green-600 shadow-sm dark:bg-slate-700 dark:text-green-400' : 'text-gray-500'}`}
        >
          Income
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Amount (৳)</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full text-4xl font-bold bg-transparent border-b-2 border-gray-300 dark:border-slate-700 focus:border-blue-500 outline-none py-2"
            placeholder="0"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.filter(c => c.type === type).map(c => (
              <button 
                key={c.id} 
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`px-4 py-2 rounded-full text-sm border ${categoryId === c.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 dark:bg-slate-900 dark:border-slate-700 dark:text-gray-300'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Payment Method</label>
          <select 
            value={paymentMethodId} 
            onChange={(e) => setPaymentMethodId(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-3 outline-none focus:border-blue-500"
          >
            {paymentMethods.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Date</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-3 outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Note (Optional)</label>
          <input 
            type="text" 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-3 outline-none focus:border-blue-500"
            placeholder="What was this for?"
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white rounded-xl py-4 font-bold text-lg shadow-lg shadow-blue-500/30 mt-4 active:scale-95 transition-transform"
        >
          Save Transaction
        </button>
      </form>
    </div>
  );
};

export default AddTransaction;
