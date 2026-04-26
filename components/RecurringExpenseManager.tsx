import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, setDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

const CATEGORIES = [
  'Credit Card', 'School Fees', 'Utilities', 'Food & Dining',
  'Transportation', 'Entertainment', 'Healthcare', 'Insurance',
  'Shopping', 'Other'
];

interface RecurringExpense {
  id?: string;
  category: string;
  amount: number;
  dayOfMonth: number; // 1-28
  description?: string;
  userId: string;
}

export default function RecurringExpenseManager() {
  const [list, setList] = useState<RecurringExpense[]>([]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState('1');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchAll = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, 'recurring_expenses'), where('userId', '==', user.uid));
    const snap = await getDocs(q);
    setList(snap.docs.map(d => ({ id: d.id, ...d.data() } as RecurringExpense)));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const data: RecurringExpense = {
      category,
      amount: parseFloat(amount),
      dayOfMonth: parseInt(day),
      description,
      userId: user.uid,
    };
    if (editingId) {
      await setDoc(doc(db, 'recurring_expenses', editingId), data);
    } else {
      await setDoc(doc(collection(db, 'recurring_expenses')), { ...data, createdAt: serverTimestamp() });
    }
    setAmount(''); setDay('1'); setDescription(''); setEditingId(null);
    fetchAll();
  };

  const handleEdit = (item: RecurringExpense) => {
    setCategory(item.category);
    setAmount(item.amount.toString());
    setDay(item.dayOfMonth.toString());
    setDescription(item.description || '');
    setEditingId(item.id!);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this recurring expense?')) {
      await deleteDoc(doc(db, 'recurring_expenses', id));
      fetchAll();
    }
  };

  return (
    <div>
      <h2>Recurring Expenses</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>Category</th>
            <th style={{ textAlign: 'right', padding: 8, borderBottom: '2px solid #ddd' }}>Amount</th>
            <th style={{ textAlign: 'center', padding: 8, borderBottom: '2px solid #ddd' }}>Day</th>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>Description</th>
            <th style={{ textAlign: 'center', padding: 8, borderBottom: '2px solid #ddd' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map(item => (
            <tr key={item.id}>
              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{item.category}</td>
              <td style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #eee' }}>${item.amount.toFixed(2)}</td>
              <td style={{ textAlign: 'center', padding: 8, borderBottom: '1px solid #eee' }}>{item.dayOfMonth}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{item.description || '-'}</td>
              <td style={{ textAlign: 'center', padding: 8, borderBottom: '1px solid #eee' }}>
                <button onClick={() => handleEdit(item)}>Edit</button>
                <button onClick={() => handleDelete(item.id!)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 20 }}>
        <h3>{editingId ? 'Edit Recurring Expense' : 'Add Recurring Expense'}</h3>
        <label>Category:
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>Amount ($):
          <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} />
        </label>
        <label>Day of month (1-28):
          <input type="number" min="1" max="28" value={day} onChange={e => setDay(e.target.value)} />
        </label>
        <label>Description:
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} />
        </label>
        <button onClick={handleSave}>{editingId ? 'Update' : 'Add'}</button>
        {editingId && <button onClick={() => { setEditingId(null); setAmount(''); setDay('1'); setDescription(''); }}>Cancel</button>}
      </div>
    </div>
  );
}
