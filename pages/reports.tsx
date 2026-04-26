import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Report {
  id: string;
  date: string;
  totalSales: number;
  itemsSold: number;
}

export default function Reports() {
  const [daily, setDaily] = useState<Report[]>([]);
  const [weekly, setWeekly] = useState<Report[]>([]);
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    async function fetchReports() {
      const dailySnap = await getDocs(query(collection(db, 'reports', 'daily', 'entries'), orderBy('generatedAt', 'desc')));
      setDaily(dailySnap.docs.map(d => ({ id: d.id, ...d.data() } as Report)));

      const weeklySnap = await getDocs(query(collection(db, 'reports', 'weekly', 'entries'), orderBy('generatedAt', 'desc')));
      setWeekly(weeklySnap.docs.map(d => ({ id: d.id, ...d.data() } as Report)));
    }
    fetchReports();
  }, []);

  const list = tab === 'daily' ? daily : weekly;

  return (
    <div>
      <h1>Reports</h1>
      <div>
        <button onClick={() => setTab('daily')} style={{ fontWeight: tab === 'daily' ? 'bold' : 'normal' }}>Daily</button>
        <button onClick={() => setTab('weekly')} style={{ fontWeight: tab === 'weekly' ? 'bold' : 'normal' }}>Weekly</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Total Sales</th>
            <th>Items Sold</th>
          </tr>
        </thead>
        <tbody>
          {list.map(r => (
            <tr key={r.id}>
              <td>{r.date}</td>
              <td>${r.totalSales?.toFixed(2)}</td>
              <td>{r.itemsSold}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
