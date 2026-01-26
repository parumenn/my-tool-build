
import React, { useState } from 'react';
import { Tool } from '../../types';
import { Grid2X2, Columns, Layout, Plus, X, Monitor, Grid3X3, Smartphone, ChevronDown, Download } from 'lucide-react';
import { WorkspaceContext } from '../WorkspaceContext';

// Import Tool Components
import QRCodeGenerator from './QRCodeGenerator';
import CharacterCounter from './CharacterCounter';
import BinaryConverter from './BinaryConverter';
import IpChecker from './IpChecker';
import TimerTool from './TimerTool';
import Notepad from './Notepad';
import Kakeibo from './Kakeibo';
import CalculatorTool from './CalculatorTool';
import Scoreboard from './Scoreboard';
import UnitConverter from './UnitConverter';
import RandomGenerator from './RandomGenerator';
import AspectRatioCalculator from './AspectRatioCalculator';
import UuidGenerator from './UuidGenerator';
import CaseConverter from './CaseConverter';
import Roulette from './Roulette';
import TextConverter from './TextConverter';
import HashGenerator from './HashGenerator';
import Flashcards from './Flashcards';
import TaskManager from './TaskManager';
import PdfTools from './PdfTools';
import HtmlEditor from './HtmlEditor';
import ColorPickerTool from './ColorPickerTool';

// Map ID to Component
const TOOL_COMPONENTS: Record<string, React.FC> = {
  qrcode: QRCodeGenerator,
  count: CharacterCounter,
  binary: BinaryConverter,
  ip: IpChecker,
  timer: TimerTool,
  notepad: Notepad,
  kakeibo: Kakeibo,
  calculator: CalculatorTool,
  scoreboard: Scoreboard,
  unit: UnitConverter,
  random: RandomGenerator,
  ratio: AspectRatioCalculator,
  uuid: UuidGenerator,
  case: CaseConverter,
  roulette: Roulette,
  'text-conv': TextConverter,
  hash: HashGenerator,
  flashcards: Flashcards,
  tasks: TaskManager,
  pdf: PdfTools,
  html: HtmlEditor,
  picker: ColorPickerTool,
};

// Filter only compatible tools (some might be too large)
const COMPATIBLE_TOOLS = [
    'qrcode', 'count', 'binary', 'ip', 'timer', 'notepad', 
    'kakeibo', 'calculator', 'scoreboard', 'unit', 'random', 
    'ratio', 'uuid', 'case', 'roulette', 'text-conv', 'hash',
    'flashcards', 'tasks', 'pdf', 'html', 'picker'
];

interface MultiToolViewerProps {
  tools: Tool[];
}

