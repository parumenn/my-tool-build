import React, { useState } from 'react';
import { Download, Link as LinkIcon, RefreshCw } from 'lucide-react';

const QRCodeGenerator: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [qrSize, setQrSize] = useState<number>(200);
  const [generatedUrl, setGeneratedUrl] = useState<string>('');

  const handleGenerate = () => {
    if (!url) return;
    // Using a reliable public API for QR generation for this demo
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
      console.error('Download failed', error);
      alert('ダウンロードに失敗しました。');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <LinkIcon className="text-blue-500" />
          URL QRコード生成
        </h2>
        <p className="text-gray-500 mb-6">URLを入力して、即座にQRコードを作成・ダウンロードできます。</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">対象URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 block w-full rounded-lg border-2 border-gray-300 bg-gray-50 p-3 text-gray-900 focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-all font-medium"
              />
              <button
                onClick={handleGenerate}
                disabled={!url}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
              >
                <RefreshCw size={18} />
                生成
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">サイズ: {qrSize}px</label>
            <input
              type="range"
              min="100"
              max="500"
              step="10"
              value={qrSize}
              onChange={(e) => setQrSize(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </div>

      {generatedUrl && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center animate-fade-in">
          <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 mb-6">
            <img src={generatedUrl} alt="QR Code" className="block" width={qrSize} height={qrSize} />
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 font-bold"
          >
            <Download size={18} />
            画像をダウンロード (PNG)
          </button>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;