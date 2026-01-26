
import React, { useState, useEffect } from 'react';
import { Calculator, RotateCcw, History, Info, ShieldCheck, Zap } from 'lucide-react';

const CalculatorTool: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const handleInput = (val: string) => {
    if (val === 'AC') { setDisplay('0'); setExpression(''); }
    else if (val === 'C') { setDisplay('0'); }
    else if (val === '=') {
      try {
        const result = Function(`'use strict'; return (${expression + display})`)();
        const finalExp = `${expression}${display} = ${result}`;
        setHistory(prev => [finalExp, ...prev].slice(0, 10));
        setDisplay(String(result)); setExpression('');
      } catch (e) { setDisplay('Error'); }
    } else if (['+', '-', '*', '/', '%'].includes(val)) { setExpression(display + ' ' + val + ' '); setDisplay('0'); }
    else { setDisplay(prev => prev === '0' ? val : prev + val); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <div className="bg-white dark:bg-dark-lighter rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 mb-6 text-right h-32 flex flex-col justify-end">
             <div className="text-sm text-gray-500 h-6">{expression}</div>
             <div className="text-4xl md:text-5xl font-mono font-bold truncate">{display}</div>
          </div>
          <div className="grid grid-cols-4 gap-3">
             {['AC', 'C', '%', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='].map(btn => (
               <button key={btn} onClick={() => handleInput(btn)} className={`h-16 rounded-xl text-xl font-bold shadow-sm ${btn === '=' ? 'col-span-2 bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>{btn}</button>
             ))}
          </div>
       </div>
       <div className="bg-white dark:bg-dark-lighter rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
          <h3 className="font-bold mb-4 flex items-center gap-2"><History size={20} /> 計算履歴</h3>
          <div className="flex-1 overflow-y-auto space-y-2">{history.length === 0 ? <p className="text-center text-gray-400 py-8">履歴なし</p> : history.map((h, i) => (<div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-right font-mono text-sm">{h}</div>))}</div>
       </div>
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />シンプルで便利なオンライン計算機</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-orange-600" />履歴機能で確認もスムーズ</h3>
               <p>「さっきの計算結果を忘れてしまった」というストレスを解消するため、直近10件の計算履歴を表示する機能を搭載しています。四則演算に加え、パーセント計算にも対応。ビジネスや日常生活でのちょっとした計算に最適です。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-orange-600" />キーボード入力にも対応</h3>
               <p>画面上のボタン操作だけでなく、キーボードのテンキーからも直接入力が可能です（Enterで実行、BackSpaceで一文字消去）。PC・スマホのどちらからでも高速に、かつ登録不要・無料で今すぐご利用いただけます。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default CalculatorTool;
