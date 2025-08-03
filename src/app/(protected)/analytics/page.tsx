import { db } from "@/lib/db";
import { budgets, expenses, wasteEvents, users, purchases, categories } from "@/lib/db/schema";
import { eq, sum, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { format } from "date-fns";
import { AddBudgetForm } from "@/components/features/budgets/add-budget-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default async function AnalyticsPage() {
  const session = await auth();
  const householdId = session?.user?.householdId;

  if (!householdId) {
    return <div>Not in a household</div>;
  }

  const currentMonth = format(new Date(), 'yyyy-MM');

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

  const spendingByCategory = await db.select({
    categoryName: categories.name,
    amount: sum(expenses.amount),
  }).from(expenses)
    .leftJoin(categories, eq(expenses.categoryId, categories.id))
    .where(and(
      eq(expenses.householdId, householdId),
      sql`TO_CHAR(${expenses.date}, 'YYYY-MM') = ${currentMonth}`
    ))
    .groupBy(categories.name);

  const wasteData = await db.select({
    reason: wasteEvents.reason,
    quantity: sum(wasteEvents.quantity),
  }).from(wasteEvents)
    .where(and(
      eq(wasteEvents.householdId, householdId),
      sql`TO_CHAR(${wasteEvents.eventDate}, 'YYYY-MM') = ${currentMonth}`
    ))
    .groupBy(wasteEvents.reason);

  const contributionSummary = await db.select({
    userName: users.name,
    totalPaid: sum(purchases.totalAmount),
  }).from(purchases)
    .leftJoin(users, eq(purchases.paidByUserId, users.id))
    .where(and(
      eq(purchases.householdId, householdId),
      sql`TO_CHAR(${purchases.purchaseDate}, 'YYYY-MM') = ${currentMonth}`
    ))
    .groupBy(users.name);

  const combinedContributions: { [key: string]: number } = {};

  contributionSummary.forEach(c => {
    if (c.userName) {
      combinedContributions[c.userName] = (combinedContributions[c.userName] || 0) + parseFloat(c.totalPaid || '0');
    }
  });

  const finalContributions = Object.entries(combinedContributions).map(([userName, totalPaid]) => ({
    userName,
    totalPaid: totalPaid.toFixed(2),
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Budget & Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Month Budget</CardTitle>
          </CardHeader>
          <CardContent>
            {currentBudget ? (
              <p className="text-2xl font-semibold">${currentBudget.limitAmount} / ${totalSpend.toFixed(2)}</p>
            ) : (
              <p>No budget set for {currentMonth}. <AddBudgetForm /></p>
            )}
          </CardContent>
        </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>Contribution Summary ({currentMonth})</CardTitle>
        </CardHeader>
        <CardContent>
          {finalContributions.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {finalContributions.map((contribution, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">{contribution.userName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${contribution.totalPaid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No contribution data for this month.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
