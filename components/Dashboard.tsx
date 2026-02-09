
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tool } from '../types';
import { TOOLS } from '../constants/toolsData';
import { ArrowRight, Plus, Check, ShieldCheck, Search, Info, Zap, Smartphone, Globe } from 'lucide-react';
import AdBanner from './AdBanner';

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
     // 外部/静的ページの場合は <a> タグ、SPA内は <Link> タグを使用
     const LinkComponent: any = tool.isExternal ? 'a' : Link;
     const linkProps = tool.isExternal ? { href: tool.path } : { to: tool.path };

     return (
        <div key={tool.id} className={`group relative bg-white dark:bg-dark-lighter rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${tool.hideOnMobile ? 'hidden md:flex' : 'flex'} flex-col min-h-[140px] md:min-h-[180px]`}>
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
          
          <LinkComponent {...linkProps} className="flex-1 block">
            <h3 className="text-sm md:text-lg font-black text-gray-800 dark:text-gray-100 mb-1 leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
              {tool.name}
            </h3>
            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 md:line-clamp-3">
              {tool.description}
            </p>
          </LinkComponent>
          
          <LinkComponent {...linkProps} className="mt-3 md:mt-4 inline-flex items-center text-[10px] md:text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
            Open <ArrowRight size={14} className="ml-1" />
          </LinkComponent>
        </div>
     );
  };

  return (
    <div className="max-w-6xl mx-auto pb-24">
      {/* イントロダクション・ヒーローセクション */}
      <div className="mb-12 text-center px-4 py-8 bg-gradient-to-b from-white to-gray-50 dark:from-dark-lighter dark:to-dark rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm animate-fade-in">
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">
          ブラウザひとつで、<br className="md:hidden"/>すべて完結。
        </h2>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
          「まいつーる」は、登録不要・インストール不要で使える無料のWebツール集です。<br/>
          QRコード作成、家計簿、PDF編集、画像変換など、40種類以上の便利ツールを最大限安全なローカル処理で提供します。
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mb-8">
           <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm">
              <ShieldCheck className="text-emerald-500" size={18} />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">完全ローカル処理</span>
           </div>
           <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm">
              <Zap className="text-yellow-500" size={18} />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">登録・ログイン不要</span>
           </div>
           <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm">
              <Smartphone className="text-blue-500" size={18} />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">スマホ・PC対応</span>
           </div>
        </div>

        <div className="relative max-w-md mx-auto">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
           <input type="text" className="block w-full pl-12 pr-6 py-4 border-2 border-gray-100 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 text-[16px] text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 shadow-sm transition-all" placeholder="使いたいツールを検索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="px-4 space-y-12">
        {/* マイアプリセクション */}
        <section>
          <h3 className="text-lg md:text-xl font-black text-gray-800 dark:text-gray-200 mb-5 flex items-center gap-2 px-2">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span> マイアプリ (お気に入り)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayedMyApps.length > 0 ? displayedMyApps.map((tool) => renderToolCard(tool, true)) : (
                  <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-sm font-bold">
                      {searchTerm ? '見つかりませんでした' : 'よく使うツールを「＋」ボタンでここに追加できます'}
                  </div>
              )}
          </div>
        </section>

        {/* 全ツールセクション */}
        <section>
           <h3 className="text-lg md:text-xl font-black text-gray-800 dark:text-gray-200 mb-5 flex items-center gap-2 px-2">
               <span className="w-1.5 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></span> すべてのツール
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {otherTools.map((tool) => renderToolCard(tool, false))}
            </div>
        </section>

        {/* 詳細な機能説明（SEO対策・コンテンツボリューム増加） */}
        <section className="animate-fade-in pt-8">
          <div className="bg-gray-50 dark:bg-gray-800/50 p-8 md:p-12 rounded-[2.5rem] border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-3">
              <Globe className="text-blue-500" size={28} /> 
              まいつーるが選ばれる理由
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-3">1. 圧倒的な手軽さ</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  アプリのインストールや面倒な会員登録は一切不要です。ブラウザを開くだけですぐに使えるため、PC、スマートフォン、タブレットなど、デバイスを選ばずに作業を開始できます。
                </p>
              </div>
              <div>
                <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-3">2. 徹底したセキュリティ</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  当サイトのツールは、基本的にサーバー通信を行わず、お使いのブラウザ内（クライアントサイド）で処理を完結させます。画像データや機密テキストが外部に送信されることはないため、ビジネス用途でも安心してご利用いただけます。
                </p>
              </div>
              <div>
                <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-3">3. 豊富なツールラインナップ</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  開発者向けの「JSON整形」「正規表現チェッカー」から、日常生活で役立つ「家計簿」「QRコード作成」「単位変換」まで、40種類以上のツールを網羅しています。
                </p>
              </div>
              <div>
                <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-3">4. データの永続化</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  家計簿やメモ帳などのデータは、ブラウザのローカルストレージに自動保存されます。次回アクセス時も続きから作業でき、設定画面からJSONファイルとしてバックアップ・復元も可能です。
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <AdBanner />
      </div>
    </div>
  );
};

export default Dashboard;
