
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Lock, ShieldAlert, Mail, User, LogOut, Loader2, 
  Activity, BarChart3, Settings, Clock, Shield, KeyRound,
  RefreshCw, CheckCircle2, AlertTriangle, XCircle, Trash2, 
  Download, Upload, Database, Server, Zap, ShieldCheck,
  TrendingUp, ListOrdered, FileJson, Send
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface Message { id: string; timestamp: string; ip: string; name: string; contact: string; message: string; }
interface AccessLog { timestamp: number; date: string; ip: string; path: string; ua: string; status?: number; }
interface AdminConfig {
  smtp_host: string; smtp_port: number; smtp_user: string; smtp_pass?: string; alert_email: string;
  dos_limit_count: number; dos_limit_seconds: number;
  dos_block_minutes_1: number; dos_block_minutes_2: number;
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

  // 設定フォーム (自動更新から分離して保持)
  const [config, setConfig] = useState<AdminConfig>({
    smtp_host: '', smtp_port: 587, smtp_user: '', smtp_pass: '', alert_email: '',
    dos_limit_count: 30, dos_limit_seconds: 30,
    dos_block_minutes_1: 15, dos_block_minutes_2: 60,
    dos_notify_enabled: true
  });
  const [configMsg, setConfigMsg] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  const [isImporting, setIsImporting] = useState(false);
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

  // データ取得: isPolling=true の場合は設定情報を上書きしない
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
        
