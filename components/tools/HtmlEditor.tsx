import React, { useState } from 'react';
import { Code, Eye, ShieldCheck, Copy, Check, Eraser } from 'lucide-react';
import DOMPurify from 'dompurify';

const HtmlEditor: React.FC = () => {
  const [htmlCode, setHtmlCode] = useState<string>('<div class="p-4 bg-blue-100 rounded-lg">\n  <h2 class="text-xl font-bold text-blue-700">Hello HTML!</h2>\n  <p class="text-blue-600">ここは安全なプレビューエリアです。</p>\n  <button onclick="alert(\'XSS\')" class="mt-2 px-3 py-1 bg-blue-500 text-white rounded">XSSテストボタン (無効化されます)</button>\n</div>');
  const [copied, setCopied] = useState(false);

  // Sanitize HTML using DOMPurify
  const sanitizeHtml = (dirty: string) => {
    // Handle DOMPurify import: it can be a factory function or an object depending on the build
    // @ts-ignore
    const sanitizer = typeof DOMPurify === 'function' ? DOMPurify(window) : DOMPurify;
    
    return sanitizer.sanitize(dirty, {
        // Allow basic styling attributes but strip scripts
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div', 'ul', 'ol', 'li', 'b', 'i', 'u', 'strong', 'em', 'br', 'hr', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'pre', 'code', 'blockquote', 'button', 'input', 'form', 'label', 'select', 'option'],
        ALLOWED_ATTR: ['class', 'style', 'href', 'src', 'alt', 'title', 'target', 'width', 'height', 'type', 'value', 'placeholder', 'checked', 'selected', 'disabled', 'readonly'],
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex-1 flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Code className="text-orange-600 dark:text-orange-400" />
            HTMLエディタ <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1 font-normal ml-2"><ShieldCheck size={12} /> XSS保護有効</span>
            </h2>
            <div className="flex gap-2">
                <button 
                    onClick={() => setHtmlCode('')} 
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <Eraser size={16} /> クリア
                </button>
                <button 
                    onClick={copyToClipboard} 
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/40 rounded-lg transition-colors"
                >
                    {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'コピー済み' : 'コードをコピー'}
                </button>
            </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden min-h-0">
           {/* Editor Side */}
           <div className="flex flex-col h-full min-h-0">
              <label className="font-bold text-gray-700 dark:text-gray-300 mb-2 block text-sm">HTML Code</label>
              <textarea 
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
                className="flex-1 w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 font-mono text-sm focus:ring-2 focus:ring-orange-400 dark:text-white resize-none"
                placeholder="<div>Hello</div>"
                spellCheck={false}
              />
           </div>

           {/* Preview Side */}
           <div className="flex flex-col h-full min-h-0">
              <label className="font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2 text-sm">
                 <Eye size={16} /> Live Preview (Sanitized)
              </label>
              <div 
                 className="flex-1 w-full p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark text-gray-800 dark:text-gray-200 overflow-y-auto"
              >
                  {/* Tailwind classes will work inside here because Tailwind CDN scans the DOM */}
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlCode) }} />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default HtmlEditor;