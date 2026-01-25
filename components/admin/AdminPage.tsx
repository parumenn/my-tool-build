
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Lock, ShieldAlert, Mail, User, LogOut, Loader2, 
  Activity, BarChart3, Settings, Clock, Shield, KeyRound,
  RefreshCw, CheckCircle2, AlertTriangle, XCircle, Trash2, 
  Download, Upload, Database, Server, Filter, Search, Zap, ShieldCheck,
  TrendingUp, MousePointer2, ListOrdered
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';

interface Message { id: string; timestamp: string; ip: string; name: string; contact: string; message: string; }
interface AccessLog { timestamp: number; date: string; ip: string; path: string; ua: string; status?: number; response_time?: number; }
interface BlockedIp { ip: string; reason: string; time: string; timestamp: number; }
interface SmtpConfig { smtp_host: string; smtp_port: number; smtp_user: string; smtp_pass?: string; alert_email: string; }

interface DashboardStats {
  total_pv: number;
  today_pv: number;
  recent_logs: AccessLog[];
}

const AdminPage: React.FC = () => {
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('admin_token'));
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'messages' | 'security' | 'settings'>('dashboard');
  
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [blockedIps, setBlockedIps] = useState<Record<string, BlockedIp>>({});
  const [dataLoading, setDataLoading] = useState(false);

  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({ smtp_host: '', smtp_port: 587, smtp_user: '', alert_email: '', smtp_pass: '' });
  const [smtpMsg, setSmtpMsg] = useState('');

  // --- ダッシュボード用データ集計 ---
  const chartData = useMemo(() => {
    if (!stats?.recent_logs) return [];
    // 直近24時間の時間別PVを集計
    const hours: Record<string, number> = {};
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600000);
      const label = `${d.getHours()}:00`;
      hours[label] = 0;
    }

    stats.recent_logs.forEach(log => {
      const logDate = new Date(log.timestamp * 1000);
      const label = `${logDate.getHours()}:00`;
      if (hours[label] !== undefined) hours[label]++;
    });

    return Object.entries(hours).map(([name, pv]) => ({ name, pv }));
  }, [stats]);

  const rankingData = useMemo(() => {
    if (!stats?.recent_logs) return [];
    const counts: Record<string, number> = {};
    stats.recent_logs.forEach(log => {
      const path = log.path || '/';
      counts[path] = (counts[path] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [stats]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
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
      } else {
        setLoginError(data.error || 'ログインに失敗しました');
      }
    } catch (err) { setLoginError('サーバーとの通信に失敗しました'); }
    finally { setIsLoggingIn(false); }
  };

  const fetchDashboard = async (isSilent = false) => {
    if (!token) return;
    if (!isSilent) setDataLoading(true);
    try {
      const res = await fetch('./backend/admin_api.php?action=fetch_dashboard', {
        headers: { 'X-Admin-Token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setStats(data.stats);
        setSmtpConfig(prev => ({...prev, ...data.config, smtp_pass: ''}));
      } else {
        logout();
      }
    } catch (e) {} finally { setDataLoading(false); }
  };

  const fetchSecurity = async () => {
    if (!token) return;
    try {
      const res = await fetch('./backend/admin_api.php?action=fetch_security', {
        headers: { 'X-Admin-Token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedIps(data.blocked_ips);
      }
    } catch (e) {}
  };

  const unblockIp = async (ip: string) => {
    if (!token || !confirm(`${ip} の遮断を解除しますか？`)) return;
    try {
      const res = await fetch('./backend/admin_api.php?action=unblock_ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
        body: JSON.stringify({ ip })
      });
      if (res.ok) fetchSecurity();
    } catch (e) {}
  };

  const handleUpdateSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch('./backend/admin_api.php?action=update_smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
        body: JSON.stringify(smtpConfig)
      });
      const data = await res.json();
      setSmtpMsg(data.status === 'success' ? '設定を保存し、テストメールを送信しました。' : 'エラー: ' + data.message);
    } catch (e) { setSmtpMsg('保存に失敗しました。'); }
  };

  const logout = () => { setToken(null); sessionStorage.removeItem('admin_token'); };

  useEffect(() => {
    if (token) {
      fetchDashboard();
      const interval = setInterval(() => fetchDashboard(true), 15000);
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'security') fetchSecurity();
  }, [activeTab]);

  if (!token) return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        <div className="flex justify-center mb-6"><div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600"><Lock size={32} /></div></div>
        <h2 className="text-2xl font-bold text-center mb-2 dark:text-white">管理者ログイン</h2>
        <p className="text-center text-gray-400 text-xs mb-8">まいつーる 管理パネル</p>
        <form onSubmit={handleLogin} className="space-y-6">
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="パスワードを入力" 
            className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:border-red-500 outline-none transition-all" 
            autoFocus 
          />
          {loginError && <p className="text-red-500 text-sm font-bold text-center">{loginError}</p>}
          <button type="submit" disabled={isLoggingIn} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
            {isLoggingIn ? <Loader2 className="animate-spin" /> : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <h1 className="text-xl font-black flex items-center gap-2 text-red-600 shrink-0"><ShieldAlert /> 管理パネル</h1>
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg overflow-x-auto no-scrollbar mx-4 text-xs font-black">
            {[
              { id: 'dashboard', label: 'ダッシュボード' },
              { id: 'logs', label: 'アクセスログ' },
              { id: 'messages', label: 'メッセージ' },
              { id: 'security', label: 'セキュリティ' },
              { id: 'settings', label: '設定' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-5 py-2 rounded-md transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="ログアウト"><LogOut size={20} /></button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6 animate-fade-in">
             {/* 重要指標 */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">本日のPV</p>
                   <p className="text-3xl font-black text-blue-600">{stats.today_pv.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">累計PV</p>
                   <p className="text-3xl font-black text-indigo-600">{stats.total_pv.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">メッセージ受信</p>
                   <p className="text-3xl font-black text-pink-600">{messages.length.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">遮断済みIP</p>
                   <p className="text-3xl font-black text-red-600">{Object.keys(blockedIps).length.toLocaleString()}</p>
                </div>
             </div>

             {/* グラフ & ランキング */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black flex items-center gap-2 text-gray-700 dark:text-gray-200"><TrendingUp size={18} className="text-blue-500" /> アクセス推移 (24時間)</h3>
                      <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-2 py-1 rounded">リアルタイム</span>
                   </div>
                   <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={chartData}>
                            <defs>
                               <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                               </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                              labelStyle={{fontWeight: 'bold', marginBottom: '4px'}}
                            />
                            <Area type="monotone" dataKey="pv" name="ページビュー" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPv)" />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                   <h3 className="font-black flex items-center gap-2 text-gray-700 dark:text-gray-200 mb-6"><ListOrdered size={18} className="text-indigo-500" /> ツール利用ランキング</h3>
                   <div className="space-y-4">
                      {rankingData.map((item, idx) => (
                         <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                               <span className="text-gray-600 dark:text-gray-300 truncate max-w-[150px]">{item.path}</span>
                               <span className="text-indigo-600">{item.count} <span className="text-[10px] text-gray-400">PV</span></span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                               <div 
                                 className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                                 style={{ width: `${Math.min(100, (item.count / (stats.today_pv || 1)) * 100)}%` }}
                               />
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* 直近の活動リスト */}
             <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-black mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-200"><Clock size={18} className="text-orange-500" /> 最新のアクティビティ</h3>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                         {stats.recent_logs.slice(0, 10).map((log, i) => (
                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                               <td className="py-3 px-2 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${log.status && log.status >= 400 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                     {log.status || 200}
                                  </span>
                               </td>
                               <td className="py-3 px-2 text-xs font-mono font-bold text-blue-500 truncate max-w-[200px]">{log.path}</td>
                               <td className="py-3 px-2 text-[10px] text-gray-400 font-mono hidden md:table-cell">{log.ip}</td>
                               <td className="py-3 px-2 text-[10px] text-gray-500 font-black text-right">{log.date}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
                <button onClick={() => setActiveTab('logs')} className="w-full mt-4 py-2 text-xs font-bold text-gray-400 hover:text-blue-500 transition-colors">すべての詳細ログを表示</button>
             </div>
          </div>
        )}

        {activeTab === 'logs' && stats && (
           <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in">
              <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                 <div>
                    <h3 className="font-black text-lg">詳細アクセスログ</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">リアルタイム監視中</p>
                 </div>
                 <button onClick={() => fetchDashboard()} className="p-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-400 hover:text-blue-500 transition-all border border-gray-100 dark:border-gray-600">
                    <RefreshCw size={18} className={dataLoading ? 'animate-spin' : ''} />
                 </button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] uppercase font-black text-gray-400 tracking-wider">
                       <tr>
                          <th className="px-6 py-4">日時 (年月日 時:分:秒.ms)</th>
                          <th className="px-6 py-4">リクエストパス</th>
                          <th className="px-6 py-4">IPアドレス</th>
                          <th className="px-6 py-4">応答速度(ms)</th>
                          <th className="px-6 py-4">ユーザーエージェント</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                       {stats.recent_logs.map((log, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                             <td className="px-6 py-4 font-mono font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap text-xs">{log.date}</td>
                             <td className="px-6 py-4 font-black text-blue-600 dark:text-blue-400 truncate max-w-[200px]">{log.path}</td>
                             <td className="px-6 py-4 font-mono text-[11px] font-bold text-gray-500">{log.ip}</td>
                             <td className="px-6 py-4 font-mono text-[11px] text-orange-500 font-black">{log.response_time || '-'}</td>
                             <td className="px-6 py-4 text-[10px] text-gray-400 truncate max-w-[250px]" title={log.ua}>{log.ua}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-3xl border border-red-100 dark:border-red-800 flex items-center gap-6">
                <div className="p-4 bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300 rounded-2xl">
                   <Shield size={40} />
                </div>
                <div>
                   <h3 className="font-black text-xl text-red-800 dark:text-red-400">DOS攻撃自動保護：有効</h3>
                   <p className="text-sm text-red-700 dark:text-red-300 mt-1 leading-relaxed">
                      1分間に60回以上のアクセスがあったIPを機械的に検出し、自動的に遮断リストに追加します。<br/>
                      遮断実行時は設定された管理者メールアドレスへ即座にアラート通知が送信されます。
                   </p>
                </div>
             </div>

             <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                   <h3 className="font-black flex items-center gap-2 text-lg text-gray-700 dark:text-gray-200"><XCircle className="text-red-500" /> 現在遮断中のIPアドレス</h3>
                   <button onClick={fetchSecurity} className="p-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-400 hover:text-blue-500 border dark:border-gray-600"><RefreshCw size={18} /></button>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] uppercase font-black text-gray-400">
                         <tr><th className="px-6 py-4">IPアドレス</th><th className="px-6 py-4">遮断理由</th><th className="px-6 py-4">遮断日時</th><th className="px-6 py-4">操作</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                         {Object.values(blockedIps).length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold">現在、遮断されているIPはありません</td></tr>
                         ) : Object.values(blockedIps).map((item: any) => (
                            <tr key={item.ip} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                               <td className="px-6 py-4 font-mono font-black text-red-600">{item.ip}</td>
                               <td className="px-6 py-4 text-xs font-bold">{item.reason}</td>
                               <td className="px-6 py-4 text-xs text-gray-400 font-mono">{item.time}</td>
                               <td className="px-6 py-4">
                                  <button onClick={() => unblockIp(item.ip)} className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 hover:bg-blue-100 transition-colors">
                                     <ShieldCheck size={14} /> 遮断を解除する
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'messages' && (
           <div className="space-y-4 animate-fade-in">
              {messages.length === 0 ? (
                 <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-3xl border-4 border-dashed border-gray-100 dark:border-gray-700 text-gray-400 font-black">受信したメッセージはありません</div>
              ) : messages.map(m => (
                 <div key={m.id} className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-pink-200 transition-colors group">
                    <div className="flex flex-col sm:flex-row justify-between mb-6 gap-2">
                       <span className="font-black text-blue-600 flex items-center gap-2 text-lg"><User size={20} className="text-gray-300" /> {m.name} <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-normal">{m.contact}</span></span>
                       <span className="text-[10px] text-gray-400 font-mono bg-gray-50 dark:bg-gray-900 p-1.5 rounded-lg border dark:border-gray-700">{m.timestamp} (IP: {m.ip})</span>
                    </div>
                    <p className="text-[15px] bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700">{m.message}</p>
                 </div>
              ))}
           </div>
        )}

        {activeTab === 'settings' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                 <h3 className="font-black text-xl mb-8 flex items-center gap-3"><Server className="text-orange-500" /> SMTP・通知メール設定</h3>
                 <form onSubmit={handleUpdateSmtp} className="space-y-5">
                    <div><label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">SMTPホスト名</label><input type="text" value={smtpConfig.smtp_host} onChange={e => setSmtpConfig({...smtpConfig, smtp_host: e.target.value})} className="w-full p-3.5 border-2 border-gray-50 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-sm font-bold focus:border-orange-500 outline-none transition-all" placeholder="smtp.gmail.com" /></div>
                    <div className="grid grid-cols-3 gap-4">
                       <div className="col-span-1"><label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">ポート</label><input type="number" value={smtpConfig.smtp_port} onChange={e => setSmtpConfig({...smtpConfig, smtp_port: Number(e.target.value)})} className="w-full p-3.5 border-2 border-gray-50 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-sm font-bold focus:border-orange-500 outline-none transition-all" /></div>
                       <div className="col-span-2"><label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">ユーザー名 / メール</label><input type="text" value={smtpConfig.smtp_user} onChange={e => setSmtpConfig({...smtpConfig, smtp_user: e.target.value})} className="w-full p-3.5 border-2 border-gray-50 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-sm font-bold focus:border-orange-500 outline-none transition-all" /></div>
                    </div>
                    <div><label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">パスワード</label><input type="password" value={smtpConfig.smtp_pass} onChange={e => setSmtpConfig({...smtpConfig, smtp_pass: e.target.value})} placeholder="変更しない場合は空欄のまま" className="w-full p-3.5 border-2 border-gray-50 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-sm font-bold focus:border-orange-500 outline-none transition-all" /></div>
                    <div><label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">アラート送信先 (管理者用)</label><input type="email" value={smtpConfig.alert_email} onChange={e => setSmtpConfig({...smtpConfig, alert_email: e.target.value})} className="w-full p-3.5 border-2 border-gray-50 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-sm font-bold focus:border-orange-500 outline-none transition-all" /></div>
                    {smtpMsg && <p className={`text-xs font-bold ${smtpMsg.includes('エラー') ? 'text-red-500' : 'text-blue-500'} bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border dark:border-gray-700`}>{smtpMsg}</p>}
                    <button type="submit" className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-lg transition-all active:scale-[0.98]">設定を保存してテスト送信</button>
                 </form>
              </div>
              
              <div className="flex flex-col gap-6">
                 <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center text-center">
                    <div className="p-5 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 mb-6"><KeyRound size={48} /></div>
                    <h3 className="font-black text-xl mb-2">管理者パスワードの変更</h3>
                    <p className="text-xs text-gray-400 font-bold mb-8 uppercase tracking-widest leading-relaxed">セキュリティ推奨設定: <br/>90日ごとのパスワード変更を推奨します。</p>
                    <button className="w-full py-3.5 border-2 border-blue-500 text-blue-500 font-black rounded-xl hover:bg-blue-50 transition-all active:scale-[0.98]">パスワード変更を開始する</button>
                 </div>
                 
                 <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                       <div>
                          <h3 className="font-black text-xl mb-1">DBバックアップ</h3>
                          <p className="text-xs opacity-70 font-bold">システムデータの物理エクスポート</p>
                       </div>
                       <Database size={32} className="opacity-30" />
                    </div>
                    <div className="mt-8 flex gap-3">
                       <button className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all">JSON形式で出力</button>
                       <button className="flex-1 py-3 bg-white text-indigo-600 rounded-xl font-black text-sm transition-all shadow-lg">すべてダウンロード</button>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
