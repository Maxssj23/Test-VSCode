import { db } from '@/lib/db';
import { bills, categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createBill, markBillAsPaid } from '@/lib/actions/bills.actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { auth } from '@/lib/auth';
import { format } from 'date-fns';
import { AddBillForm } from '@/components/features/bills/add-bill-form';
import { BillActions } from '@/components/features/bills/bill-actions';

export default async function BillsPage() {
  const session = await auth();
  const householdId = session?.user?.householdId;

  if (!householdId) {
    return <div>Not in a household</div>;
  }

  const allBills = await db.query.bills.findMany({
    where: eq(bills.householdId, householdId),
    with: {
      category: true,
      billPayments: true,
    },
  });

  const allCategories = await db.query.categories.findMany({
    where: eq(categories.householdId, householdId),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Bills</h1>
        <AddBillForm categories={allCategories} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allBills.map((bill) => (
            <TableRow key={bill.id}>
              <TableCell>{bill.name}</TableCell>
              <TableCell>{bill.vendor}</TableCell>
              <TableCell>{bill.amount}</TableCell>
              <TableCell>{format(bill.dueDate, 'PPP')}</TableCell>
              <TableCell>{bill.status}</TableCell>
              <TableCell>{bill.category?.name}</TableCell>
              <TableCell>{bill.notes}</TableCell>
              <TableCell>
                <BillActions bill={bill} categories={allCategories} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
