
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Trash2, Bold, List, Type, Link as LinkIcon, Code, Quote, Palette, Heading, CheckSquare, ChevronRight, Eraser, ChevronDown, FilePlus, X, PanelLeftClose, PanelLeftOpen, GripVertical, ChevronLeft } from 'lucide-react';

declare global {
  interface Window {
    hljs: any;
  }
}

const PRESET_COLORS = [
  { color: '#000000', label: '黒' },
  { color: '#4B5563', label: 'グレー' },
  { color: '#EF4444', label: '赤' },
  { color: '#F59E0B', label: 'オレンジ' },
  { color: '#10B981', label: '緑' },
  { color: '#3B82F6', label: '青' },
  { color: '#8B5CF6', label: '紫' },
];

const Notepad: React.FC = () => {
  const [notes, setNotes] = useState<Array<{id: string, title: string, content: string, updated: string}>>(() => {
    const saved = localStorage.getItem('maitool_notes');
    return saved ? JSON.parse(saved) : [{id: '1', title: 'Welcome Note', content: '<div><b>ようこそ！</b></div><div>高機能なオンラインメモ帳へ。</div><ul><li>リッチテキスト対応</li><li>Tabキーでインデント</li></ul><pre><code>// コードブロックの例\nconsole.log("Hello World");</code></pre>', updated: new Date().toLocaleString()}];
  });
  const [activeId, setActiveId] = useState<string>(notes[0]?.id || '');
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => localStorage.getItem('notepad_sidebar_open') !== 'false');
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(localStorage.getItem('notepad_sidebar_width')) || 260);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileView, setMobileView] = useState<'list' | 'editor'>(notes.length > 0 ? 'editor' : 'list');

  // Handle Window Resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Link Dialog State
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const savedRange = useRef<Range | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const savingRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('maitool_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (editorRef.current) {
        const activeNote = notes.find(n => n.id === activeId);
        if (activeNote && editorRef.current.innerHTML !== activeNote.content) {
            editorRef.current.innerHTML = activeNote.content;
            requestAnimationFrame(() => applyHighlighting(true));
        }
    }
  }, [activeId]);

  const activeNote = notes.find(n => n.id === activeId);

  const updateTitle = (val: string) => {
    setNotes(prev => prev.map(n => n.id === activeId ? {...n, title: val, updated: new Date().toLocaleString()} : n));
  };

  const handleContentInput = () => {
      if (editorRef.current) {
          const content = editorRef.current.innerHTML;
          if (savingRef.current) clearTimeout(savingRef.current);
          savingRef.current = window.setTimeout(() => {
              setNotes(prev => prev.map(n => n.id === activeId ? {...n, content: content, updated: new Date().toLocaleString()} : n));
          }, 1000);
      }
  };

  const applyHighlighting = (forceAll: boolean = false) => {
      if (editorRef.current && window.hljs) {
          const blocks = editorRef.current.querySelectorAll('pre code');
          blocks.forEach((block) => {
              const htmlBlock = block as HTMLElement;
              htmlBlock.textContent = htmlBlock.innerText;
              window.hljs.highlightElement(htmlBlock);
          });
      }
  };

  const createNote = () => {
    const newId = Date.now().toString();
    const newNote = { id: newId, title: '無題のメモ', content: '<div></div>', updated: new Date().toLocaleString() };
    setNotes([newNote, ...notes]);
    setActiveId(newId);
    if (isMobile) setMobileView('editor');
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm('このメモを削除しますか？')) {
        const newNotes = notes.filter(n => n.id !== id);
        setNotes(newNotes);
        if (activeId === id && newNotes.length > 0) setActiveId(newNotes[0].id);
    }
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
      handleContentInput();
  };

  const startResizing = (e: React.MouseEvent) => { e.preventDefault(); setIsResizing(true); };
  const stopResizing = () => setIsResizing(false);
  const resize = useCallback((e: MouseEvent) => {
    if (isResizing && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newWidth = e.clientX - rect.left;
        if (newWidth > 150 && newWidth < 500) setSidebarWidth(newWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
    } else {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
    }
    return () => { window.removeEventListener('mousemove', resize); window.removeEventListener('mouseup', stopResizing); };
  }, [isResizing, resize]);

  return (
    <div ref={containerRef} className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-0 relative overflow-hidden bg-white dark:bg-dark-lighter md:rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Sidebar List (Visible on PC or Mobile in list mode) */}
      <div 
        style={{ width: isMobile ? (mobileView === 'list' ? '100%' : '0%') : (isSidebarOpen ? sidebarWidth : 0) }}
        className={`bg-gray-50 dark:bg-dark-lighter border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden shrink-0 transition-all duration-300 ease-in-out z-10`}
      >
         <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-slate-800/50 sticky top-0">
            <h3 className="font-bold text-gray-800 dark:text-gray-200">メモ一覧</h3>
            <div className="flex gap-2">
                <button onClick={createNote} className="text-lime-600 bg-lime-50 dark:bg-lime-900/30 p-2 rounded-lg transition-colors border border-lime-100 dark:border-lime-800" title="新規メモ">
                    <FilePlus size={20} />
                </button>
                {!isMobile && (
                    <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors">
                        <PanelLeftClose size={20} />
                    </button>
                )}
            </div>
         </div>
         <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {notes.map(note => (
               <div 
                 key={note.id}
                 onClick={() => { setActiveId(note.id); if(isMobile) setMobileView('editor'); }}
                 className={`p-4 rounded-xl cursor-pointer transition-all border ${activeId === note.id ? 'bg-white dark:bg-slate-800 border-lime-300 dark:border-lime-500 shadow-sm ring-2 ring-lime-100 dark:ring-lime-900/30' : 'bg-white dark:bg-slate-800/30 border-transparent hover:bg-white dark:hover:bg-slate-800'}`}
               >
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-bold text-gray-800 dark:text-gray-100 truncate text-base">{note.title || '無題'}</div>
                    <button onClick={(e) => deleteNote(note.id, e)} className="text-gray-400 hover:text-red-500 p-1">
                        <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                    <Save size={10} /> {note.updated}
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Resize Handle (Desktop Only) */}
      {!isMobile && isSidebarOpen && (
          <div onMouseDown={startResizing} className={`w-1 cursor-col-resize hover:bg-lime-400 transition-colors flex items-center justify-center shrink-0 group ${isResizing ? 'bg-lime-500' : ''}`}>
              <div className="opacity-0 group-hover:opacity-100 p-0.5 bg-white dark:bg-gray-700 rounded-full shadow border border-gray-200 dark:border-gray-600 z-20">
                  <GripVertical size={12} className="text-gray-400" />
              </div>
          </div>
      )}

      {/* Editor Area */}
      <div 
        className={`flex-1 flex flex-col overflow-hidden min-w-0 transition-all ${isMobile && mobileView === 'list' ? 'hidden' : 'flex'}`}
      >
         {activeNote ? (
            <>
               <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-lighter flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    {isMobile ? (
                        <button onClick={() => setMobileView('list')} className="p-2 -ml-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            <ChevronLeft size={24} />
                        </button>
                    ) : (
                        !isSidebarOpen && (
                            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                <PanelLeftOpen size={20} />
                            </button>
                        )
                    )}
                    <input 
                        type="text" 
                        value={activeNote.title} 
                        onChange={(e) => updateTitle(e.target.value)}
                        className="flex-1 text-xl md:text-2xl font-bold bg-transparent border-none focus:ring-0 text-gray-800 dark:text-white placeholder-gray-300 outline-none truncate"
                        placeholder="タイトル"
                    />
                  </div>
                  
                  {/* Floating-style Toolbar (Mobile Scrollable) */}
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1.5 rounded-xl border border-gray-200 dark:border-slate-700 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap">
                      <button onMouseDown={e => e.preventDefault()} onClick={() => execCmd('bold')} className="p-2 min-w-[40px] hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-gray-300"><Bold size={18} /></button>
                      <button onMouseDown={e => e.preventDefault()} onClick={() => document.execCommand('formatBlock', false, 'H2')} className="p-2 min-w-[44px] hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-gray-300 font-bold text-xs">H2</button>
                      <button onMouseDown={e => e.preventDefault()} onClick={() => document.execCommand('formatBlock', false, 'H3')} className="p-2 min-w-[44px] hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-gray-300 font-bold text-xs">H3</button>
                      <div className="w-px h-6 bg-gray-300 dark:bg-slate-700 mx-1 shrink-0" />
                      <button onMouseDown={e => e.preventDefault()} onClick={() => execCmd('insertUnorderedList')} className="p-2 min-w-[40px] hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-gray-300"><List size={18} /></button>
                      <button onMouseDown={e => e.preventDefault()} onClick={() => document.execCommand('insertHTML', false, '<div><input type="checkbox" style="margin-right:8px; width:18px; height:18px; vertical-align:middle;"> TODO</div>')} className="p-2 min-w-[40px] hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-gray-300"><CheckSquare size={18} /></button>
                      <button onMouseDown={e => e.preventDefault()} onClick={() => document.execCommand('insertHTML', false, '<pre><code>コードを入力</code></pre><p><br></p>')} className="p-2 min-w-[40px] hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-gray-300"><Code size={18} /></button>
                      <button onMouseDown={e => e.preventDefault()} onClick={() => document.execCommand('formatBlock', false, 'BLOCKQUOTE')} className="p-2 min-w-[40px] hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-gray-300"><Quote size={18} /></button>
                      <button onMouseDown={e => e.preventDefault()} onClick={() => { document.execCommand('removeFormat'); document.execCommand('formatBlock', false, 'DIV'); }} className="p-2 min-w-[40px] hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-red-500 ml-auto"><Eraser size={18} /></button>
                  </div>
               </div>

               <div className="flex-1 relative overflow-hidden bg-white dark:bg-dark-lighter">
                  <style>{`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .prose b { font-weight: 800 !important; }
                    .prose input[type="checkbox"] { cursor: pointer; border-radius: 4px; }
                    .prose pre { padding: 1rem; background: #1e1e1e !important; color: #d4d4d4 !important; border-radius: 0.75rem; font-family: monospace; overflow-x: auto; }
                    .editor-root { min-height: 100%; font-size: 16px; line-height: 1.6; }
                    @media (max-width: 768px) { .editor-root { font-size: 17px; padding: 1.5rem !important; } }
                  `}</style>
                  <div 
                    ref={editorRef}
                    contentEditable
                    onInput={handleContentInput}
                    className="w-full h-full p-6 md:p-8 outline-none overflow-y-auto text-gray-800 dark:text-gray-100 prose dark:prose-invert max-w-none editor-root"
                    spellCheck={false}
                  />
                  <div className="absolute bottom-4 right-4 text-[10px] font-bold text-gray-400 pointer-events-none bg-white/80 dark:bg-slate-900/50 px-2 py-1 rounded backdrop-blur-sm border border-gray-100 dark:border-slate-800">
                     <Save size={10} className="inline mr-1" /> 自動保存済み
                  </div>
               </div>
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4 bg-gray-50 dark:bg-dark">
               <div className="p-6 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                  <FilePlus size={48} className="opacity-20" />
               </div>
               <p className="font-bold">メモを作成して開始</p>
               <button onClick={createNote} className="px-6 py-2 bg-lime-600 text-white rounded-xl font-bold shadow-lg shadow-lime-200 dark:shadow-none">新規作成</button>
            </div>
         )}
      </div>
    </div>
  );
};

export default Notepad;
