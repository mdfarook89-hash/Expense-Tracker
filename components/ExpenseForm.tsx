import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {db, auth} from '../lib/firebase';

const EXPENSE_CATEGORIES = [
  'Credit Card',
  'School Fees',
  'Utilities',
  'Food & Dining',
  'Transportation',
  'Entertainment',
  'Healthcare',
  'Insurance',
  'Shopping',
  'Other'
];

interface ExpenseFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function ExpenseForm({ onSuccess, onError }: ExpenseFormProps) {
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Please sign in to add expenses');

      await addDoc(collection(db, 'expenses'), {
        category,
        amount: parseFloat(amount),
        date,
        description,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      // Reset form
      setAmount('');
      setDescription('');
      onSuccess?.();
    } catch (err: any) {
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 20 }}>
      <h2>Add New Expense</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 15 }}>
          <label>Category:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 5 }}
          >
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Amount ($):</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 5 }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 5 }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 5, minHeight: 80 }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#1976d2',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 16
          }}
        >
          {loading ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
    </div>
  );
}