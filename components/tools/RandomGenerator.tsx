
import React, { useState } from 'react';
import { Dices, RefreshCw, Copy, Check, RotateCcw, Info, ShieldCheck, Zap } from 'lucide-react';

const RandomGenerator: React.FC = () => {
  const [min, setMin] = useState<number>(1);
  const [max, setMax] = useState<number>(100);
  const [count, setCount] = useState<number>(1);
  const [allowDuplicates, setAllowDuplicates] = useState<boolean>(true);
  const [results, setResults] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    if (min >= max) { alert("最小値は最大値より小さく設定してください。"); return; }
    if (!allowDuplicates && (max - min + 1) < count) { alert("範囲に対して生成数が多すぎます。"); return; }
    const newResults: number[] = [];
    if (allowDuplicates) {
        for (let i = 0; i < count; i++) newResults.push(Math.floor(Math.random() * (max - min + 1)) + min);
    } else {
        const candidates = Array.from({ length: max - min + 1 }, (_, i) => i + min);
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * candidates.length);
            newResults.push(candidates[randomIndex]);
            candidates.splice(randomIndex, 1);
        }
    }
    setResults(newResults);
  };

  const copyToClipboard = () => {
    if (results.length === 0) return;
    navigator.clipboard.writeText(results.join('\n'));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2"><Dices className="text-rose-500" />ランダム生成</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold text-gray-500 mb-1">最小値</label><input type="number" value={min} onChange={e => setMin(Number(e.target.value))} className="w-full p-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono" /></div>
                    <div><label className="block text-sm font-bold text-gray-500 mb-1">最大値</label><input type="number" value={max} onChange={e => setMax(Number(e.target.value))} className="w-full p-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono" /></div>
                </div>
                <div><label className="block text-sm font-bold text-gray-500 mb-1">生成数: {count}</label><input type="range" min="1" max="100" value={count} onChange={e => setCount(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500" /></div>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={allowDuplicates} onChange={e => setAllowDuplicates(e.target.checked)} className="w-5 h-5 text-rose-600 rounded" /> <span className="font-bold text-gray-700 dark:text-gray-300">重複を許可</span></label>
                <button onClick={generate} className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl shadow-lg hover:bg-rose-700 transition-all flex items-center justify-center gap-2"><RefreshCw size={20} /> 生成開始</button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex flex-col h-[300px] border dark:border-gray-700">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-bold text-gray-400">結果出力</span>
                    <div className="flex gap-2">
                       <button onClick={() => setResults([])} className="text-gray-400 hover:text-red-500"><RotateCcw size={16} /></button>
                       <button onClick={copyToClipboard} className="text-gray-400 hover:text-blue-500">{copied ? <Check size={16} /> : <Copy size={16} />}</button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto font-mono text-xl space-y-1">{results.map((n, i) => <div key={i} className="text-slate-800 dark:text-white">{n}</div>)}</div>
            </div>
        </div>
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />ランダム生成ツールの役割と活用シーン</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-rose-500" />公平な選択を簡単に</h3>
               <p>ビンゴ大会の数字選定、プレゼント企画の当選者抽出、チーム分けの番号振りなど、公平性が求められるあらゆる場面で活躍します。最小値と最大値を自由に設定でき、100個までの一括生成が可能です。重複の有無も選択できるため、用途に合わせて柔軟にご利用いただけます。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-rose-500" />信頼性の高い乱数アルゴリズム</h3>
               <p>当ツールのランダム生成は、ブラウザ標準の `Math.random()` に基づいています。これは統計的に十分なランダム性を持つ擬似乱数生成器です。複雑な計算や外部との通信を行わず、シンプルかつ高速に結果を表示します。登録不要・無料で今すぐお試しください。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default RandomGenerator;
