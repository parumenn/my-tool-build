
import React, { useState } from 'react';
import { Code, Eye, ShieldCheck, Copy, Check, Eraser, Info, Zap } from 'lucide-react';
import DOMPurify from 'dompurify';

const HtmlEditor: React.FC = () => {
  const [htmlCode, setHtmlCode] = useState<string>('<div class="p-4 bg-blue-100 rounded-lg">\n  <h2 class="text-xl font-bold text-blue-700">Hello HTML!</h2>\n  <p class="text-blue-600">ここは安全なプレビューエリアです。</p>\n  <button onclick="alert(\'XSS\')" class="mt-2 px-3 py-1 bg-blue-500 text-white rounded">XSSテストボタン (無効化されます)</button>\n</div>');
  const [copied, setCopied] = useState(false);

  const sanitizeHtml = (dirty: string) => {
    // @ts-ignore
    const sanitizer = typeof DOMPurify === 'function' ? DOMPurify(window) : DOMPurify;
    return sanitizer.sanitize(dirty, {
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
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col min-h-[500px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Code className="text-orange-600 dark:text-orange-400" />
            HTMLエディタ <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1 font-normal ml-2"><ShieldCheck size={12} /> XSS保護有効</span>
            </h2>
            <div className="flex gap-2">
                <button onClick={() => setHtmlCode('')} className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg"><Eraser size={16} /> クリア</button>
                <button onClick={copyToClipboard} className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg">{copied ? <Check size={16} /> : <Copy size={16} />} コピー</button>
            </div>
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[400px]">
           <div className="flex flex-col h-full gap-2">
              <label className="font-bold text-gray-700 dark:text-gray-300 text-sm">HTML Code</label>
              <textarea value={htmlCode} onChange={(e) => setHtmlCode(e.target.value)} className="flex-1 w-full p-4 rounded-xl border dark:bg-gray-800 dark:text-white font-mono text-sm" spellCheck={false} />
           </div>
           <div className="flex flex-col h-full gap-2">
              <label className="font-bold text-gray-700 dark:text-gray-300 text-sm flex items-center gap-2"><Eye size={16} /> Live Preview (Sanitized)</label>
              <div className="flex-1 w-full p-6 rounded-xl border bg-white dark:bg-dark overflow-y-auto"><div dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlCode) }} /></div>
           </div>
        </div>
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />オンラインHTMLエディタの活用と安全性</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-orange-500" />即時のライブプレビュー</h3>
               <p>コードを入力した瞬間に表示結果を確認できるため、ブログの装飾やLPの部品制作に最適です。Tailwind CSSのCDNを読み込んでいるため、ユーティリティクラスを直接記述してデザインを調整することも可能です。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-orange-500" />サンドボックス環境で安全にテスト</h3>
               <p>当エディタには、強力なサニタイズ（DOMPurify）が施されています。悪意のあるスクリプト実行を防止しつつ、主要なHTMLタグやスタイルを安全にテストできます。コーディング学習や、断片的なHTMLパーツの検証用として安心してご利用ください。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default HtmlEditor;
