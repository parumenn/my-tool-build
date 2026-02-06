
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link2, Plus, Trash2, Copy, Check, ExternalLink, Layers, ArrowRight, HelpCircle, X, AlertTriangle, Settings, History, Calendar, Clock, Info, Zap, ShieldCheck } from 'lucide-react';
import AdBanner from '../AdBanner';

interface BundleData {
  title: string;
  urls: string[];
  created_at: number;
  auto_redirect?: boolean;
}

interface HistoryItem {
  id: string;
  title: string;
  createdAt: string;
  url: string;
}

const UrlBundler: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const bundleId = searchParams.get('id');

  // Create Mode State
  const [urls, setUrls] = useState<string[]>(['', '', '', '', '']); 
  const [title, setTitle] = useState('');
  const [expireDays, setExpireDays] = useState(365); // Default 1 year
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);
  
  // History State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('url_bundler_history');
    return saved ? JSON.parse(saved) : [];
  });

  // View Mode State
  const [bundleData, setBundleData] = useState<BundleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Help Modal State
  const [showHelp, setShowHelp] = useState(false);

  // Save history
  useEffect(() => {
    localStorage.setItem('url_bundler_history', JSON.stringify(history));
  }, [history]);

  // Initial Help
  useEffect(() => {
    if (!bundleId) {
      const key = 'urlbundler_help_seen';
      if (!localStorage.getItem(key)) {
        const timer = setTimeout(() => {
            setShowHelp(true);
            localStorage.setItem(key, 'true');
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [bundleId]);

  // Fetch logic for view mode
  useEffect(() => {
    if (bundleId) {
      setLoading(true);
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
    }
  }, [bundleId]);

  // Helpers
  const normalizeUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return "";
    // http/httpsが無ければ付与
    if (!/^https?:\/\//i.test(trimmed)) {
      return "https://" + trimmed;
    }
    return trimmed;
  };

  // Input Handlers
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

  const handleOpenAll = () => {
    if (!bundleData) return;
    bundleData.urls.forEach(url => {
      window.open(url, '_blank');
    });
  };

  const handleCreate = async () => {
    // Normalize and filter
    const validUrls = urls.map(normalizeUrl).filter(u => u.length > 0);
    
    if (validUrls.length === 0) {
      alert('URLを入力してください');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('./backend/url_bundler_api.php?action=save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          urls: validUrls, 
          title: title || 'URLまとめ',
          expire_days: expireDays,
          auto_redirect: false
        })
      });
      
      if (!res.ok) throw new Error('保存に失敗しました');
      
      const data = await res.json();
      const newUrl = `${window.location.origin}${window.location.pathname}#/bundle?id=${data.id}`;
      setGeneratedUrl(newUrl);

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: data.id,
        title: title || 'URLまとめ',
        createdAt: new Date().toLocaleDateString(),
        url: newUrl
      };
      setHistory(prev => [newHistoryItem, ...prev]);

    } catch (e) {
      alert('エラーが発生しました。通信環境を確認してください。');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    if (!confirm('このURLを削除（無効化）しますか？\nサーバーからもデータが削除され、アクセスできなくなります。')) return;

    // UIから先に消す（楽観的更新）
    setHistory(prev => prev.filter(item => item.id !== id));

    try {
      await fetch('./backend/url_bundler_api.php?action=delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch (e) {
      console.error('Delete failed', e);
      alert('削除処理中にエラーが発生しましたが、履歴からは削除されました。');
    }
  };

  const handleCopyUrl = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  const reset = () => {
    setSearchParams({});
    setUrls(['', '', '', '', '']);
    setTitle('');
    setGeneratedUrl('');
    setBundleData(null);
  };

  const PopupHelpModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowHelp(false)}>
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="bg-gray-100 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-t-3xl">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={20} />
            ポップアップ設定について
          </h3>
          <button onClick={() => setShowHelp(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-300 font-bold leading-relaxed">
            一括オープン機能を使うには、ブラウザのポップアップブロック設定でこのサイトを許可する必要があります。
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 mb-3 font-bold">Google Chromeの場合:</p>
            <div className="flex items-center gap-3 mb-24">
               <div className="flex-1 bg-white dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-600 h-10 flex items-center px-3 gap-2 relative pr-10">
                  <Settings size={14} className="text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-400 truncate">https://{window.location.hostname}/...</span>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                     <div className="relative">
                        <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 cursor-pointer flex items-center justify-center border border-gray-300 dark:border-gray-600">
                           <ExternalLink size={14} className="text-red-500" />
                           <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                        </div>
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 p-3 z-50 text-[10px] text-left leading-tight">
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
                   </div>
                </div>

                <div className="bg-cyan-50 dark:bg-cyan-900/20 p-6 rounded-2xl border border-cyan-100 dark:border-cyan-800 text-center relative overflow-hidden">
                   <p className="text-cyan-800 dark:text-cyan-200 font-bold mb-4">
                      {bundleData.urls.length}件のリンクが保存されています
                   </p>
                   <button 
                      onClick={() => handleOpenAll()}
                      className="w-full sm:w-auto px-8 py-3 bg-cyan-600 text-white font-black rounded-xl shadow-lg hover:bg-cyan-700 hover:shadow-xl transition-all flex items-center justify-center gap-2 mx-auto"
                   >
                      <ExternalLink size={20} /> すべて新しいタブで開く
                   </button>
                   
                   <div className="mt-4 flex items-center justify-center">
                      <button 
                        onClick={() => setShowHelp(true)}
                        className="text-[10px] text-cyan-600/70 dark:text-cyan-400/70 underline hover:text-cyan-800 dark:hover:text-cyan-200 transition-colors flex items-center gap-1"
                      >
                         開かない場合はポップアップ設定を確認してください <HelpCircle size={12} />
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
              <p className="text-cyan-600 dark:text-cyan-400 text-sm mb-4 font-bold">履歴に保存されました</p>
              
              <div className="flex gap-2 max-w-lg mx-auto mb-8">
                 <input 
                    type="text" 
                    readOnly 
                    value={generatedUrl} 
                    className="flex-1 p-4 rounded-xl border-2 border-cyan-200 dark:border-cyan-700 bg-white dark:bg-gray-900 text-cyan-800 dark:text-cyan-200 font-bold text-sm truncate focus:outline-none" 
                 />
                 <button 
                    onClick={() => handleCopyUrl(generatedUrl)} 
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
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                 />
              </div>
              
              <div>
                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">URLリスト</label>
                 <div className="space-y-3">
                    {urls.map((url, i) => (
                        <div key={i} className="flex gap-2">
                            <span className="flex items-center justify-center w-8 h-10 font-bold text-gray-400 text-sm shrink-0">{i+1}</span>
                            <input 
                                type="text" 
                                value={url} 
                                onChange={(e) => updateUrl(i, e.target.value)} 
                                className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none" 
                                placeholder="google.com"
                            />
                            <button onClick={() => removeField(i)} className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"><Trash2 size={18}/></button>
                        </div>
                    ))}
                    <button onClick={addField} className="ml-10 flex items-center gap-1 text-sm font-bold text-cyan-600 hover:text-cyan-700 transition-colors bg-cyan-50 dark:bg-cyan-900/30 px-4 py-2 rounded-lg"><Plus size={16}/> URL入力欄を追加</button>
                 </div>
              </div>

              <div>
                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"><Clock size={16}/> 有効期限 (自動削除)</label>
                 <select 
                    value={expireDays} 
                    onChange={(e) => setExpireDays(Number(e.target.value))}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer"
                 >
                    <option value={3}>3日間</option>
                    <option value={7}>1週間</option>
                    <option value={30}>1ヶ月</option>
                    <option value={180}>半年 (180日)</option>
                    <option value={365}>1年 (365日)</option>
                 </select>
              </div>

              <button 
                 onClick={handleCreate} 
                 disabled={isCreating || urls.filter(u => u.trim()).length === 0} 
                 className="w-full py-4 bg-cyan-600 text-white font-black rounded-xl shadow-xl hover:bg-cyan-700 hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
              >
                 {isCreating ? '作成中...' : 'まとめURLを発行する'} <Layers size={20} />
              </button>
           </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="bg-white dark:bg-dark-lighter rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
           <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><History size={20} /> 作成履歴</h3>
           <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
              {history.map((item) => (
                 <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 group">
                    <div className="min-w-0 flex-1">
                       <p className="font-bold text-sm text-gray-800 dark:text-white truncate">{item.title}</p>
                       <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="font-mono">{item.createdAt}</span>
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline flex items-center gap-1">確認 <ExternalLink size={10} /></a>
                       </div>
                    </div>
                    <div className="flex items-center gap-2 pl-2">
                       <button onClick={() => handleCopyUrl(item.url)} className="p-2 text-gray-400 hover:text-cyan-600 bg-white dark:bg-gray-700 rounded-lg shadow-sm" title="URLをコピー"><Copy size={14}/></button>
                       <button onClick={() => handleDeleteHistory(item.id)} className="p-2 text-gray-400 hover:text-red-500 bg-white dark:bg-gray-700 rounded-lg shadow-sm" title="削除・解放"><Trash2 size={14}/></button>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

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
