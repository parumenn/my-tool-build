
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Lock, ShieldAlert, Mail, User, LogOut, Loader2, 
  Activity, BarChart3, Settings, Clock, Shield, KeyRound,
  RefreshCw, CheckCircle2, AlertTriangle, XCircle, Trash2, 
  Download, Upload, Database, Server, Zap, ShieldCheck,
  TrendingUp, ListOrdered, FileJson, Send, Plus, Minus, Infinity,
  ShieldQuestion, ToggleLeft, ToggleRight, Filter, Search, AppWindow,
  PieChart as PieIcon, ArrowUpRight, X, ChevronRight, MousePointer2,
  HardDrive, Cpu, Microchip, Map as MapIcon, Globe
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TOOLS } from '../../constants/toolsData';

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
const SERVER_POS: [number, number] = [35.6895, 139.6917]; // サーバー位置（東京）

// LeafletをCDNから動的に読み込む
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

  // Map
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const mapMarkersRef = useRef<any[]>([]);
  const mapLinesRef = useRef<any[]>([]); // Lines Ref
  const [geoData, setGeoData] = useState<Record<string, { lat: number, lon: number, city: string, country: string }>>({});

  // ログフィルター
  const [logFilterIp, setLogFilterIp] = useState('');
  const [logFilterPath, setLogFilterPath] = useState('');
  const [logFilterDate, setLogFilterDate] = useState('');

  // アプリ別モニタリング
  const [monitoredAppIds, setMonitoredAppIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('admin_monitored_apps');
    return saved ? JSON.parse(saved) : ['qrcode', 'kakeibo', 'bath'];
  });

  useEffect(() => { localStorage.setItem('admin_monitored_apps', JSON.stringify(monitoredAppIds)); }, [monitoredAppIds]);

  // 設定フォーム
  const [config, setConfig] = useState<AdminConfig>({
    smtp_host: '', smtp_port: 587, smtp_user: '', smtp_pass: '', alert_email: '',
    dos_patterns: [{ count: 30, seconds: 30, block_minutes: 15 }],
    dos_notify_enabled: true
  });
  const [configMsg, setConfigMsg] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  
  // パスワード変更
  const [newPass, setNewPass] = useState('');
  const [newPassConfirm, setNewPassConfirm] = useState('');
  
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map Render Logic
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (activeTab !== 'dashboard' || !mapContainerRef.current) return;

      const L = await loadLeaflet();
      
      // Initialize Map if not exists
      if (!mapInstanceRef.current && mapContainerRef.current) {
          const map = L.map(mapContainerRef.current, {
              scrollWheelZoom: false,
              attributionControl: false
          }).setView([25, 0], 2);
          
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
          
          // Server Location Marker (Tokyo)
          const serverIcon = L.divIcon({
              className: 'server-icon',
              html: `<div style="background-color: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px #ef4444;"></div>`,
              iconSize: [14, 14], iconAnchor: [7, 7]
          });
          L.marker(SERVER_POS, { icon: serverIcon, zIndexOffset: 1000 }).addTo(map).bindPopup('<div class="font-bold text-center">OMNITOOLS SERVER<br><span class="text-xs text-gray-400">Tokyo, JP</span></div>');

          mapInstanceRef.current = map;
      }
      
      if (isMounted) updateMapData();
    };

    initMap();

    // Cleanup on tab switch
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        mapMarkersRef.current = [];
        mapLinesRef.current = [];
      }
    };
  }, [activeTab]);

  // Update Map Elements
  const updateMapData = async () => {
    const L = await loadLeaflet();
    if (!mapInstanceRef.current || !L) return;

    // Clear existing
    mapMarkersRef.current.forEach(m => m.remove());
    mapLinesRef.current.forEach(l => l.remove());
    mapMarkersRef.current = [];
    mapLinesRef.current = [];

    const uniqueIps = Array.from(new Set(stats.recent_logs.map(l => l.ip))).slice(0, 30);

    for (const ip of uniqueIps) {
        if (ip.startsWith('192.168.') || ip.startsWith('127.') || ip.startsWith('10.')) continue;
        
        let data = geoData[ip];
        if (!data) {
            // Fetch if missing
            fetch(`https://ipwho.is/${ip}`)
                .then(res => res.json())
                .then(json => {
                    if (json.success) {
                        setGeoData(prev => ({...prev, [ip]: { lat: json.latitude, lon: json.longitude, city: json.city, country: json.country_code }}));
                    }
                })
                .catch(() => {});
            continue;
        }

        if (data) {
            // Marker
            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: #3b82f6; width: 8px; height: 8px; border-radius: 50%; border: 1px solid white; box-shadow: 0 0 8px #3b82f6;"></div>`,
                iconSize: [8, 8], iconAnchor: [4, 4]
            });
            const marker = L.marker([data.lat, data.lon], { icon }).addTo(mapInstanceRef.current);
            marker.bindPopup(`<b>${ip}</b><br>${data.city}, ${data.country}`);
            mapMarkersRef.current.push(marker);

            // Access Line (Animated)
            const latlngs = [[data.lat, data.lon], SERVER_POS];
            const polyline = L.polyline(latlngs, { 
                color: '#3b82f6', 
                weight: 1, 
                opacity: 0.4,
                className: 'access-line'
            }).addTo(mapInstanceRef.current);
            mapLinesRef.current.push(polyline);
        }
    }
  };

  useEffect(() => {
      if (activeTab === 'dashboard' && mapInstanceRef.current) {
          updateMapData();
      }
  }, [stats.recent_logs, geoData]); // Removed activeTab dependency here to avoid double-firing

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

  const handleUpdateSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;
    
    if (newPass && newPass !== newPassConfirm) {
      alert('新しいパスワードが一致しません。');
      return;
    }

    setConfigMsg('保存中...');
    try {
      const res = await fetch('./backend/admin_api.php?action=update_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
        body: JSON.stringify({ ...config, new_password: newPass || undefined })
      });
      if (res.ok) {
        setConfigMsg('設定を保存しました。');
        setIsDirty(false);
        setNewPass('');
        setNewPassConfirm('');
        setTimeout(() => setConfigMsg(''), 3000);
        fetchData(false);
      } else setConfigMsg('保存に失敗しました。');
    } catch (e) { setConfigMsg('エラーが発生しました。'); }
  };

  const handleTestEmail = async () => {
    if (!token) return;
    setIsTestingEmail(true);
    try {
      const res = await fetch('./backend/admin_api.php?action=test_email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      alert(data.status === '成功' ? 'テストメールを送信しました。' : `失敗: ${data.error}`);
    } catch (e) { alert('通信エラー'); } finally { setIsTestingEmail(false); }
  };

  const handleUnblock = async (ip: string) => {
    if(!confirm(`${ip} の遮断を解除しますか？`)) return;
    try {
      const res = await fetch(`./backend/admin_api.php?action=unblock_ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token || '' },
        body: JSON.stringify({ ip })
      });
      if (res.ok) fetchData(false);
    } catch (e) { alert('解除失敗'); }
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

  const drillDownToApp = (path: string) => {
    setLogFilterPath(path);
    setLogFilterIp('');
    setLogFilterDate('');
    setActiveTab('logs');
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  useEffect(() => {
    if (token) {
      fetchData(true);
      const interval = setInterval(() => fetchData(false), 3000);
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
          <h1 className="text-lg font-black tracking-tight">管理コンソール <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">v2.8.0</span></h1>
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
              
              {/* Access Map Visualization */}
              <div className="bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-700 overflow-hidden relative group">
                 <div className="absolute top-6 left-6 z-10 bg-slate-800/80 backdrop-blur px-4 py-2 rounded-xl border border-white/10">
                    <h3 className="text-white font-black text-sm flex items-center gap-2">
                       <Globe size={16} className="text-blue-400" /> アクセスMAP
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold">直近のアクセス元を表示</p>
                 </div>
                 <div ref={mapContainerRef} className="w-full h-[350px] bg-[#0a1128] z-0"></div>
                 <style>{`
                    .leaflet-container { background: #0a1128 !important; } 
                    .leaflet-popup-content-wrapper { background: rgba(15, 23, 42, 0.9); color: white; border-radius: 8px; font-size: 10px; } 
                    .leaflet-popup-tip { background: rgba(15, 23, 42, 0.9); }
                    @keyframes dash {
                      to { stroke-dashoffset: -20; }
                    }
                    .access-line {
                      stroke-dasharray: 5, 10;
                      animation: dash 1s linear infinite;
                    }
                 `}</style>
              </div>

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
                     { 
                       label: 'CPU負荷', 
                       val: serverResources?.cpu ?? 0, 
                       icon: Cpu, 
                       color: 'text-amber-500', 
                       sub: '直近1分間',
                       percent: Math.min(Math.round(serverResources?.cpu ?? 0), 100)
                     },
                     { 
                       label: 'メモリ使用率', 
                       val: serverResources?.mem.percent ?? 0, 
                       icon: Microchip, 
                       color: 'text-blue-500', 
                       sub: serverResources ? `${formatSize(serverResources.mem.used)} / ${formatSize(serverResources.mem.total)}` : '--',
                       percent: serverResources?.mem.percent ?? 0
                     },
                     { 
                       label: 'ディスク使用率', 
                       val: serverResources?.disk.percent ?? 0, 
                       icon: HardDrive, 
                       color: 'text-purple-500', 
                       sub: serverResources ? `${formatSize(serverResources.disk.used)} / ${formatSize(serverResources.disk.total)}` : '--',
                       percent: serverResources?.disk.percent ?? 0
                     }
                   ].map((res, i) => (
                      <div key={i} className="bg-white dark:bg-dark-lighter p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                         <div className="flex justify-between items-start mb-4">
                            <div className={`${res.color} bg-gray-50 dark:bg-gray-800 p-2 rounded-xl`}>
                               <res.icon size={20} />
                            </div>
                            <span className="text-2xl font-black font-mono tabular-nums">{res.percent}%</span>
                         </div>
                         <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">{res.label}</p>
                         <p className="text-[10px] font-bold text-gray-500 truncate mb-4">{res.sub}</p>
                         <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${
                                res.percent > 90 ? 'bg-red-500' : res.percent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`} 
                              style={{ width: `${res.percent}%` }}
                            />
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
                          3s UPDATE
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

              <section className="space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <h3 className="text-xl font-black">アプリ別トラフィック</h3>
                  <select className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black" onChange={(e) => { if(e.target.value && !monitoredAppIds.includes(e.target.value)) setMonitoredAppIds([...monitoredAppIds, e.target.value]); e.target.value = ""; }}>
                    <option value="">監視対象を追加...</option>
                    {TOOLS.filter(t => !monitoredAppIds.includes(t.id)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {monitoredAppIds.map(appId => {
                      const app = TOOLS.find(t => t.id === appId);
                      if (!app) return null;
                      const count = appStats[appId] || 0;
                      const totalAppHits = Object.values(appStats).reduce((a: number, b: number) => a + b, 0);
                      const ratio = totalAppHits > 0 ? (count / totalAppHits * 100).toFixed(1) : '0';
                      return (
                        <div 
                          key={appId} 
                          onClick={() => drillDownToApp(app.path)}
                          className="bg-white dark:bg-dark-lighter p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative group animate-scale-up cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl transition-all"
                        >
                           <button onClick={(e) => { e.stopPropagation(); setMonitoredAppIds(monitoredAppIds.filter(a => a !== appId)); }} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16} /></button>
                           <div className="flex items-center gap-3 mb-6">
                              <div className={`p-3 rounded-2xl ${app.lightBg} ${app.color}`}><app.icon size={20} /></div>
                              <div className="min-w-0">
                                 <h4 className="font-black text-sm truncate">{app.name}</h4>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase">{app.path}</p>
                              </div>
                           </div>
                           <div className="flex justify-between items-end">
                              <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-tighter">RECENT PV</p><p className="text-3xl font-black font-mono">{count}</p></div>
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-blue-500 mb-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">LOGS <ChevronRight size={10}/></p>
                                 <p className="text-xl font-black font-mono text-emerald-600">{ratio}%</p>
                              </div>
                           </div>
                        </div>
                      );
                   })}
                </div>
              </section>
           </div>
        )}

        {/* ... (Other tabs 'logs', 'messages', 'security', 'settings' remain mostly the same, ensuring SMTP settings are correctly wired) ... */}
        {activeTab === 'logs' && (
           <div className="animate-fade-in max-w-7xl mx-auto w-full space-y-6">
              <div className="bg-white dark:bg-dark-lighter rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                 <div className="p-8 border-b dark:border-gray-800 bg-slate-50 dark:bg-slate-800/30 space-y-6">
                    <div className="flex justify-between items-center">
                       <h3 className="font-black text-xl flex items-center gap-2"><Filter className="text-blue-500"/> ログフィルタリング</h3>
                       <div className="flex items-center gap-4">
                          {logFilterPath && (
                             <button onClick={() => setLogFilterPath('')} className="text-[10px] bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-black flex items-center gap-1">Path: {logFilterPath} <X size={12}/></button>
                          )}
                          <button onClick={() => { setLogFilterIp(''); setLogFilterPath(''); setLogFilterDate(''); }} className="text-[10px] text-gray-400 font-black hover:text-red-500 transition-colors">リセット</button>
                          <button onClick={() => fetchData(false)} className="p-2 text-gray-400 hover:text-blue-500"><RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} /></button>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <input type="text" placeholder="IPアドレス..." value={logFilterIp} onChange={e => setLogFilterIp(e.target.value)} className="w-full pl-9 pr-3 py-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 text-xs font-bold" />
                       </div>
                       <div className="relative">
                          <AppWindow className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <input type="text" placeholder="パス (例: /bath)" value={logFilterPath} onChange={e => setLogFilterPath(e.target.value)} className="w-full pl-9 pr-3 py-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 text-xs font-bold" />
                       </div>
                       <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <input type="text" placeholder="日付 (YYYY-MM-DD)" value={logFilterDate} onChange={e => setLogFilterDate(e.target.value)} className="w-full pl-9 pr-3 py-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 text-xs font-bold" />
                       </div>
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                          <tr><th className="px-8 py-5">日時</th><th className="px-8 py-5">パス</th><th className="px-8 py-5">クライアントIP</th><th className="px-8 py-5">応答</th><th className="px-8 py-5 text-right">状態</th></tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {filteredLogs.length === 0 ? (
                             <tr><td colSpan={5} className="py-20 text-center text-gray-400 font-bold">該当するログはありません</td></tr>
                          ) : (
                             filteredLogs.map((log, i) => (
                                <tr key={i} className={`transition-colors ${log.path === ADMIN_PATH ? 'bg-red-50 dark:bg-red-900/10 hover:bg-red-100' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                                   <td className="px-8 py-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">{log.date}</td>
                                   <td className="px-8 py-4">
                                      <div className="flex items-center gap-2">
                                         <span className={`font-black truncate max-w-[200px] ${log.path === ADMIN_PATH ? 'text-red-600' : 'text-blue-600 dark:text-blue-400'}`}>{log.path}</span>
                                         {log.path === ADMIN_PATH && <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase">Admin Access</span>}
                                      </div>
                                   </td>
                                   <td className="px-8 py-4 font-mono text-[11px] text-gray-400">{log.ip}</td>
                                   <td className="px-8 py-4 font-mono text-[11px] font-black">{log.duration ? `${log.duration}ms` : '--'}</td>
                                   <td className="px-8 py-4 text-right"><span className={`px-2 py-0.5 rounded text-[10px] font-black ${log.status && log.status >= 400 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{log.status || 200}</span></td>
                                </tr>
                             ))
                          )}
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
                   <div className="p-8 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
                      <div>
                        <h3 className="font-black text-xl flex items-center gap-2"><XCircle className="text-red-500" /> 遮断中のIP</h3>
                        <p className="text-xs text-gray-400 mt-1">過剰リクエストにより自動または手動で制限された端末</p>
                      </div>
                      <button onClick={() => fetchData(false)} className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:text-blue-500 transition-colors"><RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} /></button>
                   </div>
                   <div className="overflow-x-auto min-h-[300px]">
                      <table className="w-full text-sm text-left">
                        <thead className="text-[10px] uppercase font-black text-gray-400 bg-gray-50 dark:bg-slate-800">
                          <tr><th className="px-8 py-3">IP</th><th className="px-8 py-3">検知理由</th><th className="px-8 py-3">期限</th><th className="px-8 py-3 text-right">操作</th></tr>
                        </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {Object.entries(blockedIps).length === 0 ? (
                              <tr><td colSpan={4} className="text-center py-20 text-gray-400 font-bold">遮断中のIPはありません</td></tr>
                            ) : Object.entries(blockedIps).map(([ip, item]: [string, any]) => (
                               <tr key={ip} className="hover:bg-slate-50 dark:hover:bg-gray-800/50">
                                  <td className="px-8 py-6 font-mono font-black text-red-600">{ip}</td>
                                  <td className="px-8 py-6"><span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded font-black">{item.reason || '手動'}</span></td>
                                  <td className="px-8 py-6 text-xs font-bold text-gray-500">{item.expiry >= 2147483640 ? '永久' : new Date(item.expiry * 1000).toLocaleString()}</td>
                                  <td className="px-8 py-6 text-right"><button onClick={() => handleUnblock(ip)} className="px-6 py-2 bg-blue-600 text-white text-[10px] font-black rounded-xl hover:bg-blue-700 transition-all">解除</button></td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>

                <div className="bg-white dark:bg-dark-lighter p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm space-y-6 flex flex-col">
                   <div className="flex-1">
                      <h3 className="font-black text-xl flex items-center gap-3"><ShieldCheck className="text-emerald-500" /> DOS攻撃対策設定</h3>
                      <button type="button" onClick={() => { setConfig({...config, dos_notify_enabled: !config.dos_notify_enabled}); setIsDirty(true); }} className={`w-full flex items-center justify-center gap-2 py-3 mt-6 rounded-xl text-xs font-black transition-all ${config.dos_notify_enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                          {config.dos_notify_enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />} 検知時に通知
                      </button>
                      <div className="space-y-4 mt-6 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                          {config.dos_patterns.map((p, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 relative group animate-scale-up">
                                <div className="grid grid-cols-3 gap-2">
                                  <div><label className="block text-[8px] font-black text-gray-400 uppercase">期間(秒)</label><input type="number" value={p.seconds} onChange={e => { const next = [...config.dos_patterns]; next[idx] = {...next[idx], seconds: Number(e.target.value)}; setConfig({ ...config, dos_patterns: next }); setIsDirty(true); }} className="w-full p-2 border rounded-lg text-xs font-bold dark:bg-slate-900" /></div>
                                  <div><label className="block text-[8px] font-black text-gray-400 uppercase">回数</label><input type="number" value={p.count} onChange={e => { const next = [...config.dos_patterns]; next[idx] = {...next[idx], count: Number(e.target.value)}; setConfig({ ...config, dos_patterns: next }); setIsDirty(true); }} className="w-full p-2 border rounded-lg text-xs font-bold dark:bg-slate-900" /></div>
                                  <div><label className="block text-[8px] font-black text-gray-400 uppercase">遮断(分)</label><input type="number" value={p.block_minutes} onChange={e => { const next = [...config.dos_patterns]; next[idx] = {...next[idx], block_minutes: Number(e.target.value)}; setConfig({ ...config, dos_patterns: next }); setIsDirty(true); }} className="w-full p-2 border rounded-lg text-xs font-bold dark:bg-slate-900" /></div>
                                </div>
                                <button type="button" onClick={() => { const next = [...config.dos_patterns]; next.splice(idx, 1); setConfig({ ...config, dos_patterns: next }); setIsDirty(true); }} className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                            </div>
                          ))}
                          <button type="button" onClick={() => { setConfig({...config, dos_patterns: [...config.dos_patterns, { count: 50, seconds: 60, block_minutes: 60 }]}); setIsDirty(true); }} className="w-full py-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 font-black text-[10px] hover:border-emerald-500 hover:text-emerald-500 transition-all">+ 監視ルールを追加</button>
                      </div>
                   </div>
                   
                   <button 
                     onClick={() => handleUpdateSettings()} 
                     disabled={!isDirty}
                     className={`w-full py-4 rounded-xl text-xs font-black shadow-xl transition-all flex items-center justify-center gap-2 ${isDirty ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                   >
                      <ShieldCheck size={18}/> {isDirty ? '変更を保存して適用' : '変更なし'}
                   </button>
                </div>
              </div>
           </div>
        )}

        {activeTab === 'messages' && (
           <div className="space-y-4 animate-fade-in max-w-5xl mx-auto w-full pb-20">
              {messages.length === 0 ? (
                 <div className="text-center py-24 bg-white dark:bg-dark-lighter rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 font-black uppercase tracking-widest">受信メッセージはありません</div>
              ) : (
                 messages.map(m => (
                    <div key={m.id} className="bg-white dark:bg-dark-lighter p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group">
                       <div className="flex flex-col sm:flex-row justify-between mb-6 gap-2">
                          <span className="font-black text-blue-600 flex items-center gap-3">
                             <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-gray-400"><User size={20} /></div>
                             {m.name} <span className="text-[10px] font-normal text-gray-400">({m.contact || '連絡先なし'})</span>
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
           <div className="animate-fade-in max-w-7xl mx-auto w-full space-y-10 pb-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SMTP Setup */}
                <div className="bg-white dark:bg-dark-lighter p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                   <div className="flex justify-between items-center">
                     <h3 className="font-black text-xl flex items-center gap-3"><Mail className="text-pink-500" /> 通知用 SMTP 設定</h3>
                     <button onClick={handleTestEmail} disabled={isTestingEmail} className="px-4 py-2 bg-pink-50 dark:bg-pink-900/30 text-pink-600 rounded-xl text-xs font-black hover:bg-pink-100 transition-colors flex items-center gap-2">
                       {isTestingEmail ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} 接続テスト
                     </button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ホスト名</label><input type="text" value={config.smtp_host} onChange={e => { setConfig({...config, smtp_host: e.target.value}); setIsDirty(true); }} className="w-full p-3 border rounded-xl font-bold dark:bg-slate-900" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ポート</label><input type="number" value={config.smtp_port} onChange={e => { setConfig({...config, smtp_port: Number(e.target.value)}); setIsDirty(true); }} className="w-full p-3 border rounded-xl font-bold dark:bg-slate-900" /></div>
                   </div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ユーザー (ログインID)</label><input type="text" value={config.smtp_user} onChange={e => { setConfig({...config, smtp_user: e.target.value}); setIsDirty(true); }} className="w-full p-3 border rounded-xl font-bold dark:bg-slate-900" /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">パスワード</label><input type="password" value={config.smtp_pass} onChange={e => { setConfig({...config, smtp_pass: e.target.value}); setIsDirty(true); }} className="w-full p-3 border rounded-xl font-bold dark:bg-slate-900" placeholder="変更しない場合は空欄" /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">通知用メールアドレス</label><input type="email" value={config.alert_email} onChange={e => { setConfig({...config, alert_email: e.target.value}); setIsDirty(true); }} className="w-full p-3 border rounded-xl font-bold dark:bg-slate-900" /></div>
                </div>

                {/* Password Management */}
                <div className="bg-white dark:bg-dark-lighter p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                   <h3 className="font-black text-xl flex items-center gap-3"><KeyRound className="text-blue-500" /> 管理者パスワードの更新</h3>
                   <div className="space-y-4">
                     <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase">新しいパスワード</label>
                        <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full p-3 border rounded-xl font-bold dark:bg-slate-900 focus:border-blue-500 transition-colors" />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase">確認のため再入力</label>
                        <input type="password" value={newPassConfirm} onChange={e => setNewPassConfirm(e.target.value)} className="w-full p-3 border rounded-xl font-bold dark:bg-slate-900 focus:border-blue-500 transition-colors" />
                     </div>
                     <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="text-blue-600 shrink-0 mt-0.5" size={16} />
                        <p className="text-[10px] text-blue-800 dark:text-blue-300 font-bold leading-relaxed">
                          強力なパスワードを設定してください。変更後は即座に適用されます。
                        </p>
                     </div>
                   </div>
                </div>

                {/* Global Save Button - Now clearly visible for all settings */}
                <div className="lg:col-span-2">
                   <button 
                     onClick={() => handleUpdateSettings()} 
                     disabled={!isDirty && !newPass}
                     className={`w-full py-5 rounded-[1.5rem] text-sm font-black shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 tracking-widest uppercase ${
                       (isDirty || newPass) 
                         ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90' 
                         : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                     }`}
                   >
                      {configMsg ? <CheckCircle2 size={24} /> : <Settings size={24} />}
                      {configMsg || 'システム設定をすべて保存する'}
                   </button>
                </div>
              </div>

              {/* Data Import/Export */}
              <div className="bg-indigo-600 p-8 sm:p-10 rounded-[2.5rem] text-white shadow-2xl space-y-8 max-w-2xl mx-auto">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl"><Database size={32} /></div>
                  <div>
                    <h3 className="font-black text-xl mb-1 uppercase">システムバックアップ</h3>
                    <p className="text-xs opacity-70 font-bold">全ログとメッセージデータのJSONエクスポート・復元</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => {
                      const d = { messages, logs: stats.recent_logs };
                      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], {type:'application/json'})); a.download = `OMNITOOLS_ADMIN_BACKUP_${new Date().toISOString().split('T')[0]}.json`; a.click();
                    }} className="py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/20"><Download size={16} /> 出力</button>
                    
                    <button onClick={() => fileInputRef.current?.click()} className="py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-all"><Upload size={16} /> 復元</button>
                    <input type="file" accept=".json" ref={fileInputRef} onChange={async (e) => {
                      const file = e.target.files?.[0]; if (!file) return;
                      if (!confirm('既存のデータは上書きされます。続行しますか？')) return;
                      const reader = new FileReader();
                      reader.onload = async (ev) => {
                        try {
                           const res = await fetch('./backend/admin_api.php?action=import_data', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token || '' }, body: ev.target?.result as string });
                           if (res.ok) { alert('復元成功'); fetchData(true); }
                        } catch (err) { alert('復元エラー'); }
                      };
                      reader.readAsText(file);
                    }} className="hidden" />
                </div>
              </div>
           </div>
        )}
      </main>
      
      <footer className="bg-white dark:bg-slate-900 border-t dark:border-gray-800 h-10 px-6 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">LIVE CONNECTION ACTIVE</span>
            </div>
            <div className="flex items-center gap-2">
               <MousePointer2 size={10} className="text-gray-400"/>
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">DRILL-DOWN ENABLED</span>
            </div>
         </div>
         <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
            Last Sync: {new Date().toLocaleTimeString()}
         </div>
      </footer>
    </div>
  );
};

export default AdminPage;
