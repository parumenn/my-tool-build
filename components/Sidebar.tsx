import React, { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Tool } from '../types';
import { LayoutGrid, Plus, Settings, Grid2X2 } from 'lucide-react';

interface SidebarProps {
  tools: Tool[];
  isOpen: boolean;
  toggleSidebar: () => void;
  onReorder: (newOrder: string[]) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ tools, isOpen, toggleSidebar, onReorder }) => {
  const dragItem = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLAnchorElement>, position: number, toolId: string) => {
    dragItem.current = position;
    e.dataTransfer.effectAllowed = "copyMove";
    // Set tool_id for Workspace dropping
    e.dataTransfer.setData("tool_id", toolId);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLAnchorElement>, position: number) => {
    // Only reorder if dragging within sidebar (checked by ref existence)
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

  const handleDragEnd = () => {
    dragItem.current = null;
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 z-20 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      {/* Sidebar Content */}
      <aside className={`
        fixed top-0 left-0 z-30 h-full w-64 bg-white dark:bg-dark-lighter shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:shadow-none border-r border-gray-200 dark:border-gray-700 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-16 items-center justify-center border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 shrink-0">
          <h1 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
            <LayoutGrid size={24} />
            まいつーる
          </h1>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto flex-1">
          {/* Core Navigation */}
          <NavLink
            to="/"
            onClick={() => window.innerWidth < 1024 && toggleSidebar()}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
              ${isActive 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}
            `}
          >
            <LayoutGrid size={20} />
            <span>ダッシュボード</span>
          </NavLink>

          <NavLink
            to="/multiview"
            onClick={() => window.innerWidth < 1024 && toggleSidebar()}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 mb-2
              ${isActive 
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-800' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}
            `}
          >
            {({ isActive }) => (
              <>
                <Grid2X2 size={20} className={isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500"} />
                <span>ワークスペース</span>
              </>
            )}
          </NavLink>

          <div className="border-b border-gray-100 dark:border-gray-700 my-2"></div>

          <div className="pt-2 pb-2 px-4 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Plus size={14} className="text-blue-500" /> マイアプリ
            </p>
          </div>

          {tools.length === 0 ? (
             <div className="px-4 py-4 text-xs text-gray-400 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
               ダッシュボードの「＋」ボタンでツールを追加できます
             </div>
          ) : (
            tools.map((tool, index) => (
              <NavLink
                key={tool.id}
                to={tool.path}
                onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                draggable
                onDragStart={(e) => handleDragStart(e, index, tool.id)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-move group
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <tool.icon size={20} className={isActive ? 'text-blue-600 dark:text-blue-400' : (tool.darkColor ? `dark:${tool.darkColor} ${tool.color}` : tool.color)} />
                    <span>{tool.name}</span>
                  </>
                )}
              </NavLink>
            ))
          )}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
          <NavLink
             to="/settings"
             onClick={() => window.innerWidth < 1024 && toggleSidebar()}
             className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}
             `}
          >
             <Settings size={20} />
             <span>設定</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;