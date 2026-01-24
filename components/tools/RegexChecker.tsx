import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle } from 'lucide-react';

const RegexChecker: React.FC = () => {
  const [pattern, setPattern] = useState(String.raw`\d+`);
  const [flags, setFlags] = useState('gm');
  const [text, setText] = useState('My phone number is 123-456-7890 and zip code is 98765.');
  const [matches, setMatches] = useState<RegExpMatchArray | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [highlightedText, setHighlightedText] = useState<React.ReactNode>(text);

  useEffect(() => {
    try {
      const regex = new RegExp(pattern, flags);
      setError(null);
      
      const foundMatches = text.match(regex);
      setMatches(foundMatches);

      // Simple highlight logic (Note: This is basic and doesn't handle overlapping/complex cases perfectly but works for visuals)
      if (!pattern) {
          setHighlightedText(text);
          return;
      }

      let lastIndex = 0;
      const nodes: React.ReactNode[] = [];
      let match;
      
      // We need a loop with exec for global flag to get indices
      // Make sure 'g' flag is present for the loop to work correctly across all matches for highlighting
      const loopRegex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');

      while ((match = loopRegex.exec(text)) !== null) {
          if (match.index > lastIndex) {
              nodes.push(text.substring(lastIndex, match.index));
          }
          nodes.push(
              <span key={match.index} className="bg-yellow-200 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-200 rounded px-0.5 border-b-2 border-yellow-500">
                  {match[0]}
              </span>
          );
          lastIndex = loopRegex.lastIndex;
          if (match[0].length === 0) {
              loopRegex.lastIndex++; // Avoid infinite loop for zero-length matches
          }
      }
      if (lastIndex < text.length) {
          nodes.push(text.substring(lastIndex));
      }
      setHighlightedText(nodes);

    } catch (e: any) {
      setError(e.message);
      setMatches(null);
      setHighlightedText(text);
    }
  }, [pattern, flags, text]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <Search className="text-teal-500" />
          正規表現チェッカー
        </h2>

        <div className="space-y-6">
           {/* Regex Input */}
           <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                 <div className="absolute left-3 top-3 text-gray-400 font-mono text-lg">/</div>
                 <input 
                    type="text" 
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    className={`w-full p-3 pl-8 rounded-xl border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-teal-500'} dark:bg-gray-800 dark:text-white font-mono text-lg`}
                    placeholder="Pattern..."
                 />
                 <div className="absolute right-3 top-3 text-gray-400 font-mono text-lg">/</div>
              </div>
              <div className="w-full md:w-32">
                 <input 
                    type="text" 
                    value={flags}
                    onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ''))}
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white font-mono text-lg"
                    placeholder="flags"
                 />
              </div>
           </div>
           
           {error && (
              <div className="text-red-500 text-sm flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                 <AlertTriangle size={16} /> {error}
              </div>
           )}

           {/* Test String */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
              <div className="flex flex-col h-full">
                 <label className="font-bold text-gray-700 dark:text-gray-300 mb-2">テスト文字列</label>
                 <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="flex-1 p-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white font-mono text-sm resize-none focus:ring-2 focus:ring-teal-500"
                 />
              </div>
              <div className="flex flex-col h-full">
                 <label className="font-bold text-gray-700 dark:text-gray-300 mb-2">結果ハイライト</label>
                 <div className="flex-1 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-mono text-sm overflow-y-auto whitespace-pre-wrap dark:text-gray-300">
                    {highlightedText}
                 </div>
              </div>
           </div>
           
           {/* Match Info */}
           <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl border border-teal-100 dark:border-teal-800">
              <span className="font-bold text-teal-800 dark:text-teal-300">
                 {matches ? `${matches.length} matches found` : 'No matches'}
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RegexChecker;