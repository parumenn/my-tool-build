import React, { useState, useRef } from 'react';
import { ImageOff, Upload, Download, Trash2, CheckCircle } from 'lucide-react';

const ExifRemover: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [processedUrl, setProcessedUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setProcessedUrl('');
    }
  };

  const removeExif = () => {
    if (!file || !canvasRef.current) return;
    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Drawing the image to canvas discards all metadata (Exif)
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Convert back to blob/url (default PNG or JPEG)
        // JPEG quality 0.95 is usually good
        const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(type, 0.95);
        
        setProcessedUrl(dataUrl);
        setIsProcessing(false);
      }
    };
    img.src = preview;
  };

  const download = () => {
    if (!processedUrl) return;
    const link = document.createElement('a');
    link.href = processedUrl;
    link.download = `clean_${file?.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <ImageOff className="text-red-500" />
          Exif削除 (メタデータ除去)
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
           写真に含まれる位置情報(GPS)や撮影日時などのExif情報を削除し、プライバシーを保護します。<br/>
           ※処理はすべてブラウザ内で行われ、サーバーにはアップロードされません。
        </p>

        {!file ? (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-16 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative cursor-pointer group">
            <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <div className="flex flex-col items-center justify-center space-y-4">
               <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full group-hover:scale-110 transition-transform">
                  <Upload size={32} />
               </div>
               <p className="font-bold text-gray-700 dark:text-gray-300">画像をアップロード</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
             <div className="flex-1 space-y-4">
                <div className="relative rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
                   <img src={preview} alt="Original" className="w-full h-auto object-contain bg-gray-100 dark:bg-gray-800" />
                   <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">Original</div>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                   <span className="truncate max-w-[200px]">{file.name}</span>
                   <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>

                {!processedUrl ? (
                    <button 
                      onClick={removeExif} 
                      disabled={isProcessing}
                      className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200 dark:shadow-none flex items-center justify-center gap-2"
                    >
                       {isProcessing ? '処理中...' : 'Exif情報を削除する'}
                    </button>
                ) : (
                    <div className="space-y-4 animate-fade-in">
                       <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 text-green-700 dark:text-green-300">
                          <CheckCircle size={24} />
                          <div>
                             <p className="font-bold">削除完了！</p>
                             <p className="text-xs">位置情報などが削除されました</p>
                          </div>
                       </div>
                       <button 
                         onClick={download} 
                         className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-lg flex items-center justify-center gap-2"
                       >
                          <Download size={20} /> 保存する
                       </button>
                    </div>
                )}
                
                <button onClick={() => { setFile(null); setProcessedUrl(''); }} className="w-full py-2 text-gray-400 hover:text-red-500 text-sm flex items-center justify-center gap-1">
                   <Trash2 size={14} /> 別画像を選択
                </button>
             </div>
             
             {/* Hidden canvas */}
             <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ExifRemover;