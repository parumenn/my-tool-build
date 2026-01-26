
import React, { useState, useEffect } from 'react';
import { Network, Globe, Smartphone, RefreshCw, Server, Wifi, ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Info, Zap } from 'lucide-react';

const IpChecker: React.FC = () => {
  const [ipv4, setIpv4] = useState<string | null>(null);
  const [ipv6, setIpv6] = useState<string | null>(null);
  const [loadingV4, setLoadingV4] = useState<boolean>(true);
  const [loadingV6, setLoadingV6] = useState<boolean>(true);
  const [userAgent, setUserAgent] = useState<string>('');

  const [targetPort, setTargetPort] = useState<string>('80');
  const [portCheckResult, setPortCheckResult] = useState<'idle' | 'checking' | 'open' | 'closed' | 'error'>('idle');
  const [checkedIp, setCheckedIp] = useState<string>('');

  const fetchIpv4 = async () => {
    setLoadingV4(true);
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setIpv4(data.ip);
    } catch (error) {
      setIpv4('取得不可');
    } finally {
      setLoadingV4(false);
    }
  };

  const fetchIpv6 = async () => {
    setLoadingV6(true);
    try {
      const response = await fetch('https://api6.ipify.org?format=json');
      const data = await response.json();
      setIpv6(data.ip);
    } catch (error) {
      setIpv6('非対応/未接続');
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
      const ipParam = ipv4 && ipv4 !== '取得不可' ? `&ip=${ipv4}` : '';
      try {
          const response = await fetch(`./backend/port_check.php?port=${targetPort}${ipParam}`);
          const data = await response.json();
          if (data.status === 'open') setPortCheckResult('open');
          else setPortCheckResult('closed');
          setCheckedIp(data.ip);
      } catch (e) {
          setPortCheckResult('error');
      }
  };

  const commonPorts = [80, 443, 21, 22, 25, 3389, 8080, 25565];

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="bg-white dark:bg-dark-lighter rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-3">
            <Network className="text-sky-500" size={32} />
            自分のIPアドレス確認
          </h2>
          <button onClick={fetchAll} className="p-3 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all">
            <RefreshCw size={20} className={loadingV4 || loadingV6 ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-sky-50 dark:bg-sky-900/20 rounded-2xl p-8 border border-sky-100 dark:border-sky-800 flex flex-col items-center justify-center min-h-[160px]">
                <p className="text-sky-600 dark:text-sky-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><Globe size={16} /> IPv4アドレス</p>
                <div className="text-2xl md:text-3xl font-mono font-black text-slate-800 dark:text-white break-all text-center">
                    {loadingV4 ? <span className="animate-pulse">取得中...</span> : ipv4}
                </div>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-8 border border-indigo-100 dark:border-indigo-800 flex flex-col items-center justify-center min-h-[160px]">
                <p className="text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><Network size={16} /> IPv6アドレス</p>
                <div className="text-lg md:text-xl font-mono font-black text-slate-800 dark:text-white break-all text-center">
                    {loadingV6 ? <span className="animate-pulse">取得中...</span> : ipv6}
                </div>
            </div>
        </div>

        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-3 flex items-center gap-2"><Smartphone size={14} /> ユーザーエージェント</h3>
            <p className="text-xs text-gray-400 font-mono break-all">{userAgent}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-lighter rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 dark:border-gray-700">
         <h2 className="text-xl font-black text-gray-800 dark:text-white mb-8 flex items-center gap-3">
            <Server className="text-emerald-500" />
            ポート開放確認ツール
         </h2>
         <div className="flex flex-col md:flex-row gap-8">
             <div className="flex-1 space-y-6">
                 <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">チェックするポート番号</label>
                    <div className="flex gap-2">
                        <input type="number" value={targetPort} onChange={(e) => setTargetPort(e.target.value)} className="flex-1 p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-800 text-xl font-black" placeholder="80" />
                        <button onClick={checkPort} disabled={!targetPort || portCheckResult === 'checking'} className="px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg transition-all disabled:opacity-30">確認</button>
                    </div>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {commonPorts.map(p => (
                        <button key={p} onClick={() => setTargetPort(p.toString())} className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${targetPort === p.toString() ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 text-gray-400'}`}>{p}</button>
                    ))}
                 </div>
             </div>
             <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 min-h-[160px]">
                 {portCheckResult === 'idle' && <p className="text-sm text-gray-400 font-bold">番号を入力して実行してください</p>}
                 {portCheckResult === 'checking' && <div className="text-center text-emerald-500 animate-pulse"><RefreshCw className="animate-spin mx-auto mb-2" /> <p className="font-bold">スキャン中...</p></div>}
                 {portCheckResult === 'open' && <div className="text-center text-green-600"><CheckCircle2 size={48} className="mx-auto mb-2" /> <p className="text-xl font-black">開放されています</p></div>}
                 {portCheckResult === 'closed' && <div className="text-center text-red-500"><XCircle size={48} className="mx-auto mb-2" /> <p className="text-xl font-black">閉じています</p></div>}
             </div>
         </div>
      </div>

      <article className="mt-12 p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm prose dark:prose-invert max-w-none">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />IPアドレスとポート確認の重要性</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3">IPアドレスとは？</h3>
               <p>
                  IPアドレスは、インターネット上の「住所」にあたる識別番号です。現在普及しているIPv4と、次世代規格であるIPv6の2種類があります。
                  当ツールでは、お使いの環境がどちらの規格で通信しているかを即座に判別します。VPNの使用確認や、ネットワークトラブルの切り分けに役立ちます。
               </p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3">なぜポート確認が必要か？</h3>
               <p>
                  オンラインゲームのサーバー公開や、自宅サーバーの構築、IoT機器の外部連携などを行う際、ルーターの「ポート開放」設定が必要です。
                  当ツールのポートチェッカーを使用することで、設定が正しく反映され、外部からアクセス可能な状態になっているかを安全にテストできます。
               </p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default IpChecker;
