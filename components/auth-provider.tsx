'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { useStore } from '@/lib/store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { setLanguage, addXp, loseHeart, refillHearts, addGems, completeLesson } = useStore(); // We'll need a way to set the whole state

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        useStore.setState({ user: { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL } });
        
        // Check if user document exists, if not create it
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          const initialState = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            xp: 0,
            streak: 0,
            hearts: 5,
            maxHearts: 5,
            gems: 500,
            lastPlayedDate: new Date().toISOString().split('T')[0],
            completedLessons: [],
            currentLanguage: 'python',
            role: 'user'
          };
          await setDoc(userRef, initialState);
        }

        // Ensure public profile exists
        const publicRef = doc(db, 'users_public', user.uid);
        const publicSnap = await getDoc(publicRef);
        if (!publicSnap.exists()) {
          await setDoc(publicRef, {
            uid: user.uid,
            displayName: user.displayName || 'Anônimo',
            photoURL: user.photoURL || '',
            xp: userSnap.exists() ? userSnap.data().xp : 0
          });
        }

        // Listen to Firestore changes
        const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            useStore.setState({
              xp: data.xp,
              streak: data.streak,
              hearts: data.hearts,
              maxHearts: data.maxHearts,
              gems: data.gems,
              lastPlayedDate: data.lastPlayedDate,
              completedLessons: data.completedLessons || [],
              currentLanguage: data.currentLanguage || 'python',
            });
          }
        }, (error) => {
          console.error("Firestore Error: ", error);
        });

        setIsAuthReady(true);
        return () => unsubscribeSnapshot();
      } else {
        useStore.setState({ user: null });
        setIsAuthReady(true);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">Carregando...</div>;
  }

  return <>{children}</>;
}
