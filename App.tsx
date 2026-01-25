
import React, { useState, useEffect, createContext, useContext, useRef, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Menu, QrCode, AlignLeft, Image as ImageIcon, Binary, 
  Network, Activity, Timer, RefreshCw, FileDiff, Wallet, Sun, Moon, 
  LayoutGrid, Grid2X2, StickyNote, KeyRound, Scale, Clock, Palette, 
  FileJson, FileType, Calculator, Trophy, Stamp, Dices, BoxSelect, 
  Fingerprint, Type, Disc, ArrowRightLeft, ImageOff, Hash, Search, 
  BookOpen, ListTodo, FileStack, Code, Database, CalendarDays, Globe, 
  Pipette, ShieldAlert, Watch
} from 'lucide-react';

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import LoadingSkeleton from './components/LoadingSkeleton';

// ツールコンポーネントの遅延読み込み (React.lazy)
const AdminPage = lazy(() => import('./components/admin/AdminPage'));
const QRCodeGenerator = lazy(() => import('./components/tools/QRCodeGenerator'));
const FileConverter = lazy(() => import('./components/tools/FileConverter'));
const CharacterCounter = lazy(() => import('./components/tools/CharacterCounter'));
const ImageResizer = lazy(() => import('./components/tools/ImageResizer'));
const IpChecker = lazy(() => import('./components/tools/IpChecker'));
const SpeedTest = lazy(() => import('./components/tools/SpeedTest'));
const TimerTool = lazy(() => import('./components/tools/TimerTool'));
const Kakeibo = lazy(() => import('./components/tools/Kakeibo'));
const Notepad = lazy(() => import('./components/tools/Notepad'));
const PasswordGenerator = lazy(() => import('./components/tools/PasswordGenerator'));
const ColorPickerTool = lazy(() => import('./components/tools/ColorPickerTool'));
const PdfTools = lazy(() => import('./components/tools/PdfTools'));
const ServerLocation = lazy(() => import('./components/tools/ServerLocation'));
const BinaryConverter = lazy(() => import('./components/tools/BinaryConverter'));
const CalculatorTool = lazy(() => import('./components/tools/CalculatorTool'));
const Scoreboard = lazy(() => import('./components/tools/Scoreboard'));
const UnitConverter = lazy(() => import('./components/tools/UnitConverter'));
const RandomGenerator = lazy(() => import('./components/tools/RandomGenerator'));
const AspectRatioCalculator = lazy(() => import('./components/tools/AspectRatioCalculator'));
const UuidGenerator = lazy(() => import('./components/tools/UuidGenerator'));
const CaseConverter = lazy(() => import('./components/tools/CaseConverter'));
const Roulette = lazy(() => import('./components/tools/Roulette'));
const TextConverter = lazy(() => import('./components/tools/TextConverter'));
const ImageConverter = lazy(() => import('./components/tools/ImageConverter'));
const HashGenerator = lazy(() => import('./components/tools/HashGenerator'));
const RegexChecker = lazy(() => import('./components/tools/RegexChecker'));
const Flashcards = lazy(() => import('./components/tools/Flashcards'));
const TaskManager = lazy(() => import('./components/tools/TaskManager'));
const HtmlEditor = lazy(() => import('./components/tools/HtmlEditor'));
const SqlPlayground = lazy(() => import('./components/tools/SqlPlayground'));
const DateCalculator = lazy(() => import('./components/tools/DateCalculator'));
const IpSubnetVisualizer = lazy(() => import('./components/tools/IpSubnetVisualizer'));
const ColorPalette = lazy(() => import('./components/tools/ColorPalette'));
const JsonFormatter = lazy(() => import('./components/tools/JsonFormatter'));
const MarkdownEditor = lazy(() => import('./components/tools/MarkdownEditor'));
const ImageWatermarker = lazy(() => import('./components/tools/ImageWatermarker'));
const ExifRemover = lazy(() => import('./components/tools/ExifRemover'));
const TextDiff = lazy(() => import('./components/tools/TextDiff'));
const TimestampConverter = lazy(() => import('./components/tools/TimestampConverter'));
const MultiToolViewer = lazy(() => import('./components/tools/MultiToolViewer'));

import { Tool } from './types';

const ADMIN_PATH = '/secure-panel-7x9v2';

