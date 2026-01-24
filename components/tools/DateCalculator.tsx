import React, { useState, useEffect } from 'react';
import { Calendar, ArrowRight, Calculator, Clock, CalendarDays, History } from 'lucide-react';

const DateCalculator: React.FC = () => {
  const [mode, setMode] = useState<'diff' | 'calc'>('diff');

  // --- Duration Calculation State ---
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [includeEndDate, setIncludeEndDate] = useState(false);
  const [diffResult, setDiffResult] = useState<{days: number, weeks: string, months: string} | null>(null);

  // --- Date Calculation State ---
  const [baseDate, setBaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [operator, setOperator] = useState<1 | -1>(1); // 1: After, -1: Before
  const [addYears, setAddYears] = useState<number>(0);
  const [addMonths, setAddMonths] = useState<number>(0);
  const [addWeeks, setAddWeeks] = useState<number>(0);
  const [addDays, setAddDays] = useState<number>(0);
  const [calcResult, setCalcResult] = useState<string>('');
  const [calcWeekday, setCalcWeekday] = useState<string>('');

  // --- Helpers ---
  const getWeekday = (date: Date) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[date.getDay()];
  };

  // --- Effects ---
  useEffect(() => {
    // Calculate Duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Reset time parts to ensure pure date calculation
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    let diffTime = end.getTime() - start.getTime();
    let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (includeEndDate) {
        diffDays += (diffDays >= 0 ? 1 : -1);
    }

    const weeks = (Math.abs(diffDays) / 7).toFixed(1);
    
    // Approximate months calculation
    let monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    // Adjust if end day is smaller than start day
    if (end.getDate() < start.getDate()) {
        monthsDiff--;
    }
    
    setDiffResult({
        days: diffDays,
        weeks: weeks,
        months: Math.abs(monthsDiff) > 0 ? `${monthsDiff}ヶ月` : '1ヶ月未満'
    });

  }, [startDate, endDate, includeEndDate]);

  useEffect(() => {
    // Calculate Date
    const base = new Date(baseDate);
    if (isNaN(base.getTime())) {
        setCalcResult('無効な日付');
        setCalcWeekday('');
        return;
    }

    // Clone to avoid mutation issues
    const result = new Date(base);
    
    // Add components
    // Note: Order matters. Usually Years -> Months -> Days
    result.setFullYear(result.getFullYear() + (operator * addYears));
    result.setMonth(result.getMonth() + (operator * addMonths));
    result.setDate(result.getDate() + (operator * (addDays + (addWeeks * 7))));

    setCalcResult(result.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }));
    setCalcWeekday(getWeekday(result));

  }, [baseDate, operator, addYears, addMonths, addWeeks, addDays]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <CalendarDays className="text-indigo-500" />
          日付・期間計算
        </h2>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-8">
            <button
              onClick={() => setMode('diff')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
                mode === 'diff' 
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              <History size={18} /> 期間を計算
            </button>
            <button
              onClick={() => setMode('calc')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
                mode === 'calc' 
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              <Calculator size={18} /> 日付を計算
            </button>
        </div>

        {mode === 'diff' ? (
            <div className="animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-2">開始日</label>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-xl font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex justify-center text-gray-400">
                            <ArrowRight className="rotate-90 md:rotate-0" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-2">終了日</label>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-xl font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <input 
                                type="checkbox" 
                                checked={includeEndDate} 
                                onChange={(e) => setIncludeEndDate(e.target.checked)}
                                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300" 
                            />
                            <span className="text-gray-700 dark:text-gray-300 font-bold text-sm">初日を含める (+1日)</span>
                        </label>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-3xl border border-indigo-100 dark:border-indigo-800 h-full flex flex-col justify-center items-center text-center">
                        <p className="text-sm font-bold text-indigo-500 mb-2 uppercase tracking-wider">日数差</p>
                        <div className="text-6xl font-black text-slate-800 dark:text-white mb-2 tabular-nums tracking-tight">
                            {diffResult?.days.toLocaleString()}
                            <span className="text-lg font-bold text-gray-400 ml-1">日</span>
                        </div>
                        <div className="flex gap-4 text-sm font-bold text-gray-500 dark:text-gray-400 mt-4">
                            <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm">約 {diffResult?.weeks} 週間</span>
                            <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm">約 {diffResult?.months}</span>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-2">基準日</label>
                            <input 
                                type="date" 
                                value={baseDate}
                                onChange={(e) => setBaseDate(e.target.value)}
                                className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-xl font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <button onClick={() => setOperator(1)} className={`flex-1 py-2 font-bold rounded-md transition-all ${operator === 1 ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500'}`}>＋ 加算 (後)</button>
                            <button onClick={() => setOperator(-1)} className={`flex-1 py-2 font-bold rounded-md transition-all ${operator === -1 ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500'}`}>－ 減算 (前)</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">年</label>
                                <input type="number" min="0" value={addYears} onChange={e => setAddYears(Number(e.target.value))} className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-bold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">ヶ月</label>
                                <input type="number" min="0" value={addMonths} onChange={e => setAddMonths(Number(e.target.value))} className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-bold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">週間</label>
                                <input type="number" min="0" value={addWeeks} onChange={e => setAddWeeks(Number(e.target.value))} className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-bold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">日</label>
                                <input type="number" min="0" value={addDays} onChange={e => setAddDays(Number(e.target.value))} className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-bold" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-3xl border border-indigo-100 dark:border-indigo-800 h-full flex flex-col justify-center items-center text-center">
                        <p className="text-sm font-bold text-indigo-500 mb-2 uppercase tracking-wider">計算結果</p>
                        <div className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
                            {calcResult}
                        </div>
                        <div className="text-2xl font-bold text-indigo-400">
                            {calcWeekday && `(${calcWeekday})`}
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl flex gap-3 text-sm text-yellow-800 dark:text-yellow-200 border border-yellow-100 dark:border-yellow-800/30">
            <Clock className="shrink-0" />
            <p>
                <strong>豆知識:</strong> 期間計算は「初日を含まない」のが一般的ですが、契約期間や旅行日数の計算などでは「初日を含める」ことが多いです。必要に応じてチェックボックスを使用してください。
            </p>
        </div>
      </div>
    </div>
  );
};

export default DateCalculator;