
import React, { useState } from 'react';
import { FileDiff, Split, AlignLeft, Info, ShieldCheck, Zap, Maximize2, Minimize2, X } from 'lucide-react';
import * as Diff from 'diff';

const TextDiff: React.FC = () => {
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');
  const [mode, setMode] = useState<'chars' | 'words' | 'lines'>('words');
  const [diffResult, setDiffResult] = useState<Diff.Change[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);

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

  const DiffOutput = () => (
    <div className={`bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words ${isFullScreen ? 'flex-1 overflow-y-auto' : ''}`}>
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
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
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
              className="w-full h-48 p-4 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 placeholder-gray-400"
              placeholder="元のテキストを入力..."
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">変更後 (New)</label>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full h-48 p-4 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 placeholder-gray-400"
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">比較結果</h3>
              <button 
                onClick={() => setIsFullScreen(true)}
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 hover:text-cyan-600 transition-colors flex items-center gap-2 text-xs font-bold"
              >
                <Maximize2 size={16} /> 全画面表示
              </button>
            </div>
            
            <DiffOutput />
            
            <div className="flex gap-4 mt-2 text-xs font-bold">
               <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><span className="w-3 h-3 bg-green-100 dark:bg-green-900 rounded"></span> 追加</span>
               <span className="flex items-center gap-1 text-red-600 dark:text-red-400"><span className="w-3 h-3 bg-red-100 dark:bg-red-900 rounded"></span> 削除</span>
            </div>
          </div>
        )}
      </div>

      {/* Full Screen Overlay */}
      {isFullScreen && (
        <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col p-4 md:p-8 animate-fade-in">
          <div className="flex justify-between items-center mb-4 text-white">
            <h3 className="text-xl font-black flex items-center gap-2"><FileDiff /> 比較結果（全画面表示）</h3>
            <button onClick={() => setIsFullScreen(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
          </div>
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden flex flex-col p-6 shadow-2xl">
             <DiffOutput />
             <div className="flex gap-6 mt-6 shrink-0 border-t pt-4 dark:border-slate-800">
               <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-100 dark:bg-green-900/50 border border-green-300 rounded"></div><span className="text-xs font-bold dark:text-gray-300">追加テキスト</span></div>
               <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-100 dark:bg-red-900/50 border border-red-300 rounded"></div><span className="text-xs font-bold dark:text-gray-300">削除テキスト</span></div>
               <button onClick={() => setIsFullScreen(false)} className="ml-auto px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-lg flex items-center gap-2"><Minimize2 size={16}/> 閉じる</button>
             </div>
          </div>
        </div>
      )}

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />テキストDiff（差分比較）の活用法</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-cyan-600" />修正箇所の見落としを防ぐ</h3>
               <p>当ツールは、2つのテキスト（旧バージョンと新バージョン）を比較し、どこが追加され、どこが削除されたかを視覚的に分かりやすく表示します。プログラミングのコード比較だけでなく、契約書の改定チェックや、ライティング原稿の校正など、ビジネスシーンでの「間違い探し」を自動化します。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-cyan-600" />機密テキストも安全</h3>
               <p>比較処理はお客様のブラウザ内で完結するため、入力した機密情報が当サイトのサーバーに送信されることはありません。外部のオンラインツールを使う際に懸念される情報漏洩のリスクをゼロに抑え、セキュアな作業環境を提供します。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default TextDiff;
