
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Share2, Clock, Copy, Check, FileText, AlertTriangle, Link as LinkIcon, Plus, Info, ShieldCheck, Zap } from 'lucide-react';
import AdBanner from '../AdBanner';

const TextShare: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const shareId = searchParams.get('id');

  // Input State
  const [text, setText] = useState('');
  const [days, setDays] = useState(2);
  
  // View State
  const [viewText, setViewText] = useState('');
  const [meta, setMeta] = useState<{created_at: string, expires_at: string} | null>(null);
  
  // UI State
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'notfound'>('idle');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [textCopied, setTextCopied] = useState(false);

  // Fetch logic for view mode
  useEffect(() => {
    if (shareId) {
      setStatus('loading');
      fetch(`./backend/text_share_api.php?action=get&id=${shareId}`)
        .then(async (res) => {
          if (!res.ok) {
             if (res.status === 404) throw new Error('notfound');
             throw new Error('error');
          }
          return res.json();
        })
        .then(data => {
          setViewText(data.text);
          setMeta({ created_at: data.created_at, expires_at: data.expires_at });
          setStatus('success');
        })
        .catch(err => {
          setStatus(err.message === 'notfound' ? 'notfound' : 'error');
        });
    } else {
      setStatus('idle');
    }
  }, [shareId]);

  const handleSave = async () => {
    if (!text.trim()) return;
    setStatus('loading');

    try {
      const res = await fetch('./backend/text_share_api.php?action=save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, days })
      });
      
      if (!res.ok) throw new Error('Save failed');
      
      const data = await res.json();
      const url = `${window.location.origin}${window.location.pathname}#/share?id=${data.id}`;
      setGeneratedUrl(url);
      setStatus('success');
    } catch (e) {
      alert('保存に失敗しました。サイズが大きすぎるか、通信エラーの可能性があります。');
      setStatus('idle');
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyContent = () => {
    navigator.clipboard.writeText(viewText);
    setTextCopied(true);
    setTimeout(() => setTextCopied(false), 2000);
  };

  const reset = () => {
    setSearchParams({});
    setText('');
    setGeneratedUrl('');
    setStatus('idle');
  };

  // --- VIEW MODE ---
  if (shareId) {
    return (
      <div className="max-w-4xl mx-auto space-y-10 pb-20">
        <div className="bg-white dark:bg-dark-lighter rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start mb-6">
             <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
               <FileText className="text-emerald-500" /> 共有されたテキスト
             </h2>
             <button onClick={reset} className="text-xs bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg font-bold flex items-center gap-1 hover:bg-gray-200 transition-colors">
                <Plus size={14} /> 新規作成
             </button>
          </div>

          {status === 'loading' && (
             <div className="py-20 text-center text-gray-400 font-bold animate-pulse">データを読み込み中...</div>
          )}

          {(status === 'notfound' || status === 'error') && (
             <div className="py-20 text-center">
                <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                   <AlertTriangle size={32} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-black text-gray-700 dark:text-gray-300 mb-2">テキストが見つかりません</h3>
                <p className="text-gray-500 text-sm mb-6">
                   有効期限が切れて削除されたか、URLが間違っている可能性があります。
                </p>
                <button onClick={reset} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
                   新しく作成する
                </button>
             </div>
          )}

          {status === 'success' && (
             <div className="space-y-4 animate-fade-in">
                <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                   <span className="flex items-center gap-1"><Clock size={14} /> 作成日: {meta?.created_at}</span>
                   <span className="flex items-center gap-1 text-red-500"><AlertTriangle size={14} /> 有効期限: {meta?.expires_at}まで</span>
                </div>
                
                <div className="relative">
                   <textarea 
                      readOnly 
                      value={viewText} 
                      className="w-full h-[60vh] p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm resize-none focus:outline-none"
                   />
                   <button 
                      onClick={copyContent} 
                      className="absolute top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                   >
                      {textCopied ? <Check size={14} /> : <Copy size={14} />}
                      {textCopied ? 'コピー完了' : '本文をコピー'}
                   </button>
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
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
          <Share2 className="text-emerald-500" /> テキスト共有ツール
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
           テキストを一時的にクラウドに保存し、共有用のURLを発行します。<br/>
           最大1GBまで対応。期限が過ぎるとデータは完全に削除されます。
        </p>

        {status === 'success' ? (
           <div className="bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-3xl border-2 border-emerald-100 dark:border-emerald-800 text-center animate-fade-in">
              <div className="bg-white dark:bg-emerald-800 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-sm">
                 <Check size={40} className="text-emerald-500 dark:text-emerald-200" />
              </div>
              <h3 className="text-2xl font-black text-emerald-800 dark:text-emerald-200 mb-2">共有URLを発行しました</h3>
              <p className="text-emerald-600 dark:text-emerald-400 text-sm mb-8 font-bold">このURLを知っている人だけが閲覧できます</p>
              
              <div className="flex gap-2 max-w-lg mx-auto mb-8">
                 <input 
                    type="text" 
                    readOnly 
                    value={generatedUrl} 
                    className="flex-1 p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-900 text-emerald-800 dark:text-emerald-200 font-bold text-sm truncate focus:outline-none" 
                 />
                 <button 
                    onClick={copyUrl} 
                    className="bg-emerald-600 text-white px-6 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 dark:shadow-none shrink-0 flex items-center gap-2"
                 >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                 </button>
              </div>

              <div className="flex justify-center gap-4">
                 <a href={generatedUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1">
                    <LinkIcon size={16} /> ページを開く
                 </a>
                 <span className="text-emerald-300">|</span>
                 <button onClick={reset} className="text-gray-500 dark:text-gray-400 font-bold hover:text-gray-700 dark:hover:text-gray-200">
                    新しく作成する
                 </button>
              </div>
           </div>
        ) : (
           <div className="space-y-6">
              <div>
                 <textarea 
                    value={text} 
                    onChange={e => setText(e.target.value)} 
                    placeholder="ここに共有したいテキストを入力してください..." 
                    className="w-full h-64 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:border-emerald-500 focus:bg-white dark:focus:bg-black transition-colors resize-none font-mono text-sm leading-relaxed"
                 />
                 <p className="text-right text-xs font-bold text-gray-400 mt-2">※ブラウザのメモリ制限により、極端に巨大なテキストは動作が重くなる場合があります。</p>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                 <div className="w-full md:w-auto">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">有効期限 (自動削除)</label>
                    <div className="flex gap-2">
                       {[1, 2, 3, 7].map(d => (
                          <button 
                             key={d} 
                             onClick={() => setDays(d)} 
                             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${days === d ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-gray-700 text-gray-500 border border-gray-200 dark:border-gray-600'}`}
                          >
                             {d}日
                          </button>
                       ))}
                    </div>
                 </div>
                 <button 
                    onClick={handleSave} 
                    disabled={status === 'loading' || !text} 
                    className="w-full md:w-auto px-10 py-4 bg-emerald-600 text-white font-black rounded-xl shadow-xl hover:bg-emerald-700 hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
                 >
                    {status === 'loading' ? '保存中...' : 'リンクを作成する'} <Share2 size={20} />
                 </button>
              </div>
           </div>
        )}
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />大容量テキスト共有ツールの特徴</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-emerald-500" />コードやログの共有に最適</h3>
               <p>チャットツールでは送れないような長いエラーログ、ソースコード、設定ファイルなどを手軽に共有できます。最大1GB（サーバー許容値）まで対応しているため、文字数制限を気にする必要はありません。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-500" />自動削除でゴミを残さない</h3>
               <p>設定した期間（最大7日）が過ぎると、サーバーからデータは物理的に削除されます。「ずっと残り続けるのが不安」という一時的な共有用途に特化しており、プライバシーとセキュリティに配慮した設計となっています。</p>
            </div>
         </div>
      </article>
      <AdBanner />
    </div>
  );
};

export default TextShare;
