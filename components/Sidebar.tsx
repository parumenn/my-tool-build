
import React, { useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Tool } from '../types';
import { TOOLS } from '../constants/toolsData';
import { LayoutGrid, Plus, Settings, Grid2X2, Home, X } from 'lucide-react';

interface SidebarProps {
  addedToolIds: string[];
  isOpen: boolean;
  toggleSidebar: () => void;
  onReorder: (newOrder: string[]) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ addedToolIds, isOpen, toggleSidebar, onReorder }) => {
  const dragItem = useRef<number | null>(null);
  const location = useLocation();
  
  // マッピングをコンポーネント内で行うことで、初期描画を止めない
  const tools = addedToolIds
    .map(id => TOOLS.find(t => t.id === id))
    .filter((t): t is Tool => t !== undefined);

  const handleDragStart = (e: React.DragEvent<HTMLAnchorElement>, position: number, toolId: string) => {
    dragItem.current = position;
    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.setData("tool_id", toolId);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLAnchorElement>, position: number) => {
    if (dragItem.current !== null && dragItem.current !== position) {
      const currentIds = tools.map(t => t.id);
      const draggedId = currentIds[dragItem.current];
      const newOrder = [...currentIds];
      newOrder.splice(dragItem.current, 1);
      newOrder.splice(position, 0, draggedId);
      onReorder(newOrder);
      dragItem.current = position;
    }
  };

  const SidebarContent = () => (
    <nav className="p-4 space-y-1 overflow-y-auto flex-1 no-scrollbar animate-fade-in">
      <NavLink
        to="/"
        onClick={isOpen ? toggleSidebar : undefined}
        className={({ isActive }) => `
          flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-200
          ${isActive 
            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}
        `}
      >
        <LayoutGrid size={20} />
        <span>ダッシュボード</span>
      </NavLink>

      <div className="border-b border-gray-100 dark:border-gray-800 my-3"></div>

      <div className="pt-2 pb-2 px-4 flex items-center justify-between">
        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1">
          <Plus size={12} className="text-blue-500" /> マイアプリ
        </p>
      </div>

      {tools.length === 0 ? (
          <div className="px-4 py-6 text-xs text-gray-400 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
            ホームから追加
          </div>
      ) : (
        tools.map((tool, index) => (
          <NavLink
            key={tool.id}
            to={tool.path}
            onClick={isOpen ? toggleSidebar : undefined}
            draggable
            onDragStart={(e) => handleDragStart(e, index, tool.id)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragEnd={() => { dragItem.current = null; }}
            onDragOver={(e) => e.preventDefault()}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-200 cursor-move group
              ${isActive 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}
            `}
          >
            <tool.icon size={20} className={tool.color} />
            <span className="truncate">{tool.name}</span>
          </NavLink>
        ))
      )}
    </nav>
  );

  const LogoArea = ({ showClose = false }) => (
    <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-dark-lighter shrink-0">
      <div className="flex items-center gap-2">
        <div className="bg-blue-600 p-1.5 rounded-lg text-white"><LayoutGrid size={20} /></div>
        <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">まいつーる</h1>
      </div>
      {showClose && (
        <button onClick={toggleSidebar} className="p-2 text-gray-400 hover:text-gray-900 active:scale-90">
          <X size={24} />
        </button>
      )}
    </div>
  );

  if (isOpen && window.innerWidth < 1024) {
    return (
      <div className="fixed inset-0 z-50 flex">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={toggleSidebar} />
        <aside className="relative w-72 h-full bg-white dark:bg-dark-lighter shadow-2xl flex flex-col animate-fade-in">
          <LogoArea showClose={true} />
          <SidebarContent />
          <div className="p-4 border-t dark:border-gray-800"><NavLink to="/settings" onClick={toggleSidebar} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-500 rounded-2xl hover:bg-gray-50"><Settings size={20} /><span>設定</span></NavLink></div>
        </aside>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <LogoArea />
      <SidebarContent />
      <div className="p-4 border-t dark:border-gray-800">
        <NavLink to="/settings" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all ${isActive ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-50'}`}><Settings size={20} /><span>設定</span></NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
