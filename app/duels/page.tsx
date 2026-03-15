'use client';

import { useStore } from '@/lib/store';
import { TopBar } from '@/components/top-bar';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Search, UserPlus, Users, Swords, Clock, Check, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DuelsPage() {
  const { user, currentLanguage } = useStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [activeDuels, setActiveDuels] = useState<any[]>([]);
  const [isGeneratingDuel, setIsGeneratingDuel] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;

    // Listen to friendships
    const q1 = query(collection(db, 'friendships'), where('user1Id', '==', user.uid));
    const q2 = query(collection(db, 'friendships'), where('user2Id', '==', user.uid));

    const handleFriendships = async () => {
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const allFriendships = [...snap1.docs, ...snap2.docs].map(d => ({ id: d.id, ...(d.data() as any) }));
      
      const accepted = allFriendships.filter(f => f.status === 'accepted');
      const pending = allFriendships.filter(f => f.status === 'pending' && f.user2Id === user.uid);

      // Fetch user details for friends
      const friendIds = accepted.map(f => f.user1Id === user.uid ? f.user2Id : f.user1Id);
      const pendingIds = pending.map(f => f.user1Id);

      const fetchUsers = async (ids: string[]) => {
        if (ids.length === 0) return [];
        const users = [];
        // Firestore 'in' query is limited to 10, so we fetch individually for simplicity in this prototype
        for (const id of ids) {
          const uSnap = await getDocs(query(collection(db, 'users_public'), where('uid', '==', id)));
          if (!uSnap.empty) users.push(uSnap.docs[0].data());
        }
        return users;
      };

      const [friendsData, pendingData] = await Promise.all([fetchUsers(friendIds), fetchUsers(pendingIds)]);
      
      setFriends(friendsData.map(f => ({ ...f, friendshipId: accepted.find(a => a.user1Id === f.uid || a.user2Id === f.uid)?.id })));
      setPendingRequests(pendingData.map(p => ({ ...p, friendshipId: pending.find(a => a.user1Id === p.uid)?.id })));
    };

    handleFriendships();
    
    // We could use onSnapshot for real-time friends, but polling or manual refresh is fine for now
    const interval = setInterval(handleFriendships, 10000);

    // Listen to active duels
    const dq1 = query(collection(db, 'duels'), where('player1Id', '==', user.uid));
    const dq2 = query(collection(db, 'duels'), where('player2Id', '==', user.uid));

    const unsubD1 = onSnapshot(dq1, (snap) => {
      updateDuels(snap.docs, 1);
    });
    const unsubD2 = onSnapshot(dq2, (snap) => {
      updateDuels(snap.docs, 2);
    });

    let allDuels: any[] = [];
    const updateDuels = async (docs: any[], source: number) => {
      const newDuels = docs.map(d => ({ id: d.id, ...d.data() }));
      allDuels = [...allDuels.filter(d => (source === 1 ? d.player1Id !== user.uid : d.player2Id !== user.uid)), ...newDuels];
      
      // Fetch opponent data
      const duelsWithOpponents = await Promise.all(allDuels.map(async (duel) => {
        const opponentId = duel.player1Id === user.uid ? duel.player2Id : duel.player1Id;
        const uSnap = await getDocs(query(collection(db, 'users_public'), where('uid', '==', opponentId)));
        const opponent = uSnap.empty ? { displayName: 'Desconhecido' } : uSnap.docs[0].data();
        return { ...duel, opponent };
      }));
      
      setActiveDuels(duelsWithOpponents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };

    return () => {
      clearInterval(interval);
      unsubD1();
      unsubD2();
    };
  }, [user]);

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return;
    try {
      // Simple search by exact displayName for prototype
      const q = query(collection(db, 'users_public'), where('displayName', '==', searchQuery.trim()));
      const snap = await getDocs(q);
      setSearchResults(snap.docs.map(d => d.data()).filter(u => u.uid !== user.uid));
    } catch (error) {
      console.error(error);
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'friendships'), {
        user1Id: user.uid,
        user2Id: targetUserId,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      alert('Pedido de amizade enviado!');
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar pedido.');
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    try {
      await updateDoc(doc(db, 'friendships', friendshipId), {
        status: 'accepted'
      });
      // Refresh will happen via interval
    } catch (error) {
      console.error(error);
    }
  };

  const inviteToDuel = async (friendId: string) => {
    if (!user || isGeneratingDuel) return;
    setIsGeneratingDuel(friendId);
    try {
      const res = await fetch('/api/generate-duel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: currentLanguage })
      });
      
      if (!res.ok) throw new Error('Failed to generate challenge');
      
      const aiChallenge = await res.json();

      const challenge = {
        id: 'duel-' + new Date().getTime(),
        type: 'write_code',
        title: aiChallenge.title || 'Duelo Rápido',
        description: aiChallenge.description || 'Escreva uma função.',
        initialCode: aiChallenge.initialCode || '',
        expectedOutput: aiChallenge.expectedOutput || ''
      };

      const duelRef = await addDoc(collection(db, 'duels'), {
        player1Id: user.uid,
        player2Id: friendId,
        status: 'waiting',
        language: currentLanguage, // Use the current language for the duel
        challenge,
        player1Progress: 0,
        player2Progress: 0,
        createdAt: new Date().toISOString()
      });

      router.push(`/duel/${duelRef.id}`);
    } catch (error) {
      console.error(error);
      alert('Erro ao criar duelo. Tente novamente.');
    } finally {
      setIsGeneratingDuel(null);
    }
  };

  if (!mounted || !user) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      <TopBar />
      
      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Duels */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Swords className="text-blue-500" />
              Meus Duelos
            </h2>
            
            {activeDuels.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">Nenhum duelo ativo no momento. Convide um amigo!</p>
            ) : (
              <div className="space-y-4">
                {activeDuels.map(duel => (
                  <div key={duel.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                    <div>
                      <h3 className="font-bold text-lg">Duelo vs {duel.opponent?.displayName}</h3>
                      <p className="text-sm text-zinc-500 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {duel.status === 'waiting' ? 'Aguardando oponente...' : duel.status === 'in_progress' ? 'Em andamento' : 'Finalizado'}
                      </p>
                    </div>
                    <Link href={`/duel/${duel.id}`}>
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-bold transition-all">
                        {duel.status === 'finished' ? 'Ver Resultado' : 'Entrar'}
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Friends List */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Users className="text-green-500" />
              Meus Amigos
            </h2>
            
            {friends.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">Você ainda não tem amigos adicionados.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {friends.map(friend => (
                  <div key={friend.uid} className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-lg">
                        {friend.displayName[0].toUpperCase()}
                      </div>
                      <span className="font-bold">{friend.displayName}</span>
                    </div>
                    <button 
                      onClick={() => inviteToDuel(friend.uid)}
                      disabled={isGeneratingDuel === friend.uid}
                      className={`p-2 rounded-lg font-bold transition-all ${
                        isGeneratingDuel === friend.uid 
                          ? 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                          : 'bg-purple-500 hover:bg-purple-600 text-white'
                      }`}
                      title="Desafiar para Duelo"
                    >
                      {isGeneratingDuel === friend.uid ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Swords className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Add Friend */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <UserPlus className="text-blue-500" />
              Adicionar Amigo
            </h3>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Nome exato do usuário"
                className="flex-1 p-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 bg-transparent outline-none focus:border-blue-500"
              />
              <button 
                onClick={searchUsers}
                className="bg-zinc-200 dark:bg-zinc-800 p-3 rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="space-y-2 mt-4">
                {searchResults.map(u => (
                  <div key={u.uid} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <span className="font-bold">{u.displayName}</span>
                    <button 
                      onClick={() => sendFriendRequest(u.uid)}
                      className="text-blue-500 hover:text-blue-600 font-bold text-sm"
                    >
                      Adicionar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <h3 className="text-xl font-bold mb-4">Pedidos Pendentes</h3>
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div key={req.uid} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <span className="font-bold">{req.displayName}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => acceptFriendRequest(req.friendshipId)}
                        className="bg-green-500 text-white p-1.5 rounded-lg"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      {/* Reject button could be added here */}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
