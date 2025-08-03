import { db } from '@/lib/db';
import { purchases, items } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { auth } from '@/lib/auth';
import { format } from 'date-fns';
import { AddPurchaseForm } from '@/components/features/purchases/add-purchase-form';

export default async function PurchasesPage() {
  const session = await auth();
  const householdId = session?.user?.householdId;

  if (!householdId) {
    return <div>Not in a household</div>;
  }

  const allPurchases = await db.query.purchases.findMany({
    where: eq(purchases.householdId, householdId),
    with: {
      purchaseItems: {
        with: {
          item: true,
        },
      },
      paidByUser: true,
    },
  });

  const allItems = await db.query.items.findMany({
    where: eq(items.householdId, householdId),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Purchases</h1>
        <AddPurchaseForm items={allItems} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Paid By</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Items</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allPurchases.map((purchase) => (
            <TableRow key={purchase.id}>
              <TableCell>{format(purchase.purchaseDate, 'PPP')}</TableCell>
              <TableCell>{purchase.vendor}</TableCell>
              <TableCell>{purchase.totalAmount}</TableCell>
              <TableCell>{purchase.paidByUser?.name}</TableCell>
              <TableCell>{purchase.notes}</TableCell>
              <TableCell>
                <ul>
                  {purchase.purchaseItems.map((item) => (
                    <li key={item.id}>
                      {item.quantity} {item.unit} of {item.item.name} ({item.lineTotal})
                    </li>
                  ))}
                </ul>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
