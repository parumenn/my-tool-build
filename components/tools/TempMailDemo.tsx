import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, AlertTriangle, Copy, Trash2, Inbox } from 'lucide-react';

// NOTE: This is a Simulation UI. Real disposable email requires an SMTP server backend.
const TempMailDemo: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [messages, setMessages] = useState<Array<{id: number, subject: string, from: string, time: string}>>([]);
  const [loading, setLoading] = useState(false);

  const generateEmail = () => {
    setLoading(true);
    // Simulating API call delay
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail /> 捨てメール（デモ）
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
        <p className="mt-4 text-sm text-indigo-100 opacity-80">
          ※注意: これはフロントエンドのみのデモです。実際のメール送受信は行われません。
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px] flex flex-col">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <Inbox size={20} /> 受信トレイ
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={checkMail}
              className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 更新
            </button>
            <button 
              onClick={() => setMessages([])}
              className="text-sm text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <Trash2 size={14} /> 削除
            </button>
          </div>
        </div>

        <div className="flex-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-10">
              <div className="bg-gray-100 p-6 rounded-full mb-4">
                <Inbox size={48} className="text-gray-300" />
              </div>
              <p>メッセージはありません</p>
              <p className="text-sm mt-2">受信トレイは空です。「更新」を押してデモメールを受信してください。</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {messages.map((msg) => (
                <div key={msg.id} className="p-4 hover:bg-blue-50/50 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-gray-800">{msg.from}</span>
                    <span className="text-xs text-gray-500">{msg.time}</span>
                  </div>
                  <div className="font-medium text-blue-600 mb-1 group-hover:underline">{msg.subject}</div>
                  <div className="text-sm text-gray-500 truncate">
                    このメールはOmniToolsのデモ機能によって生成されたサンプルメッセージです...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TempMailDemo;
