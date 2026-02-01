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
  const [syncStatus, setSyncStatus] = useState({ text: "(Cargando Ki...)", color: "#555" });
  const [isCharging, setIsCharging] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
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

    return () => subscription.unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      const { data: dbHabits, error: hError } = await supabaseClient
        .from('saiyan_habits')
        .select('*')
        .order('id', { ascending: true });

      if (hError) throw hError;
      setHabits(dbHabits || []);

      const { data: dbHistory, error: histError } = await supabaseClient
        .from('saiyan_history')
        .select('*');

      if (histError) throw histError;

      const historyMap: Record<string, number> = {};
      dbHistory?.forEach(row => {
        historyMap[row.date] = row.progress;
      });
      setHistory(historyMap);

      setSyncStatus({ text: "(Ki Sincronizado)", color: "#00ff00" });
    } catch (error) {
      setSyncStatus({ text: "(Error Cloud)", color: "#ff0000" });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabaseClient.auth.signInWithPassword(loginForm);
    if (error) setLoginError("Ki incorrecto o Guerrero no encontrado.");
  };

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    setSession(null);
    setHabits([]);
  };

  const saveState = async (updatedHabits: Habit[], habitId: number | null = null, syncProgress = true) => {
    const today = new Date().toISOString().split('T')[0];
    const completedCount = updatedHabits.filter(h => h.done).length;
    const progress = updatedHabits.length > 0 ? (completedCount / updatedHabits.length) * 100 : 0;

    if (syncProgress) setHistory(prev => ({ ...prev, [today]: progress }));

    try {
      setSyncStatus({ text: "(Sincronizando...)", color: "#ffcc00" });

      if (habitId !== null) {
        const habit = updatedHabits.find(h => h.id === habitId);
        if (habit) {
          await supabaseClient
            .from('saiyan_habits')
            .update({ done: habit.done, text: habit.text })
            .eq('id', habitId);
        }
      }

      if (syncProgress) {
        await supabaseClient.from('saiyan_history').upsert({ date: today, progress: progress });
      }

      setSyncStatus({ text: "(Ki Sincronizado)", color: "#00ff00" });
    } catch (error) {
      setSyncStatus({ text: "(Error Cloud)", color: "#ff0000" });
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

  const completedCount = habits.filter(h => h.done).length;
  const progressPercent = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;
  const currentKey = ['base', 'ssj', 'ssj2', 'ssj3', 'ssj4', 'ssj5'][completedCount] || 'base';
  const currentTransformation = TRANSFORMATIONS[currentKey];

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== currentTransformation.fallback) target.src = currentTransformation.fallback;
  };

  useEffect(() => {
    setIsCharging(true);
    const t = setTimeout(() => setIsCharging(false), 500);
    return () => clearTimeout(t);
  }, [completedCount]);

  const getWeeklyData = () => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const ds = d.toISOString().split('T')[0];
      return { name: d.toLocaleDateString('es-ES', { weekday: 'short' }), ki: history[ds] || 0 };
    });
  };

  if (!session) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex justify-center items-center p-6 z-[2000]">
        <div className="bg-[#111] border-2 border-dbz-orange rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
          <h2 className="font-bangers text-dbz-orange text-4xl mb-8">ENTRADA SAIYAN</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" className="w-full p-4 bg-[#000] border border-[#333] rounded-xl text-white outline-none focus:border-dbz-orange" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})}/>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="Contraseña" className="w-full p-4 bg-[#000] border border-[#333] rounded-xl text-white pr-12 outline-none focus:border-dbz-orange" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})}/>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-dbz-orange">{showPassword ? "🙈" : "👁️"}</button>
            </div>
            <button type="submit" className="w-full p-4 bg-dbz-orange rounded-xl font-bangers text-2xl text-white active:scale-95 transition-transform">ENTRAR</button>
          </form>
          {loginError && <p className="text-red-500 mt-4 text-xs font-bold">{loginError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6 pb-28 max-w-md mx-auto">
      <h1 className="font-bangers text-5xl text-dbz-orange drop-shadow-md mb-2 tracking-wider text-center uppercase">Saiyan Tracker</h1>
      <p className="font-bangers text-2xl mb-4" style={{ color: currentTransformation.textColor }}>{currentTransformation.name}</p>

      <audio ref={checkSoundRef} src="https://raw.githubusercontent.com/Luchovilla7/tracker-saiyajin/refs/heads/main/audio/check-ssj.mp3" preload="auto" />

      <div className={`relative w-full aspect-square max-w-[300px] flex justify-center items-center mb-6 ${isCharging ? 'animate-aura-shake' : ''}`}>
        <div className="absolute w-[70%] h-[90%] rounded-full blur-3xl opacity-60 transition-all duration-700" style={{ backgroundColor: currentTransformation.auraColor, boxShadow: `0 0 60px ${currentTransformation.auraColor}` }} />
        <img src={currentTransformation.image} alt="Goku" className="w-full h-full object-contain z-10 drop-shadow-2xl" onError={handleImageError} />
      </div>

      <div className="w-full h-6 bg-[#1a1a1a] border-2 border-[#333] rounded-full overflow-hidden mb-8 shadow-inner">
        <div className="h-full transition-all duration-700 ease-out" style={{ width: `${progressPercent}%`, background: currentTransformation.kiColor, boxShadow: `0 0 10px ${progressPercent > 80 ? '#fff' : '#ffcc00'}` }} />
      </div>

      <ul className="w-full space-y-3">
        {habits.slice(0, 5).map(habit => (
          <li key={habit.id} onClick={() => toggleHabit(habit.id)} className={`group relative bg-[#111] p-5 rounded-2xl flex items-center border-l-8 transition-all active:scale-[0.98] ${habit.done ? 'border-l-green-500 bg-[#0a110a]' : 'border-l-dbz-orange border-[#222]'}`}>
            <div className={`w-8 h-8 border-2 rounded-full mr-4 flex items-center justify-center flex-shrink-0 ${habit.done ? 'bg-green-500 border-green-500' : 'border-dbz-orange'}`}>
              {habit.done && <span className="text-black font-bold">✓</span>}
            </div>
            
            {editingId === habit.id ? (
              <input autoFocus className="flex-grow bg-transparent text-white border-b-2 border-dbz-orange outline-none text-lg py-1" value={tempText} onChange={e => setTempText(e.target.value)} onBlur={finishEditing} onKeyDown={e => e.key === 'Enter' && finishEditing()} onClick={e => e.stopPropagation()}/>
            ) : (
              <span className={`flex-grow text-lg font-medium pr-8 ${habit.done ? 'line-through text-gray-500' : 'text-white'}`} onClick={(e) => startEditing(e, habit)}>
                {habit.text}
              </span>
            )}

            <button onClick={(e) => startEditing(e, habit)} className="absolute right-4 text-gray-600 active:text-dbz-orange p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
            </button>
          </li>
        ))}
      </ul>

      <div className="w-full bg-[#0a110a] border border-green-900 rounded-3xl mt-10 p-5">
        <div className="flex justify-between items-center mb-4 px-1">
          <span className="font-bangers text-green-500 text-xl tracking-wider">Historial de Ki</span>
          <span className="text-[9px] font-bold" style={{ color: syncStatus.color }}>{syncStatus.text}</span>
        </div>
        <div className="h-32 w-full">
           <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getWeeklyData()}>
                <XAxis dataKey="name" hide />
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #00ff00', fontSize: '12px' }} />
                <Line type="monotone" dataKey="ki" stroke="#00ff00" strokeWidth={3} dot={{ r: 3, fill: '#00ff00' }} />
              </LineChart>
            </ResponsiveContainer>
        </div>
      </div>

      <button onClick={handleLogout} className="w-full mt-12 p-4 bg-red-700 text-white font-bangers text-2xl rounded-2xl active:scale-95 transition-all shadow-lg border-b-4 border-red-900">CERRAR SESIÓN</button>
    </div>
  );
};

export default App;