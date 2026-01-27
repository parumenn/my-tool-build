
import React, { useState } from 'react';
import { Download, Link as LinkIcon, RefreshCw, Info, ShieldCheck, Zap } from 'lucide-react';
import AdBanner from '../AdBanner';

const QRCodeGenerator: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [qrSize, setQrSize] = useState<number>(256);
  const [generatedUrl, setGeneratedUrl] = useState<string>('');

  const handleGenerate = () => {
    if (!url) return;
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(url)}`;
    setGeneratedUrl(apiUrl);
  };

  const handleDownload = async () => {
    if (!generatedUrl) return;
    try {
      const response = await fetch(generatedUrl);
      const blob = await response.blob();
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = 'qrcode.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      alert('ダウンロードに失敗しました。');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="bg-white dark:bg-dark-lighter rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
        <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-2 flex items-center gap-3">
          <LinkIcon className="text-blue-500" size={32} />
          URL QRコード生成
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-10 font-medium">お好きなURLを即座に高画質なQRコードへ変換します。</p>

        <div className="space-y-8">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">ターゲットURL</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 block w-full rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 text-gray-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-all font-bold text-lg"
              />
              <button
                onClick={handleGenerate}
                disabled={!url}
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl hover:bg-blue-700 disabled:opacity-30 transition-all font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-200 dark:shadow-none active:scale-95"
              >
                <RefreshCw size={20} />
                作成する
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
               <label className="text-xs font-black text-gray-400 uppercase tracking-widest">画像サイズ: {qrSize}px</label>
               <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">High Quality</span>
            </div>
            <input
              type="range"
              min="100"
              max="1000"
              step="10"
              value={qrSize}
              onChange={(e) => setQrSize(Number(e.target.value))}
              className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </div>

      {generatedUrl && (
        <div className="bg-white dark:bg-dark-lighter rounded-[2.5rem] p-10 shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center animate-fade-in text-center">
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-8">
            <img src={generatedUrl} alt="Generated QR Code" className="block mx-auto" width={200} height={200} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 font-medium truncate max-w-xs">{url}</p>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl hover:opacity-90 transition-all shadow-xl font-black text-lg"
          >
            <Download size={20} />
            画像を保存 (PNG)
          </button>
        </div>
      )}

      {/* SEO Content Section */}
      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6">
            <Info className="text-blue-500" />
            無料QRコード生成ツールの特徴と安全性について
         </h2>
         <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
               <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold">
                  <ShieldCheck size={18} /> <span>個人情報保護</span>
               </div>
               <p className="text-xs leading-relaxed text-gray-500">
                  入力されたURLデータは、QRコード生成APIを介して一時的に処理されますが、当サイトのサーバーには一切保存されません。履歴も残らないため安心してご利用いただけます。
               </p>
            </div>
            <div className="space-y-3">
               <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold">
                  <Zap size={18} /> <span>瞬時に生成</span>
               </div>
               <p className="text-xs leading-relaxed text-gray-500">
                  「作成する」ボタンを押した瞬間に高精細なQRコードが生成されます。スマホでの操作にも最適化されており、チラシや名刺用の高解像度（最大1000px）にも対応しています。
               </p>
            </div>
            <div className="space-y-3">
               <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold">
                  <RefreshCw size={18} /> <span>有効期限なし</span>
               </div>
               <p className="text-xs leading-relaxed text-gray-500">
                  生成されたQRコードに有効期限はありません。URLが生きている限り、永久にスキャン可能です。商用・個人利用問わず、完全無料で枚数制限なく作成できます。
               </p>
            </div>
         </div>
      </article>
      <AdBanner />
    </div>
  );
};

export default QRCodeGenerator;
