import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

const CATEGORIES = [
  'Credit Card', 'School Fees', 'Utilities', 'Food & Dining',
  'Transportation', 'Entertainment', 'Healthcare', 'Insurance',
  'Shopping', 'Other'
];

interface Budget {
  id?: string;
  category: string;
  limit: number;
  userId: string;
}

export default function BudgetManager() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [limit, setLimit] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchBudgets = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, 'budgets'), where('userId', '==', user.uid));
    const snap = await getDocs(q);
    const list: Budget[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Budget));
    setBudgets(list);
  };

  useEffect(() => { fetchBudgets(); }, []);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const budget: Budget = {
      category,
      limit: parseFloat(limit),
      userId: user.uid,
    };
    if (editingId) {
      await setDoc(doc(db, 'budgets', editingId), budget);
    } else {
      await setDoc(doc(collection(db, 'budgets')), budget);
    }
    setLimit('');
    setEditingId(null);
    fetchBudgets();
  };

  const handleEdit = (b: Budget) => {
    setCategory(b.category);
    setLimit(b.limit.toString());
    setEditingId(b.id!);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this budget?')) {
      await deleteDoc(doc(db, 'budgets', id));
      fetchBudgets();
    }
  };

  return (
    <div>
      <h2>Budget Limits</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>Category</th>
            <th style={{ textAlign: 'right', padding: 8, borderBottom: '2px solid #ddd' }}>Limit</th>
            <th style={{ textAlign: 'center', padding: 8, borderBottom: '2px solid #ddd' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {budgets.map(b => (
            <tr key={b.id}>
              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{b.category}</td>
              <td style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #eee' }}>${b.limit.toFixed(2)}</td>
              <td style={{ textAlign: 'center', padding: 8, borderBottom: '1px solid #eee' }}>
                <button onClick={() => handleEdit(b)}>Edit</button>
                <button onClick={() => handleDelete(b.id!)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 20 }}>
        <h3>{editingId ? 'Edit Budget' : 'Add Budget'}</h3>
        <label>Category:
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>Limit ($):
          <input type="number" step="0.01" min="0" value={limit} onChange={e => setLimit(e.target.value)} />
        </label>
        <button onClick={handleSave}>{editingId ? 'Update' : 'Add'}</button>
        {editingId && <button onClick={() => { setEditingId(null); setLimit(''); }}>Cancel</button>}
      </div>
    </div>
  );
}
