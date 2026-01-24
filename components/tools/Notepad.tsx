import React, { useState, useEffect, useRef } from 'react';
import { Save, Trash2, Bold, List, Type, Link as LinkIcon, Code, Quote, Palette, Heading, CheckSquare, ChevronRight, Eraser, ChevronDown, FilePlus, X, CornerDownLeft } from 'lucide-react';

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
    return saved ? JSON.parse(saved) : [{id: '1', title: 'Welcome Note', content: '<div><b>ようこそ！</b></div><div>高機能なオンラインメモ帳へ。</div><ul><li>リッチテキスト対応</li><li>Tabキーでインデント</li></ul><pre><code>// コードブロックの例\nconsole.log("Hello World");</code></pre><details open><summary>トグルの例</summary><div><ul><li>Enter連打で脱出可能</li><li>空の状態でBackspaceで削除</li></ul></div></details>', updated: new Date().toLocaleString()}];
  });
  const [activeId, setActiveId] = useState<string>(notes[0]?.id || '');
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Link Dialog State
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const savedRange = useRef<Range | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
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
                // Initial highlight
                requestAnimationFrame(() => applyHighlighting(true));
            }
        } else {
            editorRef.current.innerHTML = '';
        }
    }
  }, [activeId]);

  // Auto Highlighting Logic: Runs on note content update (debounced)
  useEffect(() => {
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      
      // Delay highlighting to ensure user isn't actively typing inside the block
      highlightTimeoutRef.current = window.setTimeout(() => {
          applyHighlighting(false); 
      }, 1500); // 1.5s debounce

      return () => {
          if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      };
  }, [notes]);

  const activeNote = notes.find(n => n.id === activeId);

  const updateTitle = (val: string) => {
    setNotes(prev => prev.map(n => n.id === activeId ? {...n, title: val, updated: new Date().toLocaleString()} : n));
  };

  const handleContentInput = () => {
      if (editorRef.current) {
          const content = editorRef.current.innerHTML;
          
          // Debounce save
          if (savingRef.current) clearTimeout(savingRef.current);
          savingRef.current = window.setTimeout(() => {
              setNotes(prev => prev.map(n => n.id === activeId ? {...n, content: content, updated: new Date().toLocaleString()} : n));
          }, 1000);
      }
  };

  const getBlockParent = (node: Node | null): HTMLElement | null => {
     while (node && node !== editorRef.current) {
         if (node.nodeType === 1 && ['DIV','P','LI','H1','H2','H3','BLOCKQUOTE'].includes((node as HTMLElement).tagName)) {
             return node as HTMLElement;
         }
         node = node.parentNode;
     }
     return null;
  };

  // Handle special key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // TAB Key: Indent/Outdent
    if (e.key === 'Tab') {
      e.preventDefault();
      const selection = window.getSelection();
      if (!selection?.rangeCount) return;
      
      const anchorNode = selection.anchorNode;
      const element = anchorNode?.nodeType === 1 ? (anchorNode as HTMLElement) : anchorNode?.parentElement;
      const pre = element?.closest('pre');
      
      if (pre) {
         // In code block: Insert spaces
         document.execCommand('insertText', false, '  ');
      } else {
         // Normal text: Indent/Outdent
         document.execCommand(e.shiftKey ? 'outdent' : 'indent');
      }
      handleContentInput();
      return;
    }

    // ENTER Key: Toggle Break-out Logic
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (!selection?.rangeCount) return;
      
      const anchorNode = selection.anchorNode;
      const element = anchorNode?.nodeType === 1 ? (anchorNode as HTMLElement) : anchorNode?.parentElement;
      const details = element?.closest('details');
      
      if (details) {
        const summary = element?.closest('summary');
        
        // 1. Enter in Summary -> Move to content
        if (summary) {
            e.preventDefault();
            if (!details.open) details.open = true;
            
            // Find or create content container (div)
            let contentDiv = Array.from(details.children).find(c => c.tagName === 'DIV') as HTMLElement;
            if (!contentDiv) {
                contentDiv = document.createElement('div');
                contentDiv.innerHTML = '<div><br></div>';
                details.appendChild(contentDiv);
            }
            
            // Move cursor to start of content
            const range = document.createRange();
            range.selectNodeContents(contentDiv);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            return;
        }
        
        // 2. Enter in Content -> Check for empty line to break out
        const currentBlock = getBlockParent(anchorNode);
        // Check if block is visually empty
        const isEmpty = currentBlock && (currentBlock.innerText.trim() === '' && !currentBlock.querySelector('img'));
        
        // Allow breaking out if empty line inside details content
        if (isEmpty) {
            e.preventDefault();
            currentBlock.remove(); // Remove the empty line inside
            
            // Insert new line AFTER details
            const newBlock = document.createElement('div');
            newBlock.innerHTML = '<br>';
            details.insertAdjacentElement('afterend', newBlock);
            
            // Move cursor there
            const range = document.createRange();
            range.setStart(newBlock, 0);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            handleContentInput();
            return;
        }
      }
    }

    // BACKSPACE Key: Toggle Deletion
    if (e.key === 'Backspace') {
       const selection = window.getSelection();
       if (selection?.isCollapsed) {
           const anchorNode = selection.anchorNode;
           const element = anchorNode?.nodeType === 1 ? (anchorNode as HTMLElement) : anchorNode?.parentElement;
           const summary = element?.closest('summary');
           
           // If in summary and empty, delete the whole details block
           if (summary && summary.textContent?.trim() === '') {
               e.preventDefault();
               const details = summary.parentElement;
               // Create a replacement paragraph so focus isn't lost completely
               const replacement = document.createElement('div');
               replacement.innerHTML = '<br>';
               details?.replaceWith(replacement);
               
               // Focus replacement
               const range = document.createRange();
               range.setStart(replacement, 0);
               range.collapse(true);
               selection.removeAllRanges();
               selection.addRange(range);
               handleContentInput();
               return;
           }
       }
    }
  };

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
                 const prevLen = htmlBlock.getAttribute('data-len');
                 
                 if (forceAll || prevLen !== String(currentText.length) || !htmlBlock.hasAttribute('data-highlighted')) {
                     htmlBlock.textContent = currentText; 
                     htmlBlock.removeAttribute('data-highlighted');
                     window.hljs.highlightElement(htmlBlock);
                     htmlBlock.setAttribute('data-highlighted', 'yes');
                     htmlBlock.setAttribute('data-len', String(currentText.length));
                 }
              }
          });
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

  const setFormatBlock = (tag: string) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const parentBlock = selection.anchorNode?.parentElement?.closest(tag);
      if (parentBlock) {
          document.execCommand('formatBlock', false, 'DIV');
      } else {
          document.execCommand('formatBlock', false, tag);
      }
      editorRef.current?.focus();
      handleContentInput();
  };

  const toggleQuote = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const anchorNode = selection.anchorNode;
      const element = anchorNode?.nodeType === 1 ? (anchorNode as HTMLElement) : anchorNode?.parentElement;
      const blockquote = element?.closest('blockquote');
      
      if (blockquote) {
          document.execCommand('formatBlock', false, 'DIV');
      } else {
          document.execCommand('formatBlock', false, 'BLOCKQUOTE');
      }
      editorRef.current?.focus();
      handleContentInput();
  };

  // --- Link Dialog Handlers ---
  const openLinkDialog = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
          // Save the selection range to restore it later
          savedRange.current = selection.getRangeAt(0).cloneRange();
          setLinkText(selection.toString());
      } else {
          savedRange.current = null;
          setLinkText('');
      }
      setLinkUrl('https://');
      setShowLinkDialog(true);
  };

  const confirmLink = () => {
      // Restore selection
      if (editorRef.current) {
          editorRef.current.focus();
          const selection = window.getSelection();
          if (selection) {
              selection.removeAllRanges();
              if (savedRange.current) {
                  selection.addRange(savedRange.current);
              }
          }
      }
      
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

      // Handle collapsed selection (cursor only) -> Select current block
      if (selection.isCollapsed) {
          const anchorNode = selection.anchorNode;
          const block = getBlockParent(anchorNode);
          if (block) {
              const newRange = document.createRange();
              newRange.selectNode(block);
              selection.removeAllRanges();
              selection.addRange(newRange);
          } else if (anchorNode && anchorNode.parentNode === editorRef.current && anchorNode.nodeType === 3) {
              const newRange = document.createRange();
              newRange.selectNode(anchorNode);
              selection.removeAllRanges();
              selection.addRange(newRange);
          }
      }

      // Get text
      const text = window.getSelection()?.toString() || '';
      const escapedText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const codeContent = escapedText || '// コードを入力';
      
      const html = `<pre><code class="language-javascript">${codeContent}</code></pre><p><br/></p>`;
      document.execCommand('insertHTML', false, html);
      handleContentInput();
  };

  const insertToggle = () => {
      const html = `<details><summary>トグル見出し</summary><div>詳細内容をここに記述</div></details><p><br/></p>`;
      document.execCommand('insertHTML', false, html);
      handleContentInput();
  };

  const insertChecklist = () => {
      const html = `<div><input type="checkbox" style="margin-right: 5px;"> TODOアイテム</div>`;
      document.execCommand('insertHTML', false, html);
      handleContentInput();
  };

  const clearFormat = () => {
      document.execCommand('removeFormat');
      document.execCommand('formatBlock', false, 'DIV');
      handleContentInput();
  };

  const applyColor = (color: string) => {
      execCmd('foreColor', color);
      setShowColorPicker(false);
  };

  const preventFocusLoss = (e: React.MouseEvent) => {
      e.preventDefault();
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 relative">
      {/* Link Dialog */}
      {showLinkDialog && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-2xl">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-80 animate-fade-in">
                  <h3 className="font-bold text-gray-800 dark:text-white mb-4">リンクを挿入</h3>
                  <div className="space-y-3">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">表示テキスト</label>
                          <input 
                            type="text" 
                            value={linkText} 
                            onChange={(e) => setLinkText(e.target.value)}
                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                            placeholder="リンクのタイトル"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">URL</label>
                          <input 
                            type="text" 
                            value={linkUrl} 
                            onChange={(e) => setLinkUrl(e.target.value)}
                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                            placeholder="https://example.com"
                          />
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
      <div className="w-full md:w-64 bg-white dark:bg-dark-lighter rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden shrink-0">
         <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-bold text-gray-700 dark:text-gray-200">メモ一覧</h3>
            <button onClick={createNote} className="text-lime-600 hover:bg-lime-50 dark:hover:bg-lime-900/30 p-2 rounded-lg transition-colors" title="新規メモ作成">
               <FilePlus size={20} />
            </button>
         </div>
         <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {notes.map(note => (
               <div 
                 key={note.id}
                 onClick={() => setActiveId(note.id)}
                 className={`p-3 rounded-xl cursor-pointer transition-colors group relative ${activeId === note.id ? 'bg-lime-50 dark:bg-lime-900/20 border border-lime-200 dark:border-lime-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'}`}
               >
                  <div className="font-bold text-gray-800 dark:text-gray-200 truncate pr-6">{note.title || '無題'}</div>
                  <div className="text-xs text-gray-400 mt-1">{note.updated}</div>
                  <button 
                    onClick={(e) => deleteNote(note.id, e)}
                    className="absolute right-2 top-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
               </div>
            ))}
         </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 bg-white dark:bg-dark-lighter rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
         {activeNote ? (
            <>
               <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                  <input 
                    type="text" 
                    value={activeNote.title} 
                    onChange={(e) => updateTitle(e.target.value)}
                    className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 text-gray-800 dark:text-white placeholder-gray-300 outline-none"
                    placeholder="タイトルを入力"
                  />
                  
                  {/* Toolbar */}
                  <div className="flex flex-wrap gap-1 items-center bg-gray-50 dark:bg-gray-800 p-1.5 rounded-lg transition-all">
                      <button onMouseDown={preventFocusLoss} onClick={() => execCmd('bold')} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="太字"><Bold size={16} /></button>
                      
                      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
                      
                      <button onMouseDown={preventFocusLoss} onClick={() => setFormatBlock('H2')} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 flex items-center gap-1" title="大見出し (H2)"><Heading size={16} /><span className="text-xs font-bold">L</span></button>
                      <button onMouseDown={preventFocusLoss} onClick={() => setFormatBlock('H3')} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 flex items-center gap-1" title="小見出し (H3)"><Heading size={14} /><span className="text-[10px] font-bold">S</span></button>
                      
                      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
                      
                      <button onMouseDown={preventFocusLoss} onClick={() => execCmd('insertUnorderedList')} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="箇条書き"><List size={16} /></button>
                      <button onMouseDown={preventFocusLoss} onClick={insertChecklist} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="ToDoリスト"><CheckSquare size={16} /></button>
                      <button onMouseDown={preventFocusLoss} onClick={insertToggle} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="トグル (詳細)"><ChevronRight size={16} /></button>
                      
                      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
                      
                      <button onMouseDown={preventFocusLoss} onClick={toggleQuote} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="引用"><Quote size={16} /></button>
                      <button onMouseDown={preventFocusLoss} onClick={insertCodeBlock} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="コードブロック挿入 (選択範囲を適用)"><Code size={16} /></button>
                      <button onMouseDown={preventFocusLoss} onClick={openLinkDialog} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="リンク挿入"><LinkIcon size={16} /></button>
                      
                      {/* Color Palette Picker */}
                      <div className="relative">
                          <button 
                            onMouseDown={preventFocusLoss}
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 flex items-center gap-1" 
                            title="文字色"
                          >
                              <Palette size={16} />
                              <ChevronDown size={10} />
                          </button>
                          
                          {showColorPicker && (
                              <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 grid grid-cols-4 gap-2 w-48 animate-fade-in">
                                  {PRESET_COLORS.map((c) => (
                                      <button
                                        key={c.color}
                                        onMouseDown={preventFocusLoss}
                                        onClick={() => applyColor(c.color)}
                                        className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: c.color }}
                                        title={c.label}
                                      />
                                  ))}
                                  {/* Custom Color Input wrapped in a button-like style */}
                                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform cursor-pointer bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500">
                                      <input 
                                        type="color" 
                                        onChange={(e) => applyColor(e.target.value)} 
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                                        title="カスタム"
                                      />
                                  </div>
                              </div>
                          )}
                      </div>

                      <button onMouseDown={preventFocusLoss} onClick={clearFormat} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded text-gray-400 hover:text-red-500 ml-auto" title="書式クリア"><Eraser size={16} /></button>
                  </div>
               </div>

               <div className="flex-1 relative overflow-hidden">
                  <style>{`
                    .prose b, .prose strong { font-weight: bold !important; }
                    .prose details { 
                        border: 1px solid #e5e7eb; 
                        border-radius: 0.5rem; 
                        padding: 0.5rem; 
                        margin-bottom: 0.5rem; 
                        background-color: #f9fafb;
                    }
                    .dark .prose details { 
                        border-color: #374151; 
                        background-color: #1f2937;
                    }
                    .prose details > div {
                        margin-top: 0.5rem;
                        padding-left: 1rem;
                        border-left: 2px solid #e5e7eb;
                    }
                    .dark .prose details > div {
                        border-left-color: #4b5563;
                    }
                    .prose details:focus, .prose summary:focus { outline: none !important; }
                    .prose summary { cursor: pointer; font-weight: bold; list-style: none; }
                    .prose summary::-webkit-details-marker { display: none; }
                    .prose summary::before { content: '▶'; display: inline-block; margin-right: 0.5rem; transition: transform 0.2s; font-size: 0.8em; }
                    .prose details[open] summary::before { transform: rotate(90deg); }
                    .prose pre { padding: 1em; background: #1e1e1e; color: #d4d4d4; border-radius: 0.5rem; font-family: monospace; }
                    .prose code { color: inherit; background: transparent; font-family: monospace; }
                  `}</style>
                  <div 
                    ref={editorRef}
                    contentEditable
                    onInput={handleContentInput}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    className="w-full h-full p-6 outline-none overflow-y-auto text-gray-800 dark:text-gray-200 prose dark:prose-invert max-w-none"
                    style={{ minHeight: '100%' }}
                    spellCheck={false}
                  />
                  <div className="absolute bottom-4 right-4 text-xs text-gray-300 pointer-events-none flex items-center gap-1 bg-white/80 dark:bg-black/50 px-2 py-1 rounded">
                     <Save size={12} /> 自動保存済み
                  </div>
               </div>
            </>
         ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
               メモを選択または作成してください
            </div>
         )}
      </div>
    </div>
  );
};

export default Notepad;