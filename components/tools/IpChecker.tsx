
import React, { useState, useEffect } from 'react';
import { Network, RefreshCw, CheckCircle2, XCircle, Globe, Info, ShieldCheck, Zap } from 'lucide-react';
import AdBanner from '../AdBanner';

const IpChecker: React.FC = () => {
  const [ip, setIp] = useState<string>('Loading...');
  const [targetPort, setTargetPort] = useState<string>('80');
  const [portCheckResult, setPortCheckResult] = useState<'idle' | 'checking' | 'open' | 'closed' | 'error'>('idle');

  useEffect(() => {
    // Using a public API to get the IP address as we are client-side
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIp(data.ip))
      .catch(() => setIp('取得できませんでした'));
  }, []);

  const checkPort = async () => {
    if (!targetPort) return;
    setPortCheckResult('checking');
    
    try {
        // Correct path to the existing backend script: public/backend/port_check.php
        // Also corrected parameter name from 'host' to 'ip' to match PHP script ($_GET['ip'])
        const res = await fetch(`./backend/port_check.php?ip=${ip}&port=${targetPort}`);
        if (res.ok) {
            const data = await res.json();
            // PHP returns { status: 'open' | 'closed' | 'error', ... }
            if (data.status === 'error') {
               setPortCheckResult('error');
            } else {
               setPortCheckResult(data.status === 'open' ? 'open' : 'closed');
            }
        } else {
            console.warn('Backend script returned http error');
            setPortCheckResult('error'); 
        }
    } catch (e) {
        setPortCheckResult('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <Network className="text-sky-500" />
          IPアドレス確認 & ポートチェック
        </h2>

        <div className="space-y-8">
            <div className="bg-sky-50 dark:bg-sky-900/20 p-8 rounded-3xl border border-sky-100 dark:border-sky-800 text-center">
                <p className="text-sm font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-2">現在のグローバルIP</p>
                <div className="text-4xl md:text-6xl font-black text-slate-800 dark:text-white font-mono break-all">
                    {ip}
                </div>
            </div>

            <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">チェックするポート番号</label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                        type="number" 
                        value={targetPort} 
                        onChange={(e) => setTargetPort(e.target.value)} 
                        className="flex-1 w-full p-4 rounded-xl border-2 border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 text-xl font-black text-gray-900 dark:text-white outline-none focus:border-sky-500 transition-colors" 
                        placeholder="80" 
                    />
                    <button 
                        onClick={checkPort} 
                        disabled={!targetPort || portCheckResult === 'checking'} 
                        className="w-full sm:w-auto px-8 py-4 sm:py-0 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                        {portCheckResult === 'checking' ? <RefreshCw className="animate-spin" /> : <CheckCircle2 />}
                        確認
                    </button>
                </div>
                
                {portCheckResult !== 'idle' && (
                    <div className={`mt-4 p-4 rounded-xl font-bold flex items-center gap-2 ${
                        portCheckResult === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 
                        portCheckResult === 'checking' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                        {portCheckResult === 'checking' && '確認中...'}
                        {portCheckResult === 'open' && <><CheckCircle2 /> ポート {targetPort} は開放されています</>}
                        {portCheckResult === 'closed' && <><XCircle /> ポート {targetPort} は閉じられています</>}
                        {portCheckResult === 'error' && <><XCircle /> エラーが発生しました (Backend unavailable)</>}
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {[80, 443, 21, 22, 25, 53, 3306, 8080, 25565].map(port => (
                    <button 
                        key={port} 
                        onClick={() => setTargetPort(port.toString())}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-bold text-gray-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                    >
                        {port}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />IP確認・ポート開放チェックについて</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Globe size={18} className="text-sky-500" />グローバルIPアドレスとは</h3>
               <p>インターネット上であなたの機器（ルーター）を識別するための住所のようなものです。サーバー公開やリモートアクセスを行う際に必要となります。当ツールではアクセス元のIPアドレスを即座に表示します。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-sky-500" />ポート開放確認</h3>
               <p>サーバーを公開する際、外部からのアクセスを受け入れるためにルーターの「ポート」を開放する必要があります。指定したポート番号が外部から到達可能かどうかを簡易的にチェックできます。</p>
            </div>
         </div>
      </article>
      <AdBanner />
    </div>
  );
};

export default IpChecker;
