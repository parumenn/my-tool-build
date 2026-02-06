
import React, { useState } from 'react';
import { Hash, Copy, Check, Info, ShieldCheck, Zap } from 'lucide-react';

const HashGenerator: React.FC = () => {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState<{[key: string]: string}>({});
  const [copied, setCopied] = useState<string | null>(null);

  const calculateHashes = async (text: string) => {
    setInput(text);
    if (!text) {
        setHashes({});
        return;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    const algos = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
    const newHashes: {[key: string]: string} = {};

    for (const algo of algos) {
        const hashBuffer = await crypto.subtle.digest(algo, data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        newHashes[algo] = hashHex;
    }
    setHashes(newHashes);
  };

  const copy = (text: string, algo: string) => {
    navigator.clipboard.writeText(text);
    setCopied(algo);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
       <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
             <Hash className="text-slate-600 dark:text-slate-400" />
             ハッシュ生成
          </h2>
          
          <div className="space-y-6">
             <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-2 block">入力テキスト</label>
                <textarea 
                   value={input}
                   onChange={(e) => calculateHashes(e.target.value)}
                   className="w-full h-32 p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-500"
                   placeholder="ハッシュ化したいテキストを入力..."
                />
             </div>

             <div className="space-y-4">
                {['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].map(algo => (
                   <div key={algo} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-xs font-bold text-gray-500 uppercase">{algo}</span>
                         <button 
                           onClick={() => copy(hashes[algo] || '', algo)}
                           className="text-gray-400 hover:text-blue-500 transition-colors"
                           disabled={!hashes[algo]}
                         >
                            {copied === algo ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                         </button>
                      </div>
                      <div className="font-mono text-sm text-gray-800 dark:text-gray-200 break-all select-all">
                         {hashes[algo] || '...'}
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </div>

       <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />ハッシュ関数の基礎と安全な生成について</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-slate-600" />データの同一性を検証する</h3>
               <p>ハッシュ生成（SHA-256など）は、あるデータから「指紋」のような固定長の文字列を作成する処理です。元のデータを一文字でも変えるとハッシュ値は全く別物になるため、パスワードの安全な保存、ファイルの改ざんチェック、API通信の整合性確認など、デジタルセキュリティの根幹を支えています。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-slate-600" />暗号学的に安全なWeb生成</h3>
               <p>当ツールのハッシュ計算は、ブラウザ標準の `Web Crypto API` を使用しています。これは高度な暗号処理をOSレベルで安全に実行する仕組みです。また、すべての処理はお使いの端末内で完結するため、ハッシュ化したい元のテキストがサーバーに送られることはなく、プライバシーは完全に守られています。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default HashGenerator;
