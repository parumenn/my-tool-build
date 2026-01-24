import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Minus, RotateCcw, Play, Pause } from 'lucide-react';

const Scoreboard: React.FC = () => {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [nameA, setNameA] = useState('HOME');
  const [nameB, setNameB] = useState('GUEST');
  
  // Game Timer
  const [time, setTime] = useState(600); // 10 mins default
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval: number;
    if (timerActive && time > 0) {
      interval = window.setInterval(() => setTime(t => t - 1), 1000);
    } else if (time === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, time]);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="bg-gray-900 rounded-3xl p-8 shadow-2xl border-4 border-gray-800 text-white relative overflow-hidden">
          {/* Timer Display */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 px-6 py-2 rounded-full border border-gray-700 backdrop-blur-md z-10">
             <div className="font-mono text-4xl font-bold text-yellow-400 tabular-nums tracking-widest">
                {formatTime(time)}
             </div>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-8 relative z-0">
             {/* Team A */}
             <div className="flex flex-col items-center">
                <input 
                  type="text" 
                  value={nameA} 
                  onChange={(e) => setNameA(e.target.value)}
                  className="bg-transparent text-center text-2xl font-bold text-blue-400 mb-4 border-b border-transparent focus:border-blue-400 outline-none w-full"
                />
                <div className="bg-black/40 rounded-3xl p-8 w-full text-center border-2 border-blue-900/50">
                   <div className="text-[8rem] leading-none font-black text-white tabular-nums">{scoreA}</div>
                </div>
                <div className="flex gap-4 mt-6">
                   <button onClick={() => setScoreA(Math.max(0, scoreA - 1))} className="w-16 h-16 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center border border-gray-600"><Minus /></button>
                   <button onClick={() => setScoreA(scoreA + 1)} className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-900/50"><Plus /></button>
                </div>
             </div>

             {/* Team B */}
             <div className="flex flex-col items-center">
                <input 
                  type="text" 
                  value={nameB} 
                  onChange={(e) => setNameB(e.target.value)}
                  className="bg-transparent text-center text-2xl font-bold text-red-400 mb-4 border-b border-transparent focus:border-red-400 outline-none w-full"
                />
                <div className="bg-black/40 rounded-3xl p-8 w-full text-center border-2 border-red-900/50">
                   <div className="text-[8rem] leading-none font-black text-white tabular-nums">{scoreB}</div>
                </div>
                <div className="flex gap-4 mt-6">
                   <button onClick={() => setScoreB(Math.max(0, scoreB - 1))} className="w-16 h-16 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center border border-gray-600"><Minus /></button>
                   <button onClick={() => setScoreB(scoreB + 1)} className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-lg shadow-red-900/50"><Plus /></button>
                </div>
             </div>
          </div>

          {/* Controls */}
          <div className="mt-12 flex justify-center gap-4">
             <button onClick={() => setTimerActive(!timerActive)} className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 ${timerActive ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                {timerActive ? <Pause /> : <Play />} {timerActive ? 'ストップ' : 'スタート'}
             </button>
             <button onClick={() => {setTime(600); setTimerActive(false); setScoreA(0); setScoreB(0);}} className="px-8 py-3 rounded-xl font-bold bg-gray-800 text-gray-400 hover:bg-gray-700 flex items-center gap-2">
                <RotateCcw size={18} /> リセット
             </button>
             <div className="flex items-center gap-2 ml-4">
                <button onClick={() => setTime(t => t + 60)} className="px-3 py-1 bg-gray-800 rounded text-xs">+1分</button>
                <button onClick={() => setTime(t => Math.max(0, t - 60))} className="px-3 py-1 bg-gray-800 rounded text-xs">-1分</button>
             </div>
          </div>
       </div>
    </div>
  );
};

export default Scoreboard;