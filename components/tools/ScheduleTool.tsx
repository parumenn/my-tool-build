
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  CalendarCheck, Plus, Trash2, Calendar, Clock, 
  Link as LinkIcon, Check, Copy, User, MessageSquare, 
  ChevronLeft, ChevronRight, Share2, ExternalLink,
  Edit2, X, AlertCircle, Circle, XCircle, Triangle,
  Info, ShieldCheck, Zap
} from 'lucide-react';
import AdBanner from '../AdBanner';
import { WorkspaceContext } from '../WorkspaceContext';

interface Candidate {
  name: string;
  note: string; // URLや備考用
}

interface PollOption {
  id: string;
  type: 'date' | 'text';
  title: string;
  candidates: Candidate[];
}

interface Answer {
  id: string;
  name: string;
  selections: Record<string, {status: number, comment: string}[]>; // pollId -> array of {status, comment}
  comment: string;
  timestamp: number;
}

interface ScheduleEvent {
  id: string;
  admin_token?: string;
  title: string;
  description: string;
  deadline: string | null;
  polls: PollOption[];
  answers: Answer[];
  created_at: number;
}

const ScheduleTool: React.FC = () => {
  const isWorkspace = useContext(WorkspaceContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const eventId = searchParams.get('id');
  const urlToken = searchParams.get('token');

  // --- Create Mode States ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [polls, setPolls] = useState<PollOption[]>([
    { id: 'p1', type: 'date', title: '日程候補', candidates: [] }
  ]);
  
  // Date Picker State
  const [pickerDate, setPickerDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState({ start: '19:00', end: '21:00' });
  const [isTimeEnabled, setIsTimeEnabled] = useState(true);

  // --- View Mode States ---
  const [eventData, setEventData] = useState<ScheduleEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Answer Modal
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: '', comment: '' });
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, {status: number, comment: string}[]>>({});
  
  // Share
  const [shareUrl, setShareUrl] = useState('');
  const [adminUrl, setAdminUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Initialize
  useEffect(() => {
    if (eventId) {
      fetchEventData();
    } else {
      setEventData(null);
    }
  }, [eventId]);

  const fetchEventData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`./backend/schedule_api.php?action=get&id=${eventId}`);
      if (!res.ok) throw new Error('イベントが見つかりません');
      const data = await res.json();
      
      // データ構造の正規化（古い文字列配列形式をオブジェクト配列形式に変換）
      if (data.polls) {
        data.polls = data.polls.map((poll: any) => ({
          ...poll,
          candidates: poll.candidates.map((c: any) => 
            typeof c === 'string' ? { name: c, note: '' } : c
          )
        }));
      }

      setEventData(data);
      if (urlToken) setIsAdmin(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Create Functions ---
  
  const addCandidate = (pollIndex: number, name: string, note: string = '') => {
    const newPolls = [...polls];
    // 重複チェックはnameのみで行う
    if (!newPolls[pollIndex].candidates.some(c => c.name === name)) {
      newPolls[pollIndex].candidates.push({ name, note });
      // 日付順ソート (dateタイプの場合)
      if (newPolls[pollIndex].type === 'date') {
        newPolls[pollIndex].candidates.sort((a, b) => new Date(a.name.split(' ')[0]).getTime() - new Date(b.name.split(' ')[0]).getTime());
      }
      setPolls(newPolls);
    }
  };

  const removeCandidate = (pollIndex: number, candIndex: number) => {
    const newPolls = [...polls];
    newPolls[pollIndex].candidates.splice(candIndex, 1);
    setPolls(newPolls);
  };

  const handleDateSelect = (date: Date) => {
    const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} (${['日','月','火','水','木','金','土'][date.getDay()]})`;
    const val = isTimeEnabled ? `${dateStr} ${timeRange.start}〜${timeRange.end}` : dateStr;
    addCandidate(0, val, ''); // 日程候補には備考は空で追加
  };

  const handleCreate = async () => {
    if (!title.trim()) { alert('イベント名を入力してください'); return; }
    if (polls[0].candidates.length === 0) { alert('日程候補を少なくとも1つ選択してください'); return; }

    setLoading(true);
    try {
      const res = await fetch('./backend/schedule_api.php?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, deadline, polls })
      });
      const data = await res.json();
      if (data.status === 'success') {
        const baseUrl = window.location.href.split('?')[0];
        setShareUrl(`${baseUrl}?id=${data.id}`);
        setAdminUrl(`${baseUrl}?id=${data.id}&token=${data.admin_token}`);
        
        // 完了画面へ（簡易的にadminUrlへリダイレクト）
        window.location.href = `${baseUrl}?id=${data.id}&token=${data.admin_token}`;
      }
    } catch (e) {
      alert('作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // --- View/Answer Functions ---

  const openAnswerModal = () => {
    if (!eventData) return;
    const initAns: any = {};
    eventData.polls.forEach(p => {
        initAns[p.id] = p.candidates.map(() => ({ status: 2, comment: '' })); // Default Circle
    });
    
    setCurrentAnswers(initAns);
    setCurrentUser({ name: '', comment: '' });
    setIsAnswerModalOpen(true);
  };

  const submitAnswer = async () => {
    if (!currentUser.name.trim()) { alert('名前を入力してください'); return; }
    
    setLoading(true);
    try {
        const res = await fetch('./backend/schedule_api.php?action=answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event_id: eventId,
                name: currentUser.name,
                comment: currentUser.comment,
                selections: currentAnswers
            })
        });
        if (res.ok) {
            setIsAnswerModalOpen(false);
            fetchEventData();
        } else {
            alert('保存に失敗しました');
        }
    } catch(e) { alert('通信エラー'); }
    finally { setLoading(false); }
  };

  const deleteEvent = async () => {
      if(!confirm('本当に削除しますか？')) return;
      try {
          await fetch('./backend/schedule_api.php?action=delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: eventId, token: urlToken })
          });
          window.location.href = window.location.href.split('?')[0];
      } catch(e) { alert('削除失敗'); }
  };

  const exportGoogleCalendar = (poll: PollOption, candIndex: number) => {
      const cand = poll.candidates[candIndex];
      // Parse "2024/10/1 (Tue) 19:00〜21:00" -> ISO
      try {
          const datePart = cand.name.split(' ')[0]; // 2024/10/1
          const timePart = cand.name.match(/(\d{1,2}:\d{2})/g);
          
          let startIso = datePart.replace(/\//g, '') + 'T000000';
          let endIso = datePart.replace(/\//g, '') + 'T235959';

          if (timePart && timePart.length >= 1) {
              startIso = datePart.replace(/\//g, '') + 'T' + timePart[0].replace(':','') + '00';
              if (timePart.length >= 2) {
                  endIso = datePart.replace(/\//g, '') + 'T' + timePart[1].replace(':','') + '00';
              } else {
                  // +1 hour
                  const d = new Date(datePart + ' ' + timePart[0]);
                  d.setHours(d.getHours() + 1);
                  endIso = d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0') + 'T' + String(d.getHours()).padStart(2,'0') + String(d.getMinutes()).padStart(2,'0') + '00';
              }
          }

          const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventData?.title || '予定')}&dates=${startIso}/${endIso}&details=${encodeURIComponent(eventData?.description || '')}`;
          window.open(url, '_blank');
      } catch(e) {
          alert('日時形式の解析に失敗しました');
      }
  };

  const isUrl = (str: string) => {
      return str.startsWith('http://') || str.startsWith('https://');
  };

  // --- Components ---

  const CalendarPicker = () => {
    const year = pickerDate.getFullYear();
    const month = pickerDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for(let i=0; i<firstDay; i++) cells.push(null);
    for(let i=1; i<=daysInMonth; i++) cells.push(new Date(year, month, i));

    return (
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
                <button onClick={() => setPickerDate(new Date(year, month-1, 1))} className="p-1 text-gray-600 dark:text-gray-300"><ChevronLeft size={20}/></button>
                <span className="font-bold text-sm text-gray-800 dark:text-white">{year}年 {month+1}月</span>
                <button onClick={() => setPickerDate(new Date(year, month+1, 1))} className="p-1 text-gray-600 dark:text-gray-300"><ChevronRight size={20}/></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[10px] font-bold text-gray-500">
                <div className="text-red-500">日</div><div>月</div><div>火</div><div>水</div><div>木</div><div>金</div><div className="text-blue-500">土</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
                {cells.map((d, i) => (
                    <button 
                        key={i} 
                        disabled={!d}
                        onClick={() => d && handleDateSelect(d)}
                        className={`aspect-square rounded-md flex items-center justify-center text-xs font-bold transition-all ${
                            !d ? 'invisible' : 'bg-white dark:bg-gray-700 hover:bg-teal-100 dark:hover:bg-teal-900/50 shadow-sm text-gray-700 dark:text-gray-200'
                        }`}
                    >
                        {d?.getDate()}
                    </button>
                ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <label className="flex items-center gap-2 text-xs font-bold mb-2 cursor-pointer text-gray-600 dark:text-gray-300">
                    <input type="checkbox" checked={isTimeEnabled} onChange={e => setIsTimeEnabled(e.target.checked)} className="rounded text-teal-600 focus:ring-teal-500" />
                    時間を指定
                </label>
                {isTimeEnabled && (
                    <div className="flex items-center gap-2 text-xs">
                        <input type="time" value={timeRange.start} onChange={e => setTimeRange({...timeRange, start: e.target.value})} className="p-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-full" />
                        <span className="text-gray-400">~</span>
                        <input type="time" value={timeRange.end} onChange={e => setTimeRange({...timeRange, end: e.target.value})} className="p-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-full" />
                    </div>
                )}
            </div>
        </div>
    );
  };

  // --- Render ---

  if (eventId) {
      // VIEW MODE
      if (loading) return <div className="p-10 text-center"><div className="animate-spin text-teal-500 text-4xl mx-auto mb-4">C</div>読み込み中...</div>;
      if (!eventData) return <div className="p-10 text-center text-red-500">イベントが見つかりません</div>;

      return (
          <div className={`mx-auto max-w-5xl pb-20 ${isWorkspace ? 'p-2' : 'space-y-6'}`}>
              <div className="bg-white dark:bg-dark-lighter rounded-3xl p-4 md:p-10 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                      <div>
                          <h1 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white mb-2">{eventData.title}</h1>
                          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm whitespace-pre-wrap">{eventData.description}</p>
                      </div>
                      {isAdmin && (
                          <div className="flex gap-2">
                              <button onClick={() => {
                                  const url = window.location.href.split('&token')[0];
                                  navigator.clipboard.writeText(url);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                              }} className="flex items-center gap-2 px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-xl font-bold text-xs hover:bg-teal-200 transition-colors">
                                  {copied ? <Check size={14}/> : <Share2 size={14}/>} URLコピー
                              </button>
                              <button onClick={deleteEvent} className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl hover:bg-red-200 transition-colors"><Trash2 size={16}/></button>
                          </div>
                      )}
                  </div>

                  {eventData.deadline && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full text-[10px] font-bold mb-6">
                          <Clock size={12} /> 期限: {eventData.deadline.replace('T', ' ')}
                      </div>
                  )}

                  {/* Main Table */}
                  <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-2xl">
                      <table className="w-full text-sm text-left border-collapse">
                          <thead>
                              <tr className="bg-gray-50 dark:bg-gray-800">
                                  <th className="p-3 min-w-[120px] border-b border-r dark:border-gray-700 sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 font-bold text-xs">参加者 / 候補</th>
                                  {eventData.polls[0].candidates.map((cand, i) => (
                                      <th key={i} className="p-2 min-w-[100px] border-b border-r dark:border-gray-700 font-bold text-center relative group text-xs">
                                          <div className="text-gray-800 dark:text-white px-2">{cand.name}</div>
                                          {/* 日程の場合は備考を表示しない、または必要に応じて表示 */}
                                          {cand.note && <div className="text-[10px] text-gray-500 font-normal mt-1 truncate">{cand.note}</div>}
                                          <button onClick={() => exportGoogleCalendar(eventData.polls[0], i)} className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 p-1"><Calendar size={12}/></button>
                                      </th>
                                  ))}
                              </tr>
                              {/* Score Row */}
                              <tr className="bg-teal-50 dark:bg-teal-900/20">
                                  <th className="p-2 border-b border-r dark:border-gray-700 sticky left-0 bg-teal-50 dark:bg-teal-900/20 z-10 text-teal-800 dark:text-teal-200 font-bold text-right text-xs">○の数</th>
                                  {eventData.polls[0].candidates.map((_, i) => {
                                      const score = eventData.answers.reduce((acc, ans) => {
                                          const status = ans.selections[eventData.polls[0].id]?.[i]?.status;
                                          return acc + (status === 2 ? 1 : status === 1 ? 0.5 : 0);
                                      }, 0);
                                      return (
                                          <td key={i} className="p-2 border-b border-r dark:border-gray-700 text-center font-black text-teal-600 dark:text-teal-400 text-sm">
                                              {score}
                                          </td>
                                      );
                                  })}
                              </tr>
                          </thead>
                          <tbody>
                              {eventData.answers.length === 0 ? (
                                  <tr><td colSpan={eventData.polls[0].candidates.length + 1} className="p-8 text-center text-gray-400 text-xs">まだ回答がありません</td></tr>
                              ) : eventData.answers.map((ans) => (
                                  <tr key={ans.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                      <td className="p-3 border-b border-r dark:border-gray-700 sticky left-0 bg-white dark:bg-dark-lighter z-10">
                                          <div className="font-bold text-gray-800 dark:text-gray-200 text-xs">{ans.name}</div>
                                          {ans.comment && <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1"><MessageSquare size={8}/> {ans.comment}</div>}
                                      </td>
                                      {eventData.polls[0].candidates.map((_, i) => {
                                          const sel = ans.selections[eventData.polls[0].id]?.[i];
                                          const status = sel?.status;
                                          const comment = sel?.comment;
                                          return (
                                              <td key={i} className="p-2 border-b border-r dark:border-gray-700 text-center relative group">
                                                  <div className="flex flex-col items-center justify-center h-full">
                                                      {status === 2 ? <Circle className="text-red-500 fill-red-50 dark:fill-red-900/30" size={18} /> :
                                                       status === 1 ? <Triangle className="text-yellow-500 fill-yellow-50 dark:fill-yellow-900/30" size={18} /> :
                                                       <X className="text-gray-300" size={18} />}
                                                      
                                                      {comment && (
                                                          <div className="absolute bottom-0 right-0 text-gray-400">
                                                              <MessageSquare size={10} className="text-blue-400" />
                                                          </div>
                                                      )}
                                                      {/* Tooltip for cell comment */}
                                                      {comment && (
                                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-gray-900 text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                                              {comment}
                                                          </div>
                                                      )}
                                                  </div>
                                              </td>
                                          );
                                      })}
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  {/* Add Answer Button */}
                  <div className="mt-8 text-center">
                      <button 
                          onClick={openAnswerModal}
                          className="bg-teal-600 text-white px-8 py-3 rounded-full font-black text-sm md:text-base shadow-xl hover:bg-teal-700 hover:scale-105 transition-all flex items-center justify-center gap-2 mx-auto"
                      >
                          <Plus strokeWidth={3} size={18} /> 出欠を入力する
                      </button>
                  </div>
              </div>

              {/* Other Polls (Location etc) */}
              {eventData.polls.length > 1 && eventData.polls.slice(1).map((poll) => (
                  <div key={poll.id} className="bg-white dark:bg-dark-lighter rounded-3xl p-4 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                      <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                          <Info className="text-blue-500" size={18} /> {poll.title}
                      </h3>
                      {/* Simple List for non-date polls */}
                      <div className="space-y-3">
                          {poll.candidates.map((cand, i) => {
                              const score = eventData.answers.reduce((acc, ans) => {
                                  const s = ans.selections[poll.id]?.[i]?.status;
                                  return acc + (s === 2 ? 1 : s === 1 ? 0.5 : 0);
                              }, 0);
                              return (
                                  <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 gap-2">
                                      <div className="flex flex-col">
                                          <span className="font-bold text-sm text-gray-700 dark:text-gray-200">{cand.name}</span>
                                          {cand.note && (
                                              isUrl(cand.note) ? (
                                                  <a href={cand.note} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline break-all flex items-center gap-1 mt-1">
                                                      <LinkIcon size={10} /> {cand.note}
                                                  </a>
                                              ) : (
                                                  <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{cand.note}</span>
                                              )
                                          )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-gray-500">スコア:</span>
                                          <span className="text-lg font-black text-teal-600">{score}</span>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              ))}

              {/* Answer Modal */}
              {isAnswerModalOpen && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                              <h3 className="font-bold text-lg text-gray-800 dark:text-white">出欠を入力</h3>
                              <button onClick={() => setIsAnswerModalOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><X size={20}/></button>
                          </div>
                          
                          <div className="p-4 overflow-y-auto flex-1 space-y-6">
                              <div className="space-y-2">
                                  <label className="block text-xs font-bold text-gray-500">お名前 <span className="text-red-500">*</span></label>
                                  <input 
                                      type="text" 
                                      value={currentUser.name} 
                                      onChange={e => setCurrentUser({...currentUser, name: e.target.value})} 
                                      className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-bold text-base focus:border-teal-500 outline-none"
                                      placeholder="山田 太郎"
                                  />
                              </div>

                              {eventData.polls.map(poll => (
                                  <div key={poll.id} className="space-y-3">
                                      <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 border-l-4 border-teal-500 pl-2">{poll.title}</h4>
                                      <div className="space-y-2">
                                          {poll.candidates.map((cand, i) => {
                                              const currentSel = currentAnswers[poll.id]?.[i] || { status: 1, comment: '' };
                                              return (
                                                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                                                      <div className="flex-1">
                                                          <div className="font-bold text-xs text-gray-800 dark:text-white">{cand.name}</div>
                                                          {cand.note && <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{cand.note}</div>}
                                                      </div>
                                                      <div className="flex items-center gap-2">
                                                          <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border dark:border-gray-600 shadow-sm shrink-0">
                                                              {[
                                                                  {val: 2, icon: Circle, color: 'text-red-500'}, 
                                                                  {val: 1, icon: Triangle, color: 'text-yellow-500'}, 
                                                                  {val: 0, icon: X, color: 'text-gray-400'}
                                                              ].map(opt => (
                                                                  <button 
                                                                      key={opt.val}
                                                                      onClick={() => {
                                                                          const newAns = {...currentAnswers};
                                                                          newAns[poll.id][i] = { ...currentSel, status: opt.val };
                                                                          setCurrentAnswers(newAns);
                                                                      }}
                                                                      className={`p-1.5 rounded-md transition-all ${currentSel.status === opt.val ? 'bg-gray-100 dark:bg-gray-600 ' + opt.color : 'text-gray-300'}`}
                                                                  >
                                                                      <opt.icon size={18} fill={currentSel.status === opt.val ? 'currentColor' : 'none'} fillOpacity={0.2} />
                                                                  </button>
                                                              ))}
                                                          </div>
                                                          <input 
                                                              type="text" 
                                                              placeholder="コメント" 
                                                              value={currentSel.comment}
                                                              onChange={e => {
                                                                  const newAns = {...currentAnswers};
                                                                  newAns[poll.id][i] = { ...currentSel, comment: e.target.value };
                                                                  setCurrentAnswers(newAns);
                                                              }}
                                                              className="flex-1 sm:w-32 p-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs"
                                                          />
                                                      </div>
                                                  </div>
                                              );
                                          })}
                                      </div>
                                  </div>
                              ))}

                              <div className="space-y-2">
                                  <label className="block text-xs font-bold text-gray-500">全体コメント</label>
                                  <textarea 
                                      value={currentUser.comment} 
                                      onChange={e => setCurrentUser({...currentUser, comment: e.target.value})} 
                                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm h-20"
                                      placeholder="遅れる可能性があります、等"
                                  />
                              </div>
                          </div>

                          <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
                              <button onClick={submitAnswer} className="w-full py-3 bg-teal-600 text-white font-black rounded-xl shadow-lg hover:bg-teal-700 transition-all text-sm">回答を保存する</button>
                          </div>
                      </div>
                  </div>
              )}
              {!isWorkspace && <AdBanner />}
          </div>
      );
  }

  // --- CREATE MODE ---
  
  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-6">
      <div className="bg-white dark:bg-dark-lighter rounded-3xl p-4 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <CalendarCheck className="text-teal-600" />
          新規イベント作成
        </h2>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">イベント名 <span className="text-red-500">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-base focus:border-teal-500 outline-none" placeholder="例: 開発部 歓迎会" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">詳細 / メモ</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm h-20 resize-none" placeholder="場所や予算など..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">回答期限 (任意)</label>
              <input 
                type="datetime-local" 
                value={deadline} 
                onChange={e => setDeadline(e.target.value)} 
                className="w-full md:w-auto p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" 
              />
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          {/* Polls Config */}
          <div className="space-y-6">
            <h3 className="font-bold text-base md:text-lg flex items-center gap-2">アンケート設定</h3>
            
            {polls.map((poll, pIdx) => (
              <div key={poll.id} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 relative">
                {pIdx > 0 && (
                  <button onClick={() => { const next = [...polls]; next.splice(pIdx, 1); setPolls(next); }} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                )}
                
                <div className="mb-4 pr-6">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">質問タイトル</label>
                  <input type="text" value={poll.title} onChange={e => { const next = [...polls]; next[pIdx].title = e.target.value; setPolls(next); }} className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 py-1 font-bold text-base focus:border-teal-500 outline-none text-gray-800 dark:text-white" />
                </div>

                {poll.type === 'date' ? (
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="shrink-0 w-full md:w-auto"><CalendarPicker /></div>
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">選択された候補</div>
                      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                        {poll.candidates.map((cand, cIdx) => (
                          <div key={cIdx} className="flex justify-between items-center px-3 py-1.5 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 shadow-sm">
                            <span className="font-mono font-bold text-sm text-gray-700 dark:text-gray-200">{cand.name}</span>
                            <button onClick={() => removeCandidate(pIdx, cIdx)} className="text-gray-400 hover:text-red-500 p-1"><X size={14}/></button>
                          </div>
                        ))}
                        {poll.candidates.length === 0 && <div className="text-gray-400 text-xs p-4 text-center border-2 border-dashed border-gray-200 rounded-xl">カレンダーの日付をクリックして追加</div>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Text candidates logic */}
                    <div className="flex flex-col gap-2 mb-2 bg-white dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                      <div className="flex gap-2">
                        <input 
                            type="text" 
                            id={`cand-input-${pIdx}`} 
                            className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" 
                            placeholder="候補を入力 (例: イタリアン)" 
                            onKeyDown={e => { if(e.key==='Enter') { const noteInput = document.getElementById(`cand-note-${pIdx}`) as HTMLInputElement; addCandidate(pIdx, e.currentTarget.value, noteInput.value); e.currentTarget.value=''; noteInput.value=''; } }} 
                        />
                        <button onClick={() => { const el = document.getElementById(`cand-input-${pIdx}`) as HTMLInputElement; const noteInput = document.getElementById(`cand-note-${pIdx}`) as HTMLInputElement; addCandidate(pIdx, el.value, noteInput.value); el.value=''; noteInput.value=''; }} className="bg-teal-600 text-white px-3 py-1 rounded-lg font-bold text-xs">追加</button>
                      </div>
                      <input 
                        type="text" 
                        id={`cand-note-${pIdx}`} 
                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs" 
                        placeholder="備考・URL (任意)" 
                        onKeyDown={e => { if(e.key==='Enter') { const el = document.getElementById(`cand-input-${pIdx}`) as HTMLInputElement; addCandidate(pIdx, el.value, e.currentTarget.value); el.value=''; e.currentTarget.value=''; } }} 
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      {poll.candidates.map((cand, cIdx) => (
                        <div key={cIdx} className="flex justify-between items-center px-3 py-1.5 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 shadow-sm">
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate">{cand.name}</span>
                            {cand.note && <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{cand.note}</span>}
                          </div>
                          <button onClick={() => removeCandidate(pIdx, cIdx)} className="text-gray-400 hover:text-red-500 p-1"><X size={14}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button onClick={() => setPolls([...polls, { id: `p${Date.now()}`, type: 'text', title: 'お店・場所など', candidates: [] }])} className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm">
              <Plus size={16} /> 別のアンケート項目を追加 (場所など)
            </button>
          </div>

          <div className="pt-4">
            <button onClick={handleCreate} disabled={loading} className="w-full py-4 bg-teal-600 text-white font-black text-lg rounded-2xl shadow-xl hover:bg-teal-700 transition-all flex items-center justify-center gap-2">
              {loading ? '作成中...' : 'イベントを作成する'} <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <article className="p-6 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
         <h2 className="text-lg font-black flex items-center gap-2 mb-4"><Info className="text-teal-500" size={20} />「まいつーる日程調整」の特長</h2>
         <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-2 flex items-center gap-2"><Zap size={16} className="text-teal-500" />ログイン不要で即作成</h3>
               <p>面倒な会員登録は一切不要。思い立ったらすぐにイベントページを作成し、URLをLINEやSlackで共有するだけで調整がスタートします。回答もスマホからサクサク行えます。</p>
            </div>
            <div>
               <h3 className="text-gray-800 dark:text-white font-bold mb-2 flex items-center gap-2"><ShieldCheck size={16} className="text-teal-500" />細かいニュアンスも伝わる</h3>
               <p>単なる○✕だけでなく、日程ごとにコメントを残せるため、「19時以降なら○」「場所によっては△」といった細かい条件もスムーズに共有できます。</p>
            </div>
         </div>
      </article>
      {!isWorkspace && <AdBanner />}
    </div>
  );
};

export default ScheduleTool;
