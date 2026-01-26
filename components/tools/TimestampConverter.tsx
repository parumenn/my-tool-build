
import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, Info, ShieldCheck, Zap } from 'lucide-react';

const TimestampConverter: React.FC = () => {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [unixInput, setUnixInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [unixToDateResult, setUnixToDateResult] = useState('');
  const [dateToUnixResult, setDateToUnixResult] = useState('');

  useEffect(() => {
     const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
     return () => clearInterval(timer);
  }, []);

  const handleUnixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const val = e.target.value; setUnixInput(val);
     if (val) {
        const date = new Date(Number(val) * 1000);
        setUnixToDateResult(!isNaN(date.getTime()) ? date.toLocaleString('ja-JP') : 'Invalid Date');
     } else setUnixToDateResult('');
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const val = e.target.value; setDateInput(val);
     if (val) {
        const date = new Date(val);
        setDateToUnixResult(!isNaN(date.getTime()) ? Math.floor(date.getTime() / 1000).toString() : 'Invalid Date');
     } else setDateToUnixResult('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <Clock className="text-slate-600 dark:text-slate-400" />
          Unix時間変換
        </h2>
        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-6 text-center mb-8">
           <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">現在のUnix Timestamp</p>
           <div className="text-4xl md:text-5xl font-mono font-bold text-slate-800 dark:text-white tabular-nums">{now}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-4">
              <h3 className="font-bold text-gray-700 dark:text-gray-200">Unix → 日付</h3>
              <input type="number" value={unixInput} onChange={handleUnixChange} placeholder="1609459200" className="w-full p-3 rounded-lg border dark:bg-gray-800 dark:text-white" />
              <div className="p-3 bg-gray-50 dark:bg-gray-900 border rounded-lg min-h-[50px] font-bold text-gray-600 dark:text-gray-300">{unixToDateResult || '結果を表示...'}</div>
           </div>
           <div className="space-y-4">
              <h3 className="font-bold text-gray-700 dark:text-gray-200">日付 → Unix</h3>
              <input type="datetime-local" value={dateInput} onChange={handleDateChange} className="w-full p-3 rounded-lg border dark:bg-gray-800 dark:text-white" />
              <div className="p-3 bg-gray-50 dark:bg-gray-900 border rounded-lg min-h-[50px] font-bold text-gray-600 dark:text-gray-300">{dateToUnixResult || '結果を表示...'}</div>
           </div>
        </div>
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />Unix時間変換の基礎知識</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-slate-500" />プログラミングでの日付管理</h3>
               <p>Unix時間（エポックタイム）とは、1970年1月1日午前0時0分0秒（UTC）からの経過秒数を表す数値です。多くのシステムやデータベースで標準的に利用されています。当ツールでは、この数値を人間が読みやすい「日時形式」に相互変換できます。ログ解析やデバッグ作業を効率化します。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-slate-500" />リアルタイム更新・ローカル処理</h3>
               <p>ページを開いている間、現在のUnixタイムスタンプをリアルタイムで表示し続けます。また、入力された日付データが外部に送信されることはありません。ブラウザ完結で動作するため、プライバシーを重視する開発環境でも安心してお使いいただけます。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default TimestampConverter;
