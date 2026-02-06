
import React, { useState, useEffect } from 'react';
import { Scale, ArrowRightLeft, Info, ShieldCheck, Zap } from 'lucide-react';

type Category = 'length' | 'weight' | 'temperature' | 'area';

const CATEGORIES: Record<Category, { name: string; units: Record<string, number | ((v: number) => number)> }> = {
  length: { name: '長さ', units: { m: 1, km: 1000, cm: 0.01, mm: 0.001, inch: 0.0254, ft: 0.3048, yard: 0.9144, mile: 1609.34 } },
  weight: { name: '重さ', units: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495, t: 1000 } },
  temperature: { name: '温度', units: { C: 0, F: 0, K: 0 } },
  area: { name: '面積', units: { m2: 1, km2: 1000000, cm2: 0.0001, ha: 10000, acre: 4046.86, tsubo: 3.30579 } }
};

const UnitConverter: React.FC = () => {
  const [category, setCategory] = useState<Category>('length');
  const [value, setValue] = useState<string>('');
  const [fromUnit, setFromUnit] = useState<string>('m');
  const [toUnit, setToUnit] = useState<string>('cm');
  const [result, setResult] = useState<string>('');

  useEffect(() => {
    const keys = Object.keys(CATEGORIES[category].units);
    setFromUnit(keys[0]);
    setToUnit(keys[1] || keys[0]);
    setValue('');
    setResult('');
  }, [category]);

  useEffect(() => {
    if (value === '') { setResult(''); return; }
    const val = parseFloat(value);
    if (isNaN(val)) { setResult('Error'); return; }
    let converted = 0;
    if (category === 'temperature') {
      let celsius = val;
      if (fromUnit === 'F') celsius = (val - 32) * 5/9;
      if (fromUnit === 'K') celsius = val - 273.15;
      if (toUnit === 'C') converted = celsius;
      if (toUnit === 'F') converted = (celsius * 9/5) + 32;
      if (toUnit === 'K') converted = celsius + 273.15;
    } else {
      const units = CATEGORIES[category].units as Record<string, number>;
      const baseValue = val * units[fromUnit];
      converted = baseValue / units[toUnit];
    }
    setResult(Number(converted.toPrecision(10)).toString());
  }, [value, fromUnit, toUnit, category]);

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2"><Scale className="text-fuchsia-500" />単位変換</h2>
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
          {(Object.keys(CATEGORIES) as Category[]).map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${category === cat ? 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700' : 'bg-gray-50 dark:bg-gray-800 text-gray-500'}`}>{CATEGORIES[cat].name}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
           <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-500">変換元</label>
              <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="w-full p-4 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-2xl font-bold" placeholder="0" />
              <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} className="w-full p-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{Object.keys(CATEGORIES[category].units).map(u => <option key={u} value={u}>{u}</option>)}</select>
           </div>
           <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-500">変換先</label>
              <div className="w-full p-4 rounded-xl border border-fuchsia-200 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-2xl font-bold text-fuchsia-700 min-h-[66px] flex items-center">{result || '0'}</div>
              <select value={toUnit} onChange={(e) => setToUnit(e.target.value)} className="w-full p-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{Object.keys(CATEGORIES[category].units).map(u => <option key={u} value={u}>{u}</option>)}</select>
           </div>
        </div>
        <div className="mt-8 flex justify-center text-gray-400"><ArrowRightLeft size={24} /></div>
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />多機能な単位変換ツールの特徴</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-fuchsia-500" />海外基準の計算もスムーズに</h3>
               <p>メートルからインチ、キログラムからポンドなど、日本と海外で異なる単位体系を即座に橋渡しします。特に温度変換（摂氏・華氏）や、日本の伝統的な面積単位「坪（つぼ）」の計算にも対応しており、不動産やDIYの場面でも重宝します。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-fuchsia-500" />リアルタイムで正確な算出</h3>
               <p>数値を入力した瞬間に計算結果が反映されるため、複数の候補を比較する際もストレスがありません。高精度なJavaScript演算エンジンにより、ビジネス実務でも安心してお使いいただける正確さを提供します。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default UnitConverter;
