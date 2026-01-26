import React, { useState, useEffect } from 'react';
import alasql from 'alasql';
import { Database, Play, Trash2, Table, Terminal, RefreshCcw } from 'lucide-react';

const SqlPlayground: React.FC = () => {
  const [sql, setSql] = useState<string>('SELECT * FROM users');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'result' | 'schema'>('result');

  // Initialize DB with sample data
  useEffect(() => {
    try {
      alasql('CREATE TABLE IF NOT EXISTS users (id INT, name STRING, role STRING, age INT)');
      // Check if data exists to avoid duplicates on re-render if using persistent storage (alasql is memory by default here)
      const res = alasql('SELECT * FROM users');
      if (res.length === 0) {
        alasql("INSERT INTO users VALUES (1, 'Alice', 'Admin', 28), (2, 'Bob', 'User', 35), (3, 'Charlie', 'User', 22), (4, 'Dave', 'Manager', 40)");
      }
      runQuery('SELECT * FROM users');
    } catch (e) {
      console.error(e);
    }
  }, []);

  const runQuery = (queryOverride?: string) => {
    const query = queryOverride || sql;
    setError(null);
    try {
      // Allow multiple statements, take last result if array
      const res = alasql(query);
      if (Array.isArray(res)) {
         // If it's a nested array (multiple queries), take the last one that is an array of objects
         if (res.length > 0 && Array.isArray(res[0])) {
             setResults(res[res.length - 1]);
         } else {
             setResults(res);
         }
      } else {
         // Non-select query might return count or object
         setResults([{ status: 'OK', result: JSON.stringify(res) }]);
      }
    } catch (e: any) {
      setError(e.message);
      setResults([]);
    }
  };

  const resetDb = () => {
      alasql('DROP TABLE IF EXISTS users');
      alasql('CREATE TABLE users (id INT, name STRING, role STRING, age INT)');
      alasql("INSERT INTO users VALUES (1, 'Alice', 'Admin', 28), (2, 'Bob', 'User', 35), (3, 'Charlie', 'User', 22), (4, 'Dave', 'Manager', 40)");
      setSql('SELECT * FROM users');
      runQuery('SELECT * FROM users');
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col gap-6">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 shrink-0">
           <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
             <Database className="text-blue-500" />
             オンラインSQL
           </h2>
           <div className="flex gap-2">
              <button onClick={resetDb} className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                 <RefreshCcw size={16} /> リセット
              </button>
              <button onClick={() => setSql('')} className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                 <Trash2 size={16} /> クリア
              </button>
              <button 
                 onClick={() => runQuery()} 
                 className="flex items-center gap-1 px-4 py-1.5 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
              >
                 <Play size={16} /> 実行 (Run)
              </button>
           </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
           {/* Editor Side */}
           <div className="flex flex-col h-full min-h-0 gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                 <Terminal size={16} /> SQL Editor
              </div>
              <textarea 
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                className="flex-1 w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-900 text-green-400 font-mono text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="SELECT * FROM users;"
                spellCheck={false}
              />
              <div className="text-xs text-gray-400">
                 ※ alasqlを使用しています。ブラウザメモリ上で動作し、リロードするとリセットされます。
              </div>
           </div>

           {/* Result Side */}
           <div className="flex flex-col h-full min-h-0 gap-2">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                    <Table size={16} /> Result
                 </div>
                 {results.length > 0 && <span className="text-xs text-gray-500">{results.length} rows</span>}
              </div>
              
              <div className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-auto">
                 {error ? (
                    <div className="p-4 text-red-500 font-mono text-sm">
                       Error: {error}
                    </div>
                 ) : results.length > 0 ? (
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                       <thead className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold sticky top-0 z-10">
                          <tr>
                             {Object.keys(results[0]).map((key) => (
                                <th key={key} className="p-3 border-b border-gray-200 dark:border-gray-600">{key}</th>
                             ))}
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {results.map((row, i) => (
                             <tr key={i} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                {Object.values(row).map((val: any, j) => (
                                   <td key={j} className="p-3 font-mono text-xs">{String(val)}</td>
                                ))}
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                       結果なし
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SqlPlayground;