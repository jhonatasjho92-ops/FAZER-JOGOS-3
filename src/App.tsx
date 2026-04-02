import React, { useState, useRef, useEffect } from "react";
import { 
  Send, Terminal, Play, Copy, Check, Code, Monitor, 
  Trash2, Loader2, Rocket, ExternalLink, User, MessageSquare, 
  Sparkles, Zap, Shield, Cpu, Layers, Box, LogOut, CreditCard,
  Settings, Users, BarChart, Crown, Upload, Image as ImageIcon,
  CheckCircle, XCircle, LogIn, Map as MapIcon, Globe, Edit3, Download, Mic, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateGameCode, generateCharacterCode, generateMapCode, chatWithAI } from "./lib/gemini";
import { Message, CharacterResult, UserProfile, MainTab, GameProject, CharacterAsset, MapAsset } from "./types";
import { 
  auth, db, googleProvider, handleFirestoreError, OperationType 
} from "./firebase";
import { 
  signInWithPopup, onAuthStateChanged, signOut 
} from "firebase/auth";
import { 
  doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, where, serverTimestamp, addDoc 
} from "firebase/firestore";

const ADMIN_EMAIL = "jhonatasjho92@gmail.com";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedCode, setLastGeneratedCode] = useState("");
  
  const [charInput, setCharInput] = useState("");
  const [isGeneratingChar, setIsGeneratingChar] = useState(false);
  const [charResult, setCharResult] = useState<CharacterResult | null>(null);

  const [mapInput, setMapInput] = useState("");
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);
  const [mapResult, setMapResult] = useState<string>("");

  const [communityGames, setCommunityGames] = useState<GameProject[]>([]);
  const [myGames, setMyGames] = useState<GameProject[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user exists in Firestore
        const userDocRef = doc(db, "users", firebaseUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile);
          } else {
            // Create new user profile with automatic ULTRA VIP
            const newUser: UserProfile = {
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              role: firebaseUser.email === ADMIN_EMAIL ? "admin" : "user",
              vipStatus: "ultra",
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, {
              ...newUser,
              createdAt: serverTimestamp()
            });
            setUser(newUser);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time user profile updates
  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = onSnapshot(doc(db, "users", user.id), (doc) => {
      if (doc.exists()) {
        setUser(doc.data() as UserProfile);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.id}`);
    });
    return () => unsubscribe();
  }, [user?.id]);

  const handleExport = () => {
    if (!lastGeneratedCode) return;
    const blob = new Blob([lastGeneratedCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "game.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLaunch = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Shareable link copied to clipboard!");
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Login Error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      role: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    const statusMessage: Message = {
      role: "model",
      text: "Espere um momento, estamos gerando seu jogo...",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, statusMessage]);

    try {
      const result = await generateGameCode(input);
      const cleanedCode = result.replace(/^```html\n/, "").replace(/\n```$/, "").trim();
      
      const aiMessage: Message = {
        role: "model",
        text: "Jogo gerado com sucesso! Você pode executá-lo na aba 'Run Game'.",
        code: cleanedCode,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev.filter(m => m.text !== statusMessage.text), aiMessage]);
      setLastGeneratedCode(cleanedCode);
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCharacter = async () => {
    if (!charInput.trim() || isGeneratingChar) return;
    setIsGeneratingChar(true);
    try {
      const result = await generateCharacterCode(charInput);
      const cleanedCode = result.replace(/^```html\n/, "").replace(/\n```$/, "").trim();
      setCharResult({ code: cleanedCode });
    } catch (error) {
      console.error("Char generation error:", error);
    } finally {
      setIsGeneratingChar(false);
    }
  };

  const handleGenerateMap = async () => {
    if (!mapInput.trim() || isGeneratingMap) return;
    setIsGeneratingMap(true);
    try {
      const result = await generateMapCode(mapInput);
      const cleanedCode = result.replace(/^```html\n/, "").replace(/\n```$/, "").trim();
      setMapResult(cleanedCode);
    } catch (error) {
      console.error("Map generation error:", error);
    } finally {
      setIsGeneratingMap(false);
    }
  };

  const handleSaveGame = async (name: string, code: string) => {
    if (!user) return;
    try {
      const gameRef = collection(db, "games");
      await addDoc(gameRef, {
        userId: user.id,
        name,
        code,
        isPublic: false,
        plays: 0,
        rating: 0,
        createdAt: serverTimestamp()
      });
      alert("Game saved successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "games");
    }
  };

  const toggleVoice = () => {
    setIsVoiceActive(!isVoiceActive);
    if (!isVoiceActive) {
      // Simulate voice to text
      setTimeout(() => {
        setInput("Create a battle royale game with 3D graphics");
        setIsVoiceActive(false);
      }, 3000);
    }
  };

  // Listen for community games
  useEffect(() => {
    const q = query(collection(db, "games"), where("isPublic", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameProject));
      setCommunityGames(games);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "games");
    });
    return () => unsubscribe();
  }, []);

  // Listen for my games
  useEffect(() => {
    if (!user?.id) return;
    const q = query(collection(db, "games"), where("userId", "==", user.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameProject));
      setMyGames(games);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "games");
    });
    return () => unsubscribe();
  }, [user?.id]);

  if (loading || !isAuthReady) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
              <Cpu className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Aether Engine AI</h1>
            <p className="text-zinc-500 text-sm uppercase tracking-widest font-bold">Neural Access Required</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-zinc-200 transition-all uppercase tracking-tighter flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <LogIn className="w-5 h-5" />
              Entrar com Google
            </button>
            <p className="text-[10px] text-zinc-500 text-center uppercase font-bold tracking-widest">
              Secure authentication via Google Neural ID
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans flex flex-col overflow-hidden selection:bg-orange-500/30">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 bg-black/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-black border border-zinc-700 rounded-lg flex items-center justify-center">
            <Cpu className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="font-black tracking-tighter text-xl uppercase">
              Aether Engine <span className="text-orange-500">AI</span>
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold">Neural Game Generation</p>
              {user.vipStatus !== "none" && (
                <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 text-[8px] font-black uppercase rounded border border-yellow-500/20 flex items-center gap-1">
                  <Crown className="w-2 h-2" />
                  {user.vipStatus} VIP
                </span>
              )}
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 overflow-x-auto scrollbar-hide">
          {(["chat", "create", "run", "character", "map", "community", "editor", "admin"] as MainTab[]).map((tab) => {
            if (tab === "admin" && user.role !== "admin") return null;
            return (
              <button
                key={tab}
                onClick={() => setActiveMainTab(tab)}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeMainTab === tab 
                    ? "bg-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.3)]" 
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                {tab === "chat" && <MessageSquare className="w-3.5 h-3.5" />}
                {tab === "create" && <Sparkles className="w-3.5 h-3.5" />}
                {tab === "run" && <Play className="w-3.5 h-3.5" />}
                {tab === "character" && <User className="w-3.5 h-3.5" />}
                {tab === "map" && <MapIcon className="w-3.5 h-3.5" />}
                {tab === "community" && <Globe className="w-3.5 h-3.5" />}
                {tab === "editor" && <Edit3 className="w-3.5 h-3.5" />}
                {tab === "admin" && <Settings className="w-3.5 h-3.5" />}
                {tab}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">{user.email}</p>
            <p className="text-[8px] text-zinc-500 uppercase tracking-widest">{user.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-red-500 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeMainTab === "chat" && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-6"
            >
              <div className="flex-1 overflow-y-auto space-y-6 pr-4 scrollbar-hide">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
                    <div className="p-6 bg-zinc-900 rounded-full">
                      <Rocket className="w-12 h-12 text-orange-500" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black uppercase tracking-tighter">Neural Engine Ready</h2>
                      <p className="text-zinc-500 text-sm max-w-sm mx-auto">Command the AI to build your game vision. 2D or 3D, the engine will forge it.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 max-w-md w-full">
                      {[
                        "Create a 3D Space Shooter",
                        "Build a Zombie Survival Game",
                        "Generate a Cyberpunk Racing Game",
                        "Make a 3D Platformer with Physics"
                      ].map(p => (
                        <button 
                          key={p} 
                          onClick={() => setInput(p)}
                          className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:border-orange-500 hover:text-orange-500 transition-all text-left"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] space-y-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                        <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-1 ${msg.role === "user" ? "flex-row-reverse text-zinc-500" : "text-orange-500"}`}>
                          {msg.role === "user" ? <User className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
                          <span>{msg.role === "user" ? "Operator" : "Aether Core"}</span>
                        </div>
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user" 
                            ? "bg-orange-500 text-black font-medium" 
                            : "bg-zinc-900 border border-zinc-800 text-zinc-300"
                        }`}>
                          {msg.text}
                          {msg.code && (
                            <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Code Compiled</span>
                              <button onClick={() => setActiveMainTab("run")} className="px-3 py-1.5 bg-orange-500/10 text-orange-500 rounded-lg text-[10px] font-black uppercase">Run Game</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="mt-6 relative">
                <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-2 flex items-center gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe your game... (e.g. 'Create a 3D space shooter')"
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-3 resize-none h-12 scrollbar-hide"
                  />
                  <button
                    onClick={toggleVoice}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isVoiceActive ? "bg-red-500 text-white animate-pulse" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={isGenerating || !input.trim()}
                    className="w-12 h-12 bg-orange-500 text-black rounded-xl flex items-center justify-center hover:bg-orange-400 disabled:opacity-50 transition-all"
                  >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeMainTab === "create" && (
            <motion.div 
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center p-8 space-y-8"
            >
              <div className="text-center space-y-4">
                <Sparkles className="w-16 h-16 text-orange-500 mx-auto" />
                <h2 className="text-3xl font-black uppercase tracking-tighter">Forge Your World</h2>
                <p className="text-zinc-500 max-w-md mx-auto">Use the AI Chat to generate your game code, then run it in the engine.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
                  <h3 className="font-bold uppercase text-sm tracking-widest">Quick Templates</h3>
                  <div className="space-y-2">
                    {["3D Battle Royale", "2D Platformer", "Racing Simulator", "RPG Adventure"].map(t => (
                      <button 
                        key={t}
                        onClick={() => { setInput(`Create a ${t}`); setActiveMainTab("chat"); }}
                        className="w-full p-3 bg-black border border-zinc-800 rounded-xl text-left text-xs hover:border-orange-500 transition-all flex items-center justify-between"
                      >
                        {t}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
                  <h3 className="font-bold uppercase text-sm tracking-widest">My Projects</h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    {myGames.length === 0 ? (
                      <p className="text-zinc-600 text-[10px] uppercase font-bold text-center py-8">No saved projects</p>
                    ) : (
                      myGames.map(g => (
                        <div key={g.id} className="p-3 bg-black border border-zinc-800 rounded-xl flex items-center justify-between">
                          <span className="text-xs font-bold">{g.name}</span>
                          <div className="flex gap-2">
                            <button onClick={() => { setLastGeneratedCode(g.code); setActiveMainTab("run"); }} className="p-1.5 bg-orange-500/10 text-orange-500 rounded-lg"><Play className="w-3 h-3" /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeMainTab === "run" && (
            <motion.div key="run" className="flex-1 flex flex-col bg-zinc-950">
              <div className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Runtime Environment</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleExport} className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 hover:bg-zinc-700">
                    <Download className="w-3 h-3" />
                    Export HTML
                  </button>
                  <button onClick={handleLaunch} className="px-3 py-1.5 bg-orange-500 text-black rounded-lg text-[10px] font-black uppercase flex items-center gap-2 hover:bg-orange-400">
                    <Rocket className="w-3 h-3" />
                    Launch Game
                  </button>
                </div>
              </div>
              <div className="flex-1 relative">
                {lastGeneratedCode ? (
                  <iframe srcDoc={lastGeneratedCode} className="w-full h-full border-none" sandbox="allow-scripts allow-modals allow-pointer-lock" />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-800 uppercase font-bold tracking-widest text-xs">No Active Build</div>
                )}
              </div>
            </motion.div>
          )}

          {activeMainTab === "map" && (
            <motion.div key="map" className="flex-1 flex p-8 gap-8 max-w-7xl mx-auto w-full">
              <div className="flex-1 flex gap-8">
                <div className="w-[400px] space-y-6">
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Environment Forge</h2>
                  <textarea 
                    value={mapInput} 
                    onChange={(e) => setMapInput(e.target.value)}
                    placeholder="Describe your map... (e.g. 'Abandoned city with fog')" 
                    className="w-full h-40 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm"
                  />
                  <button 
                    onClick={handleGenerateMap} 
                    disabled={isGeneratingMap || !mapInput.trim()}
                    className="w-full py-4 bg-white text-black font-black rounded-2xl uppercase tracking-tighter flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-zinc-200 transition-all"
                  >
                    {isGeneratingMap ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Forging Map...
                      </>
                    ) : (
                      <>
                        <MapIcon className="w-5 h-5" />
                        Generate Map
                      </>
                    )}
                  </button>
                </div>
                <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 overflow-hidden relative group">
                  {mapResult ? (
                    <>
                      <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => { 
                            const blob = new Blob([mapResult], { type: "text/html" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "map.html";
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:text-white flex items-center gap-2 text-[10px] font-bold uppercase"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                        <button 
                          onClick={() => { setLastGeneratedCode(mapResult); setActiveMainTab("run"); }}
                          className="p-2 bg-orange-500 text-black rounded-lg hover:bg-orange-400 flex items-center gap-2 text-[10px] font-bold uppercase"
                        >
                          <Play className="w-3 h-3" />
                          Use in Engine
                        </button>
                        <button 
                          onClick={() => { navigator.clipboard.writeText(mapResult); alert("Code copied!"); }}
                          className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:text-white"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <iframe 
                        srcDoc={mapResult} 
                        className="w-full h-full border-none rounded-2xl" 
                        sandbox="allow-scripts"
                      />
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-800 uppercase font-bold tracking-widest text-xs">Awaiting Parameters</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeMainTab === "community" && (
            <motion.div key="community" className="flex-1 flex flex-col p-8 space-y-8 max-w-7xl mx-auto w-full overflow-y-auto">
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Neural Community</h2>
                <p className="text-zinc-500 text-sm uppercase tracking-widest font-bold">Explore games forged by other operators</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {communityGames.map(game => (
                  <div key={game.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 group hover:border-orange-500/50 transition-all">
                    <div className="h-40 bg-black rounded-2xl flex items-center justify-center border border-zinc-800 group-hover:border-orange-500/20">
                      <Play className="w-12 h-12 text-zinc-800 group-hover:text-orange-500 transition-all" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm uppercase">{game.name}</h3>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Plays: {game.plays}</p>
                      </div>
                      <button 
                        onClick={() => { setLastGeneratedCode(game.code); setActiveMainTab("run"); }}
                        className="p-3 bg-orange-500 text-black rounded-xl hover:bg-orange-400 transition-all"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeMainTab === "editor" && (
            <motion.div key="editor" className="flex-1 flex bg-zinc-950">
              <div className="w-64 border-r border-zinc-800 bg-zinc-900 p-4 space-y-6">
                <h3 className="font-bold uppercase text-xs tracking-widest text-zinc-500">Hierarchy</h3>
                <div className="space-y-2">
                  {["Scene", "Main Camera", "Directional Light", "Player", "Terrain"].map(o => (
                    <div key={o} className="p-2 bg-black border border-zinc-800 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 hover:border-orange-500 cursor-pointer">
                      <Box className="w-3 h-3 text-zinc-500" />
                      {o}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 flex flex-col">
                <div className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-4">
                  <button className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"><Zap className="w-4 h-4" /></button>
                  <button className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"><Layers className="w-4 h-4" /></button>
                  <button className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"><Box className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
                  <div className="text-zinc-800 uppercase font-black tracking-[0.5em] text-4xl">Visual Viewport</div>
                </div>
              </div>
              <div className="w-80 border-l border-zinc-800 bg-zinc-900 p-4 space-y-6">
                <h3 className="font-bold uppercase text-xs tracking-widest text-zinc-500">Inspector</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-600">Transform</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["X", "Y", "Z"].map(v => (
                        <div key={v} className="bg-black border border-zinc-800 p-2 rounded-lg text-center">
                          <span className="text-[8px] text-zinc-500 block">{v}</span>
                          <span className="text-xs font-bold">0.00</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeMainTab === "admin" && user.role === "admin" && (
            <motion.div key="admin" className="flex-1 flex flex-col p-8 space-y-8 max-w-7xl mx-auto w-full overflow-y-auto">
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Command Center</h2>
                <p className="text-zinc-500 text-sm uppercase tracking-widest font-bold">Platform Oversight & Control</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
                  <Users className="w-8 h-8 text-orange-500" />
                  <h3 className="font-bold uppercase text-sm tracking-widest">Users</h3>
                  <p className="text-2xl font-black">1,234</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
                  <Box className="w-8 h-8 text-orange-500" />
                  <h3 className="font-bold uppercase text-sm tracking-widest">Games</h3>
                  <p className="text-2xl font-black">{communityGames.length + myGames.length}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
                  <Globe className="w-8 h-8 text-orange-500" />
                  <h3 className="font-bold uppercase text-sm tracking-widest">Netlify Deploy</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    To deploy to Netlify:
                    <br />1. Export project to ZIP (Settings)
                    <br />2. Run 'npm run build' locally
                    <br />3. Drag 'dist' folder to Netlify
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeMainTab === "character" && (
            <motion.div key="character" className="flex-1 flex p-8 gap-8 max-w-7xl mx-auto w-full">
              <div className="flex-1 flex gap-8">
                <div className="w-[400px] space-y-6">
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Asset Forge</h2>
                  <textarea 
                    value={charInput} 
                    onChange={(e) => setCharInput(e.target.value)}
                    placeholder="Describe your character..." 
                    className="w-full h-40 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm"
                  />
                  <button 
                    onClick={handleGenerateCharacter} 
                    disabled={isGeneratingChar || !charInput.trim()}
                    className="w-full py-4 bg-white text-black font-black rounded-2xl uppercase tracking-tighter flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-zinc-200 transition-all"
                  >
                    {isGeneratingChar ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Forging Character...
                      </>
                    ) : (
                      <>
                        <User className="w-5 h-5" />
                        Generate Character
                      </>
                    )}
                  </button>
                </div>
                <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 overflow-hidden relative group">
                  {charResult ? (
                    <>
                      <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => { 
                            const blob = new Blob([charResult.code], { type: "text/html" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "character.html";
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:text-white flex items-center gap-2 text-[10px] font-bold uppercase"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                        <button 
                          onClick={() => { setLastGeneratedCode(charResult.code); setActiveMainTab("run"); }}
                          className="p-2 bg-orange-500 text-black rounded-lg hover:bg-orange-400 flex items-center gap-2 text-[10px] font-bold uppercase"
                        >
                          <Play className="w-3 h-3" />
                          Use in Engine
                        </button>
                        <button 
                          onClick={() => { navigator.clipboard.writeText(charResult.code); alert("Code copied!"); }}
                          className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:text-white"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <iframe 
                        srcDoc={charResult.code} 
                        className="w-full h-full border-none rounded-2xl" 
                        sandbox="allow-scripts"
                      />
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-800 uppercase font-bold tracking-widest text-xs">Awaiting Parameters</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="h-10 border-t border-zinc-800 bg-black flex items-center px-8 text-[10px] text-zinc-600 uppercase tracking-[0.2em] justify-between">
        <div className="flex gap-8 items-center">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
            <span>System: Optimal</span>
          </div>
          <span>Engine: Gemini-3-Flash</span>
        </div>
        <div>© 2026 Aether Neural Systems</div>
      </footer>
    </div>
  );
}
