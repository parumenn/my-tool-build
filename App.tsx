
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { 
  Menu, QrCode, FileText, AlignLeft, Image as ImageIcon, Binary, 
  Network, Activity, Timer, RefreshCwOff, FileDiff, Wallet, Sun, Moon, 
  LayoutGrid, Settings as SettingsIcon, Plus, Check, Grid2X2, StickyNote,
  KeyRound, Scale, Clock, Palette, FileJson, FileType, Calculator, 
  Trophy, Stamp, Dices, BoxSelect, Fingerprint, Type, Disc, ArrowRightLeft,
  ImageOff, Hash, Search, BookOpen, ListTodo, FileStack, Code, Database,
  CalendarDays, Share2, Globe, Shield, X, AlertCircle
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import AdBanner from './components/AdBanner';
import AdminPage from './components/admin/AdminPage';

// Tools
import QRCodeGenerator from './components/tools/QRCodeGenerator';
import FileConverter from './components/tools/FileConverter';
import CharacterCounter from './components/tools/CharacterCounter';
import ImageResizer from './components/tools/ImageResizer';
import BinaryConverter from './components/tools/BinaryConverter';
import IpChecker from './components/tools/IpChecker';
import SpeedTest from './components/tools/SpeedTest';
import TimerTool from './components/tools/TimerTool';
import ImageConverter from './components/tools/ImageConverter';
import TextDiff from './components/tools/TextDiff';
import Kakeibo from './components/tools/Kakeibo';
import Notepad from './components/tools/Notepad';
import MultiToolViewer from './components/tools/MultiToolViewer';
import PasswordGenerator from './components/tools/PasswordGenerator';
import UnitConverter from './components/tools/UnitConverter';
import TimestampConverter from './components/tools/TimestampConverter';
import ColorPalette from './components/tools/ColorPalette';
import JsonFormatter from './components/tools/JsonFormatter';
import MarkdownEditor from './components/tools/MarkdownEditor';
import ImageWatermarker from './components/tools/ImageWatermarker';
import CalculatorTool from './components/tools/CalculatorTool';
import Scoreboard from './components/tools/Scoreboard';
import RandomGenerator from './components/tools/RandomGenerator';
import AspectRatioCalculator from './components/tools/AspectRatioCalculator';
import UuidGenerator from './components/tools/UuidGenerator';
import CaseConverter from './components/tools/CaseConverter';
import Roulette from './components/tools/Roulette';
import TextConverter from './components/tools/TextConverter';
import ExifRemover from './components/tools/ExifRemover';
import HashGenerator from './components/tools/HashGenerator';
import RegexChecker from './components/tools/RegexChecker';
import Flashcards from './components/tools/Flashcards';
import TaskManager from './components/tools/TaskManager';
import PdfTools from './components/tools/PdfTools';
import HtmlEditor from './components/tools/HtmlEditor';
import SqlPlayground from './components/tools/SqlPlayground';
import DateCalculator from './components/tools/DateCalculator';
import IpSubnetVisualizer from './components/tools/IpSubnetVisualizer';
import ServerLocation from './components/tools/ServerLocation';
import { Tool } from './types';

// Admin Path Configuration
const ADMIN_PATH = '/secure-panel-7x9v2';

// --- Global Contexts ---
export const AppContext = createContext<{
  showAds: boolean;
  setShowAds: (v: boolean) => void;
  adBlockDetected: boolean;
}>({
  showAds: true,
  setShowAds: () => {},
  adBlockDetected: false,
});

// --- Tool Definitions ---
export const TOOLS: Tool[] = [
  { id: 'qrcode', name: 'QRコード生成', path: '/qrcode', description: 'URLを入力するだけで、瞬時にQRコードを作成・ダウンロードできます。', icon: QrCode, color: 'text-blue-500', darkColor: 'text-blue-400' },
  { id: 'server-loc', name: 'サーバー位置情報', path: '/server-loc', description: 'ドメインやIPアドレスから、サーバーの物理的な位置（国・地域）を特定し地図上に表示します。', icon: Globe, color: 'text-indigo-500', darkColor: 'text-indigo-400' },
  { id: 'subnet', name: 'IPサブネット計算機', path: '/subnet', description: 'IPアドレスのビット可視化、ネットワーク包含判定、ホスト数計算ができるエンジニア向けツールです。', icon: Network, color: 'text-cyan-600', darkColor: 'text-cyan-400' },
  { id: 'date', name: '日付・期間計算', path: '/date', description: '二つの日付の期間や、ある日付から数日後の日付を計算します。', icon: CalendarDays, color: 'text-indigo-600', darkColor: 'text-indigo-400' },
  { id: 'sql', name: 'オンラインSQL', path: '/sql', description: 'ブラウザ上でSQLクエリを実行・練習できるプレイグラウンドです。', icon: Database, color: 'text-blue-600', darkColor: 'text-blue-400' },
  { id: 'flashcards', name: '暗記カード', path: '/flashcards', description: '単語帳やテスト勉強に。オリジナルの暗記カードを作成して学習できます。', icon: BookOpen, color: 'text-blue-600', darkColor: 'text-blue-400' },
  { id: 'tasks', name: 'タスク管理', path: '/tasks', description: 'シンプルで使いやすいToDoリスト。優先度設定や完了管理が可能です。', icon: ListTodo, color: 'text-teal-600', darkColor: 'text-teal-400' },
  { id: 'pdf', name: 'PDFツール', path: '/pdf', description: 'PDFの結合、パスワード解除、ページ回転/削除などの簡易編集を行います。', icon: FileStack, color: 'text-red-600', darkColor: 'text-red-400' },
  { id: 'roulette', name: 'ルーレット', path: '/roulette', description: '迷った時の抽選に。項目を自由に設定できるシンプルなルーレットです。', icon: Disc, color: 'text-pink-500', darkColor: 'text-pink-400' },
  { id: 'password', name: 'パスワード生成', path: '/password', description: '履歴保存機能付き。安全で強力なランダムパスワードを生成します。', icon: KeyRound, color: 'text-emerald-600', darkColor: 'text-emerald-400' },
  { id: 'text-conv', name: '全角・半角変換', path: '/text-conv', description: '英数字やカタカナの全角・半角を相互に一括変換します。', icon: ArrowRightLeft, color: 'text-indigo-500', darkColor: 'text-indigo-400' },
  { id: 'uuid', name: 'UUID生成', path: '/uuid', description: '一意の識別子(UUID v4)を瞬時に生成・コピーできる開発者向けツールです。', icon: Fingerprint, color: 'text-violet-500', darkColor: 'text-violet-400' },
  { id: 'random', name: 'カスタムサイコロ', path: '/random', description: '指定した範囲でランダムな数値を生成します。抽選やサイコロ代わりにも。', icon: Dices, color: 'text-rose-500', darkColor: 'text-rose-400' },
  { id: 'exif', name: 'Exif削除', path: '/exif', description: '画像の位置情報などのメタデータを削除し、プライバシーを保護します。', icon: ImageOff, color: 'text-red-500', darkColor: 'text-red-400' },
  { id: 'ratio', name: 'アスペクト比計算', path: '/ratio', description: '画像や動画の比率計算、リサイズ時の解像度算出に役立つツールです。', icon: BoxSelect, color: 'text-cyan-500', darkColor: 'text-cyan-400' },
  { id: 'case', name: 'ケース変換', path: '/case', description: 'テキストをキャメルケース、スネークケース、大文字小文字などに一括変換します。', icon: Type, color: 'text-orange-500', darkColor: 'text-orange-400' },
  { id: 'watermark', name: '画像透かし合成', path: '/watermark', description: '画像に著作権表示などのテキストやロゴ画像を透かしとして合成します。', icon: Stamp, color: 'text-sky-600', darkColor: 'text-sky-400' },
  { id: 'hash', name: 'ハッシュ生成', path: '/hash', description: 'テキストからSHA-256などのハッシュ値を生成します。', icon: Hash, color: 'text-slate-600', darkColor: 'text-slate-400' },
  { id: 'calculator', name: '電卓', path: '/calculator', description: '履歴機能付きの使いやすい電卓です。キーボード操作にも対応しています。', icon: Calculator, color: 'text-orange-500', darkColor: 'text-orange-400' },
  { id: 'regex', name: '正規表現チェッカー', path: '/regex', description: '正規表現のテストとリアルタイムハイライト確認ができます。', icon: Search, color: 'text-teal-500', darkColor: 'text-teal-400' },
  { id: 'scoreboard', name: 'スコアボード', path: '/scoreboard', description: 'スポーツやゲームで使えるシンプルな得点板。タイマー機能も搭載。', icon: Trophy, color: 'text-amber-500', darkColor: 'text-amber-400' },
  { id: 'file', name: 'ファイル共有 (Base64)', path: '/file', description: 'ファイルをテキストデータ(Base64)に変換し、共有・復元します。', icon: FileText, color: 'text-orange-500', darkColor: 'text-orange-400' },
  { id: 'json', name: 'JSON整形・検証', path: '/json', description: 'JSONデータの整形、圧縮、構文チェックを行います。', icon: FileJson, color: 'text-yellow-500', darkColor: 'text-yellow-400' },
  { id: 'markdown', name: 'Markdownエディタ', path: '/markdown', description: 'リアルタイムプレビュー付きのシンプルなMarkdownエディタです。', icon: FileType, color: 'text-slate-700', darkColor: 'text-slate-300' },
  { id: 'html', name: 'HTMLエディタ', path: '/html', description: 'リアルタイムプレビューとXSS対策を備えたセキュアなHTMLエディタです。', icon: Code, color: 'text-orange-600', darkColor: 'text-orange-400' },
  { id: 'color', name: 'カラーパレット', path: '/color', description: 'ランダムな配色パターンを生成し、HEX/RGBコードを取得できます。', icon: Palette, color: 'text-indigo-500', darkColor: 'text-indigo-400' },
  { id: 'count', name: '文字数カウント', path: '/count', description: 'リアルタイムで文字数や行数をカウントし、文字種別の分析グラフを表示します。', icon: AlignLeft, color: 'text-green-500', darkColor: 'text-green-400' },
  { id: 'diff', name: 'テキストDiff', path: '/diff', description: '2つのテキストの差分を、行単位または単語単位で比較・ハイライトします。', icon: FileDiff, color: 'text-cyan-600', darkColor: 'text-cyan-400' },
  { id: 'resize', name: '画像リサイズ', path: '/resize', description: 'ブラウザ上で画像のサイズを変更し、アスペクト比を維持して保存できます。', icon: ImageIcon, color: 'text-purple-500', darkColor: 'text-purple-400' },
  { id: 'convert', name: '画像形式変換', path: '/convert', description: '画像をPNG, JPEG, WEBP, ICO形式に相互変換します。', icon: RefreshCwOff, color: 'text-pink-500', darkColor: 'text-pink-400' },
  { id: 'kakeibo', name: 'まいつーる家計簿', path: '/kakeibo', description: 'カレンダー、サブスク管理、目標設定を備えた多機能な家計簿ツールです。', icon: Wallet, color: 'text-yellow-600', darkColor: 'text-yellow-400' },
  { id: 'notepad', name: 'オンラインメモ帳', path: '/notepad', description: '自動保存機能付きの多機能メモ帳です。Notionのように使えます。', icon: StickyNote, color: 'text-lime-600', darkColor: 'text-lime-400' },
  { id: 'unit', name: '単位変換', path: '/unit', description: '長さ、重さ、温度、面積などの単位を簡単に相互変換できます。', icon: Scale, color: 'text-fuchsia-500', darkColor: 'text-fuchsia-400' },
  { id: 'binary', name: '2進数変換', path: '/binary', description: '10進数と2進数を相互変換します。小数の計算にも対応しています。', icon: Binary, color: 'text-teal-500', darkColor: 'text-teal-400' },
  { id: 'timestamp', name: 'Unix時間変換', path: '/timestamp', description: 'Unix Timestampと日付形式を相互に変換します。開発者向けツールです。', icon: Clock, color: 'text-slate-600', darkColor: 'text-slate-400' },
  { id: 'ip', name: 'IPアドレス確認', path: '/ip', description: 'あなたの現在のグローバルIPアドレス(IPv4/IPv6)と接続情報を確認します。', icon: Share2, color: 'text-sky-500', darkColor: 'text-sky-400' },
  { id: 'speed', name: '回線スピードテスト', path: '/speed', description: 'ダウンロード/アップロード速度を簡易計測し、ネットワーク品質をチェックします。', icon: Activity, color: 'text-red-500', darkColor: 'text-red-400' },
  { id: 'timer', name: 'タイマー＆ストップウォッチ', path: '/timer', description: 'ポモドーロ、ラップ計測、通常タイマーを統合した時間管理ツールです。', icon: Timer, color: 'text-rose-500', darkColor: 'text-rose-400' },
];

// --- Theme Management ---
const useTheme = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  return { theme, toggleTheme };
};

