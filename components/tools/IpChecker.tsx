import React, { useState, useEffect } from 'react';
import { Network, Globe, Smartphone, RefreshCw, Server, Wifi, ShieldCheck, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

interface IpData {
  ip: string;
}

const IpChecker: React.FC = () => {
  const [ipv4, setIpv4] = useState<string | null>(null);
  const [ipv6, setIpv6] = useState<string | null>(null);
  const [loadingV4, setLoadingV4] = useState<boolean>(true);
  const [loadingV6, setLoadingV6] = useState<boolean>(true);
  const [userAgent, setUserAgent] = useState<string>('');

  // Port Check State
  const [targetPort, setTargetPort] = useState<string>('80');
  const [portCheckResult, setPortCheckResult] = useState<'idle' | 'checking' | 'open' | 'closed' | 'error'>('idle');
  const [checkedIp, setCheckedIp] = useState<string>('');

  const fetchIpv4 = async () => {
    setLoadingV4(true);
    try {
      // Force IPv4 via dedicated endpoint
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setIpv4(data.ip);
    } catch (error) {
      console.error('Failed to fetch IPv4', error);
      setIpv4('取得不可 (IPv6のみの可能性があります)');
    } finally {
      setLoadingV4(false);
    }
  };

  const fetchIpv6 = async () => {
    setLoadingV6(true);
    try {
      // Force IPv6 via dedicated endpoint
      const response = await fetch('https://api6.ipify.org?format=json');
      const data = await response.json();
      setIpv6(data.ip);
    } catch (error) {
      // If client doesn't have IPv6, this will fail naturally
      setIpv6('未接続 / 非対応');
    } finally {
      setLoadingV6(false);
    }
  };

  const fetchAll = () => {
      fetchIpv4();
      fetchIpv6();
  };

  useEffect(() => {
    fetchAll();
    setUserAgent(navigator.userAgent);
  }, []);

  const checkPort = async () => {
      if (!targetPort) return;
      setPortCheckResult('checking');
      
      // Use IPv4 address if available, otherwise let backend detect
      const ipParam = ipv4 && ipv4 !== '取得不可 (IPv6のみの可能性があります)' ? `&ip=${ipv4}` : '';
      
      try {
          // Call PHP backend for port checking
          const response = await fetch(`./backend/port_check.php?port=${targetPort}${ipParam}`);
          const data = await response.json();
          
          if (data.status === 'open') {
              setPortCheckResult('open');
          } else {
              setPortCheckResult('closed');
          }
          setCheckedIp(data.ip);
      } catch (e) {
          console.error(e);
          setPortCheckResult('error');
      }
  };

  const commonPorts = [80, 443, 21, 22, 25, 3389, 8080, 25565];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* IP Address Display Section */}
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Network className="text-sky-500" />
            接続情報 (IPアドレス)
          </h2>
          <button 
            onClick={fetchAll} 
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="再取得"
          >
            <RefreshCw size={20} className={loadingV4 || loadingV6 ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* IPv4 Card */}
            <div className="bg-sky-50 dark:bg-sky-900/20 rounded-2xl p-6 border border-sky-100 dark:border-sky-800 flex flex-col items-center justify-center min-h-[140px]">
                <p className="text-sky-600 dark:text-sky-400 font-bold text-sm mb-2 flex items-center gap-2">
                    <Globe size={16} /> IPv4 アドレス
                </p>
                <div className="text-2xl md:text-3xl font-mono font-bold text-slate-800 dark:text-white break-all text-center">
                    {loadingV4 ? <span className="opacity-50 text-base">確認中...</span> : ipv4}
                </div>
            </div>

            {/* IPv6 Card */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800 flex flex-col items-center justify-center min-h-[140px]">
                <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-2 flex items-center gap-2">
                    <Network size={16} /> IPv6 アドレス
                </p>
                <div className="text-lg md:text-xl font-mono font-bold text-slate-800 dark:text-white break-all text-center">
                    {loadingV6 ? <span className="opacity-50 text-base">確認中...</span> : ipv6}
                </div>
            </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
            <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-gray-600 dark:text-gray-300">
                <Smartphone size={24} />
            </div>
            <div className="overflow-hidden w-full">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm">ユーザーエージェント</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1 break-all p-2 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                {userAgent}
                </p>
            </div>
        </div>
      </div>

      {/* Port Checker Section */}
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
         <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <Server className="text-emerald-500" />
            ポート開放確認
         </h2>
         
         <div className="flex flex-col md:flex-row gap-8">
             <div className="flex-1 space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">ポート番号</label>
                    <div className="flex gap-2">
                        <input 
                            type="number" 
                            min="1" max="65535"
                            value={targetPort}
                            onChange={(e) => {
                                setTargetPort(e.target.value);
                                setPortCheckResult('idle');
                            }}
                            className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 font-mono text-lg font-bold focus:ring-2 focus:ring-emerald-500"
                            placeholder="80"
                        />
                        <button 
                            onClick={checkPort}
                            disabled={!targetPort || portCheckResult === 'checking'}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {portCheckResult === 'checking' ? <RefreshCw className="animate-spin" /> : <Wifi />}
                            確認
                        </button>
                    </div>
                 </div>

                 <div>
                    <p className="text-xs font-bold text-gray-500 mb-2">よく使うポート</p>
                    <div className="flex flex-wrap gap-2">
                        {commonPorts.map(p => (
                            <button 
                                key={p}
                                onClick={() => {
                                    setTargetPort(p.toString());
                                    setPortCheckResult('idle');
                                }}
                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${
                                    targetPort === p.toString() 
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-300' 
                                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                 </div>
             </div>

             <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-700 min-h-[160px]">
                 {portCheckResult === 'idle' && (
                     <div className="text-center text-gray-400">
                         <SearchIconPlaceholder />
                         <p className="text-sm mt-2">ポート番号を入力して確認ボタンを押してください</p>
                     </div>
                 )}
                 {portCheckResult === 'checking' && (
                     <div className="text-center text-emerald-600 dark:text-emerald-400 animate-pulse">
                         <RefreshCw size={48} className="mx-auto mb-2 animate-spin" />
                         <p className="font-bold">接続確認中...</p>
                     </div>
                 )}
                 {portCheckResult === 'open' && (
                     <div className="text-center animate-fade-in">
                         <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-3">
                             <CheckCircle2 size={40} />
                         </div>
                         <p className="text-2xl font-bold text-green-700 dark:text-green-400">開放されています</p>
                         <p className="text-sm text-gray-500 mt-1">{checkedIp}:{targetPort} への接続に成功しました</p>
                     </div>
                 )}
                 {portCheckResult === 'closed' && (
                     <div className="text-center animate-fade-in">
                         <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-3">
                             <ShieldAlert size={40} />
                         </div>
                         <p className="text-2xl font-bold text-red-700 dark:text-red-400">閉じています</p>
                         <p className="text-sm text-gray-500 mt-1">{checkedIp}:{targetPort} への接続に応答がありません</p>
                     </div>
                 )}
                 {portCheckResult === 'error' && (
                     <div className="text-center text-red-500">
                         <XCircle size={40} className="mx-auto mb-2" />
                         <p>エラーが発生しました</p>
                     </div>
                 )}
             </div>
         </div>
      </div>
    </div>
  );
};

// Simple visual helper
const SearchIconPlaceholder = () => (
    <svg className="w-12 h-12 mx-auto opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

export default IpChecker;