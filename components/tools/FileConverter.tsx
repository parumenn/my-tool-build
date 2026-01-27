
import React, { useState } from 'react';
import { Upload, FileText, Copy, Check, Download, ArrowRight, AlertTriangle, Info, ShieldCheck, Code } from 'lucide-react';
import AdBanner from '../AdBanner';

const FileConverter: React.FC = () => {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [base64, setBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [inputBase64, setInputBase64] = useState<string>('');
  const [decodedFileName, setDecodedFileName] = useState<string>('downloaded_file');
  const [decodedFileExtension, setDecodedFileExtension] = useState<string>('');

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
         setError(`ファイルが大きすぎます（最大10MB）。`);
         return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setBase64(reader.result as string);
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
      let extension = '';
      let data = inputBase64;
      if (inputBase64.includes('data:')) {
        const mime = inputBase64.split(';')[0].split(':')[1];
        data = inputBase64.split(',')[1];
        const mimeMap: {[key: string]: string} = { 'image/png': '.png', 'image/jpeg': '.jpg', 'application/pdf': '.pdf', 'text/plain': '.txt' };
        extension = mimeMap[mime] || '';
      }
      const byteCharacters = atob(data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([byteArray]));
      link.download = decodedFileName + (extension || decodedFileExtension);
      link.click();
    } catch (e) {
      alert('変換に失敗しました。Base64文字列を確認してください。');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl w-full max-w-md mx-auto">
        <button onClick={() => setMode('encode')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${mode === 'encode' ? 'bg-white dark:bg-gray-700 text-orange-600 shadow-md' : 'text-gray-500'}`}>送信 (File ➔ B64)</button>
        <button onClick={() => setMode('decode')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${mode === 'decode' ? 'bg-white dark:bg-gray-700 text-orange-600 shadow-md' : 'text-gray-500'}`}>受信 (B64 ➔ File)</button>
      </div>

      {mode === 'encode' ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-dark-lighter rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white mb-2 flex items-center gap-2"><Upload className="text-orange-500" />ファイルを変換</h2>
            <p className="text-xs text-gray-500 mb-6">ファイルを共有用のテキストコード(Base64)に変換します。</p>
            {error && <div className="mb-4 bg-red-50 dark:bg-red-900/30 text-red-600 p-4 rounded-xl flex items-center gap-2 text-sm font-bold"><AlertTriangle size={18} /> {error}</div>}
            <label className="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-10 block text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative cursor-pointer group">
              <input type="file" onChange={handleFileChange} className="hidden" />
              <div className="flex flex-col items-center gap-4">
                <div className="p-5 bg-orange-100 dark:bg-orange-900/30 text-orange-500 rounded-full group-hover:scale-110 transition-transform"><Upload size={32} /></div>
                <div className="font-black text-gray-700 dark:text-gray-200">{fileName || 'ファイルを選択'}</div>
                {!fileName && <div className="text-[10px] text-gray-400 uppercase tracking-widest">Max 10MB</div>}
              </div>
            </label>
          </div>
          {base64 && (
            <div className="bg-white dark:bg-dark-lighter rounded-3xl p-6 shadow-xl border border-orange-100 dark:border-orange-900/30 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-gray-700 dark:text-gray-200">生成されたコード</h3>
                <button onClick={handleCopy} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${copied ? 'bg-green-500 text-white' : 'bg-orange-600 text-white shadow-lg shadow-orange-200 dark:shadow-none'}`}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'コピー完了' : 'コピー'}</button>
              </div>
              <textarea readOnly value={base64} className="w-full h-48 md:h-64 p-4 text-[16px] font-mono bg-slate-900 text-green-400 border border-slate-700 rounded-2xl focus:outline-none" />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-lighter rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in space-y-6">
            <h2 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white mb-2 flex items-center gap-2"><Download className="text-orange-500" />コードを復元</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Base64テキストを貼り付け</label>
                <textarea value={inputBase64} onChange={(e) => setInputBase64(e.target.value)} placeholder="data:image/png;base64,..." className="w-full h-48 p-4 text-[16px] font-mono border-2 border-gray-100 dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-800 dark:text-white" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                   <label className="block text-xs font-black text-gray-400 mb-2">保存名</label>
                   <input type="text" value={decodedFileName} onChange={(e) => setDecodedFileName(e.target.value)} className="w-full p-3 border-2 border-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl text-[16px]" />
                </div>
                <div>
                   <label className="block text-xs font-black text-gray-400 mb-2">拡張子</label>
                   <input type="text" placeholder=".png" value={decodedFileExtension} onChange={(e) => setDecodedFileExtension(e.target.value)} className="w-full p-3 border-2 border-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl text-[16px]" />
                </div>
              </div>
              <button onClick={handleDecode} disabled={!inputBase64} className="w-full py-5 bg-orange-600 text-white font-black rounded-2xl hover:bg-orange-700 disabled:opacity-30 flex items-center justify-center gap-2 transition-all active:scale-95">
                <FileText size={24} /> 復元してダウンロード
              </button>
            </div>
        </div>
      )}

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />Base64変換の役割とメリット</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Code size={18} className="text-orange-500" />開発者・デザイナーの必須ツール</h3>
               <p>Base64は、バイナリデータ（画像やフォント）を64種類の英数字のみで構成されるテキスト形式に変換するエンコード方式です。HTMLやCSSの中に直接画像を埋め込む「Data URI Scheme」として活用することで、HTTPリクエスト数を減らしWebサイトの高速化に寄与します。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-orange-500" />セキュアなローカル処理</h3>
               <p>当ツールは、ブラウザのJavaScript機能のみを使用して変換を行います。ファイルをサーバーへアップロードする必要がないため、社内資料やプライベートな画像も安全に文字列化・復元が可能です。10MBまでのあらゆるファイル形式に対応しています。</p>
            </div>
         </div>
      </article>
      <AdBanner />
    </div>
  );
};

export default FileConverter;
