import React, { useState, useRef, useEffect } from "react";
import { 
  Send, Terminal, Play, Copy, Check, Code, Monitor, 
  Trash2, Loader2, Rocket, ExternalLink, User, MessageSquare, 
  Sparkles, Zap, Shield, Cpu, Layers, Box, LogOut, CreditCard,
  Settings, Users, BarChart, Crown, Upload, Image as ImageIcon,
  CheckCircle, XCircle, LogIn
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateGameCode, generateCharacterCode } from "./lib/gemini";
import { Message, CharacterResult, UserProfile } from "./types";
import { 
  auth, db, googleProvider, handleFirestoreError, OperationType 
} from "./firebase";
import { 
  signInWithPopup, onAuthStateChanged, signOut 
} from "firebase/auth";
import { 
  doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, where, serverTimestamp, addDoc 
} from "firebase/firestore";

type MainTab = "chat" | "run" | "character" | "vip" | "admin";

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
    
    const statusMessage: Message = {
      role: "model",
      text: "Espere um momento, estamos criando seu personagem 3D...",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, statusMessage]);

    try {
      const result = await generateCharacterCode(charInput);
      setCharResult(result);
      
      const aiMessage: Message = {
        role: "model",
        text: "Personagem 3D forjado com sucesso.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev.filter(m => m.text !== statusMessage.text), aiMessage]);
    } catch (error) {
      console.error("Char generation error:", error);
    } finally {
      setIsGeneratingChar(false);
    }
  };

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

        <nav className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
          {(["chat", "run", "character"] as MainTab[]).map((tab) => {
            return (
              <button
                key={tab}
                onClick={() => setActiveMainTab(tab)}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeMainTab === tab 
                    ? "bg-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.3)]" 
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                {tab === "chat" && <MessageSquare className="w-3.5 h-3.5" />}
                {tab === "run" && <Play className="w-3.5 h-3.5" />}
                {tab === "character" && <User className="w-3.5 h-3.5" />}
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
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                    <Sparkles className="w-16 h-16 text-orange-500 opacity-20" />
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black uppercase tracking-tighter">Neural Engine Ready</h2>
                      <p className="text-zinc-500 text-sm max-w-sm mx-auto">Command the AI to build your game vision. 2D or 3D, the engine will forge it.</p>
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

          {activeMainTab === "run" && (
            <motion.div key="run" className="flex-1 flex flex-col bg-zinc-950">
              <div className="flex-1 relative">
                {lastGeneratedCode ? (
                  <iframe srcDoc={lastGeneratedCode} className="w-full h-full border-none" sandbox="allow-scripts allow-modals allow-pointer-lock" />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-800 uppercase font-bold tracking-widest text-xs">No Active Build</div>
                )}
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
                  <button onClick={handleGenerateCharacter} className="w-full py-4 bg-white text-black font-black rounded-2xl uppercase tracking-tighter">Generate Character</button>
                </div>
                <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 overflow-auto">
                  {charResult ? <pre className="text-[10px] text-zinc-500">{charResult.code}</pre> : <div className="h-full flex items-center justify-center text-zinc-800 uppercase font-bold tracking-widest text-xs">Awaiting Parameters</div>}
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
