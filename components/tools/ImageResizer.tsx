
import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Download, Upload, Trash2, AlertTriangle, Info, ShieldCheck, Zap } from 'lucide-react';

const ImageResizer: React.FC = () => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [keepRatio, setKeepRatio] = useState<boolean>(true);
  const [ratio, setRatio] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const MAX_FILE_SIZE = 20 * 1024 * 1024;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`ファイルサイズが大きすぎます。${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB以下の画像を選択してください。`);
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('画像ファイルのみアップロード可能です。');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setWidth(img.width);
          setHeight(img.height);
          setRatio(img.width / img.height);
        };
        img.onerror = () => {
            setError('画像の読み込みに失敗しました。ファイルが破損している可能性があります。');
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const w = parseInt(e.target.value) || 0;
    setWidth(w);
    if (keepRatio) setHeight(Math.round(w / ratio));
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = parseInt(e.target.value) || 0;
    setHeight(h);
    if (keepRatio) setWidth(Math.round(h * ratio));
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'resized-image.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  useEffect(() => {
    if (image && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = width;
        canvas.height = height;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(image, 0, 0, width, height);
      }
    }
  }, [width, height, image]);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <ImageIcon className="text-purple-500" />
          画像リサイズ
        </h2>
        
        {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-4 rounded-xl flex items-center gap-2 animate-fade-in">
                <AlertTriangle size={20} />
                <span>{error}</span>
            </div>
        )}

        {!image ? (
          <div className="border-4 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-16 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative cursor-pointer bg-gray-50/50 dark:bg-gray-800/30">
            <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-5 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 rounded-full shadow-sm"><Upload size={40} /></div>
              <div>
                <p className="font-extrabold text-xl text-gray-800 dark:text-white">画像をアップロード</p>
                <p className="text-base text-gray-600 dark:text-gray-400 mt-2 font-medium">クリックまたはドラッグ＆ドロップ</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-600 pb-2">サイズ設定</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-2">幅 (px)</label>
                    <input type="number" value={width} onChange={handleWidthChange} className="block w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 p-3 text-lg font-bold text-gray-900 dark:text-white focus:border-purple-500 bg-white dark:bg-gray-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-2">高さ (px)</label>
                    <input type="number" value={height} onChange={handleHeightChange} className="block w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 p-3 text-lg font-bold text-gray-900 dark:text-white focus:border-purple-500 bg-white dark:bg-gray-700" />
                  </div>
                  <div className="flex items-center gap-2 pt-2 bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                    <input type="checkbox" id="ratio" checked={keepRatio} onChange={(e) => setKeepRatio(e.target.checked)} className="w-5 h-5 rounded text-purple-600 border-gray-300" />
                    <label htmlFor="ratio" className="text-base font-bold text-gray-800 dark:text-white cursor-pointer">アスペクト比を固定</label>
                  </div>
                </div>
                <button onClick={downloadImage} className="mt-8 w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-4 rounded-xl hover:bg-purple-700 transition-colors font-bold text-lg shadow-lg shadow-purple-200 dark:shadow-none"><Download size={20} />画像を保存</button>
                <button onClick={() => setImage(null)} className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-red-600 transition-colors py-2"><Trash2 size={16} />別画像を選択</button>
              </div>
            </div>
            <div className="flex flex-col items-center justify-start space-y-4 bg-gray-100 dark:bg-gray-900 p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
              <div className="w-full flex justify-between text-sm font-bold text-gray-600 dark:text-gray-400 px-2"><span>プレビュー</span><span>{width} x {height} px</span></div>
              <div className="w-full flex-1 flex items-center justify-center bg-white/50 dark:bg-white/5 rounded-lg p-2 min-h-[300px]"><canvas ref={canvasRef} className="max-w-full h-auto shadow-xl bg-white pattern-grid" style={{ maxHeight: '400px' }} /></div>
            </div>
          </div>
        )}
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />画像リサイズツールの特徴と活用法</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-purple-500" />プライバシーに配慮した設計</h3>
               <p>当ツールの画像処理はすべて、お客様がお使いのデバイス内（Webブラウザ上）で完結します。画像が当サイトのサーバーに送信・保存されることは一切ありません。機密文書の図解やプライベートな写真でも安心して加工いただけます。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-purple-500" />ブログやSNSの最適化に</h3>
               <p>高画質なスマホ写真（数MB以上）をそのままWebサイトに掲載すると、読み込み速度の低下を招きます。アスペクト比を維持したまま適切なピクセル数（例: 横幅800px〜1200px）に縮小することで、SEOに強い軽量なページ作成をサポートします。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default ImageResizer;
