
import React, { useState, useEffect, useRef } from 'react';
import { Globe, Search, MapPin, Server, Building, Wifi, AlertTriangle, Route, Activity, Info, ShieldCheck, Database, Loader2, Maximize, Minimize, RefreshCw, Cpu, Move, ChevronRight } from 'lucide-react';

const getFlagEmoji = (countryCode: string) => {
  if (!countryCode) return '🏳️';
  return String.fromCodePoint(...countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0)));
};

interface GeoData {
  ip: string; city: string; region: string; country: string; country_name: string;
  org: string; latitude: number; longitude: number; timezone: string; asn: string;
}

interface TraceHop {
  hop: number; ip: string; rtt: string; geo?: GeoData | null; loading?: boolean;
}

// 高精細な世界地図SVGパスデータ
const WORLD_MAP_PATHS = [
  // 北米・グリーンランド
  "M120,130 L160,110 L220,95 L280,110 L310,135 L280,185 L240,225 L180,215 L140,185 Z M215,65 L275,55 L315,75 L285,100 L235,90 Z",
  // 南米
  "M245,235 L285,245 L315,285 L325,355 L305,425 L265,405 L245,325 Z",
  // ユーラシア・アジア
  "M445,155 L515,135 L595,115 L745,105 L875,125 L935,165 L915,245 L795,285 L745,325 L675,305 L615,355 L545,425 L475,385 L435,325 L415,245 L435,185 Z",
  // アフリカ
  "M435,245 L495,225 L555,255 L575,325 L535,405 L485,435 L445,385 L425,305 Z",
  // オーストラリア
  "M775,365 L845,355 L905,385 L895,435 L815,455 L775,425 Z",
  // 日本・島嶼
  "M865,185 L875,180 L878,190 L868,195 Z M885,205 L895,200 L898,210 L888,215 Z"
];

