
import React, { useState, useEffect, createContext, useRef, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Menu, LayoutGrid, Sun, Moon } from 'lucide-react';
import LoadingSkeleton from './components/LoadingSkeleton';

// 重いコンポーネントの遅延読み込みを徹底
const SidebarContent = lazy(() => import('./components/Sidebar').then(m => ({ default: m.SidebarContent })));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Settings = lazy(() => import('./components/Settings'));

// ツールコンポーネントの定義（これらは各URLにアクセスした時だけダウンロードされる）
const QRCodeGenerator = lazy(() => import('./components/tools/QRCodeGenerator'));
const CharacterCounter = lazy(() => import('./components/tools/CharacterCounter'));
const ColorPickerTool = lazy(() => import('./components/tools/ColorPickerTool'));
const PasswordGenerator = lazy(() => import('./components/tools/PasswordGenerator'));
const Kakeibo = lazy(() => import('./components/tools/Kakeibo'));
const PdfTools = lazy(() => import('./components/tools/PdfTools'));
const ImageResizer = lazy(() => import('./components/tools/ImageResizer'));
const FileConverter = lazy(() => import('./components/tools/FileConverter'));
const IpChecker = lazy(() => import('./components/tools/IpChecker'));
const SpeedTest = lazy(() => import('./components/tools/SpeedTest'));
const ServerLocation = lazy(() => import('./components/tools/ServerLocation'));
const BinaryConverter = lazy(() => import('./components/tools/BinaryConverter'));
const TimerTool = lazy(() => import('./components/tools/TimerTool'));
const Notepad = lazy(() => import('./components/tools/Notepad'));
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

export const AppContext = createContext({ showAds: true, setShowAds: (v: boolean) => {} });

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [addedTools, setAddedTools] = useState<string[]>(() => {
    const saved = localStorage.getItem('addedTools');
    return saved ? JSON.parse(saved) : ['kakeibo', 'count', 'qrcode'];
  });
  const [showAds, setShowAds] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <AppContext.Provider value={{ showAds, setShowAds }}>
      <div className="flex h-screen bg-gray-50 dark:bg-dark overflow-hidden font-sans text-slate-800 dark:text-gray-100">
        
        {/* サイドバーの「外枠」: プログラムのロードを待たずに即座に描画 */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-dark-lighter border-r border-gray-200 dark:border-gray-800 transition-transform lg:translate-x-0 lg:static lg:block
          ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}>
          <div className="flex h-16 items-center justify-between px-4 border-b dark:border-gray-800 bg-white dark:bg-dark-lighter shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg text-white"><LayoutGrid size={20} /></div>
              <h1 className="text-lg font-black tracking-tight">まいつーる</h1>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-gray-400">✕</button>
          </div>
          
          <div className="h-[calc(100vh-64px)] flex flex-col">
            <Suspense fallback={
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800/50 rounded-xl animate-pulse" />)}
              </div>
            }>
              <SidebarContent addedToolIds={addedTools} onReorder={setAddedTools} onClose={() => setSidebarOpen(false)} />
            </Suspense>
          </div>
        </aside>

        {/* メインエリア */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white/80 dark:bg-dark-lighter/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 h-14 md:h-16 flex items-center justify-between px-4 lg:px-8 z-20 shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-full"><Menu size={24} /></button>
              <Link to="/" className="font-black text-lg md:text-xl flex items-center gap-2 text-blue-600 dark:text-blue-400"><LayoutGrid className="hidden sm:block" size={22} /><span>まいつーる</span></Link>
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