export const AppContext = createContext<{
  showAds: boolean;
  setShowAds: (v: boolean) => void;
  adBlockDetected: boolean;
}>({
  showAds: true,
  setShowAds: () => {},
  adBlockDetected: false,
});

export const TOOLS: Tool[] = [
  { id: 'qrcode', name: 'QRコード生成', path: '/qrcode', description: 'URLを入力してQRコードを作成', icon: QrCode, color: 'text-blue-500', lightBg: 'bg-blue-50', longDescription: '安全で高速なオンラインQRコード作成ツール。商用利用無料で、生成データはサーバーに保存されません。', keywords: ['QRコード作成', '無料', '高画質'] },
  { id: 'count', name: '文字数カウンター', path: '/count', description: 'リアルタイムで文字数・行数をカウント', icon: AlignLeft, color: 'text-green-500', lightBg: 'bg-green-50', longDescription: 'レポートやSNS投稿に便利な高機能文字数カウント。ひらがな・漢字の比率分析も。', keywords: ['文字数カウント', '原稿用紙換算'] },
  { id: 'picker', name: 'カラーピッカー', path: '/picker', description: 'RGB/HSL/CMYK変換・画像から抽出', icon: Pipette, color: 'text-pink-600', lightBg: 'bg-pink-50', longDescription: 'Web制作に最適なカラーピッカー。スポイト機能で画像から色を抽出できます。', keywords: ['カラーピッカー', 'HEX変換', 'スポイト'] },
  { id: 'password', name: 'パスワード生成', path: '/password', description: '強力なランダムパスワードを生成', icon: KeyRound, color: 'text-emerald-600', lightBg: 'bg-emerald-50', longDescription: '強力で安全なパスワードをブラウザで生成。記号の有無や履歴保存にも対応。', keywords: ['パスワード生成', 'セキュリティ', 'ランダム'] },
  { id: 'kakeibo', name: 'まいつーる家計簿', path: '/kakeibo', description: '登録不要の多機能家計簿', icon: Wallet, color: 'text-yellow-600', lightBg: 'bg-yellow-50', longDescription: 'ブラウザ保存で安心の無料家計簿。円グラフ分析、サブスク管理、目標設定機能。', keywords: ['家計簿', '節約', '無料ツール'] },
  { id: 'pdf', name: 'PDFツール', path: '/pdf', description: '結合・解除・ページ回転', icon: FileStack, color: 'text-red-600', lightBg: 'bg-red-50', longDescription: 'ブラウザ完結型のPDF編集。結合、パスワード解除、回転、白塗りが安全に行えます。', keywords: ['PDF結合', 'PDF編集', 'PDF解除'] },
  { id: 'resize', name: '画像リサイズ', path: '/resize', description: 'アスペクト比維持でサイズ変更', icon: ImageIcon, color: 'text-purple-500', lightBg: 'bg-purple-50', longDescription: '比率を保ったまま画像のピクセルサイズを変更。ブログやSNS投稿の軽量化に。', keywords: ['画像リサイズ', 'サイズ変更', '画像軽量化'] },
  { id: 'convert', name: 'Base64変換', path: '/convert', description: 'ファイルとBase64の相互変換', icon: FileType, color: 'text-orange-500', lightBg: 'bg-orange-50', longDescription: '画像やファイルをBase64テキストに変換。開発時のデータURI作成に便利です。', keywords: ['Base64変換', 'エンコード', 'デコード'] },
  { id: 'ip', name: 'IP確認・ポート', path: '/ip', description: '自分のIP確認とポート開放テスト', icon: Network, color: 'text-sky-500', lightBg: 'bg-sky-50', longDescription: 'グローバルIPアドレスの即時確認と、特定ポートの外部開放チェック。', keywords: ['IP確認', 'ポート開放', 'ネットワーク'] },
  { id: 'speed', name: 'スピードテスト', path: '/speed', description: '回線速度の計測', icon: Activity, color: 'text-rose-500', lightBg: 'bg-rose-50', longDescription: 'インターネット回線のダウンロード・アップロード速度をリアルタイム計測。', keywords: ['スピードテスト', '回線速度', 'ネット診断'] },
  { id: 'server-loc', name: 'サーバー位置情報', path: '/server-loc', description: 'ドメインから位置を特定', icon: Globe, color: 'text-indigo-500', lightBg: 'bg-indigo-50', longDescription: 'IPやドメインからサーバーの物理的な所在地をマップ表示。トレースルート対応。', keywords: ['サーバー場所', 'ドメイン検索', 'IP住所'] },
  { id: 'binary', name: '2進数変換', path: '/binary', description: '10進数と2進数の相互変換', icon: Binary, color: 'text-teal-500', lightBg: 'bg-teal-50', longDescription: 'プログラミングに便利な10進数・2進数・16進数の相互変換ツール。', keywords: ['2進数変換', 'バイナリ', 'プログラミング'] },
  { id: 'timer', name: 'タイマー', path: '/timer', description: 'タイマー・SW・ポモドーロ', icon: Timer, color: 'text-rose-600', lightBg: 'bg-rose-600/10', longDescription: '多機能タイマー。集中力を高めるポモドーロやストップウォッチ機能を搭載。', keywords: ['タイマー', 'ポモドーロ', '集中'] },
  { id: 'notepad', name: 'メモ帳', path: '/notepad', description: 'リッチテキスト対応のメモ', icon: StickyNote, color: 'text-lime-600', lightBg: 'bg-lime-50', longDescription: 'ブラウザ保存の多機能メモ帳。コードハイライトやリッチテキスト編集に対応。', keywords: ['オンラインメモ', 'メモ帳', 'テキスト編集'] },
  { id: 'calculator', name: '計算機', path: '/calculator', description: '履歴付きシンプル計算機', icon: Calculator, color: 'text-orange-600', lightBg: 'bg-orange-50', longDescription: '計算履歴が残るシンプルなWeb電卓。直感的な操作が可能です。', keywords: ['電卓', '計算機', 'オンライン電卓'] },
  { id: 'scoreboard', name: 'スコアボード', path: '/scoreboard', description: 'タイマー付き得点板', icon: Trophy, color: 'text-blue-700', lightBg: 'bg-blue-50', longDescription: 'スポーツやゲームで使える多機能スコアボード. タイマー機能付き。', keywords: ['得点板', 'スコアボード', 'スポーツ'] },
  { id: 'unit', name: '単位変換', path: '/unit', description: '長さ・重さ・温度・面積', icon: Scale, color: 'text-fuchsia-500', lightBg: 'bg-fuchsia-50', longDescription: '長さ、重さ、温度、面積など、日常で使う様々な単位を相互変換します。', keywords: ['単位変換', '単位計算', '換算'] },
  { id: 'random', name: 'ランダム生成', path: '/random', description: '数字のランダム生成', icon: Dices, color: 'text-rose-500', lightBg: 'bg-rose-50', longDescription: '指定した範囲内で乱数を生成。重複の可否も設定可能です。', keywords: ['乱数生成', 'ランダム', '数字'] },
  { id: 'ratio', name: 'アスペクト比計算', path: '/ratio', description: '比率と解像度の計算', icon: BoxSelect, color: 'text-cyan-500', lightBg: 'bg-cyan-50', longDescription: '縦横のサイズからアスペクト比を算出。FHDや4Kなどのプリセットも充実. ', keywords: ['アスペクト比', '解像度', '比率計算'] },
  { id: 'uuid', name: 'UUID生成', path: '/uuid', description: 'v4 UUIDを一括生成', icon: Fingerprint, color: 'text-violet-500', lightBg: 'bg-violet-50', longDescription: '開発で必要なUUID(v4)を瞬時に、かつ一括で生成します。', keywords: ['UUID生成', '開発ツール', 'GUID'] },
  { id: 'case', name: 'ケース変換', path: '/case', description: 'キャメル・スネーク等', icon: Type, color: 'text-orange-500', lightBg: 'bg-orange-50', longDescription: 'テキストのケース（キャメルケース、スネークケース、ケバブケース等）を一括変換。', keywords: ['ケース変換', '命名規則', '開発'] },
  { id: 'roulette', name: 'ルーレット', path: '/roulette', description: '項目自由なルーレット', icon: Disc, color: 'text-pink-500', lightBg: 'bg-pink-50', longDescription: 'ランチの選択やゲームの抽選に。項目を自由にカスタマイズできるルーレット。', keywords: ['ルーレット', '抽選', 'おみくじ'] },
  { id: 'text-conv', name: '全角半角変換', path: '/text-conv', description: 'テキストの形式一括変換', icon: ArrowRightLeft, color: 'text-indigo-600', lightBg: 'bg-indigo-50', longDescription: '英数字やカタカナの全角・半角をボタン一つで一括変換。', keywords: ['全角半角', '文字変換', '整形'] },
  { id: 'image-conv', name: '画像形式変換', path: '/image-conv', description: 'PNG/JPG/WEBP/ICO変換', icon: RefreshCw, color: 'text-pink-500', lightBg: 'bg-pink-50', longDescription: '画像のファイル形式をブラウザ上で高速変換。ICO（ファビコン用）にも対応。', keywords: ['画像変換', 'PNG変換', 'WEBP変換'] },
  { id: 'hash', name: 'ハッシュ生成', path: '/hash', description: 'SHA-256等の生成', icon: Hash, color: 'text-slate-600', lightBg: 'bg-slate-100', longDescription: 'テキストからSHA-256やSHA-512などのセキュアなハッシュ値を生成。', keywords: ['ハッシュ生成', 'SHA256', '暗号化'] },
  { id: 'regex', name: '正規表現', path: '/regex', description: 'マッチングテスト', icon: Search, color: 'text-teal-600', lightBg: 'bg-teal-50', longDescription: '正規表現のパターンマッチングをリアルタイムでテスト・検証。', keywords: ['正規表現', 'Regex', 'テスト'] },
  { id: 'flashcards', name: '暗記カード', path: '/flashcards', description: '自作単語帳で学習', icon: BookOpen, color: 'text-blue-500', lightBg: 'bg-blue-50', longDescription: 'ブラウザで使える自作の暗記カード。試験対策や言語学習に最適。', keywords: ['暗記', '単語帳', '学習'] },
  { id: 'tasks', name: 'タスク管理', path: '/tasks', description: '優先度付きTODOリスト', icon: ListTodo, color: 'text-teal-500', lightBg: 'bg-teal-50', longDescription: 'シンプルで使いやすいタスク管理。ブラウザ保存なのでログイン不要。', keywords: ['TODOリスト', 'タスク管理', '効率化'] },
  { id: 'html', name: 'HTMLエディタ', path: '/html', description: 'ライブプレビュー付き', icon: Code, color: 'text-orange-600', lightBg: 'bg-orange-50', longDescription: 'HTML/CSSを記述して即座にプレビュー。XSS保護付きで安全。', keywords: ['HTMLエディタ', 'プレビュー', 'コーディング'] },
  { id: 'sql', name: 'オンラインSQL', path: '/sql', description: 'ブラウザでSQL練習', icon: Database, color: 'text-blue-500', lightBg: 'bg-blue-50', longDescription: 'データベース不要でSQLのクエリをブラウザ上で実行・練習。', keywords: ['SQL練習', 'データベース', 'SQL実行'] },
  { id: 'date', name: '日付計算', path: '/date', description: '期間と日数の計算', icon: CalendarDays, color: 'text-indigo-500', lightBg: 'bg-indigo-50', longDescription: '2つの日付間の日数計算や、特定の日から○日後の日付を計算。', keywords: ['日付計算', '日数差', 'カレンダー'] },
  { id: 'subnet', name: 'IPサブネット', path: '/subnet', description: 'サブネット分割計算', icon: Network, color: 'text-cyan-600', lightBg: 'bg-cyan-50', longDescription: 'IPアドレスとマスクからサブネット範囲を算出。エンジニア必携。', keywords: ['サブネット計算', 'IP範囲', 'ネットワーク'] },
  { id: 'palette', name: 'カラーパレット', path: '/palette', description: '配色パレット生成', icon: Palette, color: 'text-indigo-500', lightBg: 'bg-indigo-50', longDescription: 'デザインで使える美しい配色パレットをランダムに生成。', keywords: ['配色パレット', 'デザイン', '色'] },
  { id: 'json', name: 'JSON整形', path: '/json', description: 'JSONの整形と検証', icon: FileJson, color: 'text-yellow-500', lightBg: 'bg-yellow-50', longDescription: '読みづらいJSONファイルをきれいに整形・検証。圧縮も可能。', keywords: ['JSON整形', 'デバッグ', 'フォーマッタ'] },
  { id: 'markdown', name: 'Markdown', path: '/markdown', description: 'エディタとプレビュー', icon: FileType, color: 'text-slate-700', lightBg: 'bg-slate-100', longDescription: 'Markdown記法をブラウザ上でリアルタイムにHTML変換・表示。', keywords: ['Markdown', 'エディタ', 'プレビュー'] },
  { id: 'watermarker', name: '画像透かし', path: '/watermarker', description: 'ロゴや文字を合成', icon: Stamp, color: 'text-sky-500', lightBg: 'bg-sky-50', longDescription: '画像に著作権保護のための透かし（文字や画像）を合成します。', keywords: ['透かし合成', '著作権', '画像加工'] },
  { id: 'exif', name: 'Exif削除', path: '/exif', description: '画像の位置情報を除去', icon: ImageOff, color: 'text-red-500', lightBg: 'bg-red-50', longDescription: '写真に含まれるGPS情報や個人情報を削除してプライバシーを保護。', keywords: ['Exif削除', 'プライバシー', 'GPS消去'] },
  { id: 'diff', name: 'テキストDiff', path: '/diff', description: '文章の差分を比較', icon: FileDiff, color: 'text-cyan-700', lightBg: 'bg-cyan-50', longDescription: '2つの文章を比較して、追加・変更箇所を分かりやすく表示。', keywords: ['テキスト比較', 'Diff', '差分'] },
  { id: 'timestamp', name: 'Unix時間変換', path: '/timestamp', description: 'タイムスタンプ相互変換', icon: Clock, color: 'text-slate-500', lightBg: 'bg-slate-100', longDescription: 'Unixタイムスタンプと日時形式を瞬時に相互変換。', keywords: ['Unix時間', 'タイムスタンプ', '日付変換'] }
];

