
import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Minus, RotateCcw, Play, Pause, Info, ShieldCheck, Zap } from 'lucide-react';

const Scoreboard: React.FC = () => {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [time, setTime] = useState(600);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval: number;
    if (timerActive && time > 0) interval = window.setInterval(() => setTime(t => t - 1), 1000);
    else if (time === 0) setTimerActive(false);
    return () => clearInterval(interval);
  }, [timerActive, time]);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60); const sec = s % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
       <div className="bg-gray-900 rounded-3xl p-8 shadow-2xl border-4 border-gray-800 text-white relative">
          <div className="flex justify-center mb-8"><div className="bg-black/50 px-6 py-2 rounded-full border border-gray-700 font-mono text-4xl text-yellow-400">{formatTime(time)}</div></div>
          <div className="grid grid-cols-2 gap-8 mb-12">
             <div className="text-center"><div className="bg-black/40 rounded-3xl p-8 text-[8rem] font-black border-2 border-blue-900/50 mb-4">{scoreA}</div><div className="flex justify-center gap-4"><button onClick={() => setScoreA(Math.max(0, scoreA-1))} className="w-12 h-12 rounded-full bg-gray-800"><Minus className="mx-auto"/></button><button onClick={() => setScoreA(scoreA+1)} className="w-12 h-12 rounded-full bg-blue-600"><Plus className="mx-auto"/></button></div></div>
             <div className="text-center"><div className="bg-black/40 rounded-3xl p-8 text-[8rem] font-black border-2 border-red-900/50 mb-4">{scoreB}</div><div className="flex justify-center gap-4"><button onClick={() => setScoreB(Math.max(0, scoreB-1))} className="w-12 h-12 rounded-full bg-gray-800"><Minus className="mx-auto"/></button><button onClick={() => setScoreB(scoreB+1)} className="w-12 h-12 rounded-full bg-red-600"><Plus className="mx-auto"/></button></div></div>
          </div>
          <div className="flex justify-center gap-4"><button onClick={() => setTimerActive(!timerActive)} className="px-8 py-3 rounded-xl bg-yellow-600 font-bold">{timerActive ? 'STOP' : 'START'}</button><button onClick={() => {setTime(600); setScoreA(0); setScoreB(0);}} className="px-8 py-3 rounded-xl bg-gray-800"><RotateCcw size={18} /></button></div>
       </div>

       <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />多目的スコアボードの活用法</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-blue-700" />あらゆる競技・ゲームに対応</h3>
               <p>バスケットボール、サッカー、卓球、ボードゲーム、Eスポーツなど、2チームで競うあらゆるアクティビティで使用できる多機能な得点板です。大きな文字とハイコントラストな配色により、少し離れた場所からもスコアを確認できます。タイマー機能も内蔵しており、残り時間の管理も同時に行えます。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-blue-700" />アプリ不要・全デバイス対応</h3>
               <p>タブレットやスマホがあれば、高価な電光掲示板の代わりとして今すぐ利用可能です。ブラウザをフルスクリーン（F11キー）にすることで、より本格的なスコアボードとして機能します。インストールの必要はなく、完全に無料・登録不要で開放されています。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default Scoreboard;
