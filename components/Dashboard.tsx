import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Tool } from '../types';
import { ArrowRight, Plus, Check, GripVertical, ShieldCheck } from 'lucide-react';

interface DashboardProps {
  tools: Tool[];
  addedTools: string[];
  onToggleAdded: (id: string) => void;
  onReorder: (newOrder: string[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ tools, addedTools, onToggleAdded, onReorder }) => {
  const dragItem = useRef<number | null>(null);

  // Filter tools that are in the "Added" list
  const myApps = addedTools
    .map(id => tools.find(t => t.id === id))
    .filter((t): t is Tool => t !== undefined);

  // Tools NOT in the "Added" list
  const otherTools = tools.filter(t => !addedTools.includes(t.id));

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    // Real-time swapping logic
    if (dragItem.current !== null && dragItem.current !== position) {
      const copyList = [...addedTools];
      const draggedId = copyList[dragItem.current];
      
      // Remove from old index
      copyList.splice(dragItem.current, 1);
      // Insert at new index
      copyList.splice(position, 0, draggedId);
      
      // Update state immediately
      onReorder(copyList);
      
      // Update drag index to track the item's new position
      dragItem.current = position;
    }
  };

  const handleDragEnd = () => {
    dragItem.current = null;
  };

  const renderToolCard = (tool: Tool, isDraggable: boolean = false, index: number = 0) => {
     return (
        <div
          key={tool.id}
          draggable={isDraggable}
          onDragStart={(e) => isDraggable && handleDragStart(e, index)}
          onDragEnter={(e) => isDraggable && handleDragEnter(e, index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()}
          className={`group relative bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col ${isDraggable ? 'cursor-move active:cursor-grabbing' : ''}`}
        >
          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${tool.color.replace('text-', 'from-').replace(/500|600|700/, '100')} dark:opacity-10 to-transparent opacity-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-500 pointer-events-none`}></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tool.color.replace('text-', 'bg-').replace(/500|600|700/, '100')} dark:bg-gray-800 ${tool.color} dark:${tool.darkColor || tool.color}`}>
              <tool.icon size={24} />
            </div>
            <div className="flex gap-2">
               {isDraggable && <GripVertical className="text-gray-300 cursor-grab" />}
               <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleAdded(tool.id);
                }}
                className={`p-2 rounded-full transition-all duration-200 border z-20 ${
                  addedTools.includes(tool.id)
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500'
                }`}
                title={addedTools.includes(tool.id) ? "マイアプリから削除" : "マイアプリに追加"}
              >
                {addedTools.includes(tool.id) ? <Check size={18} /> : <Plus size={18} />}
              </button>
            </div>
          </div>
          
          <Link to={tool.path} className="flex-1 block">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {tool.name}
            </h3>
            
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">
              {tool.description}
            </p>
          </Link>
          
          <Link to={tool.path} className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 mt-auto">
            使ってみる <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
     );
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-3">
          ダッシュボード
        </h2>
        <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-full text-emerald-700 dark:text-emerald-300 text-sm font-bold border border-emerald-100 dark:border-emerald-800 mb-4">
           <ShieldCheck size={16} />
           <span>完全プライベート: データはサーバーに送信されず、すべて端末に保存されます</span>
        </div>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-sm">
          よく使う機能は「＋」ボタンでマイアプリに追加してください。ドラッグ＆ドロップで並び替えが可能です。
        </p>
      </div>

      {/* My Apps Section */}
      {myApps.length > 0 && (
        <div className="mb-12">
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4 px-2 flex items-center gap-2">
             <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
             マイアプリ (ドラッグで並び替え)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {myApps.map((tool, index) => renderToolCard(tool, true, index))}
          </div>
        </div>
      )}

      {/* All Tools Section */}
      <div>
         <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4 px-2 flex items-center gap-2">
             <span className="w-2 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
             その他のツール
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherTools.map((tool) => renderToolCard(tool, false))}
            {otherTools.length === 0 && (
               <div className="col-span-full py-10 text-center text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                  すべてのツールがマイアプリに追加されています
               </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default Dashboard;