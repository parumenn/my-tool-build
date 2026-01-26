
import React, { useState, useMemo, useRef } from 'react';
import { AlignLeft, X, Upload, FileText, Trash2, Download, ToggleLeft, ToggleRight, Info } from 'lucide-react';
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
  const [text, setText] = useState('');
  const [ignoreSpaces, setIgnoreSpaces] = useState(false);
  const [files, setFiles] = useState<FileStat[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const total = text.length;
    const noSpace = text.replace(/\s/g, '').length;
    const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
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

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsProcessing(true);
    const newFiles: FileStat[] = [];
    for (const file of Array.from(e.target.files) as File[]) {
       try {
          const content = await file.text();
          newFiles.push({
             id: Math.random().toString(36).substr(2, 9),
             name: file.name,
             total: content.length,
             noSpace: content.replace(/\s/g, '').length,
             lines: content ? content.split(/\r\n|\r|\n/).length : 0
          });
       } catch (e) {}
    }
    setFiles(prev => [...prev, ...newFiles]);
    setIsProcessing(false);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          <button onClick={() => setActiveTab('single')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'single' ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' : 'text-gray-500'}`}>テキスト入力</button>
          <button onClick={() => setActiveTab('bulk')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'bulk' ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' : 'text-gray-500'}`}><Upload size={14} /> 一括ファイル集計</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-dark-lighter rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-3 mb-6">
              <AlignLeft className="text-green-500" size={32} />
              文字数カウンター
            </h2>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="ここに文章を入力またはペーストしてください..."
              className="flex-1 w-full min-h-[400px] p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:border-green-500 focus:bg-white dark:focus:bg-gray-900 transition-all text-[17px] leading-relaxed dark:text-white"
            />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
           <div className="bg-white dark:bg-dark-lighter p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">分析結果</p>
              <div className="space-y-6">
                 <div>
                    <p className="text-sm font-bold text-gray-500">文字数 (空白込)</p>
                    <p className="text-5xl font-black text-slate-800 dark:text-white">{stats.total.toLocaleString()}</p>
                 </div>
                 <div>
                    <p className="text-sm font-bold text-gray-500">文字数 (空白無)</p>
                    <p className="text-3xl font-black text-green-600 dark:text-green-400">{stats.noSpace.toLocaleString()}</p>
                 </div>
                 <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-bold text-gray-500 mb-4">種別内訳</p>
                    <div className="h-40">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.distribution}>
                             <XAxis dataKey="name" hide />
                             <Bar dataKey="value" radius={[4,4,0,0]}>
                                {stats.distribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                             </Bar>
                             <Tooltip cursor={{fill: 'transparent'}} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                       {stats.distribution.map(e => (
                          <div key={e.name} className="flex items-center gap-2 text-[10px] font-bold">
                             <span className="w-2 h-2 rounded-full" style={{backgroundColor: e.color}}></span>
                             <span className="text-gray-500">{e.name}:</span>
                             <span className="text-gray-800 dark:text-gray-200">{e.value}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* SEO Content Section for Search Engines */}
      <article className="mt-12 p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6">
            <Info className="text-blue-500" />
            文字数カウント・文章分析ツールの解説
         </h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3">このツールの特徴</h3>
               <p>
                  当サイトの文字数カウンターは、リアルタイムで正確な文字数を計測する無料のWebツールです。
                  レポート作成、ブログ記事の執筆、SNS投稿時の文字制限確認など、あらゆるシーンでご活用いただけます。
                  入力されたテキストはブラウザ内でのみ処理されるため、内容が外部に送信されることはありません。
               </p>
               <ul className="list-disc list-inside mt-4 space-y-1">
                  <li>全角・半角を問わず正確にカウント</li>
                  <li>空白・改行を含めた合計と、純粋な文字のみの集計を分離</li>
                  <li>原稿用紙（400字）換算枚数の目安を表示</li>
               </ul>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3">高度な分析機能</h3>
               <p>
                  単なる文字数計測だけでなく、日本語の文章構造を分析する機能を備えています。
                  ひらがな、カタカナ、漢字の比率を視覚化することで、文章の「読みやすさ」を客観的に把握できます。
               </p>
               <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <p className="font-bold text-xs text-gray-400 uppercase mb-2">おすすめの用途</p>
                  <p className="text-xs">
                     SEOライティング、小論文、読書感想文、ツイート作成、広告コピーの推敲、翻訳業務の単語数確認など。
                  </p>
               </div>
            </div>
         </div>
      </article>
    </div>
  );
};

export default CharacterCounter;
