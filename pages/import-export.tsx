import { useState, useCallback } from 'react';
import { collection, getDocs, query, where, writeBatch, serverTimestamp, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import Papa from 'papaparse';

interface CsvRow {
  category: string;
  amount: string;
  date: string;
  description?: string;
}

export default function ImportExport() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExport = useCallback(async () => {
    setMessage('');
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Please sign in first');

      const q = query(collection(db, 'expenses'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => {
        const d = doc.data();
        return {
          category: d.category,
          amount: d.amount,
          date: d.date,
          description: d.description || '',
        };
      });

      if (data.length === 0) {
        setMessage('No expenses to export');
        return;
      }

      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage(`Exported ${data.length} expenses`);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage('');
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const user = auth.currentUser;
          if (!user) throw new Error('Please sign in first');

          const rows = results.data as CsvRow[];
          if (rows.length === 0) throw new Error('No data found in CSV');

          const batch = writeBatch(db);
          rows.forEach((row) => {
            if (!row.category || !row.amount || !row.date) {
              throw new Error('Each row must have category, amount, and date');
            }
            const docRef = doc(collection(db, 'expenses'));
            batch.set(docRef, {
              category: row.category,
              amount: parseFloat(row.amount as any),
              date: row.date,
              description: row.description || '',
              userId: user.uid,
              createdAt: serverTimestamp(),
            });
          });
          await batch.commit();
          setMessage(`Successfully imported ${rows.length} expenses`);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
          // reset file input
          e.target.value = '';
        }
      },
      error: (err: any) => {
        setError(`CSV parse error: ${err.message}`);
        setLoading(false);
      },
    });
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h1>Import / Export Expenses</h1>

      <div style={{ marginBottom: 30, padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
        <h2>Export Expenses</h2>
        <p>Download all your expenses as a CSV file.</p>
        <button
          onClick={handleExport}
          style={{
            background: '#4CAF50',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          Export CSV
        </button>
      </div>

      <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
        <h2>Import Expenses</h2>
        <p>Upload a CSV file with columns: category, amount, date, description (optional).</p>
        <input
          type="file"
          accept=".csv"
          onChange={handleImport}
          disabled={loading}
          style={{ marginBottom: 10 }}
        />
        {loading && <p>Importing...</p>}
        <p style={{ fontSize: 12, color: '#666' }}>
          Example CSV format:
          <br />
          category,amount,date,description
          <br />
          Credit Card,50.25,2026-04-25,Monthly bill
        </p>
      </div>

      {message && (
        <p style={{ color: 'green', marginTop: 20 }}>{message}</p>
      )}
      {error && (
        <p style={{ color: 'red', marginTop: 20 }}>{error}</p>
      )}
    </div>
  );
}