// --- Added Tools Management ---
const useAddedTools = () => {
  const [addedTools, setAddedTools] = useState<string[]>(() => {
    const saved = localStorage.getItem('addedTools');
    return saved ? JSON.parse(saved) : ['kakeibo', 'timer', 'notepad'];
  });

  useEffect(() => {
    localStorage.setItem('addedTools', JSON.stringify(addedTools));
  }, [addedTools]);

  const toggleAddedTool = (id: string) => {
    setAddedTools(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const reorderAddedTools = (newOrder: string[]) => {
    setAddedTools(newOrder);
  };

  return { addedTools, toggleAddedTool, reorderAddedTools };
};

// --- Logger Component ---
const AccessLogger: React.FC = () => {
  const location = useLocation();
  const loggedRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (loggedRef.current === location.pathname) return;
    loggedRef.current = location.pathname;

    const logAccess = async () => {
        try {
            // Basic performance metric (not perfect for SPA client navigation but good for initial load)
            const loadTime = performance.now();
            
            await fetch('./backend/admin_api.php?action=log_access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    path: location.pathname,
                    referer: document.referrer,
                    status: 200, // Client side view is success by default
                    load_time: loadTime
                })
            });
        } catch (e) {
            // silent fail
        }
    };
    logAccess();
  }, [location.pathname]);

  return null;
};

