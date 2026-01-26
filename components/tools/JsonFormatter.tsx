import React, { useState } from 'react';
import { FileJson, AlignLeft, Minimize2, Copy, Check, Trash2 } from 'lucide-react';

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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <FileJson className="text-yellow-500" />
          JSON整形・検証
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-2">
                 <label className="font-bold text-gray-700 dark:text-gray-300">入力 (JSON)</label>
                 <button onClick={() => setInput('')} className="text-xs text-red-500 flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded">
                    <Trash2 size={12} /> クリア
                 </button>
              </div>
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 w-full min-h-[400px] p-4 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 font-mono text-sm focus:ring-2 focus:ring-yellow-400 text-gray-900 dark:text-white placeholder-gray-400"
                placeholder='{"key": "value"}'
              />
           </div>

           <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-2">
                 <label className="font-bold text-gray-700 dark:text-gray-300">出力</label>
                 <div className="flex gap-2">
                    <button onClick={formatJson} className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white">
                       <AlignLeft size={12} /> 整形
                    </button>
                    <button onClick={minifyJson} className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white">
                       <Minimize2 size={12} /> 圧縮
                    </button>
                 </div>
              </div>
              <div className="relative flex-1">
                 <textarea 
                   readOnly
                   value={output}
                   className={`w-full h-full min-h-[400px] p-4 rounded-xl border ${error ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-slate-600 bg-gray-800 text-green-400'} font-mono text-sm focus:outline-none`}
                   placeholder="結果がここに表示されます"
                 />
                 {error && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm">
                       {error}
                    </div>
                 )}
                 {output && !error && (
                    <button 
                      onClick={copyToClipboard}
                      className="absolute top-4 right-4 bg-white/10 backdrop-blur text-white p-2 rounded-lg hover:bg-white/20 transition-colors"
                    >
                       {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default JsonFormatter;