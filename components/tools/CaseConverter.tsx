import React, { useState } from 'react';
import { Type, ArrowDown, Copy, Check } from 'lucide-react';

const CaseConverter: React.FC = () => {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const convert = (type: string) => {
    if (!input) return '';
    
    switch (type) {
        case 'upper': return input.toUpperCase();
        case 'lower': return input.toLowerCase();
        case 'camel': 
            return input.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
        case 'snake':
            return input.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
              ?.map(x => x.toLowerCase())
              .join('_') || input;
        case 'kebab':
            return input.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
              ?.map(x => x.toLowerCase())
              .join('-') || input;
        case 'pascal':
            return input.replace(/(\w)(\w*)/g, (g0,g1,g2) => g1.toUpperCase() + g2.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '');
        case 'title':
             return input.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        default: return input;
    }
  };

  const copy = (text: string, type: string) => {
      if(!text) return;
      navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 1500);
  };

  const ResultRow = ({ label, type }: { label: string, type: string }) => {
      const result = convert(type);
      return (
          <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center justify-between group">
             <div className="flex-1 overflow-hidden">
                <div className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-1 uppercase">{label}</div>
                <div className="font-mono text-gray-800 dark:text-white truncate select-all">{result || '...'}</div>
             </div>
             <button 
               onClick={() => copy(result, type)}
               className="p-2 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
             >
                {copied === type ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
             </button>
          </div>
      );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <Type className="text-orange-500" />
          ケース変換 (Case Converter)
        </h2>

        <div className="space-y-6">
            <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="テキストを入力 (例: hello world)"
               className="w-full h-32 p-4 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 placeholder-gray-400 dark:placeholder-gray-500"
            />

            <div className="flex justify-center text-gray-300 dark:text-gray-600">
                <ArrowDown />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <ResultRow label="UPPER CASE" type="upper" />
               <ResultRow label="lower case" type="lower" />
               <ResultRow label="camelCase" type="camel" />
               <ResultRow label="snake_case" type="snake" />
               <ResultRow label="kebab-case" type="kebab" />
               <ResultRow label="Title Case" type="title" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default CaseConverter;