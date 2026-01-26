
import React, { useState, useRef } from 'react';
import { RefreshCw, Upload, Download, FileImage, Info, ShieldCheck, Zap } from 'lucide-react';

const ImageConverter: React.FC = () => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [format, setFormat] = useState<string>('image/png');
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name.split('.')[0]);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => setImage(img);
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const convertAndDownload = () => {
    if (!image || !canvasRef.current) return;
    setIsProcessing(true);

    setTimeout(() => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        let dataUrl: string;
        let downloadName: string;

        if (format === 'image/x-icon') {
          const iconSize = 128;
          const iconCanvas = document.createElement('canvas');
          iconCanvas.width = iconSize;
          iconCanvas.height = iconSize;
          const iconCtx = iconCanvas.getContext('2d');
          if (iconCtx) {
              iconCtx.drawImage(image, 0, 0, iconSize, iconSize);
              dataUrl = iconCanvas.toDataURL('image/png');
          } else {
             dataUrl = canvas.toDataURL('image/png');
          }
          downloadName = `${fileName}.ico`;
        } else {
          dataUrl = canvas.toDataURL(format, 0.9);
          const ext = format.split('/')[1];
          downloadName = `${fileName}.${ext}`;
        }

        const link = document.createElement('a');
        link.download = downloadName;
        link.href = dataUrl;
        link.click();
        setIsProcessing(false);
      }
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <RefreshCw className="text-pink-500" />
          画像形式変換
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          画像をPNG, JPEG, WEBP, ICO形式に変換します。※処理はブラウザ内で高速に行われます。
        </p>

        {!image ? (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative cursor-pointer">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-pink-50 dark:bg-pink-900/30 text-pink-500 rounded-full">
                <Upload size={32} />
              </div>
              <div>
                <p className="font-bold text-gray-700 dark:text-gray-200">画像をアップロード</p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG, WEBP, GIF</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="mb-6 flex items-center gap-3">
                  <FileImage size={24} className="text-gray-400"/>
                  <span className="font-bold text-gray-700 dark:text-gray-200 truncate">{fileName}</span>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">変換先の形式</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['image/png', 'image/jpeg', 'image/webp', 'image/x-icon'].map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setFormat(fmt)}
                        className={`p-3 rounded-lg border text-sm font-bold transition-all ${
                          format === fmt
                            ? 'bg-pink-50 dark:bg-pink-900/30 border-pink-500 text-pink-600'
                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {fmt === 'image/x-icon' ? 'ICO (Icon)' : fmt.split('/')[1].toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={convertAndDownload}
                  disabled={isProcessing}
                  className="mt-8 w-full py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-bold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isProcessing ? <RefreshCw className="animate-spin" /> : <Download size={20} />}
                  {isProcessing ? '処理中...' : '変換してダウンロード'}
                </button>
                
                <button onClick={() => setImage(null)} className="mt-4 w-full text-sm text-gray-400 hover:text-red-500">キャンセル</button>
              </div>
            </div>
            <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center p-4 border border-gray-200 dark:border-gray-800">
               <img src={image.src} alt="Preview" className="max-w-full max-h-[400px] object-contain shadow-lg rounded-lg" />
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />画像形式変換ツールの便利な使い方</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-pink-500" />Web最適化にWEBP変換</h3>
               <p>PNGやJPEG画像を次世代フォーマット「WEBP」に変換することで、画質を維持したままファイルサイズを大幅に削減できます。これによりWebサイトの表示速度が向上し、SEO効果やデータ通信量の節約に繋がります。また、ICO形式への変換は、サイトのアイコン（ファビコン）作成に最適です。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-pink-500" />サーバーを介さない安全な変換</h3>
               <p>一般的なオンライン変換サービスとは異なり、当ツールはブラウザのCanvas機能を使用して変換を行います。画像が当サイトのサーバーにアップロードされることは決してありません。プライベートな写真や機密性の高いデザインデータも、安心して処理いただけます。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default ImageConverter;
