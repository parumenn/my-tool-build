
import React, { useState } from 'react';
import { FileJson, AlignLeft, Minimize2, Copy, Check, Trash2, Info, ShieldCheck, Zap } from 'lucide-react';

const JsonFormatter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const formatJson = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (e) {
      setError('Invalid JSON');
      setOutput('');
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError('');
    } catch (e) {
      setError('Invalid JSON');
      setOutput('');
    }
  };

  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <FileJson className="text-yellow-500" />
          JSON整形・検証
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-2">
                 <label className="font-bold text-gray-700 dark:text-gray-300">入力 (JSON)</label>
                 <button onClick={() => setInput('')} className="text-xs text-red-500 font-bold flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded"><Trash2 size={12} /> クリア</button>
              </div>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 w-full min-h-[400px] p-4 rounded-xl border dark:border-slate-700 bg-gray-50 dark:bg-slate-900 font-mono text-sm focus:ring-2 focus:ring-yellow-400 dark:text-white" placeholder='{"key": "value"}' spellCheck={false} />
           </div>
           <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-2">
                 <label className="font-bold text-gray-700 dark:text-gray-300">出力</label>
                 <div className="flex gap-2">
                    <button onClick={formatJson} className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg font-bold flex items-center gap-1">整形</button>
                    <button onClick={minifyJson} className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg font-bold flex items-center gap-1">圧縮</button>
                 </div>
              </div>
              <div className="relative flex-1">
                 <textarea readOnly value={output} className={`w-full h-full min-h-[400px] p-4 rounded-xl border ${error ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-slate-700 bg-slate-900 text-green-400'} font-mono text-sm focus:outline-none`} />
                 {error && <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm">{error}</div>}
                 {output && !error && <button onClick={copyToClipboard} className="absolute top-4 right-4 bg-white/10 backdrop-blur text-white p-2 rounded-lg hover:bg-white/20 transition-colors">{copied ? <Check size={16} /> : <Copy size={16} />}</button>}
              </div>
           </div>
        </div>
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />JSON整形ツールの重要性とメリット</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-yellow-500" />デバッグを効率化</h3>
               <p>API通信や設定ファイルで使われるJSON形式は、一行に圧縮されていると構造の把握が困難です。当ツールの「整形」機能は、インデントを自動挿入して人間が読みやすい状態にします。また、構文エラーをリアルタイムで検知し、赤く強調表示するため、デバッグ作業の時間を大幅に短縮できます。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-yellow-500" />機密データも安全に処理</h3>
               <p>一般的に、開発中のJSONデータにはパスワードや顧客情報の断片が含まれることがあります。当サイトのJSON整形ツールは、データ送信を行わず、ブラウザ上のメモリのみで変換を行うため、セキュリティポリシーの厳しい環境下でも安心してご利用いただけます。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default JsonFormatter;
