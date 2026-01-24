import React, { useState } from 'react';
import { Palette, RefreshCw, Copy, Check } from 'lucide-react';

const ColorPalette: React.FC = () => {
  const [colors, setColors] = useState<string[]>(['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generatePalette = () => {
    const newColors = Array(5).fill(0).map(() => 
      '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
    );
    setColors(newColors);
  };

  const copyToClipboard = (color: string, index: number) => {
    navigator.clipboard.writeText(color);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
             <Palette className="text-indigo-500" />
             カラーパレット生成
           </h2>
           <button 
             onClick={generatePalette}
             className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
           >
             <RefreshCw size={18} /> ランダム生成
           </button>
        </div>

        <div className="h-64 flex rounded-2xl overflow-hidden shadow-xl ring-4 ring-gray-100 dark:ring-gray-700">
          {colors.map((color, index) => (
             <div 
               key={index} 
               style={{ backgroundColor: color }} 
               className="flex-1 flex flex-col items-center justify-end pb-8 group relative transition-all hover:flex-[1.5]"
             >
                <div className="bg-white/90 dark:bg-black/50 backdrop-blur-sm p-2 rounded-lg text-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                   <p className="font-mono font-bold text-gray-800 dark:text-white mb-2 uppercase">{color}</p>
                   <button 
                     onClick={() => copyToClipboard(color, index)}
                     className="text-xs bg-gray-900 text-white px-3 py-1 rounded-full flex items-center gap-1 mx-auto hover:bg-black"
                   >
                     {copiedIndex === index ? <Check size={12} /> : <Copy size={12} />}
                     {copiedIndex === index ? 'COPIED' : 'COPY'}
                   </button>
                </div>
             </div>
          ))}
        </div>
        
        <div className="mt-8 grid grid-cols-5 gap-4">
           {colors.map((color, index) => (
              <div key={index} className="text-center">
                 <div 
                    onClick={() => copyToClipboard(color, index)}
                    className="w-full h-12 rounded-lg mb-2 shadow-inner cursor-pointer active:scale-95 transition-transform" 
                    style={{ backgroundColor: color }}
                 ></div>
                 <p className="text-sm font-mono text-gray-500 dark:text-gray-400 uppercase">{color}</p>
              </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPalette;