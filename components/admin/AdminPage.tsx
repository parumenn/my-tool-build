
import React, { useState, useEffect } from 'react';
import { 
  Lock, ShieldAlert, Mail, User, Calendar, LogOut, Loader2, 
  Activity, BarChart3, Settings, Eye, Clock, Smartphone, Globe, KeyRound 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Message {
  id: string;
  timestamp: string;
  ip: string;
  name: string;
  contact: string;
  message: string;
}

interface AccessLog {
  timestamp: number;
  date: string;
  ip: string;
  path: string;
  ua: string;
}

interface DashboardStats {
  total_pv: number;
  today_pv: number;
  week_pv: number;
  realtime_5min: number;
  by_path: Record<string, number>;
  recent_logs: AccessLog[];
}

const AdminPage: React.FC = () => {
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('admin_token'));
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'messages' | 'settings'>('dashboard');
  
  // Login State
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Data State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Password Change State
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');

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

      if (res.ok && data.token) {
        setToken(data.token);
        sessionStorage.setItem('admin_token', data.token);
        fetchDashboard(data.token);
      } else {
        setLoginError(data.error || 'ログインに失敗しました');
      }
    } catch (err) {
      setLoginError('サーバー接続エラー');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fetchDashboard = async (currentToken: string) => {
    setDataLoading(true);
    try {
      const res = await fetch('./backend/admin_api.php?action=fetch_dashboard', {
        headers: { 'X-Admin-Token': currentToken }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setStats(data.stats);
      } else {
        logout();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDataLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg('');
    setPwdError('');
    if (!token) return;

    try {
      const res = await fetch('./backend/admin_api.php?action=change_password', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-Admin-Token': token
        },
        body: JSON.stringify({ current_password: currentPwd, new_password: newPwd })
      });
      const data = await res.json();
      
      if (res.ok) {
          setPwdMsg('パスワードを変更しました');
          setCurrentPwd('');
          setNewPwd('');
      } else {
          setPwdError(data.error || '変更に失敗しました');
      }
    } catch (e) {
        setPwdError('通信エラー');
    }
  };

  const logout = () => {
    setToken(null);
    sessionStorage.removeItem('admin_token');
    setMessages([]);
    setStats(null);
  };

  useEffect(() => {
    if (token) {
      fetchDashboard(token);
      // Auto refresh stats every 30s
      const interval = setInterval(() => fetchDashboard(token), 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // --- LOGIN SCREEN ---
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                <Lock size={32} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">管理者ログイン</h2>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-8">
              ※5回連続失敗で15分間ロックされます
            </p>

            <form onSubmit={handleLogin} className="space-y-6">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-lg focus:ring-2 focus:ring-red-500 outline-none dark:text-white"
                autoFocus
              />
              {loginError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm font-bold rounded-lg flex items-center gap-2">
                  <ShieldAlert size={16} /> {loginError}
                </div>
              )}
              <button
                type="submit"
                disabled={isLoggingIn || !password}
                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoggingIn ? <Loader2 className="animate-spin" /> : 'ログイン'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD UI ---
  const chartData = stats ? Object.entries(stats.by_path).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="text-red-500" />
            <span className="hidden sm:inline">管理者ダッシュボード</span>
          </h1>
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
             <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-500'}`}>概要</button>
             <button onClick={() => setActiveTab('logs')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'logs' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-500'}`}>ログ</button>
             <button onClick={() => setActiveTab('messages')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'messages' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-500'}`}>受信箱</button>
             <button onClick={() => setActiveTab('settings')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-500'}`}>設定</button>
          </div>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><LogOut size={20} /></button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {dataLoading && !stats ? (
           <div className="text-center py-20 text-gray-400">
              <Loader2 className="animate-spin mx-auto mb-2" size={32} />
              Loading...
           </div>
        ) : (
           <>
             {/* --- DASHBOARD TAB --- */}
             {activeTab === 'dashboard' && stats && (
                <div className="space-y-6 animate-fade-in">
                   {/* Stats Cards */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                         <div className="absolute right-0 top-0 p-4 opacity-10"><Activity size={64} /></div>
                         <p className="text-sm font-bold text-gray-500 dark:text-gray-400">リアルタイム (5分)</p>
                         <p className="text-4xl font-black text-green-500 mt-2">{stats.realtime_5min}</p>
                         <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> アクティブ</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                         <p className="text-sm font-bold text-gray-500 dark:text-gray-400">今日のPV</p>
                         <p className="text-4xl font-black text-blue-600 dark:text-blue-400 mt-2">{stats.today_pv.toLocaleString()}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                         <p className="text-sm font-bold text-gray-500 dark:text-gray-400">今週のPV</p>
                         <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400 mt-2">{stats.week_pv.toLocaleString()}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                         <p className="text-sm font-bold text-gray-500 dark:text-gray-400">累計PV</p>
                         <p className="text-4xl font-black text-gray-800 dark:text-white mt-2">{stats.total_pv.toLocaleString()}</p>
                      </div>
                   </div>

                   {/* Charts Area */}
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                         <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <BarChart3 size={20} className="text-blue-500" /> 人気ページ (Top 10)
                         </h3>
                         <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
                                  <XAxis type="number" hide />
                                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10, fill: '#9ca3af'}} />
                                  <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', background: '#1f2937', color: '#fff' }}
                                    cursor={{fill: 'rgba(0,0,0,0.05)'}}
                                  />
                                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                               </BarChart>
                            </ResponsiveContainer>
                         </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                         <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-orange-500" /> 最新のアクティビティ
                         </h3>
                         <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                            {stats.recent_logs.slice(0, 8).map((log, i) => (
                               <div key={i} className="flex justify-between items-center text-xs pb-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                  <div>
                                     <div className="font-bold text-gray-700 dark:text-gray-300 truncate w-32">{log.path}</div>
                                     <div className="text-gray-400">{new Date(log.timestamp * 1000).toLocaleTimeString()}</div>
                                  </div>
                                  <div className="text-right font-mono text-gray-500">{log.ip}</div>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
             )}

             {/* --- LOGS TAB --- */}
             {activeTab === 'logs' && stats && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in">
                   <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                         <Activity size={20} className="text-indigo-500" /> アクセスログ (最新100件)
                      </h3>
                      <button onClick={() => fetchDashboard(token!)} className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded hover:bg-gray-200">更新</button>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                         <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase font-bold text-gray-500 dark:text-gray-400">
                            <tr>
                               <th className="px-6 py-3">Time</th>
                               <th className="px-6 py-3">IP Address</th>
                               <th className="px-6 py-3">Path</th>
                               <th className="px-6 py-3">User Agent</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {stats.recent_logs.map((log, i) => (
                               <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                  <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500">{log.date}</td>
                                  <td className="px-6 py-3 font-mono text-indigo-600 dark:text-indigo-400">{log.ip}</td>
                                  <td className="px-6 py-3">
                                     <span className={`px-2 py-1 rounded text-xs font-bold ${log.path === '/admin' || log.path.includes('secure') ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                        {log.path}
                                     </span>
                                  </td>
                                  <td className="px-6 py-3 text-xs text-gray-400 max-w-xs truncate" title={log.ua}>
                                     {log.ua}
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             )}

             {/* --- MESSAGES TAB --- */}
             {activeTab === 'messages' && (
                <div className="space-y-4 animate-fade-in">
                   {messages.length === 0 ? (
                      <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl text-center text-gray-400">メッセージはありません</div>
                   ) : (
                      messages.map((msg) => (
                         <div key={msg.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between mb-4">
                               <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-500">
                                     <User size={20} />
                                  </div>
                                  <div>
                                     <p className="font-bold">{msg.name}</p>
                                     <p className="text-xs text-gray-500">{msg.contact}</p>
                                  </div>
                               </div>
                               <div className="text-right text-xs text-gray-400">
                                  <div>{msg.timestamp}</div>
                                  <div className="font-mono">{msg.ip}</div>
                               </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-sm whitespace-pre-wrap leading-relaxed">
                               {msg.message}
                            </div>
                         </div>
                      ))
                   )}
                </div>
             )}

             {/* --- SETTINGS TAB --- */}
             {activeTab === 'settings' && (
                <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in">
                   <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                      <Settings size={24} className="text-gray-400" />
                      管理者設定
                   </h3>
                   
                   <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-sm rounded-xl border border-yellow-100 dark:border-yellow-800 flex items-start gap-3">
                      <ShieldAlert size={20} className="shrink-0 mt-0.5" />
                      <div>
                         <p className="font-bold mb-1">セキュリティに関する注意</p>
                         <p>パスワードは定期的に変更してください。8文字以上の推測されにくいパスワードを推奨します。</p>
                      </div>
                   </div>

                   <form onSubmit={handleChangePassword} className="space-y-6">
                      <div>
                         <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">現在のパスワード</label>
                         <input 
                           type="password" 
                           value={currentPwd}
                           onChange={(e) => setCurrentPwd(e.target.value)}
                           className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">新しいパスワード</label>
                         <input 
                           type="password" 
                           value={newPwd}
                           onChange={(e) => setNewPwd(e.target.value)}
                           className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                         />
                      </div>

                      {pwdMsg && <p className="text-green-600 font-bold text-sm flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> {pwdMsg}</p>}
                      {pwdError && <p className="text-red-500 font-bold text-sm flex items-center gap-2"><ShieldAlert size={14} /> {pwdError}</p>}

                      <button 
                        type="submit" 
                        disabled={!currentPwd || !newPwd}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                         <KeyRound size={18} /> パスワードを変更
                      </button>
                   </form>
                </div>
             )}
           </>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
