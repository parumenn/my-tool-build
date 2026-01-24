import React, { useState } from 'react';
import { FileType, Eye } from 'lucide-react';

const MarkdownEditor: React.FC = () => {
  const [markdown, setMarkdown] = useState<string>('# Hello Markdown\n\n- Write markdown on the left\n- See preview on the right\n\n```javascript\nconsole.log("Hello");\n```');

  // Simple parser for demo (replace with a real library like react-markdown in production)
  const parseMarkdown = (text: string) => {
    return text
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-4 border-b pb-2">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mb-3 border-b pb-1">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mb-2">$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
      .replace(/\*(.*)\*/gim, '<i>$1</i>')
      .replace(/```([^`]+)```/gim, '<pre class="bg-gray-800 text-white p-4 rounded-lg my-4 overflow-x-auto"><code>$1</code></pre>')
      .replace(/`([^`]+)`/gim, '<code class="bg-gray-100 dark:bg-gray-700 px-1 rounded font-mono text-sm">$1</code>')
      .replace(/\n$/gim, '<br />')
      .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex-1 flex flex-col">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2 shrink-0">
          <FileType className="text-slate-700 dark:text-slate-300" />
          Markdownエディタ
        </h2>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
           <div className="flex flex-col h-full">
              <label className="font-bold text-gray-700 dark:text-gray-300 mb-2 block">Markdown</label>
              <textarea 
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="flex-1 w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 font-mono text-sm focus:ring-2 focus:ring-slate-400 dark:text-white resize-none"
              />
           </div>

           <div className="flex flex-col h-full">
              <label className="font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                 <Eye size={16} /> プレビュー
              </label>
              <div 
                 className="flex-1 w-full p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark text-gray-800 dark:text-gray-200 overflow-y-auto prose dark:prose-invert max-w-none"
                 dangerouslySetInnerHTML={{ __html: parseMarkdown(markdown) }}
              />
           </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;