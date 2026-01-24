import React, { useState, useEffect } from 'react';
import { KeyRound, RefreshCw, Copy, Check, History, Trash2, ToggleRight, ToggleLeft } from 'lucide-react';

// Simple XOR Cipher for mock encryption (Not military grade, but prevents plain text read)
const XOR_KEY = "maitool_secure_key";
const encrypt = (text: string) => {
  try {
    const xor = text.split('').map((c, i) => 
      String.fromCharCode(c.charCodeAt(0) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length))
    ).join('');
    return btoa(xor);
  } catch (e) { return ''; }
};
const decrypt = (encoded: string) => {
  try {
    const xor = atob(encoded);
    return xor.split('').map((c, i) => 
      String.fromCharCode(c.charCodeAt(0) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length))
    ).join('');
  } catch (e) { return '***Error***'; }
};

interface HistoryItem {
  id: number;
  encrypted: string;
  timestamp: string;
}

const PasswordGenerator: React.FC = () => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // History State
  const [saveHistory, setSaveHistory] = useState<boolean>(() => {
    return localStorage.getItem('pwd_save_history') === 'true';
  });
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('pwd_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('pwd_save_history', String(saveHistory));
  }, [saveHistory]);

  useEffect(() => {
    localStorage.setItem('pwd_history', JSON.stringify(history));
  }, [history]);

  const generatePassword = () => {
    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (charset === '') {
      setPassword('');
      return;
    }

    let result = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }
    setPassword(result);

    // Save History
    if (saveHistory) {
      const newItem: HistoryItem = {
        id: Date.now(),
        encrypted: encrypt(result),
        timestamp: new Date().toLocaleString('ja-JP')
      };
      setHistory(prev => [newItem, ...prev].slice(0, 10)); // Keep last 10
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-dark-lighter rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
              <KeyRound className="text-emerald-500" />
              パスワード生成
            </h2>

            {/* Display Area */}
            <div className="flex gap-2 mb-8">
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-4 flex items-center overflow-hidden">
                <span className="font-mono text-xl md:text-2xl text-gray-800 dark:text-gray-100 break-all">
                  {password || <span className="text-gray-400 text-base">設定を選んで生成してください</span>}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(password)}
                disabled={!password}
                className={`px-6 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
                  copied 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none'
                } disabled:opacity-50 disabled:shadow-none`}
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>

            {/* Controls */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-gray-700 dark:text-gray-200">文字数</label>
                  <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg font-mono font-bold">{length}</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="64"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-white dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeUppercase}
                    onChange={(e) => setIncludeUppercase(e.target.checked)}
                    className="w-full h-5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">大文字 (A-Z)</span>
                </label>

                <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-white dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeLowercase}
                    onChange={(e) => setIncludeLowercase(e.target.checked)}
                    className="w-full h-5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">小文字 (a-z)</span>
                </label>

                <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-white dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeNumbers}
                    onChange={(e) => setIncludeNumbers(e.target.checked)}
                    className="w-full h-5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">数字 (0-9)</span>
                </label>

                <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-white dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeSymbols}
                    onChange={(e) => setIncludeSymbols(e.target.checked)}
                    className="w-full h-5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">記号 (!@#$)</span>
                </label>
              </div>

              <button
                onClick={generatePassword}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} />
                パスワードを生成
              </button>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
             <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                   <History size={18} /> 生成履歴
                </h3>
                <div className="flex items-center gap-2">
                   <span className="text-xs text-gray-400">保存</span>
                   <button 
                     onClick={() => setSaveHistory(!saveHistory)}
                     className={`text-2xl transition-colors ${saveHistory ? 'text-emerald-500' : 'text-gray-300'}`}
                   >
                     {saveHistory ? <ToggleRight /> : <ToggleLeft />}
                   </button>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
                {history.length === 0 && (
                   <p className="text-center text-xs text-gray-400 py-8">履歴はありません</p>
                )}
                {history.map(item => {
                   const raw = decrypt(item.encrypted);
                   return (
                      <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors relative">
                         <p className="font-mono font-bold text-gray-800 dark:text-gray-200 text-sm break-all mb-1">{raw}</p>
                         <p className="text-[10px] text-gray-400">{item.timestamp}</p>
                         <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => copyToClipboard(raw)} className="p-1 text-emerald-600 hover:bg-emerald-100 rounded">
                               <Copy size={14} />
                            </button>
                            <button onClick={() => setHistory(h => h.filter(x => x.id !== item.id))} className="p-1 text-red-400 hover:bg-red-100 rounded">
                               <Trash2 size={14} />
                            </button>
                         </div>
                      </div>
                   );
                })}
             </div>
             
             {history.length > 0 && (
                <button 
                  onClick={() => setHistory([])}
                  className="mt-4 w-full py-2 text-xs text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                   <Trash2 size={12} /> 履歴を全消去
                </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordGenerator;