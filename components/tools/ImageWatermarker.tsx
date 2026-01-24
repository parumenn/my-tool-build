import React, { useState, useRef, useEffect } from 'react';
import { Stamp, Upload, Download, Type, Image as ImageIcon, RotateCw } from 'lucide-react';

const ImageWatermarker: React.FC = () => {
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  
  // Text Options
  const [text, setText] = useState('Sample Watermark');
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('#ffffff');
  const [opacity, setOpacity] = useState(0.5);
  
  // Image Options
  const [wmImage, setWmImage] = useState<HTMLImageElement | null>(null);
  const [wmScale, setWmScale] = useState(0.3);

  // Position
  const [position, setPosition] = useState<'center' | 'br' | 'bl' | 'tr' | 'tl'>('br');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleBaseImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const img = new Image();
      img.onload = () => setBaseImage(img);
      img.src = URL.createObjectURL(file);
    }
  };

  const handleWmImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const img = new Image();
      img.onload = () => setWmImage(img);
      img.src = URL.createObjectURL(file);
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = baseImage.width;
    canvas.height = baseImage.height;

    // Draw base image
    ctx.drawImage(baseImage, 0, 0);

    // Common positioning logic
    let x = 0, y = 0;
    const padding = Math.min(baseImage.width, baseImage.height) * 0.05;

    ctx.globalAlpha = opacity;

    if (watermarkType === 'text') {
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      const metrics = ctx.measureText(text);
      const w = metrics.width;
      const h = fontSize; // approximate

      switch (position) {
        case 'center': x = (canvas.width - w) / 2; y = canvas.height / 2; break;
        case 'tl': x = padding; y = padding + h/2; break;
        case 'tr': x = canvas.width - w - padding; y = padding + h/2; break;
        case 'bl': x = padding; y = canvas.height - padding - h/2; break;
        case 'br': x = canvas.width - w - padding; y = canvas.height - padding - h/2; break;
      }
      
      // Shadow for better visibility
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.fillText(text, x, y);

    } else if (watermarkType === 'image' && wmImage) {
       const w = wmImage.width * wmScale;
       const h = wmImage.height * wmScale;

       switch (position) {
        case 'center': x = (canvas.width - w) / 2; y = (canvas.height - h) / 2; break;
        case 'tl': x = padding; y = padding; break;
        case 'tr': x = canvas.width - w - padding; y = padding; break;
        case 'bl': x = padding; y = canvas.height - h - padding; break;
        case 'br': x = canvas.width - w - padding; y = canvas.height - h - padding; break;
      }
      ctx.drawImage(wmImage, x, y, w, h);
    }
  };

  useEffect(() => {
    if (baseImage) draw();
  }, [baseImage, watermarkType, text, fontSize, color, opacity, wmImage, wmScale, position]);

  const download = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'watermarked.png';
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
       <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
             <Stamp className="text-sky-500" /> 画像透かし合成
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Controls */}
             <div className="space-y-6 lg:col-span-1 h-full overflow-y-auto max-h-[600px] pr-2">
                <div className="space-y-2">
                   <label className="font-bold text-gray-700 dark:text-gray-300 block">ベース画像</label>
                   <label className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <Upload size={20} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">画像を選択...</span>
                      <input type="file" accept="image/*" onChange={handleBaseImage} className="hidden" />
                   </label>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                   <div className="flex bg-white dark:bg-gray-700 p-1 rounded-lg">
                      <button onClick={() => setWatermarkType('text')} className={`flex-1 py-1.5 rounded text-sm font-bold ${watermarkType === 'text' ? 'bg-sky-100 text-sky-700' : 'text-gray-500'}`}>テキスト</button>
                      <button onClick={() => setWatermarkType('image')} className={`flex-1 py-1.5 rounded text-sm font-bold ${watermarkType === 'image' ? 'bg-sky-100 text-sky-700' : 'text-gray-500'}`}>画像</button>
                   </div>

                   {watermarkType === 'text' ? (
                      <>
                        <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                        <div className="flex gap-2">
                           <input type="number" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-20 p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                           <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10 w-full cursor-pointer" />
                        </div>
                      </>
                   ) : (
                      <label className="flex items-center gap-2 p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer">
                         <ImageIcon size={20} className="text-gray-400" />
                         <span className="text-sm text-gray-600 dark:text-gray-400">透かし画像を選択</span>
                         <input type="file" accept="image/*" onChange={handleWmImage} className="hidden" />
                      </label>
                   )}

                   <div>
                      <label className="text-xs font-bold text-gray-500 mb-1 block">透明度</label>
                      <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={e => setOpacity(Number(e.target.value))} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
                   </div>
                   
                   {watermarkType === 'image' && (
                      <div>
                         <label className="text-xs font-bold text-gray-500 mb-1 block">サイズ比率</label>
                         <input type="range" min="0.1" max="2" step="0.1" value={wmScale} onChange={e => setWmScale(Number(e.target.value))} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
                      </div>
                   )}
                </div>

                <div className="space-y-2">
                   <label className="font-bold text-gray-700 dark:text-gray-300 block">配置</label>
                   <div className="grid grid-cols-3 gap-2 w-32 mx-auto">
                      <button onClick={() => setPosition('tl')} className={`p-2 border rounded ${position === 'tl' ? 'bg-sky-500 text-white' : 'bg-gray-100'}`}>↖</button>
                      <div className="p-2 border rounded bg-gray-50 opacity-50"></div>
                      <button onClick={() => setPosition('tr')} className={`p-2 border rounded ${position === 'tr' ? 'bg-sky-500 text-white' : 'bg-gray-100'}`}>↗</button>
                      <div className="p-2 border rounded bg-gray-50 opacity-50"></div>
                      <button onClick={() => setPosition('center')} className={`p-2 border rounded ${position === 'center' ? 'bg-sky-500 text-white' : 'bg-gray-100'}`}>●</button>
                      <div className="p-2 border rounded bg-gray-50 opacity-50"></div>
                      <button onClick={() => setPosition('bl')} className={`p-2 border rounded ${position === 'bl' ? 'bg-sky-500 text-white' : 'bg-gray-100'}`}>↙</button>
                      <div className="p-2 border rounded bg-gray-50 opacity-50"></div>
                      <button onClick={() => setPosition('br')} className={`p-2 border rounded ${position === 'br' ? 'bg-sky-500 text-white' : 'bg-gray-100'}`}>↘</button>
                   </div>
                </div>

                <button onClick={download} disabled={!baseImage} className="w-full py-3 bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-200 dark:shadow-none hover:bg-sky-700 transition-colors disabled:opacity-50">
                   <Download className="inline mr-2" /> 保存
                </button>
             </div>

             {/* Preview */}
             <div className="lg:col-span-2 bg-gray-100 dark:bg-black/50 rounded-xl flex items-center justify-center p-4 border border-gray-200 dark:border-gray-800 min-h-[400px]">
                {baseImage ? (
                   <canvas ref={canvasRef} className="max-w-full max-h-[600px] object-contain shadow-2xl" />
                ) : (
                   <div className="text-gray-400 text-center">
                      <Upload size={48} className="mx-auto mb-2 opacity-50" />
                      <p>画像を読み込んでください</p>
                   </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );
};

export default ImageWatermarker;