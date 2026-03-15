'use client';

import { useStore } from '@/lib/store';
import { Heart, Diamond, Flame, Settings, LogOut, LogIn, Swords } from 'lucide-react';
import Link from 'next/link';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

export function TopBar() {
  const { user, hearts, gems, streak, currentLanguage, setLanguage } = useStore();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-2xl font-bold text-green-500 tracking-tight">
          CodeLingo
        </Link>
        <select
          value={currentLanguage}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-3 py-1.5 text-sm font-semibold focus:ring-2 focus:ring-green-500 outline-none cursor-pointer hidden sm:block"
        >
          <option value="python">🐍 Python</option>
          <option value="javascript">🟨 JavaScript</option>
          <option value="html">🌐 HTML/CSS</option>
          <option value="java">☕ Java</option>
          <option value="csharp">🔷 C#</option>
          <option value="cpp">⚙️ C++</option>
          <option value="php">🐘 PHP</option>
          <option value="typescript">📘 TypeScript</option>
        </select>
        
        {user && (
          <Link href="/duels" className="hidden sm:flex items-center gap-2 text-blue-500 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-xl transition-colors">
            <Swords className="w-5 h-5" />
            Duelos
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4 sm:gap-6 font-bold text-sm">
        <div className="flex items-center gap-1.5 text-orange-500">
          <Flame className="w-5 h-5 fill-current" />
          <span>{streak}</span>
        </div>
        <div className="flex items-center gap-1.5 text-blue-500">
          <Diamond className="w-5 h-5 fill-current" />
          <span>{gems}</span>
        </div>
        <div className="flex items-center gap-1.5 text-red-500">
          <Heart className="w-5 h-5 fill-current" />
          <span>{hearts}</span>
        </div>
        
        {user ? (
          <div className="flex items-center gap-3 ml-2 border-l border-zinc-200 dark:border-zinc-800 pl-4">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                {user.displayName?.[0] || user.email?.[0] || '?'}
              </div>
            )}
            <button onClick={handleLogout} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors" title="Sair">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button onClick={handleLogin} className="ml-2 flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-colors border-b-4 border-blue-700 active:border-b-0 active:translate-y-1">
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">Entrar</span>
          </button>
        )}
      </div>
    </div>
  );
}