// --- Terms of Service Modal ---
const TermsModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const agreed = localStorage.getItem('tos_agreed');
    if (!agreed) {
      setIsOpen(true);
    }
  }, []);

  const handleAgree = () => {
    localStorage.setItem('tos_agreed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Shield className="text-blue-500" />
            利用規約および個人情報の取り扱いについて
          </h2>
        </div>
        
        <div className="p-6 overflow-y-auto text-sm text-gray-600 dark:text-gray-300 space-y-6 leading-relaxed">
          <section>
            <h3 className="font-bold text-gray-800 dark:text-white mb-2">1. 取得する情報および収集方法</h3>
            <p>当サイトでは、サービスの提供およびセキュリティ向上のため、以下の情報を自動的に収集します。</p>
            <ul className="list-disc list-inside mt-1 ml-2 text-xs text-gray-500 dark:text-gray-400">
              <li>アクセスログ: IPアドレス、ブラウザの種類（User Agent）、閲覧日時、遷移元URL。</li>
              <li>Cookie（クッキー）: ユーザーの識別および利便性向上のために使用します。</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 dark:text-white mb-2">2. 利用目的</h3>
            <p>収集した情報は、以下の目的でのみ利用します。</p>
            <ul className="list-disc list-inside mt-1 ml-2 text-xs text-gray-500 dark:text-gray-400">
              <li>不正アクセスの検知・防止: サーバー攻撃、スパム行為、およびその他の不正行為からサイトを保護するため。</li>
              <li>サービスの維持・改善: ページの読み込み速度の最適化、コンテンツの質向上、および不具合改修のため。</li>
              <li>法令に基づく対応: 警察、裁判所、またはその他の公的機関から法的な要請があった場合、法令に基づきログを開示することがあります。</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 dark:text-white mb-2">3. Cookieの利用同意と無効化</h3>
            <p>ユーザーは、当サイトを利用することでCookieの使用に同意したものとみなされます。ユーザーはブラウザの設定によりCookieを無効化できます。ただし、Cookieを無効にした場合、当サイトの一部機能が正常に動作しない可能性があり、これによって生じた不便や損害について、当サイトは一切の責任を負いません。</p>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 dark:text-white mb-2">4. 禁止事項</h3>
            <p>ユーザーは、当サイトの利用にあたり、以下の行為を行ってはなりません。</p>
            <ul className="list-disc list-inside mt-1 ml-2 text-xs text-gray-500 dark:text-gray-400">
              <li>本サイトの解析（逆コンパイル、逆アセンブル等）、改ざん、または修正行為。</li>
              <li>短時間での過度な連続アクセス（DoS攻撃等）、サーバーへの過度な負荷をかける行為。</li>
              <li>サイトの脆弱性を突く行為や、不正なスクリプトを実行する行為。</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 dark:text-white mb-2">5. 免責事項</h3>
            <p>当サイトの利用に関して、以下の事項について当サイトは一切の責任を負いません。</p>
            <ul className="list-disc list-inside mt-1 ml-2 text-xs text-gray-500 dark:text-gray-400">
              <li>情報の正確性: ログの記録や提供する情報に万一漏れや誤りがあった場合でも、それにより生じた損害。</li>
              <li>通信環境: ユーザー側の通信機器、ソフトウェア、または通信回線の不備に起因するトラブル。</li>
              <li>包括的免責: その他、本サイトの利用を通じてユーザーまたは第三者が被ったいかなる損害（直接的・間接的を問いません）についてもき、一切の賠償責任を負わないものとします。</li>
            </ul>
          </section>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end">
          <button 
            onClick={handleAgree}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95"
          >
            同意して利用する
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Layout & Main Component ---
const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { addedTools, toggleAddedTool, reorderAddedTools } = useAddedTools();
  const location = useLocation();

  // App Global State
  const [showAds, setShowAds] = useState(() => localStorage.getItem('showAds') !== 'false');
  const [adBlockDetected, setAdBlockDetected] = useState(false);

  useEffect(() => {
    localStorage.setItem('showAds', String(showAds));
    
    // Dynamically Load Google AdSense Script if ads are enabled
    if (showAds && !adBlockDetected) {
      const scriptId = 'adsense-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8961158026153736";
        script.async = true;
        script.crossOrigin = "anonymous";
        script.onerror = () => {
            console.log("AdSense script failed to load (likely blocked by AdBlock). Disabling ads for this session.");
            setAdBlockDetected(true);
        };
        document.head.appendChild(script);
      }
    }
  }, [showAds, adBlockDetected]);

  const currentTool = TOOLS.find(t => t.path === location.pathname);
  const isMultiview = location.pathname === '/multiview';
  const isAdmin = location.pathname === ADMIN_PATH;
  
  const sidebarTools = addedTools
    .map(id => TOOLS.find(t => t.id === id))
    .filter((t): t is Tool => t !== undefined);

  if (isAdmin) {
    return <AdminPage />;
  }

  return (
    <AppContext.Provider value={{ showAds, setShowAds, adBlockDetected }}>
      <TermsModal />
      <AccessLogger />
      
      <div className="flex h-screen bg-gray-50 dark:bg-dark overflow-hidden font-sans text-slate-800 dark:text-gray-100 transition-colors duration-300">
        <Sidebar 
          tools={sidebarTools} 
          isOpen={sidebarOpen} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onReorder={reorderAddedTools}
        />

        <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
          <header className="bg-white/80 dark:bg-dark-lighter/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 h-14 md:h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="text-sm breadcrumbs text-gray-500 dark:text-gray-400 hidden lg:flex items-center">
                <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">まいつーる</span>
                {isMultiview ? (
                   <>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Grid2X2 size={16} />
                        ワークスペース
                    </span>
                   </>
                ) : currentTool ? (
                  <>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <currentTool.icon size={16} />
                        {currentTool.name}
                    </span>
                  </>
                ) : location.pathname === '/settings' ? (
                  <>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-gray-800 dark:text-gray-100">設定</span>
                  </>
                ) : null}
              </div>
              <div className="lg:hidden font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <button 
                    onClick={() => setSidebarOpen(true)}
                    className="mr-1 p-1 -ml-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Menu size={24} />
                  </button>
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="text-blue-500" size={20} />
                    まいつーる
                  </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="ダークモード切替"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth relative">
            <div className="max-w-7xl mx-auto h-full pb-24 lg:pb-32">
              <Routes>
                <Route path="/" element={<Dashboard tools={TOOLS} addedTools={addedTools} onToggleAdded={toggleAddedTool} onReorder={reorderAddedTools} />} />
                <Route path={ADMIN_PATH} element={<AdminPage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/qrcode" element={<QRCodeGenerator />} />
                <Route path="/password" element={<PasswordGenerator />} />
                <Route path="/file" element={<FileConverter />} />
                <Route path="/count" element={<CharacterCounter />} />
                <Route path="/resize" element={<ImageResizer />} />
                <Route path="/binary" element={<BinaryConverter />} />
                <Route path="/unit" element={<UnitConverter />} />
                <Route path="/timestamp" element={<TimestampConverter />} />
                <Route path="/ip" element={<IpChecker />} />
                <Route path="/speed" element={<SpeedTest />} />
                <Route path="/timer" element={<TimerTool />} />
                <Route path="/convert" element={<ImageConverter />} />
                <Route path="/diff" element={<TextDiff />} />
                <Route path="/kakeibo" element={<Kakeibo />} />
                <Route path="/notepad" element={<Notepad />} />
                <Route path="/multiview" element={<MultiToolViewer tools={TOOLS} />} />
                <Route path="/color" element={<ColorPalette />} />
                <Route path="/json" element={<JsonFormatter />} />
                <Route path="/markdown" element={<MarkdownEditor />} />
                <Route path="/html" element={<HtmlEditor />} />
                <Route path="/sql" element={<SqlPlayground />} />
                <Route path="/watermark" element={<ImageWatermarker />} />
                <Route path="/calculator" element={<CalculatorTool />} />
                <Route path="/scoreboard" element={<Scoreboard />} />
                <Route path="/random" element={<RandomGenerator />} />
                <Route path="/ratio" element={<AspectRatioCalculator />} />
                <Route path="/uuid" element={<UuidGenerator />} />
                <Route path="/case" element={<CaseConverter />} />
                <Route path="/roulette" element={<Roulette />} />
                <Route path="/text-conv" element={<TextConverter />} />
                <Route path="/exif" element={<ExifRemover />} />
                <Route path="/hash" element={<HashGenerator />} />
                <Route path="/regex" element={<RegexChecker />} />
                <Route path="/flashcards" element={<Flashcards />} />
                <Route path="/tasks" element={<TaskManager />} />
                <Route path="/pdf" element={<PdfTools />} />
                <Route path="/date" element={<DateCalculator />} />
                <Route path="/subnet" element={<IpSubnetVisualizer />} />
                <Route path="/server-loc" element={<ServerLocation />} />
              </Routes>
              {showAds && !isAdmin && !adBlockDetected && <div className="mt-12"><AdBanner /></div>}
            </div>
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
};

const App: React.FC = () => {
  return (
    <HelmetProvider>
        <HashRouter>
            <Layout />
        </HashRouter>
    </HelmetProvider>
  );
};

export default App;
