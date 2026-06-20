import { useState, useEffect, useRef, ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "motion/react";
import {
  Volume2,
  Sparkles,
  BookOpen,
  Upload,
  RotateCcw,
  Shuffle,
  Award,
  HelpCircle,
  Flame,
  Check,
  X,
  PlusCircle,
  Eye,
  EyeOff,
  Image as LucideImage,
  ArrowRight,
  Plus,
  Compass,
  FileCheck2,
  BookmarkCheck,
  ChevronRight,
  ListFilter
} from "lucide-react";
import { PRELOADED_LEVELS, VocabLevel, VocabWord } from "./preloadedVocab";
// GENERATED_LEVELS is produced at build-time by scripts/generate-vocab.js
// The generator now adds a default export so we can statically import it.
let GENERATED_LEVELS: VocabLevel[] = [];
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // Use require to avoid static TS errors if the generator hasn't run in some flows
  // (predev/prebuild should run the generator in normal dev/build flows).
  // @ts-ignore
  GENERATED_LEVELS = require("./generatedVocab").default || [];
} catch (e) {
  GENERATED_LEVELS = [];
}

// Helper to format the example sentence with highlighted bolded vocab words
function formatExampleSentence(sentence: string, word: string) {
  if (!sentence) return "";
  if (!word) return sentence;

  // Split sentence case-insensitively using currentWord's German word representation
  // Escape regex specials
  const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  const regex = new RegExp(`(${escapedWord})`, "gi");
  const parts = sentence.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === word.toLowerCase()) {
      return (
        <span key={index} className="text-emerald-400 font-extrabold underline decoration-emerald-400/30">
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function App() {
  // App Levels and Days states
  // Start with preloaded + generated (generated takes precedence when available)
  const initialLevels = GENERATED_LEVELS.length > 0 ? [...GENERATED_LEVELS, ...PRELOADED_LEVELS.filter(p=>!GENERATED_LEVELS.some(g=>g.id===p.id))] : PRELOADED_LEVELS;
  const [levels, setLevels] = useState<VocabLevel[]>(initialLevels);
  const [selectedLevelId, setSelectedLevelId] = useState<string>(initialLevels[0]?.id || "german_verbs_adjectives");
  const [selectedDay, setSelectedDay] = useState<string>(Object.keys(initialLevels[0]?.days || {"Day 1":""})[0] || "Day 1");

  // Fetch folder-based dynamic levels from server on app load
  useEffect(() => {
    const fetchFolderLevels = async () => {
      try {
        const response = await fetch("/api/levels");
        if (response.ok) {
          const data = await response.json();
          if (data.levels && data.levels.length > 0) {
            // Merge with local PRELOADED_LEVELS, avoid duplicate IDs
            const merged = [...data.levels];
            PRELOADED_LEVELS.forEach((pre) => {
              if (!merged.some((m) => m.id === pre.id)) {
                merged.push(pre);
              }
            });
            setLevels(merged);
            // Default to the first folder level if available
            setSelectedLevelId(data.levels[0].id);
            setSelectedDay(Object.keys(data.levels[0].days)[0] || "Day 1");
          }
        }
      } catch (err) {
        console.error("Failed to load virtual workspace levels:", err);
      }
    };

    fetchFolderLevels();
  }, []);

  // Scrap-free security protections: completely secure the content from scraping
  useEffect(() => {
    // 1. Disable Right Click Context Menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. Disable Common Copy & Save keyboard actions
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+C (inspectors)
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "C" || e.key === "c")) ||
        // Disable Ctrl+U or Command+Option+U (view source)
        (e.ctrlKey && (e.key === "U" || e.key === "u")) ||
        // Disable Ctrl+S / Command+S (save page)
        (e.ctrlKey && (e.key === "S" || e.key === "s")) ||
        // Disable Ctrl+C / Command+C (copy text)
        (e.ctrlKey && (e.key === "C" || e.key === "c")) ||
        // Mac Command equivalents
        (e.metaKey && (e.key === "c" || e.key === "u" || e.key === "s" || e.key === "i"))
      ) {
        e.preventDefault();
      }
    };

    // 3. Disable Dragging of any content
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // 4. Disable Selecting / Copy event itself
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      // Scramble copy content if someone tries to copy
      if (e.clipboardData) {
        e.clipboardData.setData(
          "text/plain",
          "Security Protection Enabled: Scraping or copying content from this platform is strictly prohibited."
        );
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("copy", handleCopy);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("copy", handleCopy);
    };
  }, []);

  // Selection references
  const currentLevel = levels.find((l) => l.id === selectedLevelId) || levels[0];
  const dayNames = currentLevel ? Object.keys(currentLevel.days) : [];
  const currentWords = currentLevel ? currentLevel.days[selectedDay] || [] : [];

  // Quiz Play States
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(() => {
    const saved = localStorage.getItem("vocab_streak");
    return saved ? parseInt(saved, 10) : 0;
  });

  // Hints States
  const [showImage, setShowImage] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(false);

  // Active view: 'quiz' | 'browse'
  const [activeView, setActiveView] = useState<"quiz" | "browse">("quiz");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Speech synthesiser state
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Current active question
  const currentWord: VocabWord | undefined = currentWords[currentIndex];

  // Initialize browser speech synthesis voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const updateVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Sync state when level or day changes
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsDone(false);
    setQuizScore(0);
    setShowImage(false);
    setImageUrl(null);
  }, [selectedLevelId, selectedDay]);

  // Automatically fetch Unsplash image cue in background when active word changes, but keep it hidden
  useEffect(() => {
    if (currentWord) {
      setImageUrl(null);
      // Wait slightly to prevent race conditions during state transitions
      const timer = setTimeout(() => {
        fetchImageHint(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, selectedLevelId, selectedDay]);

  // Handle High-Fidelity premium native pronunciation using modern neural audio streamer with native TTS fallback
  const playTTS = (text: string, speedMode: "normal" | "slow" | "spell") => {
    try {
      // 1. Google High-Fidelity Neural TTS Engine
      let textToSpeak = text;
      let playbackRate = 1.0;
      
      if (speedMode === "slow") {
        playbackRate = 0.65;
      } else if (speedMode === "spell") {
        // Spell letter-by-letter with spacing so TTS translates spelling correctly
        textToSpeak = text.split("").join("   ");
        playbackRate = 0.75;
      }

      const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=de&client=tw-ob&q=${encodeURIComponent(textToSpeak)}`;
      const audio = new Audio(googleTtsUrl);
      
      audio.playbackRate = playbackRate;
      
      // Attempt to play premium neural track
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Premium Neural TTS audio play failed, falling back to Web Speech Synthesis API:", err);
          // Fallback to local on-device synthesizers
          playFallbackTTS(text, speedMode);
        });
      }
    } catch (e) {
      console.warn("Audio Context error, falling back to speech synthesis:", e);
      playFallbackTTS(text, speedMode);
    }
  };

  const playFallbackTTS = (text: string, speedMode: "normal" | "slow" | "spell") => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    let textToSpeak = text;
    let rate = 1.0;

    if (speedMode === "slow") {
      rate = 0.55;
    } else if (speedMode === "spell") {
      textToSpeak = text
        .split("")
        .map((char) => {
          if (char === " ") return " space ";
          return char.toLowerCase();
        })
        .join(" . ");
      rate = 0.75;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const deVoices = voices.filter(
      (v) =>
        v.lang.toLowerCase() === "de-de" ||
        v.lang.toLowerCase().startsWith("de-") ||
        v.lang.toLowerCase().startsWith("de_") ||
        v.lang.toLowerCase() === "de"
    );

    let selectedVoice = null;
    if (deVoices.length > 0) {
      const scored = deVoices.map((v) => {
        const name = v.name.toLowerCase();
        let score = 0;
        if (name.includes("google")) score += 20;
        const femaleNames = ["female", "woman", "katja", "hedda", "marlene", "gabi", "gisela", "vicki", "yelda", "deutsch (deutschland)"];
        if (femaleNames.some((f) => name.includes(f))) score += 30;
        if (v.lang.toLowerCase() === "de-de") score += 10;
        const maleNames = ["male", "man", "stefan", "chico", "yannick", "markus"];
        if (maleNames.some((m) => name.includes(m))) score -= 25;
        if (v.localService) score += 5;
        return { voice: v, score };
      });
      scored.sort((a, b) => b.score - a.score);
      selectedVoice = scored[0].voice;
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.lang = "de-DE";
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  };

  // Fetch Unsplash Image Hint from server
  const fetchImageHint = async (forceShow = true) => {
    if (!currentWord) return;
    if (forceShow) {
      setShowImage(true);
    }
    if (imageUrl) return; // Keep cached if loaded

    setImageLoading(true);
    const searchQuery = currentWord.keyword || currentWord.german_word;

    try {
      const response = await fetch(`/api/image-search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
      } else {
        setImageUrl("https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=400&h=400");
      }
    } catch (e) {
      console.error(e);
      setImageUrl("https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=400&h=400");
    } finally {
      setImageLoading(false);
    }
  };

  // Answer Selection
  const handleAnswerClick = (answer: string) => {
    if (selectedAnswer !== null) return; // Block multiple selections

    setSelectedAnswer(answer);
    const isCorrect = answer.toLowerCase().trim() === currentWord?.meaning.toLowerCase().trim();

    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      localStorage.setItem("vocab_streak", nextStreak.toString());
      // Play friendly native correct sound
      playTTS(currentWord.german_word, "normal");
    } else {
      setStreak(0);
      localStorage.setItem("vocab_streak", "0");
    }
  };

  // Move to Next Question
  const handleNext = () => {
    setSelectedAnswer(null);
    setShowImage(false);
    setImageUrl(null);

    if (currentIndex + 1 < currentWords.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsDone(true);
    }
  };

  // Reset/Restart Quiz
  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsDone(false);
    setQuizScore(0);
    setShowImage(false);
    setImageUrl(null);
  };

  // Randomize Current Words of the Day
  const handleShuffle = () => {
    if (!currentLevel || !dayNames.length) return;
    const shuffled = [...currentWords].sort(() => Math.random() - 0.5);
    setLevels((prevLevels) =>
      prevLevels.map((l) => {
        if (l.id === selectedLevelId) {
          return {
            ...l,
            days: {
              ...l.days,
              [selectedDay]: shuffled,
            },
          };
        }
        return l;
      })
    );
    handleRestart();
  };



  // Filter word list during search browse view
  const filteredWords = currentWords.filter((w) => {
    const q = searchQuery.toLowerCase();
    return (
      w.german_word.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q) ||
      (w.example_sentence && w.example_sentence.toLowerCase().includes(q))
    );
  });

  return (
    <div id="app_root" className="min-h-screen bg-[#09090b] text-zinc-100 font-sans antialiased transition-all duration-300 relative select-none">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute inset-0 bg-radial-at-t from-[#4f46e5]/10 via-transparent to-transparent pointer-events-none z-0" />

      <header className="relative z-10 border-b border-white/5 bg-zinc-900/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="relative p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 shadow-lg text-emerald-400">
              <span className="text-2xl">🇩🇪</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white mb-0.5 flex items-center gap-2">
                Vocab Project
                <span className="text-[10px] py-0.5 px-2 rounded bg-indigo-500/15 text-indigo-400 font-mono border border-indigo-500/30 uppercase tracking-widest font-extrabold">
                  German Coach
                </span>
              </h1>
              <p className="text-xs text-zinc-400">Minimal dark vocab cards with smart speech & AI mnemonics</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Nav Switchers */}
            <div className="bg-zinc-900 border border-white/10 p-1 rounded-xl flex">
              <button
                id="view_quiz_btn"
                onClick={() => setActiveView("quiz")}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  activeView === "quiz" ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Award className="w-3.5 h-3.5 text-indigo-400" />
                Play Quiz
              </button>
              <button
                id="view_browse_btn"
                onClick={() => setActiveView("browse")}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  activeView === "browse" ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow" : "text-zinc-400 hover:text-white"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                Browse Words ({currentWords.length})
              </button>
            </div>

            {/* Streak Indicator */}
            <div className="flex items-center gap-2 bg-gradient-to-tr from-zinc-900 to-zinc-950 border border-white/10 px-3.5 py-2 rounded-xl text-indigo-400 font-semibold shadow-md">
              <Flame className="w-4 h-4 fill-indigo-500 animate-pulse text-indigo-500" />
              <span className="text-xs font-mono font-bold tracking-tight">{streak} 🔥</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        {/* Navigation / Configuration selectors */}
        <div className="max-w-2xl mx-auto mb-8">
          {/* Card Select Level & Day (Compact) */}
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 shadow-xl flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/2 to-transparent pointer-events-none" />
            
            {/* Level Dropdown */}
            <div className="flex flex-col gap-1 w-full sm:w-1/2 relative z-10">
              <label className="text-[10px] uppercase tracking-wider text-indigo-400 font-extrabold flex items-center gap-1.5 mb-0.5">
                <Compass className="w-3.5 h-3.5" /> Choose Level Set
              </label>
              <div className="relative">
                <select
                  id="level-select"
                  value={selectedLevelId}
                  onChange={(e) => {
                    setSelectedLevelId(e.target.value);
                    const targetLvl = levels.find((l) => l.id === e.target.value);
                    if (targetLvl) {
                      setSelectedDay(Object.keys(targetLvl.days)[0]);
                    }
                  }}
                  className="w-full bg-zinc-950 border border-white/10 text-xs text-zinc-100 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer transition-colors relative"
                >
                  {levels.map((lvl) => (
                    <option key={lvl.id} value={lvl.id} className="bg-zinc-950">
                      {lvl.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Day Dropdown */}
            <div className="flex flex-col gap-1 w-full sm:w-1/2 relative z-10">
              <label className="text-[10px] uppercase tracking-wider text-indigo-400 font-extrabold flex items-center gap-1.5 mb-0.5">
                <ListFilter className="w-3.5 h-3.5" /> Day / Section
              </label>
              <div className="relative">
                <select
                  id="day-select"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 text-xs text-zinc-100 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer transition-colors relative"
                >
                  {dayNames.map((day) => (
                    <option key={day} value={day} className="bg-zinc-950">
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------------
            VIEW 1: PLAY ACTIVE QUIZ MODULE
            ------------------------------------------------------------------- */}
        {activeView === "quiz" && (
          <div className="max-w-3xl mx-auto">
            {currentWords.length === 0 ? (
              <div className="bg-zinc-900 border border-white/10 rounded-3xl p-16 text-center shadow-2xl">
                <HelpCircle className="w-12 h-12 text-zinc-650 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No words loaded in this Day</h3>
                <p className="text-zinc-400 text-sm max-w-md mx-auto mb-6">
                  Please select another level from the options or drop a custom Excel file.
                </p>
              </div>
            ) : isDone ? (
              /* COMPLETED RESULTS SCREEN CARD */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-white/10 rounded-3xl p-10 sm:p-14 text-center shadow-2xl relative overflow-hidden"
              >
                {/* Glowing finish background ring */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl z-0" />

                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center mx-auto mb-8 shadow-xl">
                    <Award className="w-10 h-10 text-indigo-400" />
                  </div>

                  <h2 className="text-3xl font-extrabold text-white mb-3">Tag Abgeschlossen!</h2>
                  <p className="text-zinc-400 text-sm mb-10">You finished all words of {selectedDay}</p>

                  <div className="grid grid-cols-2 gap-5 max-w-md mx-auto mb-10">
                    <div className="bg-zinc-950 border border-white/10 rounded-2xl p-5 shadow-inner">
                      <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                        Final Score
                      </span>
                      <span className="text-2xl font-mono font-black text-white">
                        {Math.round((quizScore / currentWords.length) * 100)}%
                      </span>
                      <span className="block text-[11px] text-zinc-400 mt-1">
                        {quizScore} of {currentWords.length} correct
                      </span>
                    </div>

                    <div className="bg-zinc-950 border border-white/10 rounded-2xl p-5 shadow-inner">
                      <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                        Streak Kept
                      </span>
                      <span className="text-2xl font-mono font-black text-indigo-400">{streak} 🔥</span>
                      <span className="block text-[11px] text-zinc-400 mt-1">Consequent replies</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      onClick={handleRestart}
                      className="w-full sm:w-auto px-8 py-4 text-sm rounded-xl bg-white text-black font-extrabold transition-all hover:bg-zinc-200 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <RotateCcw className="w-4 h-4" /> Restart Level
                    </button>
                    <button
                      onClick={handleShuffle}
                      className="w-full sm:w-auto px-8 py-4 text-sm rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-white/10 text-zinc-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Shuffle className="w-4 h-4" /> Shuffle & Retry
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ACTIVE INTERACTIVE QUIZ CARD */
              <div className="space-y-6">
                {/* Visual Card Top Information Meter & Progress Bar */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs text-zinc-400">
                    <span className="font-bold px-3 py-1.5 rounded-xl bg-indigo-600/10 text-indigo-400 font-mono tracking-wider border border-white/5">
                      Card {currentIndex + 1} / {currentWords.length}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping mr-1" />
                      Accuracy:{" "}
                      <span className="font-mono font-bold text-white">
                        {currentIndex > 0 ? Math.round((quizScore / currentIndex) * 100) : 100}%
                      </span>
                    </div>
                  </div>

                  {/* Gradient Progress Indicator */}
                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                    <div 
                      style={{ width: `${((currentIndex + 1) / currentWords.length) * 100}%` }}
                      className="h-full bg-gradient-to-r from-indigo-600 to-blue-400 transition-all duration-300 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                    />
                  </div>
                </div>

                {/* Main Glass Vocabulary Card */}
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  className="bg-zinc-900 border border-white/10 rounded-2xl p-8 sm:p-10 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-16 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />

                  {/* Category Accent Indicator */}
                  <div className="absolute top-6 left-6 flex items-center gap-2 z-10">
                    {currentWord.gender && (
                      <span
                        className={`text-[9px] font-mono font-black tracking-widest px-2.5 py-1 rounded border uppercase ${
                          currentWord.gender === "der"
                            ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                            : currentWord.gender === "die"
                              ? "bg-pink-500/15 text-pink-400 border-pink-500/30"
                              : currentWord.gender === "das"
                                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {currentWord.gender}
                      </span>
                    )}
                    {currentWord.note && (
                      <span className="text-[9px] font-mono font-black tracking-widest bg-zinc-950 text-zinc-400 px-2.5 py-1 rounded border border-white/5 uppercase">
                        {currentWord.note}
                      </span>
                    )}
                  </div>

                  {/* Prominent Next option on top right corner for fluid study iteration */}
                  {selectedAnswer !== null && (
                    <button
                      onClick={handleNext}
                      className="absolute top-5 right-6 z-20 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-black text-xs tracking-wider uppercase rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer font-sans select-none"
                    >
                      Next <ArrowRight className="w-3.5 h-3.5 stroke-[3.5]" />
                    </button>
                  )}

                  {/* Word Title & Phonetics representation */}
                  <div className="text-center pt-8 pb-3 relative z-10">
                    <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-2 selection:bg-indigo-500 selection:text-black">
                      {currentWord.german_word}
                    </h2>
                    {currentWord.pronunciation && (
                      <p className="text-xs font-mono text-indigo-300 tracking-wider bg-indigo-950 inline-block px-3.5 py-1.5 rounded-xl border border-indigo-500/10 mb-4">
                        {currentWord.pronunciation}
                      </p>
                    )}

                    {/* Example Sentence available beforehand just below the active word */}
                    {currentWord.example_sentence && (
                      <div className="w-full max-w-xl mx-auto p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl my-2 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Context Example Sentence</span>
                        </div>
                        <p className="text-zinc-200 italic leading-relaxed text-[13px] md:text-sm select-all">
                          "{formatExampleSentence(currentWord.example_sentence, currentWord.german_word)}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* PLACE HINT BUTTON AND IMAGE CONTAINER JUST BETWEEN WORD AND PRONUNCIATION AUDIO */}
                  <div className="flex flex-col items-center gap-3.5 my-5 relative z-10">
                    <button
                      onClick={() => {
                        const nextVal = !showImage;
                        setShowImage(nextVal);
                        if (nextVal) {
                          fetchImageHint(true);
                        }
                      }}
                      className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 border border-white/5 hover:border-indigo-500/30 text-indigo-400 hover:text-indigo-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md select-none"
                    >
                      {showImage ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showImage ? "Hide Cue Image" : "Show Cue Image"}
                    </button>

                    <AnimatePresence>
                      {showImage && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="w-[240px] h-[240px] aspect-square relative rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden flex items-center justify-center shadow-2xl animate-fade-in"
                        >
                          {imageLoading ? (
                            <div className="flex flex-col items-center justify-center gap-2">
                              <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                              <span className="text-[10px] text-zinc-550 font-mono tracking-tight">Fetching cue...</span>
                            </div>
                          ) : imageUrl ? (
                            <img
                              src={imageUrl}
                              alt="Vocabulary query context"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover select-none aspect-square"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                              <LucideImage className="w-8 h-8 text-zinc-600" />
                              <span className="text-[10px] text-zinc-550">No cue image found</span>
                            </div>
                          )}
                          <div className="absolute bottom-2 right-2 bg-black/85 text-[9px] text-zinc-400 font-mono px-2 py-0.5 rounded border border-white/5">
                            Tag: {currentWord.keyword || currentWord.german_word}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* HIGH SPEECH SYNTHESIS ROW */}
                  <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 mx-auto max-w-md mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner relative z-10">
                    <span className="text-xs text-zinc-400 flex items-center gap-2 font-semibold">
                      <Volume2 className="w-4 h-4 text-indigo-400" /> Pronunciation:
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => playTTS(currentWord.german_word, "normal")}
                        className="p-2 px-3 rounded-lg bg-zinc-900 border border-white/5 hover:border-indigo-500/30 hover:bg-zinc-800 text-zinc-300 text-xs font-bold select-none cursor-pointer flex items-center gap-1 transition-all"
                      >
                        🗣️ Normal
                      </button>
                      <button
                        onClick={() => playTTS(currentWord.german_word, "slow")}
                        className="p-2 px-3 rounded-lg bg-zinc-900 border border-white/5 hover:border-indigo-500/30 hover:bg-zinc-800 text-zinc-300 text-xs font-bold select-none cursor-pointer flex items-center gap-1 transition-all"
                      >
                        🐌 Slow
                      </button>
                      <button
                        onClick={() => playTTS(currentWord.german_word, "spell")}
                        className="p-2 px-3 rounded-lg bg-zinc-900 border border-white/5 hover:border-indigo-500/30 hover:bg-zinc-800 text-zinc-300 text-xs font-bold select-none cursor-pointer flex items-center gap-1 transition-all"
                      >
                        🔤 Spell
                      </button>
                    </div>
                  </div>

                  {/* MULTI CHOICES 4 GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2 relative z-10">
                    {[
                      currentWord.option_1,
                      currentWord.option_2,
                      currentWord.option_3,
                      currentWord.option_4,
                    ].map((opt, oIdx) => {
                      const isSelected = selectedAnswer === opt;
                      const isCorrectAnswer = opt.toLowerCase().trim() === currentWord.meaning.toLowerCase().trim();
                      const hasSelected = selectedAnswer !== null;

                      let btnStyle = "bg-zinc-950 border-white/5 text-zinc-300 hover:border-indigo-500/40 hover:bg-zinc-900";
                      let stateIcon = null;

                      if (hasSelected) {
                        if (isCorrectAnswer) {
                          btnStyle = "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-lg";
                          stateIcon = <Check className="w-4 h-4 text-emerald-400 shrink-0" />;
                        } else if (isSelected) {
                          btnStyle = "bg-red-500/10 border-red-500/50 text-red-400";
                          stateIcon = <X className="w-4 h-4 text-red-500 shrink-0" />;
                        } else {
                          btnStyle = "bg-zinc-950/20 border-white/2 opacity-40 text-zinc-500";
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={hasSelected}
                          onClick={() => handleAnswerClick(opt)}
                          className={`group w-full p-5 text-left font-semibold text-[15px] rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer select-none ${btnStyle}`}
                        >
                          <span className="truncate">{opt}</span>
                          {stateIcon}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* SELECTED RESULT PANEL */}
                <AnimatePresence>
                  {selectedAnswer !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="bg-zinc-900 border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden"
                    >
                      {selectedAnswer.toLowerCase().trim() === currentWord.meaning.toLowerCase().trim() ? (
                        <div className="flex items-center gap-3 text-emerald-400 font-sans font-black text-sm uppercase tracking-wider">
                          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <Check className="w-5 h-5 stroke-[3]" />
                          </div>
                          <span>Correct! Excellent job.</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5 text-red-450 font-sans font-black text-xs uppercase tracking-wider">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                              <X className="w-5 h-5 stroke-[3]" />
                            </div>
                            <span className="text-red-400">Incorrect! The correct answer is:</span>
                          </div>
                          <span className="text-white text-base font-extrabold normal-case pl-12">
                            "{currentWord.meaning}"
                          </span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            VIEW 2: BROWSE LEVEL LIST (REPLACES EXCEL PREVIEW TAB)
            ------------------------------------------------------------------- */}
        {activeView === "browse" && (
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-24 bg-indigo-500/2 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-white/10 relative z-10">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookmarkCheck className="w-5 h-5 text-indigo-400" /> Word Browser
                </h3>
                <p className="text-xs text-zinc-400">Review all vocab loaded in {selectedDay}</p>
              </div>

              {/* Dynamic search indexer */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Filter by German or English..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 focus:border-indigo-500 focus:outline-none text-xs px-4 py-2.5 rounded-xl text-zinc-200 placeholder-zinc-500 transition-all"
                />
              </div>
            </div>

            {filteredWords.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 text-xs font-mono relative z-10">
                No words matched your search criteria.
              </div>
            ) : (
              <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                      <th className="py-4 px-4">Emoji / Word</th>
                      <th className="py-4 px-4">Pronunciation</th>
                      <th className="py-4 px-4">English Meaning</th>
                      <th className="py-4 px-4">Context Sentence</th>
                      <th className="py-4 px-4 text-right">Speak Voice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs font-medium">
                    {filteredWords.map((word, idx) => (
                      <tr key={idx} className="hover:bg-zinc-950/40 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg shrink-0">{word.emoji || "🇩🇪"}</span>
                            <span className="font-extrabold text-white select-all">{word.german_word}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-[11px] text-zinc-450">
                          {word.pronunciation ? `/${word.pronunciation}/` : "-"}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-600/10 border border-indigo-500/15 text-indigo-400 text-[11px]">
                            {word.meaning}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-zinc-300 max-w-xs italic" title={word.example_sentence}>
                          {word.example_sentence ? formatExampleSentence(word.example_sentence, word.german_word) : "-"}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => playTTS(word.german_word, "normal")}
                            className="p-1.5 px-3 text-[10px] rounded-lg bg-zinc-950 hover:bg-indigo-600/15 text-zinc-400 hover:text-indigo-400 border border-white/5 transition-all flex items-center gap-1.5 inline-flex ml-auto cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            Listen
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 bg-zinc-950/80 py-8 text-center text-xs text-zinc-500 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-semibold text-zinc-400">
            German Vocab Coach • Learn Vocabulary Daily
          </p>
        </div>
      </footer>
    </div>
  );
}
