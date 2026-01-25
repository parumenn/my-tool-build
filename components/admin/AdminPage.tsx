
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Lock, ShieldAlert, Mail, User, LogOut, Loader2, 
  Activity, BarChart3, Settings, Clock, Shield, KeyRound,
  RefreshCw, CheckCircle2, AlertTriangle, XCircle, Trash2, 
  Download, Upload, Database, Server, Zap, ShieldCheck,
  TrendingUp, ListOrdered, FileJson, Send, Plus, Minus, Infinity,
  ShieldQuestion, ToggleLeft, ToggleRight, Filter, Search, AppWindow,
  PieChart as PieIcon, ArrowUpRight, X
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { TOOLS } from '../../constants/toolsData';

interface Message { id: string; timestamp: string; ip: string; name: string; contact: string; message: string; }
interface AccessLog { timestamp: number; date: string; ip: string; path: string; ua: string; status?: number; duration?: number; }
interface DosPattern { count: number; seconds: number; block_minutes: number; }
interface AdminConfig {
  smtp_host: string; smtp_port: number; smtp_user: string; smtp_pass?: string; alert_email: string;
  dos_patterns: DosPattern[];
  dos_notify_enabled: boolean;
}

const ADMIN_PATH = '/secure-panel-7x9v2';

const AdminPage: React.FC = () => {
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('admin_token'));
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'messages' | 'security' | 'settings'>('dashboard');
  
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [stats, setStats] = useState<{total_pv: number, today_pv: number, recent_logs: AccessLog[]}>({ total_pv: 0, today_pv: 0, recent_logs: [] });
  const [messages, setMessages] = useState<Message[]>([]);
  const [blockedIps, setBlockedIps] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ログフィルター
  const [logFilterIp, setLogFilterIp] = useState('');
  const [logFilterPath, setLogFilterPath] = useState('');
  const [logFilterDate, setLogFilterDate] = useState('');

  // アプリ別モニタリング (Dashboard)
  const [monitoredAppIds, setMonitoredAppIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('admin_monitored_apps');
    return saved ? JSON.parse(saved) : ['qrcode', 'kakeibo', 'bath'];
  });

  useEffect(() => {
    localStorage.setItem('admin_monitored_apps', JSON.stringify(monitoredAppIds));
  }, [monitoredAppIds]);

  // 設定フォーム
  const [config, setConfig] = useState<AdminConfig>({
    smtp_host: '', smtp_port: 587, smtp_user: '', smtp_pass: '', alert_email: '',
    dos_patterns: [{ count: 30, seconds: 30, block_minutes: 15 }],
    dos_notify_enabled: true
  });
  const [configMsg, setConfigMsg] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // アクセス推移チャート
  const chartData = useMemo(() => {
    const hours: Record<string, number> = {};
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600000);
      hours[`${d.getHours()}:00`] = 0;
    }
    stats.recent_logs.forEach(log => {
      const logDate = new Date(log.timestamp * 1000);
      if (isNaN(logDate.getTime())) return;
      const label = `${logDate.getHours()}:00`;
      if (hours[label] !== undefined) hours[label]++;
    });
    return Object.entries(hours).map(([name, pv]) => ({ name, pv }));
  }, [stats.recent_logs]);

  // アプリ別の利用統計算出
  const appStats = useMemo(() => {
    const counts: Record<string, number> = {};
    stats.recent_logs.forEach(log => {
      const tool = TOOLS.find(t => t.path === log.path);
      if (tool) {
        counts[tool.id] = (counts[tool.id] || 0) + 1;
      }
    });
    return counts;
  }, [stats.recent_logs]);

  // ログのフィルタリング
  const filteredLogs = useMemo(() => {
    return stats.recent_logs.filter(log => {
      const matchIp = !logFilterIp || log.ip.includes(logFilterIp);
      const matchPath = !logFilterPath || log.path.toLowerCase().includes(logFilterPath.toLowerCase());
      const matchDate = !logFilterDate || log.date.includes(logFilterDate);
      return matchIp && matchPath && matchDate;
    });
  }, [stats.recent_logs, logFilterIp, logFilterPath, logFilterDate]);

  const fetchData = async (isFirst = false) => {
    if (!token) return;
    if (isFirst) setIsLoading(true);
    if (!isFirst) setIsRefreshing(true);
    try {
      const res = await fetch('./backend/admin_api.php?action=fetch_dashboard', {
        headers: { 'X-Admin-Token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || { total_pv: 0, today_pv: 0, recent_logs: [] });
        setMessages(data.messages || []);
        setBlockedIps(data.blocked_ips || {});
        
        if (isFirst && data.config) {
            setConfig(prev => ({ 
              ...prev, 
              ...data.config, 
              smtp_pass: '',
              dos_patterns: data.config.dos_patterns || [{ count: 30, seconds: 30, block_minutes: 15 }]
            }));
            setIsDirty(false);
        }
      } else {
        if (res.status === 403) logout();
      }
    } catch (e) {
      console.error("Fetch error", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleUpdateSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;
    setConfigMsg('保存中...');
    try {
      const res = await fetch('./backend/admin_api.php?action=update_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setConfigMsg('設定を保存しました。');
        setIsDirty(false);
        setTimeout(() => setConfigMsg(''), 3000);
      } else { setConfigMsg('保存に失敗しました。'); }
    } catch (e) { setConfigMsg('エラーが発生しました。'); }
  };

  const handleUnblock = async (ip: string) => {
    if(!confirm(`${ip} の遮断を解除しますか？`)) return;
    try {
      const res = await fetch(`./backend/admin_api.php?action=unblock_ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token || '' },
        body: JSON.stringify({ ip })
      });
      if (res.ok) {
        fetchData(false);
      }
    } catch (e) {
      alert('解除に失敗しました。');
    }
  };

  const addMonitoredApp = (id: string) => {
    if (!monitoredAppIds.includes(id)) {
      setMonitoredAppIds([...monitoredAppIds, id]);
    }
  };

  const removeMonitoredApp = (id: string) => {
    setMonitoredAppIds(monitoredAppIds.filter(a => a !== id));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const res = await fetch('./backend/admin_api.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        sessionStorage.setItem('admin_token', data.token);
      } else { setLoginError(data.error); }
    } catch (e) { setLoginError('通信エラー'); } finally { setIsLoggingIn(false); }
  };

  const logout = () => { setToken(null); sessionStorage.removeItem('admin_token'); };

  useEffect(() => {
    if (token) {
      fetchData(true);
      const interval = setInterval(() => fetchData(false), 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  if (!token) return (
    <div className="fixed inset-0 z-[200] bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10 text-center animate-scale-up">
        <div className="inline-flex p-4 bg-red-50 text-red-600 rounded-full mb-6"><Lock size={32} /></div>
        <h2 className="text-2xl font-black mb-2 dark:text-white">管理者ログイン</h2>
        <p className="text-gray-400 text-[10px] mb-6 uppercase tracking-widest font-bold">高セキュリティ・管理コンソール</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="パスワードを入力" className="w-full p-4 rounded-2xl border-2 dark:bg-gray-900 dark:text-white outline-none focus:border-red-500 transition-all" autoFocus />
          {loginError && <p className="text-red-500 text-sm font-bold animate-pulse">{loginError}</p>}
          <button type="submit" disabled={isLoggingIn} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all">
            {isLoggingIn ? <Loader2 className="animate-spin" /> : '認証する'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-dark text-slate-800 dark:text-gray-100 flex flex-col fixed inset-0 z-[150] overflow-hidden">
      {/* 独自ヘッダー */}
      <header className="bg-slate-900 text-white border-b border-white/10 h-16 flex items-center justify-between px-6 shrink-0 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-1.5 rounded-lg"><ShieldAlert size={20} /></div>
          <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
            管理コンソール <span className="hidden sm:inline text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-normal">v2.5.2</span>
          </h1>
        </div>
        <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-xl overflow-x-auto no-scrollbar">
           {[
             { id: 'dashboard', label: 'ダッシュボード' },
             { id: 'logs', label: 'アクセスログ' },
             { id: 'messages', label: '受信箱' },
             { id: 'security', label: 'IP制限' },
             { id: 'settings', label: '高度な設定' }
           ].map(t => (
             <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-3 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-black transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-white text-slate-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                {t.label}
             </button>
           ))}
        </div>
        <button onClick={logout} className="p-2 text-gray-400 hover:text-red-400 transition-colors"><LogOut size={20} /></button>
      </header>

      {/* メインエリア */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 space-y-8 no-scrollbar bg-slate-50 dark:bg-dark">
        {activeTab === 'dashboard' && (
           <div className="space-y-10 animate-fade-in max-w-7xl mx-auto w-full pb-20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                 {[
                   { label: '本日PV (リアルタイム)', val: stats.today_pv, color: 'text-blue-600', icon: Activity },
                   { label: '累計アクセス', val: stats.total_pv, color: 'text-indigo-600', icon: BarChart3 },
                   { label: '受信メッセージ', val: messages.length, color: 'text-pink-600', icon: Mail },
                   { label: '遮断中のIP', val: Object.keys(blockedIps).length, color: 'text-red-600', icon: Shield }
                 ].map((card, i) => (
                    <div key={i} className="bg-white dark:bg-dark-lighter p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between hover:shadow-md transition-shadow">
                       <div className="flex justify-between items-start mb-4">
                          <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">{card.label}</p>
                          <card.icon size={16} className="text-gray-300" />
                       </div>
                       <p className={`text-2xl sm:text-3xl font-black ${card.color} font-mono tabular-nums`}>{card.val.toLocaleString()}</p>
                    </div>
                 ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-white dark:bg-dark-lighter p-6 sm:p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                       <h3 className="font-black text-lg flex items-center gap-2 uppercase tracking-tight"><TrendingUp size={18} className="text-blue-500" /> 24時間のアクセス推移</h3>
                       <div className="flex items-center gap-2 text-[10px] font-black text-gray-400">
                          <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-green-500 animate-ping' : 'bg-blue-500'}`}></div>
                          LIVE TRAFFIC
                       </div>
                    </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                          <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold'}} />
                          <Area type="monotone" dataKey="pv" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorPv)" animationDuration={1000} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="bg-white dark:bg-dark-lighter p-6 sm:p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="font-black text-lg uppercase tracking-tight">最近のログ</h3>
                       <RefreshCw size={14} className={`text-gray-300 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
                      {stats.recent_logs.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-gray-400 font-bold">ログがありません</div>
                      ) : (
                        stats.recent_logs.slice(0, 15).map((log, i) => (
                          <div key={i} className={`flex justify-between items-center text-[10px] p-2 rounded-xl transition-colors border-b dark:border-gray-800 last:border-0 ${log.path === ADMIN_PATH ? 'bg-red-50 dark:bg-red-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                            <div className="min-w-0 flex-1">
                              <p className={`font-black truncate ${log.path === ADMIN_PATH ? 'text-red-600' : 'text-blue-600'}`}>{log.path}</p>
                              <p className="text-gray-400 font-mono text-[9px]">{log.ip}</p>
                            </div>
                            <p className="text-gray-500 font-bold ml-4 tabular-nums">{log.date.split(' ')[1]}</p>
                          </div>
                        ))
                      )}
                    </div>
                 </div>
              </div>

              {/* アプリ別モニタリングセクション */}
              <section className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                  <div>
                    <h3 className="text-xl font-black flex items-center gap-3">
                      <AppWindow className="text-indigo-500" /> アプリ別トラフィック監視
                    </h3>
                    <p className="text-xs text-gray-400 font-bold mt-1">選択したツールの利用統計をリアルタイムで表示します</p>
                  </div>
                  
                  <div className="relative">
                    <select 
                      className="appearance-none bg-slate-900 text-white px-6 py-2.5 rounded-2xl text-xs font-black pr-10 cursor-pointer hover:opacity-90 transition-all shadow-lg"
                      onChange={(e) => addMonitoredApp(e.target.value)}
                      value=""
                    >
                      <option value="" disabled>監視アプリを追加...</option>
                      {TOOLS.filter(t => !monitoredAppIds.includes(t.id)).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <Plus size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {monitoredAppIds.map(appId => {
                      const app = TOOLS.find(t => t.id === appId);
                      if (!app) return null;
                      const count = appStats[appId] || 0;
                      const totalAppHits = Object.values(appStats).reduce((a, b) => a + b, 0);
                      const ratio = totalAppHits > 0 ? (count / totalAppHits * 100).toFixed(1) : '0';
                      
                      return (
                        <div key={appId} className="bg-white dark:bg-dark-lighter p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative group animate-scale-up">
                           <button 
                             onClick={() => removeMonitoredApp(appId)}
                             className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                           >
                             <X size={16} />
                           </button>
                           <div className="flex items-center gap-3 mb-6">
                              <div className={`p-3 rounded-2xl ${app.lightBg} dark:bg-gray-800 ${app.color}`}>
                                 <app.icon size={20} />
                              </div>
                              <div className="min-w-0">
                                 <h4 className="font-black text-sm text-gray-800 dark:text-white truncate">{app.name}</h4>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{app.path}</p>
                              </div>
                           </div>
                           <div className="space-y-4">
                              <div className="flex justify-between items-end">
                                 <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Recent Hits</p>
                                    <p className="text-3xl font-black font-mono tabular-nums text-slate-800 dark:text-white">{count}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[10px] font-black text-emerald-500 uppercase flex items-center justify-end gap-1">
                                       Share <ArrowUpRight size={12} />
                                    </p>
                                    <p className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{ratio}%</p>
                                 </div>
                              </div>
                              <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                 <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${Math.min(100, Number(ratio) * 4)}%` }}></div>
                              </div>
                           </div>
                        </div>
                      );
                   })}
                   {monitoredAppIds.length === 0 && (
                     <div className="col-span-full py-16 bg-gray-50 dark:bg-gray-800/30 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 font-bold">
                        <AppWindow size={48} className="mb-4 opacity-20" />
                        <p>アプリをダッシュボードに追加して監視しましょう</p>
                     </div>
                   )}
                </div>
              </section>
           </div>
        )}

        {activeTab === 'logs' && (
           <div className="animate-fade-in max-w-7xl mx-auto w-full space-y-6">
              <div className="bg-white dark:bg-dark-lighter rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                 {/* フィルターセクション */}
                 <div className="p-6 sm:p-8 border-b dark:border-gray-800 bg-slate-50 dark:bg-slate-800/30 space-y-6">
                    <div className="flex justify-between items-center">
                       <h3 className="font-black text-xl flex items-center gap-3 uppercase tracking-tight"><Filter className="text-indigo-500" /> ログフィルタリング</h3>
                       <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Showing {filteredLogs.length} of {stats.recent_logs.length}
                          </span>
                          <button onClick={() => fetchData(false)} className="p-2 text-gray-400 hover:text-blue-500 transition-all">
                             <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                          </button>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input 
                            type="text" 
                            placeholder="IPアドレスで検索..." 
                            value={logFilterIp}
                            onChange={e => setLogFilterIp(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 text-xs font-bold"
                          />
                       </div>
                       <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input 
                            type="text" 
                            placeholder="パスで検索 (例: /bath)" 
                            value={logFilterPath}
                            onChange={e => setLogFilterPath(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 text-xs font-bold"
                          />
                       </div>
                       <div className="relative">
                          <input 
                            type="text" 
                            placeholder="日付で検索 (2025-01-01)" 
                            value={logFilterDate}
                            onChange={e => setLogFilterDate(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 text-xs font-bold"
                          />
                       </div>
                    </div>
                 </div>

                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest sticky top-0 z-10">
                          <tr>
                             <th className="px-8 py-5">日時</th>
                             <th className="px-8 py-5">パス</th>
                             <th className="px-8 py-5">クライアントIP</th>
                             <th className="px-8 py-5">負荷</th>
                             <th className="px-8 py-5 text-right">状態</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {filteredLogs.length === 0 ? (
                             <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-black text-sm uppercase tracking-widest">条件に一致するログはありません</td></tr>
                          ) : (
                             filteredLogs.map((log, i) => (
                                <tr key={i} className={`transition-colors ${log.path === ADMIN_PATH ? 'bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                   <td className="px-8 py-4 font-mono text-[11px] whitespace-nowrap text-gray-500">{log.date}</td>
                                   <td className="px-8 py-4">
                                      <div className="flex items-center gap-2">
                                         <span className={`font-black truncate max-w-[200px] ${log.path === ADMIN_PATH ? 'text-red-600' : 'text-blue-600 dark:text-blue-400'}`}>{log.path}</span>
                                         {log.path === ADMIN_PATH && (
                                            <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase">Admin Access</span>
                                         )}
                                      </div>
                                   </td>
                                   <td className="px-8 py-4 font-mono text-[11px] text-gray-400">{log.ip}</td>
                                   <td className="px-8 py-4">
                                      <span className={`font-mono text-[11px] font-black ${log.duration && log.duration > 1000 ? 'text-red-500' : 'text-emerald-500'}`}>
                                          {log.duration ? `${log.duration}ms` : '--'}
                                      </span>
                                   </td>
                                   <td className="px-8 py-4 text-right">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${log.status && log.status >= 400 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                         {log.status || 200}
                                      </span>
                                   </td>
                                </tr>
                             ))
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'security' && (
           <div className="animate-fade-in max-w-7xl mx-auto w-full space-y-8">
              <div className="bg-white dark:bg-dark-lighter rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                 <div className="p-8 border-b dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
                    <div>
                       <h3 className="font-black text-xl flex items-center gap-3"><XCircle className="text-red-500" /> 遮断中のIPアドレス一覧</h3>
                       <p className="text-xs text-gray-400 mt-1 font-bold">過剰アクセス（DoS保護）や手動操作により制限されているクライアント</p>
                    </div>
                    <button onClick={() => fetchData(false)} className="p-3 bg-white dark:bg-gray-700 text-gray-500 rounded-2xl shadow-sm hover:text-blue-500 transition-all active:scale-95">
                       <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                          <tr>
                             <th className="px-8 py-5">クライアントIP</th>
                             <th className="px-8 py-5">理由 / トリガー</th>
                             <th className="px-8 py-5">残り時間</th>
                             <th className="px-8 py-5 text-right">操作</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {Object.keys(blockedIps).length === 0 ? (
                             <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-black text-sm uppercase tracking-widest">制限中のIPはありません</td></tr>
                          ) : Object.entries(blockedIps).map(([ip, item]: [string, any]) => {
                             const isPerm = item.expiry >= 2147483640;
                             const timeLeft = Math.ceil((item.expiry - (Date.now()/1000))/60);
                             return (
                                <tr key={ip} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                   <td className="px-8 py-6 font-mono font-black text-red-600">{ip}</td>
                                   <td className="px-8 py-6">
                                      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md font-black">{item.reason || '手動遮断'}</span>
                                      <p className="text-[9px] text-gray-400 mt-1">{item.time}</p>
                                   </td>
                                   <td className="px-8 py-6">
                                      {isPerm ? (
                                         <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 w-fit"><Infinity size={12} /> 永久制限</span>
                                      ) : (
                                         <span className={`font-black text-xs ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>{timeLeft} 分</span>
                                      )}
                                   </td>
                                   <td className="px-8 py-6 text-right">
                                      <button 
                                         onClick={() => handleUnblock(ip)} 
                                         className="px-6 py-2 bg-blue-600 text-white text-[10px] font-black rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95"
                                      >
                                         遮断を解除
                                      </button>
                                   </td>
                                </tr>
                             );
                          })}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'messages' && (
           <div className="space-y-4 animate-fade-in max-w-5xl mx-auto w-full pb-20">
              {messages.length === 0 ? (
                 <div className="text-center py-24 bg-white dark:bg-dark-lighter rounded-[2.5rem] border-2 border-dashed dark:border-gray-800 text-gray-400 font-black uppercase tracking-widest">メッセージはありません</div>
              ) : (
                 messages.map(m => (
                    <div key={m.id} className="bg-white dark:bg-dark-lighter p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group">
                       <div className="flex flex-col sm:flex-row justify-between mb-6 gap-2">
                          <span className="font-black text-blue-600 flex items-center gap-3">
                             <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-gray-400"><User size={20} /></div>
                             {m.name} <span className="text-[10px] font-normal text-gray-400">({m.contact || '連絡先なし'})</span>
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border dark:border-gray-700">{m.timestamp} (IP: {m.ip})</span>
                       </div>
                       <p className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl whitespace-pre-wrap leading-relaxed text-sm text-gray-700 dark:text-gray-300 font-medium border dark:border-gray-800">{m.message}</p>
                    </div>
                 ))
              )}
           </div>
        )}

        {activeTab === 'settings' && (
           <div className="animate-fade-in max-w-7xl mx-auto w-full space-y-10 pb-20">
              <form onSubmit={handleUpdateSettings} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SMTP設定 */}
                <div className="bg-white dark:bg-dark-lighter p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                   <h3 className="font-black text-xl mb-4 flex items-center gap-3 uppercase tracking-tight"><Mail className="text-pink-500" /> SMTP 設定 (メール通知)</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ホスト (HOST)</label><input type="text" value={config.smtp_host} onChange={e => { setConfig({...config, smtp_host: e.target.value}); setIsDirty(true); }} className="w-full p-4 border dark:bg-gray-900 rounded-2xl font-bold transition-all focus:border-blue-500" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ポート (PORT)</label><input type="number" value={config.smtp_port} onChange={e => { setConfig({...config, smtp_port: Number(e.target.value)}); setIsDirty(true); }} className="w-full p-4 border dark:bg-gray-900 rounded-2xl font-bold transition-all focus:border-blue-500" /></div>
                   </div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ユーザー名 (USERNAME)</label><input type="text" value={config.smtp_user} onChange={e => { setConfig({...config, smtp_user: e.target.value}); setIsDirty(true); }} className="w-full p-4 border dark:bg-gray-900 rounded-2xl font-bold transition-all focus:border-blue-500" /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">パスワード (変更時のみ入力)</label><input type="password" value={config.smtp_pass} onChange={e => { setConfig({...config, smtp_pass: e.target.value}); setIsDirty(true); }} className="w-full p-4 border dark:bg-gray-900 rounded-2xl font-bold transition-all focus:border-blue-500" placeholder="••••••••" /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">アラート送信先メール</label><input type="email" value={config.alert_email} onChange={e => { setConfig({...config, alert_email: e.target.value}); setIsDirty(true); }} className="w-full p-4 border dark:bg-gray-900 rounded-2xl font-bold transition-all focus:border-blue-500" /></div>
                </div>

                {/* DOS保護設定 */}
                <div className="bg-white dark:bg-dark-lighter p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black text-xl flex items-center gap-3 uppercase tracking-tight"><ShieldCheck className="text-emerald-500" /> DOS攻撃対策設定</h3>
                      <button type="button" onClick={() => setConfig({...config, dos_notify_enabled: !config.dos_notify_enabled})} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${config.dos_notify_enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                         {config.dos_notify_enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                         検知時に通知
                      </button>
                   </div>
                   
                   <p className="text-xs text-gray-400 font-bold mb-4">過剰なリクエストを送信するクライアントを自動的に遮断するルールを定義します。</p>

                   <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 no-scrollbar">
                      {config.dos_patterns.map((p, idx) => (
                         <div key={idx} className="p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 relative group animate-scale-up">
                            <div className="grid grid-cols-3 gap-3">
                               <div>
                                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">期間 (秒)</label>
                                  <input type="number" value={p.seconds} onChange={e => {
                                      const next = [...config.dos_patterns];
                                      next[idx] = { ...next[idx], seconds: Number(e.target.value) };
                                      setConfig({ ...config, dos_patterns: next });
                                      setIsDirty(true);
                                  }} className="w-full p-2 border dark:bg-gray-900 rounded-lg text-sm font-bold" />
                               </div>
                               <div>
                                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">リクエスト数</label>
                                  <input type="number" value={p.count} onChange={e => {
                                      const next = [...config.dos_patterns];
                                      next[idx] = { ...next[idx], count: Number(e.target.value) };
                                      setConfig({ ...config, dos_patterns: next });
                                      setIsDirty(true);
                                  }} className="w-full p-2 border dark:bg-gray-900 rounded-lg text-sm font-bold" />
                               </div>
                               <div>
                                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">遮断 (分)</label>
                                  <input type="number" value={p.block_minutes} onChange={e => {
                                      const next = [...config.dos_patterns];
                                      next[idx] = { ...next[idx], block_minutes: Number(e.target.value) };
                                      setConfig({ ...config, dos_patterns: next });
                                      setIsDirty(true);
                                  }} className="w-full p-2 border dark:bg-gray-900 rounded-lg text-sm font-bold" placeholder="0=永久" />
                                </div>
                            </div>
                            <button type="button" onClick={() => {
                                const next = [...config.dos_patterns];
                                next.splice(idx, 1);
                                setConfig({ ...config, dos_patterns: next });
                                setIsDirty(true);
                            }} className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-full text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                         </div>
                      ))}
                      <button type="button" onClick={() => {
                        setConfig({...config, dos_patterns: [...config.dos_patterns, { count: 50, seconds: 60, block_minutes: 60 }]});
                        setIsDirty(true);
                      }} className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 font-black text-xs hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2"><Plus size={14} /> ルールを追加</button>
                   </div>
                </div>

                <div className="lg:col-span-2">
                   <button type="submit" disabled={!isDirty} className={`w-full py-5 font-black rounded-[1.5rem] shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-widest ${isDirty ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                      {configMsg ? <CheckCircle2 size={20} /> : <Settings size={20} />} {configMsg || '構成設定を保存する'}
                   </button>
                </div>
              </form>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-indigo-600 p-8 sm:p-10 rounded-[2.5rem] text-white shadow-2xl space-y-8">
                    <div>
                       <h3 className="font-black text-xl mb-1 flex items-center gap-2 uppercase">システムバックアップ</h3>
                       <p className="text-xs opacity-70 font-bold">メッセージとアクセスログの外部保存・復元</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <button onClick={() => {
                         const d = { messages, logs: stats.recent_logs };
                         const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], {type:'application/json'})); a.download = `OMNI_BACKUP_${new Date().toISOString().split('T')[0]}.json`; a.click();
                       }} className="py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/20"><Download size={16} /> JSON出力</button>
                       
                       <button onClick={() => fileInputRef.current?.click()} className="py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-all"><Upload size={16} /> JSON読み込み</button>
                       <input type="file" accept=".json" ref={fileInputRef} onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          if (!confirm('データを復元しますか？既存のデータは上書きされます。')) return;
                          const reader = new FileReader();
                          reader.onload = async (ev) => {
                            try {
                               const res = await fetch('./backend/admin_api.php?action=import_data', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token || '' }, body: ev.target?.result as string });
                               if (res.ok) { alert('復元が完了しました。'); fetchData(true); }
                            } catch (err) { alert('エラーが発生しました。'); }
                          };
                          reader.readAsText(file);
                       }} className="hidden" />
                    </div>
                 </div>
                 
                 <div className="bg-white dark:bg-dark-lighter p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm text-center space-y-6">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-blue-600 mx-auto transform rotate-3"><KeyRound size={32} /></div>
                    <div>
                       <h3 className="font-black text-lg uppercase tracking-tight">セキュリティ認証情報</h3>
                       <p className="text-[10px] text-gray-400 font-bold px-4 mt-2">管理者パスワードの更新が必要です。定期的な変更を強く推奨します。</p>
                    </div>
                    <button className="w-full py-4 border-2 border-slate-900 dark:border-white/20 text-slate-900 dark:text-white font-black rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase tracking-widest text-[10px]">パスワード変更ウィザード</button>
                 </div>
              </div>
           </div>
        )}
      </main>
      
      {/* ステータスバー */}
      <footer className="bg-white dark:bg-slate-900 border-t dark:border-gray-800 h-10 px-6 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">サーバー接続済み</span>
            </div>
            <div className="flex items-center gap-2">
               <Database size={10} className="text-gray-400" />
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ストレージ: /data/JSON</span>
            </div>
         </div>
         <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest hidden sm:block">
            スーパー管理者としてログイン中 • {new Date().toLocaleTimeString()}
         </div>
      </footer>
    </div>
  );
};

export default AdminPage;
