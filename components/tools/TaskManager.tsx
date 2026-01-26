import React, { useState, useEffect, useContext } from 'react';
import { ListTodo, Plus, Trash2, CheckCircle2, Circle, AlertCircle, Calendar } from 'lucide-react';
import { WorkspaceContext } from '../WorkspaceContext';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
}

const TaskManager: React.FC = () => {
  const isWorkspace = useContext(WorkspaceContext);
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('task_data');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    localStorage.setItem('task_data', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTask,
      completed: false,
      priority: 'medium',
      dueDate: ''
    };
    setTasks([task, ...tasks]);
    setNewTask('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const updatePriority = (id: string, priority: 'low' | 'medium' | 'high') => {
     setTasks(tasks.map(t => t.id === id ? { ...t, priority } : t));
  };

  const updateDueDate = (id: string, date: string) => {
     setTasks(tasks.map(t => t.id === id ? { ...t, dueDate: date } : t));
  };

  const clearCompleted = () => {
     if(confirm('完了済みのタスクをすべて削除しますか？')) {
        setTasks(tasks.filter(t => !t.completed));
     }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const getPriorityColor = (p: string) => {
     if (p === 'high') return 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200';
     if (p === 'medium') return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200';
     return 'text-green-500 bg-green-50 dark:bg-green-900/20 border-green-200';
  };

  const activeCount = tasks.filter(t => !t.completed).length;

  return (
    <div className={`mx-auto h-full flex flex-col ${isWorkspace ? 'max-w-full p-2 space-y-2' : 'max-w-4xl space-y-6'}`}>
      <div className={`bg-white dark:bg-dark-lighter rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col ${isWorkspace ? 'p-3 flex-1 h-full' : 'p-6 h-[calc(100vh-140px)]'}`}>
        
        {!isWorkspace && (
          <div className="flex items-center justify-between mb-6 shrink-0">
             <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
               <ListTodo className="text-teal-500" />
               タスク管理
             </h2>
             <div className="text-sm text-gray-500 font-bold">
                残りタスク: <span className="text-teal-600 dark:text-teal-400 text-lg">{activeCount}</span>
             </div>
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={addTask} className={`flex gap-2 shrink-0 ${isWorkspace ? 'mb-2' : 'mb-6'}`}>
           <input 
             type="text" 
             value={newTask}
             onChange={(e) => setNewTask(e.target.value)}
             placeholder="タスクを入力..."
             className={`flex-1 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:ring-2 focus:ring-teal-500 ${isWorkspace ? 'p-2 text-sm' : 'p-4'}`}
           />
           <button type="submit" className={`bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 shadow-lg shadow-teal-200 dark:shadow-none transition-colors ${isWorkspace ? 'px-3' : 'px-6'}`}>
              <Plus size={isWorkspace ? 20 : 24} />
           </button>
        </form>

        {/* Filters */}
        <div className={`flex justify-between items-center shrink-0 overflow-x-auto ${isWorkspace ? 'mb-2' : 'mb-4'}`}>
           <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {(['all', 'active', 'completed'] as const).map(f => (
                 <button
                   key={f}
                   onClick={() => setFilter(f)}
                   className={`rounded-md font-bold capitalize transition-all ${isWorkspace ? 'px-2 py-1 text-xs' : 'px-4 py-1.5 text-sm'} ${filter === f ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-gray-500'}`}
                 >
                    {f === 'all' ? 'すべて' : f === 'active' ? '未完了' : '完了'}
                 </button>
              ))}
           </div>
           {tasks.some(t => t.completed) && (
              <button onClick={clearCompleted} className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1 ml-2 whitespace-nowrap">
                 <Trash2 size={12} /> <span className={isWorkspace ? 'hidden' : 'inline'}>完了済みを削除</span>
              </button>
           )}
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
           {filteredTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
                 <ListTodo size={isWorkspace ? 32 : 48} className="mb-2 opacity-50" />
                 <p className="text-xs">タスクがありません</p>
              </div>
           ) : (
              filteredTasks.map(task => (
                 <div 
                   key={task.id} 
                   className={`group flex items-center gap-2 rounded-xl border transition-all ${isWorkspace ? 'p-2' : 'p-3 gap-3'} ${task.completed ? 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-60' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-teal-200 dark:hover:border-teal-800'}`}
                 >
                    <button onClick={() => toggleTask(task.id)} className={`shrink-0 ${task.completed ? 'text-teal-500' : 'text-gray-300 hover:text-teal-500'}`}>
                       {task.completed ? <CheckCircle2 size={isWorkspace ? 20 : 24} /> : <Circle size={isWorkspace ? 20 : 24} />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                       <p className={`font-medium truncate ${isWorkspace ? 'text-sm' : ''} ${task.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                          {task.title}
                       </p>
                       <div className="flex items-center gap-3 mt-1 text-[10px] md:text-xs">
                          {/* Priority Selector */}
                          <div className="relative group/priority">
                             <span className={`px-2 py-0.5 rounded border ${getPriorityColor(task.priority)} flex items-center gap-1 cursor-pointer`}>
                                <AlertCircle size={10} /> {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                             </span>
                             {/* Priority Dropdown (Hover) */}
                             <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 shadow-lg rounded-lg border border-gray-100 dark:border-gray-600 hidden group-hover/priority:block z-10">
                                <div onClick={() => updatePriority(task.id, 'high')} className="px-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer text-red-500">高</div>
                                <div onClick={() => updatePriority(task.id, 'medium')} className="px-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer text-yellow-500">中</div>
                                <div onClick={() => updatePriority(task.id, 'low')} className="px-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer text-green-500">低</div>
                             </div>
                          </div>
                          
                          {/* Date Picker */}
                          <div className="flex items-center gap-1 text-gray-400 hover:text-teal-500 cursor-pointer relative">
                             <Calendar size={12} />
                             <input 
                               type="date" 
                               value={task.dueDate} 
                               onChange={(e) => updateDueDate(task.id, e.target.value)}
                               className="bg-transparent border-none p-0 h-auto text-xs focus:ring-0 cursor-pointer w-24"
                             />
                          </div>
                       </div>
                    </div>

                    <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Trash2 size={isWorkspace ? 16 : 18} />
                    </button>
                 </div>
              ))
           )}
        </div>
      </div>
    </div>
  );
};

export default TaskManager;