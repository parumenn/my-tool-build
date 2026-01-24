import React, { useState, useEffect } from 'react';
import { Network, Globe, Smartphone, RefreshCw } from 'lucide-react';

interface IpData {
  ip: string;
}

const IpChecker: React.FC = () => {
  const [ipData, setIpData] = useState<IpData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userAgent, setUserAgent] = useState<string>('');

  const fetchIp = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setIpData(data);
    } catch (error) {
      console.error('Failed to fetch IP', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIp();
    setUserAgent(navigator.userAgent);
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Network className="text-sky-500" />
            IPアドレス確認
          </h2>
          <button 
            onClick={fetchIp} 
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            title="再取得"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="bg-sky-50 rounded-xl p-8 text-center border border-sky-100 mb-8">
          <p className="text-sky-600 font-semibold mb-2 uppercase tracking-wider text-sm">Your Global IP Address</p>
          <div className="text-4xl md:text-5xl font-mono font-bold text-slate-800 break-all">
            {loading ? (
              <span className="opacity-50 text-2xl">Loading...</span>
            ) : (
              ipData?.ip || '取得失敗'
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="p-2 bg-white rounded-lg shadow-sm text-gray-600">
              <Globe size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-700">接続情報</h3>
              <p className="text-sm text-gray-500 mt-1">
                現在、インターネットに接続されているグローバルIPアドレスです。
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="p-2 bg-white rounded-lg shadow-sm text-gray-600">
              <Smartphone size={24} />
            </div>
            <div className="overflow-hidden w-full">
              <h3 className="font-bold text-gray-700">ユーザーエージェント</h3>
              <p className="text-xs text-gray-500 font-mono mt-1 break-all bg-white p-2 rounded border border-gray-200">
                {userAgent}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IpChecker;