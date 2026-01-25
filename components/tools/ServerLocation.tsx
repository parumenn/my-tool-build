
import React, { useState, useEffect, useRef } from 'react';
import { Globe, Search, MapPin, Server, Building, Wifi, AlertTriangle, Route, ArrowRight, Activity, Layers, Info, ShieldCheck, Database } from 'lucide-react';

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

  const resolveDomain = async (domain: string): Promise<string | null> => {
    try {
      const res = await fetch(`https://dns.google/resolve?name=${domain}`);
      const json = await res.json();
      if (json.Answer) {
        const aRecord = json.Answer.find((r: any) => r.type === 1);
        if (aRecord) return aRecord.data;
      }
      return null;
    } catch (e) { return null; }
  };

  const getGeoData = async (ip: string): Promise<GeoData | null> => {
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`);
      if (res.ok) {
        const json = await res.json();
        if (!json.error) return json as GeoData;
      }
    } catch (e) { }
    return null;
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
        const resolvedIp = await resolveDomain(hostname);
        if (!resolvedIp) throw new Error('ドメイン解決失敗');
        targetIp = resolvedIp;
      }
      const geoInfo = await getGeoData(targetIp);
      if (!geoInfo) throw new Error('位置情報の取得失敗');
      setData(geoInfo);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleTraceroute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traceInput) return;
    setTraceLoading(true); setTraceError(null); setTraceHops([]);
    try {
      let hostname = traceInput.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const res = await fetch(`./backend/traceroute.php?host=${hostname}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const rawHops: any[] = json.hops || [];
      const initialHops: TraceHop[] = rawHops.map(h => ({ hop: h.hop, ip: h.ip, rtt: h.rtt, loading: true, geo: null }));
      setTraceHops(initialHops);
      for (let i = 0; i < initialHops.length; i++) {
          const hop = initialHops[i];
          if (hop.ip.startsWith('192.168.') || hop.ip.startsWith('10.')) {
              setTraceHops(prev => prev.map((h, idx) => idx === i ? { ...h, loading: false } : h)); continue;
          }
          try {
              const geo = await getGeoData(hop.ip);
              setTraceHops(prev => prev.map((h, idx) => idx === i ? { ...h, geo, loading: false } : h));
          } catch (e) { setTraceHops(prev => prev.map((h, idx) => idx === i ? { ...h, loading: false } : h)); }
          await new Promise(r => setTimeout(r, 500));
      }
    } catch (err: any) { setTraceError(err.message); } finally { setTraceLoading(false); }
  };

  const getMapCoordinates = (lat: number, lon: number) => {
    const x = (lon + 180) / 360 * 100;
    const latRad = Math.max(-85, Math.min(85, lat)) * Math.PI / 180;
    const y = (0.5 - Math.log(Math.tan((Math.PI / 4) + (latRad / 2))) / (2 * Math.PI)) * 100;
    return { x, y };
  };

  const lookupCoords = data ? getMapCoordinates(data.latitude, data.longitude) : { x: 50, y: 50 };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><Globe className="text-indigo-500" />サーバー位置情報</h2>
         <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button onClick={() => setActiveTab('lookup')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'lookup' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500'}`}>位置検索</button>
            <button onClick={() => setActiveTab('trace')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'trace' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500'}`}>トレースルート</button>
         </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-1 space-y-6">
            {activeTab === 'lookup' ? (
               <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <form onSubmit={handleLookup} className="space-y-4">
                     <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="google.com" className="w-full p-3 rounded-xl border dark:bg-gray-800 dark:text-white" />
                     <button type="submit" disabled={loading || !input} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">{loading ? '...' : <Search size={20} />}検索</button>
                  </form>
                  {data && <div className="mt-6 space-y-4 animate-fade-in"><div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl p-5 text-white shadow-md"><div className="text-2xl font-mono font-bold break-all mb-4">{data.ip}</div><div className="flex items-center gap-3"><div className="text-4xl">{getFlagEmoji(data.country)}</div><div><p className="font-bold">{data.country_name}</p><p className="text-xs opacity-80">{data.region}, {data.city}</p></div></div></div></div>}
               </div>
            ) : <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col"><form onSubmit={handleTraceroute} className="mb-4 flex gap-2"><input type="text" value={traceInput} onChange={(e) => setTraceInput(e.target.value)} placeholder="example.com" className="flex-1 p-3 rounded-xl border dark:bg-gray-800 dark:text-white" /><button type="submit" disabled={traceLoading} className="bg-indigo-600 text-white px-4 rounded-xl font-bold disabled:opacity-50"><ArrowRight /></button></form></div>}
         </div>
         <div className="lg:col-span-2"><div className="relative w-full aspect-[1.6/1] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl group"><svg viewBox="0 0 1000 500" className="w-full h-full fill-slate-800 opacity-30"><path d="M250,80 L300,80 L320,120 L280,150 L300,250 L320,350 L280,420 L250,400 L240,300 L200,200 L150,150 L180,100 Z" /></svg>{activeTab === 'lookup' && data && <div className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2" style={{ left: `${lookupCoords.x}%`, top: `${lookupCoords.y}%` }}><div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-75"></div><div className="relative w-4 h-4 bg-indigo-600 border-2 border-white rounded-full shadow-lg"></div></div>}</div></div>
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />サーバーの所在地を確認する意義</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Database size={18} className="text-indigo-500" />データの物理的な位置を可視化</h3>
               <p>インターネット上のドメイン名やIPアドレスは、必ず世界中のどこかのデータセンターに存在する物理サーバーに紐付いています。当ツールでは、最新のGeoIPデータベースを利用して、そのサーバーがどの国、どの都市に設置されているかをマップ上に表示します。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-indigo-500" />セキュリティと速度の調査に</h3>
               <p>フィッシング詐欺サイトの調査や、海外サーバーを経由したアクセスの遅延（レイテンシ）解析に役立ちます。また、トレースルート機能（β版）を併用することで、お使いの端末から目的地までの通信経路を追跡し、どの中継地点で遅延が発生しているかを特定できます。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default ServerLocation;
