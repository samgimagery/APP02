
import React, { useState, useRef, useEffect } from 'react';
import { Search, Calendar, ChevronRight, Plus, Trash2, Menu, ChevronLeft, Download } from 'lucide-react';
import { fetchPhilosopherContent, generatePhilosopherPortrait } from './services/geminiService';
import { AppState, GenerationResult } from './types';
import { get, set } from 'idb-keyval';

const WISDOM_PERSONS = [
  "Socrates", "Plato", "Aristotle", "Marcus Aurelius", "Nietzsche", 
  "Lao Tzu", "Confucius", "Buddha", "Hypatia", "Elon Musk", 
  "Bruce Lee", "Muhammad Ali", "Mike Tyson", "Steve Jobs", "Rumi", 
  "Malala Yousafzai", "Maya Angelou", "Albert Camus", "Jean-Paul Sartre", 
  "Kahlil Gibran", "Nikola Tesla", "Sun Tzu", "Winston Churchill",
  "Ernest Hemingway", "George Patton", "Eisenhower", "Seneca", "Epictetus",
  "René Descartes", "John Locke", "Immanuel Kant", "John Stuart Mill", "Karl Marx"
];

const HEROES = [
  "Socrates", "Plato", "Aristotle", "Friedrich Nietzsche", "Elon Musk", "Mike Tyson", "Muhammad Ali", "Bruce Lee",
  "Nikola Tesla", "George Patton", "Sun Tzu", "Eisenhower", "Ernest Hemingway", "Winston Churchill",
  "Albert Einstein", "Marie Curie", "Leonardo da Vinci", "Steve Jobs", "Bill Gates",
  "Isaac Newton", "Charles Darwin", "Galileo Galilei", "Stephen Hawking", "Ada Lovelace", "Alan Turing", 
  "Nelson Mandela", "Mahatma Gandhi", "Martin King Jr.", "Abraham Lincoln", 
  "Ben Franklin", "Eleanor Roosevelt", "Voltaire", "René Descartes", "Immanuel Kant", "David Hume", 
  "John Locke", "Thomas Hobbes", "Karl Marx", "Sigmund Freud", "Carl Jung", "Confucius", "Lao Tzu", 
  "Sun Tzu", "Gautama Buddha", "Jalal Rumi", "Kahlil Gibran", "Rabindranath Tagore", "Hypatia", 
  "Cleopatra", "Joan of Arc", "Amelia Earhart", "Rosa Parks", "Helen Keller", "Maya Angelou", "Jane Austen", 
  "Virginia Woolf", "Mary Shelley", "Charlotte Brontë", "Emily Dickinson", "Sylvia Plath", "Toni Morrison", 
  "Shakespeare", "Homer", "Dante", "Goethe", "Leo Tolstoy", "Dostoevsky", 
  "Franz Kafka", "George Orwell", "Aldous Huxley", "Carl Sagan", "Richard Feynman", "Niels Bohr", "Max Planck", 
  "Werner Heisenberg", "Erwin Schrödinger", "James Maxwell", "Michael Faraday", "Thomas Edison", "Graham Bell",
  "Henry Ford", "Jane Goodall", "Louis Pasteur", "Alexander Fleming", "Charles Babbage", "Grace Hopper", 
  "Sally Ride", "Katherine Johnson", "Rosalind Franklin", "Mozart", "Beethoven", 
  "Sebastian Bach", "Michelangelo", "Vincent van Gogh", "Pablo Picasso", "Salvador Dalí",
  "Frida Kahlo", "Georgia O'O'Keeffe", "Coco Chanel", "Audrey Hepburn", "Marilyn Monroe", "Diana", 
  "Mother Teresa", "Nightingale", "Harriet Tubman", "Malala", "Kobe Bryant", "Michael Jordan",
  "Epictetus", "John Stuart Mill", "Jean-Paul Sartre"
];

