import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Users, Copy, Check, Plus, Trash2, Info, ShieldCheck, Zap, Clock,
  Link as LinkIcon, Eye, KeyRound, AlertTriangle, Loader2,
} from 'lucide-react';
import AdBanner from '../AdBanner';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { EditorState } from '@codemirror/state';
import { EditorView, basicSetup } from 'codemirror';
import { yCollab } from 'y-codemirror.next';

const API_BASE = './collab-api';
const STORAGE_KEY = 'maitool_realtime_memo_rooms';

type Retention = '1h' | '24h' | '7d' | '30d' | 'forever';
const RETENTION_LABELS: Record<Retention, string> = {
  '1h': '1時間',
  '24h': '24時間',
  '7d': '7日間',
  '30d': '30日間',
  'forever': '無期限',
};

interface SavedRoom {
  id: string;
  manageToken: string;
  readToken: string;
  retention: Retention;
  createdAt: string;
}

interface RoomMeta {
  exists: boolean;
  hasPassword: boolean;
  retention: Retention;
  expiresAt: string | null;
  createdAt: string;
  lastAccessAt: string;
}

const USER_COLORS = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c', '#0891b2', '#be185d'];

function loadSavedRooms(): SavedRoom[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* 破損時は空 */ }
  return [];
}

function useCopy(): [string | null, (label: string, text: string) => void] {
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const copy = useCallback((label: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedLabel(label);
      setTimeout(() => setCopiedLabel(null), 2000);
    }).catch(() => { /* 権限エラー時は無視 */ });
  }, []);
  return [copiedLabel, copy];
}

const roomUrl = (id: string, mode?: string, token?: string) => {
  const base = `${location.origin}${location.pathname}#/realtime-memo/${id}`;
  if (!mode) return base;
  return `${base}?mode=${mode}${token ? `&t=${encodeURIComponent(token)}` : ''}`;
};

/* ================= 部屋（エディタ）画面 ================= */
const RoomView: React.FC<{ id: string }> = ({ id }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = (searchParams.get('mode') || 'edit') as 'edit' | 'read' | 'manage';
  const urlToken = searchParams.get('t') || '';
  const readOnly = mode === 'read';

  const saved = loadSavedRooms().find((r) => r.id === id);
  const manageToken = mode === 'manage' ? urlToken : saved?.manageToken || '';
  const readToken = mode === 'read' ? urlToken : saved?.readToken || '';

  const [meta, setMeta] = useState<RoomMeta | null>(null);
  const [phase, setPhase] = useState<'loading' | 'notfound' | 'password' | 'ready'>('loading');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [joinToken, setJoinToken] = useState<string | null>(() => sessionStorage.getItem(`collab_join_${id}`));
  const [connStatus, setConnStatus] = useState('connecting');
  const [participants, setParticipants] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [copiedLabel, copy] = useCopy();
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/rooms/${id}/meta`)
      .then(async (res) => {
        if (!res.ok) throw new Error('notfound');
        return res.json();
      })
      .then((data: RoomMeta) => {
        if (cancelled) return;
        setMeta(data);
        if (data.hasPassword && !sessionStorage.getItem(`collab_join_${id}`)) setPhase('password');
        else setPhase('ready');
      })
      .catch(() => { if (!cancelled) setPhase('notfound'); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    try {
      const res = await fetch(`${API_BASE}/rooms/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error('wrong');
      const data = await res.json();
      if (data.joinToken) {
        sessionStorage.setItem(`collab_join_${id}`, data.joinToken);
        setJoinToken(data.joinToken);
      }
      setPhase('ready');
    } catch {
      setPasswordError('パスワードが違います');
    }
  };

  useEffect(() => {
    if (phase !== 'ready' || !editorRef.current) return;
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('content');
    const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const provider = new WebsocketProvider(
      `${wsProtocol}//${location.host}/collab-ws`,
      id,
      ydoc,
      {
        params: {
          mode,
          token: mode === 'edit' ? '' : urlToken,
          joinToken: joinToken || '',
        },
      },
    );
    providerRef.current = provider;
    const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
    const name = `ゲスト-${Math.floor(1000 + Math.random() * 9000)}`;
    provider.awareness.setLocalStateField('user', { name, color });
    provider.on('status', (ev: { status: string }) => setConnStatus(ev.status));
    const onAwareness = () => setParticipants(provider.awareness.getStates().size);
    provider.awareness.on('change', onAwareness);
    const onText = () => setCharCount(ytext.length);
    ytext.observe(onText);

    const isDark = localStorage.getItem('theme') === 'dark';
    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        EditorView.lineWrapping,
        readOnly ? EditorState.readOnly.of(true) : [],
        readOnly ? EditorView.editable.of(false) : [],
        yCollab(ytext, provider.awareness),
        EditorView.theme({
          '&': { fontSize: '16px', minHeight: '50vh', backgroundColor: isDark ? '#111827' : '#ffffff', color: isDark ? '#f9fafb' : '#111827' },
          '.cm-content': { padding: '16px', fontFamily: 'inherit' },
          '.cm-gutters': { backgroundColor: isDark ? '#1f2937' : '#f9fafb', color: isDark ? '#9ca3af' : '#6b7280', border: 'none' },
        }),
      ],
    });
    const view = new EditorView({ state, parent: editorRef.current });
    viewRef.current = view;
    onText();
    onAwareness();
    return () => {
      ytext.unobserve(onText);
      provider.awareness.off('change', onAwareness);
      view.destroy();
      provider.destroy();
      ydoc.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, id]);

  const handleDelete = async () => {
    if (!manageToken) return;
    if (!window.confirm('このメモを削除しますか？元に戻せません。')) return;
    try {
      await fetch(`${API_BASE}/rooms/${id}`, {
        method: 'DELETE',
        headers: { 'X-Manage-Token': manageToken },
      });
      const rooms = loadSavedRooms().filter((r) => r.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
      sessionStorage.removeItem(`collab_join_${id}`);
      navigate('/realtime-memo');
    } catch { /* 失敗時は画面を維持 */ }
  };

  if (phase === 'loading') {
    return (
      <div className="max-w-4xl mx-auto pb-20 text-center py-20 text-gray-400 font-bold flex items-center justify-center gap-2">
        <Loader2 className="animate-spin" /> 読み込み中...
      </div>
    );
  }
  if (phase === 'notfound') {
    return (
      <div className="max-w-4xl mx-auto pb-20">
        <div className="bg-white dark:bg-dark-lighter rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center space-y-4">
          <AlertTriangle className="text-amber-500 mx-auto" size={40} />
          <p className="font-black text-gray-800 dark:text-white text-lg">メモが見つかりません</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">削除されたか、保存期間が終了した可能性があります。</p>
          <Link to="/realtime-memo" className="inline-block px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black transition-all active:scale-95">
            リアルタイム共有メモのトップへ
          </Link>
        </div>
      </div>
    );
  }
  if (phase === 'password') {
    return (
      <div className="max-w-2xl mx-auto pb-20">
        <div className="bg-white dark:bg-dark-lighter rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2 flex items-center gap-3">
            <KeyRound className="text-emerald-500" size={28} /> パスワードが必要です
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium text-sm">このメモはパスワードで保護されています。</p>
          <form onSubmit={handleJoin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              className="w-full p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-[16px] text-gray-900 dark:text-white focus:border-emerald-500 outline-none transition-all"
            />
            {passwordError && <p className="text-sm font-bold text-red-600 dark:text-red-400">{passwordError}</p>}
            <button type="submit" disabled={!password} className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black disabled:opacity-30 transition-all active:scale-95">
              開く
            </button>
          </form>
        </div>
      </div>
    );
  }

  const statusLabel = connStatus === 'connected' ? '接続中' : connStatus === 'connecting' ? '接続しています...' : '切断（再接続中）';
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="bg-white dark:bg-dark-lighter rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mb-4">
          <h2 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2.5">
            <Users className="text-emerald-500" size={26} /> リアルタイム共有メモ
            {readOnly && <span className="text-xs font-black bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 px-2.5 py-1 rounded-full flex items-center gap-1"><Eye size={12} /> 閲覧専用</span>}
          </h2>
          <div className="flex items-center gap-4 text-xs font-bold text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${connStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              {statusLabel}（{participants}人）
            </span>
            <span>{charCount.toLocaleString()}文字</span>
            {meta && (
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {meta.expiresAt ? `${new Date(meta.expiresAt).toLocaleString('ja-JP')}まで` : `無期限（最終アクセスから180日で削除の場合あり）`}
              </span>
            )}
          </div>
        </div>
        <div ref={editorRef} className="rounded-2xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden" />
        <div className="flex flex-wrap gap-2 mt-5">
          <CopyButton label="編集URL" copiedLabel={copiedLabel} onCopy={() => copy('編集URL', roomUrl(id))} />
          {readToken && <CopyButton label="閲覧URL" copiedLabel={copiedLabel} onCopy={() => copy('閲覧URL', roomUrl(id, 'read', readToken))} />}
          {manageToken && <CopyButton label="管理URL" copiedLabel={copiedLabel} onCopy={() => copy('管理URL', roomUrl(id, 'manage', manageToken))} />}
          {manageToken && (
            <button type="button" onClick={handleDelete} className="px-4 py-2 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex items-center gap-1.5">
              <Trash2 size={14} /> このメモを削除
            </button>
          )}
          <Link to="/realtime-memo" className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-1.5">
            <Plus size={14} /> 新しいメモを作る
          </Link>
        </div>
        <p className="text-[11px] leading-relaxed text-gray-400 dark:text-gray-500 mt-4">
          編集URLを知っている人は誰でも編集できます。管理URLは削除や保存期間の変更ができるため、他人に共有しないでください。
        </p>
      </div>
    </div>
  );
};