const MultiToolViewer: React.FC<MultiToolViewerProps> = ({ tools }) => {
  const [layout, setLayout] = useState<'2-v' | '2-h' | '4-grid' | '6-grid'>('2-h');
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleSetTool = (index: number, toolId: string) => {
    const newSlots = [...slots];
    newSlots[index] = toolId;
    setSlots(newSlots);
  };

  const handleRemoveTool = (index: number) => {
    const newSlots = [...slots];
    newSlots[index] = null;
    setSlots(newSlots);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      setDragOverIndex(null);
      const toolId = e.dataTransfer.getData("tool_id");
      if (toolId && tools.some(t => t.id === toolId && COMPATIBLE_TOOLS.includes(toolId))) {
          handleSetTool(index, toolId);
      }
  };

  const renderSlot = (index: number) => {
    const toolId = slots[index];
    const tool = toolId ? tools.find(t => t.id === toolId) : null;
    const Component = toolId ? TOOL_COMPONENTS[toolId] : null;
    const isDragOver = dragOverIndex === index;

    return (
      <div 
        className={`rounded-xl shadow-sm overflow-hidden flex flex-col h-full relative transition-all duration-300 ${
            isDragOver 
            ? 'border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 scale-95' 
            : 'bg-white dark:bg-dark-lighter border border-gray-200 dark:border-gray-700'
        }`}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
      >
        {tool && Component ? (
          <>
            <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-2 pl-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 shrink-0">
               <div className="flex items-center gap-2 overflow-hidden">
                 <div className={`p-1 rounded-md ${tool.color.replace('text-', 'bg-').replace(/500|600|700/, '100')} dark:bg-gray-700`}>
                    <tool.icon size={14} className={tool.color} />
                 </div>
                 <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">
                   {tool.name}
                 </span>
               </div>
               <button onClick={() => handleRemoveTool(index)} className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                 <X size={14} />
               </button>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-0 relative no-scrollbar">
               <WorkspaceContext.Provider value={true}>
                  <div className="h-full w-full">
                      <Component />
                  </div>
               </WorkspaceContext.Provider>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50/50 dark:bg-gray-800/30 text-center">
             <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${isDragOver ? 'bg-indigo-100 text-indigo-500' : 'bg-white dark:bg-gray-700 text-gray-300 dark:text-gray-500 shadow-sm'}`}>
               {isDragOver ? <Download size={32} className="animate-bounce" /> : <Plus size={32} />}
             </div>
             
             <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">
                 {isDragOver ? 'ドロップして追加' : 'アプリを追加'}
             </p>
             <p className="text-xs text-gray-400 mb-4 hidden md:block">左のメニューからドラッグ＆ドロップ</p>
             
             {/* Styled Select */}
             <div className="relative w-full max-w-[200px]">
                <select 
                  className="appearance-none w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg py-2 pl-3 pr-8 text-xs font-bold text-slate-700 dark:text-white cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow shadow-sm"
                  onChange={(e) => handleSetTool(index, e.target.value)}
                  value=""
                >
                    <option value="" disabled>リストから選択...</option>
                    {tools.filter(t => COMPATIBLE_TOOLS.includes(t.id)).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Header Controls */}
      <div className="flex justify-between items-center bg-white dark:bg-dark-lighter p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 shrink-0 overflow-x-auto no-scrollbar">
         <div className="flex items-center gap-2 px-2 shrink-0 mr-4">
            <Monitor className="text-indigo-500" size={20} />
            <h2 className="font-bold text-gray-800 dark:text-white whitespace-nowrap">ワークスペース</h2>
         </div>

         <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shrink-0">
             <button 
               onClick={() => setLayout('2-h')} 
               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${layout === '2-h' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} 
               title="左右2分割"
             >
                <Columns size={16} /> <span className="hidden sm:inline">2分割(横)</span>
             </button>
             <button 
               onClick={() => setLayout('2-v')} 
               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${layout === '2-v' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} 
               title="上下2分割"
             >
                <Layout size={16} /> <span className="hidden sm:inline">2分割(縦)</span>
             </button>
             <button 
               onClick={() => setLayout('4-grid')} 
               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${layout === '4-grid' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} 
               title="4分割"
             >
                <Grid2X2 size={16} /> <span className="hidden sm:inline">4分割</span>
             </button>
             <button 
               onClick={() => setLayout('6-grid')} 
               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${layout === '6-grid' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} 
               title="6分割"
             >
                <Grid3X3 size={16} /> <span className="hidden sm:inline">6分割</span>
             </button>
         </div>
      </div>

      {/* Grid Area */}
      <div className={`flex-1 grid gap-4 overflow-hidden transition-all duration-300 ${
         layout === '2-h' ? 'grid-cols-1 md:grid-cols-2' : 
         layout === '2-v' ? 'grid-rows-2' : 
         layout === '6-grid' ? 'grid-cols-2 md:grid-cols-3 grid-rows-2' :
         'grid-cols-2 grid-rows-2'
      }`}>
         {layout === '2-h' || layout === '2-v' ? (
             <>
               {renderSlot(0)}
               {renderSlot(1)}
             </>
         ) : layout === '4-grid' ? (
             <>
               {renderSlot(0)}
               {renderSlot(1)}
               {renderSlot(2)}
               {renderSlot(3)}
             </>
         ) : (
             <>
               {renderSlot(0)}
               {renderSlot(1)}
               {renderSlot(2)}
               {renderSlot(3)}
               {renderSlot(4)}
               {renderSlot(5)}
             </>
         )}
      </div>
    </div>
  );
};

export default MultiToolViewer;