const AccessLogger: React.FC<{ onBlocked: (blocked: boolean) => void }> = ({ onBlocked }) => {
  const location = useLocation();
  const startTimeRef = useRef(performance.now());
  
  useEffect(() => {
    startTimeRef.current = performance.now();
    const url = './backend/admin_api.php?action=log_access';
    const timer = setTimeout(() => {
        const duration = Math.round(performance.now() - startTimeRef.current);
        const payload = JSON.stringify({
          path: location.pathname,
          referer: document.referrer,
          status: 200,
          duration: duration
        });
        if (navigator.sendBeacon) navigator.sendBeacon(url, payload);
        else fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true });
    }, 0);

    fetch(url, { method: 'HEAD' }).then(res => {
      if (res.status === 403 || res.status === 429) onBlocked(true);
    }).catch(() => {});
    return () => clearTimeout(timer);
  }, [location.pathname, onBlocked]);
  return null;
};

const SEOManager: React.FC = () => {
  const location = useLocation();
  const tool = TOOLS.find(t => t.path === location.pathname);
  const siteTitle = "まいつーる - 登録不要の無料Webツール集";
  const title = tool ? `${tool.name} | ${siteTitle}` : siteTitle;
  const description = tool?.longDescription || "まいつーるは、日常で役立つWebツールがインストール不要・無料で使えるサイトです。プライバシー重視のブラウザ完結設計。";

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {tool?.keywords && <meta name="keywords" content={tool.keywords.join(',')} />}
      <link rel="canonical" href={`https://omnitools.example.com${location.pathname}`} />
    </Helmet>
  );
};

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [isBlocked, setIsBlocked] = useState(false);
  const [addedTools, setAddedTools] = useState<string[]>(() => {
    const saved = localStorage.getItem('addedTools');
    return saved ? JSON.parse(saved) : ['kakeibo', 'count', 'qrcode'];
  });
  
  const [showAds, setShowAds] = useState(() => {
    const saved = localStorage.getItem('showAds');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('showAds', JSON.stringify(showAds));
  }, [showAds]);

  useEffect(() => {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [location.pathname]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const currentTool = TOOLS.find(t => t.path === location.pathname);
  const isAdmin = location.pathname === ADMIN_PATH;
  const sidebarTools = addedTools.map(id => TOOLS.find(t => t.id === id)).filter((t): t is Tool => t !== undefined);

  if (isBlocked) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex p-6 bg-red-500/20 rounded-full text-red-500 mb-4 animate-pulse"><ShieldAlert size={64} /></div>
        <h2 className="text-3xl font-black">アクセス制限</h2>
        <p className="text-slate-400 text-lg leading-relaxed">セキュリティ上の理由によりアクセスが制限されています。</p>
      </div>
    </div>
  );

  if (isAdmin) return <Suspense fallback={<div className="h-screen bg-gray-900 flex items-center justify-center text-white">Loading Admin...</div>}><AdminPage /></Suspense>;

  return (
    <AppContext.Provider value={{ showAds, setShowAds, adBlockDetected: false }}>
      <SEOManager />
      <AccessLogger onBlocked={setIsBlocked} />
      <div className="flex h-screen bg-gray-50 dark:bg-dark overflow-hidden font-sans text-slate-800 dark:text-gray-100 transition-colors duration-300">
        <Sidebar tools={sidebarTools} isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} onReorder={setAddedTools} />
        <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
          <header className="bg-white/95 dark:bg-dark-lighter/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 h-14 md:h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20 shrink-0">
             <div className="flex items-center gap-4">
                <div className="lg:hidden"><button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-full"><Menu size={24} /></button></div>
                <Link to="/" className="font-black text-lg md:text-xl tracking-tight flex items-center gap-2"><LayoutGrid className="text-blue-500" size={20} /><span>まいつーる</span></Link>
                {currentTool && <span className="hidden sm:inline font-normal text-gray-400">/ {currentTool.name}</span>}
             </div>
             <button onClick={toggleTheme} className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 transition-colors">{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button>
          </header>

          <main ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
            <div className="max-w-7xl mx-auto h-full pb-20">
              <Suspense fallback={<LoadingSkeleton />}>
                <Routes>
                  <Route path="/" element={<Dashboard tools={TOOLS} addedTools={addedTools} onToggleAdded={(id) => setAddedTools(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} onReorder={setAddedTools} />} />
                  <Route path="/multiview" element={<MultiToolViewer tools={TOOLS} />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/qrcode" element={<QRCodeGenerator />} />
                  <Route path="/count" element={<CharacterCounter />} />
                  <Route path="/picker" element={<ColorPickerTool />} />
                  <Route path="/password" element={<PasswordGenerator />} />
                  <Route path="/kakeibo" element={<Kakeibo />} />
                  <Route path="/pdf" element={<PdfTools />} />
                  <Route path="/resize" element={<ImageResizer />} />
                  <Route path="/convert" element={<FileConverter />} />
                  <Route path="/ip" element={<IpChecker />} />
                  <Route path="/speed" element={<SpeedTest />} />
                  <Route path="/server-loc" element={<ServerLocation />} />
                  <Route path="/binary" element={<BinaryConverter />} />
                  <Route path="/timer" element={<TimerTool />} />
                  <Route path="/notepad" element={<Notepad />} />
                  <Route path="/calculator" element={<CalculatorTool />} />
                  <Route path="/scoreboard" element={<Scoreboard />} />
                  <Route path="/unit" element={<UnitConverter />} />
                  <Route path="/random" element={<RandomGenerator />} />
                  <Route path="/ratio" element={<AspectRatioCalculator />} />
                  <Route path="/uuid" element={<UuidGenerator />} />
                  <Route path="/case" element={<CaseConverter />} />
                  <Route path="/roulette" element={<Roulette />} />
                  <Route path="/text-conv" element={<TextConverter />} />
                  <Route path="/image-conv" element={<ImageConverter />} />
                  <Route path="/hash" element={<HashGenerator />} />
                  <Route path="/regex" element={<RegexChecker />} />
                  <Route path="/flashcards" element={<Flashcards />} />
                  <Route path="/tasks" element={<TaskManager />} />
                  <Route path="/html" element={<HtmlEditor />} />
                  <Route path="/sql" element={<SqlPlayground />} />
                  <Route path="/date" element={<DateCalculator />} />
                  <Route path="/subnet" element={<IpSubnetVisualizer />} />
                  <Route path="/palette" element={<ColorPalette />} />
                  <Route path="/json" element={<JsonFormatter />} />
                  <Route path="/markdown" element={<MarkdownEditor />} />
                  <Route path="/watermarker" element={<ImageWatermarker />} />
                  <Route path="/exif" element={<ExifRemover />} />
                  <Route path="/diff" element={<TextDiff />} />
                  <Route path="/timestamp" element={<TimestampConverter />} />
                </Routes>
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
};

const App: React.FC = () => (
  <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Layout />
  </HashRouter>
);

export default App;
