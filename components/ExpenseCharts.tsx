import { useMemo } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  userId: string;
}

interface ExpenseChartsProps {
  expenses: Expense[];
}

const COLORS = [
  '#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0',
  '#00BCD4', '#FFEB3B', '#795548', '#607D8B', '#E91E63',
];

export default function ExpenseCharts({ expenses }: ExpenseChartsProps) {
  // Category breakdown
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((exp) => {
      map[exp.category] = (map[exp.category] || 0) + exp.amount;
    });
    const labels = Object.keys(map);
    const data = Object.values(map);
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length]),
          borderWidth: 1,
        },
      ],
    };
  }, [expenses]);

  // Monthly totals
  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((exp) => {
      const month = exp.date.slice(0, 7); // YYYY-MM
      map[month] = (map[month] || 0) + exp.amount;
    });
    const sortedMonths = Object.keys(map).sort();
    return {
      labels: sortedMonths,
      datasets: [
        {
          label: 'Monthly Spend',
          data: sortedMonths.map((m) => map[m]),
          backgroundColor: 'rgba(33, 150, 243, 0.6)',
          borderColor: 'rgba(33, 150, 243, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [expenses]);

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' as const },
      title: { display: true, text: 'Spending by Category' },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Monthly Spending' },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  if (expenses.length === 0) {
    return <p>No expense data to display charts.</p>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginBottom: 30 }}>
      <div style={{ height: 300 }}>
        <Pie data={categoryData} options={pieOptions} />
      </div>
      <div style={{ height: 300 }}>
        <Bar data={monthlyData} options={barOptions} />
      </div>
    </div>
  );
}
