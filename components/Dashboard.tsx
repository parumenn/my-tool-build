
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tool } from '../types';
import { TOOLS } from '../constants/toolsData';
import { ArrowRight, Plus, Check, ShieldCheck, Search, Info } from 'lucide-react';

interface DashboardProps {
  addedToolIds: string[];
  onToggleAdded: (id: string) => void;
  onReorder: (newOrder: string[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ addedToolIds, onToggleAdded, onReorder }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const myApps = addedToolIds
    .map(id => TOOLS.find(t => t.id === id))
    .filter((t): t is Tool => t !== undefined);

  const otherTools = TOOLS.filter(t => !addedToolIds.includes(t.id)).filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedMyApps = searchTerm 
    ? myApps.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : myApps;

  const renderToolCard = (tool: Tool, isAddedGroup: boolean) => {
     return (
        <div key={tool.id} className="group relative bg-white dark:bg-dark-lighter rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col min-h-[140px] md:min-h-[180px]">
          <div className="flex justify-between items-start mb-3 md:mb-4">
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center ${tool.lightBg} dark:bg-gray-800 ${tool.color}`}>
              <tool.icon size={24} className="md:w-7 md:h-7" />
            </div>
            <button 
              onClick={(e) => { e.preventDefault(); onToggleAdded(tool.id); }}
              className={`p-2.5 md:p-3 rounded-full border-2 transition-all ${addedToolIds.includes(tool.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 dark:bg-gray-700 border-gray-100 dark:border-gray-600 text-gray-400 hover:text-blue-500'}`}
            >
              {addedToolIds.includes(tool.id) ? <Check size={16} /> : <Plus size={16} />}
            </button>
          </div>
          
          <Link to={tool.path} className="flex-1 block">
            <h3 className="text-sm md:text-lg font-black text-gray-800 dark:text-gray-100 mb-1 leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
              {tool.name}
            </h3>
            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 md:line-clamp-3">
              {tool.description}
            </p>
          </Link>
          
          <Link to={tool.path} className="mt-3 md:mt-4 inline-flex items-center text-[10px] md:text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
            Open <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>
     );
  };

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="mb-8 text-center px-4">
        <h2 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white mb-3">ダッシュボード</h2>
        <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-2xl text-emerald-700 dark:text-emerald-300 text-[10px] md:text-xs font-black border border-emerald-100 dark:border-emerald-800 mb-6">
           <ShieldCheck size={14} /> <span>データはブラウザ内にのみ保存されます</span>
        </div>
        
        <div className="relative max-w-md mx-auto">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
           <input type="text" className="block w-full pl-12 pr-6 py-4 border-2 border-gray-100 dark:border-gray-700 rounded-2xl bg-white dark:bg-dark-lighter text-[16px] text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 shadow-sm transition-all" placeholder="ツールを検索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="px-4 space-y-12">
        <section>
          <h3 className="text-lg md:text-xl font-black text-gray-800 dark:text-gray-200 mb-5 flex items-center gap-2 px-2">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span> マイアプリ
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayedMyApps.length > 0 ? displayedMyApps.map((tool) => renderToolCard(tool, true)) : (
                  <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-sm">
                      {searchTerm ? '見つかりませんでした' : '下のリストからアプリを追加してください'}
                  </div>
              )}
          </div>
        </section>

        <section>
           <h3 className="text-lg md:text-xl font-black text-gray-800 dark:text-gray-200 mb-5 flex items-center gap-2 px-2">
               <span className="w-1.5 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></span> 全ツール
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {otherTools.map((tool) => renderToolCard(tool, false))}
            </div>
        </section>

        <section className="animate-fade-in pt-8">
          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Info className="text-blue-500" size={24} /> 
              まいつーるについて
            </h3>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              「まいつーる」は、登録不要・インストール不要で使える無料のWebツール集です。
              QRコード作成、家計簿、PDF編集、画像変換、パスワード生成など、日常や業務で役立つ40種類以上のツールをブラウザひとつで利用できます。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm md:text-base text-gray-600 dark:text-gray-300">
              <div className="bg-white/50 dark:bg-dark-lighter/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full"></span> 主な機能カテゴリ
                </h4>
                <ul className="list-disc list-inside space-y-1.5 ml-1 opacity-90">
                  <li>開発者向けツール（JSON整形、Base64、正規表現、SQL）</li>
                  <li>画像・PDF編集（リサイズ、形式変換、結合、透かし）</li>
                  <li>生活便利ツール（家計簿、タイマー、単位変換、QRコード）</li>
                  <li>ネットワーク（IP確認、スピードテスト、ポート開放確認）</li>
                </ul>
              </div>
              <div className="bg-white/50 dark:bg-dark-lighter/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-emerald-500 rounded-full"></span> 安心のセキュリティ
                </h4>
                <p className="leading-relaxed opacity-90">
                  当サイトの多くのツール（画像加工、家計簿、メモなど）は、データ処理をすべてお使いのブラウザ内（クライアントサイド）で行います。
                  サーバーにファイルをアップロードしたり、個人情報を保存したりすることはありません。
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
