
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { 
  LayoutDashboard, Plus, Calendar as CalendarIcon, PieChart as ChartIcon, 
  TrendingUp, TrendingDown, History, Trash2, X, ChevronLeft, ChevronRight, 
  Wallet, Info, ShieldCheck, Zap, JapaneseYen, Target, Download, RefreshCw, Briefcase
} from 'lucide-react';
import { WorkspaceContext } from '../WorkspaceContext';
import AdBanner from '../AdBanner';

// --- Types ---
type TradeType = 'buy' | 'sell' | 'deposit' | 'withdraw'; 
type Emotion = 'calm' | 'excited' | 'anxious' | 'angry' | 'fear';

interface TradeRecord {
  id: string;
  date: string;
  ticker: string;
  name: string;
  type: TradeType;
  price: number;
  quantity: number;
  pnl: number; // 確定損益 (売却時)
  comment: string;
  strategy: string;
  emotion: Emotion;
}

interface Holding {
  ticker: string;
  name: string;
  quantity: number;
  avgPrice: number;
}

const STRATEGIES = ['順張り', '逆張り', '材料/決算', 'デイトレ', 'スイング', '長期/配当', '優待', 'IPO', 'その他'];
const EMOTIONS = [
  { id: 'calm', label: '冷静', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  { id: 'excited', label: '興奮', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  { id: 'anxious', label: '不安', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  { id: 'angry', label: '怒り', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  { id: 'fear', label: '恐怖', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
];

const StockTracker: React.FC = () => {
  const isWorkspace = useContext(WorkspaceContext);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'calendar' | 'analytics'>('dashboard');
  
  // Data State
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [initialAsset, setInitialAsset] = useState<number>(1000000);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<TradeRecord>>({
    date: new Date().toISOString().split('T')[0],
    type: 'sell',
    emotion: 'calm',
    strategy: '順張り',
    quantity: 100,
    pnl: 0
  });

  // Load Data
  useEffect(() => {
    const savedTrades = localStorage.getItem('stock_trades');
    const savedAsset = localStorage.getItem('stock_initial_asset');
    
    if (savedTrades) {
      try {
        setTrades(JSON.parse(savedTrades));
      } catch (e) {
        setTrades([]);
      }
    } else {
      // サンプルデータ
      setTrades([
        { id: '1', date: '2023-10-01', ticker: '7203', name: 'トヨタ', type: 'buy', price: 2000, quantity: 100, pnl: 0, comment: 'エントリー', strategy: '順張り', emotion: 'calm' },
        { id: '2', date: '2023-10-05', ticker: '7203', name: 'トヨタ', type: 'sell', price: 2150, quantity: 100, pnl: 15000, comment: '利確', strategy: '順張り', emotion: 'excited' },
      ]);
    }

    if (savedAsset) {
      setInitialAsset(Number(savedAsset));
    }
    setIsDataLoaded(true);
  }, []);

  // Save Data
  useEffect(() => {
    if (isDataLoaded) {
      localStorage.setItem('stock_trades', JSON.stringify(trades));
    }
  }, [trades, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) {
      localStorage.setItem('stock_initial_asset', initialAsset.toString());
    }
  }, [initialAsset, isDataLoaded]);

  // --- Calculations ---
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  // 資産計算
  const totalPnl = trades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
  const currentAsset = initialAsset + totalPnl;
  
  // 今月の損益 (Crash Fix: use 0 if undefined)
  const currentMonthPnl = useMemo(() => {
    return trades
      .filter(t => t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
  }, [trades, currentMonthStr]);

  // 勝率など
  const tradeEvents = trades.filter(t => t.type === 'sell' && t.pnl !== 0); // 損益が発生した決済取引のみ
  const winTrades = tradeEvents.filter(t => t.pnl > 0);
  const lossTrades = tradeEvents.filter(t => t.pnl < 0); 
  const winRate = tradeEvents.length > 0 ? (winTrades.length / tradeEvents.length) * 100 : 0;
  
  const totalProfit = winTrades.reduce((s, t) => s + t.pnl, 0);
  const totalLoss = Math.abs(lossTrades.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = totalLoss === 0 ? (totalProfit > 0 ? 99.99 : 0) : (totalProfit / totalLoss);

  // 平均利益・平均損失
  const avgProfit = winTrades.length > 0 ? totalProfit / winTrades.length : 0;
  // const avgLoss = lossTrades.length > 0 ? totalLoss / lossTrades.length : 0; 

  // 保有銘柄の計算 (簡易版: 平均取得単価法)
  const holdings = useMemo(() => {
    const map = new Map<string, {name: string, quantity: number, totalCost: number}>();
    
    // 日付順に処理
    const sorted = [...trades].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    for (const t of sorted) {
      if (!t.ticker) continue;
      const current = map.get(t.ticker) || { name: t.name || t.ticker, quantity: 0, totalCost: 0 };
      
      if (t.type === 'buy') {
        current.quantity += t.quantity;
        current.totalCost += (t.price * t.quantity);
      } else if (t.type === 'sell') {
        // 売却時は平均単価に基づいてコストを減らす（実現損益はpnlで管理されているため在庫のみ計算）
        const avgPrice = current.quantity > 0 ? current.totalCost / current.quantity : 0;
        current.quantity -= t.quantity;
        current.totalCost -= (avgPrice * t.quantity);
      }
      
      // 数量がほぼ0なら削除
      if (current.quantity < 0.0001) map.delete(t.ticker);
      else map.set(t.ticker, current);
    }
    
    return Array.from(map.entries()).map(([ticker, h]) => ({
      ...h,
      ticker,
      avgPrice: h.quantity > 0 ? h.totalCost / h.quantity : 0
    }));
  }, [trades]);

  // チャートデータ生成
  const chartData = useMemo(() => {
    const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // 日付ごとの最終資産をマップに記録
    const dailyAssetMap = new Map<string, number>();
    
    // データがない場合の初期点
    const today = new Date().toISOString().split('T')[0];
    let cumulative = initialAsset;

    if (sorted.length === 0) {
        dailyAssetMap.set(today, initialAsset);
    } else {
        // 最初の取引の前日を初期資産とする
        const firstDateStr = sorted[0].date;
        if(firstDateStr) {
            const firstDate = new Date(firstDateStr);
            if(!isNaN(firstDate.getTime())){
                firstDate.setDate(firstDate.getDate() - 1);
                dailyAssetMap.set(firstDate.toISOString().split('T')[0], initialAsset);
            }
        }
    }

    for (const trade of sorted) {
      cumulative += (Number(trade.pnl) || 0);
      dailyAssetMap.set(trade.date, cumulative);
    }

    // Mapを配列に変換してソート
    return Array.from(dailyAssetMap.entries())
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([date, asset]) => ({ date, asset }));
  }, [trades, initialAsset]);

  // 月次データ
  const monthlyData = useMemo(() => {
      const data: {[key:string]: number} = {};
      trades.forEach(t => {
          if(!t.date) return;
          const m = t.date.slice(0, 7); // YYYY-MM
          data[m] = (data[m] || 0) + (Number(t.pnl) || 0);
      });
      return Object.entries(data).sort().map(([date, pnl]) => ({ date, pnl }));
  }, [trades]);

  // 戦略別損益データ
  const strategyData = useMemo(() => {
    const data: {[key:string]: number} = {};
    trades.forEach(t => {
        if (t.strategy) {
            data[t.strategy] = (data[t.strategy] || 0) + (Number(t.pnl) || 0);
        }
    });
    return Object.entries(data)
        .sort((a, b) => b[1] - a[1]) // 利益順
        .map(([name, value]) => ({ name, value }));
  }, [trades]);

  // CSVダウンロード
  const handleDownloadCsv = () => {
    const header = "ID,日付,銘柄コード,銘柄名,売買区分,価格,株数,損益,戦略,感情,コメント\n";
    const rows = trades.map(t => 
      `"${t.id}","${t.date}","${t.ticker}","${t.name}","${t.type}",${t.price},${t.quantity},${t.pnl},"${t.strategy}","${t.emotion}","${t.comment}"`
    ).join("\n");
    
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trade_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = () => {
    if (confirm('全ての取引データを削除しますか？この操作は取り消せません。')) {
        setTrades([]);
        setInitialAsset(1000000);
        alert('データを初期化しました。');
    }
  };

  // ハンドラ
  const handleAddTrade = () => {
    if (!formData.date) {
        alert('日付は必須です');
        return;
    }
    
    const newTrade: TradeRecord = {
      id: Date.now().toString(),
      date: formData.date,
      ticker: formData.ticker || '',
      name: formData.name || formData.ticker || '取引',
      type: formData.type as TradeType || 'sell',
      price: Number(formData.price) || 0,
      quantity: Number(formData.quantity) || 0,
      pnl: Number(formData.pnl) || 0,
      comment: formData.comment || '',
      strategy: formData.strategy || 'その他',
      emotion: formData.emotion as Emotion || 'calm',
    };

    setTrades(prev => [...prev, newTrade]);
    setIsModalOpen(false);
    
    setFormData({ 
        date: new Date().toISOString().split('T')[0], 
        type: 'sell', 
        emotion: 'calm', 
        strategy: '順張り',
        quantity: 100,
        pnl: 0,
        name: '',
        ticker: '',
        comment: '',
        price: 0
    });
  };

  const deleteTrade = (id: string) => {
    if(confirm("この記録を削除しますか？")) {
        setTrades(trades.filter(t => t.id !== id));
    }
  };

  // --- Sub Components ---

  const StatCard = ({ title, value, sub, colorClass }: any) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
      <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">{title}</span>
      <div className={`text-2xl font-black mt-1 ${colorClass || 'text-gray-800 dark:text-white'}`}>{value}</div>
      {sub && <span className="text-[10px] text-gray-400 mt-1">{sub}</span>}
    </div>
  );

  const Heatmap = () => {
    const today = new Date();
    // 過去90日分
    const days = [];
    for(let i=89; i>=0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    
    return (
        <div className="flex flex-wrap gap-1">
            {days.map(day => {
                const dayTrades = trades.filter(t => t.date === day && t.pnl !== 0);
                const dayPnl = dayTrades.reduce((s, t) => s + t.pnl, 0);
                let bg = 'bg-gray-100 dark:bg-gray-700';
                if (dayPnl > 50000) bg = 'bg-red-500';
                else if (dayPnl > 10000) bg = 'bg-red-400';
                else if (dayPnl > 0) bg = 'bg-red-300';
                else if (dayPnl < -50000) bg = 'bg-emerald-600';
                else if (dayPnl < -10000) bg = 'bg-emerald-500';
                else if (dayPnl < 0) bg = 'bg-emerald-400';
                
                return (
                    <div key={day} className={`w-3 h-3 rounded-sm ${bg}`} title={`${day}: ${dayPnl.toLocaleString()}円`} />
                );
            })}
        </div>
    );
  };

  const CalendarView = () => {
    const [viewDate, setViewDate] = useState(new Date());
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const cells = [];
    for(let i=0; i<firstDay; i++) cells.push(null);
    for(let i=1; i<=daysInMonth; i++) cells.push(i);

    const monthKey = `${year}-${String(month+1).padStart(2,'0')}`;
    const monthPnl = trades
        .filter(t => t.date.startsWith(monthKey))
        .reduce((s,t) => s + Number(t.pnl), 0);

    return (
        <div className="animate-fade-in bg-white dark:bg-gray-800 p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg md:text-xl text-gray-800 dark:text-white flex items-center gap-2">
                    <CalendarIcon className="text-indigo-500" /> 
                    {year}年{month+1}月
                    <span className={`text-sm ml-2 font-mono ${monthPnl >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        ({monthPnl > 0 ? '+' : ''}{monthPnl.toLocaleString()})
                    </span>
                </h3>
                <div className="flex gap-2">
                    <button onClick={() => setViewDate(new Date(year, month-1, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"><ChevronLeft size={20}/></button>
                    <button onClick={() => setViewDate(new Date())} className="text-xs font-bold px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">今月</button>
                    <button onClick={() => setViewDate(new Date(year, month+1, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"><ChevronRight size={20}/></button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 md:gap-2">
                {['日','月','火','水','木','金','土'].map((d,i) => (
                    <div key={d} className={`text-center text-xs font-bold py-2 ${i===0?'text-red-400':i===6?'text-blue-400':'text-gray-400'}`}>{d}</div>
                ))}
                {cells.map((d, i) => {
                    if(!d) return <div key={i} className="h-16 md:h-24 bg-transparent"></div>;
                    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                    const dailyData = trades.filter(t => t.date === dateStr);
                    const dailyPnl = dailyData.reduce((s,t) => s+t.pnl, 0);
                    const isToday = new Date().toISOString().slice(0,10) === dateStr;
                    
                    return (
                        <div key={i} className={`h-16 md:h-24 p-1 md:p-2 border rounded-xl flex flex-col justify-between transition-all hover:shadow-md ${dailyData.length > 0 ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600' : 'bg-transparent border-transparent'} ${isToday ? 'ring-2 ring-indigo-500' : ''}`}>
                            <span className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400">{d}</span>
                            {dailyData.length > 0 && (
                                <>
                                    <div className={`text-right font-black text-[10px] md:text-sm ${dailyPnl > 0 ? 'text-red-500' : dailyPnl < 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                                        {dailyPnl !== 0 && (dailyPnl > 0 ? '+' : '') + (Math.abs(dailyPnl) >= 1000000 ? (dailyPnl/10000).toFixed(0)+'万' : dailyPnl.toLocaleString())}
                                    </div>
                                    <div className="flex justify-end gap-0.5 md:gap-1 mt-1">
                                        {dailyData.some(t=>t.type==='buy') && <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-blue-400"></div>}
                                        {dailyData.some(t=>t.type==='sell') && <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-red-400"></div>}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  return (
    <div className={`mx-auto h-full flex flex-col ${isWorkspace ? 'w-full p-2' : 'max-w-6xl space-y-6 pb-20'}`}>
      
      {!isWorkspace && (
        <div className="flex justify-between items-center shrink-0">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <TrendingUp className="text-indigo-500" /> 株トレード記録
            </h2>
            <div className="flex gap-2">
                <button onClick={() => setIsSettingOpen(true)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    設定
                </button>
            </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto no-scrollbar shrink-0">
        {[
           {id: 'dashboard', icon: LayoutDashboard, label: 'ホーム'},
           {id: 'history', icon: History, label: '履歴'},
           {id: 'calendar', icon: CalendarIcon, label: 'カレンダー'},
           {id: 'analytics', icon: ChartIcon, label: '分析'}
        ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
               activeTab === tab.id 
                 ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                 : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
             }`}
           >
             <tab.icon size={16} />
             {tab.label}
           </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="総資産評価額" value={`¥${currentAsset.toLocaleString()}`} colorClass="text-indigo-600 dark:text-indigo-400" />
                    <StatCard title="今月の損益" value={`¥${(currentMonthPnl || 0).toLocaleString()}`} colorClass={(currentMonthPnl || 0) >= 0 ? 'text-red-500' : 'text-emerald-500'} />
                    <StatCard title="勝率" value={`${winRate.toFixed(1)}%`} sub={`${winTrades.length}勝 ${lossTrades.length}敗`} />
                    <StatCard title="PF / リスクリワード" value={profitFactor.toFixed(2)} sub={`Avg Win: ¥${Math.round(avgProfit).toLocaleString()}`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 h-80">
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><TrendingUp size={18}/> 資産推移</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="date" tick={{fontSize: 10}} tickFormatter={(val) => val.slice(5)} stroke="#9ca3af" />
                                <YAxis tick={{fontSize: 10}} tickFormatter={(val) => `${val/10000}万`} width={40} domain={['auto', 'auto']} stroke="#9ca3af" />
                                <Tooltip 
                                    formatter={(val: number) => `¥${val.toLocaleString()}`} 
                                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255,255,255,0.9)'}} 
                                />
                                <Line type="monotone" dataKey="asset" stroke="#4f46e5" strokeWidth={3} dot={false} activeDot={{r: 6}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><History size={18}/> アクティビティ</h3>
                        <div className="mb-4">
                            <Heatmap />
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 uppercase">直近の取引</h4>
                            {trades.slice(-5).reverse().map(t => (
                                <div key={t.id} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                                    <div>
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded mr-2 ${t.type === 'buy' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>{t.type === 'buy' ? '買' : t.type === 'sell' ? '売' : t.type}</span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{t.name}</span>
                                    </div>
                                    <div className={`font-bold ${t.pnl > 0 ? 'text-red-500' : t.pnl < 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                                        {t.pnl !== 0 ? (t.pnl > 0 ? '+' : '') + t.pnl.toLocaleString() : '-'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'history' && (
            <div className="animate-fade-in bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 dark:text-gray-300">取引履歴一覧</h3>
                    <button 
                        onClick={handleDownloadCsv}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors"
                    >
                        <Download size={14} /> CSV出力
                    </button>
                </div>
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-bold sticky top-0">
                            <tr>
                                <th className="p-4 whitespace-nowrap">日付</th>
                                <th className="p-4 whitespace-nowrap">銘柄</th>
                                <th className="p-4 whitespace-nowrap">売買</th>
                                <th className="p-4 whitespace-nowrap text-right">価格(円)</th>
                                <th className="p-4 whitespace-nowrap text-right">株数</th>
                                <th className="p-4 whitespace-nowrap text-right">損益</th>
                                <th className="p-4 whitespace-nowrap">戦略/感情</th>
                                <th className="p-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {[...trades].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="p-4 font-mono text-gray-600 dark:text-gray-400">{t.date}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-800 dark:text-white">{t.name}</div>
                                        <div className="text-xs text-gray-400 font-mono">{t.ticker}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            t.type === 'buy' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                            t.type === 'sell' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {t.type === 'buy' ? '買付' : t.type === 'sell' ? '売却' : t.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-mono text-gray-700 dark:text-gray-300">{t.price.toLocaleString()}</td>
                                    <td className="p-4 text-right font-mono text-gray-700 dark:text-gray-300">{t.quantity.toLocaleString()}</td>
                                    <td className={`p-4 text-right font-mono font-bold ${t.pnl > 0 ? 'text-red-500' : t.pnl < 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                                        {t.pnl !== 0 ? (t.pnl > 0 ? '+' : '') + t.pnl.toLocaleString() : '-'}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded w-fit">{t.strategy}</span>
                                            {t.emotion && <span className="text-[10px] text-gray-400">{t.emotion}</span>}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => deleteTrade(t.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {trades.length === 0 && (
                                <tr><td colSpan={8} className="p-8 text-center text-gray-400">取引データがありません</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'calendar' && <CalendarView />}

        {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 h-80">
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4">月別損益推移</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="date" tick={{fontSize: 10}} stroke="#9ca3af" />
                                <YAxis tickFormatter={(val) => `${val/10000}万`} width={40} stroke="#9ca3af" />
                                <Tooltip formatter={(val: number) => `¥${val.toLocaleString()}`} cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '8px', color:'#333'}} />
                                <Bar dataKey="pnl">
                                    {monthlyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#ef4444' : '#10b981'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 h-80">
                         <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4">戦略別パフォーマンス</h3>
                         <div className="h-full overflow-y-auto no-scrollbar pb-6">
                             {strategyData.length > 0 ? (
                                 <div className="space-y-3">
                                     {strategyData.map((item, idx) => (
                                         <div key={idx} className="flex items-center gap-2">
                                             <div className="w-24 text-xs font-bold text-gray-600 dark:text-gray-400 truncate">{item.name}</div>
                                             <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                                                 {item.value > 0 ? (
                                                     <div className="h-full bg-red-500" style={{width: `${Math.min(Math.abs(item.value)/50000 * 100, 100)}%`}}></div>
                                                 ) : (
                                                     <div className="h-full bg-emerald-500" style={{width: `${Math.min(Math.abs(item.value)/50000 * 100, 100)}%`}}></div>
                                                 )}
                                             </div>
                                             <div className={`w-20 text-right text-xs font-bold ${item.value >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                 {item.value > 0 ? '+' : ''}{item.value.toLocaleString()}
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             ) : (
                                 <div className="h-full flex items-center justify-center text-gray-400 text-sm">データがありません</div>
                             )}
                         </div>
                    </div>
                </div>

                {/* Holdings Analysis */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                        <Briefcase size={18} /> 現在の保有銘柄 (履歴から推定)
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-bold">
                                <tr>
                                    <th className="p-3">銘柄</th>
                                    <th className="p-3 text-right">保有数</th>
                                    <th className="p-3 text-right">平均取得単価</th>
                                    <th className="p-3 text-right">推定投資額</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {holdings.length > 0 ? holdings.map((h, i) => (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="p-3 font-medium text-gray-800 dark:text-gray-200">
                                            {h.name} <span className="text-xs text-gray-400 ml-1">{h.ticker}</span>
                                        </td>
                                        <td className="p-3 text-right font-mono">{h.quantity.toLocaleString()}</td>
                                        <td className="p-3 text-right font-mono">¥{Math.round(h.avgPrice).toLocaleString()}</td>
                                        <td className="p-3 text-right font-mono font-bold">¥{Math.round(h.avgPrice * h.quantity).toLocaleString()}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="p-6 text-center text-gray-400">保有なし</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
      </div>

      <button 
        onClick={() => setIsModalOpen(true)} 
        className={`${isWorkspace ? 'absolute bottom-4 right-4 p-3 shadow-lg' : 'fixed bottom-8 right-8 p-5 shadow-2xl'} bg-indigo-600 text-white rounded-full hover:bg-indigo-700 hover:scale-105 transition-all z-20 flex items-center justify-center active:scale-95`}
      >
        <Plus size={isWorkspace ? 20 : 32} />
      </button>

      {/* Settings Modal */}
      {isSettingOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg text-gray-800 dark:text-white">設定</h3>
                      <button onClick={() => setIsSettingOpen(false)}><X className="text-gray-400" /></button>
                  </div>
                  <div className="space-y-6">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">初期資産 (円)</label>
                          <input 
                            type="number" 
                            value={initialAsset} 
                            onChange={(e) => setInitialAsset(Number(e.target.value))} 
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                          />
                          <p className="text-[10px] text-gray-400 mt-2">※ここに入力した金額をスタート地点として損益を加算します。</p>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                           <button onClick={handleResetData} className="w-full py-2 text-red-500 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-2">
                               <RefreshCw size={14} /> 全データを初期化
                           </button>
                      </div>

                      <button onClick={() => setIsSettingOpen(false)} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">完了</button>
                  </div>
              </div>
          </div>
      )}

      {/* Add Trade Modal */}
      {isModalOpen && (
        <div className={`z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in ${isWorkspace ? 'absolute inset-0' : 'fixed inset-0 bg-black/60'}`}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-800 dark:text-white">取引を記録</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            
            <div className="space-y-4">
                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                    {['buy', 'sell', 'deposit', 'withdraw'].map(t => (
                        <button 
                            key={t} 
                            onClick={() => setFormData({...formData, type: t as TradeType})}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                formData.type === t 
                                ? (t==='buy'?'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow': t==='sell'?'bg-white dark:bg-gray-600 text-red-600 dark:text-red-400 shadow':'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow') 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            {t === 'buy' ? '買付' : t === 'sell' ? '売却' : t === 'deposit' ? '入金' : '出金'}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">日付</label>
                        <input 
                            type="date" 
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                            value={formData.date} 
                            onChange={e => setFormData({...formData, date: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">銘柄コード</label>
                        <input 
                            type="text" 
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                            placeholder="7203" 
                            value={formData.ticker} 
                            onChange={e => setFormData({...formData, ticker: e.target.value})} 
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">銘柄名 / 項目名</label>
                    <input 
                        type="text" 
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                        placeholder="トヨタ自動車" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">約定価格</label>
                        <input 
                            type="number" 
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                            value={formData.price} 
                            onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">株数</label>
                        <input 
                            type="number" 
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                            value={formData.quantity} 
                            onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} 
                        />
                    </div>
                </div>

                {formData.type === 'sell' && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">確定損益 (円)</label>
                        <input 
                            type="number" 
                            className={`w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 font-mono text-xl font-black focus:ring-2 focus:ring-indigo-500 outline-none ${Number(formData.pnl) >= 0 ? 'text-red-500' : 'text-emerald-500'}`} 
                            placeholder="例: 10000 or -5000"
                            value={formData.pnl} 
                            onChange={e => setFormData({...formData, pnl: Number(e.target.value)})} 
                        />
                        <p className="text-[10px] text-gray-400 mt-1 text-right">※マイナスの場合は「-」をつけてください</p>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">戦略・タグ</label>
                    <div className="flex flex-wrap gap-2">
                        {STRATEGIES.map(s => (
                            <button 
                                key={s}
                                type="button"
                                onClick={() => setFormData({...formData, strategy: s})}
                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${formData.strategy === s ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">感情コンディション</label>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {EMOTIONS.map(em => (
                            <button 
                                key={em.id} 
                                type="button"
                                onClick={() => setFormData({...formData, emotion: em.id as Emotion})}
                                className={`flex-1 min-w-[60px] py-1.5 rounded text-xs font-bold transition-all ${formData.emotion === em.id ? em.color + ' shadow-sm ring-1 ring-inset ring-current' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}
                            >
                                {em.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">メモ</label>
                    <textarea 
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm h-20 resize-none focus:ring-2 focus:ring-indigo-500 outline-none" 
                        placeholder="エントリー根拠や反省点..." 
                        value={formData.comment} 
                        onChange={e => setFormData({...formData, comment: e.target.value})} 
                    />
                </div>
            </div>

            <div className="flex gap-3 mt-8">
               <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-500 dark:text-gray-400 text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">キャンセル</button>
               <button onClick={handleAddTrade} className="flex-1 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition-colors">保存する</button>
            </div>
          </div>
        </div>
      )}
      {!isWorkspace && <AdBanner />}
    </div>
  );
};

export default StockTracker;
