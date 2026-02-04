import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link2, Plus, Trash2, Copy, Check, ExternalLink, Layers, ArrowRight, Info, ShieldCheck, Zap } from 'lucide-react';
import AdBanner from '../AdBanner';

const UrlBundler: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const bundleId = searchParams.get('id');

  // Create Mode State
  const [inputUrls, setInputUrls] = useState('');
  const [title, setTitle] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);

  // View Mode State
  const [bundleData, setBundleData] = useState<{title: string, urls: string[], created_at: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        body: JSON.stringify({ urls, title: title || 'URLまとめ' })
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

  const handleOpenAll = () => {
    if (!bundleData) return;
    
    // ポップアップブロックの警告
    const confirmed = window.confirm(
      `警告：${bundleData.urls.length}個のタブを一度に開こうとしています。\nブラウザのポップアップブロックにより一部が開かない場合があります。\n\n続行しますか？`
    );

    if (confirmed) {
      bundleData.urls.forEach(url => {
        window.open(url, '_blank');
      });
    }
  };

  const reset = () => {
    setSearchParams({});
    setInputUrls('');
    setTitle('');
    setGeneratedUrl('');
    setBundleData(null);
  };

  // --- VIEW MODE ---
  if (bundleId) {
    return (
      <div className="max-w-4xl mx-auto space-y-10 pb-20">
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
                   <p className="text-xs text-gray-400 font-mono">作成日: {new Date(bundleData.created_at * 1000).toLocaleDateString()}</p>
                </div>

                <div className="bg-cyan-50 dark:bg-cyan-900/20 p-6 rounded-2xl border border-cyan-100 dark:border-cyan-800 text-center">
                   <p className="text-cyan-800 dark:text-cyan-200 font-bold mb-4">
                      {bundleData.urls.length}件のリンクが保存されています
                   </p>
                   <button 
                      onClick={handleOpenAll}
                      className="w-full sm:w-auto px-8 py-3 bg-cyan-600 text-white font-black rounded-xl shadow-lg hover:bg-cyan-700 hover:shadow-xl transition-all flex items-center justify-center gap-2 mx-auto"
                   >
                      <ExternalLink size={20} /> すべて新しいタブで開く
                   </button>
                   <p className="text-[10px] text-cyan-600/70 dark:text-cyan-400/70 mt-2">※ブラウザの設定でポップアップを許可してください</p>
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
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
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
              <p className="text-cyan-600 dark:text-cyan-400 text-sm mb-8 font-bold">このURLを共有すると、保存したリンク一覧を表示できます</p>
              
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

              <button 
                 onClick={handleCreate} 
                 disabled={isCreating || !inputUrls.trim()} 
                 className="w-full py-4 bg-cyan-600 text-white font-black rounded-xl shadow-xl hover:bg-cyan-700 hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
              >
                 {isCreating ? '作成中...' : 'まとめURLを発行する'} <Layers size={20} />
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