
import React, { useState, useEffect, useRef } from 'react';
import { Globe, Search, MapPin, Server, Building, Wifi, AlertTriangle, Route, ArrowRight, Activity, Layers } from 'lucide-react';

// Helper to get flag emoji from country code
const getFlagEmoji = (countryCode: string) => {
  if (!countryCode) return '🏳️';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char =>  127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

interface GeoData {
  ip: string;
  city: string;
  region: string;
  country: string;
  country_name: string;
  org: string;
  latitude: number;
  longitude: number;
  timezone: string;
  asn: string;
}

interface TraceHop {
  hop: number;
  ip: string;
  rtt: string;
  geo?: GeoData | null;
  loading?: boolean;
}

const ServerLocation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'lookup' | 'trace'>('lookup');
  
  // Lookup State
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GeoData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Traceroute State
  const [traceInput, setTraceInput] = useState('');
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceHops, setTraceHops] = useState<TraceHop[]>([]);
  const [traceError, setTraceError] = useState<string | null>(null);

  // --- Common Logic ---

  const resolveDomain = async (domain: string): Promise<string | null> => {
    try {
      const res = await fetch(`https://dns.google/resolve?name=${domain}`);
      const json = await res.json();
      if (json.Answer) {
        const aRecord = json.Answer.find((r: any) => r.type === 1);
        if (aRecord) return aRecord.data;
      }
      return null;
    } catch (e) {
      console.error("DNS Resolve Error", e);
      return null;
    }
  };

  const getGeoData = async (ip: string): Promise<GeoData | null> => {
    let lastError: any = null;

    // 1. Primary API: ipapi.co
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`);
      if (res.ok) {
        const text = await res.text();
        try {
            const json = JSON.parse(text);
            if (!json.error && !json.reason && !json.reserved) {
                return json as GeoData;
            }
        } catch (e) { }
      }
    } catch (e) { lastError = e; }

    // 2. Secondary API: ipwho.is
    try {
        const res = await fetch(`https://ipwho.is/${ip}`);
        if (res.ok) {
            const json = await res.json();
            if (json.success) {
                return {
                    ip: json.ip,
                    city: json.city,
                    region: json.region,
                    country: json.country_code,
                    country_name: json.country,
                    org: json.connection?.org || json.connection?.isp || 'N/A',
                    latitude: json.latitude,
                    longitude: json.longitude,
                    timezone: json.timezone?.id || '',
                    asn: json.connection?.asn ? String(json.connection.asn) : ''
                };
            }
        }
    } catch (e) { lastError = e; }

    // 3. Tertiary API: freeipapi.com
    try {
        const res = await fetch(`https://freeipapi.com/api/json/${ip}`);
        if (res.ok) {
            const json = await res.json();
            return {
                ip: json.ipAddress,
                city: json.cityName,
                region: json.regionName,
                country: json.countryCode,
                country_name: json.countryName,
                org: 'N/A',
                latitude: json.latitude,
                longitude: json.longitude,
                timezone: json.timeZone,
                asn: ''
            };
        }
    } catch (e) { lastError = e; }

    // 4. Quaternary API: ipinfo.io
    try {
        const res = await fetch(`https://ipinfo.io/${ip}/json`);
        if (res.ok) {
            const json = await res.json();
            const [lat, lon] = (json.loc || "0,0").split(',').map(Number);
            return {
                ip: json.ip,
                city: json.city,
                region: json.region,
                country: json.country,
                country_name: json.country,
                org: json.org,
                latitude: lat,
                longitude: lon,
                timezone: json.timezone,
                asn: ''
            };
        }
    } catch (e) { lastError = e; }

    return null;
  };

  // --- Handlers ---

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      let hostname = input.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
      let targetIp = hostname;

      if (!isIp) {
        const resolvedIp = await resolveDomain(hostname);
        if (!resolvedIp) throw new Error('ドメインのIPアドレスが見つかりませんでした。');
        targetIp = resolvedIp;
      }

      const geoInfo = await getGeoData(targetIp);
      if (!geoInfo) throw new Error('位置情報の取得に失敗しました。');

      setData(geoInfo);
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleTraceroute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traceInput) return;

    setTraceLoading(true);
    setTraceError(null);
    setTraceHops([]);

    try {
      let hostname = traceInput.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      
      // Call Backend for Traceroute
      const res = await fetch(`./backend/traceroute.php?host=${hostname}`);
      if (!res.ok) throw new Error('バックエンド接続エラー');
      
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      
      const rawHops: any[] = json.hops || [];
      if (rawHops.length === 0) throw new Error('経路情報が取得できませんでした（コマンド失敗の可能性があります）');

      // Initialize hops with loading state
      const initialHops: TraceHop[] = rawHops.map(h => ({
          hop: h.hop,
          ip: h.ip,
          rtt: h.rtt,
          loading: true,
          geo: null
      }));
      setTraceHops(initialHops);

      // Resolve GeoIP one by one to avoid rate limits and show progress
      for (let i = 0; i < initialHops.length; i++) {
          const hop = initialHops[i];
          // Skip private IPs roughly to save API calls
          if (hop.ip.startsWith('192.168.') || hop.ip.startsWith('10.') || hop.ip.startsWith('127.')) {
              setTraceHops(prev => prev.map((h, idx) => idx === i ? { ...h, loading: false } : h));
              continue;
          }

          try {
              const geo = await getGeoData(hop.ip);
              setTraceHops(prev => prev.map((h, idx) => idx === i ? { ...h, geo, loading: false } : h));
          } catch (e) {
              setTraceHops(prev => prev.map((h, idx) => idx === i ? { ...h, loading: false } : h));
          }
          // Small delay to be nice to APIs
          await new Promise(r => setTimeout(r, 500));
      }

    } catch (err: any) {
      setTraceError(err.message || 'エラーが発生しました。サーバー設定を確認してください。');
    } finally {
      setTraceLoading(false);
    }
  };

  // --- Map Utilities ---
  const getMapCoordinates = (lat: number, lon: number) => {
    const x = (lon + 180) / 360 * 100;
    const latClamped = Math.max(-85, Math.min(85, lat));
    const latRad = latClamped * Math.PI / 180;
    const mercN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
    const y = (0.5 - mercN / (2 * Math.PI)) * 100;
    return { x, y };
  };

  const lookupCoords = data ? getMapCoordinates(data.latitude, data.longitude) : { x: 50, y: 50 };

  // Generate path string for traceroute
  const getTracePath = () => {
      const points = traceHops
          .filter(h => h.geo && h.geo.latitude && h.geo.longitude)
          .map(h => getMapCoordinates(h.geo!.latitude, h.geo!.longitude));
      
      if (points.length < 2) return '';

      // Simple polyline
      return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * 10},${p.y * 5}`).join(' ');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Globe className="text-indigo-500" />
            サーバー位置情報チェッカー
         </h2>
         
         <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button 
               onClick={() => setActiveTab('lookup')}
               className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'lookup' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
               <MapPin size={16} /> 位置検索
            </button>
            <button 
               onClick={() => setActiveTab('trace')}
               className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'trace' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
               <Route size={16} /> トレースルート
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* LEFT COLUMN: Controls & Data */}
         <div className="lg:col-span-1 space-y-6">
            
            {activeTab === 'lookup' ? (
               <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <form onSubmit={handleLookup} className="space-y-4">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">ドメイン または IPアドレス</label>
                        <input
                           type="text"
                           value={input}
                           onChange={(e) => setInput(e.target.value)}
                           placeholder="google.com"
                           className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                        />
                     </div>
                     <button
                        type="submit"
                        disabled={loading || !input}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 flex items-center justify-center gap-2"
                     >
                        {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Search size={20} />}
                        検索
                     </button>
                  </form>

                  {error && (
                     <div className="mt-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-red-600 dark:text-red-300 flex items-start gap-2 text-sm font-bold">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        {error}
                     </div>
                  )}

                  {data && (
                     <div className="mt-6 space-y-4 animate-fade-in">
                        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl p-5 text-white shadow-md">
                           <div className="flex items-center gap-2 mb-1 opacity-80 text-xs uppercase font-bold">
                              <Server size={12} /> IP Address
                           </div>
                           <div className="text-2xl font-mono font-bold tracking-wider mb-4">{data.ip}</div>
                           <div className="flex items-center gap-3">
                              <div className="text-4xl">{getFlagEmoji(data.country)}</div>
                              <div>
                                 <p className="font-bold text-base leading-tight">{data.country_name}</p>
                                 <p className="text-indigo-100 text-xs">{data.region}, {data.city}</p>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-2 text-sm">
                           <div className="flex justify-between p-2 border-b border-gray-100 dark:border-gray-700">
                              <span className="text-gray-500 flex items-center gap-2"><Building size={14} /> ISP/Org</span>
                              <span className="font-bold text-gray-800 dark:text-gray-200">{data.org}</span>
                           </div>
                           <div className="flex justify-between p-2 border-b border-gray-100 dark:border-gray-700">
                              <span className="text-gray-500 flex items-center gap-2"><Wifi size={14} /> ASN</span>
                              <span className="font-bold text-gray-800 dark:text-gray-200">{data.asn}</span>
                           </div>
                           <div className="flex justify-between p-2 border-b border-gray-100 dark:border-gray-700">
                              <span className="text-gray-500 flex items-center gap-2"><MapPin size={14} /> 座標</span>
                              <span className="font-mono text-gray-800 dark:text-gray-200">{data.latitude.toFixed(4)}, {data.longitude.toFixed(4)}</span>
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            ) : (
               <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                  <form onSubmit={handleTraceroute} className="space-y-4 mb-4">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">ターゲット (URL/IP)</label>
                        <div className="flex gap-2">
                           <input
                              type="text"
                              value={traceInput}
                              onChange={(e) => setTraceInput(e.target.value)}
                              placeholder="example.com"
                              className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                           />
                           <button
                              type="submit"
                              disabled={traceLoading || !traceInput}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl font-bold transition-all disabled:opacity-50"
                           >
                              {traceLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <ArrowRight />}
                           </button>
                        </div>
                     </div>
                  </form>

                  {traceError && (
                     <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-red-600 dark:text-red-300 text-sm font-bold flex items-start gap-2">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        {traceError}
                     </div>
                  )}

                  <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[300px]">
                     {traceHops.length === 0 && !traceLoading && (
                        <div className="text-center text-gray-400 py-10">
                           <Layers size={48} className="mx-auto mb-2 opacity-30" />
                           <p className="text-sm">ドメインを入力して経路を解析</p>
                        </div>
                     )}
                     
                     {traceHops.map((hop) => (
                        <div key={hop.hop} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-sm">
                           <div className="flex justify-between items-start mb-1">
                              <div className="flex items-center gap-2">
                                 <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded text-xs font-bold w-6 text-center">{hop.hop}</span>
                                 <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{hop.ip}</span>
                              </div>
                              <span className="text-xs text-green-600 dark:text-green-400 font-mono">{hop.rtt}</span>
                           </div>
                           
                           {hop.loading ? (
                              <div className="text-xs text-gray-400 pl-8 flex items-center gap-1">
                                 <Activity size={10} className="animate-spin" /> 解析中...
                              </div>
                           ) : hop.geo ? (
                              <div className="pl-8 text-xs space-y-0.5">
                                 <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                    <span>{getFlagEmoji(hop.geo.country)}</span>
                                    <span className="font-bold">{hop.geo.country_name}</span>
                                    <span className="text-gray-400">({hop.geo.city})</span>
                                 </div>
                                 <div className="text-gray-500 dark:text-gray-400 truncate">{hop.geo.org} ({hop.geo.asn})</div>
                              </div>
                           ) : (
                              <div className="pl-8 text-xs text-gray-400">- ローカル/不明 -</div>
                           )}
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </div>

         {/* RIGHT COLUMN: Map Visualization */}
         <div className="lg:col-span-2">
            <div className="relative w-full aspect-[1.6/1] bg-slate-900 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl group">
               {/* Map SVG */}
               <svg
                 viewBox="0 0 1000 500" 
                 className="w-full h-full pointer-events-none"
                 style={{ fill: 'currentColor' }}
               >
                 {/* World Map Path */}
                 <g className="text-gray-800">
                   <path d="M250,80 L300,80 L320,120 L280,150 L300,250 L320,350 L280,420 L250,400 L240,300 L200,200 L150,150 L180,100 Z" />
                   <path d="M450,100 L550,80 L700,80 L800,100 L850,150 L800,200 L820,250 L750,300 L700,280 L650,350 L580,380 L520,300 L480,250 L500,200 L450,180 Z" />
                   <path d="M780,350 L850,350 L850,400 L780,400 Z" />
                   <path d="M860,160 L870,150 L880,170 L860,180 Z" />
                 </g>
                 
                 {/* Grid */}
                 <g stroke="currentColor" strokeWidth="0.5" className="text-gray-800 opacity-30">
                    <line x1="0" y1="250" x2="1000" y2="250" />
                    <line x1="500" y1="0" x2="500" y2="500" />
                 </g>

                 {/* Traceroute Path Line */}
                 {activeTab === 'trace' && traceHops.length > 0 && (
                    <path 
                       d={getTracePath()} 
                       fill="none" 
                       stroke="#4ade80" 
                       strokeWidth="2" 
                       strokeDasharray="5,5"
                       className="animate-pulse"
                    />
                 )}
               </svg>

               {/* Points Overlay */}
               <div className="absolute inset-0 pointer-events-none">
                  {/* Single Lookup Point */}
                  {activeTab === 'lookup' && data && (
                     <div 
                       className="absolute w-4 h-4 transform -translate-x-1/2 -translate-y-1/2"
                       style={{ left: `${lookupCoords.x}%`, top: `${lookupCoords.y}%` }}
                     >
                        <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-75"></div>
                        <div className="relative w-4 h-4 bg-indigo-600 border-2 border-white rounded-full shadow-lg"></div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                           {data.city}, {data.country}
                        </div>
                     </div>
                  )}

                  {/* Traceroute Points */}
                  {activeTab === 'trace' && traceHops.map((hop, i) => {
                     if (!hop.geo) return null;
                     const pos = getMapCoordinates(hop.geo.latitude, hop.geo.longitude);
                     return (
                        <div 
                          key={hop.hop}
                          className="absolute w-3 h-3 transform -translate-x-1/2 -translate-y-1/2"
                          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                        >
                           <div className={`relative w-3 h-3 rounded-full border border-white shadow-sm ${i === traceHops.length - 1 ? 'bg-green-500 w-4 h-4 animate-bounce' : 'bg-indigo-500'}`}></div>
                           <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                              #{hop.hop} {hop.geo.city}
                           </div>
                        </div>
                     );
                  })}
               </div>
               
               {/* Map Legend/Overlay Info */}
               <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white p-3 rounded-xl border border-gray-700 text-xs">
                  <div className="font-bold mb-1 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-green-500"></div> 
                     {activeTab === 'lookup' ? 'ターゲット位置' : '到達地点'}
                  </div>
                  {activeTab === 'trace' && (
                     <div className="font-bold flex items-center gap-2 text-gray-300">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div> 
                        経由地
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ServerLocation;
