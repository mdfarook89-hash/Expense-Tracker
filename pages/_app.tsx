import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function App({ Component, pageProps }: AppProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return (
      <div style={{ maxWidth: 400, margin: '200px auto', textAlign: 'center' }}>
        <h1>Admin Dashboard</h1>
        <button onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}>
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex' }}>
      <nav style={{ width: 200, background: '#f0f0f0', padding: 20 }}>
        <h3>Menu</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><a href="/">Dashboard</a></li>
          <li><a href="/inventory">Inventory</a></li>
          <li><a href="/reports">Reports</a></li>
          <li><a href="/import-export">Import/Export</a></li>
          <li><button onClick={() => signOut(auth)}>Logout</button></li>
        </ul>
      </nav>
      <main style={{ flex: 1, padding: 20 }}>
        <Component {...pageProps} />
      </main>
    </div>
  );
}
