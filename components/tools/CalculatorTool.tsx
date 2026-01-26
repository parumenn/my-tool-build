import React, { useState, useEffect } from 'react';
import { Calculator, RotateCcw, History } from 'lucide-react';

const CalculatorTool: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const handleInput = (val: string) => {
    if (val === 'AC') {
      setDisplay('0');
      setExpression('');
    } else if (val === 'C') {
      setDisplay('0');
    } else if (val === '=') {
      try {
        // Safe evaluation
        const result = Function(`'use strict'; return (${expression + display})`)();
        const finalExp = `${expression}${display} = ${result}`;
        setHistory(prev => [finalExp, ...prev].slice(0, 10));
        setDisplay(String(result));
        setExpression('');
      } catch (e) {
        setDisplay('Error');
      }
    } else if (['+', '-', '*', '/', '%'].includes(val)) {
      setExpression(display + ' ' + val + ' ');
      setDisplay('0');
    } else {
      setDisplay(prev => prev === '0' ? val : prev + val);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
     const key = e.key;
     if (/[0-9.]/.test(key)) handleInput(key);
     if (['+', '-', '*', '/', '%'].includes(key)) handleInput(key);
     if (key === 'Enter') handleInput('=');
     if (key === 'Backspace') setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
     if (key === 'Escape') handleInput('AC');
  };

  useEffect(() => {
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
  }, [display, expression]); // Dependencies needed for state access in event listener

  const buttons = [
    'AC', 'C', '%', '/',
    '7', '8', '9', '*',
    '4', '5', '6', '-',
    '1', '2', '3', '+',
    '0', '.', '='
  ];

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
       <div className="bg-white dark:bg-dark-lighter rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 mb-6 text-right h-32 flex flex-col justify-end">
             <div className="text-sm text-gray-500 dark:text-gray-400 h-6">{expression}</div>
             <div className="text-4xl md:text-5xl font-mono font-bold text-gray-800 dark:text-white truncate">{display}</div>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
             {buttons.map(btn => (
               <button
                 key={btn}
                 onClick={() => handleInput(btn)}
                 className={`
                    h-16 rounded-xl text-xl font-bold transition-transform active:scale-95 shadow-sm
                    ${btn === '=' ? 'col-span-2 bg-orange-500 text-white hover:bg-orange-600' : ''}
                    ${['AC', 'C', '%'].includes(btn) ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white' : ''}
                    ${['/', '*', '-', '+'].includes(btn) ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' : ''}
                    ${/[0-9.]/.test(btn) ? 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                 `}
               >
                 {btn}
               </button>
             ))}
          </div>
       </div>

       <div className="bg-white dark:bg-dark-lighter rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
             <History size={20} /> 計算履歴
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2">
             {history.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">履歴はありません</p>
             ) : (
                history.map((h, i) => (
                   <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-right font-mono text-gray-700 dark:text-gray-200">
                      {h}
                   </div>
                ))
             )}
          </div>
          {history.length > 0 && (
             <button onClick={() => setHistory([])} className="mt-4 text-sm text-red-400 hover:text-red-500 flex items-center gap-1 justify-center">
                <RotateCcw size={14} /> 履歴をクリア
             </button>
          )}
       </div>
    </div>
  );
};

export default CalculatorTool;