import React, { useState } from 'react';
import { Dices, RefreshCw, Copy, Check, RotateCcw } from 'lucide-react';

const RandomGenerator: React.FC = () => {
  const [min, setMin] = useState<number>(1);
  const [max, setMax] = useState<number>(100);
  const [count, setCount] = useState<number>(1);
  const [allowDuplicates, setAllowDuplicates] = useState<boolean>(true);
  const [results, setResults] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    if (min >= max) {
      alert("最小値は最大値より小さく設定してください。");
      return;
    }
    
    if (!allowDuplicates && (max - min + 1) < count) {
        alert("重複なしの場合、生成数は範囲内の個数以下にしてください。");
        return;
    }

    const newResults: number[] = [];
    if (allowDuplicates) {
        for (let i = 0; i < count; i++) {
            newResults.push(Math.floor(Math.random() * (max - min + 1)) + min);
        }
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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <Dices className="text-rose-500" />
          乱数生成
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">最小値</label>
                        <input 
                          type="number" 
                          value={min} 
                          onChange={(e) => setMin(Number(e.target.value))}
                          className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">最大値</label>
                        <input 
                          type="number" 
                          value={max} 
                          onChange={(e) => setMax(Number(e.target.value))}
                          className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white font-mono"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">生成個数</label>
                    <div className="flex items-center gap-4">
                        <input 
                          type="range" 
                          min="1" 
                          max="100" 
                          value={count} 
                          onChange={(e) => setCount(Number(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                        />
                        <span className="w-12 text-center font-bold text-gray-800 dark:text-white">{count}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="dup"
                      checked={allowDuplicates} 
                      onChange={(e) => setAllowDuplicates(e.target.checked)}
                      className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 border-gray-300"
                    />
                    <label htmlFor="dup" className="font-bold text-gray-700 dark:text-gray-300 cursor-pointer">重複を許可する</label>
                </div>

                <button 
                  onClick={generate}
                  className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 dark:shadow-none flex items-center justify-center gap-2"
                >
                   <RefreshCw size={20} /> 生成する
                </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex flex-col h-full min-h-[300px] relative">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-bold text-gray-500">結果 ({results.length})</span>
                    <div className="flex gap-2">
                       <button onClick={() => setResults([])} className="text-gray-400 hover:text-red-500 p-1">
                          <RotateCcw size={16} />
                       </button>
                       <button onClick={copyToClipboard} className="text-gray-400 hover:text-blue-500 p-1 flex items-center gap-1">
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                       </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-1">
                   {results.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-gray-300 text-4xl font-mono">?</div>
                   ) : (
                      results.map((num, i) => (
                         <div key={i} className="font-mono text-lg text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700 last:border-0 py-1">
                            {num}
                         </div>
                      ))
                   )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RandomGenerator;