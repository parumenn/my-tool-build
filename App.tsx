
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Menu, QrCode, FileText, AlignLeft, Image as ImageIcon, Binary, 
  Network, Activity, Timer, RefreshCwOff, FileDiff, Wallet, Sun, Moon, 
  LayoutGrid, Settings as SettingsIcon, Plus, Check, Grid2X2, StickyNote,
  KeyRound, Scale, Clock, Palette, FileJson, FileType, Calculator, 
  Trophy, Stamp, Dices, BoxSelect, Fingerprint, Type, Disc, ArrowRightLeft,
  ImageOff, Hash, Search, BookOpen, ListTodo, FileStack, Code, Database,
  CalendarDays, Share2, Globe
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
}>({
  showAds: true,
  setShowAds: () => {},
});

// --- Tool Definitions with Enhanced SEO Data ---
export const TOOLS: Tool[] = [
  {
    id: 'qrcode',
    name: 'QRコード生成',
    path: '/qrcode',
    description: 'URLを入力するだけで、瞬時にQRコードを作成・ダウンロードできます。',
    longDescription: '無料で使える高機能QRコード作成ツール。URL、テキストからQRコードを即座に生成し、PNG画像としてダウンロード可能。登録不要、ブラウザ完結で安全です。',
    keywords: ['QRコード作成', 'QR生成', '無料', 'ブラウザ', 'インストール不要'],
    icon: QrCode,
    color: 'text-blue-500',
    darkColor: 'text-blue-400',
  },
  {
    id: 'server-loc',
    name: 'サーバー位置情報',
    path: '/server-loc',
    description: 'ドメインやIPアドレスから、サーバーの物理的な位置（国・地域）を特定し地図上に表示します。',
    keywords: ['IPアドレス', '位置情報', '場所特定', 'ドメイン検索', 'Whois'],
    icon: Globe,
    color: 'text-indigo-500',
    darkColor: 'text-indigo-400',
  },
  {
    id: 'subnet',
    name: 'IPサブネット計算機',
    path: '/subnet',
    description: 'IPアドレスのビット可視化、ネットワーク包含判定、ホスト数計算ができるエンジニア向けツールです。',
    keywords: ['サブネット計算', 'CIDR', 'IPアドレス', 'ネットワークエンジニア', 'ビット計算'],
    icon: Network,
    color: 'text-cyan-600',
    darkColor: 'text-cyan-400',
  },
  {
    id: 'date',
    name: '日付・期間計算',
    path: '/date',
    description: '二つの日付の期間や、ある日付から数日後の日付を計算します。',
    keywords: ['日数計算', '期間計算', '日付計算', '何日前', '何日後'],
    icon: CalendarDays,
    color: 'text-indigo-600',
    darkColor: 'text-indigo-400',
  },
  {
    id: 'sql',
    name: 'オンラインSQL',
    path: '/sql',
    description: 'ブラウザ上でSQLクエリを実行・練習できるプレイグラウンドです。',
    keywords: ['SQL練習', 'SQL実行', 'データベース', '学習', 'テスト'],
    icon: Database,
    color: 'text-blue-600',
    darkColor: 'text-blue-400',
  },
  {
    id: 'flashcards',
    name: '暗記カード',
    path: '/flashcards',
    description: '単語帳やテスト勉強に。オリジナルの暗記カードを作成して学習できます。',
    keywords: ['単語帳', '暗記カード', '学習ツール', 'フラッシュカード', '勉強'],
    icon: BookOpen,
    color: 'text-blue-600',
    darkColor: 'text-blue-400',
  },
  {
    id: 'tasks',
    name: 'タスク管理',
    path: '/tasks',
    description: 'シンプルで使いやすいToDoリスト。優先度設定や完了管理が可能です。',
    keywords: ['ToDoリスト', 'タスク管理', 'やることリスト', '生産性'],
    icon: ListTodo,
    color: 'text-teal-600',
    darkColor: 'text-teal-400',
  },
  {
    id: 'pdf',
    name: 'PDFツール',
    path: '/pdf',
    description: 'PDFの結合、パスワード解除、ページ回転/削除などの簡易編集を行います。',
    keywords: ['PDF結合', 'PDF編集', 'PDFパスワード解除', 'PDF回転', '無料'],
    icon: FileStack,
    color: 'text-red-600',
    darkColor: 'text-red-400',
  },
  {
    id: 'roulette',
    name: 'ルーレット',
    path: '/roulette',
    description: '迷った時の抽選に。項目を自由に設定できるシンプルなルーレットです。',
    keywords: ['ルーレット', '抽選', 'くじ引き', '意思決定', 'ランダム'],
    icon: Disc,
    color: 'text-pink-500',
    darkColor: 'text-pink-400',
  },
  {
    id: 'password',
    name: 'パスワード生成',
    path: '/password',
    description: '履歴保存機能付き。安全で強力なランダムパスワードを生成します。',
    keywords: ['パスワード生成', '強力なパスワード', 'ランダムパスワード', 'セキュリティ'],
    icon: KeyRound,
    color: 'text-emerald-600',
    darkColor: 'text-emerald-400',
  },
  {
    id: 'text-conv',
    name: '全角・半角変換',
    path: '/text-conv',
    description: '英数字やカタカナの全角・半角を相互に一括変換します。',
    keywords: ['全角半角変換', 'テキスト変換', 'カタカナ変換', '英数字変換'],
    icon: ArrowRightLeft,
    color: 'text-indigo-500',
    darkColor: 'text-indigo-400',
  },
  {
    id: 'uuid',
    name: 'UUID生成',
    path: '/uuid',
    description: '一意の識別子(UUID v4)を瞬時に生成・コピーできる開発者向けツールです。',
    keywords: ['UUID生成', 'GUID', '識別子', 'v4', '開発ツール'],
    icon: Fingerprint,
    color: 'text-violet-500',
    darkColor: 'text-violet-400',
  },
  {
    id: 'random',
    name: 'カスタムサイコロ',
    path: '/random',
    description: '指定した範囲でランダムな数値を生成します。抽選やサイコロ代わりにも。',
    keywords: ['乱数生成', 'ランダムな数字', '抽選', 'サイコロ', 'RNG'],
    icon: Dices,
    color: 'text-rose-500',
    darkColor: 'text-rose-400',
  },
  {
    id: 'exif',
    name: 'Exif削除',
    path: '/exif',
    description: '画像の位置情報などのメタデータを削除し、プライバシーを保護します。',
    keywords: ['Exif削除', '位置情報削除', '写真メタデータ', 'プライバシー保護'],
    icon: ImageOff,
    color: 'text-red-500',
    darkColor: 'text-red-400',
  },
  {
    id: 'ratio',
    name: 'アスペクト比計算',
    path: '/ratio',
    description: '画像や動画の比率計算、リサイズ時の解像度算出に役立つツールです。',
    keywords: ['アスペクト比', '比率計算', '解像度', '16:9', '4:3'],
    icon: BoxSelect,
    color: 'text-cyan-500',
    darkColor: 'text-cyan-400',
  },
  {
    id: 'case',
    name: 'ケース変換',
    path: '/case',
    description: 'テキストをキャメルケース、スネークケース、大文字小文字などに一括変換します。',
    keywords: ['ケース変換', 'キャメルケース', 'スネークケース', '大文字小文字'],
    icon: Type,
    color: 'text-orange-500',
    darkColor: 'text-orange-400',
  },
  {
    id: 'watermark',
    name: '画像透かし合成',
    path: '/watermark',
    description: '画像に著作権表示などのテキストやロゴ画像を透かしとして合成します。',
    keywords: ['透かし', 'ウォーターマーク', '画像合成', '著作権表示'],
    icon: Stamp,
    color: 'text-sky-600',
    darkColor: 'text-sky-400',
  },
  {
    id: 'hash',
    name: 'ハッシュ生成',
    path: '/hash',
    description: 'テキストからSHA-256などのハッシュ値を生成します。',
    keywords: ['ハッシュ生成', 'SHA-256', 'MD5', '暗号化'],
    icon: Hash,
    color: 'text-slate-600',
    darkColor: 'text-slate-400',
  },
  {
    id: 'calculator',
    name: '電卓',
    path: '/calculator',
    description: '履歴機能付きの使いやすい電卓です。キーボード操作にも対応しています。',
    keywords: ['電卓', '計算機', 'オンライン電卓', '履歴付き'],
    icon: Calculator,
    color: 'text-orange-500',
    darkColor: 'text-orange-400',
  },
  {
    id: 'regex',
    name: '正規表現チェッカー',
    path: '/regex',
    description: '正規表現のテストとリアルタイムハイライト確認ができます。',
    keywords: ['正規表現', 'Regex', 'テスト', 'チェッカー'],
    icon: Search,
    color: 'text-teal-500',
    darkColor: 'text-teal-400',
  },
  {
    id: 'scoreboard',
    name: 'スコアボード',
    path: '/scoreboard',
    description: 'スポーツやゲームで使えるシンプルな得点板。タイマー機能も搭載。',
    keywords: ['スコアボード', '得点板', '点数記録', 'スポーツ'],
    icon: Trophy,
    color: 'text-amber-500',
    darkColor: 'text-amber-400',
  },
  {
    id: 'file',
    name: 'ファイル共有 (Base64)',
    path: '/file',
    description: 'ファイルをテキストデータ(Base64)に変換し、共有・復元します。',
    keywords: ['Base64変換', 'ファイル共有', 'デコード', 'エンコード'],
    icon: FileText,
    color: 'text-orange-500',
    darkColor: 'text-orange-400',
  },
  {
    id: 'json',
    name: 'JSON整形・検証',
    path: '/json',
    description: 'JSONデータの整形、圧縮、構文チェックを行います。',
    keywords: ['JSON整形', 'JSONフォーマッター', 'バリデーション', 'Pretty Print'],
    icon: FileJson,
    color: 'text-yellow-500',
    darkColor: 'text-yellow-400',
  },
  {
    id: 'markdown',
    name: 'Markdownエディタ',
    path: '/markdown',
    description: 'リアルタイムプレビュー付きのシンプルなMarkdownエディタです。',
    keywords: ['Markdownエディタ', 'マークダウン', 'プレビュー', '記述'],
    icon: FileType,
    color: 'text-slate-700',
    darkColor: 'text-slate-300',
  },
  {
    id: 'html',
    name: 'HTMLエディタ',
    path: '/html',
    description: 'リアルタイムプレビューとXSS対策を備えたセキュアなHTMLエディタです。',
    keywords: ['HTMLエディタ', 'プレビュー', 'コーディング', 'Web制作'],
    icon: Code,
    color: 'text-orange-600',
    darkColor: 'text-orange-400',
  },
  {
    id: 'color',
    name: 'カラーパレット',
    path: '/color',
    description: 'ランダムな配色パターンを生成し、HEX/RGBコードを取得できます。',
    keywords: ['カラーパレット', '配色', '色見本', 'デザイン', 'ジェネレーター'],
    icon: Palette,
    color: 'text-indigo-500',
    darkColor: 'text-indigo-400',
  },
  {
    id: 'count',
    name: '文字数カウント',
    path: '/count',
    description: 'リアルタイムで文字数や行数をカウントし、文字種別の分析グラフを表示します。',
    keywords: ['文字数カウント', '文字数チェッカー', 'レポート', '文字数制限'],
    icon: AlignLeft,
    color: 'text-green-500',
    darkColor: 'text-green-400',
  },
  {
    id: 'diff',
    name: 'テキストDiff',
    path: '/diff',
    description: '2つのテキストの差分を、行単位または単語単位で比較・ハイライトします。',
    keywords: ['テキスト比較', 'Diff', '差分チェック', '文章比較'],
    icon: FileDiff,
    color: 'text-cyan-600',
    darkColor: 'text-cyan-400',
  },
  {
    id: 'resize',
    name: '画像リサイズ',
    path: '/resize',
    description: 'ブラウザ上で画像のサイズを変更し、アスペクト比を維持して保存できます。',
    keywords: ['画像リサイズ', 'サイズ変更', '画像縮小', '解像度変更'],
    icon: ImageIcon,
    color: 'text-purple-500',
    darkColor: 'text-purple-400',
  },
  {
    id: 'convert',
    name: '画像形式変換',
    path: '/convert',
    description: '画像をPNG, JPEG, WEBP, ICO形式に相互変換します。',
    keywords: ['画像変換', 'フォーマット変換', 'PNG JPEG変換', 'WebP'],
    icon: RefreshCwOff,
    color: 'text-pink-500',
    darkColor: 'text-pink-400',
  },
  {
    id: 'kakeibo',
    name: 'まいつーる家計簿',
    path: '/kakeibo',
    description: 'カレンダー、サブスク管理、目標設定を備えた多機能な家計簿ツールです。',
    keywords: ['家計簿', '支出管理', '節約', 'カレンダー', '無料家計簿'],
    icon: Wallet,
    color: 'text-yellow-600',
    darkColor: 'text-yellow-400',
  },
  {
    id: 'notepad',
    name: 'オンラインメモ帳',
    path: '/notepad',
    description: '自動保存機能付きの多機能メモ帳です。Notionのように使えます。',
    keywords: ['メモ帳', 'オンラインメモ', 'ノート', '自動保存', 'エディタ'],
    icon: StickyNote,
    color: 'text-lime-600',
    darkColor: 'text-lime-400',
  },
  {
    id: 'unit',
    name: '単位変換',
    path: '/unit',
    description: '長さ、重さ、温度、面積などの単位を簡単に相互変換できます。',
    keywords: ['単位変換', '換算', 'メートル法', 'ヤードポンド法'],
    icon: Scale,
    color: 'text-fuchsia-500',
    darkColor: 'text-fuchsia-400',
  },
  {
    id: 'binary',
    name: '2進数変換',
    path: '/binary',
    description: '10進数と2進数を相互変換します。小数の計算にも対応しています。',
    keywords: ['2進数変換', '10進数変換', '進数計算', 'プログラミング'],
    icon: Binary,
    color: 'text-teal-500',
    darkColor: 'text-teal-400',
  },
  {
    id: 'timestamp',
    name: 'Unix時間変換',
    path: '/timestamp',
    description: 'Unix Timestampと日付形式を相互に変換します。開発者向けツールです。',
    keywords: ['UnixTime', 'タイムスタンプ変換', '日時変換', 'エポック秒'],
    icon: Clock,
    color: 'text-slate-600',
    darkColor: 'text-slate-400',
  },
  {
    id: 'ip',
    name: 'IPアドレス確認',
    path: '/ip',
    description: 'あなたの現在のグローバルIPアドレス(IPv4/IPv6)と接続情報を確認します。',
    keywords: ['IPアドレス確認', 'グローバルIP', '接続情報', 'ポート開放'],
    icon: Share2,
    color: 'text-sky-500',
    darkColor: 'text-sky-400',
  },
  {
    id: 'speed',
    name: '回線スピードテスト',
    path: '/speed',
    description: 'ダウンロード/アップロード速度を簡易計測し、ネットワーク品質をチェックします。',
    keywords: ['スピードテスト', '回線速度', 'インターネット速度', '通信速度'],
    icon: Activity,
    color: 'text-red-500',
    darkColor: 'text-red-400',
  },
  {
    id: 'timer',
    name: 'タイマー＆ストップウォッチ',
    path: '/timer',
    description: 'ポモドーロ、ラップ計測、通常タイマーを統合した時間管理ツールです。',
    keywords: ['タイマー', 'ストップウォッチ', 'ポモドーロ', '時間管理'],
    icon: Timer,
    color: 'text-rose-500',
    darkColor: 'text-rose-400',
  },
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

// --- Added Tools Management (Favorites) ---
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

// --- Enhanced SEO Component ---
const SEOMetadata = () => {
  const location = useLocation();
  const currentTool = TOOLS.find(t => t.path === location.pathname);
  
  // Base Configuration
  const siteName = 'まいつーる';
  const siteUrl = 'https://omnitools.example.com'; // REPLACE with actual domain
  const canonicalUrl = `${siteUrl}${location.pathname === '/' ? '' : location.pathname}`;
  
  // Default Metadata (Dashboard/Home)
  let title = `${siteName} - 登録不要の無料Webツール集`;
  let description = 'QRコード生成、画像変換、家計簿、PDF編集など、インストール不要で使える便利な無料Webツールスイート。PC・スマホ対応で、ブラウザからすぐ利用できます。';
  let keywords = 'Webツール, 便利ツール, 無料アプリ, QRコード作成, 家計簿, 画像編集, PDF結合, インストール不要';
  let jsonLdType = 'CollectionPage';
  
  // Tool Specific Metadata
  if (currentTool) {
    // Title format: Tool Name - Action/Keywords | App Name
    title = `${currentTool.name} - ${currentTool.keywords?.[0] || '無料Webツール'} | ${siteName}`;
    description = currentTool.longDescription || currentTool.description;
    keywords = currentTool.keywords ? currentTool.keywords.join(', ') : keywords;
    jsonLdType = 'SoftwareApplication';
  } else if (location.pathname === '/multiview') {
    title = `ワークスペース - マルチタスク作業 | ${siteName}`;
    description = '複数のツールを1画面で同時に起動して効率的に作業できるワークスペース機能。電卓、メモ、タイマーなどを組み合わせて利用できます。';
    keywords = 'マルチタスク, ワークスペース, 分割画面, 作業効率化';
  } else if (location.pathname === '/settings') {
    title = `設定 - バックアップ・復元 | ${siteName}`;
    description = 'まいつーるの表示設定やデータのバックアップ・復元を行います。データはすべてブラウザ内に保存されます。';
  }

  // Structured Data Construction
  const structuredData = currentTool ? {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": currentTool.name,
    "url": canonicalUrl,
    "description": description,
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "JPY"
    },
    "featureList": currentTool.keywords?.join(', ')
  } : {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": siteName,
    "url": siteUrl,
    "description": description,
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "JPY"
    }
  };

  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteName} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

