
import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, AlertTriangle, Copy, Trash2, Inbox, Info, ShieldCheck, Zap } from 'lucide-react';

const TempMailDemo: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [messages, setMessages] = useState<Array<{id: number, subject: string, from: string, time: string}>>([]);
  const [loading, setLoading] = useState(false);

  const generateEmail = () => {
    setLoading(true);
    setTimeout(() => {
      const randomStr = Math.random().toString(36).substring(7);
      setEmail(`user-${randomStr}@demo-tempmail.com`);
      setMessages([]);
      setLoading(false);
    }, 600);
  };

  const checkMail = () => {
    setLoading(true);
    setTimeout(() => {
      if (Math.random() > 0.5) {
        const newMsg = {
          id: Date.now(),
          subject: '【確認】アカウント認証コード',
          from: 'service@example.com',
          time: new Date().toLocaleTimeString('ja-JP')
        };
        setMessages(prev => [newMsg, ...prev]);
      }
      setLoading(false);
    }, 800);
  };

  useEffect(() => {
    generateEmail();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail /> 捨てメール (デモUI)
          </h2>
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium border border-white/30 flex items-center gap-1">
            <AlertTriangle size={12} /> シミュレーションモード
          </span>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center border border-white/20">
          <div className="flex-1 w-full text-center md:text-left">
            <p className="text-xs text-indigo-100 mb-1">あなたの一時的なメールアドレス</p>
            <div className="text-xl md:text-2xl font-mono font-bold tracking-wide break-all">
              {loading && !email ? '生成中...' : email}
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => navigator.clipboard.writeText(email)}
              className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Copy size={18} /> <span className="hidden sm:inline">コピー</span>
            </button>
            <button 
              onClick={generateEmail}
              className="bg-indigo-700/50 hover:bg-indigo-700/70 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border border-indigo-400/30"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> 変更
            </button>
          </div>
        </div>
        <p className="mt-4 text-sm text-indigo-100 opacity-80 italic">
          ※注意: これはフロントエンドUIの動作を体験するためのデモです。実際のSMTPサーバーへの接続は行われません。
        </p>
      </div>

      <div className="bg-white dark:bg-dark-lighter rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[400px] flex flex-col transition-colors">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
          <h3 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Inbox size={20} /> 受信トレイ
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={checkMail}
              className="text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 更新
            </button>
            <button 
              onClick={() => setMessages([])}
              className="text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <Trash2 size={14} /> 削除
            </button>
          </div>
        </div>

        <div className="flex-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-10">
              <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4">
                <Inbox size={48} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="font-bold">メッセージはありません</p>
              <p className="text-xs mt-2 text-center">「更新」を押すとデモ用のサンプルメールが擬似的に受信されます。</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {messages.map((msg) => (
                <div key={msg.id} className="p-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{msg.from}</span>
                    <span className="text-xs text-gray-500">{msg.time}</span>
                  </div>
                  <div className="font-medium text-blue-600 dark:text-blue-400 mb-1 group-hover:underline">{msg.subject}</div>
                  <div className="text-sm text-gray-500 truncate">
                    これはデモ用メッセージです。実際のメール送受信には専用のサーバーインフラが必要です...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />捨てメール（一時メール）の役割と活用メリット</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-indigo-500" />スパムメールからメインアドレスを守る</h3>
               <p>一度きりの資料ダウンロードや、信頼性が不明な海外サイトの登録時など、自分のメインアドレスを教えたくない場面で活躍します。一時的なメールアドレス（捨てアド）を使えば、その後の不要なメルマガや迷惑メールがメインの受信箱を埋め尽くす心配がありません。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-indigo-500" />プライバシーとセキュリティの向上</h3>
               <p>一時的な用途のために、個人の特定につながるアドレスを公開するのはリスクがあります。このシミュレーターで確認できるように、ランダムに生成された使い捨てのアドレスを使い分けることで、ウェブ上での匿名性と安全性を高めることができます。※本機能はデモ版のため、実用には専用のサーバー連携が必要です。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default TempMailDemo;
