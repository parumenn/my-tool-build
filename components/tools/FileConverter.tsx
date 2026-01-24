import React, { useState } from 'react';
import { Upload, FileText, Copy, Check, Download, ArrowRight, AlertTriangle } from 'lucide-react';

const FileConverter: React.FC = () => {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  
  // Encode State
  const [base64, setBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Decode State
  const [inputBase64, setInputBase64] = useState<string>('');
  const [decodedFileName, setDecodedFileName] = useState<string>('downloaded_file');
  const [decodedFileExtension, setDecodedFileExtension] = useState<string>('');

  // Limit: 10MB (Base64 encoding increases size by ~33%, potentially freezing UI on large files)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
         setError(`ファイルが大きすぎます（最大10MB）。ブラウザのクラッシュを防ぐため、小さいファイルを選択してください。`);
         return;
      }

      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setBase64(result);
      };
      reader.onerror = () => {
          setError('ファイルの読み込み中にエラーが発生しました。');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(base64);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDecode = () => {
    try {
      if (!inputBase64) return;
      
      // Determine file extension if Data URI
      let extension = '';
      let data = inputBase64;

      if (inputBase64.includes('data:')) {
        const mime = inputBase64.split(';')[0].split(':')[1];
        data = inputBase64.split(',')[1];
        if (mime) {
           const mimeMap: {[key: string]: string} = {
             'image/png': '.png', 'image/jpeg': '.jpg', 'application/pdf': '.pdf', 'text/plain': '.txt'
           };
           extension = mimeMap[mime] || '';
        }
      }

      // Convert Base64 to Blob
      const byteCharacters = atob(data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);

      // Download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = decodedFileName + (extension || decodedFileExtension);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('変換に失敗しました。Base64文字列が正しいか確認してください。');
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl w-fit mx-auto mb-6">
        <button
          onClick={() => setMode('encode')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            mode === 'encode' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          送信 (File to Base64)
        </button>
        <button
          onClick={() => setMode('decode')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            mode === 'decode' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          受信 (Base64 to File)
        </button>
      </div>

      {mode === 'encode' ? (
        <>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Upload className="text-orange-500" />
              ファイルをBase64に変換
            </h2>
            <p className="text-gray-500 mb-6">
              サーバーを使わずにファイルをテキストデータ(Base64)に変換します。
            </p>

            {error && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm font-bold">
                    <AlertTriangle size={18} /> {error}
                </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative cursor-pointer group">
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-4 bg-orange-50 text-orange-500 rounded-full group-hover:scale-110 transition-transform">
                  <Upload size={32} />
                </div>
                <div className="text-gray-600 font-medium">
                  {fileName ? fileName : 'クリックしてファイルを選択'}
                </div>
                {!fileName && <div className="text-sm text-gray-400">またはドラッグ＆ドロップ (最大 10MB)</div>}
              </div>
            </div>
          </div>

          {base64 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700">変換結果 (Data URI)</h3>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'コピーしました' : 'クリップボードにコピー'}
                </button>
              </div>
              <div className="relative">
                <textarea
                  readOnly
                  value={base64}
                  className="w-full h-64 p-4 text-xs font-mono bg-slate-800 text-green-400 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-fade-in">
           <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Download className="text-orange-500" />
              Base64をファイルに復元
            </h2>
            <p className="text-gray-500 mb-6">
              共有されたBase64コードを貼り付けて、元のファイルとしてダウンロードします。
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Base64テキスト</label>
                <textarea
                  value={inputBase64}
                  onChange={(e) => setInputBase64(e.target.value)}
                  placeholder="data:image/png;base64,..."
                  className="w-full h-48 p-4 text-xs font-mono border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50"
                />
              </div>
              
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                   <label className="block text-sm font-bold text-gray-700 mb-2">保存ファイル名 (拡張子不要)</label>
                   <input 
                     type="text"
                     value={decodedFileName}
                     onChange={(e) => setDecodedFileName(e.target.value)}
                     className="w-full p-3 border-2 border-gray-300 rounded-lg"
                   />
                </div>
                <div className="w-24">
                   <label className="block text-sm font-bold text-gray-700 mb-2">拡張子</label>
                   <input 
                     type="text"
                     placeholder=".png"
                     value={decodedFileExtension}
                     onChange={(e) => setDecodedFileExtension(e.target.value)}
                     className="w-full p-3 border-2 border-gray-300 rounded-lg"
                   />
                </div>
              </div>
              <p className="text-xs text-gray-500">※DataURI形式(data:...)の場合、拡張子は自動判別される場合があります。</p>

              <button
                onClick={handleDecode}
                disabled={!inputBase64}
                className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-200 transition-all"
              >
                <FileText size={20} />
                ファイルを復元・ダウンロード
              </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default FileConverter;