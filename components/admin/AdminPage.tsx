
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Lock, ShieldAlert, Mail, User, LogOut, Loader2, 
  Activity, BarChart3, Settings, Clock, Shield, KeyRound,
  RefreshCw, CheckCircle2, AlertTriangle, XCircle, Trash2, 
  Download, Upload, Database, Server, Filter, Search, Zap, ShieldCheck
} from 'lucide-react';

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
        setLoginError(data.error === 'Invalid password' ? 'パスワードが正しくありません' : data.error);
      }
    } catch (err) { setLoginError('接続エラーが発生しました'); }
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
        <h2 className="text-2xl font-bold text-center mb-8 dark:text-white">管理者ログイン</h2>
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
          <button type="submit" disabled={isLoggingIn} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
            {isLoggingIn ? <Loader2 className="animate-spin" /> : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2 text-red-600 shrink-0"><ShieldAlert /> 管理パネル</h1>
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg overflow-x-auto no-scrollbar mx-4">
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
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-500'}`}
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
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                   <p className="text-xs font-bold text-gray-500">今日のPV</p>
                   <p className="text-3xl font-black text-blue-600">{stats.today_pv.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                   <p className="text-xs font-bold text-gray-500">累計PV</p>
                   <p className="text-3xl font-black text-indigo-600">{stats.total_pv.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                   <p className="text-xs font-bold text-gray-500">受信メッセージ</p>
                   <p className="text-3xl font-black text-pink-600">{messages.length.toLocaleString()}</p>
                </div>
             </div>

             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Clock size={18} /> 最近の活動（ユーザー＋管理）</h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
                   {stats.recent_logs.map((log, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs p-3 border-b last:border-0 border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                         <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status && log.status >= 400 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                               {log.status || 200}
                            </span>
                            <span className="text-blue-500 font-mono font-bold truncate max-w-[200px]">{log.path}</span>
                         </div>
                         <div className="flex items-center gap-4 mt-2 sm:mt-0 text-gray-400 font-mono">
                            <span className="hidden md:inline">{log.ip}</span>
                            <span className="text-gray-500 font-bold">{log.date}</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'logs' && stats && (
           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in">
              <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                 <h3 className="font-bold flex items-center gap-2 text-lg">詳細アクセスログ</h3>
                 <button onClick={() => fetchDashboard()} className="p-2 text-gray-400 hover:text-blue-500"><RefreshCw size={16} /></button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase font-bold text-gray-500">
                       <tr>
                          <th className="px-6 py-4">時刻 (分/秒.ミリ秒)</th>
                          <th className="px-6 py-4">パス</th>
                          <th className="px-6 py-4">IPアドレス</th>
                          <th className="px-6 py-4">応答(ms)</th>
                          <th className="px-6 py-4">UA</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                       {stats.recent_logs.map((log, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                             <td className="px-6 py-4 font-mono font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">{log.date.split(' ')[1]}</td>
                             <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400 truncate max-w-[150px]">{log.path}</td>
                             <td className="px-6 py-4 font-mono text-xs">{log.ip}</td>
                             <td className="px-6 py-4 font-mono text-xs text-orange-500">{log.response_time || '-'}</td>
                             <td className="px-6 py-4 text-[10px] text-gray-400 truncate max-w-[200px]" title={log.ua}>{log.ua}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-800 flex items-center gap-4">
                <Shield size={32} className="text-red-500" />
                <div>
                   <h3 className="font-bold text-red-800 dark:text-red-400">DOS攻撃自動保護 有効</h3>
                   <p className="text-sm text-red-700 dark:text-red-300">1分間に60回以上のアクセスがあったIPを自動的に遮断し、管理者へ通知メールを送信します。</p>
                </div>
             </div>

             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                   <h3 className="font-bold flex items-center gap-2"><XCircle className="text-red-500" /> 現在遮断中のIPアドレス</h3>
                   <button onClick={fetchSecurity} className="p-2 text-gray-400 hover:text-blue-500"><RefreshCw size={16} /></button>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase font-bold text-gray-500">
                         <tr><th className="px-6 py-3">IP Address</th><th className="px-6 py-3">遮断理由</th><th className="px-6 py-3">遮断日時</th><th className="px-6 py-3">アクション</th></tr>
                      </thead>
                      <tbody className="divide-y dark:divide-gray-700">
                         {Object.values(blockedIps).length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">遮断中のIPはありません</td></tr>
                         ) : Object.values(blockedIps).map((item: any) => (
                            <tr key={item.ip} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                               <td className="px-6 py-4 font-mono font-bold text-red-600">{item.ip}</td>
                               <td className="px-6 py-4 text-xs font-bold">{item.reason}</td>
                               <td className="px-6 py-4 text-xs text-gray-400">{item.time}</td>
                               <td className="px-6 py-4">
                                  <button onClick={() => unblockIp(item.ip)} className="text-blue-500 hover:underline text-xs font-bold flex items-center gap-1">
                                     <ShieldCheck size={14} /> 遮断解除
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
                 <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-400 font-bold">メッセージはありません</div>
              ) : messages.map(m => (
                 <div key={m.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-pink-200 transition-colors">
                    <div className="flex justify-between mb-4">
                       <span className="font-bold text-blue-600 flex items-center gap-2"><User size={16} /> {m.name} <span className="text-xs text-gray-400 font-normal ml-2">{m.contact}</span></span>
                       <span className="text-xs text-gray-400 font-mono">{m.timestamp} ({m.ip})</span>
                    </div>
                    <p className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-xl whitespace-pre-wrap leading-relaxed">{m.message}</p>
                 </div>
              ))}
           </div>
        )}

        {activeTab === 'settings' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border dark:border-gray-700 shadow-sm">
                 <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Server className="text-orange-500" /> SMTP・通知メール設定</h3>
                 <form onSubmit={handleUpdateSmtp} className="space-y-4">
                    <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">SMTP ホスト</label><input type="text" value={smtpConfig.smtp_host} onChange={e => setSmtpConfig({...smtpConfig, smtp_host: e.target.value})} className="w-full p-2.5 border rounded-lg dark:bg-gray-900 text-sm" placeholder="smtp.gmail.com" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">ポート</label><input type="number" value={smtpConfig.smtp_port} onChange={e => setSmtpConfig({...smtpConfig, smtp_port: Number(e.target.value)})} className="w-full p-2.5 border rounded-lg dark:bg-gray-900 text-sm" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">ユーザー / メールアドレス</label><input type="text" value={smtpConfig.smtp_user} onChange={e => setSmtpConfig({...smtpConfig, smtp_user: e.target.value})} className="w-full p-2.5 border rounded-lg dark:bg-gray-900 text-sm" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">パスワード (アプリパスワード)</label><input type="password" value={smtpConfig.smtp_pass} onChange={e => setSmtpConfig({...smtpConfig, smtp_pass: e.target.value})} placeholder="変更しない場合は空欄" className="w-full p-2.5 border rounded-lg dark:bg-gray-900 text-sm" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">アラート送信先 (管理者メール)</label><input type="email" value={smtpConfig.alert_email} onChange={e => setSmtpConfig({...smtpConfig, alert_email: e.target.value})} className="w-full p-2.5 border rounded-lg dark:bg-gray-900 text-sm" /></div>
                    {smtpMsg && <p className={`text-xs font-bold ${smtpMsg.includes('エラー') ? 'text-red-500' : 'text-blue-500'} bg-gray-50 dark:bg-gray-900 p-2 rounded`}>{smtpMsg}</p>}
                    <button type="submit" className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]">設定を保存してテスト送信</button>
                 </form>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border dark:border-gray-700 shadow-sm flex flex-col justify-center items-center text-center space-y-4">
                 <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600"><KeyRound size={48} /></div>
                 <h3 className="font-bold text-lg">管理者パスワードの変更</h3>
                 <p className="text-xs text-gray-400">セキュリティのため、定期的な変更を推奨します。</p>
                 <button className="px-6 py-2 border-2 border-blue-500 text-blue-500 font-bold rounded-xl hover:bg-blue-50 transition-colors">パスワード変更ダイアログを開く</button>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
