
import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, Info, ShieldCheck, Zap } from 'lucide-react';

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
      if (!pattern) { setHighlightedText(text); return; }
      let lastIndex = 0;
      const nodes: React.ReactNode[] = [];
      let match;
      const loopRegex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
      while ((match = loopRegex.exec(text)) !== null) {
          if (match.index > lastIndex) nodes.push(text.substring(lastIndex, match.index));
          nodes.push(<span key={match.index} className="bg-yellow-200 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-200 rounded px-0.5 border-b-2 border-yellow-500">{match[0]}</span>);
          lastIndex = loopRegex.lastIndex;
          if (match[0].length === 0) loopRegex.lastIndex++;
      }
      if (lastIndex < text.length) nodes.push(text.substring(lastIndex));
      setHighlightedText(nodes);
    } catch (e: any) { setError(e.message); setMatches(null); setHighlightedText(text); }
  }, [pattern, flags, text]);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2"><Search className="text-teal-500" />正規表現チェッカー</h2>
        <div className="space-y-6">
           <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                 <div className="absolute left-3 top-3 text-gray-400 font-mono text-lg">/</div>
                 <input type="text" value={pattern} onChange={(e) => setPattern(e.target.value)} className="w-full p-3 pl-8 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-lg focus:ring-2 focus:ring-teal-500" placeholder="Pattern..." />
                 <div className="absolute right-3 top-3 text-gray-400 font-mono text-lg">/</div>
              </div>
              <input type="text" value={flags} onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ''))} className="w-32 p-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-lg" placeholder="flags" />
           </div>
           {error && <div className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-2 rounded-lg"><AlertTriangle size={16} /> {error}</div>}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[300px]">
              <div className="flex flex-col gap-2"><label className="font-bold text-gray-700 dark:text-gray-300">テスト文字列</label><textarea value={text} onChange={(e) => setText(e.target.value)} className="flex-1 p-4 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm" /></div>
              <div className="flex flex-col gap-2"><label className="font-bold text-gray-700 dark:text-gray-300">結果ハイライト</label><div className="flex-1 p-4 rounded-xl border bg-white dark:bg-gray-900 font-mono text-sm overflow-y-auto whitespace-pre-wrap">{highlightedText}</div></div>
           </div>
           <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl border border-teal-100 font-bold text-teal-800 dark:text-teal-300">{matches ? `${matches.length} matches found` : 'No matches'}</div>
        </div>
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />正規表現（Regex）の基礎とツールの活用</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-teal-600" />文字列操作を極める</h3>
               <p>正規表現は、特定のパターンを持つ文字列を検索・置換するための強力な記法です。メールアドレスのバリデーションやログ解析、特定のフォーマットへの一括置換など、開発現場での用途は多岐にわたります。当ツールでは、マッチ箇所がリアルタイムでハイライトされるため、複雑なパターンの検証も容易です。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-teal-600" />ブラウザで完結する安全な開発環境</h3>
               <p>正規表現のテストのために、重要なデータを外部サーバーに送信するのは危険です。当ツールはブラウザのJavaScriptエンジン内でパターン評価を行うため、入力されたテキストや正規表現パターンが外部に送信されることはありません。機密情報の抽出ロジック構築にも安心してお使いください。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default RegexChecker;
