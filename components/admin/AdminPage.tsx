
import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Microchip, Lock } from 'lucide-react';

interface ResourceData {
  used: number;
  total: number;
  percent: number;
}

interface ServerResources {
  cpu: number;
  mem: ResourceData;
  disk: ResourceData;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const AdminPage: React.FC = () => {
  const [serverResources, setServerResources] = useState<ServerResources | null>(null);

  useEffect(() => {
    // Mock data for display purposes
    const updateStats = () => {
      setServerResources({
        cpu: Math.floor(Math.random() * 30) + 10,
        mem: { used: 4 * 1024 * 1024 * 1024, total: 16 * 1024 * 1024 * 1024, percent: 25 },
        disk: { used: 128 * 1024 * 1024 * 1024, total: 512 * 1024 * 1024 * 1024, percent: 25 }
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-slate-900 dark:bg-white rounded-2xl text-white dark:text-slate-900">
            <Lock size={24} />
        </div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Admin Dashboard</h1>
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-black text-slate-800 dark:text-white">サーバー状態</h3>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                REAL-TIME
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                { 
                label: 'CPU負荷', 
                val: serverResources?.cpu ?? 0, 
                icon: Cpu, 
                color: 'text-amber-500', 
                sub: '直近1分間',
                percent: Math.min(Math.round(serverResources?.cpu ?? 0), 100)
                },
                { 
                label: 'メモリ使用率', 
                val: serverResources?.mem.percent ?? 0, 
                icon: Microchip, 
                color: 'text-blue-500', 
                sub: serverResources ? `${formatSize(serverResources.mem.used)} / ${formatSize(serverResources.mem.total)}` : '--',
                percent: serverResources?.mem.percent ?? 0
                },
                { 
                label: 'ディスク使用率', 
                val: serverResources?.disk.percent ?? 0, 
                icon: HardDrive, 
                color: 'text-purple-500', 
                sub: serverResources ? `${formatSize(serverResources.disk.used)} / ${formatSize(serverResources.disk.total)}` : '--',
                percent: serverResources?.disk.percent ?? 0
                }
            ].map((res, i) => (
                <div key={i} className="bg-white dark:bg-dark-lighter p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                    <div className={`${res.color} bg-gray-50 dark:bg-gray-800 p-2 rounded-xl`}>
                        <res.icon size={20} />
                    </div>
                    <span className="text-2xl font-black font-mono tabular-nums text-slate-800 dark:text-white">{res.percent}%</span>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">{res.label}</p>
                    <p className="text-[10px] font-bold text-gray-500 truncate mb-4">{res.sub}</p>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ${
                        res.percent > 90 ? 'bg-red-500' : res.percent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} 
                        style={{ width: `${res.percent}%` }}
                    />
                    </div>
                </div>
            ))}
        </div>
      </section>
    </div>
  );
};

export default AdminPage;
