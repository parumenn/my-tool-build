import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Wallet, PieChart, Plus, Trash2, TrendingUp, Calendar as CalendarIcon, Target, CreditCard, ChevronLeft, ChevronRight, RefreshCwOff } from 'lucide-react';
import { PieChart as RePie, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { WorkspaceContext } from '../WorkspaceContext';

// --- Types ---
type TransactionType = 'income' | 'expense';
interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  note: string;
}

interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: 'monthly' | 'yearly';
  nextDate: string;
}

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

const CATEGORIES = {
  expense: ['食費', '交通費', '日用品', '趣味', '住居費', 'その他'],
  income: ['給料', '副業', '臨時収入', 'その他']
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Kakeibo: React.FC = () => {
  const isWorkspace = useContext(WorkspaceContext);
  
  // --- State ---
  const [view, setView] = useState<'dashboard' | 'calendar' | 'subs' | 'goals'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(() => 
    JSON.parse(localStorage.getItem('kakeibo_transactions') || '[]')
  );
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => 
    JSON.parse(localStorage.getItem('kakeibo_subs') || '[]')
  );
  const [goals, setGoals] = useState<Goal[]>(() => 
    JSON.parse(localStorage.getItem('kakeibo_goals') || '[]')
  );

  // Form States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTrans, setNewTrans] = useState<Partial<Transaction>>({ type: 'expense', date: new Date().toISOString().split('T')[0], category: '食費' });
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // --- Effects ---
  useEffect(() => localStorage.setItem('kakeibo_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('kakeibo_subs', JSON.stringify(subscriptions)), [subscriptions]);
  useEffect(() => localStorage.setItem('kakeibo_goals', JSON.stringify(goals)), [goals]);

  // --- Handlers ---
  const addTransaction = () => {
    if (!newTrans.amount || !newTrans.date) return;
    const t: Transaction = {
      id: Date.now().toString(),
      date: newTrans.date,
      amount: Number(newTrans.amount),
      type: newTrans.type as TransactionType,
      category: newTrans.category || 'その他',
      note: newTrans.note || ''
    };
    setTransactions(prev => [t, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsAddModalOpen(false);
    setNewTrans({ type: 'expense', date: new Date().toISOString().split('T')[0], category: '食費', amount: 0, note: '' });
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // --- Derived Data ---
  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
  const monthTransactions = transactions.filter(t => t.date.startsWith(monthKey));
  
  const summary = useMemo(() => {
    const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [monthTransactions]);

  const categoryData = useMemo(() => {
    const data: {[key: string]: number} = {};
    monthTransactions.filter(t => t.type === 'expense').forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [monthTransactions]);

  // --- Render Helpers ---
  const formatYen = (num: number) => `¥${num.toLocaleString()}`;

  // --- Sub-Components ---
  const DashboardView = () => (
    <div className="space-y-4 animate-fade-in">
      {/* Summary Cards */}
      <div className={`grid gap-2 ${isWorkspace ? 'grid-cols-3' : 'grid-cols-1 md:grid-cols-3'}`}>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">収入</p>
          <p className={`${isWorkspace ? 'text-lg' : 'text-3xl'} font-bold text-slate-800 dark:text-white truncate`}>{formatYen(summary.income)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400 font-bold mb-1">支出</p>
          <p className={`${isWorkspace ? 'text-lg' : 'text-3xl'} font-bold text-slate-800 dark:text-white truncate`}>{formatYen(summary.expense)}</p>
        </div>
        <div className={`p-3 rounded-xl border ${summary.balance >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800' : 'bg-gray-100 border-gray-200'}`}>
          <p className="text-xs text-green-600 dark:text-green-400 font-bold mb-1">差引</p>
          <p className={`${isWorkspace ? 'text-lg' : 'text-3xl'} font-bold text-slate-800 dark:text-white truncate`}>{formatYen(summary.balance)}</p>
        </div>
      </div>

      <div className={`grid gap-4 ${isWorkspace ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {/* Chart */}
        <div className="bg-white dark:bg-dark-lighter p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">内訳</h3>
          <div className={`${isWorkspace ? 'h-32' : 'h-64'}`}>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePie>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={isWorkspace ? 50 : 80}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatYen(value)} contentStyle={{borderRadius: '8px', border: 'none'}} />
                </RePie>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">データなし</div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-dark-lighter p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex-1 overflow-hidden flex flex-col">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 sticky top-0 bg-white dark:bg-dark-lighter pb-2">直近</h3>
          <div className="space-y-2 overflow-y-auto pr-1 flex-1">
            {monthTransactions.length === 0 ? (
               <p className="text-xs text-gray-400 text-center py-2">なし</p>
            ) : (
              monthTransactions.map(t => (
                <div key={t.id} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className={`p-1.5 rounded-full shrink-0 ${t.type === 'income' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                      {t.type === 'income' ? <TrendingUp size={12} /> : <CreditCard size={12} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{t.category}</p>
                      <p className="text-[10px] text-gray-500 truncate">{t.date.slice(5)} {t.note}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-sm font-bold ${t.type === 'income' ? 'text-blue-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                    </span>
                    <button onClick={() => deleteTransaction(t.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const CalendarView = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="bg-white dark:bg-dark-lighter p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in">
         <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-gray-500">
           {['日','月','火','水','木','金','土'].map(d => <div key={d}>{d}</div>)}
         </div>
         <div className="grid grid-cols-7 gap-1">
            {Array.from({length: firstDay}).map((_, i) => <div key={`empty-${i}`} />)}
            {days.map(day => {
              const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`;
              const dayTrans = transactions.filter(t => t.date === dateStr);
              const dayIncome = dayTrans.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
              const dayExpense = dayTrans.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

              return (
                <div key={day} className={`min-h-[${isWorkspace ? '40px' : '80px'}] border border-gray-100 dark:border-gray-700 rounded-lg p-1 text-[10px] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}>
                   <div className="font-bold text-gray-400">{day}</div>
                   {dayIncome > 0 && <div className="text-blue-500 truncate">+{dayIncome.toLocaleString()}</div>}
                   {dayExpense > 0 && <div className="text-red-500 truncate">-{dayExpense.toLocaleString()}</div>}
                </div>
              );
            })}
         </div>
      </div>
    );
  };

  return (
    <div className={isWorkspace ? "w-full space-y-4 p-2" : "max-w-5xl mx-auto space-y-6 pb-20"}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        {!isWorkspace && (
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Wallet className="text-yellow-600" />
            まいつーる家計簿
          </h2>
        )}
        
        <div className={`flex items-center gap-2 bg-white dark:bg-dark-lighter p-1 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${isWorkspace ? 'w-full justify-between' : ''}`}>
           <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><ChevronLeft size={isWorkspace ? 16 : 20} /></button>
           <span className="font-bold px-2 text-center text-gray-800 dark:text-white">{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</span>
           <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><ChevronRight size={isWorkspace ? 16 : 20} /></button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
        {[
           {id: 'dashboard', icon: PieChart, label: 'ホーム'},
           {id: 'calendar', icon: CalendarIcon, label: 'カレンダー'},
           // Hide others in workspace to save space or keep them simple
           ...(!isWorkspace ? [{id: 'subs', icon: RefreshCwOff, label: 'サブスク'}, {id: 'goals', icon: Target, label: '目標'}] : [])
        ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setView(tab.id as any)}
             className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
               view === tab.id 
                 ? 'bg-white dark:bg-gray-700 text-yellow-700 dark:text-yellow-400 shadow-sm' 
                 : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
             }`}
           >
             <tab.icon size={14} />
             {tab.label}
           </button>
        ))}
      </div>

      {/* Main View Area */}
      <div className={isWorkspace ? "flex-1 overflow-y-auto min-h-0" : "min-h-[400px]"}>
        {view === 'dashboard' && <DashboardView />}
        {view === 'calendar' && <CalendarView />}
        {!isWorkspace && view === 'subs' && <div>...</div>} 
        {!isWorkspace && view === 'goals' && <div>...</div>}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className={`fixed bg-yellow-600 text-white rounded-full shadow-xl hover:bg-yellow-700 hover:scale-105 transition-all z-20 flex items-center justify-center ${isWorkspace ? 'bottom-4 right-4 p-3' : 'bottom-8 right-8 p-4'}`}
      >
        <Plus size={isWorkspace ? 24 : 32} />
      </button>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" style={{position: 'absolute'}}>
          <div className="bg-white dark:bg-dark-lighter rounded-2xl w-full max-w-sm p-4 shadow-2xl">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">取引を追加</h3>
            
            <div className="flex gap-2 mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button 
                onClick={() => setNewTrans({...newTrans, type: 'expense'})}
                className={`flex-1 py-1.5 rounded-md font-bold text-xs transition-all ${newTrans.type === 'expense' ? 'bg-red-500 text-white shadow' : 'text-gray-500'}`}
              >支出</button>
              <button 
                onClick={() => setNewTrans({...newTrans, type: 'income'})}
                className={`flex-1 py-1.5 rounded-md font-bold text-xs transition-all ${newTrans.type === 'income' ? 'bg-blue-500 text-white shadow' : 'text-gray-500'}`}
              >収入</button>
            </div>

            <div className="space-y-3">
               <input type="date" value={newTrans.date} onChange={e => setNewTrans({...newTrans, date: e.target.value})} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm" />
               <input type="number" placeholder="金額" value={newTrans.amount || ''} onChange={e => setNewTrans({...newTrans, amount: Number(e.target.value)})} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-lg font-bold" />
               
               <div className="flex flex-wrap gap-1">
                  {(newTrans.type === 'expense' ? CATEGORIES.expense : CATEGORIES.income).map(cat => (
                     <button key={cat} onClick={() => setNewTrans({...newTrans, category: cat})} className={`px-2 py-1 rounded-full text-xs border ${newTrans.category === cat ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'border-gray-200 text-gray-500'}`}>
                        {cat}
                     </button>
                  ))}
               </div>
               
               <input type="text" value={newTrans.note} onChange={e => setNewTrans({...newTrans, note: e.target.value})} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm" placeholder="メモ" />
            </div>

            <div className="flex gap-2 mt-6">
               <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm">キャンセル</button>
               <button onClick={addTransaction} className="flex-1 py-2 bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-700 shadow text-sm">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kakeibo;