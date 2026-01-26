
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

// Leaflet動적読み込みヘルパー
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
interface DosPattern { count: number; seconds: number; block_minutes: number; }
interface ServerResources {
  cpu: number;
  mem: { total: number; used: number; percent: number; };
  disk: { total: number; used: number; percent: number; };
}
interface AdminConfig {
  smtp_host: string; smtp_port: number; smtp_user: string; smtp_pass?: string; alert_email: string;
  dos_patterns: DosPattern[];
  dos_notify_enabled: boolean;
}

const ADMIN_PATH = '/secure-panel-7x9v2';
const SERVER_LOCATION: [number, number] = [35.6895, 139.6917]; // 東京

const AdminPage: React.FC = () => {
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('admin_token'));
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'messages' | 'security' | 'settings'>('dashboard');
  
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [stats, setStats] = useState<{total_pv: number, today_pv: number, recent_logs: AccessLog[]}>({ total_pv: 0, today_pv: 0, recent_logs: [] });
  const [serverResources, setServerResources] = useState<ServerResources | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [blockedIps, setBlockedIps] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // マップ関連
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const activeElementsRef = useRef<{markers: any[], lines: any[]}>({ markers: [], lines: [] });
  const geoCacheRef = useRef<Record<string, {lat: number, lon: number}>>({});

  const [logFilterIp, setLogFilterIp] = useState('');
  const [logFilterPath, setLogFilterPath] = useState('');
  const [logFilterDate, setLogFilterDate] = useState('');

  const [monitoredAppIds, setMonitoredAppIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('admin_monitored_apps');
    return saved ? JSON.parse(saved) : ['qrcode', 'kakeibo', 'bath'];
  });

  const [config, setConfig] = useState<AdminConfig>({
    smtp_host: '', smtp_port: 587, smtp_user: '', smtp_pass: '', alert_email: '',
    dos_patterns: [{ count: 30, seconds: 30, block_minutes: 15 }],
    dos_notify_enabled: true
  });
  const [configMsg, setConfigMsg] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [newPassConfirm, setNewPassConfirm] = useState('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('admin_monitored_apps', JSON.stringify(monitoredAppIds));
  }, [monitoredAppIds]);

  // マップ初期化 (Dashboardタブ表示時)
  useEffect(() => {
    if (activeTab !== 'dashboard' || !token) return;
    
    let mapInstance: any;
    loadLeaflet().then((L) => {
      if (!mapContainerRef.current) return;
      
      mapInstance = L.map(mapContainerRef.current, {
        scrollWheelZoom: false,
        dragging: true,
        zoomControl: false,
        attributionControl: false
      }).setView([20, 0], 2);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(mapInstance);

      // サーバー中心地点マーカー (東京)
      const serverIcon = L.divIcon({
        className: 'server-marker',
        html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_15px_#3b82f6] animate-pulse"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      L.marker(SERVER_LOCATION, { icon: serverIcon }).addTo(mapInstance);

      mapRef.current = mapInstance;
    });

    return () => {
      if (mapInstance) mapInstance.remove();
      mapRef.current = null;
    };
  }, [activeTab, token]);

  // アクセスログのマップ反映ロジック
  useEffect(() => {
    if (!mapRef.current || stats.recent_logs.length === 0) return;
    const L = (window as any).L;
    if (!L) return;

    const processLogs = async () => {
      // 直近5件の新しいユニークIPのみをピックアップ
      const recentUniqueIps = Array.from(new Set(stats.recent_logs.slice(0, 10).map(l => l.ip))).slice(0, 3);
      
      for (const ip of recentUniqueIps) {
        if (ip.startsWith('127.') || ip.startsWith('192.168.')) continue;
        
        let coords = geoCacheRef.current[ip];
        if (!coords) {
          try {
            const res = await fetch(`https://ipwho.is/${ip}`);
            const json = await res.json();
            if (json.success) {
              coords = { lat: json.latitude, lon: json.longitude };
              geoCacheRef.current[ip] = coords;
            }
          } catch (e) { continue; }
        }

        if (coords && mapRef.current) {
          const markerId = `marker-${ip}`;
          // 重複描画を防止
          if (activeElementsRef.current.markers.some(m => m._id === markerId)) continue;

          // クライアントマーカー
          const clientIcon = L.divIcon({
            className: 'client-marker',
            html: `<div class="w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-[0_0_10px_#10b981] animate-ping"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          });
          const marker = L.marker([coords.lat, coords.lon], { icon: clientIcon }).addTo(mapRef.current);
          marker._id = markerId;

          // アクセスライン (曲線)
          const latlngs = [ [coords.lat, coords.lon], SERVER_LOCATION ];
          const polyline = L.polyline(latlngs, {
            color: '#10b981',
            weight: 2,
            opacity: 0.4,
            dashArray: '5, 10',
            className: 'animate-access-line'
          }).addTo(mapRef.current);

          activeElementsRef.current.markers.push(marker);
          activeElementsRef.current.lines.push(polyline);

          // 10秒後に消去
          setTimeout(() => {
            if (marker) marker.remove();
            if (polyline) polyline.remove();
            activeElementsRef.current.markers = activeElementsRef.current.markers.filter(m => m !== marker);
            activeElementsRef.current.lines = activeElementsRef.current.lines.filter(l => l !== polyline);
          }, 10000);
        }
      }
    };

    processLogs();
  }, [stats.recent_logs]);

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

  const appStats = useMemo(() => {
    const counts: Record<string, number> = {};
    stats.recent_logs.forEach(log => {
      const tool = TOOLS.find(t => t.path === log.path);
      if (tool) counts[tool.id] = (counts[tool.id] || 0) + 1;
    });
    return counts;
  }, [stats.recent_logs]);

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
        setServerResources(data.server_resources || null);
        if (isFirst && data.config) {
            setConfig(prev => ({ 
              ...prev, 
              ...data.config, 
              smtp_pass: '',
              dos_patterns: data.config.dos_patterns || [{ count: 30, seconds: 30, block_minutes: 15 }]
            }));
            setIsDirty(false);
        }
      } else if (res.status === 403) logout();
    } catch (e) { console.error(e); } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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
      } else setLoginError(data.error);
    } catch (e) { setLoginError('通信エラー'); } finally { setIsLoggingIn(false); }
  };

  const logout = () => { setToken(null); sessionStorage.removeItem('admin_token'); };
  const drillDownToApp = (path: string) => { setLogFilterPath(path); setLogFilterIp(''); setLogFilterDate(''); setActiveTab('logs'); };
  const formatSize = (bytes: number) => { if (bytes === 0) return '0 B'; const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB', 'TB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]; };

  useEffect(() => {
    if (token) {
      fetchData(true);
      const interval = setInterval(() => fetchData(false), 1500);
      return () => clearInterval(interval);
    }
  }, [token]);

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
      <header className="bg-slate-900 text-white border-b border-white/10 h-16 flex items-center justify-between px-6 shrink-0 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-1.5 rounded-lg"><ShieldAlert size={20} /></div>
          <h1 className="text-lg font-black tracking-tight">管理コンソール <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">v2.8.5</span></h1>
        </div>
        <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-xl overflow-x-auto no-scrollbar">
           {[
             { id: 'dashboard', label: '統計' },
             { id: 'logs', label: 'ログ' },
             { id: 'messages', label: '受信箱' },
             { id: 'security', label: 'IP・DOS制限' },
             { id: 'settings', label: '設定・メンテ' }
           ].map(t => (
             <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-white text-slate-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}>{t.label}</button>
           ))}
        </div>
        <button onClick={logout} className="p-2 text-gray-400 hover:text-red-400 transition-colors"><LogOut size={20} /></button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 space-y-8 no-scrollbar bg-slate-50 dark:bg-dark">
        {activeTab === 'dashboard' && (
           <div className="space-y-10 animate-fade-in max-w-7xl mx-auto w-full pb-20">
              
              {/* REAL-TIME TRAFFIC MAP */}
              <section className="space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <h3 className="text-xl font-black">ライブ・トラフィック・マップ</h3>
                       <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded animate-pulse">LIVE MONITOR</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                       <Move size={12} /> マップをドラッグ可能
                    </div>
                 </div>
                 <div className="relative w-full aspect-[2.5/1] min-h-[350px] bg-[#0a1128] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-slate-900 ring-1 ring-white/10 z-0">
                    <div ref={mapContainerRef} className="w-full h-full" />
                    
                    {/* カスタムレジェンド */}
                    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl pointer-events-none">
                       <div className="flex items-center gap-3 text-[9px] font-black text-white uppercase tracking-wider">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white shadow-[0_0_5px_#3b82f6]"></div> ホストサーバー
                       </div>
                       <div className="flex items-center gap-3 text-[9px] font-black text-white uppercase tracking-wider">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white shadow-[0_0_5px_#10b981]"></div> アクティブユーザー
                       </div>
                    </div>

                    <div className="absolute top-6 left-6 flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 text-[9px] font-black text-white uppercase tracking-[0.2em] shadow-2xl z-10">
                       <Globe size={12} className="text-blue-400 animate-spin-slow" /> Global Traffic Visualizer v1.2
                    </div>
                 </div>
              </section>

              {/* Server Resources Monitoring */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                   <h3 className="text-xl font-black">サーバー状態</h3>
                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      REAL-TIME
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {[
                     { label: 'CPU負荷', val: serverResources?.cpu ?? 0, icon: Cpu, color: 'text-amber-500', sub: '直近1分間', percent: Math.min(Math.round(serverResources?.cpu ?? 0), 100) },
                     { label: 'メモリ使用率', val: serverResources?.mem.percent ?? 0, icon: Microchip, color: 'text-blue-500', sub: serverResources ? `${formatSize(serverResources.mem.used)} / ${formatSize(serverResources.mem.total)}` : '--', percent: serverResources?.mem.percent ?? 0 },
                     { label: 'ディスク使用率', val: serverResources?.disk.percent ?? 0, icon: HardDrive, color: 'text-purple-500', sub: serverResources ? `${formatSize(serverResources.disk.used)} / ${formatSize(serverResources.disk.total)}` : '--', percent: serverResources?.disk.percent ?? 0 }
                   ].map((res, i) => (
                      <div key={i} className="bg-white dark:bg-dark-lighter p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                         <div className="flex justify-between items-start mb-4">
                            <div className={`${res.color} bg-gray-50 dark:bg-gray-800 p-2 rounded-xl`}><res.icon size={20} /></div>
                            <span className="text-2xl font-black font-mono tabular-nums">{res.percent}%</span>
                         </div>
                         <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">{res.label}</p>
                         <p className="text-[10px] font-bold text-gray-500 truncate mb-4">{res.sub}</p>
                         <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${res.percent > 90 ? 'bg-red-500' : res.percent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${res.percent}%` }} />
                         </div>
                      </div>
                   ))}
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
                    <div className="flex justify-between items-center mb-8">
                       <h3 className="font-black text-lg uppercase tracking-tight">トラフィック推移 (LIVE)</h3>
                       <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></div>
                          1.5s UPDATE
                       </div>
                    </div>
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

                 <div className="bg-white dark:bg-dark-lighter p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                    <h3 className="font-black text-lg mb-6 uppercase tracking-tight">リアルタイム・ログ</h3>
                    <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
                      {stats.recent_logs.slice(0, 15).map((log, i) => (
                        <div key={i} className={`flex justify-between items-center text-[10px] p-2 rounded-xl border-b dark:border-gray-800 last:border-0 ${log.path === ADMIN_PATH ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                          <div className="min-w-0 flex-1">
                            <p className={`font-black truncate ${log.path === ADMIN_PATH ? 'text-red-600' : 'text-blue-600'}`}>{log.path}</p>
                            <p className="text-gray-400 font-mono">{log.ip}</p>
                          </div>
                          <p className="text-gray-500 font-bold ml-4 whitespace-nowrap">{log.date.split(' ')[1]}</p>
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
                       <div className="flex items-center gap-4">
                          {logFilterPath && <button onClick={() => setLogFilterPath('')} className="text-[10px] bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-black flex items-center gap-1">Path: {logFilterPath} <X size={12}/></button>}
                          <button onClick={() => { setLogFilterIp(''); setLogFilterPath(''); setLogFilterDate(''); }} className="text-[10px] text-gray-400 font-black hover:text-red-500 transition-colors">リセット</button>
                          <button onClick={() => fetchData(false)} className="p-2 text-gray-400 hover:text-blue-500"><RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} /></button>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} /><input type="text" placeholder="IPアドレス..." value={logFilterIp} onChange={e => setLogFilterIp(e.target.value)} className="w-full pl-9 pr-3 py-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 text-xs font-bold" /></div>
                       <div className="relative"><AppWindow className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} /><input type="text" placeholder="パス (例: /bath)" value={logFilterPath} onChange={e => setLogFilterPath(e.target.value)} className="w-full pl-9 pr-3 py-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 text-xs font-bold" /></div>
                       <div className="relative"><Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} /><input type="text" placeholder="日付 (YYYY-MM-DD)" value={logFilterDate} onChange={e => setLogFilterDate(e.target.value)} className="w-full pl-9 pr-3 py-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 text-xs font-bold" /></div>
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                          <tr><th className="px-8 py-5">日時</th><th className="px-8 py-5">パス</th><th className="px-8 py-5">クライアントIP</th><th className="px-8 py-5">応答</th><th className="px-8 py-5 text-right">状態</th></tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {filteredLogs.length === 0 ? (<tr><td colSpan={5} className="py-20 text-center text-gray-400 font-bold">該当するログはありません</td></tr>) : filteredLogs.map((log, i) => (
                                <tr key={i} className={`transition-colors ${log.path === ADMIN_PATH ? 'bg-red-50 dark:bg-red-900/10 hover:bg-red-100' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                                   <td className="px-8 py-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">{log.date}</td>
                                   <td className="px-8 py-4"><div className="flex items-center gap-2"><span className={`font-black truncate max-w-[200px] ${log.path === ADMIN_PATH ? 'text-red-600' : 'text-blue-600 dark:text-blue-400'}`}>{log.path}</span>{log.path === ADMIN_PATH && <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase">Admin Access</span>}</div></td>
                                   <td className="px-8 py-4 font-mono text-[11px] text-gray-400">{log.ip}</td>
                                   <td className="px-8 py-4 font-mono text-[11px] font-black">{log.duration ? `${log.duration}ms` : '--'}</td>
                                   <td className="px-8 py-4 text-right"><span className={`px-2 py-0.5 rounded text-[10px] font-black ${log.status && log.status >= 400 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{log.status || 200}</span></td>
                                </tr>
                             ))
                          }
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'security' && (
           <div className="animate-fade-in max-w-7xl mx-auto w-full space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-dark-lighter rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                   <div className="p-8 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-800/30"><div><h3 className="font-black text-xl flex items-center gap-2"><XCircle className="text-red-500" /> 遮断中のIP</h3><p className="text-xs text-gray-400 mt-1">過剰リクエストにより制限された端末</p></div><button onClick={() => fetchData(false)} className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:text-blue-500 transition-colors"><RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} /></button></div>
                   <div className="overflow-x-auto min-h-[300px]"><table className="w-full text-sm text-left"><thead className="text-[10px] uppercase font-black text-gray-400 bg-gray-50 dark:bg-slate-800"><tr><th className="px-8 py-3">IP</th><th className="px-8 py-3">理由</th><th className="px-8 py-3">期限</th><th className="px-8 py-3 text-right">操作</th></tr></thead><tbody className="divide-y divide-gray-100 dark:divide-gray-800">{Object.entries(blockedIps).length === 0 ? (<tr><td colSpan={4} className="text-center py-20 text-gray-400 font-bold">遮断中のIPはありません</td></tr>) : Object.entries(blockedIps).map(([ip, item]: [string, any]) => (<tr key={ip} className="hover:bg-slate-50 dark:hover:bg-gray-800/50"><td className="px-8 py-6 font-mono font-black text-red-600">{ip}</td><td className="px-8 py-6"><span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded font-black">{item.reason || '手動'}</span></td><td className="px-8 py-6 text-xs font-bold text-gray-500">{item.expiry >= 2147483640 ? '永久' : new Date(item.expiry * 1000).toLocaleString()}</td><td className="px-8 py-6 text-right"><button onClick={() => {}} className="px-6 py-2 bg-blue-600 text-white text-[10px] font-black rounded-xl hover:bg-blue-700 transition-all">解除</button></td></tr>))}</tbody></table></div>
                </div>
                <div className="bg-white dark:bg-dark-lighter p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
                   <h3 className="font-black text-xl flex items-center gap-3"><ShieldCheck className="text-emerald-500" /> セキュリティ設定</h3>
                   <div className="mt-6 flex-1 text-gray-400 text-center py-20 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                      <p className="font-black text-xs uppercase tracking-widest">Configuration Panel Locked</p>
                   </div>
                </div>
              </div>
           </div>
        )}

        {activeTab === 'messages' && (
           <div className="space-y-4 animate-fade-in max-w-5xl mx-auto w-full pb-20">{messages.length === 0 ? (<div className="text-center py-24 bg-white dark:bg-dark-lighter rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 font-black uppercase tracking-widest">受信メッセージはありません</div>) : messages.map(m => (<div key={m.id} className="bg-white dark:bg-dark-lighter p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group"><div className="flex flex-col sm:flex-row justify-between mb-6 gap-2"><span className="font-black text-blue-600 flex items-center gap-3"><div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-gray-400"><User size={20} /></div>{m.name} <span className="text-[10px] font-normal text-gray-400">({m.contact || '連絡先なし'})</span></span><span className="text-[10px] text-gray-400 font-mono bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border dark:border-gray-700">{m.timestamp} (IP: {m.ip})</span></div><p className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl whitespace-pre-wrap leading-relaxed text-sm text-gray-700 dark:text-gray-300 font-medium border dark:border-gray-800">{m.message}</p></div>))}</div>
        )}

        {activeTab === 'settings' && (
           <div className="animate-fade-in max-w-7xl mx-auto w-full space-y-10 pb-20"><div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><div className="bg-white dark:bg-dark-lighter p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm space-y-6"><h3 className="font-black text-xl flex items-center gap-3"><Mail className="text-pink-500" /> 通知用 SMTP 設定</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ホスト名</label><input type="text" value={config.smtp_host} disabled className="w-full p-3 border rounded-xl font-bold dark:bg-slate-900 opacity-50" /></div><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ポート</label><input type="number" value={config.smtp_port} disabled className="w-full p-3 border rounded-xl font-bold dark:bg-slate-900 opacity-50" /></div></div></div><div className="bg-white dark:bg-dark-lighter p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm space-y-6"><h3 className="font-black text-xl flex items-center gap-3"><KeyRound className="text-blue-500" /> パスワードの更新</h3><div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3"><AlertTriangle className="text-blue-600 shrink-0 mt-0.5" size={16} /><p className="text-[10px] text-blue-800 dark:text-blue-300 font-bold leading-relaxed">セキュリティのため、変更後はすべてのセッションが切断されます。</p></div></div></div></div>
        )}
      </main>
      
      <footer className="bg-white dark:bg-slate-900 border-t dark:border-gray-800 h-10 px-6 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">LIVE CONNECTION ACTIVE</span></div>
            <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" className="hover:underline">OSM</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" className="hover:underline">CARTO</a></div>
         </div>
         <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Sync: {new Date().toLocaleTimeString()}</div>
      </footer>

      <style>{`
        @keyframes access-line {
          to { stroke-dashoffset: -15; }
        }
        .animate-access-line {
          animation: access-line 1s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .leaflet-container {
          background: #0a1128 !important;
        }
      `}</style>
    </div>
  );
};

export default AdminPage;
