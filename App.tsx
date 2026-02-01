import React, { useState, useEffect, useRef } from 'react';
import { supabaseClient } from './services/supabase';
import { Habit, Transformation } from './types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TRANSFORMATIONS: Record<string, Transformation> = {
  base: {
    image: "https://raw.githubusercontent.com/Luchovilla7/tracker-saiyajin/refs/heads/main/img/goku-base.png",
    fallback: "https://www.pngmart.com/files/2/Goku-PNG-File.png",
    name: "ESTADO: BASE",
    auraColor: "rgba(255,255,255,0.3)",
    kiColor: "linear-gradient(90deg, #fceabb 0%, #f8b500 100%)",
    textColor: "#ffcc00"
  },
  ssj: {
    image: "https://raw.githubusercontent.com/Luchovilla7/tracker-saiyajin/refs/heads/main/img/goku-ssj.png",
    fallback: "https://www.pngmart.com/files/2/Goku-Super-Saiyan-PNG-Clipart.png",
    name: "SUPER SAIYAJIN",
    auraColor: "rgba(255, 204, 0, 0.7)",
    kiColor: "linear-gradient(90deg, #fceabb 0%, #f8b500 100%)",
    textColor: "#ffcc00"
  },
  ssj2: {
    image: "https://raw.githubusercontent.com/Luchovilla7/tracker-saiyajin/refs/heads/main/img/goku-ssj2.png",
    fallback: "https://www.pngmart.com/files/2/Goku-Super-Saiyan-PNG-Photos.png",
    name: "SUPER SAIYAJIN FASE 2",
    auraColor: "rgba(255, 255, 0, 0.8)",
    kiColor: "linear-gradient(90deg, #fceabb 0%, #f8b500 100%)",
    textColor: "#ffcc00"
  },
  ssj3: {
    image: "https://raw.githubusercontent.com/Luchovilla7/tracker-saiyajin/refs/heads/main/img/goku-ssj3.png",
    fallback: "https://www.pngmart.com/files/2/Goku-Super-Saiyan-3-PNG-Photos.png",
    name: "SUPER SAIYAJIN FASE 3",
    auraColor: "rgba(255, 215, 0, 0.9)",
    kiColor: "linear-gradient(90deg, #fceabb 0%, #f8b500 100%)",
    textColor: "#ffcc00"
  },
  ssj4: {
    image: "https://raw.githubusercontent.com/Luchovilla7/tracker-saiyajin/refs/heads/main/img/goku-ssj4.png",
    fallback: "https://www.pngmart.com/files/2/Goku-Super-Saiyan-4-PNG-Pic.png",
    name: "SUPER SAIYAJIN FASE 4",
    auraColor: "rgba(255, 0, 0, 0.8)",
    kiColor: "linear-gradient(90deg, #7b0000 0%, #ff0000 100%)",
    textColor: "#ff4444"
  },
  ssj5: {
    image: "https://raw.githubusercontent.com/Luchovilla7/tracker-saiyajin/refs/heads/main/img/goku-ssj5.png",
    fallback: "https://www.pngmart.com/files/2/Goku-Ultra-Instinct-PNG-Transparent.png",
    name: "SUPER SAIYAJIN FASE 5 (AF)",
    auraColor: "rgba(220, 220, 220, 0.9)",
    kiColor: "linear-gradient(90deg, #999 0%, #ffffff 100%)",
    textColor: "#ffffff"
  }
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [history, setHistory] = useState<Record<string, number>>({});
  const [syncStatus, setSyncStatus] = useState({ text: "(Sincronizado)", color: "#00ff00" });
  const [isCharging, setIsCharging] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempText, setTempText] = useState('');

  const checkSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadData();
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadData();
    });

    // Escuchar el evento de instalación
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      const { data: dbHabits } = await supabaseClient.from('saiyan_habits').select('*').order('id', { ascending: true });
      setHabits(dbHabits || []);
      const { data: dbHistory } = await supabaseClient.from('saiyan_history').select('*');
      const historyMap: Record<string, number> = {};
      dbHistory?.forEach(row => { historyMap[row.date] = row.progress; });
      setHistory(historyMap);
    } catch (e) { console.error(e); }
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  const toggleHabit = (id: number) => {
    if (editingId === id) return;
    const newHabits = habits.map(h => {
      if (h.id === id) {
        const newDone = !h.done;
        if (newDone && checkSoundRef.current) {
          checkSoundRef.current.currentTime = 0;
          checkSoundRef.current.play().catch(() => {});
        }
        return { ...h, done: newDone };
      }
      return h;
    });
    setHabits(newHabits);
    saveState(newHabits, id);
  };

  const startEditing = (e: React.MouseEvent, habit: Habit) => {
    e.stopPropagation();
    setEditingId(habit.id);
    setTempText(habit.text);
  };

  const finishEditing = () => {
    if (editingId === null) return;
    const newHabits = habits.map(h => h.id === editingId ? { ...h, text: tempText.trim() || h.text } : h);
    setHabits(newHabits);
    saveState(newHabits, editingId, false);
    setEditingId(null);
  };

  const saveState = async (updatedHabits: Habit[], habitId: number | null, syncHistory = true) => {
    const today = new Date().toISOString().split('T')[0];
    const progress = updatedHabits.length > 0 ? (updatedHabits.filter(h => h.done).length / updatedHabits.length) * 100 : 0;
    if (syncHistory) setHistory(prev => ({ ...prev, [today]: progress }));
    
    setSyncStatus({ text: "(Actualizando Ki...)", color: "#ffcc00" });
    try {
      if (habitId !== null) {
        const h = updatedHabits.find(x => x.id === habitId);
        if (h) await supabaseClient.from('saiyan_habits').update({ done: h.done, text: h.text }).eq('id', habitId);
      }
      if (syncHistory) await supabaseClient.from('saiyan_history').upsert({ date: today, progress });
      setSyncStatus({ text: "(Ki Sincronizado)", color: "#00ff00" });
    } catch (e) { setSyncStatus({ text: "(Error)", color: "#f00" }); }
  };

  const completedCount = habits.filter(h => h.done).length;
  const progressPercent = (completedCount / 5) * 100;
  const currentKey = ['base', 'ssj', 'ssj2', 'ssj3', 'ssj4', 'ssj5'][completedCount] || 'base';
  const currentTransformation = TRANSFORMATIONS[currentKey];

  if (!session) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col justify-center items-center p-8 z-[5000]">
        <h1 className="font-bangers text-5xl text-dbz-orange mb-10 tracking-tighter text-center">SAIYAN TRACKER</h1>
        <div className="bg-[#111] p-8 rounded-3xl w-full max-w-sm border border-dbz-orange/30 shadow-2xl">
          <form onSubmit={async (e) => { e.preventDefault(); const {error} = await supabaseClient.auth.signInWithPassword(loginForm); if(error) setLoginError("Ki Inválido"); }} className="space-y-5">
            <input type="email" placeholder="Email" className="w-full p-4 bg-black border border-white/10 rounded-xl text-white outline-none focus:border-dbz-orange" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
            <input type="password" placeholder="Pass" className="w-full p-4 bg-black border border-white/10 rounded-xl text-white outline-none focus:border-dbz-orange" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            <button type="submit" className="w-full p-4 bg-dbz-orange text-white font-bangers text-2xl rounded-xl active:scale-95 transition-all">ENTRAR</button>
          </form>
          {loginError && <p className="text-red-500 mt-4 text-center font-bold">{loginError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-5 pb-32 max-w-md mx-auto relative overflow-x-hidden">
      {deferredPrompt && (
        <button onClick={handleInstall} className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[1000] bg-dbz-orange text-white px-8 py-4 rounded-full font-bangers text-xl shadow-[0_0_20px_#FF9000] border-2 border-white/20 animate-bounce">
          ⚡ INSTALAR APP SAIYAN ⚡
        </button>
      )}

      <h1 className="font-bangers text-5xl text-dbz-orange mb-2 drop-shadow-lg">SAIYAN TRACKER</h1>
      <p className="font-bangers text-2xl mb-4 transition-colors duration-500" style={{ color: currentTransformation.textColor }}>{currentTransformation.name}</p>

      <audio ref={checkSoundRef} src="https://raw.githubusercontent.com/Luchovilla7/tracker-saiyajin/refs/heads/main/audio/check-ssj.mp3" preload="auto" />

      <div className={`relative w-64 h-64 mb-10 transition-transform duration-300 ${isCharging ? 'scale-110' : 'scale-100'}`}>
        <div className="absolute inset-0 rounded-full blur-[50px] opacity-40 animate-pulse" style={{ backgroundColor: currentTransformation.auraColor }} />
        <img src={currentTransformation.image} alt="Goku" className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" onError={(e) => (e.currentTarget.src = currentTransformation.fallback)} />
      </div>

      <div className="w-full h-4 bg-[#111] rounded-full mb-10 border border-white/10 shadow-inner overflow-hidden">
        <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%`, background: currentTransformation.kiColor, boxShadow: `0 0 10px ${currentTransformation.textColor}` }} />
      </div>

      <ul className="w-full space-y-4">
        {habits.slice(0, 5).map(habit => (
          <li key={habit.id} onClick={() => toggleHabit(habit.id)} className={`relative bg-[#0d0d0d] p-5 rounded-2xl flex items-center border-l-4 transition-all active:scale-95 ${habit.done ? 'border-green-500 bg-[#0a110a]' : 'border-dbz-orange border-white/5'}`}>
            <div className={`w-8 h-8 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 ${habit.done ? 'bg-green-500 border-green-500' : 'border-dbz-orange'}`}>
              {habit.done && <span className="text-black font-bold">✓</span>}
            </div>
            
            {editingId === habit.id ? (
              <input autoFocus className="flex-grow bg-transparent text-white border-b-2 border-dbz-orange outline-none py-1 text-lg" value={tempText} onChange={e => setTempText(e.target.value)} onBlur={finishEditing} onKeyDown={e => e.key === 'Enter' && finishEditing()} onClick={e => e.stopPropagation()}/>
            ) : (
              <span className={`flex-grow text-lg font-bold pr-8 ${habit.done ? 'line-through text-gray-600' : 'text-white'}`} onClick={(e) => startEditing(e, habit)}>
                {habit.text}
              </span>
            )}
            
            <button onClick={(e) => startEditing(e, habit)} className="absolute right-4 text-white/20 hover:text-dbz-orange transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
            </button>
          </li>
        ))}
      </ul>

      <div className="w-full bg-[#050505] p-5 rounded-3xl mt-12 border border-white/5">
        <div className="flex justify-between items-center mb-5">
           <span className="font-bangers text-green-500 text-xl">NIVEL DE KI</span>
           <span className="text-[9px] font-bold" style={{ color: syncStatus.color }}>{syncStatus.text}</span>
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={Object.entries(history).map(([date, val]) => ({ date, ki: val })).slice(-7)}>
              <Line type="stepAfter" dataKey="ki" stroke="#00ff00" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <button onClick={() => supabaseClient.auth.signOut()} className="mt-12 text-white/30 font-bold tracking-widest hover:text-red-500 transition-colors">ABANDONAR ENTRENAMIENTO</button>
    </div>
  );
};

export default App;