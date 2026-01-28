
import React, { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Tool } from '../types';
import { TOOLS } from '../constants/toolsData';
import { LayoutGrid, Plus, Settings, Info, Shield, FileText } from 'lucide-react';
import { AdBanner2, AdBanner3 } from './AdBanner2';

interface SidebarContentProps {
  addedToolIds: string[];
  onReorder: (newOrder: string[]) => void;
  onClose: () => void;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({ addedToolIds, onReorder, onClose }) => {
  const dragItem = useRef<number | null>(null);
  
  const tools = addedToolIds
    .map(id => TOOLS.find(t => t.id === id))
    .filter((t): t is Tool => t !== undefined);

  const handleDragStart = (e: React.DragEvent, position: number) => {
    dragItem.current = position;
  };

  const handleDragEnter = (e: React.DragEvent, position: number) => {
    if (dragItem.current !== null && dragItem.current !== position) {
      const currentIds = [...addedToolIds];
      const draggedId = currentIds[dragItem.current];
      currentIds.splice(dragItem.current, 1);
      currentIds.splice(position, 0, draggedId);
      onReorder(currentIds);
      dragItem.current = position;
    }
  };

  return (
    <nav className="p-4 space-y-1 overflow-y-auto flex-1 no-scrollbar flex flex-col h-[calc(100vh-64px)]">
      <NavLink
        to="/"
        onClick={onClose}
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

      <AdBanner2 />
      <div className="border-b border-gray-100 dark:border-gray-800 my-3"></div>

      <div className="pt-2 pb-2 px-4 flex items-center justify-between">
        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1">
          <Plus size={12} className="text-blue-500" /> マイアプリ
        </p>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
        {tools.length === 0 ? (
            <div className="px-4 py-6 text-xs text-gray-400 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
              ホームから追加
            </div>
        ) : (
          tools.map((tool, index) => (
            <NavLink
              key={tool.id}
              to={tool.path}
              onClick={onClose}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
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
      </div>
      
      <AdBanner2 />
      <div className="pt-4 mt-auto space-y-1 border-t border-gray-100 dark:border-gray-800">
        <p className="px-4 py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          いんふぉ
        </p>
        <NavLink to="/about" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${isActive ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
          <Info size={16} className="text-blue-600" /> <span>当サイトについて</span>
        </NavLink>
        <NavLink to="/privacy" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${isActive ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
          <Shield size={16} /> <span>プライバシーポリシー</span>
        </NavLink>
        <NavLink to="/terms" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${isActive ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
          <FileText size={16} /> <span>利用規約</span>
        </NavLink>
        <div className="my-2"></div>
        <NavLink to="/settings" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all ${isActive ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
          <Settings size={20} />
          <span>設定</span>
        </NavLink>
      </div>
      <AdBanner2 />
    </nav>
  );
};
