import { db } from '@/lib/db';
import { inventory, bills, budgets, expenses, wasteEvents } from '@/lib/db/schema';
import { eq, and, lte, gte, sql, sum } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { format, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth();
  const householdId = session?.user?.householdId;

  if (!householdId) {
    return <div>Not in a household</div>;
  }

  const today = new Date();
  const sevenDaysFromNow = addDays(today, 7);
  const startOfCurrentMonth = startOfMonth(today);
  const endOfCurrentMonth = endOfMonth(today);

  // Groceries expiring soon
  const expiringGroceries = await db.query.inventory.findMany({
    where: and(
      eq(inventory.householdId, householdId),
      lte(inventory.expiryDate, sevenDaysFromNow),
      gte(inventory.expiryDate, today)
    ),
    with: {
      item: true,
    },
  });

  // Bills due soon
  const dueBills = await db.query.bills.findMany({
    where: and(
      eq(bills.householdId, householdId),
      lte(bills.dueDate, sevenDaysFromNow),
      eq(bills.status, 'pending')
    ),
  });

  // Current month's total spend vs budget
  const currentMonth = format(today, 'yyyy-MM');
  const [currentBudget] = await db.select().from(budgets).where(and(
    eq(budgets.householdId, householdId),
    eq(budgets.period, currentMonth)
  ));

  const [totalSpendResult] = await db.select({
    total: sum(expenses.amount),
  }).from(expenses).where(and(
    eq(expenses.householdId, householdId),
    sql`TO_CHAR(${expenses.date}, 'YYYY-MM') = ${currentMonth}`
  ));
  const totalSpend = parseFloat(totalSpendResult?.total || '0');

  // Spending by category (current month)
  const spendingByCategory = await db.select({
    categoryName: expenses.category.name,
    amount: sum(expenses.amount),
  }).from(expenses)
    .leftJoin(expenses.category, eq(expenses.categoryId, expenses.category.id))
    .where(and(
      eq(expenses.householdId, householdId),
      sql`TO_CHAR(${expenses.date}, 'YYYY-MM') = ${currentMonth}`
    ))
    .groupBy(expenses.category.name);

  // Waste % this month
  const wasteData = await db.select({
    reason: wasteEvents.reason,
    quantity: sum(wasteEvents.quantity),
  }).from(wasteEvents)
    .where(and(
      eq(wasteEvents.householdId, householdId),
      sql`TO_CHAR(${wasteEvents.eventDate}, 'YYYY-MM') = ${currentMonth}`
    ))
    .groupBy(wasteEvents.reason);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Groceries Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            {expiringGroceries.length > 0 ? (
              <ul>
                {expiringGroceries.map((item) => (
                  <li key={item.id} className={item.expiryDate && item.expiryDate < today ? 'text-red-500' : 'text-yellow-500'}>
                    {item.item.name} expires on {format(item.expiryDate!, 'PPP')}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No groceries expiring soon.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bills Due Soon</CardTitle>
          </CardHeader>
          <CardContent>
            {dueBills.length > 0 ? (
              <ul>
                {dueBills.map((bill) => (
                  <li key={bill.id} className={bill.dueDate < today ? 'text-red-500' : ''}>
                    {bill.name} (${bill.amount}) due on {format(bill.dueDate, 'PPP')}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No bills due soon.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Spend vs. Budget ({currentMonth})</CardTitle>
          </CardHeader>
          <CardContent>
            {currentBudget ? (
              <p className="text-2xl font-semibold">${totalSpend.toFixed(2)} / ${currentBudget.limitAmount}</p>
            ) : (
              <p>No budget set for {currentMonth}.</p>
            )}
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}