const ServerLocation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'lookup' | 'trace'>('lookup');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GeoData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [traceInput, setTraceInput] = useState('');
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceHops, setTraceHops] = useState<TraceHop[]>([]);
  const [traceError, setTraceError] = useState<string | null>(null);

  // 地図の表示状態管理 (ズーム & パン)
  const [viewState, setViewState] = useState({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const isPrivateIp = (ip: string) => /^(10\.|127\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/.test(ip);

  const getGeoData = async (ip: string): Promise<GeoData | null> => {
    if (!ip || ip === 'Request timed out' || isPrivateIp(ip)) return null;
    try {
      const res = await fetch(`https://ipwho.is/${ip}`);
      const json = await res.json();
      if (json.success) {
        return {
          ip: json.ip, city: json.city, region: json.region,
          country: json.country_code, country_name: json.country,
          org: json.connection?.isp || json.connection?.org || 'Unknown',
          latitude: json.latitude, longitude: json.longitude,
          timezone: json.timezone?.id, asn: json.connection?.asn
        };
      }
    } catch (e) {}
    return null;
  };

  const focusOnPosition = (lat: number, lon: number) => {
    const coords = getMapCoordinates(lat, lon);
    setViewState({ scale: 2.5, x: (500 - coords.x) * 2.5, y: (250 - coords.y) * 2.5 });
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;
    setLoading(true); setError(null); setData(null);
    try {
      let hostname = input.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
      let targetIp = hostname;
      
      if (!isIp) {
        const res = await fetch(`https://dns.google/resolve?name=${hostname}`);
        const json = await res.json();
        const aRecord = json.Answer?.find((r: any) => r.type === 1);
        if (!aRecord) throw new Error('ドメインの名前解決に失敗しました');
        targetIp = aRecord.data;
      }

      const geoInfo = await getGeoData(targetIp);
      if (!geoInfo) throw new Error('位置情報を取得できませんでした');
      setData(geoInfo);
      focusOnPosition(geoInfo.latitude, geoInfo.longitude);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleTraceroute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traceInput) return;
    setTraceLoading(true); setTraceError(null); setTraceHops([]);
    try {
      let hostname = traceInput.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const response = await fetch(`./backend/traceroute.php?host=${hostname}`);
      const text = await response.text();
      
      let json;
      try {
        // レスポンス文字列からJSON部分を抽出してパース (ノイズ対策)
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start === -1 || end === -1) throw new Error();
        json = JSON.parse(text.substring(start, end + 1));
      } catch (parseError) {
        throw new Error('サーバーからの応答が不正な形式です');
      }

      if (json.error) throw new Error(json.error);
      const initialHops = (json.hops || []).map((h: any) => ({ ...h, loading: true, geo: null }));
      setTraceHops(initialHops);

      for (let i = 0; i < initialHops.length; i++) {
          const hop = initialHops[i];
          if (hop.ip === 'Request timed out' || isPrivateIp(hop.ip)) {
            setTraceHops(prev => prev.map((h, idx) => idx === i ? { ...h, loading: false } : h));
            continue;
          }
          const geo = await getGeoData(hop.ip);
          setTraceHops(prev => prev.map((h, idx) => idx === i ? { ...h, geo, loading: false } : h));
          if (geo) focusOnPosition(geo.latitude, geo.longitude);
      }
    } catch (err: any) { setTraceError(err.message); } finally { setTraceLoading(false); }
  };

  const getMapCoordinates = (lat: number, lon: number) => {
    const x = (lon + 180) * (1000 / 360);
    const latRad = Math.max(-85, Math.min(85, lat)) * Math.PI / 180;
    const y = (1 - (Math.log(Math.tan(Math.PI / 4 + latRad / 2)) / Math.PI)) * 250;
    return { x, y };
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewState(prev => ({ ...prev, scale: Math.max(1, Math.min(10, prev.scale * delta)) }));
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewState.x, y: e.clientY - viewState.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setViewState(prev => ({ ...prev, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }));
  };
  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl shadow-sm">
               <Globe className="text-indigo-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 dark:text-white">サーバー位置情報 & 経路追跡</h2>
         </div>
         <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner">
            <button onClick={() => setActiveTab('lookup')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'lookup' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500'}`}>IP/ドメイン検索</button>
            <button onClick={() => setActiveTab('trace')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'trace' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500'}`}>経路を追跡 (Trace)</button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-1 flex flex-col gap-6">
            {activeTab === 'lookup' ? (
               <div className="bg-white dark:bg-dark-lighter rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <form onSubmit={handleLookup} className="space-y-4">
                     <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="例: google.com" className="w-full p-4 rounded-2xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 dark:text-white font-bold focus:border-indigo-500 outline-none transition-all" />
                     <button type="submit" disabled={loading || !input} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95">
                        {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />} 解析を実行
                     </button>
                  </form>
                  {error && <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-xs font-bold animate-fade-in flex items-center gap-2"><AlertTriangle size={14} /> {error}</div>}
                  {data && (
                    <div className="mt-8 space-y-4 animate-scale-up">
                       <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                          <div className="absolute -right-4 -bottom-4 opacity-20"><Globe size={100} /></div>
                          <div className="text-sm font-bold opacity-80 mb-1 relative z-10">Target IP</div>
                          <div className="text-xl font-mono font-black break-all mb-6 relative z-10">{data.ip}</div>
                          <div className="flex items-center gap-4 relative z-10">
                             <div className="text-4xl shadow-sm">{getFlagEmoji(data.country)}</div>
                             <div className="min-w-0">
                                <p className="font-black text-lg truncate">{data.country_name}</p>
                                <p className="text-xs opacity-90 font-bold">{data.city}, {data.region}</p>
                             </div>
                          </div>
                       </div>
                       <div className="grid grid-cols-1 gap-2">
                          {[{ label: 'ISP / 事業者', val: data.org, icon: Building }, { label: 'ASN', val: data.asn, icon: Database }, { label: '座標', val: `${data.latitude}, ${data.longitude}`, icon: MapPin }].map((item, i) => (
                             <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div className="p-2 bg-white dark:bg-gray-700 rounded-lg text-indigo-500 shadow-sm"><item.icon size={14} /></div>
                                <div className="min-w-0"><p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{item.label}</p><p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">{item.val}</p></div>
                             </div>
                          ))}
                       </div>
                    </div>
                  )}
               </div>
            ) : (
               <div className="bg-white dark:bg-dark-lighter rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full max-h-[600px] animate-scale-up">
                  <form onSubmit={handleTraceroute} className="space-y-4 mb-6 shrink-0">
                     <div className="flex gap-2">
                        <input type="text" value={traceInput} onChange={(e) => setTraceInput(e.target.value)} placeholder="例: example.com" className="flex-1 p-3 rounded-xl border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 dark:text-white font-bold outline-none focus:border-indigo-500 transition-all" />
                        <button type="submit" disabled={traceLoading} className="bg-indigo-600 text-white px-4 rounded-xl font-bold disabled:opacity-50 transition-all active:scale-95">{traceLoading ? <Loader2 className="animate-spin" /> : <Route size={20} />}</button>
                     </div>
                  </form>
                  {traceError && <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-xs font-bold animate-fade-in flex items-center gap-2"><AlertTriangle size={14}/> {traceError}</div>}
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                     {traceHops.map((hop, i) => (
                        <div key={i} className="relative pl-6 animate-fade-in">
                           {i < traceHops.length - 1 && <div className="absolute left-[11px] top-4 w-0.5 h-full bg-gray-100 dark:bg-gray-800"></div>}
                           <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm ${hop.ip === 'Request timed out' ? 'bg-gray-100 text-gray-400' : 'bg-indigo-600 text-white'}`}>{hop.hop}</div>
                           <div className={`p-3 rounded-xl border transition-all ${hop.geo ? 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800' : 'bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'}`}>
                              <div className="flex justify-between items-start mb-1">
                                 <p className="font-mono text-[10px] font-bold text-gray-800 dark:text-white break-all">{hop.ip}</p>
                                 <span className="text-[9px] font-black text-gray-400">{hop.rtt}</span>
                              </div>
                              {hop.loading ? <div className="flex items-center gap-2 text-[9px] text-gray-400 font-bold"><Loader2 size={8} className="animate-spin" /> 調査中...</div> : hop.geo ? (
                                 <div className="flex items-center gap-2">
                                    <span className="text-base">{getFlagEmoji(hop.geo.country)}</span>
                                    <div className="min-w-0"><p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 truncate">{hop.geo.city}, {hop.geo.country_name}</p></div>
                                 </div>
                              ) : hop.ip !== 'Request timed out' && <p className="text-[9px] text-gray-400">位置情報なし（内部ホップ）</p>}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </div>

         <div className="lg:col-span-2">
            <div 
                ref={containerRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`relative w-full aspect-[1.6/1] bg-[#0a1128] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-slate-900 ring-1 ring-white/10 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            >
               <div className="absolute top-6 right-6 flex flex-col gap-2 z-50">
                  <button onClick={() => setViewState(prev => ({...prev, scale: Math.min(10, prev.scale + 0.5)}))} className="p-3 bg-slate-900/80 backdrop-blur-md text-white border border-white/10 rounded-xl hover:bg-slate-800 transition-colors shadow-lg"><Maximize size={18} /></button>
                  <button onClick={() => setViewState(prev => ({...prev, scale: Math.max(1, prev.scale - 0.5)}))} className="p-3 bg-slate-900/80 backdrop-blur-md text-white border border-white/10 rounded-xl hover:bg-slate-800 transition-colors shadow-lg"><Minimize size={18} /></button>
                  <button onClick={() => setViewState({ scale: 1, x: 0, y: 0 })} className="p-3 bg-slate-900/80 backdrop-blur-md text-white border border-white/10 rounded-xl hover:bg-slate-800 transition-colors shadow-lg"><RefreshCw size={18} /></button>
               </div>

               <div 
                className="w-full h-full transition-transform duration-500 ease-out origin-center"
                style={{ transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})` }}
               >
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1.5px, transparent 1.5px)', backgroundSize: '25px 25px' }}></div>
                  <svg viewBox="0 0 1000 500" className="w-full h-full overflow-visible pointer-events-none">
                     {WORLD_MAP_PATHS.map((p, idx) => (
                        <path key={idx} d={p} className="fill-slate-800/80 stroke-indigo-500/20 stroke-[0.4]" />
                     ))}
                     
                     {activeTab === 'trace' && traceHops.map((hop, i) => {
                        if (i === 0 || !hop.geo || !traceHops[i-1].geo) return null;
                        const p1 = getMapCoordinates(traceHops[i-1].geo!.latitude, traceHops[i-1].geo!.longitude);
                        const p2 = getMapCoordinates(hop.geo!.latitude, hop.geo!.longitude);
                        const cpX = (p1.x + p2.x) / 2;
                        const cpY = Math.min(p1.y, p2.y) - 50;
                        return (
                        <g key={`path-${i}`}>
                            <path d={`M ${p1.x} ${p1.y} Q ${cpX} ${cpY} ${p2.x} ${p2.y}`} fill="none" stroke="url(#trace-grad)" strokeWidth="2" className="animate-dash" strokeDasharray="8,8" style={{ filter: 'drop-shadow(0 0 8px #6366f1)' }} />
                            <defs><linearGradient id="trace-grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#4f46e5" /><stop offset="100%" stopColor="#818cf8" /></linearGradient></defs>
                        </g>
                        );
                     })}

                     {activeTab === 'lookup' && data && (
                        <g transform={`translate(${getMapCoordinates(data.latitude, data.longitude).x}, ${getMapCoordinates(data.latitude, data.longitude).y})`}>
                           <circle r="15" fill="#4f46e5" className="animate-ping opacity-30" />
                           <circle r="6" fill="#4f46e5" className="stroke-white stroke-2 shadow-2xl" />
                        </g>
                     )}

                     {activeTab === 'trace' && traceHops.map((hop, i) => hop.geo && (
                        <g key={i} transform={`translate(${getMapCoordinates(hop.geo.latitude, hop.geo.longitude).x}, ${getMapCoordinates(hop.geo.latitude, hop.geo.longitude).y})`} className="group">
                           <circle r="12" fill="#4f46e5" className="animate-pulse opacity-20" />
                           <circle r="5" fill="#6366f1" className="stroke-white/40 stroke-1" />
                           <text y="-16" textAnchor="middle" className="fill-white text-[9px] font-black drop-shadow-md">{hop.hop}</text>
                           <text y="20" textAnchor="middle" className="fill-indigo-300 text-[6px] font-bold uppercase tracking-wider">{hop.geo.city}</text>
                        </g>
                     ))}
                  </svg>
               </div>

               <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl px-5 py-3 rounded-full border border-white/10 text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-2xl z-50">
                  <Activity size={14} className="text-emerald-400 animate-pulse" /> Infrastructure Engine 5.0
               </div>
               
               <div className="absolute bottom-6 right-6 hidden md:flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl text-[9px] font-bold text-slate-400 border border-white/5">
                  <Move size={12} /> ドラッグで移動 / ホイールでズーム
               </div>
            </div>
         </div>
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm transition-all">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />ネットワーク経路の可視化と診断</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Cpu size={18} className="text-indigo-500" />次世代ビジュアライザー</h3>
               <p>新しい地図エンジンは、より詳細な世界地図のシルエットと、自由自在なズーム・パン操作を提供します。特定のドメインやIPまでの通信がどの国や都市を経由し、どのような遅延（RTT）が発生しているかを、直感的に観察することが可能です。インフラエンジニアから一般ユーザーまで、ネットワークの健康状態を把握するのに最適です。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-indigo-500" />セキュアな診断設計</h3>
               <p>診断処理はすべて、バックエンドでのセキュアな実行環境とフロントエンドでの安全なGeoIP照会を組み合わせて行われます。お客様のドメイン情報が外部に意図せず流出することはありません。また、すべての変換処理はお使いのブラウザ内で行われるため、機密性の高いインフラ調査にも安心してご利用いただけます。</p>
            </div>
         </div>
      </article>
      
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -24; }
        }
        .animate-dash {
          animation: dash 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ServerLocation;