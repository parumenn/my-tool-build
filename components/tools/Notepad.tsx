
import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Trash2, Bold, Italic, Underline, List, Type, Link as LinkIcon, 
  Code, Quote, Palette, Heading1, Heading2, CheckSquare, Eraser, 
  FilePlus, PanelLeftClose, PanelLeftOpen, ChevronLeft, Info, 
  ShieldCheck, Zap, Eye, Terminal, ChevronDown
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  updated: string;
}

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'python', name: 'Python' },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
  { id: 'sql', name: 'SQL' },
  { id: 'bash', name: 'Shell' }
];

const Notepad: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('maitool_notes');
    return saved ? JSON.parse(saved) : [{
      id: '1', 
      title: 'ようこそ！', 
      content: '<div class="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500"><b>まいつーるメモへようこそ！</b><br>このエディタはリッチテキストとHTMLコードの両方に対応しています。</div>', 
      updated: new Date().toLocaleString()
    }];
  });

  const [activeId, setActiveId] = useState<string>(notes[0]?.id || '');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [mobileView, setMobileView] = useState<'list' | 'editor'>(notes.length > 0 ? 'editor' : 'list');
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [selectedLang, setSelectedLang] = useState('javascript');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('maitool_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    const activeNote = notes.find(n => n.id === activeId);
    if (activeNote && editorRef.current && !isCodeMode) {
      if (editorRef.current.innerHTML !== activeNote.content) {
        editorRef.current.innerHTML = activeNote.content;
      }
    }
  }, [activeId, isCodeMode]);

  const updateActiveNote = (updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === activeId ? { ...n, ...updates, updated: new Date().toLocaleString() } : n));
  };

  const handleContentInput = () => {
    if (editorRef.current && !isCodeMode) {
      updateActiveNote({ content: editorRef.current.innerHTML });
    }
  };

  const createNote = () => {
    const newId = Date.now().toString();
    const newNote: Note = { 
      id: newId, 
      title: '無題のメモ', 
      content: '<div></div>', 
      updated: new Date().toLocaleString() 
    };
    setNotes([newNote, ...notes]);
    setActiveId(newId);
    setMobileView('editor');
    setIsCodeMode(false);
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('このメモを削除しますか？')) return;
    const newNotes = notes.filter(n => n.id !== id);
    setNotes(newNotes);
    if (activeId === id) setActiveId(newNotes[0]?.id || '');
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (isCodeMode) return;
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleContentInput();
  };

  const insertCodeBlock = () => {
    const langName = LANGUAGES.find(l => l.id === selectedLang)?.name || 'Code';
    const codeHtml = `<pre class="bg-slate-900 text-green-400 p-4 rounded-lg my-4 font-mono text-sm relative group overflow-x-auto"><div class="absolute right-2 top-2 text-[10px] uppercase font-bold text-slate-500 opacity-50 group-hover:opacity-100 transition-opacity">${langName}</div><code>\n// Write your ${langName} here...\n</code></pre><p><br></p>`;
    execCmd('insertHTML', codeHtml);
  };

  const toggleCodeMode = () => {
    setIsCodeMode(!isCodeMode);
  };

  const activeNote = notes.find(n => n.id === activeId);

  return (
    <div className="space-y-10 pb-20">
      <div className="h-[calc(100vh-160px)] flex bg-white dark:bg-dark-lighter rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden relative">
        
        {/* サイドバー（リスト） */}
        <div className={`
          ${isSidebarOpen ? 'w-full md:w-72 lg:w-80' : 'w-0'} 
          ${mobileView === 'list' ? 'flex' : 'hidden md:flex'}
          bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-gray-700 flex-col overflow-hidden transition-all duration-300 z-20
        `}>
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
            <h3 className="font-black text-gray-700 dark:text-gray-200">メモ一覧</h3>
            <button onClick={createNote} className="p-2 bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400 rounded-lg hover:opacity-80 transition-opacity">
              <FilePlus size={20}/>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
            {notes.length === 0 ? (
              <div className="text-center py-20 text-gray-400 text-sm">メモがありません</div>
            ) : (
              notes.map(note => (
                <div 
                  key={note.id} 
                  onClick={() => { setActiveId(note.id); setMobileView('editor'); setIsCodeMode(false); }} 
                  className={`p-4 rounded-xl cursor-pointer border transition-all group relative ${
                    activeId === note.id 
                      ? 'bg-white dark:bg-gray-800 border-lime-300 dark:border-lime-700 shadow-sm' 
                      : 'border-transparent hover:bg-white/50 dark:hover:bg-gray-800/30'
                  }`}
                >
                  <div className="font-bold truncate text-gray-800 dark:text-gray-100 pr-6">{note.title || '無題'}</div>
                  <div className="text-[10px] text-gray-400 mt-1">{note.updated}</div>
                  <button 
                    onClick={(e) => deleteNote(note.id, e)} 
                    className="absolute top-4 right-3 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14}/>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* メインエディタエリア */}
        <div className={`
          flex-1 flex flex-col overflow-hidden 
          ${mobileView === 'editor' ? 'flex' : 'hidden md:flex'}
        `}>
          {activeNote ? (
            <>
              {/* エディタヘッダー */}
              <div className="p-3 border-b dark:border-gray-700 bg-white dark:bg-dark-lighter flex flex-col gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  {/* サイドバー切替（デスクトップ・モバイル共用） */}
                  <button onClick={() => { if(window.innerWidth < 768) setMobileView('list'); else setIsSidebarOpen(!isSidebarOpen); }} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-1">
                    {window.innerWidth < 768 ? <ChevronLeft size={24}/> : (isSidebarOpen ? <PanelLeftClose size={20}/> : <PanelLeftOpen size={20}/>)}
                  </button>

                  <input 
                    type="text" 
                    value={activeNote.title} 
                    onChange={(e) => updateActiveNote({ title: e.target.value })} 
                    className="flex-1 text-xl font-black bg-transparent outline-none text-gray-800 dark:text-white"
                    placeholder="タイトルを入力..."
                  />

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={toggleCodeMode} 
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isCodeMode ? 'bg-slate-800 text-white shadow-inner' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                      title={isCodeMode ? "リッチテキストへ" : "HTMLソース編集"}
                    >
                      {isCodeMode ? <Eye size={14}/> : <Code size={14}/>}
                      <span className="hidden sm:inline">{isCodeMode ? 'プレビュー' : 'HTML編集'}</span>
                    </button>
                  </div>
                </div>

                {/* ツールバー */}
                {!isCodeMode && (
                  <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1 border-t pt-3 dark:border-gray-800">
                    <button onClick={() => execCmd('bold')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300" title="太字">
                      <Bold size={18}/>
                    </button>
                    <button onClick={() => execCmd('italic')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300" title="斜体">
                      <Italic size={18}/>
                    </button>
                    <button onClick={() => execCmd('underline')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300" title="下線">
                      <Underline size={18}/>
                    </button>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 my-auto shrink-0"></div>
                    <button onClick={() => execCmd('formatBlock', 'h1')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300" title="見出し1">
                      <Heading1 size={18}/>
                    </button>
                    <button onClick={() => execCmd('formatBlock', 'h2')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300" title="見出し2">
                      <Heading2 size={18}/>
                    </button>
                    <button onClick={() => execCmd('formatBlock', 'blockquote')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300" title="引用">
                      <Quote size={18}/>
                    </button>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 my-auto shrink-0"></div>
                    
                    {/* コーディング機能（言語選択 & 挿入） */}
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 rounded-lg border dark:border-slate-700">
                       <select 
                         value={selectedLang} 
                         onChange={(e) => setSelectedLang(e.target.value)} 
                         className="bg-transparent text-[10px] font-black uppercase text-slate-500 outline-none cursor-pointer pr-1"
                       >
                         {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                       </select>
                       <button onClick={insertCodeBlock} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded text-indigo-600 dark:text-indigo-400" title="コードブロック挿入">
                        <Terminal size={16}/>
                       </button>
                    </div>

                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 my-auto shrink-0"></div>
                    <button onClick={() => execCmd('insertUnorderedList')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300" title="箇条書き">
                      <List size={18}/>
                    </button>
                    <button onClick={() => execCmd('insertHTML', '<div class="flex items-center gap-2 my-1"><input type="checkbox"> <span contenteditable="true">TODO</span></div>')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300" title="チェックボックス">
                      <CheckSquare size={18}/>
                    </button>
                    <button onClick={() => {
                      const url = prompt('リンク先URLを入力');
                      if (url) execCmd('createLink', url);
                    }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300" title="リンク">
                      <LinkIcon size={18}/>
                    </button>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 my-auto shrink-0"></div>
                    <button onClick={() => execCmd('removeFormat')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-red-400" title="書式をクリア">
                      <Eraser size={18}/>
                    </button>
                  </div>
                )}
              </div>

              {/* エディタ本体 */}
              <div className="flex-1 relative overflow-hidden bg-white dark:bg-dark">
                {isCodeMode ? (
                  <textarea 
                    value={activeNote.content}
                    onChange={(e) => updateActiveNote({ content: e.target.value })}
                    spellCheck={false}
                    className="absolute inset-0 w-full h-full p-6 font-mono text-sm bg-slate-900 text-green-400 outline-none resize-none leading-relaxed"
                  />
                ) : (
                  <div 
                    ref={editorRef} 
                    contentEditable 
                    onInput={handleContentInput} 
                    className="absolute inset-0 w-full h-full p-6 md:p-10 outline-none overflow-y-auto prose dark:prose-invert max-w-none prose-headings:font-black prose-pre:bg-slate-900 prose-pre:text-green-400 prose-pre:shadow-2xl"
                    spellCheck={false}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-dark">
              <FilePlus size={64} className="opacity-10 mb-4"/>
              <p className="font-bold">メモを選択するか、新しく作成してください</p>
              <button onClick={createNote} className="mt-4 px-6 py-2 bg-lime-600 text-white rounded-xl font-bold hover:bg-lime-700 transition-colors shadow-lg">新規作成</button>
            </div>
          )}
        </div>
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />プロ仕様のWebメモ帳：リッチテキストとHTMLの完全統合</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-lime-600" />言語別コードブロック機能</h3>
               <p>当エディタは、プログラムコードの保存に特化した機能を搭載しています。JavaScript, Python, SQLなどの言語を選択してコードブロックを挿入することで、シンタックスハイライト風のデザインで技術メモを整理できます。HTMLモードに切り替えれば、より詳細なソース編集も可能です。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-lime-600" />安全なローカルストレージ運用</h3>
               <p>サイドバーのトグル操作により、多数のメモを効率的に管理できます。すべてのデータはブラウザ内のLocalStorageにのみ保存され、外部への送信は一切ありません。機密性の高い開発メモや、個人的なアイデア帳として、プライバシーが守られた環境で安心してご利用いただけます。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default Notepad;
