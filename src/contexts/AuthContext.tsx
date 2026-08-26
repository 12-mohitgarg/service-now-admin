import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
        setIsAdmin(adminDoc.exists());
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
  }, []);

  async function login(email: string, password: string) {
    const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
    const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
    if (!adminDoc.exists()) {
      await signOut(auth);
      throw new Error('This account is not an admin.');
    }
    setUser(firebaseUser);
    setIsAdmin(true);
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
