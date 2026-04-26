import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseCharts from '../components/ExpenseCharts';
import BudgetManager from '../components/BudgetManager';
import RecurringExpenseManager from '../components/RecurringExpenseManager';

interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  userId: string;
}

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Record<string, number>>({});

  const fetchExpenses = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );
      const snap = await getDocs(q);
      const list: Expense[] = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as Expense);
      });
      setExpenses(list);

      // Calculate total expenses
      const total = list.reduce((sum, exp) => sum + exp.amount, 0);
      setTotalExpenses(total);

      // Calculate category breakdown
      const breakdown: Record<string, number> = {};
      list.forEach(exp => {
        breakdown[exp.category] = (breakdown[exp.category] || 0) + exp.amount;
      });
      setCategoryBreakdown(breakdown);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleExpenseAdded = () => {
    fetchExpenses();
  };

  if (loading) return <div>Loading expenses...</div>;

  return (
    <div>
      <h1>Expense Dashboard</h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 30 }}>
        <div style={{ padding: 20, background: '#e3f2fd', borderRadius: 8 }}>
          <h3>Total Expenses</h3>
          <p style={{ fontSize: 32 }}>${totalExpenses.toFixed(2)}</p>
        </div>
        <div style={{ padding: 20, background: '#e8f5e9', borderRadius: 8 }}>
          <h3>Number of Expenses</h3>
          <p style={{ fontSize: 32 }}>{expenses.length}</p>
        </div>
        <div style={{ padding: 20, background: '#ffebee', borderRadius: 8 }}>
          <h3>Categories</h3>
          <p style={{ fontSize: 32 }}>{Object.keys(categoryBreakdown).length}</p>
        </div>
      </div>

      <ExpenseCharts expenses={expenses} />

      {/* Add Expense Form & Category Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginBottom: 30 }}>
        <div>
          <h2>Add New Expense</h2>
          <ExpenseForm onSuccess={handleExpenseAdded} />
        </div>
        <div>
          <h2>Category Breakdown</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>Category</th>
                <th style={{ textAlign: 'right', padding: 8, borderBottom: '2px solid #ddd' }}>Amount</th>
                <th style={{ textAlign: 'right', padding: 8, borderBottom: '2px solid #ddd' }}>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(categoryBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amount]) => (
                  <tr key={cat}>
                    <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{cat}</td>
                    <td style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #eee' }}>${amount.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #eee' }}>
                      {totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <BudgetManager />
{/* Recent Expenses Table */}
      <div>
        <h2>Recent Expenses</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>Date</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>Category</th>
              <th style={{ textAlign: 'right', padding: 8, borderBottom: '2px solid #ddd' }}>Amount</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {expenses.slice(0, 10).map(exp => (
              <tr key={exp.id}>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{exp.date}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{exp.category}</td>
                <td style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #eee' }}>${exp.amount.toFixed(2)}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{exp.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
