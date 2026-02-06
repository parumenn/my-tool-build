
import React, { useState } from 'react';
import { ArrowRightLeft, Copy, Check, Trash2, Info, ShieldCheck, Zap } from 'lucide-react';

const TextConverter: React.FC = () => {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const convert = (mode: 'toHalf' | 'toFull' | 'kanaToHalf' | 'kanaToFull') => {
    let result = input;
    if (mode === 'toHalf') {
        result = result.replace(/[！-～]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/　/g, " ");
    } else if (mode === 'toFull') {
        result = result.replace(/[!-~]/g, s => String.fromCharCode(s.charCodeAt(0) + 0xFEE0)).replace(/ /g, "　");
    } else if (mode === 'kanaToHalf') {
        const map: {[key:string]: string} = {
            'ガ': 'ｶﾞ', 'ギ': 'ｷﾞ', 'グ': 'ｸﾞ', 'ゲ': 'ｹﾞ', 'ゴ': 'ｺﾞ',
            'ザ': 'ｻﾞ', 'ジ': 'ｼﾞ', 'ズ': 'ｽﾞ', 'ゼ': 'ｾﾞ', 'ゾ': 'ｿﾞ',
            'ダ': 'ﾀﾞ', 'ヂ': 'ﾁﾞ', 'ヅ': 'ﾂﾞ', 'デ': 'ﾃﾞ', 'ド': 'ﾄﾞ',
            'バ': 'ﾊﾞ', 'ビ': 'ﾋﾞ', 'ブ': 'ﾌﾞ', 'ベ': 'ﾍﾞ', 'ボ': 'ﾎﾞ',
            'パ': 'ﾊﾟ', 'ピ': 'ﾋﾟ', 'プ': 'ﾌﾟ', 'ペ': 'ﾍﾟ', 'ポ': 'ﾎﾟ',
            'ヴ': 'ｳﾞ', 'あ': 'ｱ', 'い': 'ｲ', 'う': 'ｳ', 'え': 'ｴ', 'お': 'ｵ',
            'ア': 'ｱ', 'イ': 'ｲ', 'ウ': 'ｳ', 'エ': 'ｴ', 'オ': 'ｵ',
            'カ': 'ｶ', 'キ': 'ｷ', 'ク': 'ｸ', 'ケ': 'ｹ', 'コ': 'ｺ',
            'サ': 'ｻ', 'シ': 'ｼ', 'ス': 'ｽ', 'セ': 'ｾ', 'ソ': 'ｿ',
            'タ': 'ﾀ', 'チ': 'ﾁ', 'ツ': 'ﾂ', 'テ': 'ﾃ', 'ト': 'ﾄ',
            'ナ': 'ﾅ', 'ニ': 'ﾆ', 'ヌ': 'ﾇ', 'ネ': 'ﾈ', 'ノ': 'ﾉ',
            'ハ': 'ﾊ', 'ヒ': 'ﾋ', 'フ': 'ﾌ', 'ヘ': 'ﾍ', 'ホ': 'ﾎ',
            'マ': 'ﾏ', 'ミ': 'ﾐ', 'ム': 'ﾑ', 'メ': 'ﾒ', 'モ': 'ﾓ',
            'ヤ': 'ﾔ', 'ユ': 'ﾕ', 'ヨ': 'ﾖ',
            'ラ': 'ﾗ', 'リ': 'ﾘ', 'ル': 'ﾙ', 'レ': 'ﾚ', 'ロ': 'ﾛ',
            'ワ': 'ﾜ', 'ヲ': 'ｦ', 'ン': 'ﾝ',
            'ァ': 'ｧ', 'ィ': 'ｨ', 'ゥ': 'ｩ', 'ェ': 'ｪ', 'ォ': 'ｫ',
            'ッ': 'ｯ', 'ャ': 'ｬ', 'ュ': 'ｭ', 'ョ': 'ｮ',
            'ー': 'ｰ', '。': '｡', '、': '､', '「': '｢', '」': '｣', '・': '･'
        };
        result = result.replace(/[ァ-ンヴー。、]/g, s => map[s] || s);
    } else if (mode === 'kanaToFull') {
        const map: {[key:string]: string} = {
            'ｶﾞ': 'ガ', 'ｷﾞ': 'ギ', 'ｸﾞ': 'グ', 'ｹﾞ': 'ゲ', 'ｺﾞ': 'ゴ',
            'ｻﾞ': 'ザ', 'ｼﾞ': 'ジ', 'ｽﾞ': 'ズ', 'ｾﾞ': 'ゼ', 'ｿﾞ': 'ゾ',
            'ﾀﾞ': 'ダ', 'ﾁﾞ': 'ヂ', 'ﾂﾞ': 'ヅ', 'ﾃﾞ': 'デ', 'ﾄﾞ': 'ド',
            'ﾊﾞ': 'バ', 'ﾋﾞ': 'ビ', 'ﾌﾞ': 'ブ', 'ﾍﾞ': 'ベ', 'ﾎﾞ': 'ボ',
            'ﾊﾟ': 'パ', 'ﾋﾟ': 'ピ', 'ﾌﾟ': 'プ', 'ﾍﾟ': 'ペ', 'ﾎﾟ': 'ポ',
            'ｳﾞ': 'ヴ', 'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
            'カ': 'カ', 'キ': 'キ', 'ク': 'ク', 'ケ': 'ケ', 'コ': 'コ',
            'サ': 'サ', 'シ': 'シ', 'ス': 'ス', 'セ': 'セ', 'ソ': 'ソ',
            'タ': 'タ', 'チ': 'チ', 'ツ': 'ツ', 'テ': 'テ', 'ト': 'ト',
            'ナ': 'ナ', 'ニ': 'ニ', 'ヌ': 'ヌ', 'ネ': 'ネ', 'ノ': 'ノ',
            'ハ': 'ハ', 'ヒ': 'ヒ', 'フ': 'フ', 'ヘ': 'ヘ', 'ホ': 'ホ',
            'マ': 'マ', 'ミ': 'ミ', 'ム': 'ム', 'メ': 'メ', 'モ': 'モ',
            'ヤ': 'ヤ', 'ユ': 'ユ', 'ヨ': 'ヨ',
            'ラ': 'ラ', 'リ': 'リ', 'ル': 'ル', 'レ': 'レ', 'ロ': 'ロ',
            'ワ': 'ワ', 'ヲ': 'ワ', 'ン': 'ン',
            'ァ': 'ァ', 'ィ': 'ィ', 'ゥ': 'ゥ', 'ェ': 'ェ', 'ォ': 'ォ',
            'ッ': 'ッ', 'ャ': 'ャ', 'ュ': 'ュ', 'ョ': 'ョ',
            'ー': 'ー', '。': '。', '、': '、', '「': '「', '」': '」', '・': '・'
        };
        let reg = new RegExp('(' + Object.keys(map).join('|') + ')', 'g');
        result = result.replace(reg, s => map[s] || s);
    }
    setInput(result);
  };

  const copyToClipboard = () => {
    if (!input) return;
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
       <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
             <ArrowRightLeft className="text-indigo-500" />
             全角・半角一括変換
          </h2>

          <div className="space-y-4">
             <div className="relative">
                <textarea 
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   className="w-full h-48 p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
                   placeholder="ここにテキストを入力してください..."
                />
                <div className="absolute bottom-4 right-4 flex gap-2">
                   <button onClick={() => setInput('')} className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-red-100 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                   </button>
                   <button onClick={copyToClipboard} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2">
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? 'コピー済み' : 'コピー'}
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <button onClick={() => convert('toHalf')} className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                   ＡＢＣ → ABC
                   <div className="text-xs font-normal text-gray-400 mt-1">英数字を半角に</div>
                </button>
                <button onClick={() => convert('toFull')} className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                   ABC → ＡＢＣ
                   <div className="text-xs font-normal text-gray-400 mt-1">英数字を全角に</div>
                </button>
                <button onClick={() => convert('kanaToHalf')} className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                   アイウ → ｱｲｳ
                   <div className="text-xs font-normal text-gray-400 mt-1">カタカナを半角に</div>
                </button>
                <button onClick={() => convert('kanaToFull')} className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                   ｱｲｳ → アイウ
                   <div className="text-xs font-normal text-gray-400 mt-1">カタカナを全角に</div>
                </button>
             </div>
          </div>
       </div>

       <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />全角・半角変換が必要な理由と活用法</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-indigo-500" />システム入力や名簿作成を快適に</h3>
               <p>古いシステムや特定の事務手続きでは、「数字は半角で」「カナは全角で」といった厳しい入力制限が設けられていることがあります。手動で打ち直すのは時間がかかり、ミスの原因にもなります。当ツールを使えば、数千文字のテキストも一瞬で指定の形式に整えることが可能です。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-indigo-500" />安全なローカル一括変換</h3>
               <p>変換処理はお客様のブラウザ上のJavaScriptだけで行われます。入力した住所録や個人情報がインターネットを介してサーバーに送信されることはありません。外部漏洩の心配なく、業務上の機密データも安心して整形いただけます。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default TextConverter;
