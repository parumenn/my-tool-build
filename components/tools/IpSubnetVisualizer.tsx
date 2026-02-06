
import React, { useState, useEffect, useMemo } from 'react';
import { Network, Search, Calculator, CheckCircle2, XCircle, ArrowRight, Binary, Cpu, Sliders } from 'lucide-react';

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
  return long >>> 0; // Ensure unsigned 32-bit
};

const longToIp = (long: number): string => {
  return [
    (long >>> 24) & 0xFF,
    (long >>> 16) & 0xFF,
    (long >>> 8) & 0xFF,
    long & 0xFF
  ].join('.');
};

const toBinaryString = (num: number): string => {
  return num.toString(2).padStart(32, '0');
};

const IpSubnetVisualizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'visual' | 'check' | 'calc'>('visual');

  // --- Visualizer State ---
  const [ip, setIp] = useState('192.168.1.1');
  const [cidr, setCidr] = useState(24);

  // --- Check State ---
  const [checkIp, setCheckIp] = useState('192.168.1.50');
  const [checkNetwork, setCheckNetwork] = useState('192.168.1.0/24');
  const [checkResult, setCheckResult] = useState<'idle' | 'ok' | 'ng' | 'error'>('idle');

  // --- Calc State ---
  const [neededHosts, setNeededHosts] = useState<number>(100);

  // --- Visualizer Logic ---
  const visualData = useMemo(() => {
    const longIp = ipToLong(ip) || 0;
    const mask = (0xFFFFFFFF << (32 - cidr)) >>> 0;
    const wildcard = (~mask) >>> 0;
    const network = (longIp & mask) >>> 0;
    const broadcast = (network | wildcard) >>> 0;
    const usableHosts = Math.max(0, (broadcast - network) - 1); // Usually -2, but logic varies for /31 /32. Using standard -2 for general cases, but displaying raw count.
    
    // Binary Strings for Visualization
    const binIp = toBinaryString(longIp);
    const binMask = toBinaryString(mask);
    
    return {
      mask: longToIp(mask),
      wildcard: longToIp(wildcard),
      network: longToIp(network),
      broadcast: longToIp(broadcast),
      firstUsable: longToIp(network + 1),
      lastUsable: longToIp(broadcast - 1),
      totalHosts: Math.pow(2, 32 - cidr),
      usableHosts: cidr >= 31 ? 0 : Math.pow(2, 32 - cidr) - 2,
      binIp,
      binMask
    };
  }, [ip, cidr]);

  // --- Check Logic ---
  useEffect(() => {
    if (!checkIp || !checkNetwork) {
      setCheckResult('idle');
      return;
    }

    try {
      const targetLong = ipToLong(checkIp);
      const [netIp, netCidrStr] = checkNetwork.split('/');
      const netLong = ipToLong(netIp);
      const netCidr = parseInt(netCidrStr, 10);

      if (targetLong === null || netLong === null || isNaN(netCidr) || netCidr < 0 || netCidr > 32) {
        setCheckResult('error');
        return;
      }

      const mask = (0xFFFFFFFF << (32 - netCidr)) >>> 0;
      const targetNet = (targetLong & mask) >>> 0;
      const rangeNet = (netLong & mask) >>> 0;

      if (targetNet === rangeNet) {
        setCheckResult('ok');
      } else {
        setCheckResult('ng');
      }
    } catch (e) {
      setCheckResult('error');
    }
  }, [checkIp, checkNetwork]);

  // --- Calc Logic ---
  const calcResult = useMemo(() => {
    // formula: 2^h - 2 >= needed
    // h = ceil(log2(needed + 2))
    // cidr = 32 - h
    if (neededHosts <= 0) return null;
    const hostBits = Math.ceil(Math.log2(neededHosts + 2));
    const suggestedCidr = 32 - hostBits;
    const maxHosts = Math.pow(2, hostBits) - 2;
    
    if (suggestedCidr < 0) return { error: '数が多すぎます (IPv4の上限を超過)' };

    return {
      cidr: suggestedCidr,
      maxHosts,
      mask: longToIp((0xFFFFFFFF << hostBits) >>> 0),
      overhead: maxHosts - neededHosts
    };
  }, [neededHosts]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Network className="text-cyan-500" />
          IPサブネット計算機
        </h2>
        
        {/* Tabs - Mobile Optimized Grid */}
        <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
           <button
             onClick={() => setActiveTab('visual')}
             className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2 rounded-lg text-[10px] sm:text-sm font-bold transition-all ${activeTab === 'visual' ? 'bg-white dark:bg-gray-700 text-cyan-600 dark:text-cyan-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}
           >
             <Sliders size={16} className="mb-0.5 sm:mb-0" /> 
             <span>ビジュアル</span>
           </button>
           <button
             onClick={() => setActiveTab('check')}
             className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2 rounded-lg text-[10px] sm:text-sm font-bold transition-all ${activeTab === 'check' ? 'bg-white dark:bg-gray-700 text-cyan-600 dark:text-cyan-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}
           >
             <Search size={16} className="mb-0.5 sm:mb-0" />
             <span>包含判定</span>
           </button>
           <button
             onClick={() => setActiveTab('calc')}
             className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2 rounded-lg text-[10px] sm:text-sm font-bold transition-all ${activeTab === 'calc' ? 'bg-white dark:bg-gray-700 text-cyan-600 dark:text-cyan-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}
           >
             <Calculator size={16} className="mb-0.5 sm:mb-0" />
             <span>ホスト計算</span>
           </button>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-lighter rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6 min-h-[500px]">
        
        {/* === VISUALIZER TAB === */}
        {activeTab === 'visual' && (
          <div className="space-y-8 animate-fade-in">
            {/* Input & Slider */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div>
                     <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">IPアドレス</label>
                     <input 
                        type="text" 
                        value={ip}
                        onChange={(e) => setIp(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-lg"
                     />
                  </div>
                  <div>
                     <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">CIDR (マスク長)</label>
                        <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 px-3 py-1 rounded-lg font-mono font-bold">/{cidr}</span>
                     </div>
                     <div className="relative w-full h-10">
                        <input 
                            type="range" 
                            min="0" max="32" 
                            value={cidr} 
                            onChange={(e) => setCidr(Number(e.target.value))}
                            className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 block relative z-10"
                        />
                        {/* Absolute positioned ticks */}
                        <div className="absolute top-5 w-full text-xs text-gray-400 font-mono select-none">
                            <span className="absolute left-0 -translate-x-0">/0</span>
                            <span className="absolute left-[25%] -translate-x-1/2">/8</span>
                            <span className="absolute left-[50%] -translate-x-1/2">/16</span>
                            <span className="absolute left-[75%] -translate-x-1/2">/24</span>
                            <span className="absolute right-0 translate-x-0">/32</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                     <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">サブネットマスク</p>
                     <p className="font-mono font-bold text-gray-800 dark:text-white text-lg break-all">{visualData.mask}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                     <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">ワイルドカードマスク</p>
                     <p className="font-mono font-bold text-gray-800 dark:text-white text-lg break-all">{visualData.wildcard}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 sm:col-span-2">
                     <div className="flex justify-between items-center flex-wrap gap-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">使用可能ホスト数</p>
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">全体: {visualData.totalHosts.toLocaleString()}</span>
                     </div>
                     <p className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-2xl break-all">{visualData.usableHosts.toLocaleString()} <span className="text-sm text-gray-500">台</span></p>
                  </div>
               </div>
            </div>

            {/* Binary Eye - Mobile Optimized */}
            <div className="bg-slate-900 rounded-2xl p-4 md:p-6 shadow-xl border border-slate-700">
               <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-sm border-b border-slate-700 pb-2">
                  <Binary size={16} className="text-cyan-400" /> 
                  バイナリ・アイ (2進数可視化)
               </h3>
               
               {/* IP Binary */}
               <div className="mb-4">
                  <div className="text-gray-500 text-[10px] uppercase font-bold mb-1 md:hidden">IP Address</div>
                  <div className="flex flex-col md:flex-row md:items-center">
                     <div className="w-24 text-gray-500 text-xs font-bold text-right mr-4 hidden md:block">IP ADDRESS</div>
                     <div className="flex-1 flex justify-between font-mono text-[0.65rem] sm:text-sm md:text-base tracking-widest sm:tracking-wider">
                        {visualData.binIp.split('').map((bit, i) => (
                           <React.Fragment key={i}>
                              {i > 0 && i % 8 === 0 && <span className="text-slate-700 mx-[1px] sm:mx-1">.</span>}
                              <span className={`${i < cidr ? 'text-green-400 font-bold' : 'text-blue-400'}`}>
                                 {bit}
                              </span>
                           </React.Fragment>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Mask Binary */}
               <div className="mb-4">
                  <div className="text-gray-500 text-[10px] uppercase font-bold mb-1 md:hidden">Subnet Mask</div>
                  <div className="flex flex-col md:flex-row md:items-center">
                     <div className="w-24 text-gray-500 text-xs font-bold text-right mr-4 hidden md:block">SUBNET MASK</div>
                     <div className="flex-1 flex justify-between font-mono text-[0.65rem] sm:text-sm md:text-base tracking-widest sm:tracking-wider">
                        {visualData.binMask.split('').map((bit, i) => (
                           <React.Fragment key={i}>
                              {i > 0 && i % 8 === 0 && <span className="text-slate-700 mx-[1px] sm:mx-1">.</span>}
                              <span className={`${i < cidr ? 'text-green-400 opacity-50' : 'text-blue-400 opacity-50'}`}>
                                 {bit}
                              </span>
                           </React.Fragment>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Legend */}
               <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-800 text-[10px] sm:text-xs font-bold justify-end">
                  <div className="flex items-center gap-2 bg-slate-800/50 px-2 py-1 rounded">
                     <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                     <span className="text-green-400">ネットワーク部 ({cidr} bits)</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-800/50 px-2 py-1 rounded">
                     <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                     <span className="text-blue-400">ホスト部 ({32 - cidr} bits)</span>
                  </div>
               </div>
            </div>

            {/* Network Info Table */}
            <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl">
               <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300 table-fixed">
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                     <tr className="bg-gray-50 dark:bg-gray-800">
                        <th className="p-3 font-bold w-1/3 text-xs md:text-sm">ネットワークアドレス</th>
                        <td className="p-3 font-mono break-all">{visualData.network}</td>
                     </tr>
                     <tr>
                        <th className="p-3 font-bold w-1/3 text-xs md:text-sm">最初のホスト</th>
                        <td className="p-3 font-mono break-all">{visualData.firstUsable}</td>
                     </tr>
                     <tr className="bg-gray-50 dark:bg-gray-800">
                        <th className="p-3 font-bold w-1/3 text-xs md:text-sm">最後のホスト</th>
                        <td className="p-3 font-mono break-all">{visualData.lastUsable}</td>
                     </tr>
                     <tr>
                        <th className="p-3 font-bold w-1/3 text-xs md:text-sm">ブロードキャスト</th>
                        <td className="p-3 font-mono break-all">{visualData.broadcast}</td>
                     </tr>
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {/* === CHECK TAB === */}
        {activeTab === 'check' && (
           <div className="animate-fade-in space-y-8 flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="w-full max-w-2xl space-y-6">
                 <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full">
                       <label className="block text-sm font-bold text-gray-500 mb-2">判定したいIPアドレス</label>
                       <input 
                          type="text" 
                          value={checkIp}
                          onChange={(e) => setCheckIp(e.target.value)}
                          placeholder="例: 192.168.1.50"
                          className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg md:text-xl font-mono text-center"
                       />
                    </div>
                    <div className="text-gray-400 rotate-90 md:rotate-0">
                       <ArrowRight size={32} />
                    </div>
                    <div className="flex-1 w-full">
                       <label className="block text-sm font-bold text-gray-500 mb-2">ネットワーク帯域 (CIDR)</label>
                       <input 
                          type="text" 
                          value={checkNetwork}
                          onChange={(e) => setCheckNetwork(e.target.value)}
                          placeholder="例: 192.168.1.0/24"
                          className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg md:text-xl font-mono text-center"
                       />
                    </div>
                 </div>

                 <div className={`rounded-3xl p-8 text-center transition-all transform duration-300 ${
                    checkResult === 'ok' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 scale-105 shadow-xl' :
                    checkResult === 'ng' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 scale-105 shadow-xl' :
                    'bg-gray-100 dark:bg-gray-800 text-gray-400'
                 }`}>
                    {checkResult === 'idle' && (
                       <div>
                          <Search size={48} className="mx-auto mb-2 opacity-30" />
                          <p className="font-bold">入力してください</p>
                       </div>
                    )}
                    {checkResult === 'error' && (
                       <div>
                          <XCircle size={48} className="mx-auto mb-2" />
                          <p className="font-bold text-xl">入力エラー</p>
                          <p className="text-sm mt-1">IPアドレスの形式を確認してください</p>
                       </div>
                    )}
                    {checkResult === 'ok' && (
                       <div className="animate-bounce-short">
                          <CheckCircle2 size={64} className="mx-auto mb-4" />
                          <p className="font-black text-4xl">OK</p>
                          <p className="font-bold mt-2">範囲内に含まれています</p>
                       </div>
                    )}
                    {checkResult === 'ng' && (
                       <div className="animate-shake">
                          <XCircle size={64} className="mx-auto mb-4" />
                          <p className="font-black text-4xl">NG</p>
                          <p className="font-bold mt-2">範囲外です</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        )}

        {/* === CALC TAB === */}
        {activeTab === 'calc' && (
           <div className="animate-fade-in space-y-8 max-w-2xl mx-auto py-8">
              <div className="text-center">
                 <label className="block text-lg font-bold text-gray-700 dark:text-gray-300 mb-4">
                    必要なホスト（デバイス）数は？
                 </label>
                 <div className="relative max-w-xs mx-auto">
                    <input 
                       type="number" 
                       min="1"
                       value={neededHosts}
                       onChange={(e) => setNeededHosts(Number(e.target.value))}
                       className="w-full p-4 pl-8 rounded-2xl border-2 border-cyan-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-3xl font-bold text-center shadow-lg focus:outline-none focus:ring-4 focus:ring-cyan-200 dark:focus:ring-cyan-900"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">台</span>
                 </div>
              </div>

              {calcResult && !calcResult.error && (
                 <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl p-1 shadow-2xl text-white">
                    <div className="bg-white dark:bg-gray-900 rounded-[22px] p-6 md:p-8 text-center h-full">
                       <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest mb-4">推奨設定</p>
                       
                       <div className="flex items-center justify-center gap-2 mb-2">
                          <span className="text-5xl md:text-7xl font-black text-cyan-600 dark:text-cyan-400">/{calcResult.cidr}</span>
                       </div>
                       
                       <p className="text-gray-400 text-sm font-bold mb-8 break-all">サブネットマスク: {calcResult.mask}</p>

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                          <div>
                             <p className="text-xs text-gray-400 font-bold mb-1">最大収容数</p>
                             <p className="text-2xl font-bold text-gray-800 dark:text-white break-all">{calcResult.maxHosts.toLocaleString()} <span className="text-sm font-normal">台</span></p>
                          </div>
                          <div>
                             <p className="text-xs text-gray-400 font-bold mb-1">余剰 (Overhead)</p>
                             <p className={`text-2xl font-bold break-all ${calcResult.overhead > 50 ? 'text-yellow-500' : 'text-green-500'}`}>
                                +{calcResult.overhead.toLocaleString()} <span className="text-sm font-normal">台</span>
                             </p>
                          </div>
                       </div>
                       
                       {calcResult.overhead > 100 && (
                          <p className="mt-4 text-xs text-yellow-600 dark:text-yellow-400 font-bold flex items-center justify-center gap-1">
                             <Cpu size={14} /> 無駄が多い可能性があります
                          </p>
                       )}
                    </div>
                 </div>
              )}
              {calcResult?.error && (
                 <div className="text-center text-red-500 font-bold p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    {calcResult.error}
                 </div>
              )}
           </div>
        )}

      </div>
    </div>
  );
};

export default IpSubnetVisualizer;
