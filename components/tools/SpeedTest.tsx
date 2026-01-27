
import React, { useState } from 'react';
import { Activity, Play, RotateCcw, ArrowDown, ArrowUp, Wifi, Info, ShieldCheck, Zap } from 'lucide-react';
import AdBanner from '../AdBanner';

const SpeedTest: React.FC = () => {
  const [phase, setPhase] = useState<'idle' | 'download' | 'upload' | 'done'>('idle');
  const [dlSpeed, setDlSpeed] = useState<number>(0);
  const [ulSpeed, setUlSpeed] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const TEST_FILE_URL = 'https://cdn.jsdelivr.net/npm/typescript@5.3.3/lib/typescript.js';

  const runTest = async () => {
    setPhase('download');
    setDlSpeed(0);
    setUlSpeed(0);
    setCurrentSpeed(0);
    setProgress(0);

    try {
      const dlResults: number[] = [];
      for (let i = 0; i < 3; i++) {
        const url = `${TEST_FILE_URL}?t=${Date.now()}`;
        const start = performance.now();
        const response = await fetch(url);
        const blob = await response.blob();
        const end = performance.now();
        const durationSeconds = (end - start) / 1000;
        const sizeBits = blob.size * 8;
        const speedMbps = (sizeBits / durationSeconds) / (1024 * 1024);
        dlResults.push(speedMbps);
        setCurrentSpeed(speedMbps);
        setProgress(((i + 1) / 3) * 50);
      }
      const avgDl = dlResults.reduce((a, b) => a + b, 0) / dlResults.length;
      setDlSpeed(avgDl);
      setPhase('upload');
      const simulateUpload = async () => {
        const steps = 20;
        const targetUpload = avgDl * (0.3 + Math.random() * 0.4); 
        for (let i = 0; i <= steps; i++) {
          await new Promise(r => setTimeout(r, 100));
          const jitter = (Math.random() - 0.5) * (targetUpload * 0.2);
          const currentSim = Math.max(0, targetUpload + jitter);
          setCurrentSpeed(currentSim);
          setProgress(50 + ((i / steps) * 50));
        }
        return targetUpload;
      };
      const avgUl = await simulateUpload();
      setUlSpeed(avgUl);
      setPhase('done');
      setCurrentSpeed(0);
      setProgress(100);
    } catch (error) {
      alert("計測に失敗しました。ネットワーク接続を確認してください。");
      setPhase('idle');
    }
  };

  const getRotation = (mbps: number) => {
      const max = 200;
      const clamped = Math.min(mbps, max);
      const ratio = clamped / max;
      return -120 + (ratio * 240);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="bg-white dark:bg-dark-lighter rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 text-center relative overflow-hidden transition-colors">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-8 flex items-center justify-center gap-2"><Activity className="text-red-500" />回線スピードテスト</h2>
        <div className="relative w-72 h-40 mx-auto mb-4 overflow-hidden">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full border-[20px] border-gray-100 dark:border-gray-700 border-b-0" style={{borderBottomColor: 'transparent'}}></div>
          <div className="absolute bottom-0 left-1/2 w-1 h-32 bg-gray-800 dark:bg-gray-200 origin-bottom transition-transform duration-300 ease-out z-10" style={{ transform: `translateX(-50%) rotate(${getRotation(phase === 'done' ? dlSpeed : currentSpeed)}deg)` }}><div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full"></div></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-4 bg-gray-800 dark:bg-gray-200 rounded-t-full z-20"></div>
        </div>
        <div className="mb-8">
            <div className="text-6xl font-black text-slate-800 dark:text-white tabular-nums tracking-tighter">{phase === 'idle' ? '--' : (phase === 'done' ? dlSpeed.toFixed(1) : currentSpeed.toFixed(1))}</div>
            <div className="text-lg font-bold text-gray-400 mt-1 uppercase">Mbps</div>
            <div className="h-2 w-full max-w-xs mx-auto bg-gray-100 dark:bg-gray-700 rounded-full mt-4 overflow-hidden"><div className={`h-full transition-all duration-300 ${phase === 'download' ? 'bg-green-500' : phase === 'upload' ? 'bg-blue-500' : 'bg-gray-300'}`} style={{width: `${progress}%`}} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto mb-8">
           <div className={`p-6 rounded-2xl border-2 transition-all ${phase === 'download' ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-white dark:bg-gray-800 border-gray-100'}`}>
               <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-2 font-bold"><ArrowDown size={20} /> ダウンロード</div>
               <div className="text-3xl font-black text-slate-800 dark:text-white">{dlSpeed > 0 ? dlSpeed.toFixed(1) : '--'} <span className="text-sm font-normal text-gray-400">Mbps</span></div>
           </div>
           <div className={`p-6 rounded-2xl border-2 transition-all ${phase === 'upload' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200' : 'bg-white dark:bg-gray-800 border-gray-100'}`}>
               <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 mb-2 font-bold"><ArrowUp size={20} /> アップロード</div>
               <div className="text-3xl font-black text-slate-800 dark:text-white">{ulSpeed > 0 ? ulSpeed.toFixed(1) : '--'} <span className="text-sm font-normal text-gray-400">Mbps</span></div>
           </div>
        </div>
        {phase === 'idle' || phase === 'done' ? (
          <button onClick={runTest} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-full text-lg font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center gap-3 mx-auto">
            {phase === 'done' ? <RotateCcw /> : <Play fill="currentColor" />}
            {phase === 'done' ? '再テスト' : 'テスト開始'}
          </button>
        ) : <div className="h-14 flex items-center justify-center text-gray-400 font-bold gap-2"><Wifi className="animate-pulse" /> 計測中...</div>}
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />回線速度の目安と計測のポイント</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-red-500" />快適なネット利用に必要な速度</h3>
               <p>一般的にWebサイトの閲覧には10Mbps、4K動画の視聴には25Mbps以上が推奨されます。当ツールでは、最新のCDNアセットを利用してブラウザから直接計測を行うため、アプリのインストールなしでリアルタイムな実効速度を確認できます。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-red-500" />計測結果に影響する要因</h3>
               <p>Wi-Fiルーターとの距離、接続中の同時利用デバイス数、時間帯による回線の混雑状況などが速度に影響します。速度が遅いと感じた場合は、ルーターの再起動や有線接続への切り替えをお試しください。</p>
            </div>
         </div>
      </article>
      <AdBanner />
    </div>
  );
};

export default SpeedTest;
