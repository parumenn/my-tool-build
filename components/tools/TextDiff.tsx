import React, { useState } from 'react';
import { FileDiff, Split, AlignLeft } from 'lucide-react';
import * as Diff from 'diff';

const TextDiff: React.FC = () => {
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');
  const [mode, setMode] = useState<'chars' | 'words' | 'lines'>('words');
  const [diffResult, setDiffResult] = useState<Diff.Change[]>([]);

  const handleCompare = () => {
    let result;
    if (mode === 'chars') {
      result = Diff.diffChars(oldText, newText);
    } else if (mode === 'words') {
      result = Diff.diffWords(oldText, newText);
    } else {
      result = Diff.diffLines(oldText, newText);
    }
    setDiffResult(result);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileDiff className="text-cyan-600" />
            テキストDiff (差分比較)
          </h2>
          
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg self-start">
             <button
               onClick={() => setMode('words')}
               className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${mode === 'words' ? 'bg-white dark:bg-gray-700 shadow text-cyan-700 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400'}`}
             >
               単語
             </button>
             <button
               onClick={() => setMode('lines')}
               className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${mode === 'lines' ? 'bg-white dark:bg-gray-700 shadow text-cyan-700 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400'}`}
             >
               行
             </button>
             <button
               onClick={() => setMode('chars')}
               className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${mode === 'chars' ? 'bg-white dark:bg-gray-700 shadow text-cyan-700 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400'}`}
             >
               文字
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">変更前 (Old)</label>
            <textarea
              value={oldText}
              onChange={(e) => setOldText(e.target.value)}
              className="w-full h-48 p-4 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 placeholder-gray-400"
              placeholder="元のテキストを入力..."
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">変更後 (New)</label>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full h-48 p-4 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 placeholder-gray-400"
              placeholder="新しいテキストを入力..."
            />
          </div>
        </div>

        <button
          onClick={handleCompare}
          className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-cyan-200 dark:shadow-none flex items-center justify-center gap-2"
        >
          <Split size={20} />
          差分を比較する
        </button>

        {diffResult.length > 0 && (
          <div className="mt-8 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">比較結果</h3>
            <div className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
              {diffResult.map((part, index) => {
                const color = part.added 
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-b-2 border-green-300 dark:border-green-700' 
                  : part.removed 
                    ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-b-2 border-red-300 dark:border-red-700 decoration-wavy line-through decoration-red-400' 
                    : 'text-gray-600 dark:text-gray-300';
                return (
                  <span key={index} className={`${color} px-0.5 py-0.5 rounded-sm`}>
                    {part.value}
                  </span>
                );
              })}
            </div>
            
            <div className="flex gap-4 mt-2 text-xs font-bold">
               <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><span className="w-3 h-3 bg-green-100 dark:bg-green-900 rounded"></span> 追加</span>
               <span className="flex items-center gap-1 text-red-600 dark:text-red-400"><span className="w-3 h-3 bg-red-100 dark:bg-red-900 rounded"></span> 削除</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextDiff;