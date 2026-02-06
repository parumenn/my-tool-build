
import React, { useState, useEffect, useContext } from 'react';
import { ListTodo, Plus, Trash2, CheckCircle2, Circle, AlertCircle, Calendar, Info, ShieldCheck, Zap } from 'lucide-react';
import { WorkspaceContext } from '../WorkspaceContext';

interface Task { id: string; title: string; completed: boolean; priority: 'low' | 'medium' | 'high'; dueDate: string; }

const TaskManager: React.FC = () => {
  const isWorkspace = useContext(WorkspaceContext);
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('task_data');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => { localStorage.setItem('task_data', JSON.stringify(tasks)); }, [tasks]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const task: Task = { id: Date.now().toString(), title: newTask, completed: false, priority: 'medium', dueDate: '' };
    setTasks([task, ...tasks]);
    setNewTask('');
  };

  const toggleTask = (id: string) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));
  const updatePriority = (id: string, priority: 'low' | 'medium' | 'high') => setTasks(tasks.map(t => t.id === id ? { ...t, priority } : t));
  const updateDueDate = (id: string, date: string) => setTasks(tasks.map(t => t.id === id ? { ...t, dueDate: date } : t));
  const clearCompleted = () => { if(confirm('完了済みのタスクをすべて削除しますか？')) setTasks(tasks.filter(t => !t.completed)); };

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

  return (
    <div className={`mx-auto h-full flex flex-col ${isWorkspace ? 'max-w-full p-2' : 'max-w-4xl space-y-10 pb-20'}`}>
      <div className={`bg-white dark:bg-dark-lighter rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col ${isWorkspace ? 'p-3 flex-1' : 'p-6 h-[500px]'}`}>
        <div className="flex items-center justify-between mb-6 shrink-0">
           <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><ListTodo className="text-teal-500" />タスク管理</h2>
           <div className="text-sm text-gray-500 font-bold">残り: <span className="text-teal-600 dark:text-teal-400 text-lg">{tasks.filter(t => !t.completed).length}</span></div>
        </div>
        <form onSubmit={addTask} className="flex gap-2 mb-6 shrink-0">
           <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="タスクを入力..." className="flex-1 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3" />
           <button type="submit" className="bg-teal-600 text-white rounded-xl px-6 font-bold hover:bg-teal-700 transition-colors"><Plus /></button>
        </form>
        <div className="flex justify-between items-center mb-4 shrink-0 overflow-x-auto no-scrollbar">
           <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {(['all', 'active', 'completed'] as const).map(f => (
                 <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${filter === f ? 'bg-white dark:bg-gray-700 text-teal-600' : 'text-gray-500'}`}>{f === 'all' ? 'すべて' : f === 'active' ? '未完了' : '完了'}</button>
              ))}
           </div>
           {tasks.some(t => t.completed) && <button onClick={clearCompleted} className="text-xs text-red-400 font-bold ml-2">完了済みを削除</button>}
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
           {filteredTasks.map(task => (
              <div key={task.id} className={`group flex items-center gap-3 p-3 rounded-xl border ${task.completed ? 'bg-gray-50 dark:bg-gray-900 opacity-60' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                 <button onClick={() => toggleTask(task.id)} className={task.completed ? 'text-teal-500' : 'text-gray-300'}>{task.completed ? <CheckCircle2 /> : <Circle />}</button>
                 <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-white'}`}>{task.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px]"><span className={`px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>{task.priority}</span></div>
                 </div>
                 <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button>
              </div>
           ))}
        </div>
      </div>

      {!isWorkspace && (
        <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
           <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />タスク管理ツールで生産性を向上させる方法</h2>
           <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              <div>
                 <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-teal-500" />シンプルこそ最大の武器</h3>
                 <p>当ツールのタスク管理は、複雑な設定を排除し、直感的なTODOリストとして設計されています。思いついた瞬間にタスクを追加し、優先度を設定することで、脳のリソースを「記憶」から「実行」へとシフトさせることができます。ブラウザを開けばすぐに入力できる手軽さが特徴です。</p>
              </div>
              <div>
                 <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-teal-500" />登録不要で安心のプライバシー</h3>
                 <p>入力したタスクはお使いのブラウザ内（LocalStorage）にのみ保存されます。外部のクラウドサービスにアカウントを作る必要はなく、仕事上の重要な予定や個人的な買い物リストがサーバーに漏洩する心配もありません。バックアップ機能を使ってデータの移行も可能です。</p>
              </div>
           </div>
        </article>
      )}
    </div>
  );
};

export default TaskManager;
