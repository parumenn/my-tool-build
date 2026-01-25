
import React, { useState, useEffect, useRef } from 'react';
import { Pipette, Copy, Check, Upload, Image as ImageIcon, Sliders, Palette, ChevronRight, Info, ShieldCheck, Zap } from 'lucide-react';

const ColorPickerTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'manual' | 'image'>('manual');
  const [hex, setHex] = useState<string>('#3b82f6');
  const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
  const [copied, setCopied] = useState<string | null>(null);

  // Image State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Converters ---
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;
    if (max === min) h = s = 0;
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const rgbToCmyk = (r: number, g: number, b: number) => {
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    let k = Math.min(c, m, y);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    c = (c - k) / (1 - k); m = (m - k) / (1 - k); y = (y - k) / (1 - k);
    return { c: Math.round(c * 100), m: Math.round(m * 100), y: Math.round(y * 100), k: Math.round(k * 100) };
  };

  const handleHexChange = (val: string) => {
    setHex(val);
    const rgbVal = hexToRgb(val);
    if (rgbVal) setRgb(rgbVal);
  };

  const handleRgbChange = (key: 'r' | 'g' | 'b', val: number) => {
    const newRgb = { ...rgb, [key]: val };
    setRgb(newRgb);
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImageSrc(URL.createObjectURL(file));
  };

  useEffect(() => {
    if (imageSrc && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
      };
      img.src = imageSrc;
    }
  }, [imageSrc]);

  const pickColor = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const newHex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    setHex(newHex);
    setRgb({ r: pixel[0], g: pixel[1], b: pixel[2] });
    setActiveTab('manual');
  };

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <style>{`
        .color-range { -webkit-appearance: none; width: 100%; height: 12px; border-radius: 6px; outline: none; cursor: pointer; }
        .color-range::-webkit-slider-thumb { -webkit-appearance: none; width: 24px; height: 24px; background: #fff; border: 3px solid #333; border-radius: 50%; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2); transition: transform 0.1s; }
        .color-range::-webkit-slider-thumb:active { transform: scale(1.2); }
        .dark .color-range::-webkit-slider-thumb { background: #fff; border-color: #666; }
      `}</style>

      <div className="bg-white dark:bg-dark-lighter rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-3">
          <Pipette className="text-pink-500" size={32} />
          カラーピッカー
        </h2>

        <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl mb-10 max-w-sm">
           <button onClick={() => setActiveTab('manual')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'manual' ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 shadow-sm scale-[1.02]' : 'text-gray-500'}`}>調整</button>
           <button onClick={() => setActiveTab('image')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'image' ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 shadow-sm scale-[1.02]' : 'text-gray-500'}`}>スポイト</button>
        </div>

        {activeTab === 'manual' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
             <div className="space-y-8">
                <div 
                  className="w-full h-48 md:h-64 rounded-[2rem] shadow-2xl border-4 border-white dark:border-gray-700 relative overflow-hidden transition-all duration-300"
                  style={{ backgroundColor: hex }}
                >
                   <input type="color" value={hex} onChange={(e) => handleHexChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/5 text-white font-black text-xs md:text-sm uppercase tracking-widest">
                      Tap to select
                   </div>
                </div>

                <div className="space-y-6">
                   {[
                     { key: 'r', label: 'Red', color: 'text-red-500', grad: `linear-gradient(to right, rgb(0, ${rgb.g}, ${rgb.b}), rgb(255, ${rgb.g}, ${rgb.b}))` },
                     { key: 'g', label: 'Green', color: 'text-green-500', grad: `linear-gradient(to right, rgb(${rgb.r}, 0, ${rgb.b}), rgb(${rgb.r}, 255, ${rgb.b}))` },
                     { key: 'b', label: 'Blue', color: 'text-blue-500', grad: `linear-gradient(to right, rgb(${rgb.r}, ${rgb.g}, 0), rgb(${rgb.r}, ${rgb.g}, 255))` }
                   ].map(c => (
                    <div key={c.key} className="space-y-3">
                      <div className={`flex justify-between font-black text-xs uppercase ${c.color}`}>
                        <span>{c.label}</span>
                        <span className="font-mono">{rgb[c.key as 'r'|'g'|'b']}</span>
                      </div>
                      <input 
                        type="range" min="0" max="255" value={rgb[c.key as 'r'|'g'|'b']} 
                        onChange={(e) => handleRgbChange(c.key as 'r'|'g'|'b', Number(e.target.value))} 
                        className="color-range"
                        style={{ background: c.grad }}
                      />
                    </div>
                   ))}
                </div>
             </div>

             <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'HEX', value: hex.toUpperCase(), copy: hex },
                  { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, copy: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
                  { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, copy: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
                  { label: 'CMYK', value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`, copy: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)` }
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 flex justify-between items-center group">
                     <div className="flex-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="font-mono text-[16px] md:text-lg font-bold text-gray-800 dark:text-white break-all">{item.value}</p>
                     </div>
                     <button onClick={() => copyToClipboard(item.copy, item.label)} className={`p-3 rounded-xl transition-all ${copied === item.label ? 'bg-green-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-400 hover:text-pink-500 shadow-sm'}`}>
                        {copied === item.label ? <Check size={20} /> : <Copy size={20} />}
                     </button>
                  </div>
                ))}
             </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
             {!imageSrc ? (
               <label className="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-16 block text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative cursor-pointer group">
                 <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                 <div className="flex flex-col items-center justify-center gap-4">
                    <div className="p-6 bg-pink-100 dark:bg-pink-900/30 text-pink-500 rounded-full group-hover:scale-110 transition-transform"><ImageIcon size={40} /></div>
                    <div><p className="text-lg font-black text-gray-700 dark:text-gray-200">画像をアップロード</p><p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Click or Drag & Drop</p></div>
                 </div>
               </label>
             ) : (
               <div className="space-y-6">
                  <div className="flex justify-between items-center bg-pink-50 dark:bg-pink-900/20 p-4 rounded-2xl">
                     <p className="text-sm font-bold text-pink-700 dark:text-pink-300 flex items-center gap-2"><Pipette size={18} /> 画像の色をタップで抽出</p>
                     <button onClick={() => setImageSrc(null)} className="text-xs font-black text-pink-500 hover:underline uppercase tracking-wider">Change Image</button>
                  </div>
                  <div className="relative overflow-hidden rounded-[2.5rem] border-4 border-gray-100 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 cursor-crosshair">
                     <canvas ref={canvasRef} onClick={pickColor} className="max-w-full h-auto mx-auto block transition-opacity hover:opacity-90" />
                  </div>
               </div>
             )}
          </div>
        )}
      </div>

      {/* SEO Content Section */}
      <article className="mt-12 p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />オンラインカラーピッカーと色変換ガイド</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3">多機能なカラー選択ツール</h3>
               <p>
                  当サイトのカラーピッカーは、Web制作やグラフィックデザインに欠かせない「色」の管理をスマートにする無料ツールです。
                  スライダーによる微調整、画像からの色抽出(スポイト機能)、主要なカラーコード(HEX, RGB, HSL, CMYK)への即時変換に対応しています。
               </p>
               <ul className="list-disc list-inside mt-4 space-y-1">
                  <li>HEX（16進数）: CSSや画像編集ソフトで標準的な形式</li>
                  <li>RGB: Red, Green, Blueの3原色によるデジタル画面向け形式</li>
                  <li>HSL: 色相(Hue), 彩度(Saturation), 輝度(Lightness)による直感的な指定</li>
                  <li>CMYK: 印刷物(インク)のシミュレーションに役立つ形式</li>
               </ul>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3">画像からの色抽出（スポイト機能）</h3>
               <p>
                  「写真の中に使われている特定の色が知りたい」という時、スポイト機能を使えば画像をアップロードしてクリックするだけで、正確なカラーコードを抽出できます。
                  ロゴ作成や配色パレットの構築に最適です。
               </p>
               <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <p className="font-bold text-xs text-gray-400 uppercase mb-2">セキュリティとプライバシー</p>
                  <p className="text-xs">
                     アップロードされた画像データは、お使いのブラウザ内（クライアントサイド）のみで処理されます。
                     外部サーバーに送信されたり保存されたりすることはありませんので、機密性の高いデザイン素材も安心してご利用いただけます。
                  </p>
               </div>
            </div>
         </div>
      </article>
    </div>
  );
};

export default ColorPickerTool;
