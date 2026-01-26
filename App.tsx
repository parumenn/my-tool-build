
import React, { useState, useEffect, createContext, useRef, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Menu, LayoutGrid, Sun, Moon, ShieldCheck, Zap, Info, CheckCircle2, X, Cookie, ExternalLink, ChevronRight } from 'lucide-react';
import LoadingSkeleton from './components/LoadingSkeleton';

// 遅延読み込みコンポーネント
const SidebarContent = lazy(() => import('./components/Sidebar').then(m => ({ default: m.SidebarContent })));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Settings = lazy(() => import('./components/Settings'));
const AdminPage = lazy(() => import('./components/admin/AdminPage'));

// ツールコンポーネントのインポート
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
const BathProcrastinationPreventer = lazy(() => import('./components/tools/BathProcrastinationPreventer'));

export const AppContext = createContext({ showAds: true, setShowAds: (v: boolean) => {} });

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [addedTools, setAddedTools] = useState<string[]>(() => {
    const saved = localStorage.getItem('addedTools');
    return saved ? JSON.parse(saved) : ['qrcode', 'speed', 'kakeibo', 'count'];
  });
  const [showAds, setShowAds] = useState(true);
  const [showConsent, setShowConsent] = useState(false);
  const [isTermsChecked, setIsTermsChecked] = useState(false);
  const [showTermsDetail, setShowTermsDetail] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const isAdminPath = location.pathname === '/secure-panel-7x9v2';

  // 通信エラーを回避するため、解析を行わず非同期で送信のみを行う（バックエンド側の修正と合わせて確実にクローズ）
  useEffect(() => {
    const controller = new AbortController();
    const logAccess = async () => {
      try {
        await fetch('./backend/admin_api.php?action=log_access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: location.pathname }),
          signal: controller.signal
        });
      } catch (e) {
        // Silent
      }
    };
    logAccess();
    return () => controller.abort();
  }, [location.pathname]);

  useEffect(() => {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [location.pathname]);

  useEffect(() => {
    const consented = localStorage.getItem('maitool_consented');
    if (!consented) setShowConsent(true);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleConsent = () => {
    if (!isTermsChecked) return;
    localStorage.setItem('maitool_consented', 'true');
    setShowConsent(false);
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const isJP = (navigator.language || (navigator as any).userLanguage)?.toLowerCase().includes('ja');

  if (isAdminPath) {
    return (
      <AppContext.Provider value={{ showAds, setShowAds }}>
        <Suspense fallback={<LoadingSkeleton />}>
          <Routes><Route path="/secure-panel-7x9v2" element={<AdminPage />} /></Routes>
        </Suspense>
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={{ showAds, setShowAds }}>
      <div className="flex h-screen bg-gray-50 dark:bg-dark overflow-hidden font-sans text-slate-800 dark:text-gray-100">
        
        {/* 初回同意ポップアップ (完全復元版) */}
        {showConsent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white dark:bg-dark-lighter w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-scale-up relative">
              
              <div className="bg-blue-600 p-8 text-white text-center relative shrink-0">
                <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-xl font-black mb-1">{isJP ? 'まいつーるへようこそ' : 'Welcome to OmniTools'}</h2>
                <p className="text-blue-100 text-xs font-medium">{isJP ? 'プライバシーに配慮した便利なWebツール集' : 'Privacy-first web utility suite'}</p>
              </div>
              
              <div className="p-8 space-y-5 overflow-y-auto no-scrollbar max-h-[60vh]">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0 h-fit"><CheckCircle2 size={18} /></div>
                    <div>
                      <p className="font-black text-xs text-slate-800 dark:text-white">{isJP ? 'データはすべてブラウザ内に保存' : 'All data stays in your browser'}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                        {isJP 
                          ? '各アプリで入力されたデータはサーバーに送信・保存されることはありません。ローカル環境で動作するためご利用のブラウザに依存します。' 
                          : 'Data entered in each app is not sent to or stored on our servers. It operates locally and depends on the browser you use.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400 shrink-0 h-fit"><Zap size={18} /></div>
                    <div>
                      <p className="font-black text-xs text-slate-800 dark:text-white">{isJP ? '広告表示へのご理解' : 'Ad Support'}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                        {isJP ? '本サービスを無料で維持するため、広告を表示しています。あらかじめご了承ください。' : 'To keep this service free and sustainable, we display ads. We appreciate your understanding.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0 h-fit"><Cookie size={18} /></div>
                    <div>
                      <p className="font-black text-xs text-slate-800 dark:text-white">{isJP ? 'Cookie（クッキー）の利用' : 'Cookie Usage'}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                        {isJP ? '広告の最適化やアクセス解析のためCookieを使用します。設定はブラウザからいつでも変更可能です。' : 'We use cookies for ad optimization and analytics. You can change your settings in your browser.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-start gap-3 mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => setIsTermsChecked(!isTermsChecked)}>
                    <div className="flex items-center h-5 mt-0.5">
                      <input 
                        type="checkbox" 
                        checked={isTermsChecked}
                        onChange={(e) => setIsTermsChecked(e.target.checked)}
                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="text-xs font-bold text-gray-600 dark:text-gray-300 select-none">
                      {isJP ? (
                        <>
                          <button 
                            className="text-blue-600 dark:text-blue-400 underline hover:no-underline flex items-center gap-1"
                            onClick={(e) => { e.stopPropagation(); setShowTermsDetail(true); }}
                          >
                            利用規約・個人情報の取り扱い
                            <ExternalLink size={12} />
                          </button>
                          を読んで同意した
                        </>
                      ) : 'I have read and agree to the terms of service.'}
                    </div>
                  </div>

                  <button 
                    onClick={handleConsent}
                    disabled={!isTermsChecked}
                    className={`w-full py-4 font-black rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      isTermsChecked 
                        ? 'bg-blue-600 text-white shadow-blue-200 dark:shadow-none hover:bg-blue-700' 
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    {isJP ? '同意して利用を開始する' : 'Agree and Get Started'}
                  </button>
                  <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-bold">
                    {isJP 
                      ? '利用を開始することで、ローカルストレージおよびCookieの使用に同意したものとみなされます。' 
                      : 'By clicking, you agree to our local storage and cookie usage.'}
                  </p>
                </div>
              </div>

              {/* 利用規約詳細オーバーレイ */}
              {showTermsDetail && (
                <div className="absolute inset-0 z-[110] bg-white dark:bg-dark flex flex-col animate-fade-in">
                  <div className="flex items-center justify-between p-6 border-b dark:border-gray-800 shrink-0">
                    <h3 className="font-black text-lg">{isJP ? '利用規約・個人情報の取り扱い' : 'Terms of Service'}</h3>
                    <button onClick={() => setShowTermsDetail(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X size={20} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 text-xs md:text-sm leading-relaxed space-y-6 no-scrollbar">
                    <div>
                      <h4 className="font-black text-blue-600 mb-2">1. 取得する情報および収集方法</h4>
                      <p className="text-gray-500 dark:text-gray-400">当サイトでは、サービスの提供およびセキュリティ向上のため、以下の情報を自動的に収集します。</p>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-gray-500">
                        <li>アクセスログ: IPアドレス、ブラウザの種類、閲覧日時、遷移元URL。</li>
                        <li>Cookie（クッキー）: ユーザーの識別および利便性向上のために使用します。</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-black text-blue-600 mb-2">2. 利用目的</h4>
                      <p className="text-gray-500 dark:text-gray-400">収集した情報は、以下の目的でのみ利用します。</p>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-gray-500">
                        <li>不正アクセスの検知・防止: サーバー攻撃やスパム行為からサイトを保護するため。</li>
                        <li>サービスの維持・改善: 読み込み速度の最適化や不具合改修のため。</li>
                        <li>法令に基づく対応: 公的機関から法的な要請があった場合、法令に基づきログを開示することがあります。</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-black text-blue-600 mb-2">3. Cookieの利用同意と無効化</h4>
                      <p className="text-gray-500 dark:text-gray-400">ユーザーは、当サイトを利用することでCookieの使用に同意したものとみなされます。ブラウザの設定によりCookieを無効化できますが、一部機能が正常に動作しない可能性があります。</p>
                    </div>
                    <div>
                      <h4 className="font-black text-blue-600 mb-2">4. 禁止事項</h4>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-gray-500">
                        <li>本サイトの解析、改ざん、または修正行為。</li>
                        <li>短時間での過度な連続アクセス（DoS攻撃等）による負荷。</li>
                        <li>不正なスクリプトを実行する行為。</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-black text-blue-600 mb-2">5. 免責事項</h4>
                      <p className="text-gray-500 dark:text-gray-400">情報の正確性や通信環境に起因するトラブル、および本サイト利用による損害について、当社は一切の責任を負わないものとします。</p>
                    </div>
                  </div>
                  <div className="p-6 border-t dark:border-gray-800 shrink-0">
                    <button onClick={() => setShowTermsDetail(false)} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl">{isJP ? '戻る' : 'Back'}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-dark-lighter border-r border-gray-200 dark:border-gray-800 transition-transform lg:translate-x-0 lg:static lg:block ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
          <div className="flex h-16 items-center justify-between px-4 border-b dark:border-gray-800 bg-white dark:bg-dark-lighter shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg text-white"><LayoutGrid size={20} /></div>
              <h1 className="text-lg font-black tracking-tight">まいつーる</h1>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-gray-400">✕</button>
          </div>
          <div className="h-[calc(100vh-64px)] flex flex-col">
            <Suspense fallback={<div className="p-4 space-y-4">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800/50 rounded-xl animate-pulse" />)}</div>}>
              <SidebarContent addedToolIds={addedTools} onReorder={setAddedTools} onClose={() => setSidebarOpen(false)} />
            </Suspense>
          </div>
        </aside>

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
                  <Route path="/" element={<Dashboard addedToolIds={addedTools} onToggleAdded={(id) => setAddedTools(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} onReorder={() => {}} />} />
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
                  <Route path="/bath" element={<BathProcrastinationPreventer />} />
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
  <HashRouter><Layout /></HashRouter>
);

export default App;
