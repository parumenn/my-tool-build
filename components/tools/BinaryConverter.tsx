import React, { useState } from 'react';
import { Binary, ArrowRightLeft } from 'lucide-react';

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
      // Limit precision to avoid infinite loops
      let count = 0;
      while (fractionalPart > 0 && count < 10) {
        fractionalPart *= 2;
        if (fractionalPart >= 1) {
          binaryFrac += '1';
          fractionalPart -= 1;
        } else {
          binaryFrac += '0';
        }
        count++;
      }
    }

    return (num < 0 ? '-' : '') + binaryInt + binaryFrac;
  };

  const binaryToDecimal = (binStr: string) => {
    if (!binStr) return '';
    // Basic validation
    if (/[^01.\-]/.test(binStr)) return 'Invalid Binary';

    const isNegative = binStr.startsWith('-');
    const cleanBin = binStr.replace('-', '');
    const parts = cleanBin.split('.');
    
    const intPart = parseInt(parts[0], 2);
    let fracPart = 0;

    if (parts.length > 1) {
      const fracStr = parts[1];
      for (let i = 0; i < fracStr.length; i++) {
        if (fracStr[i] === '1') {
          fracPart += Math.pow(2, -(i + 1));
        }
      }
    }

    const result = intPart + fracPart;
    return isNegative ? (-result).toString() : result.toString();
  };

  const handleDecimalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDecimal(val);
    if (val === '') {
      setBinary('');
    } else {
      setBinary(decimalToBinary(val));
    }
  };

  const handleBinaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBinary(val);
    if (val === '') {
      setDecimal('');
    } else {
      setDecimal(binaryToDecimal(val));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Binary className="text-teal-500" />
          2進数変換
        </h2>
        <p className="text-gray-500 mb-8">
          10進数と2進数を相互に変換します。小数（浮動小数点数）にも簡易対応しています。
        </p>

        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 w-full space-y-2">
            <label className="block text-sm font-bold text-gray-700">10進数 (Decimal)</label>
            <input
              type="number"
              step="any"
              value={decimal}
              onChange={handleDecimalChange}
              placeholder="例: 10.5"
              className="block w-full rounded-xl border-gray-300 border p-4 text-xl font-mono focus:border-teal-500 focus:ring-teal-500 bg-gray-50"
            />
          </div>

          <div className="text-gray-400">
            <ArrowRightLeft size={24} className="rotate-90 md:rotate-0" />
          </div>

          <div className="flex-1 w-full space-y-2">
            <label className="block text-sm font-bold text-gray-700">2進数 (Binary)</label>
            <input
              type="text"
              value={binary}
              onChange={handleBinaryChange}
              placeholder="例: 1010.1"
              className="block w-full rounded-xl border-gray-300 border p-4 text-xl font-mono focus:border-teal-500 focus:ring-teal-500 bg-gray-50"
            />
          </div>
        </div>

        <div className="mt-8 p-4 bg-teal-50 rounded-xl text-teal-800 text-sm">
          <h4 className="font-bold mb-2">ヒント</h4>
          <ul className="list-disc list-inside space-y-1 opacity-80">
            <li>小数の変換は近似値になる場合があります（最大10桁まで計算）</li>
            <li>マイナス値の入力に対応しています</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BinaryConverter;
