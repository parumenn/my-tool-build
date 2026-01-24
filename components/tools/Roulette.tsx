
import React, { useState, useRef, useEffect } from 'react';
import { Disc, Play, RefreshCw, Plus, X } from 'lucide-react';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const Roulette: React.FC = () => {
  const [items, setItems] = useState<string[]>(['ラーメン', 'カレー', 'パスタ', '定食', 'ハンバーガー']);
  const [newItem, setNewItem] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawRoulette = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const step = (2 * Math.PI) / items.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Slices
    items.forEach((item, i) => {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, i * step, (i + 1) * step);
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(i * step + step / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(item, radius - 20, 5);
      ctx.restore();
    });

    // Draw Arrow
    ctx.beginPath();
    ctx.moveTo(centerX + radius + 5, centerY);
    ctx.lineTo(centerX + radius + 25, centerY - 10);
    ctx.lineTo(centerX + radius + 25, centerY + 10);
    ctx.fillStyle = '#333';
    ctx.fill();
  };

  useEffect(() => {
    drawRoulette();
  }, [items]);

  const addItem = () => {
    if (newItem.trim()) {
      setItems([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeItem = (index: number) => {
    if (items.length > 2) {
      setItems(items.filter((_, i) => i !== index));
    } else {
        alert('最低2つの項目が必要です');
    }
  };

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setResult(null);

    // Calculate random stop position
    const itemAngle = 360 / items.length;
    const randomOffset = Math.random() * 360;
    // Minimize rotation (at least 5 full spins)
    const spinAngle = 360 * 5 + randomOffset;
    
    // We rotate the canvas container CSS, not redraw canvas for performance
    const newRotation = rotation + spinAngle;
    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      // Calculate winner based on final angle
      // The arrow is at 0 degrees (right side in standard canvas arc, but we rotated)
      // Actually simpler: The pointer is fixed at the right (0 deg in canvas context).
      // Since we rotated the disc by `newRotation`, we need to find which slice aligns with 0.
      // Normalize rotation to 0-360
      const actualRotation = newRotation % 360;
      // Because we rotate CLOCKWISE, the slice at 0 moves to actualRotation.
      // We need to find which slice is at 0 degrees (Right). 
      // The slice index I covers angles [I*step, (I+1)*step].
      // When rotated by R, the angle 0 corresponds to original angle -R (or 360-R).
      const winningAngle = (360 - actualRotation) % 360;
      const index = Math.floor(winningAngle / itemAngle);
      setResult(items[index]);
    }, 3000); // 3s animation duration
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Controls */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Disc className="text-pink-500" />
            ルーレット
          </h2>
          
          <div className="flex gap-2">
             <input 
               type="text" 
               value={newItem}
               onChange={(e) => setNewItem(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && addItem()}
               placeholder="項目を追加 (例: 中華)"
               className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
             />
             <button onClick={addItem} className="bg-gray-200 dark:bg-gray-700 p-3 rounded-xl hover:bg-gray-300">
               <Plus />
             </button>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
             {items.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                   <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></span>
                      <span className="font-bold text-gray-700 dark:text-gray-200">{item}</span>
                   </div>
                   <button onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                </div>
             ))}
          </div>
          
          <button 
             onClick={spin} 
             disabled={isSpinning}
             className="w-full py-4 bg-pink-600 text-white font-bold rounded-xl shadow-lg shadow-pink-200 dark:shadow-none hover:bg-pink-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
             {isSpinning ? <RefreshCw className="animate-spin" /> : <Play />}
             {isSpinning ? '回転中...' : 'スタート！'}
          </button>

          {result && !isSpinning && (
             <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl text-center animate-bounce">
                <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400">結果は...</p>
                <p className="text-3xl font-black text-slate-800 dark:text-white mt-2">{result}</p>
             </div>
          )}
        </div>

        {/* Right: Wheel */}
        <div className="flex items-center justify-center relative bg-gray-50 dark:bg-gray-800/50 rounded-2xl overflow-hidden min-h-[300px]">
           <div className="relative">
              <div 
                style={{ transform: `rotate(${rotation}deg)`, transition: isSpinning ? 'transform 3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none' }}
              >
                 <canvas ref={canvasRef} width={300} height={300} />
              </div>
              {/* Arrow Indicator (Fixed overlay) */}
              <div className="absolute top-1/2 -right-4 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[20px] border-r-slate-800 dark:border-r-white -translate-y-1/2 rotate-180 drop-shadow-lg"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Roulette;
