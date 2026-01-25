
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Lock, ShieldAlert, Mail, User, LogOut, Loader2, 
  Activity, BarChart3, Settings, Clock, Shield, KeyRound,
  RefreshCw, CheckCircle2, AlertTriangle, XCircle, Trash2, 
  Download, Upload, Database, Server, Zap, ShieldCheck,
  TrendingUp, ListOrdered, FileJson, Send, Plus, Minus, Infinity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface Message { id: string; timestamp: string; ip: string; name: string; contact: string; message: string; }
interface AccessLog { timestamp: number; date: string; ip: string; path: string; ua: string; status?: number; duration?: number; }
interface DosPattern { count: number; seconds: number; block_minutes: number; }
interface AdminConfig {
  smtp_host: string; smtp_port: number; smtp_user: string; smtp_pass?: string; alert_email: string;
  dos_patterns: DosPattern[];
  dos_notify_enabled: boolean;
}

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

  // 設定フォーム
  const [config, setConfig] = useState<AdminConfig>({
    smtp_host: '', smtp_port: 587, smtp_user: '', smtp_pass: '', alert_email: '',
    dos_patterns: [{ count: 30, seconds: 30, block_minutes: 15 }],
    dos_notify_enabled: true
  });
  const [configMsg, setConfigMsg] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const chartData = useMemo(() => {
    const hours: Record<string, number> = {};
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600000);
      hours[`${d.getHours()}:00`] = 0;
    }
    stats.recent_logs.forEach(log => {
      const logDate = new Date(log.timestamp * 1000);
      const label = `${logDate.getHours()}:00`;
      if (hours[label] !== undefined) hours[label]++;
    });
    return Object.entries(hours).map(([name, pv]) => ({ name, pv }));
  }, [stats.recent_logs]);

  const fetchData = async (isFirst = false) => {
    if (!token) return;
    if (isFirst) setIsLoading(true);
    try {
      const res = await fetch('./backend/admin_api.php?action=fetch_dashboard', {
        headers: { 'X-Admin-Token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setMessages(data.messages);
        setBlockedIps(data.blocked_ips || {});
        
        if (isFirst) {
            setConfig(prev => ({ ...prev, ...data.config, smtp_pass: '' }));
            setIsDirty(false);
        }
      } else {
        if (res.status === 403) logout();
      }
    } catch (e) {
      console.error("Fetch error", e);
    } finally {
      setIsLoading(false);
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
        // 解除成功後、即座に再取得して反映
        fetchData(false);
      }
    } catch (e) {
      alert('解除に失敗しました。');
    }
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
      // PVのリアルタイム更新（5秒間隔）
      const interval = setInterval(() => fetchData(false), 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  if (!token) return (
    <div className="fixed inset-0 z-[200] bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10 text-center animate-scale-up">
        <div className="inline-flex p-4 bg-red-50 text-red-600 rounded-full mb-6"><Lock size={32} /></div>
        <h2 className="text-2xl font-black mb-2 dark:text-white">管理者ログイン</h2>
        <p className="text-gray-400 text-xs mb-6 uppercase tracking-widest font-bold">Secure Admin Console</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="パスワード" className="w-full p-4 rounded-2xl border-2 dark:bg-gray-900 dark:text-white outline-none focus:border-red-500 transition-all" autoFocus />
          {loginError && <p className="text-red-500 text-sm font-bold animate-pulse">{loginError}</p>}
          <button type="submit" disabled={isLoggingIn} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all">
            {isLoggingIn ? <Loader2 className="animate-spin" /> : 'AUTHENTICATE'}
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
            ADMIN CONSOLE <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-normal">v2.5.2</span>
          </h1>
        </div>
        <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-xl">
           {['dashboard', 'logs', 'messages', 'security', 'settings'].map(t => (
             <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap ${activeTab === t ? 'bg-white text-slate-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                {t === 'dashboard' ? 'STATISTICS' : t === 'logs' ? 'LOGS' : t === 'messages' ? 'INBOX' : t === 'security' ? 'IP BLOCK' : 'SMTP'}
             </button>
           ))}
        </div>
        <button onClick={logout} className="p-2 text-gray-400 hover:text-red-400 transition-colors"><LogOut size={20} /></button>
      </header>

      {/* メインエリア（全画面スクロール） */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 no-scrollbar bg-slate-50 dark:bg-dark">
        {activeTab === 'dashboard' && (
           <div className="space-y-6 animate-fade-in max-w-7xl mx-auto w-full">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 {[
                   { label: '本日PV (Real-time)', val: stats.today_pv, color: 'text-blue-600', icon: Activity },
                   { label: '累計PV', val: stats.total_pv, color: 'text-indigo-600', icon: BarChart3 },
                   { label: 'メッセージ', val: messages.length, color: 'text-pink-600', icon: Mail },
                   { label: '遮断中のIP', val: Object.keys(blockedIps).length, color: 'text-red-600', icon: Shield }
                 ].map((card, i) => (
                    <div key={i} className="bg-white dark:bg-dark-lighter p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between hover:shadow-md transition-shadow">
                       <div className="flex justify-between items-start mb-4">
                          <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">{card.label}</p>
                          <card.icon size={16} className="text-gray-300" />
                       </div>
                       <p className={`text-3xl font-black ${card.color} font-mono tabular-nums`}>{card.val.toLocaleString()}</p>
                    </div>
                 ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-white dark:bg-dark-lighter p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                       <h3 className="font-black text-lg flex items-center gap-2 uppercase tracking-tight"><TrendingUp size={18} className="text-blue-500" /> 24時間の推移</h3>
                       <div className="flex items-center gap-2 text-[10px] font-black text-gray-400">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          LIVE TRAFFIC
                       </div>
                    </div>
                    <div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} /><YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} /><Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold'}} /><Area type="monotone" dataKey="pv" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorPv)" animationDuration={1000} /></AreaChart></ResponsiveContainer></div>
                 </div>
                 <div className="bg-white dark:bg-dark-lighter p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="font-black text-lg uppercase tracking-tight">Recent Activity</h3>
                       <RefreshCw size={14} className={`text-gray-300 ${isLoading ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">{stats.recent_logs.slice(0, 10).map((log, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px] p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors border-b dark:border-gray-800 last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-blue-600 truncate">{log.path}</p>
                          <p className="text-gray-400 font-mono text-[9px]">{log.ip}</p>
                        </div>
                        <p className="text-gray-500 font-bold ml-4 tabular-nums">{log.date.split(' ')[1]}</p>
                      </div>
                    ))}</div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'security' && (
           <div className="animate-fade-in max-w-7xl mx-auto w-full space-y-8">
              <div className="bg-white dark:bg-dark-lighter rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                 <div className="p-8 border-b dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
                    <div>
                       <h3 className="font-black text-xl flex items-center gap-3"><XCircle className="text-red-500" /> BLOCKED IP LIST</h3>
                       <p className="text-xs text-gray-400 mt-1 font-bold">過剰アクセスや手動遮断により制限されているIPアドレス</p>
                    </div>
                    <button onClick={() => fetchData(false)} className="p-3 bg-white dark:bg-gray-700 text-gray-500 rounded-2xl shadow-sm hover:text-blue-500 transition-all active:scale-95">
                       <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                          <tr>
                             <th className="px-8 py-5">Client IP</th>
                             <th className="px-8 py-5">Reason / Trigger</th>
                             <th className="px-8 py-5">Remaining Time</th>
                             <th className="px-8 py-5 text-right">Action</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {Object.keys(blockedIps).length === 0 ? (
                             <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-black text-sm uppercase tracking-widest">No blocked IPs found</td></tr>
                          ) : Object.entries(blockedIps).map(([ip, item]: [string, any]) => {
                             const isPerm = item.expiry >= 2147483640;
                             const timeLeft = Math.ceil((item.expiry - (Date.now()/1000))/60);
                             return (
                                <tr key={ip} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                   <td className="px-8 py-6 font-mono font-black text-red-600">{ip}</td>
                                   <td className="px-8 py-6">
                                      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md font-black">{item.reason || 'MANUAL BLOCK'}</span>
                                      <p className="text-[9px] text-gray-400 mt-1">{item.time}</p>
                                   </td>
                                   <td className="px-8 py-6">
                                      {isPerm ? (
                                         <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 w-fit"><Infinity size={12} /> PERMANENT</span>
                                      ) : (
                                         <span className={`font-black text-xs ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>{timeLeft} Minutes</span>
                                      )}
                                   </td>
                                   <td className="px-8 py-6 text-right">
                                      <button 
                                         onClick={() => handleUnblock(ip)} 
                                         className="px-6 py-2 bg-blue-600 text-white text-[10px] font-black rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95"
                                      >
                                         UNBLOCK
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

        {activeTab === 'logs' && (
           <div className="bg-white dark:bg-dark-lighter rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden animate-fade-in max-w-7xl mx-auto w-full">
              <div className="p-8 border-b dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
                 <h3 className="font-black text-lg uppercase tracking-tight">Access Logs (Last 500)</h3>
                 <button onClick={() => fetchData(false)} className="p-2 text-gray-400 hover:text-blue-500 transition-all"><RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} /></button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                       <tr><th className="px-8 py-5">Timestamp</th><th className="px-8 py-5">Path</th><th className="px-8 py-5">Client IP</th><th className="px-8 py-5">Load</th><th className="px-8 py-5 text-right">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                       {stats.recent_logs.map((log, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                             <td className="px-8 py-4 font-mono text-[11px] whitespace-nowrap text-gray-500">{log.date}</td>
                             <td className="px-8 py-4 font-black text-blue-600 dark:text-blue-400 truncate max-w-[300px]">{log.path}</td>
                             <td className="px-8 py-4 font-mono text-[11px] text-gray-400">{log.ip}</td>
                             <td className="px-8 py-4">
                                <span className={`font-mono text-[11px] font-black ${log.duration && log.duration > 1000 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {log.duration ? `${log.duration}ms` : '--'}
                                </span>
                             </td>
                             <td className="px-8 py-4 text-right"><span className={`px-2 py-0.5 rounded text-[10px] font-black ${log.status && log.status >= 400 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{log.status || 200}</span></td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === 'messages' && (
           <div className="space-y-4 animate-fade-in max-w-5xl mx-auto w-full">
              {messages.length === 0 ? (
                 <div className="text-center py-24 bg-white dark:bg-dark-lighter rounded-[2.5rem] border-2 border-dashed dark:border-gray-800 text-gray-400 font-black uppercase tracking-widest">No messages in inbox</div>
              ) : (
                 messages.map(m => (
                    <div key={m.id} className="bg-white dark:bg-dark-lighter p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow group">
                       <div className="flex flex-col sm:flex-row justify-between mb-6 gap-2">
                          <span className="font-black text-blue-600 flex items-center gap-3">
                             <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-gray-400"><User size={20} /></div>
                             {m.name} <span className="text-[10px] font-normal text-gray-400">({m.contact || 'No contact info'})</span>
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
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in max-w-7xl mx-auto w-full">
              <form onSubmit={handleUpdateSettings} className="space-y-6">
                <div className="bg-white dark:bg-dark-lighter p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                   <h3 className="font-black text-xl mb-4 flex items-center gap-3 uppercase tracking-tight"><Mail className="text-pink-500" /> SMTP CONFIGURATION</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">HOST</label><input type="text" value={config.smtp_host} onChange={e => { setConfig({...config, smtp_host: e.target.value}); setIsDirty(true); }} className="w-full p-4 border dark:bg-gray-900 rounded-2xl font-bold transition-all focus:border-blue-500" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PORT</label><input type="number" value={config.smtp_port} onChange={e => { setConfig({...config, smtp_port: Number(e.target.value)}); setIsDirty(true); }} className="w-full p-4 border dark:bg-gray-900 rounded-2xl font-bold transition-all focus:border-blue-500" /></div>
                   </div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">USERNAME</label><input type="text" value={config.smtp_user} onChange={e => { setConfig({...config, smtp_user: e.target.value}); setIsDirty(true); }} className="w-full p-4 border dark:bg-gray-900 rounded-2xl font-bold transition-all focus:border-blue-500" /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PASSWORD (ONLY TO CHANGE)</label><input type="password" value={config.smtp_pass} onChange={e => { setConfig({...config, smtp_pass: e.target.value}); setIsDirty(true); }} className="w-full p-4 border dark:bg-gray-900 rounded-2xl font-bold transition-all focus:border-blue-500" placeholder="••••••••" /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ALERT EMAIL</label><input type="email" value={config.alert_email} onChange={e => { setConfig({...config, alert_email: e.target.value}); setIsDirty(true); }} className="w-full p-4 border dark:bg-gray-900 rounded-2xl font-bold transition-all focus:border-blue-500" /></div>
                </div>
                
                <button type="submit" className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-[1.5rem] shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-widest">
                   {configMsg ? <CheckCircle2 size={20} /> : <Settings size={20} />} {configMsg || 'SAVE CONFIGURATION'}
                </button>
              </form>

              <div className="space-y-6">
                 <div className="bg-indigo-600 p-10 rounded-[2.5rem] text-white shadow-2xl space-y-8">
                    <div>
                       <h3 className="font-black text-xl mb-1 flex items-center gap-2 uppercase">System Backup</h3>
                       <p className="text-xs opacity-70 font-bold">メッセージとログの外部保存・復元</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <button onClick={() => {
                         const d = { messages, logs: stats.recent_logs };
                         const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], {type:'application/json'})); a.download = `OMNI_BACKUP_${new Date().toISOString().split('T')[0]}.json`; a.click();
                       }} className="py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/20"><Download size={16} /> Export JSON</button>
                       
                       <button onClick={() => fileInputRef.current?.click()} className="py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-all"><Upload size={16} /> Import JSON</button>
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
                       <h3 className="font-black text-lg uppercase tracking-tight">Security Credentials</h3>
                       <p className="text-[10px] text-gray-400 font-bold px-4 mt-2">管理者パスワードの更新が必要です。定期的な変更を強く推奨します。</p>
                    </div>
                    <button className="w-full py-4 border-2 border-slate-900 dark:border-white/20 text-slate-900 dark:text-white font-black rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase tracking-widest text-[10px]">Start Change Wizard</button>
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
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Server Connected</span>
            </div>
            <div className="flex items-center gap-2">
               <Database size={10} className="text-gray-400" />
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Database: JSON/DATA_DIR</span>
            </div>
         </div>
         <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
            Logged in as SuperAdmin • {new Date().toLocaleTimeString()}
         </div>
      </footer>
    </div>
  );
};

export default AdminPage;