        // 初回ロード時のみ設定をフォームにセット
        if (isFirst) {
            setConfig(prev => ({ ...prev, ...data.config, smtp_pass: '' }));
            setIsDirty(false);
        }
      } else { logout(); }
    } catch (e) {} finally { setIsLoading(false); }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setConfig(p => ({...p, smtp_pass: ''}));
        setTimeout(() => setConfigMsg(''), 3000);
      } else { setConfigMsg('保存に失敗しました。'); }
    } catch (e) { setConfigMsg('エラーが発生しました。'); }
  };

  const handleTestEmail = async () => {
    if (!token || !config.alert_email) { alert('通知先メールアドレスを入力してください'); return; }
    setIsTestingEmail(true);
    try {
      const res = await fetch('./backend/admin_api.php?action=test_email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.status === '成功') alert('テストメールを送信しました。受信トレイを確認してください。');
      else alert('送信エラー: ' + data.error);
    } catch (e) { alert('通信エラーが発生しました。'); }
    finally { setIsTestingEmail(false); }
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    if (!confirm('メッセージとアクセスログを復元しますか？現在のデータは上書きされます。')) return;
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
        if (res.ok) { alert('復元が完了しました。'); fetchData(true); }
      } catch (err) { alert('形式が正しくありません。'); }
      finally { setIsImporting(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };
    reader.readAsText(file);
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
      const interval = setInterval(() => fetchData(false), 15000);
      return () => clearInterval(interval);
    }
  }, [token]);

  if (!token) return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-10 text-center">
        <div className="inline-flex p-4 bg-red-50 text-red-600 rounded-full mb-6"><Lock size={32} /></div>
        <h2 className="text-2xl font-black mb-2 dark:text-white">管理者ログイン</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="パスワード" className="w-full p-4 rounded-2xl border-2 dark:bg-gray-900 dark:text-white outline-none focus:border-red-500" autoFocus />
          {loginError && <p className="text-red-500 text-sm font-bold">{loginError}</p>}
          <button type="submit" disabled={isLoggingIn} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98]">
            {isLoggingIn ? <Loader2 className="animate-spin" /> : '認証'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-slate-800 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-3"><ShieldAlert className="text-red-600" /><h1 className="text-lg font-black tracking-tight">管理パネル</h1></div>
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-[50%]">
           {['dashboard', 'logs', 'messages', 'security', 'settings'].map(t => (
             <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap ${activeTab === t ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {t === 'dashboard' ? '統計' : t === 'logs' ? 'ログ' : t === 'messages' ? '受信箱' : t === 'security' ? '保護状態' : '各種設定'}
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
                   { label: '本日PV', val: stats.today_pv, color: 'text-blue-600' },
                   { label: '累計PV', val: stats.total_pv, color: 'text-indigo-600' },
                   { label: 'メッセージ', val: messages.length, color: 'text-pink-600' },
                   { label: '遮断IP', val: Object.keys(blockedIps).length, color: 'text-red-600' }
                 ].map((card, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                       <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1 uppercase">{card.label}</p>
                       <p className={`text-3xl font-black ${card.color}`}>{card.val.toLocaleString()}</p>
                    </div>
                 ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-3xl border dark:border-gray-700">
                    <h3 className="font-black flex items-center gap-2 mb-6"><TrendingUp size={18} className="text-blue-500" /> 24時間の推移</h3>
                    <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} /><YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} /><Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)'}} /><Area type="monotone" dataKey="pv" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPv)" /></AreaChart></ResponsiveContainer></div>
                 </div>
                 <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border dark:border-gray-700 h-full overflow-hidden">
                    <h3 className="font-black mb-6">直近の動作ログ</h3>
                    <div className="space-y-4">{stats.recent_logs.slice(0, 8).map((log, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <div className="min-w-0 flex-1"><p className="font-bold text-blue-600 truncate">{log.path}</p><p className="text-gray-400 font-mono text-[9px]">{log.ip}</p></div>
                        <p className="text-gray-500 font-bold ml-4">{log.date.split(' ')[1]}</p>
                      </div>
                    ))}</div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'settings' && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
              <form onSubmit={handleUpdateSettings} className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border dark:border-gray-700 shadow-sm space-y-5">
                   <h3 className="font-black text-xl mb-4 flex items-center gap-3"><Mail className="text-pink-500" /> 通知・SMTP設定</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="text-[10px] font-black text-gray-400 uppercase">SMTPホスト</label><input type="text" value={config.smtp_host} onChange={e => { setConfig({...config, smtp_host: e.target.value}); setIsDirty(true); }} className="w-full p-3 border dark:bg-gray-900 rounded-xl font-bold" /></div>
                      <div><label className="text-[10px] font-black text-gray-400 uppercase">ポート</label><input type="number" value={config.smtp_port} onChange={e => { setConfig({...config, smtp_port: Number(e.target.value)}); setIsDirty(true); }} className="w-full p-3 border dark:bg-gray-900 rounded-xl font-bold" /></div>
                   </div>
                   <div><label className="text-[10px] font-black text-gray-400 uppercase">ユーザー名 (メール)</label><input type="text" value={config.smtp_user} onChange={e => { setConfig({...config, smtp_user: e.target.value}); setIsDirty(true); }} className="w-full p-3 border dark:bg-gray-900 rounded-xl font-bold" /></div>
                   <div><label className="text-[10px] font-black text-gray-400 uppercase">パスワード (変更時のみ)</label><input type="password" value={config.smtp_pass} onChange={e => { setConfig({...config, smtp_pass: e.target.value}); setIsDirty(true); }} className="w-full p-3 border dark:bg-gray-900 rounded-xl font-bold" placeholder="••••••••" /></div>
                   <div><label className="text-[10px] font-black text-gray-400 uppercase">通知先 (管理者メールアドレス)</label><input type="email" value={config.alert_email} onChange={e => { setConfig({...config, alert_email: e.target.value}); setIsDirty(true); }} className="w-full p-3 border dark:bg-gray-900 rounded-xl font-bold" /></div>
                   <div className="flex gap-2">
                      <button type="button" onClick={handleTestEmail} disabled={isTestingEmail} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200">
                        {isTestingEmail ? <Loader2 className="animate-spin" /> : <Send size={16} />} 接続テスト送信
                      </button>
                   </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border dark:border-gray-700 shadow-sm space-y-5">
                   <h3 className="font-black text-xl mb-4 flex items-center gap-3"><Shield className="text-red-500" /> DOS保護詳細設定</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-[10px] font-black text-gray-400 uppercase">判定カウント</label><input type="number" value={config.dos_limit_count} onChange={e => { setConfig({...config, dos_limit_count: Number(e.target.value)}); setIsDirty(true); }} className="w-full p-3 border dark:bg-gray-900 rounded-xl font-bold" /><p className="text-[9px] text-gray-400 mt-1">○回以上のアクセスで遮断</p></div>
                      <div><label className="text-[10px] font-black text-gray-400 uppercase">判定期間(秒)</label><input type="number" value={config.dos_limit_seconds} onChange={e => { setConfig({...config, dos_limit_seconds: Number(e.target.value)}); setIsDirty(true); }} className="w-full p-3 border dark:bg-gray-900 rounded-xl font-bold" /><p className="text-[9px] text-gray-400 mt-1">判定を行う間隔</p></div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-[10px] font-black text-gray-400 uppercase">1回目遮断時間(分)</label><input type="number" value={config.dos_block_minutes_1} onChange={e => { setConfig({...config, dos_block_minutes_1: Number(e.target.value)}); setIsDirty(true); }} className="w-full p-3 border dark:bg-gray-900 rounded-xl font-bold" /></div>
                      <div><label className="text-[10px] font-black text-gray-400 uppercase">2回目以降遮断時間(分)</label><input type="number" value={config.dos_block_minutes_2} onChange={e => { setConfig({...config, dos_block_minutes_2: Number(e.target.value)}); setIsDirty(true); }} className="w-full p-3 border dark:bg-gray-900 rounded-xl font-bold" /></div>
                   </div>
                   <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer">
                      <input type="checkbox" checked={config.dos_notify_enabled} onChange={e => { setConfig({...config, dos_notify_enabled: e.target.checked}); setIsDirty(true); }} className="w-5 h-5 rounded text-red-600" />
                      <span className="font-bold text-sm">遮断時に管理者にメール通知する</span>
                   </label>
                </div>

                <div className="sticky bottom-6">
                  {isDirty && <div className="bg-orange-100 text-orange-700 p-4 rounded-2xl mb-4 text-xs font-bold flex items-center gap-2 border border-orange-200 animate-pulse"><AlertTriangle size={16} /> 未保存の変更があります。</div>}
                  <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95">
                    {configMsg ? <CheckCircle2 /> : <Settings />} {configMsg || '設定内容を保存して反映'}
                  </button>
                </div>
              </form>

              <div className="space-y-6">
                 <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl space-y-6">
                    <div><h3 className="font-black text-xl mb-1">システムデータ管理</h3><p className="text-xs opacity-70 font-bold">メッセージとログの外部保存・復元</p></div>
                    <div className="grid grid-cols-2 gap-3">
                       <button onClick={() => {
                         const d = { messages, logs: stats.recent_logs };
                         const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], {type:'application/json'})); a.download = `まいつーる_バックアップ_${new Date().toISOString().split('T')[0]}.json`; a.click();
                       }} className="py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"><Download size={16} /> JSON出力</button>
                       <button onClick={() => fileInputRef.current?.click()} className="py-3 bg-white text-indigo-600 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg"><Upload size={16} /> JSON読み込み</button>
                       <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportJson} className="hidden" />
                    </div>
                 </div>
                 <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border dark:border-gray-700 shadow-sm text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 mx-auto"><KeyRound size={32} /></div>
                    <h3 className="font-black text-lg">管理者パスワードの更新</h3>
                    <p className="text-xs text-gray-400 font-bold px-4">セキュリティ維持のため定期的な変更を推奨します。</p>
                    <button className="w-full py-3 border-2 border-blue-500 text-blue-500 font-black rounded-xl hover:bg-blue-50 transition-all">変更ウィザードを開始</button>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'logs' && (
           <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 overflow-hidden animate-fade-in">
              <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                 <h3 className="font-black">詳細アクセスログ (最新500件)</h3>
                 <button onClick={() => fetchData(false)} className="p-2 text-gray-400 hover:text-blue-500"><RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /></button>
              </div>
              <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-100 dark:bg-gray-900/50 text-[10px] uppercase font-black text-gray-400 tracking-wider"><tr><th className="px-6 py-4">日時</th><th className="px-6 py-4">パス</th><th className="px-6 py-4">IP</th><th className="px-6 py-4">ステータス</th></tr></thead><tbody className="divide-y divide-gray-100 dark:divide-gray-700">{stats.recent_logs.map((log, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><td className="px-6 py-4 font-mono text-[11px]">{log.date}</td><td className="px-6 py-4 font-black text-blue-600 dark:text-blue-400 truncate max-w-[200px]">{log.path}</td><td className="px-6 py-4 font-mono text-[11px] text-gray-500">{log.ip}</td><td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-black ${log.status && log.status >= 400 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{log.status || 200}</span></td></tr>
              ))}</tbody></table></div>
           </div>
        )}

        {activeTab === 'messages' && (
           <div className="space-y-4 animate-fade-in">
              {messages.length === 0 ? <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed dark:border-gray-700 text-gray-400 font-black">メッセージはありません</div> : messages.map(m => (
                 <div key={m.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors"><div className="flex flex-col sm:flex-row justify-between mb-4 gap-2"><span className="font-black text-blue-600 flex items-center gap-2"><User size={18} className="text-gray-300" /> {m.name} <span className="text-[10px] font-normal text-gray-400">({m.contact})</span></span><span className="text-[10px] text-gray-400 font-mono bg-gray-50 dark:bg-gray-900 p-1.5 rounded-lg">{m.timestamp} (IP: {m.ip})</span></div><p className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl whitespace-pre-wrap leading-relaxed text-sm text-gray-700 dark:text-gray-300">{m.message}</p></div>
              ))}
           </div>
        )}

        {activeTab === 'security' && (
           <div className="space-y-6 animate-fade-in">
              <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-3xl border border-red-100 dark:border-red-800 flex items-center gap-6">
                 <div className="p-4 bg-red-100 dark:bg-red-800 text-red-600 rounded-2xl"><ShieldCheck size={40} /></div>
                 <div><h3 className="font-black text-xl text-red-800 dark:text-red-400">DOS保護システム：稼働中</h3><p className="text-xs text-red-700 dark:text-red-300 mt-1">過剰なリクエストを検知すると、IP単位で自動的にアクセスを拒否します。</p></div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 overflow-hidden">
                 <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center"><h3 className="font-black">現在遮断中のIPアドレス一覧</h3><button onClick={() => fetchData(false)} className="p-2 text-gray-400"><RefreshCw size={18} /></button></div>
                 <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-100 dark:bg-gray-900/50 text-[10px] uppercase font-black text-gray-400 tracking-wider"><tr><th className="px-6 py-4">IP</th><th className="px-6 py-4">理由</th><th className="px-6 py-4">残り時間</th><th className="px-6 py-4">操作</th></tr></thead><tbody className="divide-y divide-gray-100 dark:divide-gray-700">{Object.keys(blockedIps).length === 0 ? <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold">現在、遮断されているIPはありません</td></tr> : Object.entries(blockedIps).map(([ip, item]: [string, any]) => (
                   <tr key={ip} className="hover:bg-gray-50 dark:hover:bg-gray-700"><td className="px-6 py-4 font-mono font-black text-red-600">{ip}</td><td className="px-6 py-4 text-xs font-bold">{item.reason}</td><td className="px-6 py-4 text-xs font-bold text-orange-500">{Math.ceil((item.expiry - (Date.now()/1000))/60)} 分</td><td className="px-6 py-4"><button onClick={async () => { if(confirm('解除しますか？')) { await fetch(`./backend/admin_api.php?action=unblock_ip`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token }, body: JSON.stringify({ ip }) }); fetchData(false); } }} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-black hover:bg-blue-100">遮断解除</button></td></tr>
                 ))}</tbody></table></div>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
