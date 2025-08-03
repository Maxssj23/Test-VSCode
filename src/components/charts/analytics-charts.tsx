'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsChartsProps {
  spendingByCategory: { categoryName: string | null; amount: string | null }[];
  wasteData: { reason: string | null; quantity: string | null }[];
  currentMonth: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

export function AnalyticsCharts({
  spendingByCategory,
  wasteData,
  currentMonth,
}: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category ({currentMonth})</CardTitle>
        </CardHeader>
        <CardContent>
          {spendingByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={spendingByCategory.map(d => ({ name: d.categoryName, value: parseFloat(d.amount || '0') }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {spendingByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>No spending data for this month.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Waste Tracking ({currentMonth})</CardTitle>
        </CardHeader>
        <CardContent>
          {wasteData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={wasteData.map(d => ({ name: d.reason, value: parseFloat(d.quantity || '0') }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {wasteData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>No waste data for this month.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
