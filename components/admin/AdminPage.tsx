
import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, ShieldAlert, Mail, User, Calendar, LogOut, Loader2, 
  Activity, BarChart3, Settings, Eye, Clock, Smartphone, Globe, KeyRound,
  RefreshCw, CheckCircle2, AlertTriangle, XCircle, Timer, Link as LinkIcon,
  Download, Upload, Database, Server
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
  referer?: string;
  status?: number;
  response_time?: number; // ms
}

interface SmtpConfig {
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_pass?: string;
    alert_email: string;
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

  // SMTP Settings State
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
      smtp_host: '', smtp_port: 587, smtp_user: '', alert_email: '', smtp_pass: ''
  });
  const [smtpMsg, setSmtpMsg] = useState('');
  const [smtpLoading, setSmtpLoading] = useState(false);

  // Backup State
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Silent update if stats exist, else show loading
    if (!stats) setDataLoading(true);
    
    try {
      const res = await fetch('./backend/admin_api.php?action=fetch_dashboard', {
        headers: { 'X-Admin-Token': currentToken }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setStats(data.stats);
        if (data.config) {
            setSmtpConfig(prev => ({...prev, ...data.config, smtp_pass: ''})); // Don't show password
        }
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

  const handleUpdateSmtp = async (e: React.FormEvent) => {
      e.preventDefault();
      setSmtpMsg('');
      setSmtpLoading(true);
      if (!token) return;

      try {
          const res = await fetch('./backend/admin_api.php?action=update_smtp', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'X-Admin-Token': token
              },
              body: JSON.stringify(smtpConfig)
          });
          const data = await res.json();
          setSmtpMsg(data.message || '更新しました');
      } catch (e) {
          setSmtpMsg('更新に失敗しました');
      } finally {
          setSmtpLoading(false);
      }
  };

  const handleBackupData = async () => {
    if (!token) return;
    try {
        const res = await fetch('./backend/admin_api.php?action=backup_data', {
            headers: { 'X-Admin-Token': token }
        });
        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `server_data_backup_${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            alert('バックアップに失敗しました');
        }
    } catch (e) {
        alert('通信エラー');
    }
  };

  const handleRestoreData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!token || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    if (!confirm('本当に復元しますか？現在のサーバー上のログやパスワード設定が、このバックアップファイルの内容で上書きされます。')) {
        return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
        try {
            const jsonData = JSON.parse(ev.target?.result as string);
            const res = await fetch('./backend/admin_api.php?action=restore_data', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Admin-Token': token
                },
                body: JSON.stringify({ data: jsonData })
            });
            
            if (res.ok) {
                alert('復元が完了しました。ページをリロードします。');
                window.location.reload();
            } else {
                alert('復元に失敗しました。');
            }
        } catch (err) {
            alert('ファイル形式が不正です。');
        }
    };
    reader.readAsText(file);
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
      // Auto refresh stats every 5 seconds for real-time feel
      const interval = setInterval(() => fetchDashboard(token), 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Helper for Status Badge
  const StatusBadge = ({ code }: { code?: number }) => {
      if (!code || code === 200) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800 border border-green-200"><CheckCircle2 size={10} className="mr-1"/> 200</span>;
      if (code === 404) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200"><AlertTriangle size={10} className="mr-1"/> 404</span>;
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200"><XCircle size={10} className="mr-1"/> {code}</span>;
  };

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
                         <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> アクティブ
                            <span className="text-gray-400 text-[10px] ml-auto">5秒毎に更新</span>
                         </div>
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
                            <BarChart3 size={20} className="text-blue-500" /> アクセス数の多いページ (Top 10)
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
                                     <div className="text-gray-400 flex items-center gap-1">
                                        {new Date(log.timestamp * 1000).toLocaleTimeString()}
                                        <StatusBadge code={log.status} />
                                     </div>
                                  </div>
                                  <div className="text-right">
                                     <div className="font-mono text-gray-500">{log.ip}</div>
                                     {log.response_time && <div className="text-[10px] text-gray-400">{log.response_time}ms</div>}
                                  </div>
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
                      <button onClick={() => fetchDashboard(token!)} className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded hover:bg-gray-200 flex items-center gap-1">
                         <RefreshCw size={12} /> 更新
                      </button>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                         <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase font-bold text-gray-500 dark:text-gray-400">
                            <tr>
                               <th className="px-6 py-3">Time</th>
                               <th className="px-6 py-3">Status</th>
                               <th className="px-6 py-3">Path / Referer</th>
                               <th className="px-6 py-3">IP / UA</th>
                               <th className="px-6 py-3">Load</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {stats.recent_logs.map((log, i) => (
                               <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                  <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500">{log.date}</td>
                                  <td className="px-6 py-3">
                                     <StatusBadge code={log.status} />
                                  </td>
                                  <td className="px-6 py-3">
                                     <div className="flex flex-col">
                                        <span className={`text-xs font-bold ${log.path === '/admin' || log.path.includes('secure') ? 'text-red-600' : 'text-blue-600 dark:text-blue-400'}`}>
                                           {log.path}
                                        </span>
                                        {log.referer && (
                                           <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5 truncate max-w-[200px]" title={log.referer}>
                                              <LinkIcon size={8} /> {log.referer.replace(/^https?:\/\//, '')}
                                           </span>
                                        )}
                                     </div>
                                  </td>
                                  <td className="px-6 py-3">
                                     <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{log.ip}</div>
                                     <div className="text-[10px] text-gray-400 max-w-xs truncate" title={log.ua}>
                                        {log.ua}
                                     </div>
                                  </td>
                                  <td className="px-6 py-3 text-xs font-mono text-gray-500">
                                     {log.response_time ? `${log.response_time}ms` : '-'}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                   
                   {/* SMTP Settings */}
                   <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <Server size={24} className="text-orange-500" />
                            メール通知設定
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            不正アクセス検知などの通知を受け取るメールサーバー(SMTP)の設定です。<br/>
                            Gmail等の場合、アプリパスワードが必要です。
                        </p>
                        
                        <form onSubmit={handleUpdateSmtp} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">SMTP Host</label>
                                <input type="text" value={smtpConfig.smtp_host} onChange={(e) => setSmtpConfig({...smtpConfig, smtp_host: e.target.value})} placeholder="smtp.gmail.com" className="w-full p-2 rounded border dark:bg-gray-900 dark:border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">SMTP Port</label>
                                <input type="number" value={smtpConfig.smtp_port} onChange={(e) => setSmtpConfig({...smtpConfig, smtp_port: Number(e.target.value)})} placeholder="587" className="w-full p-2 rounded border dark:bg-gray-900 dark:border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">User / Email</label>
                                <input type="text" value={smtpConfig.smtp_user} onChange={(e) => setSmtpConfig({...smtpConfig, smtp_user: e.target.value})} placeholder="example@gmail.com" className="w-full p-2 rounded border dark:bg-gray-900 dark:border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Password (App Password)</label>
                                <input type="password" value={smtpConfig.smtp_pass} onChange={(e) => setSmtpConfig({...smtpConfig, smtp_pass: e.target.value})} placeholder="********" className="w-full p-2 rounded border dark:bg-gray-900 dark:border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">通知先アドレス</label>
                                <input type="text" value={smtpConfig.alert_email} onChange={(e) => setSmtpConfig({...smtpConfig, alert_email: e.target.value})} placeholder="my-email@example.com" className="w-full p-2 rounded border dark:bg-gray-900 dark:border-gray-600" />
                            </div>

                            {smtpMsg && <p className="text-sm font-bold text-green-600">{smtpMsg}</p>}

                            <button 
                                type="submit" 
                                disabled={smtpLoading}
                                className="w-full py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors flex justify-center items-center gap-2"
                            >
                                {smtpLoading ? <Loader2 className="animate-spin" size={16} /> : '保存してテスト送信'}
                            </button>
                        </form>
                   </div>

                   {/* Server Data Backup/Restore */}
                   <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <Database size={24} className="text-indigo-500" />
                            サーバーデータ管理
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            サーバー上の設定・ログ・メッセージデータをバックアップまたは復元します。
                        </p>
                        
                        <div className="space-y-4">
                            <button 
                                onClick={handleBackupData}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow flex items-center justify-center gap-2"
                            >
                                <Download size={20} /> バックアップをダウンロード
                            </button>
                            
                            <div className="relative">
                                <input 
                                    type="file" 
                                    accept=".json"
                                    ref={fileInputRef}
                                    onChange={handleRestoreData}
                                    className="hidden"
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-3 bg-white dark:bg-gray-700 border-2 border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-300 font-bold rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Upload size={20} /> データを復元
                                </button>
                            </div>
                        </div>
                   </div>

                   {/* Password Change */}
                   <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
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
                </div>
             )}
           </>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
