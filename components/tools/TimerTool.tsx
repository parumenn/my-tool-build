
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Timer, Play, Pause, RotateCcw, Flag, Coffee, Briefcase, Watch, BellOff, Info, ShieldCheck, Zap } from 'lucide-react';
import { WorkspaceContext } from '../WorkspaceContext';
import AdBanner from '../AdBanner';

type Mode = 'timer' | 'stopwatch' | 'pomodoro';

const TimerTool: React.FC = () => {
  const isWorkspace = useContext(WorkspaceContext);
  const [mode, setMode] = useState<Mode>('timer');
  const [timeLeft, setTimeLeft] = useState(300);
  const [initialTime, setInitialTime] = useState(300);
  const [isActive, setIsActive] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [swTime, setSwTime] = useState(0); 
  const [laps, setLaps] = useState<number[]>([]);
  const [pomoMode, setPomoMode] = useState<'work' | 'break'>('work');
  const [manualMin, setManualMin] = useState(5);
  const [manualSec, setManualSec] = useState(0);

  const timerRef = useRef<number | null>(null);
  const swRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
        audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        audioRef.current.loop = true;
    }
    if (isActive && mode !== 'stopwatch') {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsActive(false); setIsRinging(true);
            if(audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(e => {}); }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, mode]);

  useEffect(() => {
    if (isActive && mode === 'stopwatch') {
      const start = Date.now() - swTime;
      swRef.current = window.setInterval(() => { setSwTime(Date.now() - start); }, 10);
    }
    return () => { if (swRef.current) clearInterval(swRef.current); };
  }, [isActive, mode]);

  const toggle = () => { if (isRinging) { stopAlarm(); return; } setIsActive(!isActive); };
  const stopAlarm = () => { setIsRinging(false); if(audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; } };
  const reset = () => { stopAlarm(); setIsActive(false); if (mode === 'stopwatch') { setSwTime(0); setLaps([]); } else if (mode === 'pomodoro') { setTimeLeft(pomoMode === 'work' ? 25 * 60 : 5 * 60); } else { setTimeLeft(initialTime); } };
  const formatTime = (seconds: number) => { const m = Math.floor(seconds / 60); const s = seconds % 60; return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; };
  const formatMs = (ms: number) => { const m = Math.floor(ms / 60000); const s = Math.floor((ms % 60000) / 1000); const cs = Math.floor((ms % 1000) / 10); return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`; };

  return (
    <div className={`mx-auto h-full flex flex-col ${isWorkspace ? 'max-w-full p-2' : 'max-w-3xl space-y-10 pb-20'}`}>
      <div className={`flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shrink-0 ${isWorkspace ? 'mb-2' : 'mb-6'}`}>
        {[{ id: 'timer', label: 'タイマー', icon: Timer }, { id: 'stopwatch', label: 'SW', icon: Watch }, { id: 'pomodoro', label: 'ポモ', icon: Briefcase }].map((m) => (
          <button key={m.id} onClick={() => { stopAlarm(); setMode(m.id as Mode); setIsActive(false); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${mode === m.id ? 'bg-white dark:bg-gray-700 text-rose-600 shadow-sm' : 'text-gray-500'}`}><m.icon size={16} /> {m.label}</button>
        ))}
      </div>
      <div className={`bg-white dark:bg-dark-lighter rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center flex-1 flex flex-col justify-center relative overflow-hidden ${isWorkspace ? 'p-2' : 'p-8 min-h-[400px]'}`}>
        <div className={`font-mono font-bold tabular-nums tracking-tighter ${isWorkspace ? 'text-5xl mb-4' : 'text-8xl md:text-9xl mb-12'} ${isRinging ? 'text-red-500 animate-bounce' : 'text-slate-800 dark:text-white'}`}>{mode === 'stopwatch' ? formatMs(swTime) : formatTime(timeLeft)}</div>
        <div className="flex justify-center gap-4"><button onClick={toggle} className={`rounded-full flex items-center justify-center text-white shadow-lg ${isWorkspace ? 'w-12 h-12' : 'w-20 h-20'} ${isActive ? 'bg-orange-500' : 'bg-rose-500'}`}>{isActive ? <Pause /> : <Play />}</button><button onClick={reset} className={`rounded-full flex items-center justify-center text-gray-600 bg-gray-100 ${isWorkspace ? 'w-12 h-12' : 'w-20 h-20'}`}><RotateCcw /></button></div>
      </div>

      {!isWorkspace && (
        <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
           <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />作業効率を最大化する時間管理</h2>
           <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              <div>
                 <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-rose-500" />ポモドーロ・テクニックの活用</h3>
                 <p>25分の集中作業と5分の短い休憩を繰り返すことで、疲労を抑えつつ高い生産性を維持できます。当ツールのポモドーロモードを使えば、ワンタップで理想的なタイムサイクルをセットできます。</p>
              </div>
              <div>
                 <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-rose-500" />多目的な計測に</h3>
                 <p>プレゼンの練習、料理、スポーツのインターバルなど、生活のあらゆるシーンで役立つタイマーと、1/100秒まで正確に計測できるストップウォッチを統合しました。アラーム音はブラウザで鳴るため、周囲への配慮も可能です。</p>
              </div>
           </div>
        </article>
      )}
      {!isWorkspace && <AdBanner />}
    </div>
  );
};

export default TimerTool;
