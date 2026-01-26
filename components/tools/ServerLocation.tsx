
import React, { useState, useEffect, useRef } from 'react';
import { Globe, Search, MapPin, Server, Building, Wifi, AlertTriangle, Route, Activity, Info, ShieldCheck, Database, Loader2, RefreshCw, Cpu, Move, ArrowRight, Zap } from 'lucide-react';

// LeafletをCDNから動的に読み込むためのヘルパー
const loadLeaflet = (): Promise<any> => {
  return new Promise((resolve) => {
    if ((window as any).L) {
      resolve((window as any).L);
      return;
    }
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

  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  // マップの初期化
  useEffect(() => {
    let mapInstance: any;
    loadLeaflet().then((L) => {
      if (!mapContainerRef.current) return;
      
      mapInstance = L.map(mapContainerRef.current, {
        scrollWheelZoom: true,
        dragging: true,
        zoomControl: false,
        attributionControl: false // 右下のアトリビューションを無効化
      }).setView([20, 0], 2);

      // CARTO Dark Matterタイルの導入
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(mapInstance);

      // ズームコントロールを手動で追加（左上）
      L.control.zoom({ position: 'topleft' }).addTo(mapInstance);

      mapRef.current = mapInstance;
    });

    return () => {
      if (mapInstance) mapInstance.remove();
    };
  }, []);

  // マップ操作時のページスクロール防止
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const preventDefault = (e: WheelEvent) => {
      e.stopPropagation();
    };

    container.addEventListener('wheel', preventDefault, { passive: true });
    return () => container.removeEventListener('wheel', preventDefault);
  }, []);

  const clearMap = () => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
  };

  const addMarker = (lat: number, lon: number, title: string, color: string) => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    const marker = L.marker([lat, lon], { icon }).addTo(mapRef.current);
    marker.bindPopup(`<div class="p-1 font-bold text-xs">${title}</div>`);
    markersRef.current.push(marker);
    return marker;
  };

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

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;
    setLoading(true); setError(null); setData(null);
    clearMap();

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
      
      addMarker(geoInfo.latitude, geoInfo.longitude, `ターゲット: ${geoInfo.ip}`, '#3b82f6');
      mapRef.current.flyTo([geoInfo.latitude, geoInfo.longitude], 6);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleTraceroute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traceInput) return;
    setTraceLoading(true); setTraceError(null); setTraceHops([]);
    clearMap();

    try {
      let hostname = traceInput.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const response = await fetch(`./backend/traceroute.php?host=${hostname}`);
      const text = await response.text();
      
      let json;
      try {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start === -1 || end === -1) throw new Error();
        json = JSON.parse(text.substring(start, end + 1));
      } catch (parseError) {
        throw new Error('サーバーからの応答が不正です。');
      }

      if (json.error) throw new Error(json.error);
      const initialHops = (json.hops || []).map((h: any) => ({ ...h, loading: true, geo: null }));
      setTraceHops(initialHops);

      const pathCoords: [number, number][] = [];
      const L = (window as any).L;

      for (let i = 0; i < initialHops.length; i++) {
          const hop = initialHops[i];
          if (hop.ip === 'Request timed out' || isPrivateIp(hop.ip)) {
            setTraceHops(prev => prev.map((h, idx) => idx === i ? { ...h, loading: false } : h));
            continue;
          }
          const geo = await getGeoData(hop.ip);
          if (geo) {
            pathCoords.push([geo.latitude, geo.longitude]);
            const isLast = i === initialHops.length - 1;
            const color = i === 0 ? '#10b981' : isLast ? '#3b82f6' : '#6366f1';
            addMarker(geo.latitude, geo.longitude, `#${hop.hop} ${geo.city}`, color);
            
            if (pathCoords.length > 1 && L) {
              if (polylineRef.current) polylineRef.current.remove();
              polylineRef.current = L.polyline(pathCoords, {
                color: '#10b981',
                weight: 3,
                opacity: 0.6,
                dashArray: '5, 10'
              }).addTo(mapRef.current);
            }
            mapRef.current.flyTo([geo.latitude, geo.longitude], 4);
          }
          setTraceHops(prev => prev.map((h, idx) => idx === i ? { ...h, geo, loading: false } : h));
      }
    } catch (err: any) { setTraceError(err.message); } finally { setTraceLoading(false); }
  };

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
         {/* 操作パネル */}
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
                              ) : hop.ip !== 'Request timed out' && <p className="text-[9px] text-gray-400">位置情報なし (内部ホップ)</p>}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </div>

         {/* 実際の地図ビジュアライザー */}
         <div className="lg:col-span-2 relative group">
            <div 
                ref={mapContainerRef}
                className="relative w-full aspect-[1.6/1] bg-[#0a1128] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-slate-900 ring-1 ring-white/10 z-0"
            >
               <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10 pointer-events-none opacity-0 group-data-[loading=true]:opacity-100 transition-opacity">
                  <Loader2 className="animate-spin text-indigo-500" size={40} />
               </div>
            </div>

            {/* カスタムレジェンド */}
            <div className="absolute top-6 right-6 flex flex-col gap-2 z-10 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl pointer-events-none">
               <div className="flex items-center gap-3 text-[10px] font-black text-white uppercase tracking-wider">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-[0_0_5px_#10b981]"></div> 出発地点
               </div>
               <div className="flex items-center gap-3 text-[10px] font-black text-white uppercase tracking-wider">
                  <div className="w-3 h-3 rounded-full bg-indigo-500 border border-white shadow-[0_0_5px_#6366f1]"></div> 経由地点
               </div>
               <div className="flex items-center gap-3 text-[10px] font-black text-white uppercase tracking-wider">
                  <div className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-[0_0_5px_#3b82f6]"></div> 到達地点
               </div>
            </div>

            {/* ステータスバッジ */}
            <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl px-5 py-3 rounded-full border border-white/10 text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-2xl z-10">
               <Activity size={14} className="text-emerald-400 animate-pulse" /> Accurate Route Map 5.2
            </div>
            
            <div className="absolute bottom-6 right-6 hidden md:flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl text-[9px] font-bold text-slate-400 border border-white/5 z-10">
               <Move size={12} /> ドラッグで移動 / ホイールでズーム
            </div>
         </div>
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm transition-all">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />精密なネットワーク経路の可視化</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Cpu size={18} className="text-indigo-500" />リアルタイム地図エンジン</h3>
               <p>当ツールはOpenStreetMapおよびCARTOの最新地理データを統合した地図エンジンを採用しています。正確な海岸線と都市位置に基づいたマッピングにより、tracerouteコマンドで取得したパケットが世界を旅する様子をリアルに再現します。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-indigo-500" />最適化された操作性</h3>
               <p>地図操作中に画面全体がスクロールしてしまうストレスを解消するため、高度なイベント制御を実装しています。マウスホイールでのズームやドラッグでのパン操作が地図内に限定されるため、詳細な経路確認をスムーズに行うことが可能です。</p>
            </div>
         </div>
      </article>

      {/* ページ最下部のアトリビューション表記 */}
      <div className="text-[10px] text-gray-400 text-center mt-8 pb-4">
        Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:underline">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer" className="hover:underline">CARTO</a>
      </div>

      <style>{`
        .leaflet-container {
          background: #0a1128 !important;
        }
        .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.9);
          color: white;
          border-radius: 12px;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.9);
        }
        .leaflet-control-zoom-in, .leaflet-control-zoom-out {
          background-color: rgba(15, 23, 42, 0.8) !important;
          color: white !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(4px);
        }
      `}</style>
    </div>
  );
};

export default ServerLocation;
