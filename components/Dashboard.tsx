
import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tool } from '../types';
import { ArrowRight, Plus, Check, GripVertical, ShieldCheck, Search } from 'lucide-react';

interface DashboardProps {
  tools: Tool[];
  addedTools: string[];
  onToggleAdded: (id: string) => void;
  onReorder: (newOrder: string[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ tools, addedTools, onToggleAdded, onReorder }) => {
  const dragItem = useRef<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter tools that are in the "Added" list
  const myApps = addedTools
    .map(id => tools.find(t => t.id === id))
    .filter((t): t is Tool => t !== undefined);

  // Tools NOT in the "Added" list, filtered by search
  const otherTools = tools.filter(t => !addedTools.includes(t.id)).filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter My Apps by search as well if search term is present
  const displayedMyApps = searchTerm 
    ? myApps.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : myApps;

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    // Real-time swapping logic
    if (dragItem.current !== null && dragItem.current !== position && !searchTerm) {
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
          draggable={isDraggable && !searchTerm} // Disable drag when searching
          onDragStart={(e) => isDraggable && !searchTerm && handleDragStart(e, index)}
          onDragEnter={(e) => isDraggable && !searchTerm && handleDragEnter(e, index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()}
          className={`group relative bg-white dark:bg-dark-lighter rounded-xl md:rounded-2xl p-3 md:p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col ${isDraggable && !searchTerm ? 'cursor-move active:cursor-grabbing' : ''}`}
        >
          <div className={`absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br ${tool.color.replace('text-', 'from-').replace(/500|600|700/, '100')} dark:opacity-10 to-transparent opacity-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-500 pointer-events-none`}></div>
          
          <div className="relative z-10 flex justify-between items-start mb-2 md:mb-4">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center ${tool.color.replace('text-', 'bg-').replace(/500|600|700/, '100')} dark:bg-gray-800 ${tool.color} dark:${tool.darkColor || tool.color}`}>
              <tool.icon size={20} className="md:w-6 md:h-6" />
            </div>
            <div className="flex gap-2">
               {isDraggable && !searchTerm && <GripVertical className="text-gray-300 cursor-grab hidden lg:block" />}
               <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleAdded(tool.id);
                }}
                className={`p-1.5 md:p-2 rounded-full transition-all duration-200 border z-20 ${
                  addedTools.includes(tool.id)
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500'
                }`}
                title={addedTools.includes(tool.id) ? "マイアプリから削除" : "マイアプリに追加"}
              >
                {addedTools.includes(tool.id) ? <Check size={14} className="md:w-4 md:h-4" /> : <Plus size={14} className="md:w-4 md:h-4" />}
              </button>
            </div>
          </div>
          
          <Link to={tool.path} className="flex-1 block">
            <h3 className="text-xs sm:text-sm md:text-lg font-bold text-gray-800 dark:text-gray-100 mb-1 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 md:line-clamp-1">
              {tool.name}
            </h3>
            
            <p className="hidden md:block text-gray-500 dark:text-gray-400 text-xs leading-relaxed mb-4 line-clamp-2">
              {tool.description}
            </p>
          </Link>
          
          <Link to={tool.path} className="hidden md:flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 mt-auto">
            使ってみる <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>
     );
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-6 md:mb-8 text-center">
        <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 dark:text-white mb-3">
          ダッシュボード
        </h2>
        <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-emerald-700 dark:text-emerald-300 text-[10px] md:text-xs font-bold border border-emerald-100 dark:border-emerald-800 mb-4 md:mb-6">
           <ShieldCheck size={12} className="md:w-3.5 md:h-3.5" />
           <span>完全プライベート: データは端末に保存されます</span>
        </div>
        
        {/* Search Bar */}
        <div className="relative max-w-md mx-auto">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
           </div>
           <input 
              type="text" 
              className="block w-full pl-9 pr-4 py-2.5 md:py-3 border border-gray-200 dark:border-gray-700 rounded-xl md:rounded-2xl bg-white dark:bg-dark-lighter text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow text-sm md:text-base"
              placeholder="ツールを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      {/* My Apps Section */}
      {displayedMyApps.length > 0 && (
        <div className="mb-8 md:mb-12">
          <h3 className="text-base md:text-lg font-bold text-gray-700 dark:text-gray-300 mb-3 md:mb-4 px-2 flex items-center gap-2">
             <span className="w-1.5 h-5 md:w-2 md:h-6 bg-blue-500 rounded-full"></span>
             マイアプリ
             {!searchTerm && <span className="text-xs font-normal text-gray-400 ml-auto hidden lg:inline">ドラッグで並び替え</span>}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
             {displayedMyApps.map((tool, index) => renderToolCard(tool, true, index))}
          </div>
        </div>
      )}

      {/* All Tools Section */}
      <div>
         <h3 className="text-base md:text-lg font-bold text-gray-700 dark:text-gray-300 mb-3 md:mb-4 px-2 flex items-center gap-2">
             <span className="w-1.5 h-5 md:w-2 md:h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
             その他のツール
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {otherTools.map((tool) => renderToolCard(tool, false))}
            {otherTools.length === 0 && (
               <div className="col-span-full py-10 text-center text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-sm md:text-base">
                  {searchTerm ? '見つかりませんでした' : 'すべてのツールがマイアプリに追加されています'}
               </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
