
import React, { useState, useEffect, useRef } from 'react';
import { Pipette, Copy, Check, Upload, Image as ImageIcon, Sliders, Palette } from 'lucide-react';

const ColorPickerTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'manual' | 'image'>('manual');
  const [hex, setHex] = useState<string>('#3b82f6');
  const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
  const [copied, setCopied] = useState<string | null>(null);

  // Image State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverColor, setHoverColor] = useState<string | null>(null);

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

    if (max === min) {
      h = s = 0;
    } else {
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
    
    c = (c - k) / (1 - k);
    m = (m - k) / (1 - k);
    y = (y - k) / (1 - k);
    
    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    };
  };

  // --- Handlers ---
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

  // --- Image Handling ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
    }
  };

  useEffect(() => {
    if (imageSrc && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        // Resize canvas to fit image (max width logic could be added here)
        // For simplicity, we limit display width via CSS but keep canvas resolution high or standardized
        // Let's keep native resolution but scale down visually
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
    // Calculate click position relative to canvas actual size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const newHex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    
    setHex(newHex);
    setRgb({ r: pixel[0], g: pixel[1], b: pixel[2] });
    setActiveTab('manual'); // Switch to manual to show details
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
    setHoverColor(rgbToHex(pixel[0], pixel[1], pixel[2]));
  };

  // --- Derived Values ---
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <Pipette className="text-pink-500" />
          カラーピッカー
        </h2>

        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-8">
           <button 
             onClick={() => setActiveTab('manual')}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${activeTab === 'manual' ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
           >
             <Sliders size={18} /> 色調整・変換
           </button>
           <button 
             onClick={() => setActiveTab('image')}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${activeTab === 'image' ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
           >
             <ImageIcon size={18} /> 画像から抽出 (スポイト)
           </button>
        </div>

        {activeTab === 'manual' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Left: Visual Picker */}
             <div className="space-y-6">
                <div 
                  className="w-full aspect-video rounded-2xl shadow-inner border border-gray-200 dark:border-gray-600 relative overflow-hidden group"
                  style={{ backgroundColor: hex }}
                >
                   <input 
                     type="color" 
                     value={hex}
                     onChange={(e) => handleHexChange(e.target.value)}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                   />
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 text-white font-bold">
                      クリックして色を変更
                   </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                   <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">R (Red)</label>
                      <input type="range" min="0" max="255" value={rgb.r} onChange={(e) => handleRgbChange('r', Number(e.target.value))} className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-500" />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">G (Green)</label>
                      <input type="range" min="0" max="255" value={rgb.g} onChange={(e) => handleRgbChange('g', Number(e.target.value))} className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-500" />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">B (Blue)</label>
                      <input type="range" min="0" max="255" value={rgb.b} onChange={(e) => handleRgbChange('b', Number(e.target.value))} className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                   </div>
                </div>
             </div>

             {/* Right: Values & Copy */}
             <div className="space-y-4">
                {/* HEX */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center group">
                   <div>
                      <div className="text-xs font-bold text-gray-400 uppercase mb-1">HEX</div>
                      <div className="font-mono text-xl font-bold text-gray-800 dark:text-white uppercase">{hex}</div>
                   </div>
                   <button 
                     onClick={() => copyToClipboard(hex, 'hex')} 
                     className="p-2 text-gray-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors"
                   >
                      {copied === 'hex' ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                   </button>
                </div>

                {/* RGB */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center group">
                   <div>
                      <div className="text-xs font-bold text-gray-400 uppercase mb-1">RGB</div>
                      <div className="font-mono text-xl font-bold text-gray-800 dark:text-white">rgb({rgb.r}, {rgb.g}, {rgb.b})</div>
                   </div>
                   <button 
                     onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'rgb')} 
                     className="p-2 text-gray-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors"
                   >
                      {copied === 'rgb' ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                   </button>
                </div>

                {/* HSL */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center group">
                   <div>
                      <div className="text-xs font-bold text-gray-400 uppercase mb-1">HSL</div>
                      <div className="font-mono text-xl font-bold text-gray-800 dark:text-white">hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</div>
                   </div>
                   <button 
                     onClick={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'hsl')} 
                     className="p-2 text-gray-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors"
                   >
                      {copied === 'hsl' ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                   </button>
                </div>

                {/* CMYK */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center group">
                   <div>
                      <div className="text-xs font-bold text-gray-400 uppercase mb-1">CMYK</div>
                      <div className="font-mono text-xl font-bold text-gray-800 dark:text-white">cmyk({cmyk.c}%, {cmyk.m}%, {cmyk.y}%, {cmyk.k}%)</div>
                   </div>
                   <button 
                     onClick={() => copyToClipboard(`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`, 'cmyk')} 
                     className="p-2 text-gray-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors"
                   >
                      {copied === 'cmyk' ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                   </button>
                </div>
             </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
             {!imageSrc ? (
               <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-16 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative cursor-pointer group">
                 <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                 <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 bg-pink-50 dark:bg-pink-900/30 text-pink-500 rounded-full group-hover:scale-110 transition-transform">
                       <Upload size={32} />
                    </div>
                    <div>
                       <p className="font-bold text-gray-700 dark:text-gray-300">画像をアップロード</p>
                       <p className="text-sm text-gray-500">クリックまたはドラッグ＆ドロップ</p>
                    </div>
                 </div>
               </div>
             ) : (
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Pipette size={16} /> 画像をクリックして色を抽出
                     </p>
                     <button onClick={() => setImageSrc(null)} className="text-xs text-red-500 font-bold hover:underline">
                        画像を削除
                     </button>
                  </div>
                  
                  <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 cursor-crosshair group">
                     <canvas 
                       ref={canvasRef} 
                       onClick={pickColor} 
                       onMouseMove={handleMouseMove}
                       onMouseLeave={() => setHoverColor(null)}
                       className="max-w-full h-auto mx-auto block"
                     />
                     {hoverColor && (
                        <div 
                           className="fixed pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4 px-3 py-1 rounded-lg shadow-lg font-mono font-bold text-white z-50 border-2 border-white"
                           style={{ 
                              backgroundColor: hoverColor,
                              // This simple positioning follows cursor if we tracked mouse globally, 
                              // but here we just show it fixed or top-right of container for simplicity.
                              // Let's actually put it absolute in container top-right.
                              position: 'absolute',
                              top: 10,
                              right: 10,
                              transform: 'none',
                              marginBottom: 0
                           }}
                        >
                           {hoverColor.toUpperCase()}
                        </div>
                     )}
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                     <Palette size={16} />
                     色をクリックすると、「色調整・変換」タブで詳細を確認・調整できます。
                  </div>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorPickerTool;
