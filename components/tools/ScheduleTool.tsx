
import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  CalendarCheck, Plus, Trash2, Calendar, Clock, 
  Link as LinkIcon, Check, Copy, User, MessageSquare, 
  ChevronLeft, ChevronRight, Share2, ExternalLink,
  Edit2, X, AlertCircle, Circle, XCircle, Triangle,
  Info, ShieldCheck, Zap, Lock, Settings, Filter, Star
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
  admin_token?: string; // APIからは通常返されない（認証後のみ）
  has_password?: boolean; // パスワード保護されているか
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
  const [createPassword, setCreatePassword] = useState(''); // 新規作成時のパスワード
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
  const [filterMode, setFilterMode] = useState<'all' | 'perfect' | 'possible'>('all'); // 絞り込みモード
  
  // Admin / Auth States
  const [adminToken, setAdminToken] = useState<string | null>(urlToken);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [isOrganizerMode, setIsOrganizerMode] = useState(false); // 編集モード表示フラグ
  const [editEventData, setEditEventData] = useState<ScheduleEvent | null>(null); // 編集用データ
  
  // Answer Modal
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: '', comment: '' });
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, {status: number, comment: string}[]>>({});
  
  // Share
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Initialize
  useEffect(() => {
    if (eventId) {
      fetchEventData();
    } else {
      setEventData(null);
    }
  }, [eventId]);

  // URLにトークンがある場合は管理者とみなす
  useEffect(() => {
    if (urlToken) {
        setAdminToken(urlToken);
    }
  }, [urlToken]);

  const fetchEventData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`./backend/schedule_api.php?action=get&id=${eventId}`);
      if (!res.ok) throw new Error('イベントが見つかりません');
      const data = await res.json();
      
      // データ構造の正規化
      if (data.polls) {
        data.polls = data.polls.map((poll: any) => ({
          ...poll,
          candidates: poll.candidates.map((c: any) => 
            typeof c === 'string' ? { name: c, note: '' } : c
          )
        }));
      }

      setEventData(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Create Functions ---
  
  const addCandidate = (pollIndex: number, name: string, note: string = '', setPollsFunc = setPolls, currentPolls = polls) => {
    const newPolls = [...currentPolls];
    if (!newPolls[pollIndex].candidates.some(c => c.name === name)) {
      newPolls[pollIndex].candidates.push({ name, note });
      if (newPolls[pollIndex].type === 'date') {
        newPolls[pollIndex].candidates.sort((a, b) => new Date(a.name.split(' ')[0]).getTime() - new Date(b.name.split(' ')[0]).getTime());
      }
      setPollsFunc(newPolls);
    }
  };

  const removeCandidate = (pollIndex: number, candIndex: number, setPollsFunc = setPolls, currentPolls = polls) => {
    const newPolls = [...currentPolls];
    newPolls[pollIndex].candidates.splice(candIndex, 1);
    setPollsFunc(newPolls);
  };

  // 汎用DateSelectハンドラ
  const handleDateSelectGeneral = (date: Date, pollIndex: number, setPollsFunc: any, currentPolls: any) => {
    const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} (${['日','月','火','水','木','金','土'][date.getDay()]})`;
    const val = isTimeEnabled ? `${dateStr} ${timeRange.start}〜${timeRange.end}` : dateStr;
    addCandidate(pollIndex, val, '', setPollsFunc, currentPolls);
  };

  const handleCreate = async () => {
    if (!title.trim()) { alert('イベント名を入力してください'); return; }
    if (polls[0].candidates.length === 0) { alert('日程候補を少なくとも1つ選択してください'); return; }

    setLoading(true);
    try {
      const res = await fetch('./backend/schedule_api.php?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            title, 
            description, 
            deadline, 
            polls,
            password: createPassword // オプション
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        const baseUrl = window.location.href.split('?')[0];
        // 作成後は管理者トークン付きでリダイレクト
        window.location.href = `${baseUrl}?id=${data.id}&token=${data.admin_token}`;
      }
    } catch (e) {
      alert('作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // --- Organizer / Admin Functions ---

  const handleOrganizerLogin = async () => {
    if (!eventData) return;
    
    // 既にトークンを持っている場合
    if (adminToken) {
        setIsOrganizerMode(true);
        // 編集用データ初期化
        setEditEventData(JSON.parse(JSON.stringify(eventData)));
        return;
    }

    // パスワードがない場合は自動ログイン試行
    if (!eventData.has_password) {
        performAuth('');
        return;
    }

    // パスワードがある場合はモーダル表示
    setIsAuthModalOpen(true);
  };

  const performAuth = async (password: string) => {
    try {
        const res = await fetch('./backend/schedule_api.php?action=auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: eventId, password })
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            setAdminToken(data.admin_token);
            setIsAuthModalOpen(false);
            setAuthPassword('');
            setIsOrganizerMode(true);
            setEditEventData(JSON.parse(JSON.stringify(eventData))); // 編集用データ準備
        } else {
            alert(data.error || '認証に失敗しました');
        }
    } catch(e) {
        alert('通信エラーが発生しました');
    }
  };

  const handleEditDateSelect = (date: Date, pollIndex: number) => {
      if (!editEventData) return;
      const newPolls = [...editEventData.polls];
      const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} (${['日','月','火','水','木','金','土'][date.getDay()]})`;
      const val = isTimeEnabled ? `${dateStr} ${timeRange.start}〜${timeRange.end}` : dateStr;
      
      if (!newPolls[pollIndex].candidates.some(c => c.name === val)) {
          newPolls[pollIndex].candidates.push({ name: val, note: '' });
          newPolls[pollIndex].candidates.sort((a, b) => new Date(a.name.split(' ')[0]).getTime() - new Date(b.name.split(' ')[0]).getTime());
          setEditEventData({ ...editEventData, polls: newPolls });
      }
  };

  const removeCandidateEdit = (pollIndex: number, candIndex: number) => {
      if (!editEventData) return;
      const newPolls = [...editEventData.polls];
      newPolls[pollIndex].candidates.splice(candIndex, 1);
      setEditEventData({ ...editEventData, polls: newPolls });
  };

  const handleUpdateEvent = async () => {
    if (!editEventData || !adminToken) return;
    if (!editEventData.title.trim()) { alert('タイトルは必須です'); return; }

    setLoading(true);
    try {
        const res = await fetch('./backend/schedule_api.php?action=update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: eventId,
                token: adminToken,
                title: editEventData.title,
                description: editEventData.description,
                deadline: editEventData.deadline,
                polls: editEventData.polls
            })
        });
        if (res.ok) {
            alert('イベントを更新しました');
            setIsOrganizerMode(false);
            fetchEventData();
        } else {
            alert('更新に失敗しました');
        }
    } catch (e) {
        alert('通信エラー');
    } finally {
        setLoading(false);
    }
  };

  const deleteEvent = async () => {
      if(!confirm('本当にこのイベントを削除しますか？\nこの操作は取り消せません。')) return;
      try {
          await fetch('./backend/schedule_api.php?action=delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: eventId, token: adminToken })
          });
          const baseUrl = window.location.href.split('?')[0];
          window.location.href = baseUrl;
      } catch(e) { alert('削除失敗'); }
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

  // --- Filtering Logic ---
  const getCandidateStatus = (poll: PollOption, candIndex: number) => {
      if (!eventData) return { o: 0, tri: 0, x: 0, isPerfect: false };
      let o = 0, tri = 0, x = 0;
      eventData.answers.forEach(ans => {
          const status = ans.selections[poll.id]?.[candIndex]?.status;
          if (status === 2) o++;
          else if (status === 1) tri++;
          else x++;
      });
      // 全員参加可能か（回答者がいて、かつ全員が〇）
      // 修正: △もNGとするため、oの数が回答者数と一致する必要がある（△はtriにカウントされ、oには含まれない）
      const isPerfect = eventData.answers.length > 0 && o === eventData.answers.length;
      return { o, tri, x, isPerfect };
  };

  const filteredCandidates = (poll: PollOption) => {
      return poll.candidates.map((cand, i) => ({ ...cand, originalIndex: i, stats: getCandidateStatus(poll, i) }))
          .filter(c => {
              if (filterMode === 'perfect') return c.stats.isPerfect;
              // possible: 〇または△のみ (×が0)
              if (filterMode === 'possible') return c.stats.x === 0 && eventData!.answers.length > 0;
              return true;
          });
  };

  // --- Components ---

  const CalendarPicker = ({ onSelect }: { onSelect?: (d: Date) => void }) => {
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
                        onClick={() => d && onSelect?.(d)}
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
      if (loading && !eventData) return <div className="p-10 text-center"><div className="animate-spin text-teal-500 text-4xl mx-auto mb-4">C</div>読み込み中...</div>;
      if (!eventData) return <div className="p-10 text-center text-red-500">イベントが見つかりません</div>;

      const mainPoll = eventData.polls[0];
      const displayCandidates = filteredCandidates(mainPoll);

      return (
          <div className={`mx-auto max-w-5xl pb-20 ${isWorkspace ? 'p-2' : 'space-y-6'}`}>
              <div className="bg-white dark:bg-dark-lighter rounded-3xl p-4 md:p-10 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                      <div>
                          <h1 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white mb-2">{eventData.title}</h1>
                          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm whitespace-pre-wrap">{eventData.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                          <button onClick={() => {
                              const url = window.location.href.split('&token')[0];
                              navigator.clipboard.writeText(url);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                          }} className="flex items-center gap-2 px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-xl font-bold text-xs hover:bg-teal-200 transition-colors">
                              {copied ? <Check size={14}/> : <Share2 size={14}/>} URLコピー
                          </button>
                          
                          <button onClick={handleOrganizerLogin} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors">
                              <Settings size={14} /> 幹事メニュー
                          </button>
                      </div>
                  </div>

                  {eventData.deadline && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full text-[10px] font-bold mb-6">
                          <Clock size={12} /> 期限: {eventData.deadline.replace('T', ' ')}
                      </div>
                  )}

                  {/* Filter Controls */}
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
                      <button onClick={() => setFilterMode('all')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filterMode === 'all' ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                          全表示
                      </button>
                      <button onClick={() => setFilterMode('perfect')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filterMode === 'perfect' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                          <Star size={12} fill="currentColor"/> 全員〇
                      </button>
                      <button onClick={() => setFilterMode('possible')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filterMode === 'possible' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                          <Filter size={12}/> 〇/△のみ
                      </button>
                  </div>

                  {/* Main Table */}
                  <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-2xl relative max-h-[60vh] bg-white dark:bg-dark-lighter">
                      <table className="w-full text-sm text-left border-collapse">
                          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-30 shadow-sm">
                              <tr>
                                  <th className="p-3 min-w-[120px] border-b border-r dark:border-gray-700 sticky left-0 bg-gray-50 dark:bg-gray-800 z-40 font-bold text-xs shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">参加者 / 候補</th>
                                  {displayCandidates.map((cand) => (
                                      <th key={cand.originalIndex} className={`p-2 min-w-[100px] border-b border-r dark:border-gray-700 font-bold text-center relative group text-xs whitespace-normal ${cand.stats.isPerfect ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                                          {cand.stats.isPerfect && <div className="absolute top-0 left-0 w-full h-1 bg-orange-400"></div>}
                                          <div className="text-gray-800 dark:text-white px-1">{cand.name}</div>
                                          {cand.note && <div className="text-[10px] text-gray-500 font-normal mt-1 truncate">{cand.note}</div>}
                                          <button onClick={() => exportGoogleCalendar(mainPoll, cand.originalIndex)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 p-1"><Calendar size={12}/></button>
                                      </th>
                                  ))}
                              </tr>
                          </thead>
                          <tbody className="pb-12">
                              {eventData.answers.length === 0 ? (
                                  <tr><td colSpan={displayCandidates.length + 1} className="p-8 text-center text-gray-400 text-xs">まだ回答がありません</td></tr>
                              ) : eventData.answers.map((ans) => (
                                  <tr key={ans.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                      <td className="p-3 border-b border-r dark:border-gray-700 sticky left-0 bg-white dark:bg-dark-lighter z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                          <div className="font-bold text-gray-800 dark:text-gray-200 text-xs">{ans.name}</div>
                                          {ans.comment && <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1"><MessageSquare size={8}/> {ans.comment}</div>}
                                      </td>
                                      {displayCandidates.map((cand) => {
                                          const sel = ans.selections[mainPoll.id]?.[cand.originalIndex];
                                          const status = sel?.status;
                                          const comment = sel?.comment;
                                          return (
                                              <td key={cand.originalIndex} className={`p-2 border-b border-r dark:border-gray-700 text-center relative group ${cand.stats.isPerfect ? 'bg-orange-50/30 dark:bg-orange-900/10' : ''}`}>
                                                  <div className="flex flex-col items-center justify-center h-full">
                                                      {status === 2 ? <Circle className="text-red-500 fill-red-50 dark:fill-red-900/30" size={18} /> :
                                                       status === 1 ? <Triangle className="text-yellow-500 fill-yellow-50 dark:fill-yellow-900/30" size={18} /> :
                                                       <X className="text-gray-300" size={18} />}
                                                      
                                                      {comment && (
                                                          <div className="absolute bottom-0 right-0 text-gray-400">
                                                              <MessageSquare size={10} className="text-blue-400" />
                                                          </div>
                                                      )}
                                                      {comment && (
                                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-gray-900 text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                              {comment}
                                                          </div>
                                                      )}
                                                  </div>
                                              </td>
                                          );
                                      })}
                                  </tr>
                              ))}
                              {/* Spacer Row for sticky footer overlap prevention */}
                              <tr className="h-12 bg-transparent border-0"><td colSpan={displayCandidates.length + 1}></td></tr>
                          </tbody>
                          {/* Score Row: Moved to tfoot for better sticky positioning */}
                          <tfoot className="bg-teal-50 dark:bg-teal-900/20 sticky bottom-0 z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
                              <tr>
                                  <th className="p-2 border-t border-r border-teal-100 dark:border-teal-900 sticky left-0 bg-teal-50 dark:bg-teal-900/20 z-40 text-teal-800 dark:text-teal-200 font-bold text-right text-xs shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">回答</th>
                                  {displayCandidates.map((cand) => (
                                      <td key={cand.originalIndex} className={`p-2 border-t border-r border-teal-100 dark:border-teal-900 text-center font-bold text-teal-700 dark:text-teal-300 text-xs ${cand.stats.isPerfect ? 'bg-orange-100/50 dark:bg-orange-900/40' : ''}`}>
                                          〇{cand.stats.o} / △{cand.stats.tri}
                                      </td>
                                  ))}
                              </tr>
                          </tfoot>
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
                          {filteredCandidates(poll).map((cand) => {
                              return (
                                  <div key={cand.originalIndex} className={`flex flex-col md:flex-row md:items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 gap-2 ${cand.stats.isPerfect ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-gray-50 dark:bg-gray-800'}`}>
                                      <div className="flex flex-col">
                                          <div className="flex items-center gap-2">
                                              {cand.stats.isPerfect && <Star size={14} className="text-orange-500 fill-orange-500" />}
                                              <span className="font-bold text-sm text-gray-700 dark:text-gray-200">{cand.name}</span>
                                          </div>
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
                                          <span className="text-xs font-bold text-gray-500">回答:</span>
                                          <span className="text-sm font-black text-teal-600 dark:text-teal-400">〇{cand.stats.o} / △{cand.stats.tri}</span>
                                      </div>
                                  </div>
                              );
                          })}
                          {filteredCandidates(poll).length === 0 && <div className="text-center text-xs text-gray-400 p-4">該当する候補がありません</div>}
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

              {/* Auth Modal (Password Prompt) */}
              {isAuthModalOpen && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                      <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-gray-700">
                          <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">幹事ログイン</h3>
                          <p className="text-xs text-gray-500 mb-4">このイベントにはパスワードが設定されています。</p>
                          <input 
                              type="password" 
                              value={authPassword}
                              onChange={e => setAuthPassword(e.target.value)}
                              className="w-full p-3 mb-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="パスワード"
                          />
                          <div className="flex gap-2">
                              <button onClick={() => setIsAuthModalOpen(false)} className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-sm">キャンセル</button>
                              <button onClick={() => performAuth(authPassword)} className="flex-1 py-2 bg-teal-600 text-white rounded-xl font-bold text-sm">認証</button>
                          </div>
                      </div>
                  </div>
              )}

              {/* Organizer / Edit Mode Modal */}
              {isOrganizerMode && editEventData && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                              <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2"><Settings size={18}/> 幹事用メニュー</h3>
                              <button onClick={() => setIsOrganizerMode(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><X size={20}/></button>
                          </div>
                          <div className="p-6 overflow-y-auto flex-1 space-y-8">
                               {/* Edit Form */}
                               <div className="space-y-4">
                                   <div>
                                       <label className="block text-xs font-bold text-gray-500 mb-1">イベント名</label>
                                       <input type="text" value={editEventData.title} onChange={e => setEditEventData({...editEventData, title: e.target.value})} className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold" />
                                   </div>
                                   <div>
                                       <label className="block text-xs font-bold text-gray-500 mb-1">詳細 / メモ</label>
                                       <textarea value={editEventData.description} onChange={e => setEditEventData({...editEventData, description: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm h-20 resize-none" />
                                   </div>
                                   <div>
                                       <label className="block text-xs font-bold text-gray-500 mb-1">回答期限</label>
                                       <input type="datetime-local" value={editEventData.deadline || ''} onChange={e => setEditEventData({...editEventData, deadline: e.target.value})} className="w-full md:w-auto p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                                   </div>
                               </div>

                               <hr className="border-gray-100 dark:border-gray-800" />

                               <div className="space-y-6">
                                   <h4 className="font-bold text-base text-gray-700 dark:text-gray-300">アンケート項目の編集</h4>
                                   {editEventData.polls.map((poll, pIdx) => (
                                       <div key={poll.id} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                           <input 
                                                type="text" 
                                                value={poll.title} 
                                                onChange={e => {
                                                    const newPolls = [...editEventData.polls];
                                                    newPolls[pIdx].title = e.target.value;
                                                    setEditEventData({...editEventData, polls: newPolls});
                                                }}
                                                className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 py-1 font-bold text-base focus:border-teal-500 outline-none text-gray-800 dark:text-white mb-3"
                                           />
                                           
                                           {poll.type === 'date' ? (
                                              <div className="space-y-4">
                                                  <div className="bg-white dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-600">
                                                      <CalendarPicker onSelect={(d) => handleEditDateSelect(d, pIdx)} />
                                                  </div>
                                                  <div>
                                                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">現在の候補</label>
                                                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                                          {poll.candidates.map((cand, cIdx) => (
                                                              <div key={cIdx} className="flex justify-between items-center px-3 py-1.5 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 shadow-sm">
                                                                  <span className="font-mono font-bold text-sm text-gray-700 dark:text-gray-200">{cand.name}</span>
                                                                  <button onClick={() => removeCandidateEdit(pIdx, cIdx)} className="text-gray-400 hover:text-red-500 p-1"><X size={14}/></button>
                                                              </div>
                                                          ))}
                                                          {poll.candidates.length === 0 && <div className="text-gray-400 text-xs p-2 text-center">カレンダーの日付をクリックして追加</div>}
                                                      </div>
                                                  </div>
                                              </div>
                                           ) : (
                                              <div className="space-y-2">
                                                  {poll.candidates.map((cand, cIdx) => (
                                                      <div key={cIdx} className="flex flex-col sm:flex-row gap-2 bg-white dark:bg-gray-700 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                                                          <input 
                                                              type="text" 
                                                              value={cand.name} 
                                                              onChange={e => {
                                                                  const newPolls = [...editEventData.polls];
                                                                  newPolls[pIdx].candidates[cIdx].name = e.target.value;
                                                                  setEditEventData({...editEventData, polls: newPolls});
                                                              }}
                                                              className="flex-1 p-2 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm"
                                                              placeholder="候補名"
                                                          />
                                                          <div className="flex gap-2 flex-1">
                                                              <input 
                                                                  type="text" 
                                                                  value={cand.note} 
                                                                  onChange={e => {
                                                                      const newPolls = [...editEventData.polls];
                                                                      newPolls[pIdx].candidates[cIdx].note = e.target.value;
                                                                      setEditEventData({...editEventData, polls: newPolls});
                                                                  }}
                                                                  className="flex-1 p-2 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm"
                                                                  placeholder="備考・URL"
                                                              />
                                                              <button onClick={() => removeCandidateEdit(pIdx, cIdx)} className="text-gray-400 hover:text-red-500 p-2"><X size={16}/></button>
                                                          </div>
                                                      </div>
                                                  ))}
                                                  {/* 追加UI */}
                                                  <div className="flex flex-col sm:flex-row gap-2 mt-2 bg-white dark:bg-gray-700 p-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                                       <input type="text" id={`new-cand-name-${pIdx}`} className="flex-1 p-2 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm" placeholder="新しい候補名" />
                                                       <div className="flex gap-2 flex-1">
                                                           <input type="text" id={`new-cand-note-${pIdx}`} className="flex-1 p-2 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm" placeholder="備考・URL" />
                                                           <button 
                                                              onClick={() => {
                                                                  const nameEl = document.getElementById(`new-cand-name-${pIdx}`) as HTMLInputElement;
                                                                  const noteEl = document.getElementById(`new-cand-note-${pIdx}`) as HTMLInputElement;
                                                                  if (nameEl.value) {
                                                                      const newPolls = [...editEventData.polls];
                                                                      newPolls[pIdx].candidates.push({ name: nameEl.value, note: noteEl.value });
                                                                      setEditEventData({...editEventData, polls: newPolls});
                                                                      nameEl.value = '';
                                                                      noteEl.value = '';
                                                                  }
                                                              }}
                                                              className="px-3 bg-teal-600 text-white rounded text-xs font-bold whitespace-nowrap"
                                                           >追加</button>
                                                       </div>
                                                  </div>
                                              </div>
                                           )}
                                       </div>
                                   ))}
                               </div>
                               
                               <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                   <p className="text-xs text-red-500 font-bold mb-2">危険な操作</p>
                                   <button onClick={deleteEvent} className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors">イベントを削除する</button>
                               </div>
                          </div>
                          <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 flex gap-4">
                              <button onClick={() => setIsOrganizerMode(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">キャンセル</button>
                              <button onClick={handleUpdateEvent} className="flex-1 py-3 bg-teal-600 text-white font-black rounded-xl shadow-lg hover:bg-teal-700 transition-all text-sm">変更を保存</button>
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
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">幹事用パスワード (任意)</label>
              <div className="flex items-center gap-2">
                  <Lock size={16} className="text-gray-400" />
                  <input 
                    type="password" 
                    value={createPassword} 
                    onChange={e => setCreatePassword(e.target.value)} 
                    className="w-full md:w-auto p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" 
                    placeholder="編集・削除時に必要"
                  />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">設定しない場合、URLを知っている全員が編集可能になります。</p>
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
                    <div className="shrink-0 w-full md:w-auto"><CalendarPicker onSelect={(d) => handleDateSelectGeneral(d, pIdx, setPolls, polls)} /></div>
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
