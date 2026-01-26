import React, { useState, useRef, useEffect, useContext } from 'react';
import { FileText, Combine, Lock, RotateCw, Trash2, Download, Upload, Files, ArrowRight, PenTool, Type, Eraser, Move, Plus, Minus, ChevronLeft, ChevronRight, Save, MousePointer2, Pencil } from 'lucide-react';
import { PDFDocument, degrees, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import * as fontkit from '@pdf-lib/fontkit';
import { WorkspaceContext } from '../WorkspaceContext';

// Setup PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

interface EditElement {
  id: string;
  type: 'text' | 'rect';
  x: number; // Percentage 0-100 relative to canvas
  y: number; // Percentage 0-100 relative to canvas
  width?: number; // Percentage (for rect)
  height?: number; // Percentage (for rect)
  text?: string;
  fontSize?: number;
  color?: string;
  hasBackground?: boolean; 
  autoFocus?: boolean;
}

interface TextLayerItem {
  str: string;
  x: number; // Percentage
  y: number; // Percentage
  w: number; // Percentage
  h: number; // Percentage
}

const PdfTools: React.FC = () => {
  const isWorkspace = useContext(WorkspaceContext);
  const [activeTab, setActiveTab] = useState<'merge' | 'unlock' | 'rotate' | 'gui'>('merge');

  // --- MERGE STATE ---
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  
  // --- UNLOCK STATE ---
  const [unlockFile, setUnlockFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');

  // --- ROTATE/DELETE STATE ---
  const [editFile, setEditFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [pageCount, setPageCount] = useState<number>(0);
  const [deletePages, setDeletePages] = useState<string>('');

  // --- GUI EDITOR STATE ---
  const [guiFile, setGuiFile] = useState<File | null>(null);
  const [guiPdfDoc, setGuiPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [editMode, setEditMode] = useState<'view' | 'text' | 'rect' | 'select_text'>('view');
  const [elements, setElements] = useState<Record<number, EditElement[]>>({}); 
  const [textLayer, setTextLayer] = useState<TextLayerItem[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  // --- Handlers ---

  const handleMergeFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMergeFiles([...mergeFiles, ...Array.from(e.target.files)]);
    }
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
      console.error(e);
      alert('PDFの結合に失敗しました。ファイルが破損しているか、パスワード保護されている可能性があります。');
    } finally {
      setIsProcessing(false);
    }
  };

  const processUnlock = async () => {
    if (!unlockFile) return;
    setIsProcessing(true);
    try {
      const arrayBuffer = await unlockFile.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, { password } as any);
      const pdfBytes = await pdf.save();
      downloadPdf(pdfBytes, `unlocked_${unlockFile.name}`);
    } catch (e) {
      console.error(e);
      alert('パスワードが間違っているか、解除に失敗しました。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
     if(e.target.files?.[0]) {
        const file = e.target.files[0];
        setEditFile(file);
        try {
           const ab = await file.arrayBuffer();
           const pdf = await PDFDocument.load(ab, { ignoreEncryption: true });
           setPageCount(pdf.getPageCount());
        } catch(e) {}
     }
  };

  const processRotateDelete = async () => {
     if (!editFile) return;
     setIsProcessing(true);
     try {
        const arrayBuffer = await editFile.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        
        if (deletePages) {
           const pagesToDelete = new Set<number>();
           const parts = deletePages.split(',').map(s => s.trim());
           for (const part of parts) {
              if (part.includes('-')) {
                 const [start, end] = part.split('-').map(n => parseInt(n));
                 if (!isNaN(start) && !isNaN(end)) {
                    for(let i = start; i <= end; i++) pagesToDelete.add(i - 1);
                 }
              } else {
                 const p = parseInt(part);
                 if (!isNaN(p)) pagesToDelete.add(p - 1);
              }
           }
           const sortedIndices = Array.from(pagesToDelete).sort((a, b) => b - a);
           for (const idx of sortedIndices) {
              if (idx >= 0 && idx < pdf.getPageCount()) {
                 pdf.removePage(idx);
              }
           }
        }

        if (rotation !== 0) {
           const pages = pdf.getPages();
           pages.forEach(page => {
              const current = page.getRotation().angle;
              page.setRotation(degrees(current + rotation));
           });
        }

        const pdfBytes = await pdf.save();
        downloadPdf(pdfBytes, `edited_${editFile.name}`);
     } catch(e) {
        console.error(e);
        alert('編集に失敗しました。');
     } finally {
        setIsProcessing(false);
     }
  };

  // --- GUI EDITOR LOGIC ---

  const handleGuiFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setGuiFile(file);
      setIsProcessing(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        setGuiPdfDoc(pdf);
        setCurrentPage(1);
        setElements({});
      } catch (err) {
        console.error(err);
        alert('PDFの読み込みに失敗しました。');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Render Page & Extract Text Layer
  useEffect(() => {
    const render = async () => {
      if (!guiPdfDoc || !canvasRef.current) return;
      
      try {
        const page = await guiPdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale: scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        } as any;
        await page.render(renderContext).promise;

        const textContent = await page.getTextContent();
        const items: TextLayerItem[] = textContent.items.map((item: any) => {
           const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
           return {
             str: item.str,
             x: (tx[4] / viewport.width) * 100,
             y: (tx[5] / viewport.height) * 100 - (Math.abs(item.transform[3]) * viewport.scale / viewport.height * 100 * 0.8), 
             w: (item.width * viewport.scale / viewport.width) * 100,
             h: (Math.abs(item.transform[3]) * viewport.scale / viewport.height) * 100
           };
        });
        setTextLayer(items);

      } catch (e) {
        console.error("Page render error", e);
      }
    };
    render();
  }, [guiPdfDoc, currentPage, scale]);

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (draggingId && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
        updateElement(currentPage, draggingId, { x, y });
    }
  };

  const handleContainerMouseUp = () => {
    setDraggingId(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (draggingId) return;
    if ((editMode !== 'text' && editMode !== 'rect') || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newElement: EditElement = {
      id: Date.now().toString(),
      type: editMode,
      x,
      y,
      width: editMode === 'rect' ? 10 : undefined,
      height: editMode === 'rect' ? 5 : undefined,
      text: editMode === 'text' ? 'テキスト' : undefined,
      fontSize: 16,
      color: '#000000',
      hasBackground: false,
      autoFocus: true
    };

    setElements(prev => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), newElement]
    }));
    setEditMode('view');
  };

  const handleTextLayerClick = (item: TextLayerItem) => {
     if (editMode !== 'select_text') return;

     // Create an element exactly over the text
     const newElement: EditElement = {
        id: Date.now().toString(),
        type: 'text',
        text: item.str,
        x: item.x,
        y: item.y,
        fontSize: 14, // Approximate default
        color: '#000000',
        hasBackground: true,
        autoFocus: true
     };

     setElements(prev => ({
        ...prev,
        [currentPage]: [...(prev[currentPage] || []), newElement]
     }));
     
     // Stay in edit mode to allow selecting other text, but focus on the new input
     // setEditMode('view'); 
  };

  const updateElement = (page: number, id: string, updates: Partial<EditElement>) => {
    setElements(prev => ({
      ...prev,
      [page]: prev[page].map(el => el.id === id ? { ...el, ...updates } : el)
    }));
  };

  const removeElement = (page: number, id: string) => {
    setElements(prev => ({
      ...prev,
      [page]: prev[page].filter(el => el.id !== id)
    }));
  };

  const processGuiSave = async () => {
    if (!guiFile || !guiPdfDoc) return;
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await guiFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      pdfDoc.registerFontkit(fontkit);
      const fontUrl = 'https://raw.githubusercontent.com/minoryorg/noto-sans-jp-subset/master/subset/NotoSansJP-Regular.ttf';
      const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());
      const customFont = await pdfDoc.embedFont(fontBytes);

      const pages = pdfDoc.getPages();

      (Object.entries(elements) as [string, EditElement[]][]).forEach(([pageIdxStr, pageElements]) => {
        const pageIdx = parseInt(pageIdxStr) - 1;
        if (pageIdx < 0 || pageIdx >= pages.length) return;
        
        const page = pages[pageIdx];
        const { width, height } = page.getSize();

        pageElements.forEach(el => {
          const pdfX = (el.x / 100) * width;
          const pdfY = height - ((el.y / 100) * height);

          // Draw white rect first if needed (Edit Existing Text mode)
          if (el.hasBackground && el.type === 'text' && el.text) {
             const textSize = el.fontSize || 16;
             // Estimate text width roughly or use font
             const textWidth = customFont.widthOfTextAtSize(el.text, textSize);
             page.drawRectangle({
                x: pdfX - 2,
                y: pdfY - textSize + 2,
                width: textWidth + 8, // Little padding
                height: textSize + 4,
                color: rgb(1, 1, 1),
             });
          }

          if (el.type === 'rect') {
             const w = (el.width! / 100) * width;
             const h = (el.height! / 100) * height;
             page.drawRectangle({
                x: pdfX,
                y: pdfY - h, 
                width: w,
                height: h,
                color: rgb(1, 1, 1),
             });
          } else if (el.type === 'text' && el.text) {
             page.drawText(el.text, {
                x: pdfX,
                y: pdfY - (el.fontSize || 16),
                size: el.fontSize || 16,
                font: customFont,
                color: rgb(0, 0, 0),
             });
          }
        });
      });

      const pdfBytes = await pdfDoc.save();
      downloadPdf(pdfBytes, `edited_gui_${guiFile.name}`);

    } catch (e) {
      console.error(e);
      alert('保存に失敗しました。');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPdf = (bytes: Uint8Array, name: string) => {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`mx-auto h-full flex flex-col ${isWorkspace ? 'max-w-full p-2 space-y-2' : 'max-w-5xl space-y-6'}`}>
       {!isWorkspace && (
         <div className="flex items-center gap-2 mb-2 shrink-0">
            <FileText className="text-red-500" size={28} />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">PDFツール</h2>
         </div>
       )}

       {/* Tabs */}
       <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto no-scrollbar shrink-0">
          {[
             {id: 'gui', icon: PenTool, label: 'GUI編集'},
             {id: 'merge', icon: Combine, label: '結合'},
             {id: 'unlock', icon: Lock, label: '解除'},
             {id: 'rotate', icon: RotateCw, label: '回転'}
          ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                 activeTab === tab.id 
                   ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm' 
                   : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
               }`}
             >
               <tab.icon size={14} /> {tab.label}
             </button>
          ))}
       </div>

       <div className={`bg-white dark:bg-dark-lighter rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col flex-1 overflow-hidden ${isWorkspace ? 'p-3' : 'p-6 min-h-[500px]'}`}>
          
          {/* GUI EDITOR TAB */}
          {activeTab === 'gui' && (
             <div className="space-y-4 animate-fade-in flex flex-col h-full overflow-hidden">
                {!guiFile ? (
                   <div className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative cursor-pointer">
                      <input type="file" accept=".pdf" onChange={handleGuiFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <PenTool size={32} className="text-gray-400 mb-2" />
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">PDFを選択</span>
                   </div>
                ) : (
                   <div className="flex flex-col gap-2 h-full">
                      {/* Toolbar */}
                      <div className="sticky top-0 z-20 bg-gray-800 text-white p-2 rounded-xl shadow-lg flex flex-wrap items-center gap-2 justify-between shrink-0">
                         <div className="flex items-center gap-1">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 hover:bg-gray-700 rounded"><ChevronLeft size={16} /></button>
                            <span className="font-mono font-bold text-xs">P.{currentPage} / {guiPdfDoc?.numPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(guiPdfDoc?.numPages || 1, p + 1))} disabled={currentPage === guiPdfDoc?.numPages} className="p-1 hover:bg-gray-700 rounded"><ChevronRight size={16} /></button>
                         </div>

                         <div className="flex items-center gap-1 bg-gray-700 p-0.5 rounded-lg">
                            <button onClick={() => setEditMode('view')} className={`p-1.5 rounded ${editMode === 'view' ? 'bg-blue-500 text-white' : 'hover:bg-gray-600 text-gray-300'}`} title="移動"><Move size={14} /></button>
                            <button onClick={() => setEditMode('text')} className={`p-1.5 rounded ${editMode === 'text' ? 'bg-blue-500 text-white' : 'hover:bg-gray-600 text-gray-300'}`} title="文字追加"><Type size={14} /></button>
                            <button onClick={() => setEditMode('select_text')} className={`p-1.5 rounded flex items-center gap-1 ${editMode === 'select_text' ? 'bg-blue-500 text-white' : 'hover:bg-gray-600 text-gray-300'}`} title="テキスト書き換え"><Pencil size={14} /></button>
                            <button onClick={() => setEditMode('rect')} className={`p-1.5 rounded ${editMode === 'rect' ? 'bg-blue-500 text-white' : 'hover:bg-gray-600 text-gray-300'}`} title="白塗り(修正テープ)"><Eraser size={14} /></button>
                         </div>

                         <div className="flex gap-2">
                            <button 
                              onClick={processGuiSave} 
                              disabled={isProcessing}
                              className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm disabled:opacity-50"
                            >
                               {isProcessing ? <RotateCw className="animate-spin" size={12} /> : <Save size={12} />} 保存
                            </button>
                            <button onClick={() => {setGuiFile(null); setGuiPdfDoc(null); setElements({});}} className="text-gray-400 hover:text-white text-xs underline">閉じる</button>
                         </div>
                      </div>

                      {/* Canvas Container */}
                      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900/50 p-2 rounded-xl border border-gray-300 dark:border-gray-700 flex justify-center select-none no-scrollbar relative">
                         <div 
                           ref={containerRef} 
                           className="relative shadow-xl origin-top" 
                           style={{ cursor: editMode === 'text' || editMode === 'rect' ? 'crosshair' : (editMode === 'select_text' ? 'text' : 'default') }} 
                           onClick={handleCanvasClick}
                           onMouseMove={handleContainerMouseMove}
                           onMouseUp={handleContainerMouseUp}
                           onMouseLeave={handleContainerMouseUp}
                         >
                            <canvas ref={canvasRef} className="block bg-white" />
                            
                            {/* Visual Overlay for Text Selection Mode */}
                            {editMode === 'select_text' && textLayer.map((item, i) => (
                               <div 
                                 key={i}
                                 className="absolute hover:bg-blue-500/20 hover:border hover:border-blue-500 cursor-text transition-colors z-10 rounded-sm"
                                 style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%`, height: `${item.h}%` }}
                                 onMouseDown={(e) => {
                                    e.stopPropagation(); // Stop drag start or other clicks
                                    handleTextLayerClick(item);
                                 }}
                                 title="クリックして書き換え"
                               />
                            ))}

                            {(elements[currentPage] || []).map((el) => (
                               <div
                                 key={el.id}
                                 onMouseDown={(e) => { e.stopPropagation(); setDraggingId(el.id); }}
                                 className={`absolute group border ${draggingId === el.id ? 'border-blue-500 cursor-grabbing z-20 shadow-xl scale-105' : 'border-transparent hover:border-blue-300 cursor-grab z-10'}`}
                                 style={{
                                    left: `${el.x}%`,
                                    top: `${el.y}%`,
                                    width: el.type === 'rect' ? `${el.width}%` : 'auto',
                                    height: el.type === 'rect' ? `${el.height}%` : 'auto',
                                    backgroundColor: el.type === 'rect' || el.hasBackground ? 'white' : 'transparent',
                                    whiteSpace: 'nowrap',
                                    transform: 'translate(-0%, -0%)',
                                    transition: draggingId === el.id ? 'none' : 'all 0.1s'
                                 }}
                               >
                                  {el.type === 'text' ? (
                                     <input 
                                       type="text"
                                       value={el.text}
                                       autoFocus={el.autoFocus}
                                       onChange={(e) => updateElement(currentPage, el.id, { text: e.target.value })}
                                       className="bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 w-full"
                                       style={{ fontSize: `${(el.fontSize || 16) * scale}px`, color: el.color }}
                                       onMouseDown={(e) => e.stopPropagation()} 
                                     />
                                  ) : (
                                     <div className="w-full h-full relative">
                                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize opacity-0 group-hover:opacity-100" />
                                     </div>
                                  )}
                                  
                                  <div 
                                    className="absolute -top-6 left-0 bg-blue-500 text-white rounded px-2 py-0.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex items-center gap-1"
                                    onMouseDown={(e) => { e.stopPropagation(); setDraggingId(el.id); }}
                                  >
                                     <Move size={10} />
                                  </div>

                                  <button 
                                    onClick={() => removeElement(currentPage, el.id)}
                                    className="absolute -top-6 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onMouseDown={(e) => e.stopPropagation()} 
                                  >
                                     <Trash2 size={10} />
                                  </button>
                               </div>
                            ))}
                         </div>
                         
                         {/* Helper message for text edit mode */}
                         {editMode === 'select_text' && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold pointer-events-none animate-pulse z-30">
                               変更したいテキストをクリックしてください
                            </div>
                         )}
                      </div>
                   </div>
                )}
             </div>
          )}

          {/* OTHER TABS (Simplified for Workspace) */}
          {activeTab !== 'gui' && (
             <div className="space-y-4 animate-fade-in flex-1 flex flex-col justify-center">
                <div className="text-center space-y-2">
                   <h3 className="font-bold text-gray-800 dark:text-white text-sm">
                      {activeTab === 'merge' ? 'PDF結合' : activeTab === 'unlock' ? 'パスワード解除' : '回転・削除'}
                   </h3>
                </div>

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative">
                   <input 
                     type="file" 
                     accept=".pdf" 
                     multiple={activeTab === 'merge'} 
                     onChange={activeTab === 'merge' ? handleMergeFiles : (activeTab === 'unlock' ? (e) => e.target.files?.[0] && setUnlockFile(e.target.files[0]) : handleEditFile)} 
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                   />
                   {activeTab === 'merge' ? <Combine size={24} className="mx-auto mb-2 text-gray-400" /> : <Upload size={24} className="mx-auto mb-2 text-gray-400" />}
                   <span className="text-xs font-bold text-gray-600 dark:text-gray-300">ファイルを選択</span>
                </div>

                {(mergeFiles.length > 0 || unlockFile || editFile) && (
                   <div className="text-center">
                      <p className="text-xs text-green-500 font-bold mb-2">ファイル選択済み</p>
                      <button 
                        onClick={activeTab === 'merge' ? processMerge : (activeTab === 'unlock' ? processUnlock : processRotateDelete)} 
                        disabled={isProcessing}
                        className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                      >
                         {isProcessing ? '処理中...' : '実行'}
                      </button>
                   </div>
                )}
             </div>
          )}
       </div>
    </div>
  );
};

export default PdfTools;