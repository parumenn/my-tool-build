
import React, { useState, useEffect } from 'react';
import { Calendar, ArrowRight, Calculator, Clock, CalendarDays, History, Info, ShieldCheck, Zap } from 'lucide-react';

const DateCalculator: React.FC = () => {
  const [mode, setMode] = useState<'diff' | 'calc'>('diff');

  // --- Duration Calculation State ---
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [includeEndDate, setIncludeEndDate] = useState(false);
  const [diffResult, setDiffResult] = useState<{days: number, weeks: string, months: string} | null>(null);

  // --- Date Calculation State ---
  const [baseDate, setBaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [operator, setOperator] = useState<1 | -1>(1); 
  const [addYears, setAddYears] = useState<number>(0);
  const [addMonths, setAddMonths] = useState<number>(0);
  const [addWeeks, setAddWeeks] = useState<number>(0);
  const [addDays, setAddDays] = useState<number>(0);
  const [calcResult, setCalcResult] = useState<string>('');
  const [calcWeekday, setCalcWeekday] = useState<string>('');

  const getWeekday = (date: Date) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[date.getDay()];
  };

  useEffect(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    let diffTime = end.getTime() - start.getTime();
    let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (includeEndDate) diffDays += (diffDays >= 0 ? 1 : -1);
    const weeks = (Math.abs(diffDays) / 7).toFixed(1);
    let monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (end.getDate() < start.getDate()) monthsDiff--;
    setDiffResult({ days: diffDays, weeks: weeks, months: Math.abs(monthsDiff) > 0 ? `${monthsDiff}ヶ月` : '1ヶ月未満' });
  }, [startDate, endDate, includeEndDate]);

  useEffect(() => {
    const base = new Date(baseDate);
    if (isNaN(base.getTime())) { setCalcResult('無効な日付'); setCalcWeekday(''); return; }
    const result = new Date(base);
    result.setFullYear(result.getFullYear() + (operator * addYears));
    result.setMonth(result.getMonth() + (operator * addMonths));
    result.setDate(result.getDate() + (operator * (addDays + (addWeeks * 7))));
    setCalcResult(result.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }));
    setCalcWeekday(getWeekday(result));
  }, [baseDate, operator, addYears, addMonths, addWeeks, addDays]);

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <CalendarDays className="text-indigo-500" />
          日付・期間計算
        </h2>

        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-8">
            <button onClick={() => setMode('diff')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${mode === 'diff' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500'}`}><History size={18} /> 期間を計算</button>
            <button onClick={() => setMode('calc')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${mode === 'calc' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500'}`}><Calculator size={18} /> 日付を計算</button>
        </div>

        {mode === 'diff' ? (
            <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-8">
                <div className="space-y-6">
                    <div><label className="block text-sm font-bold text-gray-500 mb-2">開始日</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-4 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold" /></div>
                    <div className="flex justify-center text-gray-400"><ArrowRight className="rotate-90 md:rotate-0" /></div>
                    <div><label className="block text-sm font-bold text-gray-500 mb-2">終了日</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-4 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold" /></div>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><input type="checkbox" checked={includeEndDate} onChange={(e) => setIncludeEndDate(e.target.checked)} className="w-5 h-5 rounded text-indigo-600" /><span className="text-gray-700 dark:text-gray-300 font-bold text-sm">初日を含める (+1日)</span></label>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-3xl border border-indigo-100 dark:border-indigo-800 flex flex-col items-center text-center">
                    <p className="text-sm font-bold text-indigo-500 mb-2 uppercase tracking-wider">日数差</p>
                    <div className="text-6xl font-black text-slate-800 dark:text-white mb-2 tabular-nums">{diffResult?.days.toLocaleString()}<span className="text-lg font-bold text-gray-400 ml-1">日</span></div>
                    <div className="flex gap-4 text-sm font-bold text-gray-500 dark:text-gray-400 mt-4"><span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm">約 {diffResult?.weeks} 週間</span><span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm">約 {diffResult?.months}</span></div>
                </div>
            </div>
        ) : (
            <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                    <div><label className="block text-sm font-bold text-gray-500 mb-2">基準日</label><input type="date" value={baseDate} onChange={(e) => setBaseDate(e.target.value)} className="w-full p-4 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold" /></div>
                    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <button onClick={() => setOperator(1)} className={`flex-1 py-2 font-bold rounded-md ${operator === 1 ? 'bg-white dark:bg-gray-600 text-indigo-600' : 'text-gray-500'}`}>＋ 加算 (後)</button>
                        <button onClick={() => setOperator(-1)} className={`flex-1 py-2 font-bold rounded-md ${operator === -1 ? 'bg-white dark:bg-gray-600 text-indigo-600' : 'text-gray-500'}`}>－ 減算 (前)</button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">年</label><input type="number" min="0" value={addYears} onChange={e => setAddYears(Number(e.target.value))} className="w-full p-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold" /></div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">ヶ月</label><input type="number" min="0" value={addMonths} onChange={e => setAddMonths(Number(e.target.value))} className="w-full p-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold" /></div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">日</label><input type="number" min="0" value={addDays} onChange={e => setAddDays(Number(e.target.value))} className="w-full p-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold" /></div>
                    </div>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-3xl border border-indigo-100 dark:border-indigo-800 flex flex-col items-center text-center">
                    <p className="text-sm font-bold text-indigo-500 mb-2 uppercase tracking-wider">計算結果</p>
                    <div className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white mb-2">{calcResult}</div>
                    <div className="text-2xl font-bold text-indigo-400">{calcWeekday && `(${calcWeekday})`}</div>
                </div>
            </div>
        )}
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />日付計算ツールの実用的な使い方</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-indigo-500" />ビジネスや契約管理に</h3>
               <p>「契約から○ヶ月後」「支払い期限まであと何日」といった計算をミスなく行えます。法的な日数計算では「初日を算入するか」が重要になることが多いため、チェックボックスで簡単に調整できるよう設計しました。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-indigo-500" />個人のライフイベントに</h3>
               <p>生まれてから今日で何日目か、次の旅行まであと何週間かなど、日常のふとした疑問を解消します。ブラウザ内のみで計算が完結するため、入力した日付がサーバーに送信されることはなく、プライバシーも万全です。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default DateCalculator;
