import React, { useState, useRef } from 'react';
import { RefreshCwOff, Upload, Download, FileImage } from 'lucide-react';

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
          // ICO simulation: Resize to 32x32 for icon
          // For real .ico we need binary header, but often PNG named .ico works for web.
          // Let's create a 128x128 nice icon or just keep size? 
          // Standard favicon is square. Let's crop center square or just resize.
          // For this tool, let's just resize to 128x128 for a decent icon size
          const iconSize = 128;
          const iconCanvas = document.createElement('canvas');
          iconCanvas.width = iconSize;
          iconCanvas.height = iconSize;
          const iconCtx = iconCanvas.getContext('2d');
          if (iconCtx) {
              iconCtx.drawImage(image, 0, 0, iconSize, iconSize);
              dataUrl = iconCanvas.toDataURL('image/png'); // Save as PNG content
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <RefreshCwOff className="text-pink-500" />
          画像形式変換
        </h2>
        <p className="text-gray-500 mb-6">
          画像をPNG, JPEG, WEBP, ICO形式に変換します。※HEICはブラウザの制限によりサポートしていません。
        </p>

        {!image ? (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:bg-gray-50 transition-colors relative cursor-pointer">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-pink-50 text-pink-500 rounded-full">
                <Upload size={32} />
              </div>
              <div>
                <p className="font-bold text-gray-700">画像をアップロード</p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG, WEBP, GIF</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <div className="mb-6 flex items-center gap-3">
                  <FileImage size={24} className="text-gray-400"/>
                  <span className="font-bold text-gray-700 truncate">{fileName}</span>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700">変換先の形式</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['image/png', 'image/jpeg', 'image/webp', 'image/x-icon'].map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setFormat(fmt)}
                        className={`p-3 rounded-lg border text-sm font-bold transition-all ${
                          format === fmt
                            ? 'bg-pink-50 border-pink-500 text-pink-600'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
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
                  className="mt-8 w-full py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-bold shadow-lg shadow-pink-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                     <RefreshCwOff className="animate-spin" />
                  ) : (
                     <Download size={20} />
                  )}
                  {isProcessing ? '処理中...' : '変換してダウンロード'}
                </button>
                
                <button
                  onClick={() => setImage(null)}
                  className="mt-4 w-full text-sm text-gray-400 hover:text-red-500"
                >
                  キャンセル
                </button>
              </div>
            </div>

            <div className="flex-1 bg-gray-100 rounded-xl flex items-center justify-center p-4 border border-gray-200">
               <img 
                 src={image.src} 
                 alt="Preview" 
                 className="max-w-full max-h-[400px] object-contain shadow-lg rounded-lg"
               />
            </div>
            
            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageConverter;