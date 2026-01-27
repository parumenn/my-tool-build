import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Save, Trash2, Bold, List, Type, Link as LinkIcon, Code, Quote, Palette, Heading, CheckSquare, ChevronRight, Eraser, ChevronDown, FilePlus, X, CornerDownLeft, ArrowLeft, Zap, ShieldCheck, Info, ListTree } from 'lucide-react';
import AdBanner from '../AdBanner';

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
    return saved ? JSON.parse(saved) : [{id: '1', title: 'Welcome Note', content: '<div><b>ようこそ！</b></div><div>高機能なオンラインメモ帳へ。</div><ul><li>リッチテキスト対応</li><li>Tabキーでインデント</li></ul><pre><code>// コードブロック (自動検出)\nconsole.log("Hello World");</code></pre>', updated: new Date().toLocaleString()}];
  });
  const [activeId, setActiveId] = useState<string>(notes[0]?.id || '');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState<{top: number, left: number} | null>(null);
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);
  
  // Link Dialog State
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  
  const savedRange = useRef<Range | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const savingRef = useRef<number | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('maitool_notes', JSON.stringify(notes));
  }, [notes]);

  // Sync editor content when active note changes
  useEffect(() => {
    if (editorRef.current) {
        const activeNote = notes.find(n => n.id === activeId);
        if (activeNote) {
            if (editorRef.current.innerHTML !== activeNote.content) {
                editorRef.current.innerHTML = activeNote.content;
                requestAnimationFrame(() => applyHighlighting(true));
            }
        } else {
            editorRef.current.innerHTML = '';
        }
    }
    if (activeId) setIsMobileListVisible(false);
    else setIsMobileListVisible(true);
  }, [activeId]);

  // Auto Highlighting Logic
  useEffect(() => {
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = window.setTimeout(() => {
          applyHighlighting(false); 
      }, 1000);
      return () => {
          if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      };
  }, [notes]);

  // Close color picker on scroll or resize
  useEffect(() => {
      const handleScroll = () => { if(showColorPicker) setShowColorPicker(false); };
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
      return () => {
          window.removeEventListener('scroll', handleScroll, true);
          window.removeEventListener('resize', handleScroll);
      };
  }, [showColorPicker]);

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

  const getBlockParent = (node: Node | null): HTMLElement | null => {
     let curr = node;
     while (curr && curr !== editorRef.current) {
         if (curr.nodeType === 1 && ['DIV','P','LI','H1','H2','H3','BLOCKQUOTE','PRE','DETAILS'].includes((curr as HTMLElement).tagName)) {
             return curr as HTMLElement;
         }
         curr = curr.parentNode;
     }
     return null;
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  // Improved Highlight Logic using highlightAuto
  const applyHighlighting = (forceAll: boolean = false) => {
      if (editorRef.current && window.hljs) {
          const blocks = editorRef.current.querySelectorAll('pre code');
          const selection = window.getSelection();
          
          blocks.forEach((block) => {
              const htmlBlock = block as HTMLElement;
              
              let isFocused = false;
              if (!forceAll && selection && selection.anchorNode && editorRef.current?.contains(selection.anchorNode)) {
                  isFocused = block.contains(selection.anchorNode);
              }

              if (!isFocused) {
                 const currentText = htmlBlock.innerText;
                 // Use highlightAuto for better detection
                 try {
                     const result = window.hljs.highlightAuto(currentText);
                     let newHtml = result.value;
                     
                     // ハイライト処理で末尾の改行が消えないように補正
                     if (currentText.endsWith('\n') && !newHtml.endsWith('\n')) {
                         newHtml += '\n';
                     }
                     
                     htmlBlock.innerHTML = newHtml;
                     htmlBlock.className = 'hljs ' + result.language;
                 } catch (e) {
                     htmlBlock.textContent = currentText;
                 }
              }
          });
      }
  };

  const insertParagraphAfter = (targetNode: HTMLElement) => {
      const p = document.createElement('div');
      p.innerHTML = '<br>';
      targetNode.after(p);
      
      const selection = window.getSelection();
      const newRange = document.createRange();
      newRange.setStart(p, 0);
      newRange.collapse(true);
      if (selection) {
          selection.removeAllRanges();
          selection.addRange(newRange);
      }
      handleContentInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === 'Enter' && !e.shiftKey) {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        
        let current: Node | null = range.startContainer;
        if (current.nodeType === 3) current = current.parentNode;

        // 1. PREタグ (コードブロック) からの脱出
        const pre = (current as HTMLElement).closest('pre');
        if (pre) {
            // タイマーリセット: 入力中はハイライト更新を遅らせる
            if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
            highlightTimeoutRef.current = window.setTimeout(() => applyHighlighting(false), 2000);

            // カーソル位置が末尾付近にあるか判定
            // Rangeを使ってカーソル以降のテキストを取得
            const afterRange = document.createRange();
            afterRange.setStart(range.endContainer, range.endOffset);
            afterRange.setEndAfter(pre);
            const contentAfter = afterRange.toString();
            
            // 後ろに改行以外の文字がない
            const isAtEnd = contentAfter.replace(/[\r\n]/g, '').length === 0;

            if (isAtEnd) {
                // カーソル以前のテキストを取得して末尾を確認
                const beforeRange = document.createRange();
                beforeRange.selectNodeContents(pre);
                beforeRange.setEnd(range.startContainer, range.startOffset);
                const contentBefore = beforeRange.toString();

                // 直前が改行文字なら「空行でEnter」とみなす
                if (contentBefore.endsWith('\n') || contentBefore.endsWith('\r')) {
                    e.preventDefault();
                    
                    // 末尾の改行を削除して脱出
                    pre.innerText = pre.innerText.replace(/[\r\n]+$/, '');
                    
                    insertParagraphAfter(pre);
                    return;
                }
            }
            return;
        }

        // 2. DETAILSタグ (トグル) からの脱出
        const details = (current as HTMLElement).closest('details');
        if (details) {
            const contentDiv = details.querySelector('.toggle-content');
            if (contentDiv && (contentDiv.contains(range.startContainer) || contentDiv === range.startContainer)) {
                let blockNode = getBlockParent(range.startContainer);
                while (blockNode && blockNode.parentElement !== contentDiv && blockNode !== contentDiv) {
                    blockNode = blockNode.parentElement;
                }

                if (blockNode && blockNode.parentElement === contentDiv) {
                    let isLast = true;
                    let next = blockNode.nextSibling;
                    while(next) {
                        if (next.textContent && next.textContent.replace(/[\n\r]/g, '').length > 0) {
                            isLast = false;
                            break;
                        }
                        next = next.nextSibling;
                    }

                    if (isLast) {
                        const text = blockNode.textContent || '';
                        if (text.trim() === '') {
                             e.preventDefault();
                             blockNode.remove();
                             insertParagraphAfter(details);
                             return;
                        }
                    }
                }
            }
        }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text/plain');
    const urlRegex = /^(http|https):\/\/[^ "]+$/;

    if (urlRegex.test(text)) {
        e.preventDefault();
        document.execCommand('insertHTML', false, `<a href="${text}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${text}</a>`);
        handleContentInput();
    }
  };

  const createNote = () => {
    const newId = Date.now().toString();
    const newNote = { id: newId, title: '無題のメモ', content: '<div></div>', updated: new Date().toLocaleString() };
    setNotes([newNote, ...notes]);
    setActiveId(newId);
    setIsMobileListVisible(false);
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm('このメモを削除しますか？')) {
        const newNotes = notes.filter(n => n.id !== id);
        setNotes(newNotes);
        if (activeId === id) {
            setActiveId(newNotes[0]?.id || '');
            setIsMobileListVisible(true);
        }
    }
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
      handleContentInput();
  };

  const handleLinkSubmit = () => {
    restoreSelection();
    if (linkUrl) {
        const html = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${linkText || linkUrl}</a>`;
        document.execCommand('insertHTML', false, html);
        handleContentInput();
    }
    setShowLinkDialog(false);
    setLinkText('');
    setLinkUrl('');
  };

  const openLinkDialog = () => {
      saveSelection();
      const selection = window.getSelection();
      if(selection && !selection.isCollapsed) {
          setLinkText(selection.toString());
      }
      setShowLinkDialog(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 h-[calc(100vh-140px)] flex flex-col pb-4">
      <div className="flex-1 bg-white dark:bg-dark-lighter rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex">
        {/* Sidebar */}
        <div className={`w-full md:w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col ${isMobileListVisible ? 'block' : 'hidden md:flex'}`}>
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
                <h3 className="font-black text-gray-700 dark:text-white flex items-center gap-2"><ListTree size={18}/> メモ一覧</h3>
                <button onClick={createNote} className="p-2 bg-lime-500 text-white rounded-lg hover:bg-lime-600 transition-colors shadow-lg shadow-lime-200 dark:shadow-none"><FilePlus size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {notes.map(note => (
                    <div 
                        key={note.id}
                        onClick={() => setActiveId(note.id)}
                        className={`p-3 rounded-xl cursor-pointer transition-all border ${activeId === note.id ? 'bg-white dark:bg-gray-700 border-lime-500 shadow-md' : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <h4 className={`font-bold text-sm truncate ${activeId === note.id ? 'text-lime-700 dark:text-lime-400' : 'text-gray-700 dark:text-gray-300'}`}>{note.title || '無題のメモ'}</h4>
                            <button onClick={(e) => deleteNote(note.id, e)} className="text-gray-400 hover:text-red-500 p-1"><X size={14}/></button>
                        </div>
                        <p className="text-[10px] text-gray-400">{note.updated}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Editor Area */}
        <div className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-dark-lighter ${!isMobileListVisible ? 'block' : 'hidden md:flex'}`}>
            {activeNote ? (
                <>
                    <div className="p-2 md:p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 md:gap-4 shrink-0 overflow-x-auto no-scrollbar">
                        <button onClick={() => setIsMobileListVisible(true)} className="md:hidden p-2 text-gray-500"><ArrowLeft size={20}/></button>
                        <input 
                            type="text" 
                            value={activeNote.title} 
                            onChange={(e) => updateTitle(e.target.value)} 
                            className="flex-1 text-lg font-bold bg-transparent outline-none dark:text-white min-w-[100px]"
                            placeholder="タイトルを入力..."
                        />
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                            <button onClick={() => execCmd('bold')} className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors" title="太字"><Bold size={16}/></button>
                            <button onClick={() => execCmd('formatBlock', 'H2')} className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors" title="見出し"><Heading size={16}/></button>
                            <button onClick={() => execCmd('insertUnorderedList')} className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors" title="リスト"><List size={16}/></button>
                            <button onClick={() => execCmd('formatBlock', 'PRE')} className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors" title="コード"><Code size={16}/></button>
                            <button onClick={() => execCmd('formatBlock', 'BLOCKQUOTE')} className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors" title="引用"><Quote size={16}/></button>
                            <button onClick={openLinkDialog} className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors" title="リンク"><LinkIcon size={16}/></button>
                            
                            <div className="relative">
                                <button 
                                    ref={colorButtonRef}
                                    onClick={() => {
                                        const rect = colorButtonRef.current?.getBoundingClientRect();
                                        if (rect) setPickerPos({ top: rect.bottom + 5, left: rect.left });
                                        setShowColorPicker(!showColorPicker);
                                    }} 
                                    className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors flex items-center gap-1"
                                >
                                    <Palette size={16}/> <ChevronDown size={12}/>
                                </button>
                                {showColorPicker && pickerPos && createPortal(
                                    <div 
                                        className="fixed bg-white dark:bg-gray-800 shadow-xl rounded-xl p-3 border border-gray-100 dark:border-gray-700 grid grid-cols-4 gap-2 z-[9999]"
                                        style={{ top: pickerPos.top, left: pickerPos.left }}
                                        onMouseLeave={() => setShowColorPicker(false)}
                                    >
                                        {PRESET_COLORS.map(c => (
                                            <button 
                                                key={c.color} 
                                                onClick={() => { execCmd('foreColor', c.color); setShowColorPicker(false); }} 
                                                className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform" 
                                                style={{ backgroundColor: c.color }}
                                                title={c.label}
                                            />
                                        ))}
                                        <button onClick={() => { execCmd('removeFormat'); setShowColorPicker(false); }} className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform flex items-center justify-center text-gray-400" title="書式クリア"><Eraser size={12}/></button>
                                    </div>,
                                    document.body
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto relative">
                        <div 
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            className="w-full h-full p-6 outline-none prose dark:prose-invert max-w-none [&_pre]:bg-gray-800 [&_pre]:text-white [&_pre]:p-4 [&_pre]:rounded-lg [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic"
                            onInput={handleContentInput}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                        />
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <FilePlus size={32}/>
                    </div>
                    <p className="font-bold">メモを選択するか、新規作成してください</p>
                </div>
            )}
        </div>
      </div>

      {showLinkDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-sm border border-gray-100 dark:border-gray-700 animate-scale-up">
                  <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><LinkIcon size={18}/> リンクを挿入</h3>
                  <div className="space-y-3">
                      <div>
                          <label className="text-xs font-bold text-gray-500 mb-1 block">表示テキスト</label>
                          <input type="text" value={linkText} onChange={e => setLinkText(e.target.value)} className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-900 dark:border-gray-700 text-sm" placeholder="リンクのタイトル" />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 mb-1 block">URL</label>
                          <input type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-900 dark:border-gray-700 text-sm" placeholder="https://example.com" autoFocus />
                      </div>
                      <div className="flex gap-2 pt-2">
                          <button onClick={() => setShowLinkDialog(false)} className="flex-1 py-2.5 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">キャンセル</button>
                          <button onClick={handleLinkSubmit} disabled={!linkUrl} className="flex-1 py-2.5 bg-lime-500 text-white font-bold rounded-xl hover:bg-lime-600 disabled:opacity-50 transition-colors shadow-lg shadow-lime-200 dark:shadow-none">挿入</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Notepad;