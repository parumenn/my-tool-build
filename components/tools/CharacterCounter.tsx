import React, { useState, useMemo, useRef } from 'react';
import { AlignLeft, X, Upload, FileText, Trash2, Download, ToggleLeft, ToggleRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface FileStat {
  id: string;
  name: string;
  total: number;
  noSpace: number;
  lines: number;
}

const CharacterCounter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  
  // Single Mode State
  const [text, setText] = useState('');
  const [ignoreSpaces, setIgnoreSpaces] = useState(false);

  // Bulk Mode State
  const [files, setFiles] = useState<FileStat[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single Mode Stats
  const stats = useMemo(() => {
    const total = text.length;
    const noSpace = text.replace(/\s/g, '').length;
    const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
    
    // Character type analysis
    const hiragana = (text.match(/[\u3040-\u309F]/g) || []).length;
    const katakana = (text.match(/[\u30A0-\u30FF]/g) || []).length;
    const kanji = (text.match(/[\u4E00-\u9FAF]/g) || []).length;
    const other = total - (hiragana + katakana + kanji);

    return { total, noSpace, lines, distribution: [
      { name: 'ひらがな', value: hiragana, color: '#3b82f6' },
      { name: 'カタカナ', value: katakana, color: '#8b5cf6' },
      { name: '漢字', value: kanji, color: '#10b981' },
      { name: 'その他', value: other, color: '#94a3b8' },
    ]};
  }, [text]);

  // Bulk Mode Handlers
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setIsProcessing(true);
    const newFiles: FileStat[] = [];
    
    for (const file of Array.from(e.target.files) as File[]) {
       try {
          const content = await file.text();
          const total = content.length;
          const noSpace = content.replace(/\s/g, '').length;
          const lines = content ? content.split(/\r\n|\r|\n/).length : 0;
          
          newFiles.push({
             id: Math.random().toString(36).substr(2, 9),
             name: file.name,
             total,
             noSpace,
             lines
          });
       } catch (error) {
          console.error(`Failed to read ${file.name}`, error);
       }
    }
    
    setFiles(prev => [...prev, ...newFiles]);
    setIsProcessing(false);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => {
     setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAllFiles = () => {
     if(window.confirm('すべてのファイル結果を削除しますか？')) {
        setFiles([]);
     }
  };

  const downloadCsv = () => {
     if(files.length === 0) return;
     const header = "ファイル名,文字数(空白込),文字数(空白無),行数\n";
     const rows = files.map(f => `"${f.name}",${f.total},${f.noSpace},${f.lines}`).join("\n");
     const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(header + rows);
     const link = document.createElement("a");
     link.href = csvContent;
     link.download = `character_counts_${new Date().toISOString().slice(0,10)}.csv`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
             <button
               onClick={() => setActiveTab('single')}
               className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'single' ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
             >
               テキスト入力
             </button>
             <button
               onClick={() => setActiveTab('bulk')}
               className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'bulk' ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
             >
               <Upload size={14} /> 一括ファイル集計
             </button>
         </div>
      </div>

      {activeTab === 'single' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <AlignLeft className="text-green-500" />
                    文字数カウント
                  </h2>
                  <div className="flex gap-4 items-center">
                    <button 
                        onClick={() => setIgnoreSpaces(!ignoreSpaces)}
                        className={`flex items-center gap-2 text-sm font-bold transition-colors ${ignoreSpaces ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}
                    >
                        {ignoreSpaces ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        空白を無視
                    </button>
                    <button 
                        onClick={() => setText('')}
                        disabled={!text}
                        className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                        <X size={16} /> クリア
                    </button>
                  </div>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="ここにテキストを入力してください..."
                  className="flex-1 w-full min-h-[400px] p-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:border-green-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-green-500 resize-none transition-all text-gray-900 dark:text-white leading-relaxed text-base"
                />
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              {/* Quick Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                <div className={`bg-white dark:bg-dark-lighter rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-all ${!ignoreSpaces ? 'ring-2 ring-green-500' : 'opacity-70'}`}>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">文字数 (空白込)</div>
                  <div className="text-3xl font-bold text-gray-800 dark:text-white">{stats.total.toLocaleString()}</div>
                </div>
                <div className={`bg-white dark:bg-dark-lighter rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-all ${ignoreSpaces ? 'ring-2 ring-green-500' : 'opacity-70'}`}>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">文字数 (空白無視)</div>
                  <div className="text-3xl font-bold text-gray-800 dark:text-white">{stats.noSpace.toLocaleString()}</div>
                </div>
                <div className="bg-white dark:bg-dark-lighter rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 col-span-2 lg:col-span-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">行数</div>
                  <div className="text-3xl font-bold text-gray-800 dark:text-white">{stats.lines.toLocaleString()}</div>
                </div>
              </div>

              {/* Distribution Chart */}
              <div className="bg-white dark:bg-dark-lighter rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-4">文字種別内訳</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.distribution}>
                      <XAxis dataKey="name" tick={{fontSize: 10, fill: '#9ca3af'}} tickLine={false} axisLine={false} />
                      <YAxis hide />
                      <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {stats.distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
      ) : (
          <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 min-h-[600px] flex flex-col">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                   <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <FileText className="text-green-500" />
                      一括ファイル集計
                   </h2>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">複数のテキストファイルをアップロードして、それぞれの文字数を一覧表示します。</p>
                </div>
                <div className="flex gap-2">
                   {files.length > 0 && (
                      <>
                        <button onClick={downloadCsv} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-lg text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center gap-2">
                           <Download size={16} /> CSV出力
                        </button>
                        <button onClick={clearAllFiles} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center gap-2">
                           <Trash2 size={16} /> 全削除
                        </button>
                      </>
                   )}
                   <label className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors cursor-pointer flex items-center gap-2 shadow-lg shadow-green-200 dark:shadow-none">
                      <Upload size={16} /> ファイルを追加
                      <input 
                         type="file" 
                         multiple 
                         accept=".txt,.md,.json,.js,.ts,.html,.css,.csv" 
                         onChange={handleBulkUpload}
                         className="hidden"
                         ref={fileInputRef}
                      />
                   </label>
                </div>
             </div>

             <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                   <thead className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white uppercase font-bold">
                      <tr>
                         <th className="p-4 rounded-tl-xl">ファイル名</th>
                         <th className="p-4">文字数 (空白込)</th>
                         <th className="p-4 text-green-600 dark:text-green-400">文字数 (空白無視)</th>
                         <th className="p-4">行数</th>
                         <th className="p-4 rounded-tr-xl w-10"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {files.map((file) => (
                         <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="p-4 font-medium text-gray-900 dark:text-white truncate max-w-[200px]" title={file.name}>{file.name}</td>
                            <td className="p-4 font-mono">{file.total.toLocaleString()}</td>
                            <td className="p-4 font-mono font-bold text-green-600 dark:text-green-400">{file.noSpace.toLocaleString()}</td>
                            <td className="p-4 font-mono">{file.lines.toLocaleString()}</td>
                            <td className="p-4">
                               <button onClick={() => removeFile(file.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                  <X size={16} />
                               </button>
                            </td>
                         </tr>
                      ))}
                      {files.length === 0 && (
                         <tr>
                            <td colSpan={5} className="p-12 text-center text-gray-400">
                               ファイルがありません。「ファイルを追加」からテキストファイルをアップロードしてください。
                            </td>
                         </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
      )}
    </div>
  );
};

export default CharacterCounter;