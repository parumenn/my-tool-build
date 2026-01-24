import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, Coffee, Briefcase } from 'lucide-react';

const PomodoroTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer finished
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
      // Simple notification sound
      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      audio.play().catch(() => {});
      alert(mode === 'work' ? '作業終了！休憩しましょう。' : '休憩終了！作業に戻りましょう。');
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: 'work' | 'break') => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((mode === 'work' ? 25 * 60 : 5 * 60) - timeLeft) / (mode === 'work' ? 25 * 60 : 5 * 60) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center relative overflow-hidden">
        {/* Background Progress Bar */}
        <div 
          className={`absolute bottom-0 left-0 h-2 transition-all duration-1000 ${mode === 'work' ? 'bg-rose-500' : 'bg-emerald-500'}`}
          style={{ width: `${progress}%` }}
        ></div>

        <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center justify-center gap-2">
          <Timer className={mode === 'work' ? 'text-rose-500' : 'text-emerald-500'} />
          ポモドーロタイマー
        </h2>

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => switchMode('work')}
            className={`px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-all ${
              mode === 'work' ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-200' : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            <Briefcase size={18} /> 作業 (25分)
          </button>
          <button
            onClick={() => switchMode('break')}
            className={`px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-all ${
              mode === 'break' ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-200' : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            <Coffee size={18} /> 休憩 (5分)
          </button>
        </div>

        <div className={`text-8xl md:text-9xl font-mono font-bold mb-8 tabular-nums tracking-tighter ${mode === 'work' ? 'text-slate-800' : 'text-emerald-600'}`}>
          {formatTime(timeLeft)}
        </div>

        <div className="flex justify-center gap-6">
          <button
            onClick={toggleTimer}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${
              mode === 'work' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
          </button>
          
          <button
            onClick={resetTimer}
            className="w-20 h-20 rounded-full flex items-center justify-center text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <RotateCcw size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;