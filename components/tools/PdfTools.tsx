
import React, { useState, useRef, useContext } from 'react';
import { FileText, Combine, Lock, RotateCw, Trash2, Download, Upload, Info, ShieldCheck, Zap, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import { WorkspaceContext } from '../WorkspaceContext';

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
                               <button onClick={() => setMergeFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500 transition-colors">
                                  <Trash2 size={16}/>
                                </button>
                            </div>
                         ))}
                      </div>
                      <button 
                        onClick={processMerge} 
                        disabled={isProcessing || mergeFiles.length < 2} 
                        className="w-full py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100 dark:shadow-none disabled:opacity-30 hover:bg-red-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                         {isProcessing ? <Loader2 className="animate-spin" /> : <Combine size={20} />}
                         {isProcessing ? '結合処理中...' : '選択したPDFを結合して保存'}
                      </button>
                   </div>
                )}
             </div>
          )}

          {/* UNLOCK TAB */}
          {activeTab === 'unlock' && (
             <div className="space-y-6 animate-fade-in flex-1 flex flex-col max-w-xl mx-auto w-full justify-center">
                {!unlockFile ? (
                   <label className="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-12 block text-center cursor-pointer hover:bg-gray-50 transition-colors">
                      <input type="file" accept=".pdf" onChange={(e) => setUnlockFile(e.target.files?.[0] || null)} className="hidden" />
                      <Lock size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="font-black text-gray-700 dark:text-gray-200">保護を解除するPDFを選択</p>
                   </label>
                ) : (
                   <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-3xl border border-gray-200 dark:border-gray-700 space-y-6">
                      <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                         <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl"><FileText size={24} /></div>
                         <div className="overflow-hidden"><p className="font-bold truncate text-gray-800 dark:text-white">{unlockFile.name}</p><p className="text-xs text-gray-500">{(unlockFile.size/1024/1024).toFixed(2)} MB</p></div>
                      </div>
                      <div>
                         <label className="block text-xs font-black text-gray-400 uppercase mb-2">閲覧パスワードを入力</label>
                         <input 
                           type="password" 
                           value={password} 
                           onChange={(e) => setPassword(e.target.value)} 
                           className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-lg font-bold" 
                           placeholder="••••••••"
                         />
                      </div>
                      <div className="flex gap-3">
                         <button onClick={() => setUnlockFile(null)} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">戻る</button>
                         <button 
                           onClick={processUnlock} 
                           disabled={isProcessing || !password}
                           className="flex-[2] py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-xl shadow-lg disabled:opacity-30 flex items-center justify-center gap-2"
                         >
                            {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                            解除して保存
                         </button>
                      </div>
                   </div>
                )}
             </div>
          )}

          {/* ROTATE TAB */}
          {activeTab === 'rotate' && (
             <div className="space-y-6 animate-fade-in flex-1 flex flex-col max-w-xl mx-auto w-full justify-center">
                {!rotateFile ? (
                   <label className="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-12 block text-center cursor-pointer hover:bg-gray-50 transition-colors">
                      <input type="file" accept=".pdf" onChange={(e) => setRotateFile(e.target.files?.[0] || null)} className="hidden" />
                      <RotateCw size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="font-black text-gray-700 dark:text-gray-200">回転させるPDFを選択</p>
                   </label>
                ) : (
                   <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-3xl border border-gray-200 dark:border-gray-700 space-y-6 text-center">
                      <div className="flex flex-col items-center gap-4">
                         <div className="p-5 bg-white dark:bg-gray-700 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-600 transition-transform duration-500" style={{ transform: `rotate(${rotation}deg)` }}>
                            <FileText size={64} className="text-red-500" />
                         </div>
                         <div><p className="font-bold text-gray-800 dark:text-white truncate max-w-xs">{rotateFile.name}</p></div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                         <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50"><RotateCw size={16} /> 90° 回転</button>
                         <button onClick={() => setRotation(0)} className="p-3 text-gray-400 font-bold hover:text-red-500">リセット</button>
                      </div>

                      <button 
                        onClick={processRotate} 
                        disabled={isProcessing}
                        className="w-full py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl hover:bg-red-700 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
                      >
                         {isProcessing ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                         適用してダウンロード
                      </button>
                      <button onClick={() => setRotateFile(null)} className="text-xs text-gray-400 font-bold hover:underline">別のファイルを選ぶ</button>
                   </div>
                )}
             </div>
          )}
       </div>

       {!isWorkspace && (
         <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />無料PDFツールの安全性と機能について</h2>
            <div className="grid md:grid-cols-3 gap-6">
               <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold"><ShieldCheck size={18} /> <span>100% ローカル処理</span></div>
                  <p className="text-xs leading-relaxed text-gray-500">
                     一般的なオンラインPDF変換サイトとは異なり、当ツールの処理はすべてブラウザ内で行われます。機密文書をアップロードする必要がないため、情報漏洩のリスクがありません。
                  </p>
               </div>
               <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold"><Zap size={18} /> <span>瞬時に結合・解除</span></div>
                  <p className="text-xs leading-relaxed text-gray-500">
                     複数の資料を1つのPDFにまとめたり、閲覧パスワードがかかったファイルを解除（保存し直し）したりといった日常的な作業を数秒で完了できます。
                  </p>
               </div>
               <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold"><AlertCircle size={18} /> <span>登録不要・無料</span></div>
                  <p className="text-xs leading-relaxed text-gray-500">
                     すべての機能は登録不要で、回数制限もなく無料でご利用いただけます。ブラウザのお気に入りに入れておくことで、いつでもすぐにPDF編集が可能です。
                  </p>
               </div>
            </div>
         </article>
       )}
    </div>
  );
};

export default PdfTools;
