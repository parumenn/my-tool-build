
import React, { useState, useEffect } from 'react';
import { BoxSelect, ArrowRight, Info, ShieldCheck, Zap } from 'lucide-react';

const AspectRatioCalculator: React.FC = () => {
  const [width, setWidth] = useState<string>('1920');
  const [height, setHeight] = useState<string>('1080');
  const [ratio, setRatio] = useState<string>('16:9');
  
  const calculateRatio = (w: number, h: number) => {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(w, h);
    return `${w / divisor}:${h / divisor}`;
  };

  const handleDimensionChange = (type: 'w' | 'h', val: string) => {
    if (type === 'w') {
        setWidth(val);
        if (val && height) setRatio(calculateRatio(Number(val), Number(height)));
    } else {
        setHeight(val);
        if (width && val) setRatio(calculateRatio(Number(width), Number(val)));
    }
  };

  const setPreset = (w: number, h: number) => {
      setWidth(w.toString());
      setHeight(h.toString());
      setRatio(calculateRatio(w, h));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
       <div className="bg-white dark:bg-dark-lighter rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
             <BoxSelect className="text-cyan-500" />
             アスペクト比計算
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-8">
              <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">幅 (Width)</label>
                      <input 
                         type="number"
                         value={width}
                         onChange={(e) => handleDimensionChange('w', e.target.value)}
                         className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-2xl font-bold font-mono"
                      />
                  </div>
                  <div className="flex justify-center text-gray-400">
                      <span className="text-xl">×</span>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">高さ (Height)</label>
                      <input 
                         type="number"
                         value={height}
                         onChange={(e) => handleDimensionChange('h', e.target.value)}
                         className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-2xl font-bold font-mono"
                      />
                  </div>
              </div>

              <div className="flex flex-col items-center justify-center p-8 bg-cyan-50 dark:bg-cyan-900/20 rounded-3xl border border-cyan-100 dark:border-cyan-800 h-full">
                  <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase mb-2">Aspect Ratio</span>
                  <div className="text-5xl font-black text-slate-800 dark:text-white mb-2">
                      {ratio}
                  </div>
                  <div className="text-xs text-cyan-700 dark:text-cyan-300 opacity-70">
                      {width && height ? (Number(width)/Number(height)).toFixed(4) : ''}
                  </div>
              </div>
          </div>

          <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">解像度プリセット</label>
              <div className="flex flex-wrap gap-2">
                  <button onClick={() => setPreset(1920, 1080)} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded-lg text-sm font-bold transition-colors">FHD (16:9)</button>
                  <button onClick={() => setPreset(3840, 2160)} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded-lg text-sm font-bold transition-colors">4K (16:9)</button>
                  <button onClick={() => setPreset(1080, 1920)} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded-lg text-sm font-bold transition-colors">Vertical (9:16)</button>
                  <button onClick={() => setPreset(1440, 1080)} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded-lg text-sm font-bold transition-colors">Standard (4:3)</button>
              </div>
          </div>
       </div>

       <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />アスペクト比計算ツールの活用ガイド</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-cyan-500" />デザイン・映像編集を正確に</h3>
               <p>アスペクト比とは、画面や画像の「縦横比」のことです。YouTubeの16:9や、Instagramの1:1、映画の2.35:1など、メディアごとに最適な比率が異なります。当ツールを使えば、任意のピクセル数から正確な比率を瞬時に算出できます。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-cyan-500" />完全無料・インストール不要</h3>
               <p>ブラウザ上で動作するため、ログインやソフトの導入は不要です。デザインのモックアップ作成や、モニター買い替え時のサイズ確認、動画の書き出し設定など、エンジニアからクリエイターまで幅広くお使いいただけます。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default AspectRatioCalculator;
