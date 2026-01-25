
import React, { useState, useEffect, useCallback } from 'react';
import { Bath, Play, RotateCcw, Info, ShieldCheck } from 'lucide-react';

const BathProcrastinationPreventer: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'counting' | 'finished'>('idle');
  const [count, setCount] = useState(5);
  const [hasFailedOnce, setHasFailedOnce] = useState(false);

  const triggerVibration = useCallback((pattern: number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const startCountdown = () => {
    setStatus('counting');
    setCount(5);
    setHasFailedOnce(false);
  };

  useEffect(() => {
    let timer: number;
    if (status === 'counting' && count > 0) {
      // 鼓動のようなバイブレーション演出
      triggerVibration([100, 50, 100]);
      
      timer = window.setTimeout(() => {
        setCount(prev => prev - 1);
      }, 1000);
    } else if (status === 'counting' && count === 0) {
      // 終了時のバイブレーション
      triggerVibration([500, 200, 500]);
      setStatus('finished');
    }
    return () => clearTimeout(timer);
  }, [status, count, triggerVibration]);

  const reset = () => {
    setStatus('idle');
    setCount(5);
    setHasFailedOnce(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className={`bg-white dark:bg-dark-lighter rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-700 transition-all min-h-[500px] flex flex-col items-center justify-center text-center relative overflow-hidden ${status === 'finished' ? 'ring-8 ring-cyan-500 ring-inset' : ''}`}>
        
        {status === 'idle' && (
          <div className="animate-fade-in flex flex-col items-center space-y-8 w-full">
            <div className="bg-cyan-50 dark:bg-cyan-900/30 w-24 h-24 rounded-full flex items-center justify-center text-cyan-600">
               <Bath size={48} />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-gray-800 dark:text-white">風呂キャン防止ツール</h2>
              {hasFailedOnce ? (
                <div className="bg-rose-50 dark:bg-rose-900/20 px-6 py-3 rounded-2xl border border-rose-100 dark:border-rose-800">
                  <p className="text-rose-600 dark:text-rose-400 font-black flex items-center justify-center gap-2">
                    失敗しちゃった？次は絶対だよ？
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 font-medium max-w-sm mx-auto">
                  あなたの「お風呂に入る」を叶えるツールです。<br/>心の準備ができたらボタンを押してください。
                </p>
              )}
            </div>

            <button
              onClick={startCountdown}
              className="group relative bg-cyan-600 hover:bg-cyan-700 text-white w-48 h-48 rounded-full shadow-2xl shadow-cyan-200 dark:shadow-none transition-all active:scale-90 flex flex-col items-center justify-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 scale-0 group-hover:scale-100 transition-transform rounded-full"></div>
              <Play size={40} fill="currentColor" />
              <span className="font-black text-lg tracking-widest">頑張る</span>
            </button>
          </div>
        )}

        {status === 'counting' && (
          <div className="animate-fade-in space-y-4 flex flex-col items-center">
            <p className="text-cyan-600 dark:text-cyan-400 font-black text-xl uppercase tracking-[0.3em]">お風呂沸かし中...</p>
            <div className="text-[12rem] font-black text-slate-800 dark:text-white leading-none tabular-nums">
              {count}
            </div>
            <div className="flex items-center gap-2 justify-center text-gray-400 font-bold">
               <span>心の準備して！</span>
            </div>
          </div>
        )}

        {status === 'finished' && (
          <div className="animate-fade-in space-y-8 flex flex-col items-center">
            <div className="space-y-2">
              <h2 className="text-5xl md:text-7xl font-black text-cyan-600 dark:text-cyan-400 mb-4">
                はい、動く！！
              </h2>
              <p className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white">
                お風呂いくよ！
              </p>
            </div>
            <div className="bg-cyan-50 dark:bg-cyan-900/30 p-6 rounded-3xl border-2 border-cyan-100 dark:border-cyan-800">
               <p className="font-bold text-cyan-800 dark:text-cyan-200 text-lg">
                  スマホを置いて、<br/>お風呂場へ向かいましょう。
               </p>
            </div>
            <button
              onClick={reset}
              className="text-gray-400 hover:text-cyan-600 font-bold text-sm flex items-center gap-2 pt-8 transition-colors leading-relaxed"
            >
              <RotateCcw size={16} className="shrink-0" />
              <span>
                お風呂行くの失敗しちゃった..<br className="sm:hidden" />（もう一度）
              </span>
            </button>
          </div>
        )}

        {/* 背景の装飾 */}
        {status === 'counting' && (
            <div className="absolute inset-0 pointer-events-none border-[20px] border-cyan-500/10"></div>
        )}
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />「風呂キャン防止」ツールの目的</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2">頑張ってお風呂いく！</h3>
               <p>このページを開いたあなたならきっと入れる！一緒に頑張ってお風呂入りましょう</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2">カウントダウン</h3>
               <p>タイミングさえあれば動けるあなたの為にカウントダウンをします！</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default BathProcrastinationPreventer;
