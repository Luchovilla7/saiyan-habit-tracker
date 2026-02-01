import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabaseClient } from './services/supabase';
import { Habit, HistoryRecord, Transformation } from './types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// The Transformation objects now correctly match the interface in types.ts
const TRANSFORMATIONS: Record<string, Transformation> = {
  base: {
    image: "./assets/img/goku-base.png",
    fallback: "https://www.pngmart.com/files/2/Goku-PNG-File.png",
    name: "ESTADO: BASE",
    auraColor: "rgba(255,255,255,0.3)",
    kiColor: "linear-gradient(90deg, #fceabb 0%, #f8b500 100%)",
    textColor: "#ffcc00"
  },
  ssj: {
    image: "./assets/img/goku-ssj.png",
    fallback: "https://www.pngmart.com/files/2/Goku-Super-Saiyan-PNG-Clipart.png",
    name: "SUPER SAIYAJIN",
    auraColor: "rgba(255, 204, 0, 0.7)",
    kiColor: "linear-gradient(90deg, #fceabb 0%, #f8b500 100%)",
    textColor: "#ffcc00"
  },
  ssj2: {
    image: "./assets/img/goku-ssj2.png",
    fallback: "https://www.pngmart.com/files/2/Goku-Super-Saiyan-PNG-Clipart.png",
    name: "SUPER SAIYAJIN FASE 2",
    auraColor: "rgba(255, 255, 0, 0.8)",
    kiColor: "linear-gradient(90deg, #fceabb 0%, #f8b500 100%)",
    textColor: "#ffcc00"
  },
  ssj3: {
    image: "./assets/img/goku-ssj3.png",
    fallback: "https://www.pngmart.com/files/2/Goku-Super-Saiyan-3-PNG-Photos.png",
    name: "SUPER SAIYAJIN FASE 3",
    auraColor: "rgba(255, 215, 0, 0.9)",
    kiColor: "linear-gradient(90deg, #fceabb 0%, #f8b500 100%)",
    textColor: "#ffcc00"
  },
  ssj4: {
    image: "./assets/img/goku-ssj4.png",
    fallback: "https://www.pngmart.com/files/2/Goku-Super-Saiyan-4-PNG-Pic.png",
    name: "SUPER SAIYAJIN FASE 4",
    auraColor: "rgba(255, 0, 0, 0.8)",
    kiColor: "linear-gradient(90deg, #7b0000 0%, #ff0000 100%)",
    textColor: "#ff4444"
  },
  ssj5: {
    image: "./assets/img/goku-ssj5.png",
    fallback: "https://www.pngmart.com/files/2/Goku-Ultra-Instinct-PNG-Transparent.png",
    name: "¡SUPER SAIYAJIN FASE 5 (AF)!",
    auraColor: "rgba(220, 220, 220, 0.9)",
    kiColor: "linear-gradient(90deg, #999 0%, #ffffff 100%)",
    textColor: "#ffffff"
  }
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [history, setHistory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState({ text: "(Cargando Ki...)", color: "#555" });
  const [isCharging, setIsCharging] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const checkSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadData();
      else setLoading(false);
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
      console.error("Error loading data:", error);
      setSyncStatus({ text: "(Error de Ki)", color: "#ff0000" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabaseClient.auth.signInWithPassword(loginForm);
    if (error) {
      setLoginError("Error: El Ki no coincide o usuario no existe.");
    } else {
      setLoginError('');
    }
  };

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    setSession(null);
    setHabits([]);
    setHistory({});
  };

  const saveState = async (updatedHabits: Habit[], habitId: number | null = null) => {
    const today = new Date().toISOString().split('T')[0];
    const completedCount = updatedHabits.filter(h => h.done).length;
    const progress = updatedHabits.length > 0 ? (completedCount / updatedHabits.length) * 100 : 0;

    const newHistory = { ...history, [today]: progress };
    setHistory(newHistory);

    try {
      setSyncStatus({ text: "(Sincronizando...)", color: "#ffcc00" });

      if (habitId !== null) {
        const habit = updatedHabits.find(h => h.id === habitId);
        if (habit) {
          await supabaseClient
            .from('saiyan_habits')
            .update({ done: habit.done })
            .eq('id', habitId);
        }
      }

      await supabaseClient
        .from('saiyan_history')
        .upsert({ date: today, progress: progress });

      setSyncStatus({ text: "(Ki Sincronizado)", color: "#00ff00" });
    } catch (error) {
      console.error("Error saving state:", error);
      setSyncStatus({ text: "(Cloud Desconectado)", color: "#ff0000" });
    }
  };

  const toggleHabit = (id: number) => {
    const newHabits = habits.map(h => {
      if (h.id === id) {
        const newDone = !h.done;
        if (newDone && checkSoundRef.current) {
          checkSoundRef.current.currentTime = 0;
          checkSoundRef.current.play().catch(e => {
            console.warn("Audio local no disponible o bloqueado. Intentando reproducir.");
          });
        }
        return { ...h, done: newDone };
      }
      return h;
    });
    setHabits(newHabits);
    saveState(newHabits, id);
  };

  // Reordered: Calculate current transformation values before defining handleImageError
  const completedCount = habits.filter(h => h.done).length;
  const totalHabits = habits.length;
  const progressPercent = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;
  
  const transformationOrder = ['base', 'ssj', 'ssj2', 'ssj3', 'ssj4', 'ssj5'];
  const currentKey = transformationOrder[completedCount] || 'base';
  const currentTransformation = TRANSFORMATIONS[currentKey];

  // handleImageError now correctly identifies fallback property on the Transformation type
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    const currentTrans = TRANSFORMATIONS[currentKey];
    if (target.src !== currentTrans.fallback) {
      console.warn(`Asset local no encontrado: ${target.src}. Cargando fallback de red.`);
      target.src = currentTrans.fallback || "https://api.dicebear.com/7.x/bottts/svg?seed=goku";
    }
  };

  useEffect(() => {
    setIsCharging(true);
    const timer = setTimeout(() => setIsCharging(false), 500);
    return () => clearTimeout(timer);
  }, [completedCount]);

  const getWeeklyData = () => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      return {
        name: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        ki: history[dateStr] || 0
      };
    });
  };

  const getMonthlyData = () => {
    const today = new Date();
    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date();
      const idx = i as number;
      date.setDate(today.getDate() - ((4 - idx) * 7));
      return {
        name: `Sem -${4 - idx}`,
        ki: (Object.entries(history) as [string, number][])
          .filter(([d]) => new Date(d) <= date && new Date(d) > new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000))
          .reduce((acc: number, [, v]: [string, number], _idx: number, arr: [string, number][]) => acc + (v / (arr.length || 1)), 0) || 0
      };
    });
  };

  const allValues = Object.values(history) as number[];
  const avgPwr = allValues.length ? allValues.reduce((a, b) => a + b, 0) / allValues.length : 0;

  if (!session) {
    return (
      <div className="fixed inset-0 bg-[radial-gradient(circle,_#1a1a1a_0%,_#000_100%)] flex justify-center items-center p-5 z-[1000]">
        <div className="bg-[rgba(0,20,0,0.95)] border-2 border-dbz-orange rounded-[20px] p-10 w-full max-w-[400px] shadow-[0_0_30px_rgba(255,144,0,0.2)] text-center">
          <h2 className="font-bangers text-dbz-orange text-[2.5rem] mb-8 tracking-[2px]">ENTRADA SAIYAN</h2>
          <form onSubmit={handleLogin}>
            <input 
              type="email" 
              className="w-full p-4 mb-5 bg-[#111] border border-[#333] rounded-lg text-white" 
              placeholder="Email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
            />
            <div className="relative mb-5">
              <input 
                type={showPassword ? "text" : "password"} 
                className="w-full p-4 bg-[#111] border border-[#333] rounded-lg text-white pr-12" 
                placeholder="Contraseña"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-dbz-orange text-xl hover:text-white transition-colors"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <button type="submit" className="w-full p-4 bg-dbz-orange rounded-lg font-bangers text-2xl text-white hover:bg-[#ffaa33] transition-all">ENTRAR A ENTRENAR</button>
          </form>
          {loginError && <p className="text-red-500 mt-5 text-sm">{loginError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-5 pb-20">
      <h1 className="font-bangers text-[3.5rem] text-dbz-orange drop-shadow-[4px_4px_0px_#0046AD] mb-1 tracking-widest text-center">SAIYAN TRACKER</h1>
      
      <div className="h-10 text-center mb-4">
        <span className="font-bangers text-2xl" style={{ color: currentTransformation.textColor }}>
            {currentTransformation.name}
        </span>
      </div>

      <audio ref={checkSoundRef} src="./assets/audio/check-ssj.mp3" preload="auto" />

      <div className={`relative w-[300px] h-[350px] flex justify-center items-center mb-5 ${isCharging ? 'animate-aura-shake' : ''}`}>
        <div 
          className="absolute w-[180px] h-[280px] rounded-[50%_50%_20%_20%] blur-[40px] z-1 transition-all duration-700 mix-blend-screen"
          style={{ 
            opacity: completedCount > 0 ? 1 : 0, 
            backgroundColor: currentTransformation.auraColor,
            boxShadow: `0 0 60px 30px ${currentTransformation.auraColor}` 
          }}
        />
        <img 
          src={currentTransformation.image} 
          alt={currentTransformation.name} 
          className="w-full h-full object-contain z-[2] drop-shadow-lg transition-opacity duration-300"
          onError={handleImageError}
        />
      </div>

      <div className="w-full max-w-[450px] h-[25px] bg-[#222] border-2 border-[#444] rounded-full overflow-hidden mb-8 shadow-[inset_0_0_10px_#000]">
        <div 
          className="h-full transition-all duration-700 ease-out"
          style={{ 
            width: `${progressPercent}%`,
            background: currentTransformation.kiColor,
            boxShadow: `0 0 15px ${completedCount === 5 ? '#fff' : (completedCount > 3 ? '#f00' : '#ffcc00')}`
          }}
        />
      </div>

      <ul className="w-full max-w-[450px] space-y-3">
        {habits.slice(0, 5).map(habit => (
          <li 
            key={habit.id}
            onClick={() => toggleHabit(habit.id)}
            className={`group bg-[#1a1a1a] p-4 rounded-xl flex items-center cursor-pointer transition-all border border-[#333] border-l-[6px] ${habit.done ? 'border-l-green-500 bg-[#0f1a0f] opacity-80' : 'border-l-dbz-orange hover:bg-[#252525] hover:translate-x-1'}`}
          >
            <div className={`w-7 h-7 border-2 rounded-full mr-4 flex items-center justify-center font-bold text-sm ${habit.done ? 'bg-green-500 border-green-500 text-black' : 'border-dbz-orange text-transparent'}`}>
              ✓
            </div>
            <span className={`flex-grow text-lg ${habit.done ? 'line-through text-gray-500' : 'text-white'}`}>
              {habit.text}
            </span>
          </li>
        ))}
      </ul>

      <div className="w-full max-w-[800px] bg-[rgba(0,20,0,0.9)] border-2 border-green-500 rounded-2xl mt-10 p-5 shadow-[0_0_20px_rgba(0,255,0,0.3)]">
        <div className="font-bangers text-[#00ff00] text-2xl text-center border-b border-green-500 pb-3 mb-5 flex justify-between">
          <span>Análisis de Ki</span>
          <span className="text-xs" style={{ color: syncStatus.color }}>{syncStatus.text}</span>
        </div>
        
        <div className="h-[200px] w-full">
           <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getWeeklyData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#004400" />
                <XAxis dataKey="name" stroke="#00ff00" fontSize={10} />
                <YAxis domain={[0, 100]} stroke="#00ff00" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#002200', borderColor: '#00ff00' }} itemStyle={{ color: '#00ff00' }} />
                <Line type="monotone" dataKey="ki" stroke="#00ff00" strokeWidth={3} dot={{ fill: '#00ff00' }} />
              </LineChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default App;
