
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link2, Plus, Trash2, Copy, Check, ExternalLink, Layers, ArrowRight, Info, ShieldCheck, Zap, ToggleLeft, ToggleRight, HelpCircle, X, AlertTriangle, Settings } from 'lucide-react';
import AdBanner from '../AdBanner';

interface BundleData {
  title: string;
  urls: string[];
  created_at: number;
  auto_redirect?: boolean;
}

const UrlBundler: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const bundleId = searchParams.get('id');

  // Create Mode State
  const [inputUrls, setInputUrls] = useState('');
  const [title, setTitle] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);
  const [autoRedirect, setAutoRedirect] = useState(false);

  // View Mode State
  const [bundleData, setBundleData] = useState<BundleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoOpenTried, setAutoOpenTried] = useState(false);

  // Help Modal State
  const [showHelp, setShowHelp] = useState(false);

  // Fetch logic for view mode
  useEffect(() => {
    if (bundleId) {
      setLoading(true);
      setAutoOpenTried(false); // ID変更時にリセット
      fetch(`./backend/url_bundler_api.php?action=get&id=${bundleId}`)
        .then(async (res) => {
          if (!res.ok) throw new Error('データが見つかりません');
          return res.json();
        })
        .then(data => {
          setBundleData(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    } else {
      setBundleData(null);
      setError('');
      setAutoOpenTried(false);
    }
  }, [bundleId]);

  const handleOpenAll = (isAuto = false) => {
    if (!bundleData) return;
    
    // 警告ダイアログを削除し、即座に展開する
    bundleData.urls.forEach(url => {
      window.open(url, '_blank');
    });
  };

  // 自動リダイレクト処理
  useEffect(() => {
    if (bundleData && bundleData.auto_redirect && !autoOpenTried) {
      setAutoOpenTried(true);
      // 描画完了を待ってから実行 (500ms)
      const timer = setTimeout(() => {
        handleOpenAll(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [bundleData, autoOpenTried]);

  const handleCreate = async () => {
    const urls = inputUrls.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (urls.length === 0) {
      alert('URLを入力してください');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('./backend/url_bundler_api.php?action=save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          urls, 
          title: title || 'URLまとめ',
          auto_redirect: autoRedirect 
        })
      });
      
      if (!res.ok) throw new Error('保存に失敗しました');
      
      const data = await res.json();
      const url = `${window.location.origin}${window.location.pathname}#/bundle?id=${data.id}`;
      setGeneratedUrl(url);
    } catch (e) {
      alert('エラーが発生しました。通信環境を確認してください。');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  const reset = () => {
    setSearchParams({});
    setInputUrls('');
    setTitle('');
    setGeneratedUrl('');
    setBundleData(null);
    setAutoRedirect(false);
    setAutoOpenTried(false);
  };

  const PopupHelpModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowHelp(false)}>
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gray-100 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={20} />
            ポップアップ設定について
          </h3>
          <button onClick={() => setShowHelp(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-300 font-bold leading-relaxed">
            自動リダイレクト機能や一括オープン機能を使うには、ブラウザのポップアップブロック設定でこのサイトを許可する必要があります。
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 mb-3 font-bold">Google Chromeの場合:</p>
            <div className="flex items-center gap-3 mb-4">
               {/* Address Bar Simulation */}
               <div className="flex-1 bg-white dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-600 h-10 flex items-center px-3 gap-2 relative">
                  <Settings size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-400 truncate">https://parumenn.server-on.net/...</span>
                  
                  {/* Blocked Icon */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                     <div className="relative">
                        <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 cursor-pointer flex items-center justify-center border border-gray-300 dark:border-gray-600">
                           <ExternalLink size={14} className="text-red-500" />
                           <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                        </div>
                        {/* Tooltip Simulation */}
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 p-3 z-10 text-[10px] text-left leading-tight">
                           <p className="font-bold text-gray-800 dark:text-white mb-1">ポップアップがブロックされました</p>
                           <p className="text-blue-500 underline cursor-pointer">常に許可する</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
               アドレスバーの右側（または左側の設定アイコン）に表示される <span className="inline-block align-middle"><ExternalLink size={12} className="text-red-500 inline"/></span> アイコンをクリックし、<span className="font-bold text-gray-800 dark:text-white">「{window.location.hostname} のポップアップとリダイレクトを常に許可する」</span>を選択してください。
            </p>
          </div>

          <div className="text-center">
             <button onClick={() => setShowHelp(false)} className="bg-cyan-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-cyan-700 transition-colors">
                閉じる
             </button>
          </div>
        </div>
      </div>
    </div>
  );

  // --- VIEW MODE ---
  if (bundleId) {
    return (
      <div className="max-w-4xl mx-auto space-y-10 pb-20 relative">
        {showHelp && <PopupHelpModal />}
        
        <div className="bg-white dark:bg-dark-lighter rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
               <Layers className="text-cyan-500" /> URLまとめ
             </h2>
             <button onClick={reset} className="text-xs bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg font-bold flex items-center gap-1 hover:bg-gray-200 transition-colors">
                <Plus size={14} /> 新規作成
             </button>
          </div>

          {loading && <div className="py-20 text-center text-gray-400 font-bold animate-pulse">読み込み中...</div>}
          
          {error && (
             <div className="py-16 text-center">
                <p className="text-red-500 font-bold mb-4">{error}</p>
                <button onClick={reset} className="bg-cyan-600 text-white px-6 py-2 rounded-xl font-bold">トップに戻る</button>
             </div>
          )}

          {bundleData && (
             <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-8">
                   <h1 className="text-2xl font-black text-gray-800 dark:text-white mb-2">{bundleData.title}</h1>
                   <div className="flex items-center justify-center gap-4 text-xs text-gray-400 font-mono">
                      <span>作成日: {new Date(bundleData.created_at * 1000).toLocaleDateString()}</span>
                      {bundleData.auto_redirect && <span className="flex items-center gap-1 text-cyan-600 font-bold"><Zap size={12}/> 自動リダイレクト有効</span>}
                   </div>
                </div>

                <div className="bg-cyan-50 dark:bg-cyan-900/20 p-6 rounded-2xl border border-cyan-100 dark:border-cyan-800 text-center relative overflow-hidden">
                   {bundleData.auto_redirect && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 animate-pulse"></div>
                   )}
                   <p className="text-cyan-800 dark:text-cyan-200 font-bold mb-4">
                      {bundleData.urls.length}件のリンクが保存されています
                   </p>
                   <button 
                      onClick={() => handleOpenAll(false)}
                      className="w-full sm:w-auto px-8 py-3 bg-cyan-600 text-white font-black rounded-xl shadow-lg hover:bg-cyan-700 hover:shadow-xl transition-all flex items-center justify-center gap-2 mx-auto"
                   >
                      <ExternalLink size={20} /> すべて新しいタブで開く
                   </button>
                   
                   <div className="mt-4 flex items-center justify-center gap-2">
                      <p className="text-[10px] text-cyan-600/70 dark:text-cyan-400/70">
                         開かない場合はポップアップ設定を確認してください
                      </p>
                      <button onClick={() => setShowHelp(true)} className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-200">
                         <HelpCircle size={14} />
                      </button>
                   </div>
                </div>

                <div className="space-y-2">
                   {bundleData.urls.map((url, i) => (
                      <a 
                        key={i} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-600 transition-colors group"
                      >
                         <div className="flex items-center gap-3">
                            <div className="bg-white dark:bg-gray-700 p-2 rounded-lg text-gray-400 group-hover:text-cyan-500 transition-colors">
                               <Link2 size={16} />
                            </div>
                            <span className="font-mono text-sm text-gray-600 dark:text-gray-300 truncate flex-1">{url}</span>
                            <ArrowRight size={16} className="text-gray-300 group-hover:text-cyan-500" />
                         </div>
                      </a>
                   ))}
                </div>
             </div>
          )}
        </div>
        <AdBanner />
      </div>
    );
  }

  // --- CREATE MODE ---
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 relative">
      {showHelp && <PopupHelpModal />}

      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <Layers className="text-cyan-500" /> URLまとめ作成
        </h2>

        {generatedUrl ? (
           <div className="animate-fade-in bg-cyan-50 dark:bg-cyan-900/20 p-8 rounded-3xl border-2 border-cyan-100 dark:border-cyan-800 text-center">
              <div className="bg-white dark:bg-cyan-800 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-sm">
                 <Check size={40} className="text-cyan-500 dark:text-cyan-200" />
              </div>
              <h3 className="text-2xl font-black text-cyan-800 dark:text-cyan-200 mb-2">まとめURLを発行しました</h3>
              <p className="text-cyan-600 dark:text-cyan-400 text-sm mb-4 font-bold">このURLの有効期限は作成から1年間です</p>
              {autoRedirect && <p className="text-xs text-orange-500 font-bold mb-6 flex items-center justify-center gap-1"><Zap size={12}/> 自動リダイレクトモード有効</p>}
              
              <div className="flex gap-2 max-w-lg mx-auto mb-8">
                 <input 
                    type="text" 
                    readOnly 
                    value={generatedUrl} 
                    className="flex-1 p-4 rounded-xl border-2 border-cyan-200 dark:border-cyan-700 bg-white dark:bg-gray-900 text-cyan-800 dark:text-cyan-200 font-bold text-sm truncate focus:outline-none" 
                 />
                 <button 
                    onClick={handleCopyUrl} 
                    className="bg-cyan-600 text-white px-6 rounded-xl font-bold hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-200 dark:shadow-none shrink-0 flex items-center gap-2"
                 >
                    {copyStatus ? <Check size={20} /> : <Copy size={20} />}
                 </button>
              </div>

              <div className="flex justify-center gap-4">
                 <a href={generatedUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1">
                    <ExternalLink size={16} /> ページを確認する
                 </a>
                 <span className="text-cyan-300">|</span>
                 <button onClick={reset} className="text-gray-500 dark:text-gray-400 font-bold hover:text-gray-700 dark:hover:text-gray-200">
                    新しく作成する
                 </button>
              </div>
           </div>
        ) : (
           <div className="space-y-6">
              <div>
                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">タイトル (任意)</label>
                 <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="例: 参考資料まとめ"
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                 />
              </div>
              
              <div>
                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">URLリスト (1行に1つ)</label>
                 <textarea 
                    value={inputUrls} 
                    onChange={e => setInputUrls(e.target.value)} 
                    placeholder="https://google.com&#13;&#10;https://example.com" 
                    className="w-full h-64 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:border-cyan-500 transition-colors resize-none font-mono text-sm leading-relaxed"
                 />
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <button onClick={() => setAutoRedirect(!autoRedirect)} className={`text-cyan-600 transition-colors ${autoRedirect ? 'text-cyan-600' : 'text-gray-400'}`}>
                          {autoRedirect ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                       </button>
                       <div>
                          <p className={`font-bold text-sm ${autoRedirect ? 'text-gray-800 dark:text-white' : 'text-gray-500'}`}>自動リダイレクトモード</p>
                          <p className="text-[10px] text-gray-400">URLを開いた瞬間にすべてのリンクを展開します</p>
                       </div>
                    </div>
                    {autoRedirect && (
                       <button onClick={() => setShowHelp(true)} className="text-xs text-orange-500 font-bold flex items-center gap-1 underline">
                          <AlertTriangle size={14} /> 設定が必要です（詳細）
                       </button>
                    )}
                 </div>
              </div>

              <button 
                 onClick={handleCreate} 
                 disabled={isCreating || !inputUrls.trim()} 
                 className="w-full py-4 bg-cyan-600 text-white font-black rounded-xl shadow-xl hover:bg-cyan-700 hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
                 title="有効期限: 1年"
              >
                 {isCreating ? '作成中...' : 'まとめURLを発行する (1年間有効)'} <Layers size={20} />
              </button>
           </div>
        )}
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />URLまとめツールの活用法</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-cyan-500" />複数のリンクを1つに</h3>
               <p>SNSやメールで複数の参考資料を送りたいとき、URLを羅列すると見づらくなってしまいます。このツールを使えば、それらを1つの短縮URLのようなページにまとめることができます。「一括で開く」機能も備えているため、受け取った側の利便性も向上します。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-cyan-500" />登録不要・シンプル機能</h3>
               <p>ユーザー登録は不要で、誰でもすぐに利用できます。発行されたURLにアクセスすると、保存されたリンク一覧が表示されるシンプルな設計です。日常のブックマーク整理や、一時的な情報共有に最適です。</p>
            </div>
         </div>
      </article>
      <AdBanner />
    </div>
  );
};

export default UrlBundler;
