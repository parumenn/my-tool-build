
import React, { useState, useRef, useEffect } from 'react';
import { Stamp, Upload, Download, Type, Image as ImageIcon, RotateCw, Info, ShieldCheck, Zap } from 'lucide-react';

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

    canvas.width = baseImage.width;
    canvas.height = baseImage.height;
    ctx.drawImage(baseImage, 0, 0);

    let x = 0, y = 0;
    const padding = Math.min(baseImage.width, baseImage.height) * 0.05;
    ctx.globalAlpha = opacity;

    if (watermarkType === 'text') {
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      const metrics = ctx.measureText(text);
      const w = metrics.width;
      const h = fontSize;

      switch (position) {
        case 'center': x = (canvas.width - w) / 2; y = canvas.height / 2; break;
        case 'tl': x = padding; y = padding + h/2; break;
        case 'tr': x = canvas.width - w - padding; y = padding + h/2; break;
        case 'bl': x = padding; y = canvas.height - padding - h/2; break;
        case 'br': x = canvas.width - w - padding; y = canvas.height - padding - h/2; break;
      }
      
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
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
       <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
             <Stamp className="text-sky-500" /> 画像透かし合成 (Watermark)
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="space-y-6 lg:col-span-1 h-full overflow-y-auto max-h-[600px] pr-2 no-scrollbar">
                <div className="space-y-2">
                   <label className="font-bold text-gray-700 dark:text-gray-300 block text-sm">ベース画像</label>
                   <label className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <Upload size={20} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">画像を選択...</span>
                      <input type="file" accept="image/*" onChange={handleBaseImage} className="hidden" />
                   </label>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                   <div className="flex bg-white dark:bg-gray-700 p-1 rounded-lg">
                      <button onClick={() => setWatermarkType('text')} className={`flex-1 py-1.5 rounded text-xs font-bold ${watermarkType === 'text' ? 'bg-sky-100 text-sky-700' : 'text-gray-500'}`}>テキスト</button>
                      <button onClick={() => setWatermarkType('image')} className={`flex-1 py-1.5 rounded text-xs font-bold ${watermarkType === 'image' ? 'bg-sky-100 text-sky-700' : 'text-gray-500'}`}>画像ロゴ</button>
                   </div>

                   {watermarkType === 'text' ? (
                      <>
                        <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                        <div className="flex gap-2">
                           <input type="number" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-20 p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                           <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10 w-full cursor-pointer rounded overflow-hidden" />
                        </div>
                      </>
                   ) : (
                      <label className="flex items-center gap-2 p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer">
                         <ImageIcon size={20} className="text-gray-400" />
                         <span className="text-sm text-gray-600 dark:text-gray-400 truncate">透かし用画像を選択</span>
                         <input type="file" accept="image/*" onChange={handleWmImage} className="hidden" />
                      </label>
                   )}

                   <div>
                      <div className="flex justify-between mb-1"><label className="text-xs font-bold text-gray-500">透明度</label><span className="text-xs font-mono">{opacity}</span></div>
                      <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={e => setOpacity(Number(e.target.value))} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="font-bold text-gray-700 dark:text-gray-300 block text-sm text-center">配置位置</label>
                   <div className="grid grid-cols-3 gap-2 w-32 mx-auto">
                      <button onClick={() => setPosition('tl')} className={`p-2 border rounded font-bold ${position === 'tl' ? 'bg-sky-500 text-white border-sky-600' : 'bg-white dark:bg-gray-800'}`}>↖</button>
                      <div className="p-2 border rounded opacity-10"></div>
                      <button onClick={() => setPosition('tr')} className={`p-2 border rounded font-bold ${position === 'tr' ? 'bg-sky-500 text-white border-sky-600' : 'bg-white dark:bg-gray-800'}`}>↗</button>
                      <div className="p-2 border rounded opacity-10"></div>
                      <button onClick={() => setPosition('center')} className={`p-2 border rounded font-bold ${position === 'center' ? 'bg-sky-500 text-white border-sky-600' : 'bg-white dark:bg-gray-800'}`}>●</button>
                      <div className="p-2 border rounded opacity-10"></div>
                      <button onClick={() => setPosition('bl')} className={`p-2 border rounded font-bold ${position === 'bl' ? 'bg-sky-500 text-white border-sky-600' : 'bg-white dark:bg-gray-800'}`}>↙</button>
                      <div className="p-2 border rounded opacity-10"></div>
                      <button onClick={() => setPosition('br')} className={`p-2 border rounded font-bold ${position === 'br' ? 'bg-sky-500 text-white border-sky-600' : 'bg-white dark:bg-gray-800'}`}>↘</button>
                   </div>
                </div>

                <button onClick={download} disabled={!baseImage} className="w-full py-3 bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-200 dark:shadow-none hover:bg-sky-700 transition-colors disabled:opacity-50">
                   <Download className="inline mr-2" /> 加工した画像を保存
                </button>
             </div>

             <div className="lg:col-span-2 bg-gray-50 dark:bg-black/50 rounded-xl flex items-center justify-center p-4 border border-gray-200 dark:border-gray-800 min-h-[400px]">
                {baseImage ? (
                   <canvas ref={canvasRef} className="max-w-full h-auto object-contain shadow-2xl rounded-lg" />
                ) : (
                   <div className="text-gray-400 text-center animate-pulse">
                      <Upload size={48} className="mx-auto mb-2 opacity-30" />
                      <p className="font-bold">画像をアップロードして開始</p>
                   </div>
                )}
             </div>
          </div>
       </div>

       <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />画像透かし（ウォーターマーク）の活用と効果</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-sky-500" />著作権の保護とブランド表示</h3>
               <p>ブログやSNSに投稿する写真に自分の名前やロゴを入れることで、無断転載を抑制し、オリジナリティを主張できます。当ツールでは、文字（テキスト）だけでなく、お手持ちのロゴ画像（PNG等）を合成することも可能です。透明度を調整することで、写真の美しさを損なわずに自然な透かしを入れられます。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-sky-500" />ブラウザ内完結のプライベート処理</h3>
               <p>多くのWebサービスは画像をサーバーに送信して処理しますが、当サイトはブラウザ上のCanvas機能を使って直接描画します。アップロードした写真やロゴデータが外部に送信・保存されることは一切ありません。機密性の高いデザイン案やプライベートなスナップ写真も安全に加工できます。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default ImageWatermarker;
