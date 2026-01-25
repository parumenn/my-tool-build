import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Lock, ShieldAlert, Mail, User, LogOut, Loader2, 
  Activity, BarChart3, Settings, Clock, Shield, KeyRound,
  RefreshCw, CheckCircle2, AlertTriangle, XCircle, Trash2, 
  Download, Upload, Database, Server, Filter, Search, Zap, ShieldCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
      } else setLoginError(data.error);
    } catch (err) { setLoginError('Connection Error'); }
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
      } else logout();
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
      setSmtpMsg(data.status === 'success' ? 'Settings saved and test mail sent.' : 'Error: ' + data.message);
    } catch (e) { setSmtpMsg('Save failed.'); }
  };

  const logout = () => { setToken(null); sessionStorage.removeItem('admin_token'); };

  useEffect(() => {
    if (token) {
      fetchDashboard();
      const interval = setInterval(() => fetchDashboard(true), 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'security') fetchSecurity();
  }, [activeTab]);

  if (!token) return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-6"><div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600"><Lock size={32} /></div></div>
        <h2 className="text-2xl font-bold text-center mb-8 dark:text-white">Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full p-4 rounded-xl border dark:bg-gray-900 dark:text-white" autoFocus />
          {loginError && <p className="text-red-500 text-sm font-bold text-center">{loginError}</p>}
          <button type="submit" disabled={isLoggingIn} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl flex items-center justify-center gap-2">
            {isLoggingIn ? <Loader2 className="animate-spin" /> : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2 text-red-600"><ShieldAlert /> Admin Panel</h1>
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg overflow-x-auto no-scrollbar">
            {['dashboard', 'logs', 'messages', 'security', 'settings'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-600 shadow text-blue-600' : 'text-gray-500'}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500"><LogOut size={20} /></button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                   <p className="text-xs font-bold text-gray-500">Today PV</p>
                   <p className="text-3xl font-black text-blue-600">{stats.today_pv}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                   <p className="text-xs font-bold text-gray-500">Total PV</p>
                   <p className="text-3xl font-black text-indigo-600">{stats.total_pv}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                   <p className="text-xs font-bold text-gray-500">Messages</p>
                   <p className="text-3xl font-black text-pink-600">{messages.length}</p>
                </div>
             </div>
             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Clock size={18} /> Recent Activity</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                   {stats.recent_logs.map((log, i) => (
                      <div key={i} className="flex justify-between text-xs p-2 border-b last:border-0 dark:border-gray-700">
                         <span className="text-blue-500 font-mono">{log.path}</span>
                         <span className="text-gray-400">{log.ip} - {log.date}</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-800 flex items-center gap-4">
                <Shield size={32} className="text-red-500" />
                <div>
                   <h3 className="font-bold text-red-800 dark:text-red-400">DOS Protection Active</h3>
                   <p className="text-sm text-red-700 dark:text-red-300">1分間に60回以上のアクセスがあったIPを自動的に遮断し、管理者に通知します。</p>
                </div>
             </div>

             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                   <h3 className="font-bold flex items-center gap-2"><XCircle className="text-red-500" /> 遮断中のIPアドレス</h3>
                   <button onClick={fetchSecurity} className="p-2 text-gray-400 hover:text-blue-500"><RefreshCw size={16} /></button>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase font-bold text-gray-500">
                         <tr><th className="px-6 py-3">IP Address</th><th className="px-6 py-3">Reason</th><th className="px-6 py-3">Blocked At</th><th className="px-6 py-3">Action</th></tr>
                      </thead>
                      <tbody className="divide-y dark:divide-gray-700">
                         {Object.values(blockedIps).length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">遮断中のIPはありません</td></tr>
                         ) : Object.values(blockedIps).map((item: BlockedIp) => (
                            // Explicitly typed 'item' as BlockedIp to fix TypeScript 'unknown' inference error.
                            <tr key={item.ip} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                               <td className="px-6 py-4 font-mono font-bold text-red-600">{item.ip}</td>
                               <td className="px-6 py-4 text-xs">{item.reason}</td>
                               <td className="px-6 py-4 text-xs text-gray-400">{item.time}</td>
                               <td className="px-6 py-4">
                                  <button onClick={() => unblockIp(item.ip)} className="text-blue-500 hover:underline text-xs font-bold flex items-center gap-1">
                                     <ShieldCheck size={14} /> 解除
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
              {messages.length === 0 ? <p className="text-center py-20 text-gray-400">No messages found.</p> : messages.map(m => (
                 <div key={m.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between mb-2">
                       <span className="font-bold text-blue-600">{m.name} <span className="text-xs text-gray-400 font-normal ml-2">{m.contact}</span></span>
                       <span className="text-xs text-gray-400">{m.timestamp} ({m.ip})</span>
                    </div>
                    <p className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-xl whitespace-pre-wrap">{m.message}</p>
                 </div>
              ))}
           </div>
        )}

        {activeTab === 'settings' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border dark:border-gray-700">
                 <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Server className="text-orange-500" /> SMTP & Notification</h3>
                 <form onSubmit={handleUpdateSmtp} className="space-y-4">
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">SMTP Host</label><input type="text" value={smtpConfig.smtp_host} onChange={e => setSmtpConfig({...smtpConfig, smtp_host: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-900" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Port</label><input type="number" value={smtpConfig.smtp_port} onChange={e => setSmtpConfig({...smtpConfig, smtp_port: Number(e.target.value)})} className="w-full p-2 border rounded dark:bg-gray-900" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">User / Email</label><input type="text" value={smtpConfig.smtp_user} onChange={e => setSmtpConfig({...smtpConfig, smtp_user: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-900" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Password</label><input type="password" value={smtpConfig.smtp_pass} onChange={e => setSmtpConfig({...smtpConfig, smtp_pass: e.target.value})} placeholder="********" className="w-full p-2 border rounded dark:bg-gray-900" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Alert To (Admin Email)</label><input type="email" value={smtpConfig.alert_email} onChange={e => setSmtpConfig({...smtpConfig, alert_email: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-900" /></div>
                    {smtpMsg && <p className="text-xs font-bold text-blue-500">{smtpMsg}</p>}
                    <button type="submit" className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl">Save & Test</button>
                 </form>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;