const RESEARCH_POOL = [
  "Virtue", "Essence", "Existence", "Substance", "Logic", "Dialectic", "Truth", "Reason", "Cosmos", "Metaphysics",
  "Ethics", "Aesthetics", "Ontology", "Mind", "Spirit", "Will", "Freedom", "Justice", "Reality", "Perception",
  "Dualism", "Monism", "Skepticism", "Rationalism", "Empiricism", "Phenomenon", "Noumenon", "Axiom", "Paradigm",
  "Theology", "Critique", "Humanity", "Society", "Culture", "Language", "Symbol", "Meaning", "Wisdom", "Insight",
  "Discipline", "Focus", "Victory", "Legacy", "Innovation", "Inspiration", "Greatness", "Knowledge", "Awareness",
  "Strategy", "Courage", "Valor", "Fortitude", "Stoicism", "Intellect", "Discovery", "Vision", "Prowess", "Willpower"
];

const Wallpaper: React.FC = React.memo(() => {
  const rows = 45; 
  return (
    <div className="fixed inset-0 z-0 flex flex-col justify-between pointer-events-none select-none overflow-hidden py-0 bg-black">
      {[...Array(rows)].map((_, i) => {
        const offset = i * 7; 
        const rowItems = [...HEROES.slice(offset % HEROES.length), ...HEROES.slice(0, offset % HEROES.length)];
        const duration = 1200 + ((i * 100) % 800); 
        
        const brightIndices = new Set<number>();
        const midIndices = new Set<number>();
        for (let idx = 0; idx < rowItems.length; idx++) {
          const rand = Math.random();
          if (rand > 0.95) brightIndices.add(idx);
          else if (rand > 0.82) midIndices.add(idx);
        }

        const renderStrip = (keyPrefix: string) => (
           <div className="flex items-center">
             {rowItems.map((item, idx) => {
               let color = 'text-zinc-900';
               if (brightIndices.has(idx)) color = 'text-zinc-500';
               else if (midIndices.has(idx)) color = 'text-zinc-700';
               
               return (
                 <span key={`${keyPrefix}-${idx}`} className={`mx-6 transition-all duration-1000 whitespace-nowrap text-lg md:text-xl font-normal ${color}`}>
                   {item}
                 </span>
               );
             })}
           </div>
        );
        return (
          <div key={i} className="flex overflow-hidden w-full h-[2.2vh]">
            <div className="animate-marquee whitespace-nowrap font-tech flex items-center leading-none tracking-tighter uppercase" style={{ animationDuration: `${duration}s` }}>
              {renderStrip('a')}
              {renderStrip('b')}
              {renderStrip('c')}
            </div>
          </div>
        );
      })}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_0%_0%,black_0%,transparent_50%),radial-gradient(circle_at_100%_0%,black_0%,transparent_50%),radial-gradient(circle_at_0%_100%,black_0%,transparent_50%),radial-gradient(circle_at_100%_100%,black_0%,transparent_50%)]" />
    </div>
  );
});

