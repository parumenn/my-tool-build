
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Trash2, Bold, List, Type, Link as LinkIcon, Code, Quote, Palette, Heading, CheckSquare, ChevronRight, Eraser, ChevronDown, FilePlus, X, PanelLeftClose, PanelLeftOpen, GripVertical, ChevronLeft, Info, ShieldCheck, Zap } from 'lucide-react';

const Notepad: React.FC = () => {
  const [notes, setNotes] = useState<Array<{id: string, title: string, content: string, updated: string}>>(() => {
    const saved = localStorage.getItem('maitool_notes');
    return saved ? JSON.parse(saved) : [{id: '1', title: 'Welcome Note', content: '<div><b>ようこそ！</b></div><div>高機能なオンラインメモ帳へ。</div>', updated: new Date().toLocaleString()}];
  });
  const [activeId, setActiveId] = useState<string>(notes[0]?.id || '');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileView, setMobileView] = useState<'list' | 'editor'>(notes.length > 0 ? 'editor' : 'list');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem('maitool_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => {
    if (editorRef.current) {
        const activeNote = notes.find(n => n.id === activeId);
        if (activeNote && editorRef.current.innerHTML !== activeNote.content) {
            editorRef.current.innerHTML = activeNote.content;
        }
    }
  }, [activeId]);

  const updateTitle = (val: string) => { setNotes(prev => prev.map(n => n.id === activeId ? {...n, title: val, updated: new Date().toLocaleString()} : n)); };
  const handleContentInput = () => { if (editorRef.current) { const content = editorRef.current.innerHTML; setNotes(prev => prev.map(n => n.id === activeId ? {...n, content: content, updated: new Date().toLocaleString()} : n)); } };
  const createNote = () => { const newId = Date.now().toString(); setNotes([{ id: newId, title: '無題のメモ', content: '<div></div>', updated: new Date().toLocaleString() }, ...notes]); setActiveId(newId); if(isMobile) setMobileView('editor'); };
  const execCmd = (command: string, value: string | undefined = undefined) => { document.execCommand(command, false, value); editorRef.current?.focus(); handleContentInput(); };

  return (
    <div className="space-y-10 pb-20">
      <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row bg-white dark:bg-dark-lighter md:rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className={`${isMobile ? (mobileView === 'list' ? 'w-full' : 'w-0') : (isSidebarOpen ? 'w-64' : 'w-0')} bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-all duration-300`}>
           <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center"><h3 className="font-bold">メモ一覧</h3><button onClick={createNote} className="p-2 bg-lime-50 text-lime-600 rounded-lg"><FilePlus size={20}/></button></div>
           <div className="flex-1 overflow-y-auto p-3 space-y-2">{notes.map(note => (<div key={note.id} onClick={() => { setActiveId(note.id); if(isMobile) setMobileView('editor'); }} className={`p-4 rounded-xl cursor-pointer border ${activeId === note.id ? 'bg-white border-lime-300 shadow-sm' : 'border-transparent hover:bg-white'}`}><div className="font-bold truncate">{note.title || '無題'}</div><div className="text-[10px] text-gray-400 mt-1">{note.updated}</div></div>))}</div>
        </div>
        <div className={`flex-1 flex flex-col overflow-hidden ${isMobile && mobileView === 'list' ? 'hidden' : 'flex'}`}>
           {activeId ? (
              <>
                <div className="p-3 border-b dark:border-gray-700 bg-white dark:bg-dark-lighter flex flex-col gap-3">
                    <div className="flex items-center gap-2">{isMobile && <button onClick={() => setMobileView('list')}><ChevronLeft size={24}/></button>}<input type="text" value={notes.find(n => n.id === activeId)?.title || ''} onChange={(e) => updateTitle(e.target.value)} className="flex-1 text-xl font-bold bg-transparent outline-none" /></div>
                    <div className="flex gap-1 overflow-x-auto no-scrollbar"><button onClick={() => execCmd('bold')} className="p-2 hover:bg-gray-100 rounded"><b>B</b></button><button onClick={() => execCmd('insertUnorderedList')} className="p-2 hover:bg-gray-100 rounded"><List size={18}/></button><button onClick={() => execCmd('insertHTML', '<div><input type="checkbox"> TODO</div>')} className="p-2 hover:bg-gray-100 rounded"><CheckSquare size={18}/></button></div>
                </div>
                <div ref={editorRef} contentEditable onInput={handleContentInput} className="flex-1 p-6 md:p-8 outline-none overflow-y-auto prose dark:prose-invert max-w-none" />
              </>
           ) : <div className="flex-1 flex flex-col items-center justify-center text-gray-400"><FilePlus size={48} className="opacity-20 mb-2"/><p>メモを選択または作成してください</p></div>}
        </div>
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />登録不要で使える高機能Webメモ帳</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-lime-600" />ブラウザ完結のセキュアな保存</h3>
               <p>当メモ帳ツールは、入力されたテキストをすべてお使いのブラウザ内（LocalStorage）に自動保存します。アカウント登録やログインの手間なく、ページを閉じても次回アクセス時にメモが復元されます。データがサーバーに送信されることはないため、個人の思考整理やパスワードの一時控えにも適しています。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-lime-600" />豊富な編集機能とサイドバー</h3>
               <p>太字、リスト作成、チェックボックス(TODO)などのリッチテキスト編集に対応。PCでは画面を分割して複数のメモを効率的に管理でき、スマホではシングルビューで執筆に集中できます。設定画面からバックアップ（JSON出力）を行うことで、他のデバイスへメモを移行することも可能です。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default Notepad;
