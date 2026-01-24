import React, { useState } from 'react';
import { Fingerprint, RefreshCw, Copy, Check, Trash2 } from 'lucide-react';

const UuidGenerator: React.FC = () => {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const newUuids = Array.from({ length: count }, () => crypto.randomUUID());
    setUuids(newUuids);
  };

  const copyToClipboard = () => {
    if (uuids.length === 0) return;
    navigator.clipboard.writeText(uuids.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <Fingerprint className="text-violet-500" />
          UUID生成 (v4)
        </h2>

        <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
                <div>
                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">生成数</label>
                   <div className="flex items-center gap-4">
                       <input 
                         type="range" min="1" max="50" 
                         value={count} 
                         onChange={(e) => setCount(Number(e.target.value))}
                         className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                       />
                       <span className="w-12 text-center font-bold text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 py-1 rounded-lg">{count}</span>
                   </div>
                </div>

                <button 
                  onClick={generate}
                  className="w-full py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200 dark:shadow-none flex items-center justify-center gap-2"
                >
                   <RefreshCw size={20} /> UUIDを生成
                </button>
            </div>

            <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex flex-col h-[300px] border border-gray-200 dark:border-gray-700 relative">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-bold text-gray-500 uppercase">Output</span>
                    <div className="flex gap-2">
                       <button onClick={() => setUuids([])} className="text-gray-400 hover:text-red-500 p-1" title="クリア">
                          <Trash2 size={16} />
                       </button>
                       <button onClick={copyToClipboard} className="text-gray-400 hover:text-blue-500 p-1 flex items-center gap-1" title="コピー">
                          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                       </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto font-mono text-sm text-gray-700 dark:text-gray-200 space-y-2">
                   {uuids.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                         生成ボタンを押してください
                      </div>
                   ) : (
                      uuids.map((uuid, i) => (
                         <div key={i} className="select-all">{uuid}</div>
                      ))
                   )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UuidGenerator;