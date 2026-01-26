import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Lock, ShieldAlert, Mail, User, LogOut, Loader2, 
  Activity, BarChart3, Settings, Clock, Shield, KeyRound,
  RefreshCw, CheckCircle2, AlertTriangle, XCircle, Trash2, 
  Download, Upload, Database, Server, Zap, ShieldCheck,
  TrendingUp, ListOrdered, FileJson, Send, Plus, Minus, Infinity,
  ShieldQuestion, ToggleLeft, ToggleRight, Filter, Search, AppWindow,
  PieChart as PieIcon, ArrowUpRight, X, ChevronRight, MousePointer2,
  HardDrive, Cpu, Microchip, Globe, MapPin, Move
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TOOLS } from '../../constants/toolsData';

const loadLeaflet = (): Promise<any> => {
  return new Promise((resolve) => {
    if ((window as any).L) { resolve((window as any).L); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve((window as any).L);
    document.head.appendChild(script);
  });
};

interface Message { id: string; timestamp: string; ip: string; name: string; contact: string; message: string; }
interface AccessLog { timestamp: number; date: string; ip: string; path: string; ua: string; status?: number; duration?: number; }
interface ServerResources {
  cpu: number;
  mem: { total: number; used: number; percent: number; };
  disk: { total: number; used: number; percent: number; };
}
interface AdminConfig {
  smtp_host: string; smtp_port: number; smtp_user: string; smtp_pass?: string; alert_email: string;
  dos_patterns: any[];
  dos_notify_enabled: boolean;
}

const ADMIN_PATH = '/secure-panel-7x9v2';
const SERVER_LOCATION: [number, number] = [35.6895, 139.6917];

const AdminPage: React.FC = () => {
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('admin_token'));
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'messages' | 'security' | 'settings'>('dashboard');
  
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [stats, setStats] = useState({ total_pv: 0, today_pv: 0, recent_logs: [] as AccessLog[] });
  const [serverResources, setServerResources] = useState<ServerResources | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [blockedIps, setBlockedIps] = useState<Record<string, any>>({});
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const activeElementsRef = useRef<{markers: any[], lines: any[]}>({ markers: [], lines: [] });
  const geoCacheRef = useRef<Record<string, {lat: number, lon: number}>>({});

  const [config, setConfig] = useState<AdminConfig>({
    smtp_host: '', smtp_port: 587, smtp_user: '', smtp_pass: '', alert_email: '',
    dos_patterns: [], dos_notify_enabled: true
  });
  const [newPass, setNewPass] = useState('');
  const [newPassConfirm, setNewPassConfirm] = useState('');
  const [configMsg, setConfigMsg] = useState('');
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);

  const [logFilterIp, setLogFilterIp] = useState('');
  const [logFilterPath, setLogFilterPath] = useState('');
  const [logFilterDate, setLogFilterDate] = useState('');

  // マップ初期化
  useEffect(() => {
    if (activeTab !== 'dashboard' || !token) return;
    let mapInstance: any;
    loadLeaflet().then((L) => {
      if (!mapContainerRef.current) return;
      mapInstance = L.map(mapContainerRef.current, {
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
        zoomControl: true,
        attributionControl: false
      }).setView([20, 0], 2);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(mapInstance);
      const serverIcon = L.divIcon({
        className: 'server-marker',
        html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_15px_#3b82f6] animate-pulse"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8]
      });
      L.marker(SERVER_LOCATION, { icon: serverIcon }).addTo(mapInstance);
      mapRef.current = mapInstance;
    });
    return () => { if (mapInstance) mapInstance.remove(); mapRef.current = null; };
  }, [activeTab, token]);

  // マップ上のリアルタイム・プロット
  useEffect(() => {
    if (!mapRef.current || stats.recent_logs.length === 0) return;
    const L = (window as any).L;
    if (!L) return;

    const processLogs = async () => {
      const recentUniqueIps = Array.from(new Set(stats.recent_logs.slice(0, 10).map(l => l.ip))).slice(0, 3);
      for (const ip of recentUniqueIps) {
        if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) continue;
        let coords = geoCacheRef.current[ip];
        if (!coords) {
          try {
            const res = await fetch(`https://ipwho.is/${ip}`);
            const json = await res.json();
            if (json.success) { coords = { lat: json.latitude, lon: json.longitude }; geoCacheRef.current[ip] = coords; }
          } catch (e) { continue; }
        }
        if (coords && mapRef.current) {
          const markerId = `marker-${ip}`;
          if (activeElementsRef.current.markers.some(m => m._id === markerId)) continue;
          const clientIcon = L.divIcon({
            className: 'client-marker',
            html: `<div class="w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-[0_0_10px_#10b981] animate-ping"></div>`,
            iconSize: [12, 12], iconAnchor: [6, 6]
          });
          const marker = L.marker([coords.lat, coords.lon], { icon: clientIcon }).addTo(mapRef.current);
          marker._id = markerId;
          const polyline = L.polyline([[coords.lat, coords.lon], SERVER_LOCATION], {
            color: '#10b981', weight: 2, opacity: 0.4, dashArray: '5, 10', className: 'animate-access-line'
          }).addTo(mapRef.current);
          activeElementsRef.current.markers.push(marker);
          activeElementsRef.current.lines.push(polyline);
          setTimeout(() => {
            if (marker) marker.remove(); if (polyline) polyline.remove();
            activeElementsRef.current.markers = activeElementsRef.current.markers.filter(m => m !== marker);
            activeElementsRef.current.lines = activeElementsRef.current.lines.filter(l => l !== polyline);
          }, 10000);
        }
      }
    };
    processLogs();
  }, [stats.recent_logs]);

  const fetchData = async (isFirst = false) => {
    if (!token) return;
    if (isFirst) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const res = await fetch('./backend/admin_api.php?action=fetch_dashboard', { headers: { 'X-Admin-Token': token } });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || { total_pv: 0, today_pv: 0, recent_logs: [] });
        setMessages(data.messages || []);
        setBlockedIps(data.blocked_ips || {});
        setServerResources(data.server_resources || null);
        if (isFirst && data.config) setConfig({ ...data.config, smtp_pass: '' });
      } else if (res.status === 403 || res.status === 401) logout();
    } catch (e) { console.error(e); } finally { setIsLoading(false); setIsRefreshing(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const res = await fetch('./backend/admin_api.php?action=login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok) { setToken(data.token); sessionStorage.setItem('admin_token', data.token); } 
      else setLoginError(data.error);
    } catch (e) { setLoginError('通信エラー'); } finally { setIsLoggingIn(false); }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingConfig(true); setConfigMsg('');
    try {
      const res = await fetch('./backend/admin_api.php?action=save_config', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token! },
        body: JSON.stringify(config)
      });
      if (res.ok) setConfigMsg('設定を保存しました');
      else setConfigMsg('保存に失敗しました');
    } catch (e) { setConfigMsg('通信エラー'); } finally { setIsUpdatingConfig(false); }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== newPassConfirm) { alert('確認用パスワードが一致しません'); return; }
    if (!confirm('パスワードを変更しますか？変更後は全セッションが切断されます。')) return;
    try {
      const res = await fetch('./backend/admin_api.php?action=update_password', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token! },
        body: JSON.stringify({ new_password: newPass })
      });
      if (res.ok) { alert('パスワードを更新しました。再ログインしてください。'); logout(); }
      else alert('更新に失敗しました');
    } catch (e) { alert('通信エラー'); }
  };

  const logout = () => { setToken(null); sessionStorage.removeItem('admin_token'); };

  useEffect(() => {
    if (token) {
      fetchData(true);
      const interval = setInterval(() => fetchData(false), 3000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const chartData = useMemo(() => {
    const hours: Record<string, number> = {};
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600000);
      hours[`${d.getHours()}:00`] = 0;
    }
    stats.recent_logs.forEach(log => {
      const logDate = new Date(log.date);
      if (isNaN(logDate.getTime())) return;
      const label = `${logDate.getHours()}:00`;
      if (hours[label] !== undefined) hours[label]++;
    });
    return Object.entries(hours).map(([name, pv]) => ({ name, pv }));
  }, [stats.recent_logs]);

  const filteredLogs = useMemo(() => {
    return stats.recent_logs.filter(log => {
      const matchIp = !logFilterIp || log.ip.includes(logFilterIp);
      const matchPath = !logFilterPath || log.path.toLowerCase().includes(logFilterPath.toLowerCase());
      const matchDate = !logFilterDate || log.date.includes(logFilterDate);
      return matchIp && matchPath && matchDate;
    });
  }, [stats.recent_logs, logFilterIp, logFilterPath, logFilterDate]);

  if (!token) return (
    <div className="fixed inset-0 z-[200] bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10 text-center animate-scale-up">
        <div className="inline-flex p-4 bg-red-50 text-red-600 rounded-full mb-6"><Lock size={32} /></div>
        <h2 className="text-2xl font-black mb-2 dark:text-white">管理者認証</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="パスワードを入力" className="w-full p-4 rounded-2xl border-2 dark:bg-gray-900 dark:text-white outline-none focus:border-red-500 transition-all" autoFocus />
          {loginError && <p className="text-red-500 text-sm font-bold">{loginError}</p>}
          <button type="submit" disabled={isLoggingIn} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all">
            {isLoggingIn ? <Loader2 className="animate-spin" /> : '認証する'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-dark text-slate-800 dark:text-gray-100 flex flex-col fixed inset-0 z-[150] overflow-hidden">
      <header className="bg-slate-900 text-white h-16 flex items-center justify-between px-6 shrink-0 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-1.5 rounded-lg"><ShieldAlert size={20} /></div>
          <h1 className="text-lg font-black tracking-tight">管理コンソール <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">v3.0.0</span></h1>
        </div>
        <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-xl overflow-x-auto no-scrollbar">
           {[
             { id: 'dashboard', label: 'ダッシュボード' },
             { id: 'logs', label: 'ログ解析' },
             { id: 'messages', label: '受信箱' },
             { id: 'security', label: 'セキュリティ' },
             { id: 'settings', label: '設定・保守' }
           ].map(t => (
             <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-white text-slate-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}>{t.label}</button>
           ))}
        </div>
        <button onClick={logout} className="p-2 text-gray-400 hover:text-red-400 transition-colors"><LogOut size={20} /></button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 space-y-8 no-scrollbar bg-slate-50 dark:bg-dark">
        {activeTab === 'dashboard' && (
           <div className="space-y-10 animate-fade-in max-w-7xl mx-auto w-full pb-20">
              <section className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black">ライブ・トラフィック・マップ</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                       <Move size={12} /> ホイールでズーム可能
                    </div>
                 </div>
                 <div className="relative w-full aspect-[2.5/1] min-h-[400px] bg-[#0a1128] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-slate-900 ring-1 ring-white/10 z-0">
                    <div ref={mapContainerRef} className="w-full h-full" />
                    <div className="absolute top-6 left-6 flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 text-[9px] font-black text-white uppercase tracking-[0.2em] shadow-2xl z-10">
                       <Globe size={12} className="text-blue-400 animate-spin-slow" /> Realtime Visualization
                    </div>
                 </div>
              </section>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 {[
                   { label: '本日PV', val: stats.today_pv, color: 'text-blue-600', icon: Activity },
                   { label: '累計アクセス', val: stats.total_pv, color: 'text-indigo-600', icon: BarChart3 },
                   { label: '受信メッセージ', val: messages.length, color: 'text-pink-600', icon: Mail },
                   { label: '遮断中のIP', val: Object.keys(blockedIps).length, color: 'text-red-600', icon: Shield }
                 ].map((card, i) => (
                    <div key={i} className="bg-white dark:bg-dark-lighter p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                       <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-4">{card.label}</p>
                       <p className={`text-3xl font-black ${card.color} font-mono tabular-nums`}>{card.val.toLocaleString()}</p>
                    </div>
                 ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-white dark:bg-dark-lighter p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="font-black text-lg mb-8 uppercase tracking-tight">トラフィック推移</h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                          <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold'}} />
                          <Area type="monotone" dataKey="pv" stroke="#3b82f6" strokeWidth={4} fill="#3b82f6" fillOpacity={0.1} animationDuration={500} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                 </div>
                 <div className="bg-white dark:bg-dark-lighter p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col h-[420px]">
                    <h3 className="font-black text-lg mb-6 uppercase tracking-tight">最近のアクセス</h3>
                    <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
                      {stats.recent_logs.slice(0, 20).map((log, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] p-2 rounded-xl border-b dark:border-gray-800 last:border-0">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-black truncate text-blue-600">{log.path}</p>
                            <p className="text-gray-400 font-mono">{log.ip}</p>
                          </div>
                          <p className="text-gray-500 font-bold whitespace-nowrap">{log.date.split(' ')[1]}</p>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'logs' && (
           <div className="animate-fade-in max-w-7xl mx-auto w-full space-y-6">
              <div className="bg-white dark:bg-dark-lighter rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                 <div className="p-8 border-b dark:border-gray-800 bg-slate-50 dark:bg-slate-800/30 space-y-6">
                    <div className="flex justify-between items-center">
                       <h3 className="font-black text-xl flex items-center gap-2"><Filter className="text-blue-500"/> ログフィルタリング</h3>
                       <button onClick={() => fetchData(false)} className="p-2 text-gray-400 hover:text-blue-500"><RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} /></button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <input type="text" placeholder="IPアドレス..." value={logFilterIp} onChange={e => setLogFilterIp(e.target.value)} className="w-full px-4 py-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 text-xs font-bold" />
                       <input type="text" placeholder="パス (例: /bath)" value={logFilterPath} onChange={e => setLogFilterPath(e.target.value)} className="w-full px-4 py-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 text-xs font-bold" />
                       <input type="text" placeholder="日付 (YYYY-MM-DD)" value={logFilterDate} onChange={e => setLogFilterDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 text-xs font-bold" />
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                          <tr><th className="px-8 py-5">日時</th><th className="px-8 py-5">パス</th><th className="px-8 py-5">クライアントIP</th><th className="px-8 py-5 text-right">状態</th></tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {filteredLogs.map((log, i) => (
                             <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="px-8 py-4 font-mono text-[11px] text-gray-500">{log.date}</td>
                                <td className="px-8 py-4 font-black text-blue-600">{log.path}</td>
                                <td className="px-8 py-4 font-mono text-[11px] text-gray-400">{log.ip}</td>
                                <td className="px-8 py-4 text-right"><span className="px-2 py-0.5 rounded text-[10px] font-black bg-green-100 text-green-600">{log.status || 200}</span></td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'messages' && (
           <div className="space-y-4 animate-fade-in max-w-5xl mx-auto w-full pb-20">
              {messages.length === 0 ? (
                <div className="text-center py-24 bg-white dark:bg-dark-lighter rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 font-black uppercase tracking-widest">受信メッセージはありません</div>
              ) : messages.map(m => (
                <div key={m.id} className="bg-white dark:bg-dark-lighter p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
                   <div className="flex justify-between mb-4 items-center">
                      <span className="font-black text-blue-600 flex items-center gap-2"><User size={18} /> {m.name} <span className="text-[10px] font-normal text-gray-400">({m.contact})</span></span>
                      <span className="text-[10px] text-gray-400 font-mono">{m.timestamp}</span>
                   </div>
                   <p className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed border dark:border-gray-800">{m.message}</p>
                </div>
              ))}
           </div>
        )}

        {activeTab === 'security' && (
           <div className="animate-fade-in max-w-7xl mx-auto w-full space-y-8">
              <div className="bg-white dark:bg-dark-lighter rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                 <div className="p-8 border-b bg-slate-50 dark:bg-slate-800/30">
                    <h3 className="font-black text-xl flex items-center gap-2"><XCircle className="text-red-500" /> 自動遮断されたIP</h3>
                 </div>
                 <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-sm text-left">
                       <thead className="text-[10px] uppercase font-black text-gray-400 bg-gray-50 dark:bg-slate-800">
                          <tr><th className="px-8 py-3">IPアドレス</th><th className="px-8 py-3">理由</th><th className="px-8 py-3">期限</th></tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {Object.entries(blockedIps).length === 0 ? (
                             <tr><td colSpan={3} className="text-center py-20 text-gray-400 font-bold">現在、遮断中のIPはありません</td></tr>
                          ) : Object.entries(blockedIps).map(([ip, item]: [string, any]) => (
                             <tr key={ip} className="hover:bg-slate-50">
                                <td className="px-8 py-6 font-mono font-black text-red-600">{ip}</td>
                                <td className="px-8 py-6 font-bold">{item.reason || 'DOS攻撃検知'}</td>
                                <td className="px-8 py-6 text-xs text-gray-500">{new Date(item.expiry * 1000).toLocaleString()}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'settings' && (
           <div className="animate-fade-in max-w-7xl mx-auto w-full space-y-10 pb-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* SMTP設定パネル */}
                 <div className="bg-white dark:bg-dark-lighter p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                    <h3 className="font-black text-xl flex items-center gap-3"><Mail className="text-pink-500" /> 通知用 SMTP 設定</h3>
                    <form onSubmit={handleUpdateConfig} className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase">ホスト名</label>
                             <input type="text" value={config.smtp_host} onChange={e => setConfig({...config, smtp_host: e.target.value})} className="w-full p-3 border rounded-xl font-bold dark:bg-slate-900" placeholder="smtp.example.com" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase">ポート</label>
                             <input type="number" value={config.smtp_port} onChange={e => setConfig({...config, smtp_port: Number(e.target.value)})} className="w-full p-3 border rounded-xl font-bold dark:bg-slate-900" placeholder="587" />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase">ユーザーID</label>
                          <input type="text" value={config.smtp_user} onChange={e => setConfig({...config, smtp_user: e.target.value})} className="w-full p-3 border rounded-xl font-bold dark:bg-slate-900" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase">パスワード (変更時のみ入力)</label>
                          <input type="password" value={config.smtp_pass} onChange={e => setConfig({...config, smtp_pass: e.target.value})} className="w-full p-3 border rounded-xl font-bold dark:bg-slate-900" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase">通知先メールアドレス</label>
                          <input type="email" value={config.alert_email} onChange={e => setConfig({...config, alert_email: e.target.value})} className="w-full p-3 border rounded-xl font-bold dark:bg-slate-900" />
                       </div>
                       {configMsg && <p className="text-xs font-bold text-blue-500">{configMsg}</p>}
                       <button type="submit" disabled={isUpdatingConfig} className="w-full py-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black rounded-2xl hover:opacity-90 flex items-center justify-center gap-2">
                          {isUpdatingConfig ? <Loader2 className="animate-spin" /> : <Save size={20} />} 設定を更新
                       </button>
                    </form>
                 </div>

                 {/* セキュリティ/パスワード更新パネル */}
                 <div className="bg-white dark:bg-dark-lighter p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                    <h3 className="font-black text-xl flex items-center gap-3"><KeyRound className="text-blue-500" /> 管理パスワードの更新</h3>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3">
                       <AlertTriangle className="text-blue-600 shrink-0 mt-0.5" size={16} />
                       <p className="text-[10px] text-blue-800 dark:text-blue-300 font-bold leading-relaxed">
                          セキュリティのため、定期的な変更を推奨します。変更後は現在のセッションを含むすべてのログインが無効化されます。
                       </p>
                    </div>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase">新しいパスワード</label>
                          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full p-3 border rounded-xl font-bold dark:bg-slate-900" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase">新しいパスワード (確認)</label>
                          <input type="password" value={newPassConfirm} onChange={e => setNewPassConfirm(e.target.value)} className="w-full p-3 border rounded-xl font-bold dark:bg-slate-900" />
                       </div>
                       <button type="submit" disabled={!newPass} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 dark:shadow-none transition-all flex items-center justify-center gap-2">
                          <ShieldCheck size={20} /> パスワードを更新して再起動
                       </button>
                    </form>
                 </div>
              </div>
           </div>
        )}
      </main>
      
      <footer className="bg-white dark:bg-slate-900 border-t dark:border-gray-800 h-10 px-6 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">LIVE SYNC ACTIVE</span></div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" className="hover:underline">OSM</a> contributors</div>
         </div>
         <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Sync: {new Date().toLocaleTimeString()}</div>
      </footer>

      <style>{`
        @keyframes access-line { to { stroke-dashoffset: -15; } }
        .animate-access-line { animation: access-line 1s linear infinite; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .leaflet-container { background: #0a1128 !important; border-radius: 2rem; }
      `}</style>
    </div>
  );
};

export default AdminPage;