const CopyButton: React.FC<{ label: string; copiedLabel: string | null; onCopy: () => void }> = ({ label, copiedLabel, onCopy }) => (
  <button type="button" onClick={onCopy} className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-95 flex items-center gap-1.5">
    {copiedLabel === label ? <Check size={14} /> : <Copy size={14} />}
    {copiedLabel === label ? 'コピーしました' : `${label}をコピー`}
  </button>
);

/* ================= 作成・一覧画面 ================= */
const CreateView: React.FC = () => {
  const navigate = useNavigate();
  const [retention, setRetention] = useState<Retention>('7d');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [rooms, setRooms] = useState<SavedRoom[]>(() => loadSavedRooms());
  const [copiedLabel, copy] = useCopy();

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retention, password: password || undefined }),
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      const room: SavedRoom = {
        id: data.id, manageToken: data.manageToken, readToken: data.readToken,
        retention: data.retention, createdAt: new Date().toISOString(),
      };
      const next = [room, ...loadSavedRooms()];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      navigate(`/realtime-memo/${room.id}?mode=manage&t=${encodeURIComponent(room.manageToken)}`);
    } catch {
      setError('作成に失敗しました。時間をおいて再度お試しください。');
      setCreating(false);
    }
  };

  const handleDeleteSaved = async (room: SavedRoom) => {
    if (!window.confirm('このメモをサーバーから削除しますか？元に戻せません。')) return;
    try {
      await fetch(`${API_BASE}/rooms/${room.id}`, {
        method: 'DELETE',
        headers: { 'X-Manage-Token': room.manageToken },
      });
    } catch { /* サーバー側で期限切れ等の場合も一覧からは消す */ }
    const next = rooms.filter((r) => r.id !== room.id);
    setRooms(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="bg-white dark:bg-dark-lighter rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
        <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white mb-2 flex items-center gap-3">
          <Users className="text-emerald-500" size={32} />
          リアルタイム共有メモ
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium text-sm md:text-base">
          URLを共有するだけで、開いた全員が同時に編集できるメモです。登録不要で、入力はその場で全員の画面に反映されます。
        </p>
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">保存期間</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(RETENTION_LABELS) as Retention[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRetention(r)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all active:scale-95 ${retention === r
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                  {RETENTION_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">パスワード（任意）</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="設定しない場合は空欄のまま"
              className="w-full p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-[16px] text-gray-900 dark:text-white focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          {error && (
            <p className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-4 py-3">{error}</p>
          )}
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base disabled:opacity-30 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {creating ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
            {creating ? '作成中...' : 'メモを作成する'}
          </button>
          <p className="text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
            ご注意：作成したメモは、選択した保存期間が経過した場合、または最終アクセス日から180日以上アクセスがない場合、予告なく削除されることがあります。重要な内容は別途バックアップをお願いします。
          </p>
        </div>

        {rooms.length > 0 && (
          <div className="mt-10">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">このブラウザで作成したメモ</label>
            <ul className="space-y-2">
              {rooms.map((room) => (
                <li key={room.id} className="flex flex-wrap items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <div className="flex-1 min-w-[180px]">
                    <p className="font-mono text-sm font-bold text-gray-800 dark:text-gray-100">{room.id}</p>
                    <p className="text-xs text-gray-400">{new Date(room.createdAt).toLocaleString('ja-JP')} 作成 ・ 保存期間 {RETENTION_LABELS[room.retention]}</p>
                  </div>
                  <Link to={`/realtime-memo/${room.id}?mode=manage&t=${encodeURIComponent(room.manageToken)}`} className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-95">
                    開く
                  </Link>
                  <button type="button" onClick={() => copy(`list-${room.id}`, roomUrl(room.id, 'manage', room.manageToken))} className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center gap-1">
                    {copiedLabel === `list-${room.id}` ? <Check size={13} /> : <LinkIcon size={13} />} 管理URL
                  </button>
                  <button type="button" onClick={() => handleDeleteSaved(room)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" aria-label="削除">
                    <Trash2 size={17} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2 mb-6">
          <Info className="text-blue-500" />
          リアルタイム共有メモの特徴と安全性について
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <Zap size={18} /> <span>同時編集</span>
            </div>
            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              複数の人が同じメモを同時に編集しても、内容が競合して消えることはありません。相手の入力がその場で反映されます。
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <ShieldCheck size={18} /> <span>URLが権限</span>
            </div>
            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              アカウント登録は不要です。推測できないURLを知っている人だけがアクセスでき、閲覧専用URLやパスワードも設定できます。機密情報の共有には使わないでください。
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <Clock size={18} /> <span>自動で整理</span>
            </div>
            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              保存期間は作成時に選べます。無期限を選んでも、最終アクセスから180日以上アクセスがないメモは削除される場合があります。
            </p>
          </div>
        </div>
      </article>

      <AdBanner />
    </div>
  );
};

const RealtimeMemo: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  if (id) return <RoomView id={id} />;
  return <CreateView />;
};

export default RealtimeMemo;
