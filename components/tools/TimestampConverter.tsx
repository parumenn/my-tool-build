import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw } from 'lucide-react';

const TimestampConverter: React.FC = () => {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  
  // States
  const [unixInput, setUnixInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  
  // Results
  const [unixToDateResult, setUnixToDateResult] = useState('');
  const [dateToUnixResult, setDateToUnixResult] = useState('');

  useEffect(() => {
     const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
     return () => clearInterval(timer);
  }, []);

  const handleUnixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const val = e.target.value;
     setUnixInput(val);
     if (val) {
        const date = new Date(Number(val) * 1000);
        if (!isNaN(date.getTime())) {
           setUnixToDateResult(date.toLocaleString('ja-JP'));
        } else {
           setUnixToDateResult('Invalid Date');
        }
     } else {
        setUnixToDateResult('');
     }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const val = e.target.value;
     setDateInput(val);
     if (val) {
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
           setDateToUnixResult(Math.floor(date.getTime() / 1000).toString());
        } else {
           setDateToUnixResult('Invalid Date');
        }
     } else {
        setDateToUnixResult('');
     }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <Clock className="text-slate-600 dark:text-slate-400" />
          Unix時間変換
        </h2>

        {/* Current Time */}
        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-6 text-center mb-8">
           <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">現在のUnix Timestamp</p>
           <div className="text-4xl md:text-5xl font-mono font-bold text-slate-800 dark:text-white tabular-nums">
              {now}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Unix -> Date */}
           <div className="space-y-4">
              <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                 Unix Timestamp <span className="text-gray-400">→</span> 日付
              </h3>
              <input 
                 type="number"
                 value={unixInput}
                 onChange={handleUnixChange}
                 placeholder="1609459200"
                 className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg min-h-[50px] flex items-center text-sm font-bold text-gray-600 dark:text-gray-300">
                 {unixToDateResult || '結果がここに表示されます'}
              </div>
           </div>

           {/* Date -> Unix */}
           <div className="space-y-4">
              <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                 日付 <span className="text-gray-400">→</span> Unix Timestamp
              </h3>
              <input 
                 type="datetime-local"
                 value={dateInput}
                 onChange={handleDateChange}
                 className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg min-h-[50px] flex items-center text-sm font-bold text-gray-600 dark:text-gray-300">
                 {dateToUnixResult || '結果がここに表示されます'}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TimestampConverter;