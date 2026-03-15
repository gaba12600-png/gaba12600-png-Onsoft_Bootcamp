'use client';

import { useStore } from '@/lib/store';
import { courses } from '@/lib/data/courses';
import { TopBar } from '@/components/top-bar';
import Link from 'next/link';
import { CheckCircle2, Lock, Play, Star, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';

export default function Home() {
  const { user, currentLanguage, completedLessons, checkStreak } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkStreak();
  }, [checkStreak]);

  if (!mounted) return null;

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex flex-col">
        <TopBar />
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-green-500 mb-6 tracking-tight">CodeLingo</h1>
          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-md mb-8">
            Aprenda a programar de forma divertida, gratuita e viciante.
          </p>
          <button 
            onClick={handleLogin}
            className="flex items-center gap-3 bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all border-b-4 border-blue-700 active:border-b-0 active:translate-y-1"
          >
            <LogIn className="w-6 h-6" />
            Começar Agora (Login com Google)
          </button>
        </main>
      </div>
    );
  }

  const course = courses[currentLanguage];

  if (!course) {
    return <div>Curso não encontrado.</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      <TopBar />
      
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-12">
          {/* Mobile AI Button */}
          <div className="lg:hidden bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-sm mb-8">
            <h3 className="text-xl font-bold mb-2">Desafio com IA ✨</h3>
            <p className="text-purple-100 mb-4 text-sm">Gere um novo nível personalizado agora mesmo!</p>
            <button 
              onClick={async () => {
                const btn = document.getElementById('ai-btn-mobile');
                if (btn) btn.innerText = 'Gerando...';
                try {
                  const res = await fetch('/api/generate-lesson', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ language: currentLanguage })
                  });
                  const data = await res.json();
                  if (data && data.exercises) {
                    localStorage.setItem('codelingo-ai-lesson', JSON.stringify(data));
                    window.location.href = `/lesson/${currentLanguage}/ai/challenge`;
                  }
                } catch (error) {
                  console.error(error);
                  alert('Erro ao gerar lição com IA');
                  if (btn) btn.innerText = 'Gerar Nível';
                }
              }}
              id="ai-btn-mobile"
              className="w-full bg-white text-purple-600 font-bold py-3 rounded-xl border-b-4 border-purple-200 active:border-b-0 active:translate-y-1 transition-all"
            >
              Gerar Nível
            </button>
          </div>

          {course.units.map((unit, unitIndex) => (
            <div key={unit.id} className="relative">
              {/* Unit Header */}
              <div className="bg-green-500 text-white rounded-2xl p-6 mb-8 shadow-sm">
                <h2 className="text-2xl font-bold mb-2">Unidade {unitIndex + 1}: {unit.title}</h2>
                <p className="text-green-100 font-medium">{unit.description}</p>
              </div>

              {/* Lessons Path */}
              <div className="flex flex-col items-center space-y-8 relative">
                {/* Connecting Line */}
                <div className="absolute top-0 bottom-0 w-2 bg-zinc-200 dark:bg-zinc-800 -z-10 rounded-full left-1/2 -translate-x-1/2" />

                {unit.lessons.map((lesson, lessonIndex) => {
                  const lessonId = `${course.id}-${unit.id}-${lesson.id}`;
                  const isCompleted = completedLessons.includes(lessonId);
                  
                  // Determine if unlocked (first lesson or previous lesson completed)
                  let isUnlocked = false;
                  if (unitIndex === 0 && lessonIndex === 0) {
                    isUnlocked = true;
                  } else if (lessonIndex > 0) {
                    const prevLessonId = `${course.id}-${unit.id}-${unit.lessons[lessonIndex - 1].id}`;
                    isUnlocked = completedLessons.includes(prevLessonId);
                  } else if (unitIndex > 0) {
                    const prevUnit = course.units[unitIndex - 1];
                    const prevLessonId = `${course.id}-${prevUnit.id}-${prevUnit.lessons[prevUnit.lessons.length - 1].id}`;
                    isUnlocked = completedLessons.includes(prevLessonId);
                  }

                  // Zigzag pattern
                  const isEven = lessonIndex % 2 === 0;
                  const offsetClass = isEven ? 'translate-x-[-40px]' : 'translate-x-[40px]';

                  return (
                    <div key={lesson.id} className={`relative flex flex-col items-center group ${offsetClass}`}>
                      {/* Tooltip */}
                      <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 whitespace-nowrap z-20 pointer-events-none font-bold text-sm">
                        {lesson.title}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-zinc-800 border-b border-r border-zinc-200 dark:border-zinc-700 transform rotate-45" />
                      </div>

                      {isUnlocked ? (
                        <Link href={`/lesson/${course.id}/${unit.id}/${lesson.id}`}>
                          <button className={`w-20 h-20 rounded-full flex items-center justify-center border-b-8 active:border-b-0 active:translate-y-2 transition-all shadow-sm ${
                            isCompleted 
                              ? 'bg-yellow-400 border-yellow-500 text-white' 
                              : 'bg-green-500 border-green-600 text-white'
                          }`}>
                            {isCompleted ? <Star className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 ml-1 fill-current" />}
                          </button>
                        </Link>
                      ) : (
                        <button disabled className="w-20 h-20 rounded-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 border-b-8 border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 cursor-not-allowed">
                          <Lock className="w-8 h-8" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block space-y-6">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-sm">
            <h3 className="text-xl font-bold mb-2">Desafio com IA ✨</h3>
            <p className="text-purple-100 mb-4 text-sm">Gere um novo nível personalizado agora mesmo!</p>
            <button 
              onClick={async () => {
                const btn = document.getElementById('ai-btn');
                if (btn) btn.innerText = 'Gerando...';
                try {
                  const res = await fetch('/api/generate-lesson', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ language: currentLanguage })
                  });
                  const data = await res.json();
                  if (data && data.exercises) {
                    localStorage.setItem('codelingo-ai-lesson', JSON.stringify(data));
                    window.location.href = `/lesson/${currentLanguage}/ai/challenge`;
                  }
                } catch (error) {
                  console.error(error);
                  alert('Erro ao gerar lição com IA');
                  if (btn) btn.innerText = 'Gerar Nível';
                }
              }}
              id="ai-btn"
              className="w-full bg-white text-purple-600 font-bold py-3 rounded-xl border-b-4 border-purple-200 active:border-b-0 active:translate-y-1 transition-all"
            >
              Gerar Nível
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-xl font-bold mb-4">Ligas (Mock)</h3>
            <div className="space-y-4">
              {[
                { name: 'Maria', xp: 1250, isUser: false },
                { name: user.displayName || 'Você', xp: useStore.getState().xp, isUser: true },
                { name: 'João', xp: 840, isUser: false },
              ].sort((a, b) => b.xp - a.xp).map((u, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${u.isUser ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500 font-bold w-4">{i + 1}</span>
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold">
                      {u.name[0]}
                    </div>
                    <span>{u.name}</span>
                  </div>
                  <span className="font-mono text-sm">{u.xp} XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
