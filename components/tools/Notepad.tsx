
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Save, Trash2, Bold, List, Type, Link as LinkIcon, Code, Quote, Palette, Heading, CheckSquare, ChevronRight, Eraser, ChevronDown, FilePlus, X, CornerDownLeft, ArrowLeft, Zap, ShieldCheck, Info, ListTree } from 'lucide-react';

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

  const setFormatBlock = (tag: string) => {
      document.execCommand('formatBlock', false, tag);
      editorRef.current?.focus();
      handleContentInput();
  };

  const toggleQuote = () => {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      const parent = getBlockParent(selection.anchorNode);
      
      if (parent && parent.tagName === 'BLOCKQUOTE') {
          document.execCommand('formatBlock', false, 'DIV');
      } else {
          document.execCommand('formatBlock', false, 'BLOCKQUOTE');
      }
      editorRef.current?.focus();
      handleContentInput();
  };

  const openLinkDialog = () => {
      saveSelection();
      const selection = window.getSelection();
      if (selection && selection.toString()) {
          setLinkText(selection.toString());
      } else {
          setLinkText('');
      }
      setLinkUrl('https://');
      setShowLinkDialog(true);
  };

  const confirmLink = () => {
      restoreSelection();
      if (linkUrl) {
          const textToUse = linkText || linkUrl;
          const html = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${textToUse}</a>`;
          document.execCommand('insertHTML', false, html);
          handleContentInput();
      }
      setShowLinkDialog(false);
  };

  const insertCodeBlock = () => {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const parent = getBlockParent(selection.anchorNode);
      const text = selection.toString();

      const startTag = '<pre><code>';
      const endTag = '</code></pre><p><br/></p>';

      if (text.length > 0) {
          const codeHtml = `${startTag}${text}${endTag}`;
          document.execCommand('insertHTML', false, codeHtml);
      } else if (parent && parent.innerText.trim().length > 0 && parent.tagName !== 'PRE' && parent !== editorRef.current) {
          const newRange = document.createRange();
          newRange.selectNodeContents(parent);
          selection.removeAllRanges();
          selection.addRange(newRange);
          const codeHtml = `${startTag}${parent.innerText}${endTag}`;
          document.execCommand('insertHTML', false, codeHtml);
      } else {
          const html = `${startTag}<br>${endTag}`;
          document.execCommand('insertHTML', false, html);
      }
      handleContentInput();
  };

  const insertChecklist = () => {
      const html = `<div><input type="checkbox" style="margin-right: 5px;"> </div>`;
      document.execCommand('insertHTML', false, html);
      handleContentInput();
  };

  const insertToggle = () => {
      const html = `<details><summary>トグル項目</summary><div class="toggle-content"><div><br></div></div></details><p><br/></p>`;
      document.execCommand('insertHTML', false, html);
      handleContentInput();
  };

  const clearFormat = () => {
      document.execCommand('removeFormat');
      document.execCommand('formatBlock', false, 'DIV');
      handleContentInput();
  };

  const applyColor = (color: string) => {
      restoreSelection();
      document.execCommand('foreColor', false, color);
      setShowColorPicker(false);
      handleContentInput();
  };

  const toggleColorPicker = () => {
      if (!showColorPicker) {
          saveSelection();
          if (colorButtonRef.current) {
              const rect = colorButtonRef.current.getBoundingClientRect();
              let top = rect.bottom + 10;
              let left = rect.left;
              if (left + 220 > window.innerWidth) {
                  left = window.innerWidth - 230;
              }
              setPickerPos({ top, left });
          }
          setShowColorPicker(true);
      } else {
          setShowColorPicker(false);
          restoreSelection();
      }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 relative">
        {showLinkDialog && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-2xl">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-80 animate-fade-in">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4">リンクを挿入</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">表示テキスト</label>
                            <input type="text" value={linkText} onChange={(e) => setLinkText(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="リンクのタイトル" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">URL</label>
                            <input type="text" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="https://example.com" />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setShowLinkDialog(false)} className="flex-1 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">キャンセル</button>
                            <button onClick={confirmLink} className="flex-1 py-2 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow">挿入</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Sidebar List */}
        <div className={`w-full md:w-72 bg-white dark:bg-dark-lighter rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden shrink-0 transition-all absolute inset-0 md:relative z-10 ${isMobileListVisible ? 'translate-x-0' : '-translate-x-full md:translate-x-0 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto'}`}>
           <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-bold text-gray-700 dark:text-gray-200">メモ一覧</h3>
              <button onClick={createNote} className="bg-lime-600 hover:bg-lime-700 text-white p-2.5 rounded-xl shadow-lg shadow-lime-100 dark:shadow-none transition-all active:scale-95" title="新規メモ作成">
                 <FilePlus size={18} />
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {notes.length === 0 ? <div className="text-center text-gray-400 mt-10 text-xs">メモがありません</div> : notes.map(note => (
                 <div 
                   key={note.id}
                   onClick={() => setActiveId(note.id)}
                   className={`p-4 rounded-xl cursor-pointer transition-all border ${activeId === note.id ? 'bg-lime-50 dark:bg-lime-900/20 border-lime-200 dark:border-lime-800 shadow-sm' : 'bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent'}`}
                 >
                    <div className="flex justify-between items-start">
                       <div className="font-bold text-gray-800 dark:text-gray-200 truncate pr-2 text-sm">{note.title || '無題のメモ'}</div>
                       <button onClick={(e) => deleteNote(note.id, e)} className="text-gray-300 hover:text-red-500 transition-colors p-1"><Trash2 size={14} /></button>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-2 font-mono">{note.updated}</div>
                 </div>
              ))}

              <article className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none text-xs">
                 <h2 className="text-sm font-black flex items-center gap-2 mb-3"><Info className="text-blue-500" size={16} />Webメモ帳（プレビュー）の機能</h2>
                 <div className="space-y-4 text-gray-600 dark:text-gray-300">
                    <div>
                       <h3 className="font-bold mb-1 flex items-center gap-2 text-gray-800 dark:text-white"><Zap size={14} className="text-lime-600" />シンタックスハイライト</h3>
                       <p>主要言語のコードブロックを自動で色分け表示します。言語は自動検出されます。</p>
                    </div>
                    <div>
                       <h3 className="font-bold mb-1 flex items-center gap-2 text-gray-800 dark:text-white"><ShieldCheck size={14} className="text-lime-600" />ローカル保存</h3>
                       <p>データはブラウザ内に保存されます。サーバーへの送信はありません。</p>
                    </div>
                 </div>
              </article>
           </div>
        </div>

        {/* Editor Area */}
        <div className={`flex-1 bg-white dark:bg-dark-lighter rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden absolute inset-0 md:relative z-20 transition-transform duration-300 ${!isMobileListVisible ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
           {activeNote ? (
              <>
                 <div className="p-2 md:p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-3 bg-white dark:bg-dark-lighter z-30">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsMobileListVisible(true)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><ArrowLeft size={20} /></button>
                        <input 
                          type="text" 
                          value={activeNote.title} 
                          onChange={(e) => updateTitle(e.target.value)}
                          className="flex-1 text-lg md:text-xl font-bold bg-transparent border-none focus:ring-0 text-gray-800 dark:text-white placeholder-gray-300 outline-none"
                          placeholder="タイトルを入力"
                        />
                    </div>
                    
                    {/* Scrollable Toolbar */}
                    <div className="flex overflow-x-auto no-scrollbar pb-1 -mx-2 md:mx-0 px-2 md:px-0">
                        <div className="flex items-center bg-gray-50 dark:bg-gray-800 p-1.5 rounded-xl transition-all shrink-0">
                            <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd('bold')} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300" title="太字"><Bold size={18} /></button>
                            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1.5" />
                            <button onMouseDown={(e) => e.preventDefault()} onClick={() => setFormatBlock('H2')} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 flex items-center gap-1" title="大見出し"><Heading size={18} /><span className="text-[10px] font-bold">L</span></button>
                            <button onMouseDown={(e) => e.preventDefault()} onClick={() => setFormatBlock('H3')} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 flex items-center gap-1" title="小見出し"><Heading size={14} /><span className="text-[10px] font-bold">S</span></button>
                            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1.5" />
                            <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd('insertUnorderedList')} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300" title="箇条書き"><List size={18} /></button>
                            <button onMouseDown={(e) => e.preventDefault()} onClick={insertChecklist} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300" title="ToDoリスト"><CheckSquare size={18} /></button>
                            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1.5" />
                            <button onMouseDown={(e) => e.preventDefault()} onClick={toggleQuote} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300" title="引用"><Quote size={18} /></button>
                            <button onMouseDown={(e) => e.preventDefault()} onClick={insertCodeBlock} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300" title="コードブロック"><Code size={18} /></button>
                            <button onMouseDown={(e) => e.preventDefault()} onClick={insertToggle} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300" title="トグル (折りたたみ)"><ListTree size={18} /></button>
                            <button onMouseDown={(e) => e.preventDefault()} onClick={openLinkDialog} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300" title="リンク"><LinkIcon size={18} /></button>
                            
                            {/* Color Picker with Fixed Positioning via Portal */}
                            <div className="relative">
                                <button ref={colorButtonRef} onMouseDown={(e) => e.preventDefault()} onClick={toggleColorPicker} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 flex items-center gap-1" title="文字色"><Palette size={18} /><ChevronDown size={10} /></button>
                                {showColorPicker && pickerPos && createPortal(
                                    <div 
                                      className="fixed p-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[9999] grid grid-cols-4 gap-2 w-48 animate-fade-in"
                                      style={{ top: pickerPos.top, left: pickerPos.left }}
                                      onMouseDown={(e) => e.preventDefault()}
                                    >
                                        {PRESET_COLORS.map((c) => (
                                            <button 
                                                key={c.color} 
                                                onMouseDown={(e) => e.preventDefault()} 
                                                onClick={() => applyColor(c.color)} 
                                                className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform" 
                                                style={{ backgroundColor: c.color }} 
                                                title={c.label}
                                            />
                                        ))}
                                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform cursor-pointer bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500">
                                            <input 
                                                type="color" 
                                                onChange={(e) => applyColor(e.target.value)} 
                                                onMouseDown={() => saveSelection()}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                                            />
                                        </div>
                                    </div>,
                                    document.body
                                )}
                            </div>
                            <button onMouseDown={(e) => e.preventDefault()} onClick={clearFormat} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-500 ml-2" title="書式クリア"><Eraser size={18} /></button>
                        </div>
                    </div>
                 </div>

                 <div className="flex-1 relative overflow-hidden bg-white dark:bg-dark-lighter">
                    <style>{`
                      .prose pre { 
                          background: #0d1117 !important; 
                          color: #c9d1d9 !important; 
                          padding: 1em; 
                          border-radius: 0.75rem; 
                          font-family: 'Menlo', 'Monaco', monospace !important; 
                          margin: 1em 0; 
                          overflow-x: auto; 
                          border: 1px solid #30363d !important;
                      }
                      .prose code { 
                          font-family: 'Menlo', 'Monaco', monospace !important; 
                          font-size: 0.9em; 
                          background: transparent !important; 
                          color: inherit !important; 
                          padding: 0 !important;
                      }
                      .hljs { display: block; overflow-x: auto; padding: 0.5em; color: #c9d1d9; background: #0d1117; }
                      
                      .hljs-comment, .hljs-quote { color: #8b949e !important; font-style: italic; }
                      .hljs-keyword, .hljs-selector-tag { color: #ff7b72 !important; } 
                      .hljs-doctag, .hljs-literal, .hljs-section { color: #79c0ff !important; }
                      .hljs-string, .hljs-regexp, .hljs-addition, .hljs-attribute, .hljs-meta .hljs-string { color: #a5d6ff !important; } 
                      .hljs-variable, .hljs-template-variable, .hljs-selector-attr, .hljs-selector-pseudo, .hljs-number { color: #79c0ff !important; }
                      .hljs-symbol, .hljs-bullet, .hljs-link, .hljs-meta, .hljs-selector-id { color: #d2a8ff !important; }
                      .hljs-title, .hljs-title.class_, .hljs-class .hljs-title, .hljs-title.function_ { color: #d2a8ff !important; font-weight: bold; } 
                      .hljs-built_in, .hljs-type { color: #ffa657 !important; } 
                      .hljs-attr { color: #79c0ff !important; }
                      .hljs-emphasis { font-style: italic; }
                      .hljs-strong { font-weight: bold; }
                      
                      details { border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.5rem; margin: 0.5rem 0; background-color: #f9fafb; }
                      .dark details { border-color: #374151; background-color: #1f2937; }
                      summary { cursor: pointer; font-weight: bold; outline: none; }
                      
                      .toggle-content { padding-top: 0.5rem; margin-top: 0.5rem; }
                      .dark .toggle-content { border-color: #374151; }

                      .dark .prose { color: #e2e8f0; }
                      .dark .prose h1, .dark .prose h2, .dark .prose h3 { color: #f8fafc; }
                      .dark .prose a { color: #60a5fa; }
                      .dark .prose strong { color: #f1f5f9; }
                      .dark .prose blockquote { border-left-color: #475569; color: #94a3b8; }
                    `}</style>
                    <div 
                      ref={editorRef}
                      contentEditable
                      onInput={handleContentInput}
                      onPaste={handlePaste}
                      onKeyDown={handleKeyDown}
                      className="w-full h-full p-4 md:p-8 outline-none overflow-y-auto text-gray-800 dark:text-gray-200 prose dark:prose-invert max-w-none text-base leading-relaxed"
                      spellCheck={false}
                    />
                    <div className="absolute bottom-4 right-4 text-[10px] text-gray-400 pointer-events-none flex items-center gap-1 bg-white/90 dark:bg-black/60 px-3 py-1.5 rounded-full border dark:border-gray-800 shadow-sm backdrop-blur-sm">
                       <Save size={12} /> 自動保存済み
                    </div>
                 </div>
              </>
           ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
                 <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center"><Type size={32} className="opacity-50" /></div>
                 <p className="text-sm font-bold">メモを選択または作成してください</p>
                 <button onClick={createNote} className="px-6 py-2 bg-lime-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-lime-700 transition-colors">新規作成</button>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Notepad;