const CenterMessage: React.FC<{ 
  bigText: string; 
  smallText: string; 
  isTypingSmall?: boolean 
}> = ({ bigText, smallText, isTypingSmall }) => (
  <div className="relative flex flex-col items-center justify-center w-full min-h-[12em]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.8)_0%,transparent_50%)]" />
    <div className="relative z-10 flex flex-col items-center gap-4">
      <h2 className="text-4xl md:text-6xl text-white font-serif font-medium tracking-tight text-center drop-shadow-2xl">
        {bigText}
        {(!isTypingSmall) && <span className="animate-pulse ml-1 text-zinc-500">|</span>}
      </h2>
      <div className="h-8 flex items-center justify-center">
        <span className="text-xl md:text-2xl text-zinc-400 font-serif italic tracking-wide">
          {smallText}
          {isTypingSmall && <span className="animate-pulse ml-0.5 text-zinc-500">|</span>}
        </span>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [philosopherInput, setPhilosopherInput] = useState('');
  const [factIndex, setFactIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(window.innerWidth >= 1024);
  const [favorites, setFavorites] = useState<GenerationResult[]>([]);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [currentNameIndex, setCurrentNameIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [state, setState] = useState<AppState>({
    loading: false,
    error: null,
    result: null,
    currentQuoteIndex: 0,
    statusMessage: '',
  });

  const [splashName, setSplashName] = useState('');
  const [splashDeleting, setSplashDeleting] = useState(false);
  const [splashIndex, setSplashIndex] = useState(() => Math.floor(Math.random() * WISDOM_PERSONS.length));

  const [loaderWord, setLoaderWord] = useState('');
  const [loaderDeleting, setLoaderDeleting] = useState(false);
  const [loaderPoolIdx, setLoaderPoolIdx] = useState(0);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (state.result || state.loading) return;
    const target = WISDOM_PERSONS[splashIndex % WISDOM_PERSONS.length];
    const timer = setTimeout(() => {
      if (!splashDeleting) {
        if (splashName.length < target.length) setSplashName(target.slice(0, splashName.length + 1));
        else setTimeout(() => setSplashDeleting(true), 2500);
      } else {
        if (splashName.length > 0) setSplashName(target.slice(0, splashName.length - 1));
        else { setSplashDeleting(false); setSplashIndex(prev => prev + 1); }
      }
    }, splashDeleting ? 50 : 100);
    return () => clearTimeout(timer);
  }, [splashName, splashDeleting, splashIndex, state.result, state.loading]);

  useEffect(() => {
    if (!state.loading) return;
    const target = RESEARCH_POOL[loaderPoolIdx % RESEARCH_POOL.length];
    const timer = setTimeout(() => {
      if (!loaderDeleting) {
        if (loaderWord.length < target.length) setLoaderWord(target.slice(0, loaderWord.length + 1));
        else setTimeout(() => setLoaderDeleting(true), 1200);
      } else {
        if (loaderWord.length > 0) setLoaderWord(target.slice(0, loaderWord.length - 1));
        else { setLoaderDeleting(false); setLoaderPoolIdx(prev => prev + 1); }
      }
    }, loaderDeleting ? 40 : 80);
    return () => clearTimeout(timer);
  }, [loaderWord, loaderDeleting, loaderPoolIdx, state.loading]);

  const onTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setTouchEnd(null);
    setTouchStart('clientX' in e ? e.clientX : (e as React.TouchEvent).targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    setTouchEnd('clientX' in e ? e.clientX : (e as React.TouchEvent).targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isSwipeRight = distance < -50;
    const isSwipeLeft = distance > 50;

    if (isSwipeRight && !isMenuOpen) {
      setIsMenuOpen(true);
    } else if (isSwipeLeft && isMenuOpen) {
      setIsMenuOpen(false);
    }
  };

  const cycleQuote = (direction: number) => {
    setState(prev => {
      if (!prev.result) return prev;
      const nextIdx = (prev.currentQuoteIndex + direction + prev.result.quotes.length) % prev.result.quotes.length;
      return { ...prev, currentQuoteIndex: nextIdx };
    });
  };

  const [compositeUrl, setCompositeUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (philosopherInput) return; 
    const currentName = WISDOM_PERSONS[currentNameIndex];
    let timeout: number;
    if (isTyping) {
      if (typedText.length < currentName.length) timeout = window.setTimeout(() => setTypedText(currentName.slice(0, typedText.length + 1)), 120);
      else timeout = window.setTimeout(() => { setIsTyping(false); setIsFading(true); }, 2500);
    } else if (isFading) {
      timeout = window.setTimeout(() => { setIsFading(false); setTypedText(''); setCurrentNameIndex(prev => (prev + 1) % WISDOM_PERSONS.length); setIsTyping(true); }, 1000); 
    }
    return () => clearTimeout(timeout);
  }, [typedText, isTyping, isFading, currentNameIndex, philosopherInput]);

  useEffect(() => {
    get('wisdom_library').then(val => { if (val) setFavorites(val); setIsLibraryLoaded(true); });
  }, []);
  useEffect(() => { if (isLibraryLoaded) set('wisdom_library', favorites); }, [favorites, isLibraryLoaded]);

  useEffect(() => {
    if (!state.result || !canvasRef.current) { setCompositeUrl(null); return; }
    let isCancelled = false;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (isCancelled) return;
      const W = 1500, H = 2000;
      canvas.width = W; canvas.height = H;
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, W, H); ctx.drawImage(img, 0, 0, W, H);
      const gradient = ctx.createLinearGradient(0, 0, 0, H);
      gradient.addColorStop(0, 'rgba(0,0,0,0)'); gradient.addColorStop(0.5, 'rgba(0,0,0,0.1)'); gradient.addColorStop(1, 'rgba(0,0,0,0.95)');    
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const nameText = state.result!.philosopher.toUpperCase();
      const bottomPadding = 140; 
      const nameFontSize = 32; ctx.font = `500 ${nameFontSize}px "Inter", sans-serif`;
      const nameTracking = 16;
      let charWidths = nameText.split('').map(c => ctx.measureText(c).width);
      let totalWidth = charWidths.reduce((a, b) => a + b, 0) + (nameText.length - 1) * nameTracking;
      let currentX = (W - totalWidth) / 2;
      const nameY = H - bottomPadding;
      for (let i = 0; i < nameText.length; i++) {
        ctx.fillText(nameText[i], currentX + charWidths[i] / 2, nameY);
        currentX += charWidths[i] + nameTracking;
      }
      const lineY = nameY - 70;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(W / 2 - 40, lineY); ctx.lineTo(W / 2 + 40, lineY); ctx.stroke();
      const quoteFontSize = 100; ctx.font = `italic ${quoteFontSize}px "Playfair Display", serif`;
      // @ts-ignore
      ctx.letterSpacing = "-2px"; 
      const maxWidth = W * 0.85;
      const currentQuote = state.result!.quotes[state.currentQuoteIndex];
      const words = `"${currentQuote}"`.split(' ');
      let lines: string[] = [], currentLine = '';
      for (let n = 0; n < words.length; n++) {
        let testLine = currentLine + words[n] + ' ';
        if (ctx.measureText(testLine).width > maxWidth && n > 0) { lines.push(currentLine.trim()); currentLine = words[n] + ' '; }
        else currentLine = testLine;
      }
      lines.push(currentLine.trim());
      const lineHeight = quoteFontSize * 1.1; 
      let startY = lineY - 100; 
      for (let i = lines.length - 1; i >= 0; i--) { ctx.fillText(lines[i], W / 2, startY); startY -= lineHeight; }
      // @ts-ignore
      ctx.letterSpacing = "0px";
      canvas.toBlob(blob => { if (!isCancelled && blob) setCompositeUrl(URL.createObjectURL(blob)); }, 'image/png');
    };
    img.src = state.result.imageUrl;
    return () => { isCancelled = true; };
  }, [state.result, state.currentQuoteIndex]);

  useEffect(() => { return () => { if (compositeUrl) URL.revokeObjectURL(compositeUrl); } }, [compositeUrl]);

  const handleGenerate = async (nameOverride?: string) => {
    const name = nameOverride || philosopherInput || typedText || WISDOM_PERSONS[currentNameIndex];
    setSearchQuery(name);
    setPhilosopherInput('');
    if (window.innerWidth < 1024) setIsMenuOpen(false);
    setFactIndex(0);
    setState(prev => ({ ...prev, loading: true, error: null, result: null, currentQuoteIndex: 0 }));
    try {
      const content = await fetchPhilosopherContent(name);
      const imageUrl = await generatePhilosopherPortrait(content.name);
      setState({
        loading: false, error: null, currentQuoteIndex: 0, statusMessage: '',
        result: {
          imageUrl, philosopher: content.name, quotes: content.quotes,
          dates: content.dates, achievements: content.achievements,
          facts: content.facts, gender: content.gender
        },
      });
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: 'The vision vanished. Seek again.' }));
    }
  };

  const handleAction = async () => {
    if (!compositeUrl || !state.result) return;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      try {
        const response = await fetch(compositeUrl);
        const blob = await response.blob();
        const file = new File([blob], `${state.result.philosopher.replace(/\s+/g, '_')}_Wisdom.png`, { type: 'image/png' });
        await navigator.share({ files: [file], title: 'Wisdom Whispers', text: `A glimpse of wisdom from ${state.result.philosopher}.` });
      } catch (err: any) {
        if (err.name !== 'AbortError') triggerDownload();
      }
    } else triggerDownload();
  };

  const triggerDownload = () => {
    if (!compositeUrl || !state.result) return;
    const link = document.createElement('a');
    link.href = compositeUrl; link.download = `${state.result.philosopher.replace(/\s+/g, '_')}_Wisdom.png`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const nextFact = () => { if (state.result?.facts) setFactIndex(prev => (prev + 1) % state.result!.facts.length); };
  const saveToLibrary = () => {
    if (state.result) {
      const existingIdx = favorites.findIndex(f => f.imageUrl === state.result?.imageUrl);
      if (existingIdx === -1) setFavorites(prev => [state.result!, ...prev]);
      else setFavorites(prev => {
        const updated = [...prev];
        updated[existingIdx] = state.result!;
        return updated;
      });
    }
  };
  const removeFromLibrary = (imageUrl: string) => setFavorites(prev => prev.filter(f => f.imageUrl !== imageUrl));
  const loadFromLibrary = (fav: GenerationResult) => { setFactIndex(0); setState({ ...state, loading: false, error: null, result: fav, currentQuoteIndex: 0 }); };

  return (
    <div className="h-screen w-screen flex flex-col bg-black overflow-hidden relative">
      <Wallpaper />

      {state.loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-700">
          <CenterMessage bigText={searchQuery} smallText={loaderWord} isTypingSmall />
        </div>
      )}

      <div className="fixed top-10 left-10 z-[60]">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-3 text-zinc-500 hover:text-white transition-all flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm border border-white/5">
          {isMenuOpen ? <ChevronLeft size={28} /> : <Menu size={28} />}
        </button>
      </div>

      <aside className={`fixed top-0 left-0 h-full w-full lg:w-[400px] z-50 bg-black/80 backdrop-blur-3xl border-r border-white/5 transform transition-transform duration-500 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-8 md:p-12 overflow-y-auto no-scrollbar space-y-12">
          <div className="shrink-0 h-[140px]" />
          <section className="space-y-6">
            <div className="flex items-center gap-3"><Search size={14} className="text-zinc-500" /><h2 className="text-[10px] uppercase tracking-[0.4em] font-bold text-zinc-500">WISDOM WHISPERS</h2></div>
            <div className="relative flex items-center">
              <input type="text" className="w-full bg-white/5 border border-zinc-800/50 rounded-2xl py-4 pl-6 pr-14 focus:ring-1 focus:ring-zinc-700 outline-none text-white placeholder-transparent font-serif" value={philosopherInput} onChange={e => setPhilosopherInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGenerate()} placeholder="Name" />
              {!philosopherInput && <div className={`absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 transition-opacity duration-1000 ${isFading ? 'opacity-0' : 'opacity-100'}`}>{typedText}</div>}
              <button onClick={() => handleGenerate()} disabled={state.loading} className="absolute right-2 p-2 rounded-xl text-zinc-400 hover:text-white transition-all disabled:opacity-30">
                {state.loading ? <div className="w-5 h-5 border-2 border-zinc-500/20 border-t-zinc-300 rounded-full animate-spin" /> : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" /></svg>}
              </button>
            </div>
          </section>

          {state.result && (
            <section onClick={nextFact} className="glass rounded-[2rem] p-8 cursor-pointer group hover:bg-white/[0.02] transition-all">
              <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-3"><Calendar size={14} className="text-zinc-500" /><h2 className="text-[10px] uppercase tracking-[0.4em] font-bold text-zinc-500">Chronicle</h2></div><ChevronRight size={16} className="text-zinc-700 group-hover:text-zinc-400" /></div>
              <div className="space-y-4"><div className="flex flex-col"><p className="text-zinc-600 text-[10px] font-bold tracking-[0.2em] uppercase">{state.result.philosopher}</p><p className="text-zinc-600 text-[10px] font-bold tracking-[0.2em]">{state.result.dates}</p></div><p className="text-zinc-300 text-lg font-serif italic leading-relaxed">{state.result.facts[factIndex]}</p><div className="flex gap-1 pt-4">{state.result.facts.map((_, i) => <div key={i} className={`h-0.5 flex-1 rounded-full ${i === factIndex ? 'bg-zinc-400' : 'bg-zinc-900'}`} />)}</div></div>
            </section>
          )}

          {favorites.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-[10px] uppercase tracking-[0.4em] font-bold text-zinc-500">The Library <span className="opacity-40 ml-1">({favorites.length})</span></h2>
              <div className="grid grid-cols-3 gap-x-3 gap-y-6">
                {favorites.map((fav, i) => (
                  <div key={i} className={`flex flex-col gap-2 cursor-pointer transition-all duration-500 ${state.result?.imageUrl === fav.imageUrl ? 'scale-105 opacity-100' : 'opacity-40 md:hover:opacity-100'}`} onPointerDown={() => loadFromLibrary(fav)}>
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-black border border-white/5 group">
                      <img src={fav.imageUrl} className="w-full h-full object-cover" />
                      <button onPointerDown={e => { e.stopPropagation(); removeFromLibrary(fav.imageUrl); }} className="absolute top-1 right-1 p-1 bg-black/60 rounded-md opacity-100 md:opacity-0 md:group-hover:opacity-100"><Trash2 size={10} className="text-zinc-400" /></button>
                    </div>
                    <p className="text-[9px] uppercase tracking-wider text-center truncate text-zinc-500">{fav.philosopher}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </aside>

      <main 
        onPointerDown={onTouchStart} 
        onPointerMove={onTouchMove} 
        onPointerUp={onTouchEnd}
        className={`flex-1 flex flex-col items-center justify-center transition-all duration-500 px-4 relative z-10 ${isMenuOpen ? 'lg:pl-[400px]' : ''}`}
      >
        <div className="w-full max-w-xl flex flex-col items-center">
          {state.result ? (
            <div className="w-full animate-in zoom-in-95 fade-in duration-1000">
              <div className="relative flex items-center justify-center w-full group">
                <div 
                  onClick={() => cycleQuote(1)}
                  className="painting-frame bg-black rounded-3xl overflow-hidden aspect-[3/4] relative w-full shadow-2xl cursor-pointer"
                >
                  <img src={compositeUrl || state.result.imageUrl} className="w-full h-full object-cover bg-black select-none pointer-events-none" />
                  {!compositeUrl && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent flex flex-col items-center justify-end p-8 pb-10 text-center pointer-events-none">
                      <h3 className="text-2xl md:text-4xl font-serif leading-tight text-white italic">"{state.result.quotes[state.currentQuoteIndex]}"</h3>
                      <div className="h-0.5 w-12 bg-white/40 mx-auto my-6" />
                      <p className="text-[10px] md:text-sm text-zinc-300 uppercase tracking-[0.8em] font-medium">{state.result.philosopher}</p>
                    </div>
                  )}
                  {state.result.quotes.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 opacity-40">
                      {state.result.quotes.map((_, i) => <div key={i} className={`h-1 rounded-full transition-all ${i === state.currentQuoteIndex ? 'w-4 bg-white' : 'w-1 bg-white/50'}`} />)}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-center gap-6">
                <button onClick={saveToLibrary} className={`p-4 rounded-full transition-all border ${favorites.some(f => f.imageUrl === state.result?.imageUrl) ? 'bg-white border-white text-black' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`} title="Add to Library">
                  <Plus size={20} className={favorites.some(f => f.imageUrl === state.result?.imageUrl) ? "scale-110" : ""} />
                </button>
                <button onClick={handleAction} className="p-4 rounded-full transition-all border bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-30" title="Download or Share" disabled={!compositeUrl}><Download size={20} /></button>
              </div>
            </div>
          ) : !state.loading && (
            <CenterMessage bigText={splashName} smallText="Wisdom Whispers" />
          )}
        </div>
      </main>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default App;
