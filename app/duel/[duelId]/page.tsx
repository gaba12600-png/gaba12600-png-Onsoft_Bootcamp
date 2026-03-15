'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { TopBar } from '@/components/top-bar';
import Editor from '@monaco-editor/react';
import { Play, CheckCircle2, XCircle, Loader2, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function DuelArena() {
  const { duelId } = useParams();
  const router = useRouter();
  const { user } = useStore();
  
  const [mounted, setMounted] = useState(false);
  const [duel, setDuel] = useState<any>(null);
  const [opponent, setOpponent] = useState<any>(null);
  const [codeValue, setCodeValue] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [winner, setWinner] = useState<any>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user || !duelId) return;

    const duelRef = doc(db, 'duels', duelId as string);
    
    const unsub = onSnapshot(duelRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setDuel(data);
        
        // If we just joined and it's waiting, start it
        if (data.status === 'waiting' && (data.player1Id === user.uid || data.player2Id === user.uid)) {
          // If both players are here (we assume player2 joining triggers this)
          // Actually, we don't know if player2 is here just from this. 
          // Let's say if player2 is viewing this, they update status to in_progress
          if (data.player2Id === user.uid) {
            await updateDoc(duelRef, { status: 'in_progress' });
          }
        }

        // Fetch opponent info
        const oppId = data.player1Id === user.uid ? data.player2Id : data.player1Id;
        const uSnap = await getDoc(doc(db, 'users_public', oppId));
        if (uSnap.exists()) {
          setOpponent(uSnap.data());
        }

        // Fetch winner info if finished
        if (data.status === 'finished' && data.winnerId) {
          const wSnap = await getDoc(doc(db, 'users_public', data.winnerId));
          if (wSnap.exists()) {
            setWinner(wSnap.data());
          }
        }
      }
    });

    return () => unsub();
  }, [user, duelId]);

  // Set initial code once duel is loaded
  useEffect(() => {
    if (duel && duel.challenge && !codeValue) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCodeValue(duel.challenge.initialCode || '');
    }
  }, [duel, codeValue]);

  const handleCodeChange = async (value: string) => {
    if (!isChecking && duel?.status === 'in_progress') {
      setCodeValue(value);
      
      // Update progress (mock: just length of code vs expected, or random)
      // In a real app, we'd run tests. Here we just update a visual progress bar based on typing
      const progress = Math.min(100, Math.floor((value.length / (duel.challenge.expectedOutput?.length || 50)) * 100));
      
      const isPlayer1 = duel.player1Id === user?.uid;
      const updateField = isPlayer1 ? 'player1Progress' : 'player2Progress';
      
      await updateDoc(doc(db, 'duels', duelId as string), {
        [updateField]: progress
      });
    }
  };

  const checkAnswer = async () => {
    if (!duel || !user || duel.status !== 'in_progress') return;
    
    setIsChecking(true);
    setFeedback(null);

    // Simulate checking
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simple validation for prototype
    const isCorrect = codeValue.replace(/\s+/g, '') === duel.challenge.expectedOutput.replace(/\s+/g, '');

    if (isCorrect) {
      setFeedback('correct');
      // We won!
      await updateDoc(doc(db, 'duels', duelId as string), {
        status: 'finished',
        winnerId: user.uid,
        [duel.player1Id === user.uid ? 'player1Progress' : 'player2Progress']: 100
      });
    } else {
      setFeedback('incorrect');
    }
    
    setIsChecking(false);
  };

  if (!mounted || !user) return null;

  if (!duel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const isPlayer1 = duel.player1Id === user.uid;
  const myProgress = isPlayer1 ? duel.player1Progress : duel.player2Progress;
  const oppProgress = isPlayer1 ? duel.player2Progress : duel.player1Progress;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex flex-col">
      <TopBar />
      
      {/* Duel Header */}
      <div className="bg-zinc-900 text-white p-4 border-b border-zinc-800">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 w-1/3">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center font-bold text-xl">
              {user.displayName?.[0]?.toUpperCase() || 'V'}
            </div>
            <div className="flex-1">
              <div className="font-bold">{user.displayName || 'Você'}</div>
              <div className="h-2 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${myProgress}%` }} />
              </div>
            </div>
          </div>
          
          <div className="text-2xl font-black text-zinc-500 italic px-8">VS</div>
          
          <div className="flex items-center gap-4 w-1/3 flex-row-reverse text-right">
            <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center font-bold text-xl">
              {opponent?.displayName?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <div className="font-bold">{opponent?.displayName || 'Aguardando...'}</div>
              <div className="h-2 bg-zinc-800 rounded-full mt-1 overflow-hidden flex justify-end">
                <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${oppProgress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 flex flex-col gap-6">
        
        {duel.status === 'waiting' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            <h2 className="text-2xl font-bold">Aguardando oponente...</h2>
            <p className="text-zinc-500">O duelo começará assim que {opponent?.displayName || 'o oponente'} entrar.</p>
          </div>
        )}

        {duel.status === 'finished' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <Trophy className={`w-24 h-24 ${winner?.uid === user.uid ? 'text-yellow-400' : 'text-zinc-400'}`} />
            <h2 className="text-4xl font-black">
              {winner?.uid === user.uid ? 'Você Venceu!' : `${winner?.displayName || 'Oponente'} Venceu!`}
            </h2>
            <Link href="/duels">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all border-b-4 border-blue-700 active:border-b-0 active:translate-y-1">
                Voltar para Duelos
              </button>
            </Link>
          </div>
        )}

        {duel.status === 'in_progress' && (
          <>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <h2 className="text-2xl font-bold mb-2">{duel.challenge.title}</h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">{duel.challenge.description}</p>
            </div>

            <div className="flex-1 rounded-2xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 min-h-[400px]">
              <Editor
                height="100%"
                defaultLanguage={duel.language || 'javascript'}
                theme="vs-dark"
                value={codeValue}
                onChange={(value) => handleCodeChange(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 16,
                  padding: { top: 16 },
                  readOnly: isChecking
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {feedback === 'incorrect' && (
                  <div className="flex items-center gap-2 text-red-500 font-bold bg-red-100 dark:bg-red-900/30 px-4 py-2 rounded-xl">
                    <XCircle className="w-5 h-5" />
                    Resposta Incorreta. Tente novamente!
                  </div>
                )}
                {feedback === 'correct' && (
                  <div className="flex items-center gap-2 text-green-500 font-bold bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                    Correto!
                  </div>
                )}
              </div>
              
              <button
                onClick={checkAnswer}
                disabled={isChecking || !codeValue.trim()}
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg transition-all border-b-4 active:border-b-0 active:translate-y-1 ${
                  isChecking || !codeValue.trim()
                    ? 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 border-zinc-400 dark:border-zinc-900 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 text-white border-green-700'
                }`}
              >
                {isChecking ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Enviar Código'}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
