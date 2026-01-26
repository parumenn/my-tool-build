
import React, { useState, useEffect, useContext } from 'react';
import { BookOpen, Plus, Trash2, Edit2, Play, RotateCw, Check, X, ChevronLeft, ChevronRight, Info, ShieldCheck, Zap } from 'lucide-react';
import { WorkspaceContext } from '../WorkspaceContext';

interface Card { id: string; front: string; back: string; }
interface Deck { id: string; name: string; cards: Card[]; lastStudied?: string; }

const Flashcards: React.FC = () => {
  const isWorkspace = useContext(WorkspaceContext);
  const [decks, setDecks] = useState<Deck[]>(() => {
    const saved = localStorage.getItem('flashcards_data');
    return saved ? JSON.parse(saved) : [{ id: '1', name: '英単語サンプル', cards: [{id:'c1', front: 'Apple', back: 'りんご'}, {id:'c2', front: 'Cat', back: '猫'}] }];
  });
  const [view, setView] = useState<'list' | 'edit' | 'study'>('list');
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [editingDeckName, setEditingDeckName] = useState('');
  const [editingCards, setEditingCards] = useState<Card[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => { localStorage.setItem('flashcards_data', JSON.stringify(decks)); }, [decks]);

  const createDeck = () => {
    const name = prompt('新しいデッキ名を入力');
    if (name) setDecks([...decks, { id: Date.now().toString(), name, cards: [] }]);
  };

  const startStudy = (deckId: string) => {
    setActiveDeckId(deckId); setStudyIndex(0); setIsFlipped(false); setView('study');
    setDecks(prev => prev.map(d => d.id === deckId ? {...d, lastStudied: new Date().toLocaleDateString()} : d));
  };

  const currentDeck = decks.find(d => d.id === activeDeckId);

  return (
    <div className={`mx-auto h-full flex flex-col ${isWorkspace ? 'max-w-full p-2' : 'max-w-6xl space-y-10 pb-20'}`}>
      <style>{`.perspective-1000 { perspective: 1000px; } .transform-style-3d { transform-style: preserve-3d; } .backface-hidden { backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); }`}</style>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {view === 'list' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div onClick={createDeck} className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-10 border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                 <Plus className="text-blue-500 mb-2" size={32} />
                 <span className="font-bold text-gray-500">デッキを作成</span>
              </div>
              {decks.map(deck => (
                 <div key={deck.id} onClick={() => startStudy(deck.id)} className="bg-white dark:bg-dark-lighter rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow">
                    <h3 className="text-xl font-bold mb-1">{deck.name}</h3>
                    <p className="text-sm text-gray-500">{deck.cards.length}枚のカード</p>
                 </div>
              ))}
           </div>
        )}
        {view === 'study' && currentDeck && (
           <div className="max-w-md mx-auto space-y-6">
              <div className="flex justify-between items-center text-gray-500">
                 <button onClick={() => setView('list')}><X /></button>
                 <span className="font-mono">{studyIndex + 1} / {currentDeck.cards.length}</span>
              </div>
              <div className="perspective-1000 h-64 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                 <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                    <div className="absolute w-full h-full backface-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-xl flex items-center justify-center p-8 text-2xl font-bold border border-gray-100 dark:border-gray-700">
                       {currentDeck.cards[studyIndex]?.front}
                    </div>
                    <div className="absolute w-full h-full backface-hidden bg-blue-50 dark:bg-blue-900/40 rounded-3xl shadow-xl flex items-center justify-center p-8 text-2xl font-bold rotate-y-180 border border-blue-200">
                       {currentDeck.cards[studyIndex]?.back}
                    </div>
                 </div>
              </div>
              <div className="flex gap-4">
                 <button disabled={studyIndex === 0} onClick={() => {setStudyIndex(studyIndex-1); setIsFlipped(false);}} className="flex-1 py-3 bg-gray-200 rounded-xl font-bold disabled:opacity-30">戻る</button>
                 <button onClick={() => { if(studyIndex < currentDeck.cards.length-1) {setStudyIndex(studyIndex+1); setIsFlipped(false);} else setView('list'); }} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">次へ</button>
              </div>
           </div>
        )}
      </div>

      {!isWorkspace && (
        <article className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none shadow-sm">
           <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Info className="text-blue-500" />自分専用の学習環境をブラウザに</h2>
           <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              <div>
                 <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><Zap size={18} className="text-blue-500" />効率的な反復学習をサポート</h3>
                 <p>暗記カード（フラッシュカード）は、言語学習や資格試験の対策に最も効果的な手法の一つです。当ツールでは、表面に問題、裏面に答えを自由に登録し、クイズ形式で学習を進められます。シンプルな操作性で、通勤・通学中のスキマ時間を価値ある学習時間に変えましょう。</p>
              </div>
              <div>
                 <h3 className="text-gray-800 dark:text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-blue-500" />ログイン不要・永続保存</h3>
                 <p>作成したカードデータはお使いのブラウザ内（LocalStorage）に保存されます。アカウント登録の手間なく、今すぐ自分だけの単語帳を作成できます。バックアップ機能を使えば他のデバイスへの移行も簡単です。プライバシーが完全に守られた環境で、学習に集中してください。</p>
              </div>
           </div>
        </article>
      )}
    </div>
  );
};

export default Flashcards;
