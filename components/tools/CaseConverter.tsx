
import React, { useState } from 'react';
import { Type, ArrowDown, Copy, Check, Info, ShieldCheck, Zap } from 'lucide-react';

const CaseConverter: React.FC = () => {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const convert = (type: string) => {
    if (!input) return '';
    switch (type) {
        case 'upper': return input.toUpperCase();
        case 'lower': return input.toLowerCase();
        case 'camel': return input.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
        case 'snake': return input.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)?.map(x => x.toLowerCase()).join('_') || input;
        case 'kebab': return input.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)?.map(x => x.toLowerCase()).join('-') || input;
        case 'pascal': return input.replace(/(\w)(\w*)/g, (g0,g1,g2) => g1.toUpperCase() + g2.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '');
        default: return input;
    }
  };

  const copy = (text: string, type: string) => {
      if(!text) return; navigator.clipboard.writeText(text);
      setCopied(type); setTimeout(() => setCopied(null), 1500);
  };

  const ResultRow = ({ label, type }: { label: string, type: string }) => {
      const result = convert(type);
      return (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between group">
             <div className="flex-1 overflow-hidden">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</div>
                <div className="font-mono text-gray-800 dark:text-white truncate font-bold">{result || '...'}</div>
             </div>
             <button onClick={() => copy(result, type)} className="p-2 text-gray-400 hover:text-orange-500 transition-colors">
                {copied === type ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
             </button>
          </div>
      );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2"><Type className="text-orange-500" />ケース変換</h2>
        <div className="space-y-6">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="hello world" className="w-full h-32 p-4 rounded-xl border dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <ResultRow label="UPPER CASE" type="upper" />
               <ResultRow label="lower case" type="lower" />
               <ResultRow label="camelCase" type="camel" />
               <ResultRow label="snake_case" type="snake" />
               <ResultRow label="kebab-case" type="kebab" />
               <ResultRow label="PascalCase" type="pascal" />
            </div>
        </div>
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />エンジニアのための命名規則変換ツール</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-orange-500" />開発効率を最大化</h3>
               <p>プログラミング言語やフレームワークによって、推奨される変数の命名規則（ケース）は異なります。JavaScriptの camelCase、Pythonの snake_case、CSSの kebab-case など、複数の命名規則間をワンクリックで一括変換できます。手動で書き直す手間を省き、コーディングのスピードと正確性を向上させます。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-orange-500" />安全な文字列処理</h3>
               <p>当ツールは、高度な正規表現を用いたブラウザ上のJavaScriptエンジンで動作します。入力した文字列がサーバーに送信されたり、ログに残ることはありません。機密性の高いプロジェクト名や内部コードの変換にも、安心してご利用いただける設計となっています。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default CaseConverter;
