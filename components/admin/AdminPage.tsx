
import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, Mail, User, Calendar, LogOut, Loader2, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  timestamp: string;
  ip: string;
  name: string;
  contact: string;
  message: string;
}

const AdminPage: React.FC = () => {
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('admin_token'));
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('./backend/admin_api.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();

      if (res.ok && data.token) {
        setToken(data.token);
        sessionStorage.setItem('admin_token', data.token);
        fetchMessages(data.token);
      } else {
        setError(data.error || 'ログインに失敗しました');
      }
    } catch (err) {
      setError('サーバー接続エラー');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (currentToken: string) => {
    setDataLoading(true);
    try {
      const res = await fetch('./backend/admin_api.php?action=fetch', {
        headers: { 'X-Admin-Token': currentToken }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      } else {
        // Token expired or invalid
        logout();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDataLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    sessionStorage.removeItem('admin_token');
    setMessages([]);
  };

  useEffect(() => {
    if (token) {
      fetchMessages(token);
    }
  }, []);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                <Lock size={32} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">管理者ログイン</h2>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-8">
              このエリアは許可された管理者のみアクセス可能です。<br/>
              <span className="text-xs text-red-500 opacity-80">※5回連続失敗でロックされます</span>
            </p>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワード"
                  className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-lg focus:ring-2 focus:ring-red-500 outline-none dark:text-white"
                  autoFocus
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm font-bold rounded-lg flex items-center gap-2">
                  <ShieldAlert size={16} /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'ログイン'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="text-red-500" />
            管理者ダッシュボード
          </h1>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} /> ログアウト
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
           <h2 className="text-lg font-bold flex items-center gap-2">
              <Mail className="text-blue-500" /> 受信メッセージ
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs px-2 py-1 rounded-full">{messages.length}</span>
           </h2>
           <button onClick={() => fetchMessages(token!)} className="text-sm text-blue-500 hover:underline">再読み込み</button>
        </div>

        {dataLoading ? (
           <div className="text-center py-20 text-gray-400">
              <Loader2 className="animate-spin mx-auto mb-2" size={32} />
              読み込み中...
           </div>
        ) : messages.length === 0 ? (
           <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100 dark:border-gray-700">
              <Mail size={48} className="mx-auto mb-4 opacity-30" />
              <p>メッセージはありません</p>
           </div>
        ) : (
           <div className="grid gap-4">
              {messages.map((msg) => (
                 <div key={msg.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                       <div className="flex items-start gap-3">
                          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                             <User size={20} className="text-gray-500 dark:text-gray-300" />
                          </div>
                          <div>
                             <p className="font-bold text-lg">{msg.name || '匿名'}</p>
                             <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{msg.contact || '連絡先なし'}</p>
                          </div>
                       </div>
                       <div className="text-right text-xs text-gray-400 flex flex-col gap-1">
                          <span className="flex items-center gap-1 md:justify-end"><Calendar size={12} /> {msg.timestamp}</span>
                          <span className="font-mono">IP: {msg.ip}</span>
                       </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
                       {msg.message}
                    </div>
                 </div>
              ))}
           </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
