
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Lock, ShieldAlert, Mail, User, LogOut, Loader2, 
  Activity, BarChart3, Settings, Clock, Shield, KeyRound,
  RefreshCw, CheckCircle2, AlertTriangle, XCircle, Trash2, 
  Download, Upload, Database, Server, Filter, Search, Zap, ShieldCheck,
  TrendingUp, MousePointer2, ListOrdered, FileJson
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface Message { id: string; timestamp: string; ip: string; name: string; contact: string; message: string; }
interface AccessLog { timestamp: number; date: string; ip: string; path: string; ua: string; status?: number; }
interface SmtpConfig { smtp_host: string; smtp_port: number; smtp_user: string; smtp_pass?: string; alert_email: string; }

const AdminPage: React.FC = () => {
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('admin_token'));
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'messages' | 'security' | 'settings'>('dashboard');
  
  // ログイン関連
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 統計・データ関連 (自動更新対象)
  const [stats, setStats] = useState<{total_pv: number, today_pv: number, recent_logs: AccessLog[]}>({ total_pv: 0, today_pv: 0, recent_logs: [] });
  const [messages, setMessages] = useState<Message[]>([]);
  const [blockedIps, setBlockedIps] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  // SMTP設定関連 (自動更新の対象外とし、入力消失を防止)
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({ smtp_host: '', smtp_port: 587, smtp_user: '', alert_email: '', smtp_pass: '' });
  const [smtpMsg, setSmtpMsg] = useState('');
  const [isDirty, setIsDirty] = useState(false); // 編集中フラグ

  // インポート関連
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<'success' | 'error' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chartData = useMemo(() => {
    const hours: Record<string, number> = {};
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600000);
      hours[`${d.getHours()}:00`] = 0;
    }
    stats.recent_logs.forEach(log => {
      const label = `${new Date(log.timestamp * 1000).getHours()}:00`;
      if (hours[label] !== undefined) hours[label]++;
    });
    return Object.entries(hours).map(([name, pv]) => ({ name, pv }));
  }, [stats.recent_logs]);

  const fetchStats = async (isFirst = false) => {
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
        
        // SMTP設定は、初回または保存直後のみ同期する（入力中は無視）
        if (isFirst) {
            setSmtpConfig(prev => ({ ...prev, ...data.config, smtp_pass: '' }));
            setIsDirty(false);
        }
      } else {
        logout();
      }
    } catch (e) {} finally { setIsLoading(false); }
  };

  const handleUpdateSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSmtpMsg('保存中...');
    try {
      const res = await fetch('./backend/admin_api.php?action=update_smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
        body: JSON.stringify(smtpConfig)
      });
      if (res.ok) {
        setSmtpMsg('設定を保存しました。');
        setIsDirty(false);
        setSmtpConfig(p => ({ ...p, smtp_pass: '' }));
      } else {
        setSmtpMsg('保存に失敗しました。');
      }
    } catch (e) { setSmtpMsg('エラーが発生しました。'); }
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    if (!confirm('システムデータを復元しますか？既存のメッセージとログは上書きされます。')) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const res = await fetch('./backend/admin_api.php?action=import_data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
          body: JSON.stringify(json)
        });
        if (res.ok) {
          setImportResult('success');
          fetchStats(true);
        } else {
          setImportResult('error');
        }
      } catch (err) {
        alert('解析エラー: 正しい形式のバックアップファイルではありません。');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(() => setImportResult(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const data = { config: smtpConfig, messages, logs: stats.recent_logs };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `まいつーる_バックアップ_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
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
      } else {
        setLoginError(data.error);
      }
    } catch (e) { setLoginError('通信エラー'); } finally { setIsLoggingIn(false); }
  };

  const logout = () => { setToken(null); sessionStorage.removeItem('admin_token'); };

  useEffect(() => {
    if (token) {
      fetchStats(true);
      const interval = setInterval(() => fetchStats(false), 15000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // 編集中はブラウザを閉じる前に警告を出す
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  if (!token) return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-10 text-center">
        <div className="inline-flex p-4 bg-red-50 text-red-600 rounded-full mb-6"><Lock size={32} /></div>
        <h2 className="text-2xl font-black mb-2 dark:text-white">管理者ログイン</h2>
        <p className="text-xs text-gray-400 font-bold mb-8">システム管理パネル</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="パスワード" 
            className="w-full p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:border-red-500 transition-all"
            autoFocus 
          />
          {loginError && <p className="text-red-500 text-sm font-bold">{loginError}</p>}
          <button type="submit" disabled={isLoggingIn} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98]">
            {isLoggingIn ? <Loader2 className="animate-spin" /> : 'アクセス許可'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-slate-800 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-3">
           <ShieldAlert className="text-red-600" />
           <h1 className="text-lg font-black tracking-tight">管理パネル</h1>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
           {['dashboard', 'logs', 'messages', 'security', 'settings'].map(t => (
             <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === t ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {t === 'dashboard' ? 'ダッシュボード' : t === 'logs' ? 'アクセスログ' : t === 'messages' ? 'メッセージ' : t === 'security' ? 'セキュリティ' : 'システム設定'}
             </button>
           ))}
        </div>
        <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500"><LogOut size={20} /></button>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-10">
        {activeTab === 'dashboard' && (
           <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[
                   { label: '本日のPV', val: stats.today_pv, color: 'text-blue-600' },
                   { label: '累計PV', val: stats.total_pv, color: 'text-indigo-600' },
                   { label: '受信メッセージ', val: messages.length, color: 'text-pink-600' },
                   { label: '遮断IP数', val: Object.keys(blockedIps).length, color: 'text-red-600' }
                 ].map((card, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
                       <p className={`text-3xl font-black ${card.color}`}>{card.val.toLocaleString()}</p>
                    </div>
                 ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-3xl border dark:border-gray-700">
                    <h3 className="font-black flex items-center gap-2 text-gray-700 dark:text-white mb-6"><TrendingUp size={18} className="text-blue-500" /> 24時間のトラフィック推移</h3>
                    <div className="h-64">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                             <defs><linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                             <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                             <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)'}} />
                             <Area type="monotone" dataKey="pv" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPv)" />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
                 <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border dark:border-gray-700">
                    <h3 className="font-black mb-6">直近のアクセス</h3>
                    <div className="space-y-4">
                       {stats.recent_logs.slice(0, 6).map((log, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                             <div className="min-w-0 flex-1">
                                <p className="font-bold text-blue-600 truncate">{log.path}</p>
                                <p className="text-gray-400 font-mono text-[9px]">{log.ip}</p>
                             </div>
                             <p className="text-gray-500 font-bold whitespace-nowrap ml-4">{log.date.split(' ')[1]}</p>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'settings' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border dark:border-gray-700 shadow-sm">
                 <h3 className="font-black text-xl mb-8 flex items-center gap-3"><Server className="text-orange-500" /> 通知・メールサーバー設定</h3>
                 <form onSubmit={handleUpdateSmtp} className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">SMTPサーバーホスト</label>
                      <input 
                        type="text" 
                        value={smtpConfig.smtp_host} 
                        onChange={e => { setSmtpConfig({...smtpConfig, smtp_host: e.target.value}); setIsDirty(true); }} 
                        className="w-full p-4 border-2 border-gray-100 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-sm font-bold outline-none focus:border-orange-500 transition-all" 
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                       <div className="col-span-1">
                          <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">ポート</label>
                          <input type="number" value={smtpConfig.smtp_port} onChange={e => { setSmtpConfig({...smtpConfig, smtp_port: Number(e.target.value)}); setIsDirty(true); }} className="w-full p-4 border-2 border-gray-100 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-sm font-bold" />
                       </div>
                       <div className="col-span-2">
                          <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">ユーザー名 (メール)</label>
                          <input type="text" value={smtpConfig.smtp_user} onChange={e => { setSmtpConfig({...smtpConfig, smtp_user: e.target.value}); setIsDirty(true); }} className="w-full p-4 border-2 border-gray-100 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-sm font-bold" />
                       </div>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">パスワード</label>
                       <input type="password" value={smtpConfig.smtp_pass} onChange={e => { setSmtpConfig({...smtpConfig, smtp_pass: e.target.value}); setIsDirty(true); }} placeholder="変更時のみ入力（通常は空欄）" className="w-full p-4 border-2 border-gray-100 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-sm font-bold" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">アラート送信先 (管理者メール)</label>
                       <input type="email" value={smtpConfig.alert_email} onChange={e => { setSmtpConfig({...smtpConfig, alert_email: e.target.value}); setIsDirty(true); }} className="w-full p-4 border-2 border-gray-100 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-sm font-bold" />
                    </div>
                    
                    {isDirty && <p className="text-[10px] text-orange-500 font-black animate-pulse flex items-center gap-1"><AlertTriangle size={12} /> 未保存の変更があります</p>}
                    {smtpMsg && <p className={`p-4 rounded-xl text-xs font-bold ${smtpMsg.includes('失敗') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{smtpMsg}</p>}
                    
                    <button type="submit" className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl shadow-lg transition-all active:scale-[0.98]">
                       設定内容を保存する
                    </button>
                    {isDirty && <button type="button" onClick={() => fetchStats(true)} className="w-full text-xs text-gray-400 font-bold py-2">変更を破棄して同期</button>}
                 </form>
              </div>

              <div className="flex flex-col gap-6">
                 <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                       <div>
                          <h3 className="font-black text-xl mb-1">システムデータの復元</h3>
                          <p className="text-xs opacity-70 font-bold">バックアップJSONからの復旧</p>
                       </div>
                       <Database size={32} className="opacity-30" />
                    </div>
                    <div className="mt-8 space-y-4">
                       <div className="flex gap-3">
                          <button onClick={handleExport} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"><Download size={16} /> JSON出力</button>
                          <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 bg-white text-indigo-600 rounded-xl font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2"><Upload size={16} /> 復元（読込）</button>
                       </div>
                       <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportJson} className="hidden" />
                       {isImporting && <div className="text-center py-2 text-xs animate-pulse font-bold">復元処理を実行中...</div>}
                       {importResult === 'success' && <div className="bg-green-500/20 text-green-200 p-3 rounded-xl text-center text-xs font-bold border border-green-500/30 flex items-center justify-center gap-2"><CheckCircle2 size={16} /> データの復元が完了しました</div>}
                    </div>
                 </div>

                 <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border dark:border-gray-700 shadow-sm flex flex-col items-center text-center">
                    <div className="p-5 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 mb-6"><KeyRound size={48} /></div>
                    <h3 className="font-black text-xl mb-2">管理者パスワードの変更</h3>
                    <p className="text-xs text-gray-400 font-bold mb-8 uppercase tracking-widest leading-relaxed">セキュリティのため、定期的な変更を推奨します。</p>
                    <button className="w-full py-4 border-2 border-blue-500 text-blue-500 font-black rounded-2xl hover:bg-blue-50 transition-all">変更ダイアログを開く</button>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'logs' && (
           <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 overflow-hidden animate-fade-in">
              <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                 <h3 className="font-black">詳細アクセスログ</h3>
                 <button onClick={() => fetchStats(false)} className="p-2 text-gray-400 hover:text-blue-500 transition-all"><RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /></button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 dark:bg-gray-900/50 text-[10px] uppercase font-black text-gray-400 tracking-wider">
                       <tr><th className="px-6 py-4">日時</th><th className="px-6 py-4">内容</th><th className="px-6 py-4">IP</th><th className="px-6 py-4">ステータス</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                       {stats.recent_logs.map((log, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                             <td className="px-6 py-4 font-mono text-[11px] whitespace-nowrap">{log.date}</td>
                             <td className="px-6 py-4 font-black text-blue-600 dark:text-blue-400 truncate max-w-[250px]">{log.path}</td>
                             <td className="px-6 py-4 font-mono text-[11px] text-gray-500">{log.ip}</td>
                             <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-black ${log.status && log.status >= 400 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{log.status || 200}</span></td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === 'messages' && (
           <div className="space-y-4 animate-fade-in">
              {messages.length === 0 ? (
                 <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed dark:border-gray-700 text-gray-400 font-black">受信メッセージはありません</div>
              ) : messages.map(m => (
                 <div key={m.id} className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border dark:border-gray-700 transition-colors group">
                    <div className="flex flex-col sm:flex-row justify-between mb-4 gap-2">
                       <span className="font-black text-blue-600 flex items-center gap-2"><User size={18} className="text-gray-300" /> {m.name} <span className="text-[10px] font-normal text-gray-400">({m.contact})</span></span>
                       <span className="text-[10px] text-gray-400 font-mono bg-gray-50 dark:bg-gray-900 p-1.5 rounded-lg">{m.timestamp} (IP: {m.ip})</span>
                    </div>
                    <p className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl whitespace-pre-wrap leading-relaxed text-sm text-gray-700 dark:text-gray-300">{m.message}</p>
                 </div>
              ))}
           </div>
        )}

        {activeTab === 'security' && (
           <div className="space-y-6 animate-fade-in">
              <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-3xl border border-red-100 dark:border-red-800 flex items-center gap-6">
                 <div className="p-4 bg-red-100 dark:bg-red-800 text-red-600 rounded-2xl"><Shield size={40} /></div>
                 <div><h3 className="font-black text-xl text-red-800 dark:text-red-400">攻撃自動遮断システム：稼働中</h3><p className="text-xs text-red-700 dark:text-red-300 mt-1">過剰なリクエストを検知したIPを即座にサイト全体から遮断します。</p></div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 overflow-hidden">
                 <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center"><h3 className="font-black">遮断中のIPアドレス</h3><button onClick={() => fetchStats(false)} className="p-2 text-gray-400"><RefreshCw size={18} /></button></div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-gray-100 dark:bg-gray-900/50 text-[10px] uppercase font-black text-gray-400 tracking-wider">
                          <tr><th className="px-6 py-4">IP</th><th className="px-6 py-4">理由</th><th className="px-6 py-4">日時</th><th className="px-6 py-4">操作</th></tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {Object.keys(blockedIps).length === 0 ? (
                             <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold">現在、遮断されているIPはありません</td></tr>
                          ) : Object.entries(blockedIps).map(([ip, item]: [string, any]) => (
                             <tr key={ip} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 font-mono font-black text-red-600">{ip}</td>
                                <td className="px-6 py-4 text-xs font-bold">{item.reason}</td>
                                <td className="px-6 py-4 text-xs text-gray-400 font-mono">{item.time}</td>
                                <td className="px-6 py-4"><button onClick={async () => { if(confirm('解除しますか？')) { await fetch(`./backend/admin_api.php?action=unblock_ip`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token }, body: JSON.stringify({ ip }) }); fetchStats(false); } }} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-black hover:bg-blue-100">解除</button></td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
