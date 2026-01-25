
import React, { useState, useEffect, useMemo } from 'react';
import { Network, Search, Calculator, CheckCircle2, XCircle, ArrowRight, Binary, Cpu, Sliders, Info, ShieldCheck, Zap } from 'lucide-react';

// --- Helper Functions ---
const ipToLong = (ip: string): number | null => {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let long = 0;
  for (const part of parts) {
    const num = parseInt(part, 10);
    if (isNaN(num) || num < 0 || num > 255) return null;
    long = (long << 8) + num;
  }
  return long >>> 0;
};

const longToIp = (long: number): string => {
  return [(long >>> 24) & 0xFF, (long >>> 16) & 0xFF, (long >>> 8) & 0xFF, long & 0xFF].join('.');
};

const toBinaryString = (num: number): string => {
  return num.toString(2).padStart(32, '0');
};

const IpSubnetVisualizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'visual' | 'check' | 'calc'>('visual');
  const [ip, setIp] = useState('192.168.1.1');
  const [cidr, setCidr] = useState(24);
  const [checkIp, setCheckIp] = useState('192.168.1.50');
  const [checkNetwork, setCheckNetwork] = useState('192.168.1.0/24');
  const [checkResult, setCheckResult] = useState<'idle' | 'ok' | 'ng' | 'error'>('idle');
  const [neededHosts, setNeededHosts] = useState<number>(100);

  const visualData = useMemo(() => {
    const longIp = ipToLong(ip) || 0;
    const mask = (0xFFFFFFFF << (32 - cidr)) >>> 0;
    const wildcard = (~mask) >>> 0;
    const network = (longIp & mask) >>> 0;
    const broadcast = (network | wildcard) >>> 0;
    const binIp = toBinaryString(longIp);
    const binMask = toBinaryString(mask);
    return {
      mask: longToIp(mask), wildcard: longToIp(wildcard), network: longToIp(network),
      broadcast: longToIp(broadcast), firstUsable: longToIp(network + 1), lastUsable: longToIp(broadcast - 1),
      totalHosts: Math.pow(2, 32 - cidr), usableHosts: cidr >= 31 ? 0 : Math.pow(2, 32 - cidr) - 2,
      binIp, binMask
    };
  }, [ip, cidr]);

  useEffect(() => {
    if (!checkIp || !checkNetwork) { setCheckResult('idle'); return; }
    try {
      const targetLong = ipToLong(checkIp);
      const [netIp, netCidrStr] = checkNetwork.split('/');
      const netLong = ipToLong(netIp);
      const netCidr = parseInt(netCidrStr, 10);
      if (targetLong === null || netLong === null || isNaN(netCidr) || netCidr < 0 || netCidr > 32) { setCheckResult('error'); return; }
      const mask = (0xFFFFFFFF << (32 - netCidr)) >>> 0;
      if ((targetLong & mask) >>> 0 === (netLong & mask) >>> 0) setCheckResult('ok');
      else setCheckResult('ng');
    } catch (e) { setCheckResult('error'); }
  }, [checkIp, checkNetwork]);

  const calcResult = useMemo(() => {
    if (neededHosts <= 0) return null;
    const hostBits = Math.ceil(Math.log2(neededHosts + 2));
    const suggestedCidr = 32 - hostBits;
    const maxHosts = Math.pow(2, hostBits) - 2;
    if (suggestedCidr < 0) return { error: '上限超過' };
    return { cidr: suggestedCidr, maxHosts, mask: longToIp((0xFFFFFFFF << hostBits) >>> 0), overhead: maxHosts - neededHosts };
  }, [neededHosts]);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-h-[500px]">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2"><Network className="text-cyan-500" />IPサブネット計算機</h2>
        <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-8">
           <button onClick={() => setActiveTab('visual')} className={`py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'visual' ? 'bg-white dark:bg-gray-700 text-cyan-600 shadow-sm' : 'text-gray-500'}`}>ビジュアル</button>
           <button onClick={() => setActiveTab('check')} className={`py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'check' ? 'bg-white dark:bg-gray-700 text-cyan-600 shadow-sm' : 'text-gray-500'}`}>包含判定</button>
           <button onClick={() => setActiveTab('calc')} className={`py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'calc' ? 'bg-white dark:bg-gray-700 text-cyan-600 shadow-sm' : 'text-gray-500'}`}>ホスト計算</button>
        </div>
        {activeTab === 'visual' && (
           <div className="space-y-6 animate-fade-in">
              <div className="grid md:grid-cols-2 gap-6">
                 <div><label className="block text-sm font-bold text-gray-500 mb-2">IPアドレス</label><input type="text" value={ip} onChange={e => setIp(e.target.value)} className="w-full p-3 rounded-xl border dark:bg-gray-800 font-mono" /></div>
                 <div><div className="flex justify-between mb-2"><label className="text-sm font-bold text-gray-500">CIDR</label><span className="font-mono">/{cidr}</span></div><input type="range" min="0" max="32" value={cidr} onChange={e => setCidr(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500" /></div>
              </div>
              <div className="bg-slate-900 rounded-2xl p-6 text-white font-mono text-sm space-y-4">
                 <div className="grid grid-cols-2 gap-4"><p>Network: {visualData.network}</p><p>Broadcast: {visualData.broadcast}</p></div>
                 <div className="pt-4 border-t border-slate-700"><p className="text-cyan-400">Mask: {visualData.mask}</p><p className="text-green-400">Usable: {visualData.usableHosts.toLocaleString()} hosts</p></div>
              </div>
           </div>
        )}
        {activeTab !== 'visual' && <div className="text-center py-20 text-gray-400">準備中...</div>}
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />IPサブネット計算の基本と実務での役割</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-cyan-600" />ネットワーク設計を正確に</h3>
               <p>サブネット化は、大きなネットワークを小さなグループ（サブネット）に分割し、トラフィックの効率化やセキュリティ向上を図る手法です。当ツールは、CIDR（スラッシュ記法）に基づいたサブネットマスク、ブロードキャストアドレス、および割り当て可能なIP範囲を瞬時に算出します。インフラエンジニアやCCNA等の学習者にとって必須のツールです。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Binary size={18} className="text-cyan-600" />2進数レベルでの視覚的理解</h3>
               <p>IPアドレスのネットワーク部とホスト部が2進数でどのように分かれているかを可視化することで、計算の仕組みを直感的に理解できます。包含判定機能を使えば、特定のIPが特定のネットワーク範囲内に正しく収まっているかを簡単にテストでき、ルーティング設定やファイアウォールの設計ミスを未然に防げます。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default IpSubnetVisualizer;
