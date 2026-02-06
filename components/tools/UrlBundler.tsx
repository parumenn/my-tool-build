
import React, { useState } from 'react';
import { Layers, Plus, Trash2, ExternalLink, Settings, Info, ShieldCheck, Zap } from 'lucide-react';
import AdBanner from '../AdBanner';

const UrlBundler: React.FC = () => {
  const [urls, setUrls] = useState<string[]>(['', '', '', '', '']);

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const addField = () => setUrls([...urls, '']);
  
  const removeField = (index: number) => {
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);
  };

  const openAll = () => {
    const targets = urls.filter(u => u.trim() !== '');
    if (targets.length === 0) return;
    
    targets.forEach(url => {
        let target = url.trim();
        if (!/^https?:\/\//i.test(target)) {
            target = 'https://' + target;
        }
        window.open(target, '_blank');
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <Layers className="text-cyan-500" />
          URLまとめ開き (UrlBundler)
        </h2>
        
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
           複数のURLを一括で開くツールです。毎日のルーチンワークや、複数の資料を参照する際に便利です。<br/>
           ※ブラウザのポップアップブロック設定によっては、初回のみ許可が必要です。
        </p>

        <div className="space-y-3 mb-8">
            {urls.map((url, i) => (
                <div key={i} className="flex gap-2">
                    <span className="flex items-center justify-center w-8 h-10 font-bold text-gray-400 text-sm">{i+1}</span>
                    <input 
                        type="text" 
                        value={url} 
                        onChange={(e) => updateUrl(i, e.target.value)} 
                        className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none" 
                        placeholder="https://example.com"
                    />
                    <button onClick={() => removeField(i)} className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><Trash2 size={18}/></button>
                </div>
            ))}
            <button onClick={addField} className="ml-10 flex items-center gap-1 text-sm font-bold text-cyan-600 hover:text-cyan-700 transition-colors bg-cyan-50 dark:bg-cyan-900/30 px-4 py-2 rounded-lg"><Plus size={16}/> URL入力欄を追加</button>
        </div>

        <button onClick={openAll} className="w-full py-4 bg-cyan-600 text-white font-black rounded-xl shadow-lg hover:bg-cyan-700 transition-all flex items-center justify-center gap-2 active:scale-95">
            <ExternalLink size={20} /> まとめて開く
        </button>

        <div className="mt-10">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 text-sm">
                <Info size={18} className="text-blue-500" /> ポップアップがブロックされる場合
            </h3>
            
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-3 font-bold">Google Chromeの場合:</p>
                <div className="flex items-center gap-3 mb-6 overflow-hidden">
                   <div className="flex-1 bg-white dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-600 h-10 flex items-center px-3 gap-2 relative pr-10 max-w-md">
                      <Settings size={14} className="text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-400 truncate">https://{window.location.hostname}/...</span>
                      
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                         <div className="relative group/tooltip">
                            <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 cursor-pointer flex items-center justify-center border border-gray-300 dark:border-gray-600">
                               <ExternalLink size={14} className="text-red-500" />
                               <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                            </div>
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 p-3 z-50 text-[10px] text-left leading-tight hidden group-hover/tooltip:block">
                               <p className="font-bold text-gray-800 dark:text-white mb-1">ポップアップがブロックされました</p>
                               <p className="text-blue-500 underline cursor-pointer">常に許可する</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                   アドレスバーの右側（または左側の設定アイコン）に表示される <span className="inline-flex align-middle bg-gray-200 dark:bg-gray-700 p-0.5 rounded"><ExternalLink size={10} className="text-red-500"/></span> アイコンをクリックし、<span className="font-bold text-gray-800 dark:text-white">「{window.location.hostname} のポップアップとリダイレクトを常に許可する」</span>を選択してください。
                </p>
            </div>
        </div>
      </div>
      
      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />UrlBundlerの活用シーン</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-cyan-500" />毎朝のルーチンを効率化</h3>
               <p>ニュースサイト、メール、SNS、株価チェックなど、毎日必ずチェックする複数のWebサイトを登録しておけば、ワンクリックですべてのタブを開くことができます。ブックマークフォルダから「すべて開く」をするよりも手軽で、一時的なリスト作成にも向いています。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-cyan-500" />リサーチ業務の補助に</h3>
               <p>調査業務で集めた大量の参考URLを一度に開いて比較したい場合などに便利です。入力されたURLはブラウザ内に一時的に保持されるだけなので、外部に情報が漏れることはありません。</p>
            </div>
         </div>
      </article>
      <AdBanner />
    </div>
  );
};

export default UrlBundler;