// --- Logger Component ---
const AccessLogger: React.FC = () => {
  const location = useLocation();
  const loggedRef = React.useRef<string | null>(null);

  useEffect(() => {
    // Prevent duplicate logs for the same path in rapid succession or strict mode
    if (loggedRef.current === location.pathname) return;
    loggedRef.current = location.pathname;

    const logAccess = async () => {
        try {
            await fetch('./backend/admin_api.php?action=log_access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: location.pathname })
            });
        } catch (e) {
            // silent fail
        }
    };
    logAccess();
  }, [location.pathname]);

  return null;
};

// --- Layout & Main Component ---
const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { addedTools, toggleAddedTool, reorderAddedTools } = useAddedTools();
  const location = useLocation();

  // App Global State
  const [showAds, setShowAds] = useState(() => localStorage.getItem('showAds') !== 'false');

  useEffect(() => {
    localStorage.setItem('showAds', String(showAds));
    
    // Dynamically Load Google AdSense Script if ads are enabled
    if (showAds) {
      const scriptId = 'adsense-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8961158026153736";
        script.async = true;
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);
      }
    }
  }, [showAds]);

  const currentTool = TOOLS.find(t => t.path === location.pathname);
  const isMultiview = location.pathname === '/multiview';
  const isAdmin = location.pathname === ADMIN_PATH;
  
  // Sidebar items based on addedTools order
  const sidebarTools = addedTools
    .map(id => TOOLS.find(t => t.id === id))
    .filter((t): t is Tool => t !== undefined);

  if (isAdmin) {
    return <AdminPage />;
  }

  return (
    <AppContext.Provider value={{ showAds, setShowAds }}>
      {/* Dynamic SEO Injection */}
      <SEOMetadata />
      <AccessLogger />

      <div className="flex h-screen bg-gray-50 dark:bg-dark overflow-hidden font-sans text-slate-800 dark:text-gray-100 transition-colors duration-300">
        <Sidebar 
          tools={sidebarTools} 
          isOpen={sidebarOpen} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onReorder={reorderAddedTools}
        />

        <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
          {/* Header */}
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
              
              {/* Mobile Title (Simplified with Menu Button) */}
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

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth relative">
            {/* Added padding-bottom for mobile nav visibility */}
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

              {/* Ad Banner */}
              {showAds && !isAdmin && <div className="mt-12"><AdBanner /></div>}
            </div>
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout />
    </HashRouter>
  );
};

export default App;
