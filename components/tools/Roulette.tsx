
import React, { useState, useRef, useEffect } from 'react';
import { Disc, Play, RefreshCw, Plus, X, Info, ShieldCheck, Zap } from 'lucide-react';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const Roulette: React.FC = () => {
  const [items, setItems] = useState<string[]>(['ランチA', 'ランチB', '中華', 'イタリアン']);
  const [newItem, setNewItem] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const centerX = canvas.width/2, centerY = canvas.height/2, radius = 140, step = (2*Math.PI)/items.length;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    items.forEach((item, i) => {
      ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.arc(centerX, centerY, radius, i*step, (i+1)*step);
      ctx.fillStyle = COLORS[i % COLORS.length]; ctx.fill(); ctx.stroke();
      ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(i*step + step/2);
      ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif';
      ctx.fillText(item, radius - 15, 5); ctx.restore();
    });
  };

  useEffect(() => { draw(); }, [items]);

  const spin = () => {
    if (isSpinning) return; setIsSpinning(true); setResult(null);
    const spinAngle = 360*5 + Math.random()*360; const newRotation = rotation + spinAngle;
    setRotation(newRotation);
    setTimeout(() => {
      setIsSpinning(false);
      const actualRotation = newRotation % 360; const winningAngle = (360 - actualRotation) % 360;
      setResult(items[Math.floor(winningAngle / (360/items.length))]);
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><Disc className="text-pink-500" />ルーレット</h2>
          <div className="flex gap-2"><input type="text" value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && (setItems([...items, newItem]), setNewItem(''))} className="flex-1 p-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="項目追加..." /><button onClick={() => {setItems([...items, newItem]); setNewItem('');}} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl"><Plus/></button></div>
          <div className="max-h-40 overflow-y-auto space-y-1">{items.map((item, i) => <div key={i} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm font-bold"><span>{item}</span><button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-400">×</button></div>)}</div>
          <button onClick={spin} disabled={isSpinning} className="w-full py-4 bg-pink-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">{isSpinning ? <RefreshCw className="animate-spin" /> : <Play />} START</button>
          {result && !isSpinning && <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 text-center font-black text-2xl text-yellow-700 rounded-xl animate-bounce">{result}</div>}
        </div>
        <div className="flex items-center justify-center relative bg-gray-50 dark:bg-gray-900 rounded-2xl">
           <div style={{ transform: `rotate(${rotation}deg)`, transition: isSpinning ? 'transform 3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none' }}><canvas ref={canvasRef} width={300} height={300} /></div>
           <div className="absolute top-1/2 -right-2 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[20px] border-r-slate-800 dark:border-r-white -translate-y-1/2 rotate-180"></div>
        </div>
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />ルーレットツールの面白さと実用性</h2>
         <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-pink-500" />迷った時の最高の味方</h3>
               <p>「今日のお昼は何を食べよう？」「罰ゲームの担当は誰にする？」そんな日常の小さな決断から、抽選会でのアイテム選定まで、エンターテインメント性を込めて解決します。項目は自由に編集でき、リアルな回転アニメーションが緊張感と楽しさを演出します。一度使ったら手放せない、決断サポートツールです。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-pink-500" />公平なJavaScript抽選</h3>
               <p>抽選ロジックはブラウザ上で動作する純粋なランダム計算に基づいており、意図的な偏り（操作）は一切ありません。入力したデータは一時的なもので、ページを更新するとリセットされるか、ブラウザのメモリのみに留まります。プライバシーを保ちつつ、どこでも手軽に公平な抽選を楽しめます。</p>
            </div>
         </div>
      </article>
    </div>
  );
};

export default Roulette;
