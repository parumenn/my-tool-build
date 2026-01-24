import React, { useState, useEffect, useRef, useContext } from 'react';
import { Timer, Play, Pause, RotateCcw, Flag, Coffee, Briefcase, Watch, BellOff } from 'lucide-react';
import { WorkspaceContext } from '../WorkspaceContext';

type Mode = 'timer' | 'stopwatch' | 'pomodoro';

const TimerTool: React.FC = () => {
  const isWorkspace = useContext(WorkspaceContext);
  const [mode, setMode] = useState<Mode>('timer');
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(300);
  const [initialTime, setInitialTime] = useState(300);
  const [isActive, setIsActive] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  
  // Stopwatch State
  const [swTime, setSwTime] = useState(0); 
  const [laps, setLaps] = useState<number[]>([]);

  // Pomodoro State
  const [pomoMode, setPomoMode] = useState<'work' | 'break'>('work');

  // Manual Input State
  const [manualMin, setManualMin] = useState(5);
  const [manualSec, setManualSec] = useState(0);

  const timerRef = useRef<number | null>(null);
  const swRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Effects ---
  useEffect(() => {
    // Initialize Audio
    if (!audioRef.current) {
        audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        audioRef.current.loop = true; // Loop the sound
    }

    if (isActive && mode !== 'stopwatch') {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsActive(false);
            setIsRinging(true);
            if(audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(e => console.error("Audio play failed", e));
            }
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
      swRef.current = window.setInterval(() => {
        setSwTime(Date.now() - start);
      }, 10);
    }
    return () => { if (swRef.current) clearInterval(swRef.current); };
  }, [isActive, mode]);

  // --- Handlers ---
  const toggle = () => {
      if (isRinging) {
          stopAlarm();
          return;
      }
      setIsActive(!isActive);
  };
  
  const stopAlarm = () => {
      setIsRinging(false);
      if(audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
      }
  };

  const reset = () => {
    stopAlarm();
    setIsActive(false);
    if (mode === 'stopwatch') {
      setSwTime(0);
      setLaps([]);
    } else if (mode === 'pomodoro') {
      setTimeLeft(pomoMode === 'work' ? 25 * 60 : 5 * 60);
    } else {
      setTimeLeft(initialTime);
    }
  };

  const handleLap = () => {
    if (mode === 'stopwatch') setLaps(prev => [swTime, ...prev]);
  };

  const setCustomTimer = () => {
    stopAlarm();
    setIsActive(false);
    const totalSec = (manualMin * 60) + manualSec;
    setInitialTime(totalSec);
    setTimeLeft(totalSec);
  };

  const switchPomo = (type: 'work' | 'break') => {
    stopAlarm();
    setIsActive(false);
    setPomoMode(type);
    setTimeLeft(type === 'work' ? 25 * 60 : 5 * 60);
  };

  // --- Formatters ---
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatMs = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`mx-auto h-full flex flex-col ${isWorkspace ? 'max-w-full p-2' : 'max-w-3xl space-y-6'} ${isRinging ? 'animate-pulse bg-red-100 dark:bg-red-900/30 p-4 rounded-3xl' : ''}`}>
      {/* Mode Switcher */}
      <div className={`flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shrink-0 ${isWorkspace ? 'mb-2' : ''}`}>
        {[
          { id: 'timer', label: isWorkspace ? 'タイマー' : 'タイマー', icon: Timer },
          { id: 'stopwatch', label: isWorkspace ? 'SW' : 'ストップウォッチ', icon: Watch },
          { id: 'pomodoro', label: isWorkspace ? 'ポモ' : 'ポモドーロ', icon: Briefcase }
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => {
              stopAlarm();
              setMode(m.id as Mode);
              setIsActive(false);
              if (m.id === 'pomodoro') setTimeLeft(25 * 60);
              else if (m.id === 'timer') setTimeLeft(300);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === m.id 
                ? 'bg-white dark:bg-gray-700 text-rose-600 dark:text-rose-400 shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <m.icon size={16} /> {m.label}
          </button>
        ))}
      </div>

      <div className={`bg-white dark:bg-dark-lighter rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center flex-1 flex flex-col justify-center relative overflow-hidden ${isWorkspace ? 'p-2' : 'p-8 min-h-[400px]'}`}>
        
        {/* Custom Timer Input */}
        {mode === 'timer' && !isActive && timeLeft === initialTime && (
          <div className={`mb-2 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 ${isWorkspace ? 'p-2' : 'p-4 mb-8'}`}>
            <div className="flex justify-center items-center gap-1 mb-2">
               <input 
                  type="number" min="0" max="999"
                  value={manualMin}
                  onChange={(e) => setManualMin(Number(e.target.value))}
                  className={`text-center font-bold rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-rose-500 outline-none ${isWorkspace ? 'w-16 p-1 text-xl' : 'w-24 p-3 text-3xl'}`}
               />
               <span className={`font-bold text-gray-300 dark:text-gray-600 ${isWorkspace ? 'text-xl' : 'text-4xl'}`}>:</span>
               <input 
                  type="number" min="0" max="59"
                  value={manualSec}
                  onChange={(e) => setManualSec(Number(e.target.value))}
                  className={`text-center font-bold rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-rose-500 outline-none ${isWorkspace ? 'w-16 p-1 text-xl' : 'w-24 p-3 text-3xl'}`}
               />
               <button 
                  onClick={setCustomTimer}
                  className={`ml-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 active:scale-95 transition-all ${isWorkspace ? 'px-3 py-1 text-sm' : 'px-6 py-3'}`}
               >
                  セット
               </button>
            </div>
            
            <div className="flex justify-center gap-1 flex-wrap">
                {[1, 3, 5, 10, 30].map(min => (
                <button 
                    key={min} 
                    onClick={() => {
                        setManualMin(min);
                        setManualSec(0);
                        stopAlarm();
                        setIsActive(false);
                        const total = min * 60;
                        setInitialTime(total);
                        setTimeLeft(total);
                    }}
                    className={`rounded-lg font-bold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 ${isWorkspace ? 'px-2 py-1 text-[10px]' : 'px-4 py-1.5 text-sm'}`}
                >
                    {min}
                </button>
                ))}
            </div>
          </div>
        )}

        {/* Pomodoro Controls */}
        {mode === 'pomodoro' && (
           <div className={`flex justify-center gap-2 ${isWorkspace ? 'mb-2' : 'mb-8'}`}>
             <button
               onClick={() => switchPomo('work')}
               className={`rounded-full font-bold flex items-center gap-1 transition-all ${isWorkspace ? 'px-3 py-1 text-xs' : 'px-6 py-2'} ${
                 pomoMode === 'work' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600' : 'text-gray-400'
               }`}
             >
               <Briefcase size={isWorkspace ? 12 : 18} /> 作業
             </button>
             <button
               onClick={() => switchPomo('break')}
               className={`rounded-full font-bold flex items-center gap-1 transition-all ${isWorkspace ? 'px-3 py-1 text-xs' : 'px-6 py-2'} ${
                 pomoMode === 'break' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'text-gray-400'
               }`}
             >
               <Coffee size={isWorkspace ? 12 : 18} /> 休憩
             </button>
           </div>
        )}

        {/* Main Display */}
        <div className={`font-mono font-bold tabular-nums tracking-tighter ${isWorkspace ? 'text-5xl mb-4' : 'text-8xl md:text-9xl mb-12'} ${isRinging ? 'text-red-500 animate-bounce' : 'text-slate-800 dark:text-white'}`}>
          {mode === 'stopwatch' ? formatMs(swTime) : formatTime(timeLeft)}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 relative z-10">
          {isRinging ? (
            <button
               onClick={stopAlarm}
               className={`rounded-full flex items-center justify-center text-white shadow-xl bg-red-600 hover:bg-red-700 animate-pulse font-bold gap-2 ${isWorkspace ? 'px-4 h-12 text-sm' : 'w-auto px-8 h-20 text-xl'}`}
            >
               <BellOff size={isWorkspace ? 20 : 32} /> 停止
            </button>
          ) : (
            <>
              <button
                onClick={toggle}
                className={`rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${isWorkspace ? 'w-12 h-12' : 'w-20 h-20'} ${
                  isActive 
                    ? 'bg-orange-500 hover:bg-orange-600' 
                    : 'bg-rose-500 hover:bg-rose-600'
                }`}
              >
                {isActive ? <Pause size={isWorkspace ? 20 : 32} fill="currentColor" /> : <Play size={isWorkspace ? 20 : 32} fill="currentColor" className="ml-1" />}
              </button>

              {mode === 'stopwatch' && isActive ? (
                <button
                  onClick={handleLap}
                  className={`rounded-full flex items-center justify-center text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors ${isWorkspace ? 'w-12 h-12' : 'w-20 h-20'}`}
                >
                  <Flag size={isWorkspace ? 18 : 28} />
                </button>
              ) : (
                <button
                  onClick={reset}
                  className={`rounded-full flex items-center justify-center text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors ${isWorkspace ? 'w-12 h-12' : 'w-20 h-20'}`}
                >
                  <RotateCcw size={isWorkspace ? 18 : 28} />
                </button>
              )}
            </>
          )}
        </div>

        {/* Laps */}
        {mode === 'stopwatch' && laps.length > 0 && (
          <div className={`overflow-y-auto border-t border-gray-100 dark:border-gray-700 pt-2 text-xs font-mono ${isWorkspace ? 'mt-2 max-h-20' : 'mt-8 max-h-40'}`}>
            {laps.map((lap, i) => (
               <div key={i} className="flex justify-between px-8 py-1 text-gray-500">
                 <span>Lap {laps.length - i}</span>
                 <span>{formatMs(lap)}</span>
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimerTool;