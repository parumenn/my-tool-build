
import React, { useState } from 'react';
import { Binary, ArrowRightLeft, Info, ShieldCheck, Cpu } from 'lucide-react';
import AdBanner from '../AdBanner';

const BinaryConverter: React.FC = () => {
  const [decimal, setDecimal] = useState<string>('');
  const [binary, setBinary] = useState<string>('');

  const decimalToBinary = (numStr: string) => {
    if (!numStr) return '';
    const num = parseFloat(numStr);
    if (isNaN(num)) return 'Error';
    const integerPart = Math.floor(Math.abs(num));
    let fractionalPart = Math.abs(num) - integerPart;
    let binaryInt = integerPart.toString(2);
    let binaryFrac = '';
    if (fractionalPart > 0) {
      binaryFrac = '.';
      let count = 0;
      while (fractionalPart > 0 && count < 10) {
        fractionalPart *= 2;
        if (fractionalPart >= 1) { binaryFrac += '1'; fractionalPart -= 1; }
        else { binaryFrac += '0'; }
        count++;
      }
    }
    return (num < 0 ? '-' : '') + binaryInt + binaryFrac;
  };

  const binaryToDecimal = (binStr: string) => {
    if (!binStr) return '';
    if (/[^01.\-]/.test(binStr)) return 'Invalid Binary';
    const isNegative = binStr.startsWith('-');
    const parts = binStr.replace('-', '').split('.');
    const intPart = parseInt(parts[0], 2);
    let fracPart = 0;
    if (parts.length > 1) {
      const fracStr = parts[1];
      for (let i = 0; i < fracStr.length; i++) {
        if (fracStr[i] === '1') fracPart += Math.pow(2, -(i + 1));
      }
    }
    const result = intPart + fracPart;
    return isNegative ? (-result).toString() : result.toString();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Binary className="text-teal-500" />2進数変換</h2>
        <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
          <div className="flex-1 w-full space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">10進数 (Decimal)</label>
            <input type="number" step="any" value={decimal} onChange={(e) => {setDecimal(e.target.value); setBinary(decimalToBinary(e.target.value));}} className="block w-full rounded-xl border p-4 text-xl font-mono dark:bg-gray-800 dark:text-white" />
          </div>
          <div className="text-gray-400"><ArrowRightLeft size={24} className="rotate-90 md:rotate-0" /></div>
          <div className="flex-1 w-full space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">2進数 (Binary)</label>
            <input type="text" value={binary} onChange={(e) => {setBinary(e.target.value); setDecimal(binaryToDecimal(e.target.value));}} className="block w-full rounded-xl border p-4 text-xl font-mono dark:bg-gray-800 dark:text-white" />
          </div>
        </div>
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />2進数（バイナリ）とは？</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Cpu size={18} className="text-teal-500" />コンピューターの基本言語</h3>
               <p>普段私たちが使っている10進数（0〜9）に対し、コンピューターは内部ですべてを「0」と「1」の2進数で処理しています。当ツールは、プログラムのフラグ管理やネットワーク設定、データサイズの計算などで必要となる基数変換を直感的に行えます。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-teal-500" />学習や設計のサポートに</h3>
               <p>小数点の変換にも対応しており、浮動小数点数の概念を理解する学習用としても最適です。ブラウザ上で動作するため、インストール不要でいつでも手軽にご利用いただけます。</p>
            </div>
         </div>
      </article>
      <AdBanner />
    </div>
  );
};

export default BinaryConverter;
