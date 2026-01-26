import React, { useState, useEffect, useContext } from 'react';
import { BookOpen, Plus, Trash2, Edit2, Play, RotateCw, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { WorkspaceContext } from '../WorkspaceContext';

interface Card {
  id: string;
  front: string;
  back: string;
}

interface Deck {
  id: string;
  name: string;
  cards: Card[];
  lastStudied?: string;
}

const Flashcards: React.FC = () => {
  const isWorkspace = useContext(WorkspaceContext);
  const [decks, setDecks] = useState<Deck[]>(() => {
    const saved = localStorage.getItem('flashcards_data');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: '英単語', cards: [{id:'c1', front: 'Apple', back: 'りんご'}, {id:'c2', front: 'Dog', back: '犬'}] }
    ];
  });
  
  const [view, setView] = useState<'list' | 'edit' | 'study'>('list');
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  
  // Edit Mode State
  const [editingDeckName, setEditingDeckName] = useState('');
  const [editingCards, setEditingCards] = useState<Card[]>([]);

  // Study Mode State
  const [studyIndex, setStudyIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    localStorage.setItem('flashcards_data', JSON.stringify(decks));
  }, [decks]);

  const createDeck = () => {
    const name = prompt('新しいデッキ名を入力してください');
    if (name) {
      setDecks([...decks, { id: Date.now().toString(), name, cards: [] }]);
    }
  };

  const deleteDeck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('このデッキを削除してもよろしいですか？')) {
      setDecks(decks.filter(d => d.id !== id));
    }
  };

  const startEdit = (deck: Deck, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDeckId(deck.id);
    setEditingDeckName(deck.name);
    setEditingCards([...deck.cards]);
    setView('edit');
  };

  const saveEdit = () => {
    setDecks(decks.map(d => d.id === activeDeckId ? { ...d, name: editingDeckName, cards: editingCards } : d));
    setView('list');
  };

  const addCard = () => {
    setEditingCards([...editingCards, { id: Date.now().toString(), front: '', back: '' }]);
  };

  const updateCard = (index: number, field: 'front' | 'back', value: string) => {
    const newCards = [...editingCards];
    newCards[index] = { ...newCards[index], [field]: value };
    setEditingCards(newCards);
  };

  const removeCard = (index: number) => {
    setEditingCards(editingCards.filter((_, i) => i !== index));
  };

  const startStudy = (deckId: string) => {
    setActiveDeckId(deckId);
    setStudyIndex(0);
    setIsFlipped(false);
    setView('study');
    
    // Update last studied
    setDecks(prev => prev.map(d => d.id === deckId ? {...d, lastStudied: new Date().toLocaleDateString()} : d));
  };

  const currentDeck = decks.find(d => d.id === activeDeckId);

  // --- Views ---

  const ListView = () => (
    <div className={`grid gap-4 ${isWorkspace ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
      <div 
        onClick={createDeck}
        className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[150px] group"
      >
        <div className="p-3 bg-white dark:bg-gray-600 rounded-full mb-2 shadow-sm group-hover:scale-110 transition-transform">
           <Plus size={24} className="text-blue-500 dark:text-blue-300" />
        </div>
        <span className="font-bold text-gray-600 dark:text-gray-300 text-sm">新規作成</span>
      </div>

      {decks.map(deck => (
        <div key={deck.id} onClick={() => startStudy(deck.id)} className="bg-white dark:bg-dark-lighter rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer relative group flex flex-col justify-between min-h-[150px]">
           <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">{deck.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{deck.cards.length} 枚のカード</p>
              {deck.lastStudied && <p className="text-[10px] text-blue-500 mt-2">最終学習: {deck.lastStudied}</p>}
           </div>
           
           <div className="flex gap-2 justify-end mt-2">
              <button onClick={(e) => startEdit(deck, e)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                <Edit2 size={16} />
              </button>
              <button onClick={(e) => deleteDeck(deck.id, e)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <Trash2 size={16} />
              </button>
           </div>
        </div>
      ))}
    </div>
  );

  const EditView = () => (
    <div className={`bg-white dark:bg-dark-lighter rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full ${isWorkspace ? 'p-3' : 'p-6'}`}>
       <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2 shrink-0">
          <button onClick={() => setView('list')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
             <ChevronLeft size={20} />
          </button>
          <input 
            type="text" 
            value={editingDeckName} 
            onChange={(e) => setEditingDeckName(e.target.value)}
            className="text-xl font-bold bg-transparent border-none focus:ring-0 text-gray-800 dark:text-white w-full"
            placeholder="デッキ名"
          />
          <button onClick={saveEdit} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm whitespace-nowrap">
             <Check size={16} /> 保存
          </button>
       </div>

       <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {editingCards.map((card, index) => (
             <div key={card.id} className="flex gap-2 items-start bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
                <div className="flex-1 space-y-1">
                   <div className="text-[10px] font-bold text-gray-400">表面</div>
                   <textarea 
                     value={card.front}
                     onChange={(e) => updateCard(index, 'front', e.target.value)}
                     className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white text-xs"
                     rows={1}
                   />
                </div>
                <div className="flex-1 space-y-1">
                   <div className="text-[10px] font-bold text-gray-400">裏面</div>
                   <textarea 
                     value={card.back}
                     onChange={(e) => updateCard(index, 'back', e.target.value)}
                     className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white text-xs"
                     rows={1}
                   />
                </div>
                <button onClick={() => removeCard(index)} className="mt-5 text-gray-400 hover:text-red-500">
                   <X size={16} />
                </button>
             </div>
          ))}
       </div>
       
       <button onClick={addCard} className="w-full py-2 mt-4 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm shrink-0">
          <Plus size={16} /> 追加
       </button>
    </div>
  );

  const StudyView = () => {
    if (!currentDeck || currentDeck.cards.length === 0) {
       return (
         <div className="text-center py-20">
            <p className="text-gray-500 mb-4">カードがありません</p>
            <button onClick={() => setView('list')} className="text-blue-500 font-bold">戻る</button>
         </div>
       );
    }
    const card = currentDeck.cards[studyIndex];
    const progress = ((studyIndex + 1) / currentDeck.cards.length) * 100;

    return (
      <div className="max-w-2xl mx-auto space-y-4 h-full flex flex-col">
         <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 shrink-0">
            <button onClick={() => setView('list')} className="hover:text-gray-800 dark:hover:text-white"><X size={isWorkspace ? 18 : 24} /></button>
            <span className="font-bold text-sm">{studyIndex + 1} / {currentDeck.cards.length}</span>
         </div>
         
         <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shrink-0">
            <div className="h-full bg-blue-500 transition-all duration-300" style={{width: `${progress}%`}}></div>
         </div>

         {/* Flashcard Flip Area */}
         <div className="perspective-1000 flex-1 cursor-pointer min-h-[200px]" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
               {/* Front */}
               <div className="absolute w-full h-full backface-hidden bg-white dark:bg-dark-lighter rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest absolute top-4">Question</span>
                  <div className={`${isWorkspace ? 'text-xl' : 'text-3xl'} font-bold text-center text-gray-800 dark:text-white whitespace-pre-wrap`}>{card.front}</div>
                  <div className="absolute bottom-4 text-gray-400 text-xs flex items-center gap-2 animate-bounce">
                     <RotateCw size={14} /> 答え
                  </div>
               </div>
               
               {/* Back */}
               <div className="absolute w-full h-full backface-hidden bg-blue-50 dark:bg-blue-900/20 rounded-3xl shadow-xl border border-blue-100 dark:border-blue-800 flex flex-col items-center justify-center p-4 rotate-y-180">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest absolute top-4">Answer</span>
                  <div className={`${isWorkspace ? 'text-xl' : 'text-3xl'} font-bold text-center text-blue-900 dark:text-blue-100 whitespace-pre-wrap`}>{card.back}</div>
               </div>
            </div>
         </div>

         <div className="flex justify-between gap-3 shrink-0 pb-2">
            <button 
              onClick={() => {
                 setStudyIndex(Math.max(0, studyIndex - 1));
                 setIsFlipped(false);
              }}
              disabled={studyIndex === 0}
              className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm"
            >
               前へ
            </button>
            <button 
               onClick={() => {
                  if (studyIndex < currentDeck.cards.length - 1) {
                     setStudyIndex(studyIndex + 1);
                     setIsFlipped(false);
                  } else {
                     if(confirm('学習完了！デッキ一覧に戻りますか？')) setView('list');
                  }
               }}
               className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-colors text-sm"
            >
               {studyIndex < currentDeck.cards.length - 1 ? '次へ' : '完了'}
            </button>
         </div>
      </div>
    );
  };

  return (
    <div className={`mx-auto h-full flex flex-col ${isWorkspace ? 'max-w-full p-2' : 'max-w-6xl space-y-6'}`}>
      {!isWorkspace && (
        <div className="mb-6 flex items-center gap-2 shrink-0">
           <BookOpen className="text-blue-500" size={28} />
           <h2 className="text-2xl font-bold text-gray-800 dark:text-white">暗記カード</h2>
        </div>
      )}

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {view === 'list' && <ListView />}
        {view === 'edit' && <EditView />}
        {view === 'study' && <StudyView />}
      </div>
    </div>
  );
};

export default Flashcards;