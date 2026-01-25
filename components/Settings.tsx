
import React, { useContext, useRef, useState } from 'react';
import { AppContext } from '../App';
import { Monitor, Shield, Database, Download, Upload, AlertCircle, Mail, Send, Loader2, CheckCircle2 } from 'lucide-react';

const Settings: React.FC = () => {
  const { showAds, setShowAds } = useContext(AppContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Message Form State
  const [msgName, setMsgName] = useState('');
  const [msgContact, setMsgContact] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<'idle' | 'success' | 'error'>('idle');

  const handleBackup = () => {
    const data: Record<string, any> = {};
    const keysToBackup = [
      'theme', 'addedTools', 'showAds',
      'maitool_notes',
      'kakeibo_transactions', 'kakeibo_subs', 'kakeibo_goals'
    ];

    keysToBackup.forEach(key => {
      const val = localStorage.getItem(key);
      if (val) {
        try {
          data[key] = JSON.parse(val);
        } catch {
          data[key] = val;
        }
      }
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maitool_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        Object.keys(data).forEach(key => {
          if (typeof data[key] === 'object') {
            localStorage.setItem(key, JSON.stringify(data[key]));
          } else {
            localStorage.setItem(key, String(data[key]));
          }
        });
        alert('復元が完了しました。変更を反映するためにページを再読み込みします。');
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert('ファイルの読み込みに失敗しました。正しいバックアップファイルか確認してください。');
      }
    };
    reader.readAsText(file);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgBody.trim()) return;

    setIsSending(true);
    setSendResult('idle');

    try {
      const res = await fetch('./backend/admin_api.php?action=send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: msgName,
          contact: msgContact,
          message: msgBody
        })
      });

      if (res.ok) {
        setSendResult('success');
        setMsgName('');
        setMsgContact('');
        setMsgBody('');
      } else {
        setSendResult('error');
      }
    } catch (e) {
      setSendResult('error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">設定</h2>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex items-start gap-4">
         <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-300 shrink-0">
            <Shield size={24} />
         </div>
         <div>
            <h3 className="font-bold text-emerald-800 dark:text-emerald-400 mb-1">安全な設計</h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">
               当サイトのデータ管理はサーバーレスで動作しており、各アプリで入力されたデータがサーバーに送信・保存されることは一切ありません。<br/>
               すべての処理はお使いのブラウザ内（ローカル）で完結しています。
            </p>
         </div>
      </div>

      <div className="bg-white dark:bg-dark-lighter p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Monitor size={20} className="text-purple-500" />
          表示設定
        </h3>
        
        <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
           <div>
             <p className="font-bold text-gray-800 dark:text-gray-200">広告を表示する</p>
             <p className="text-xs text-gray-500">
               {showAds ? 'サービスの維持にご協力ください' : '｡ﾟﾟ(*´□`*｡)°ﾟ。'}
             </p>
           </div>
           <button 
             onClick={() => setShowAds(!showAds)}
             className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showAds ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
           >
             <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showAds ? 'translate-x-6' : 'translate-x-1'}`} />
           </button>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-lighter p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
         <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Database size={20} className="text-blue-500" />
          データ管理
         </h3>
         
         <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-transparent dark:border-gray-700">
               <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-700 dark:text-gray-200">バックアップを作成</span>
                  <Database size={16} className="text-gray-400" />
               </div>
               <p className="text-xs text-gray-500 mb-4">
                  家計簿、メモ、設定などのすべてのデータをJSONファイルとしてダウンロードします。
               </p>
               <button 
                  onClick={handleBackup}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
               >
                  <Download size={16} /> 保存する
               </button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-transparent dark:border-gray-700">
               <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-700 dark:text-gray-200">データを復元</span>
                  <AlertCircle size={16} className="text-orange-400" />
               </div>
               <p className="text-xs text-gray-500 mb-4">
                  保存したJSONファイルを読み込みます。現在のデータは上書きされます。
               </p>
               <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleRestore}
               />
               <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
               >
                  <Upload size={16} /> 読み込む
               </button>
            </div>
         </div>
      </div>

      <div className="bg-white dark:bg-dark-lighter p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
         <div className="flex items-center gap-2 mb-4">
            <Mail size={20} className="text-pink-500 dark:text-pink-400" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">管理者へ連絡</h3>
         </div>
         <p className="text-xs text-gray-500 mb-6">
            バグ報告や機能要望など、管理者へメッセージを送信できます。<br/>
            ※返信が必要な場合はメールアドレス等を記入してください。
         </p>

         {sendResult === 'success' ? (
            <div className="bg-green-50 dark:bg-green-900/30 p-6 rounded-xl text-center">
               <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
               <p className="font-bold text-green-700 dark:text-green-300">送信しました</p>
               <button onClick={() => setSendResult('idle')} className="mt-4 text-xs text-gray-500 underline">続けて送信する</button>
            </div>
         ) : (
            <form onSubmit={handleSendMessage} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-500 mb-1">お名前 (任意)</label>
                     <input 
                        type="text" 
                        value={msgName}
                        onChange={(e) => setMsgName(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-pink-500/30 dark:text-white"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 mb-1">連絡先 (任意)</label>
                     <input 
                        type="text" 
                        value={msgContact}
                        onChange={(e) => setMsgContact(e.target.value)}
                        placeholder="Email / Twitter等"
                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-pink-500/30 dark:text-white"
                     />
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">メッセージ <span className="text-red-500">*</span></label>
                  <textarea 
                     value={msgBody}
                     onChange={(e) => setMsgBody(e.target.value)}
                     required
                     className="w-full p-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm h-32 resize-none outline-none focus:ring-2 focus:ring-pink-500/30 dark:text-white"
                     placeholder="ここに内容を入力してください..."
                  />
               </div>
               
               {sendResult === 'error' && (
                  <p className="text-xs text-red-500 font-bold flex items-center gap-1">
                     <AlertCircle size={12} /> 送信に失敗しました。時間をおいて試してください。
                  </p>
               )}

               <button 
                  type="submit" 
                  disabled={isSending || !msgBody}
                  className="w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 border-2 
                             bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-100 dark:shadow-none
                             dark:bg-pink-400 dark:border-pink-400 dark:text-white
                             hover:bg-pink-600 hover:border-pink-600 dark:hover:bg-pink-500 dark:hover:border-pink-500
                             disabled:bg-transparent disabled:border-pink-500/20 disabled:text-pink-500/40 disabled:shadow-none
                             dark:disabled:bg-pink-400/5 dark:disabled:border-pink-400/30 dark:disabled:text-pink-400/60 dark:disabled:cursor-not-allowed"
               >
                  {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />} 
                  <span>送信する</span>
               </button>
            </form>
         )}
      </div>
      
      <div className="text-center text-xs text-gray-400">
         Version 2.5.0
      </div>
    </div>
  );
};

export default Settings;
