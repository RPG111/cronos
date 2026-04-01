import { create } from 'zustand';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export type MembershipTier = 'free' | 'member';

export interface CronosUser {
  uid: string;
  phone: string;
  name: string;
  favoriteTeam: string;
  membershipTier: MembershipTier;
  credits: number;
  city: string;
  photoURL: string;
}

interface AppState {
  user: CronosUser | null;
  loadingUser: boolean;
  setUser: (user: CronosUser | null) => void;
  logout: () => Promise<void>;
  initAuth: () => () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  loadingUser: true,
  setUser: (user) => set({ user }),
  logout: async () => {
    await signOut(auth);
    set({ user: null });
  },
  initAuth: () => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        set({ user: null, loadingUser: false });
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        const data = snap.exists() ? snap.data() : {};
        set({
          user: {
            uid: firebaseUser.uid,
            phone: firebaseUser.phoneNumber ?? data?.phone ?? '',
            name: data?.name ?? '',
            favoriteTeam: data?.favoriteTeam ?? '',
            membershipTier: data?.membershipTier ?? 'free',
            credits: data?.credits ?? 0,
            city: data?.city ?? '',
            photoURL: data?.photoURL ?? '',
          },
          loadingUser: false,
        });
      } catch {
        set({ loadingUser: false });
      }
    });
    return unsub;
  },
}));

// UI loading state (mantener compatibilidad)
interface UIState {
  loading: boolean;
  setLoading: (v: boolean) => void;
}

export const useUI = create<UIState>((set) => ({
  loading: false,
  setLoading: (v) => set({ loading: v }),
}));
