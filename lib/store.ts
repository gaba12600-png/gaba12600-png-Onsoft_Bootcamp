import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, db } from './firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface UserProgress {
  user: UserProfile | null;
  xp: number;
  streak: number;
  hearts: number;
  maxHearts: number;
  gems: number;
  lastPlayedDate: string | null;
  completedLessons: string[]; // e.g., "python-unit1-lesson1"
  currentLanguage: string;
}

interface StoreState extends UserProgress {
  addXp: (amount: number) => Promise<void>;
  loseHeart: () => Promise<void>;
  refillHearts: () => Promise<void>;
  addGems: (amount: number) => Promise<void>;
  spendGems: (amount: number) => Promise<boolean>;
  completeLesson: (lessonId: string) => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
  checkStreak: () => Promise<void>;
}

const syncToFirebase = async (data: Partial<UserProgress>) => {
  const user = auth.currentUser;
  if (user) {
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, data);
    } catch (error) {
      console.error("Error updating Firestore:", error);
    }
  }
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null,
      xp: 0,
      streak: 0,
      hearts: 5,
      maxHearts: 5,
      gems: 500,
      lastPlayedDate: null,
      completedLessons: [],
      currentLanguage: 'python',

      addXp: async (amount) => {
        const newXp = get().xp + amount;
        set({ xp: newXp });
        await syncToFirebase({ xp: newXp });
      },
      
      loseHeart: async () => {
        const newHearts = Math.max(0, get().hearts - 1);
        set({ hearts: newHearts });
        await syncToFirebase({ hearts: newHearts });
      },
      
      refillHearts: async () => {
        const max = get().maxHearts;
        set({ hearts: max });
        await syncToFirebase({ hearts: max });
      },
      
      addGems: async (amount) => {
        const newGems = get().gems + amount;
        set({ gems: newGems });
        await syncToFirebase({ gems: newGems });
      },
      
      spendGems: async (amount) => {
        const state = get();
        if (state.gems >= amount) {
          const newGems = state.gems - amount;
          set({ gems: newGems });
          await syncToFirebase({ gems: newGems });
          return true;
        }
        return false;
      },

      completeLesson: async (lessonId) => {
        const state = get();
        if (!state.completedLessons.includes(lessonId)) {
          const newCompleted = [...state.completedLessons, lessonId];
          set({ completedLessons: newCompleted });
          await syncToFirebase({ completedLessons: newCompleted });
        }
      },

      setLanguage: async (lang) => {
        set({ currentLanguage: lang });
        await syncToFirebase({ currentLanguage: lang });
      },

      checkStreak: async () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        
        if (state.lastPlayedDate === today) return; // Already played today

        let newStreak = state.streak;
        if (state.lastPlayedDate) {
          const lastDate = new Date(state.lastPlayedDate);
          const currentDate = new Date(today);
          const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            newStreak += 1;
          } else if (diffDays > 1) {
            newStreak = 1; // Reset streak
          }
        } else {
          newStreak = 1; // First time playing
        }

        set({ streak: newStreak, lastPlayedDate: today });
        await syncToFirebase({ streak: newStreak, lastPlayedDate: today });
      }
    }),
    {
      name: 'codelingo-storage',
    }
  )
);
