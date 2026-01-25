
import React, { useState, useEffect, createContext, useRef, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Menu, LayoutGrid, Sun, Moon, ShieldAlert } from 'lucide-react';

import LoadingSkeleton from './components/LoadingSkeleton';

// 重いコンポーネントはすべて遅延読み込み
const Sidebar = lazy(() => import('./components/Sidebar'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Settings = lazy(() => import('./components/Settings'));
const AdminPage = lazy(() => import('./components/admin/AdminPage'));

// 各ツールは個別のチャンクとして遅延読み込み
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

const AccessLogger: React.FC<{ onBlocked: (blocked: boolean) => void }> = ({ onBlocked }) => {
  const location = useLocation();
  useEffect(() => {
    const url = './backend/admin_api.php?action=log_access';
    const payload = JSON.stringify({ path: location.pathname, status: 200 });
    if (navigator.sendBeacon) navigator.sendBeacon(url, payload);
    else fetch(url, { method: 'POST', body: payload, keepalive: true });
  }, [location.pathname]);
  return null;
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
  const isAdmin = location.pathname === ADMIN_PATH;

  if (isBlocked) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-black text-2xl">Access Denied</div>;
  if (isAdmin) return <Suspense fallback={null}><AdminPage /></Suspense>;

  return (
    <AppContext.Provider value={{ showAds, setShowAds, adBlockDetected: false }}>
      <Helmet>
        <title>まいつーる - 無料Webツール集</title>
      </Helmet>
      <AccessLogger onBlocked={setIsBlocked} />
      
      {/* 画面全体のコンテナ：ここは即座に表示される */}
      <div className="flex h-screen bg-gray-50 dark:bg-dark overflow-hidden font-sans text-slate-800 dark:text-gray-100">
        
        {/* サイドバー：枠だけ先に表示し、中身(アイコン等)をSuspenseで待つ */}
        <div className="hidden lg:block w-64 bg-white dark:bg-dark-lighter border-r border-gray-200 dark:border-gray-800 shrink-0">
          <Suspense fallback={<div className="p-4 space-y-4 animate-pulse"><div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl w-full"></div><div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl w-3/4"></div></div>}>
            <Sidebar addedToolIds={addedTools} isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} onReorder={setAddedTools} />
          </Suspense>
        </div>

        {/* 右側メインエリア：即座に表示 */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white/80 dark:bg-dark-lighter/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 h-14 md:h-16 flex items-center justify-between px-4 lg:px-8 z-20">
             <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-full"><Menu size={24} /></button>
                <Link to="/" className="font-black text-lg md:text-xl flex items-center gap-2 text-blue-600 dark:text-blue-400">
                   <LayoutGrid size={22} />
                   <span>まいつーる</span>
                </Link>
             </div>
             <button onClick={toggleTheme} className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 transition-colors">
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
             </button>
          </header>

          <main ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
            <div className="max-w-7xl mx-auto h-full">
              <Suspense fallback={<LoadingSkeleton />}>
                <Routes>
                  <Route path="/" element={<Dashboard addedToolIds={addedTools} onToggleAdded={(id) => setAddedTools(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} />} />
                  <Route path="/multiview" element={<MultiToolViewer tools={[]} />} />
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

        {/* モバイル用サイドバー(ドロワー) */}
        {sidebarOpen && (
          <Suspense fallback={null}>
            <Sidebar addedToolIds={addedTools} isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} onReorder={setAddedTools} />
          </Suspense>
        )}
      </div>
    </AppContext.Provider>
  );
};

const App: React.FC = () => (
  <HashRouter>
    <Layout />
  </HashRouter>
);

export default App;
