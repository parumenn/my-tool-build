import React, { useState, useRef, useContext } from 'react';
import { FileText, Combine, Lock, RotateCw, Trash2, Download, Upload, Info, ShieldCheck, Zap, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import { WorkspaceContext } from '../WorkspaceContext';
import AdBanner from '../AdBanner';

const PdfTools: React.FC = () => {
  const isWorkspace = useContext(WorkspaceContext);
  const [activeTab, setActiveTab] = useState<'merge' | 'unlock' | 'rotate'>('merge');
  
  // States
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Merge State
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  
  // Unlock State
  const [unlockFile, setUnlockFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  
  // Rotate State
  const [rotateFile, setRotateFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState(90);

  // Helpers
  const downloadPdf = (bytes: Uint8Array, name: string) => {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Merge Handlers
  const handleMergeFiles = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let files: File[] = [];
    if ('files' in e.target && e.target.files) {
      files = Array.from(e.target.files);
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      e.preventDefault();
      files = Array.from(e.dataTransfer.files);
    }
    const pdfs = files.filter(f => f.type === 'application/pdf');
    setMergeFiles(prev => [...prev, ...pdfs]);
    setIsDragging(false);
  };

  const processMerge = async () => {
    if (mergeFiles.length < 2) return;
    setIsProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of mergeFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      downloadPdf(pdfBytes, 'merged_document.pdf');
    } catch (e) {
      alert('結合に失敗しました。ファイルが破損しているか、保護されている可能性があります。');
    } finally { setIsProcessing(false); }
  };

  // Unlock Handlers
  const handleUnlockFile = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null;
    if ('files' in e.target && e.target.files?.[0]) {
      file = e.target.files[0];
    } else if ('dataTransfer' in e && e.dataTransfer.files?.[0]) {
      e.preventDefault();
      file = e.dataTransfer.files[0];
    }
    if (file && file.type === 'application/pdf') {
        setUnlockFile(file);
    }
    setIsDragging(false);
  }

  const processUnlock = async () => {
    if (!unlockFile || !password) return;
    setIsProcessing(true);
    try {
      const arrayBuffer = await unlockFile.arrayBuffer();
      // Using 'as any' to suppress error because 'password' option is not strictly typed in all versions of pdf-lib LoadOptions
      const pdfDoc = await PDFDocument.load(arrayBuffer, { password } as any);
      const pdfBytes = await pdfDoc.save();
      downloadPdf(pdfBytes, `unlocked_${unlockFile.name}`);
      setUnlockFile(null);
      setPassword('');
    } catch (e) {
      alert('パスワードが正しくないか、処理に失敗しました。');
    } finally { setIsProcessing(false); }
  };

  // Rotate Handlers
  const handleRotateFile = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null;
    if ('files' in e.target && e.target.files?.[0]) {
      file = e.target.files[0];
    } else if ('dataTransfer' in e && e.dataTransfer.files?.[0]) {
      e.preventDefault();
      file = e.dataTransfer.files[0];
    }
    if (file && file.type === 'application/pdf') {
        setRotateFile(file);
    }
    setIsDragging(false);
  }

  const processRotate = async () => {
    if (!rotateFile) return;
    setIsProcessing(true);
    try {
      const arrayBuffer = await rotateFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      pages.forEach(page => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees(currentRotation + rotation));
      });
      const pdfBytes = await pdfDoc.save();
      downloadPdf(pdfBytes, `rotated_${rotateFile.name}`);
    } catch (e) {
      alert('回転処理に失敗しました。');
    } finally { setIsProcessing(false); }
  };

  return (
    <div className={`mx-auto h-full flex flex-col ${isWorkspace ? 'max-w-full p-2' : 'max-w-5xl space-y-10 pb-20'}`}>
       {!isWorkspace && (
         <div className="flex items-center gap-3 mb-2 shrink-0">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl">
               <FileText className="text-red-600 dark:text-red-400" size={32} />
            </div>
            <div>
               <h2 className="text-3xl font-black text-gray-800 dark:text-white">PDFツールボックス</h2>
               <p className="text-sm text-gray-500 font-medium">ブラウザ完結・サーバー保存なしで安全に編集</p>
            </div>
         </div>
       )}

       <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto no-scrollbar shrink-0">
          {[
             {id: 'merge', icon: Combine, label: '結合'},
             {id: 'unlock', icon: Lock, label: '保護解除'},
             {id: 'rotate', icon: RotateCw, label: '一括回転'}
          ].map(tab => (
             <button 
               key={tab.id} 
               onClick={() => { setActiveTab(tab.id as any); setIsDragging(false); }} 
               className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-black transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
             >
               <tab.icon size={16} /> {tab.label}
             </button>
          ))}
       </div>

       <div className={`bg-white dark:bg-dark-lighter rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col min-h-[450px] overflow-hidden ${isWorkspace ? 'p-4' : 'p-10'}`}>
          {/* MERGE TAB */}
          {activeTab === 'merge' && (
             <div className="space-y-6 animate-fade-in flex-1 flex flex-col max-w-2xl mx-auto w-full">
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleMergeFiles}
                  className={`border-4 border-dashed rounded-3xl p-10 text-center transition-all relative ${isDragging ? 'border-red-500 bg-red-50 dark:bg-red-900/20 scale-[0.98]' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                >
                   <input type="file" accept=".pdf" multiple onChange={handleMergeFiles} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                   <Combine size={48} className={`mx-auto mb-4 ${isDragging ? 'text-red-500 animate-bounce' : 'text-gray-300'}`} />
                   <p className="font-black text-lg text-gray-700 dark:text-gray-200">
                      {isDragging ? 'ここにドロップして追加' : 'PDFファイルを選択またはドラッグ'}
                   </p>
                   <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-widest">Multiple Files Supported</p>
                </div>

                {mergeFiles.length > 0 && (
                   <div className="space-y-4 animate-fade-in">
                      <div className="flex justify-between items-center px-2">
                         <span className="text-xs font-black text-gray-400 uppercase">{mergeFiles.length} ファイル選択中</span>
                         <button onClick={() => setMergeFiles([])} className="text-xs text-red-500 font-bold hover:underline">すべてクリア</button>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-1 no-scrollbar bg-gray-50 dark:bg-gray-900/50 p-2 rounded-2xl border border-gray-100 dark:border-gray-800">
                         {mergeFiles.map((f, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 group">
                               <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg text-red-500 font-bold text-[10px]">{i + 1}</div>
                                  <span className="text-xs font-bold truncate text-gray-700 dark:text-gray-200">{f.name}</span>
                               </div>
                               <button onClick={() => setMergeFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                            </div>
                         ))}
                      </div>
                      <button 
                        onClick={processMerge} 
                        disabled={isProcessing} 
                        className="w-full py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl hover:bg-red-700 hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                      >
                         {isProcessing ? <Loader2 className="animate-spin" /> : <Combine size={20} />} 
                         {isProcessing ? '結合処理中...' : 'PDFを結合してダウンロード'}
                      </button>
                   </div>
                )}
             </div>
          )}

          {/* UNLOCK TAB */}
          {activeTab === 'unlock' && (
             <div className="space-y-6 animate-fade-in flex-1 flex flex-col max-w-2xl mx-auto w-full">
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleUnlockFile}
                  className={`border-4 border-dashed rounded-3xl p-10 text-center transition-all relative ${isDragging ? 'border-red-500 bg-red-50 dark:bg-red-900/20 scale-[0.98]' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                >
                   <input type="file" accept=".pdf" onChange={handleUnlockFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                   <Lock size={48} className={`mx-auto mb-4 ${isDragging ? 'text-red-500 animate-bounce' : 'text-gray-300'}`} />
                   <p className="font-black text-lg text-gray-700 dark:text-gray-200">
                      {isDragging ? 'ここにドロップ' : '保護されたPDFを選択'}
                   </p>
                </div>

                {unlockFile && (
                   <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                         <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg text-red-500"><FileText size={20} /></div>
                         <span className="text-sm font-bold truncate flex-1 text-gray-700 dark:text-gray-200">{unlockFile.name}</span>
                         <button onClick={() => setUnlockFile(null)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                      </div>
                      
                      <div className="space-y-2">
                         <label className="text-xs font-black text-gray-400 uppercase tracking-widest">パスワード</label>
                         <input 
                           type="password" 
                           value={password} 
                           onChange={(e) => setPassword(e.target.value)} 
                           placeholder="パスワードを入力..." 
                           className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-bold outline-none focus:border-red-500 transition-colors"
                         />
                      </div>

                      <button 
                        onClick={processUnlock} 
                        disabled={isProcessing || !password} 
                        className="w-full py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl hover:bg-red-700 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 transition-all"
                      >
                         {isProcessing ? <Loader2 className="animate-spin" /> : <Lock size={20} />} 
                         {isProcessing ? '解除処理中...' : '保護を解除してダウンロード'}
                      </button>
                   </div>
                )}
             </div>
          )}

          {/* ROTATE TAB */}
          {activeTab === 'rotate' && (
             <div className="space-y-6 animate-fade-in flex-1 flex flex-col max-w-2xl mx-auto w-full">
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleRotateFile}
                  className={`border-4 border-dashed rounded-3xl p-10 text-center transition-all relative ${isDragging ? 'border-red-500 bg-red-50 dark:bg-red-900/20 scale-[0.98]' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                >
                   <input type="file" accept=".pdf" onChange={handleRotateFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                   <RotateCw size={48} className={`mx-auto mb-4 ${isDragging ? 'text-red-500 animate-bounce' : 'text-gray-300'}`} />
                   <p className="font-black text-lg text-gray-700 dark:text-gray-200">
                      {isDragging ? 'ここにドロップ' : 'PDFファイルを選択'}
                   </p>
                </div>

                {rotateFile && (
                   <div className="space-y-6 animate-fade-in">
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                         <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg text-red-500"><FileText size={20} /></div>
                         <span className="text-sm font-bold truncate flex-1 text-gray-700 dark:text-gray-200">{rotateFile.name}</span>
                         <button onClick={() => setRotateFile(null)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                         <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-4">回転角度 (右回り)</label>
                         <div className="flex justify-center gap-4">
                            {[90, 180, 270].map(deg => (
                               <button 
                                 key={deg} 
                                 onClick={() => setRotation(deg)} 
                                 className={`px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${rotation === deg ? 'bg-red-600 text-white shadow-lg' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'}`}
                               >
                                  <RotateCw size={14} /> {deg}°
                               </button>
                            ))}
                         </div>
                      </div>

                      <button 
                        onClick={processRotate} 
                        disabled={isProcessing} 
                        className="w-full py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl hover:bg-red-700 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 transition-all"
                      >
                         {isProcessing ? <Loader2 className="animate-spin" /> : <Download size={20} />} 
                         {isProcessing ? '回転処理中...' : '回転してダウンロード'}
                      </button>
                   </div>
                )}
             </div>
          )}
       </div>

       {!isWorkspace && (
         <article className="mt-12 p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h2 className="text-xl font-black flex items-center gap-2 mb-6">
               <Info className="text-blue-500" />
               PDFツールの特徴とセキュリティ
            </h2>
            <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
               <div>
                  <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-red-500" />サーバー送信なしの完全ローカル処理</h3>
                  <p>
                     当サイトのPDF編集機能は、WebAssembly技術を活用し、すべてお使いのブラウザ内（クライアントサイド）で完結します。
                     PDFファイルがサーバーにアップロードされることは一切ありません。契約書や請求書など、機密性の高い文書も安心して処理いただけます。
                  </p>
               </div>
               <div>
                  <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-red-500" />シンプルな操作性</h3>
                  <p>
                     専用ソフトのインストールや会員登録は不要です。「結合」「解除」「回転」という日常的によく使う機能に絞り込み、ドラッグ＆ドロップで直感的に操作できるように設計されています。
                  </p>
               </div>
            </div>
         </article>
       )}
       {!isWorkspace && <AdBanner />}
    </div>
  );
};

export default PdfTools;