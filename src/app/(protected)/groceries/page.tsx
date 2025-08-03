import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { auth } from '@/lib/auth';
import { ItemActions } from '@/components/features/groceries/item-actions';
import { AddItemForm } from '@/components/features/groceries/add-item-form';

export default async function GroceriesPage() {
  const session = await auth();
  const householdId = session?.user?.householdId;

  if (!householdId) {
    return <div>Not in a household</div>;
  }

  const allItems = await db.query.items.findMany({
    where: eq(items.householdId, householdId),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Groceries</h1>
        <AddItemForm />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Default Unit</TableHead>
            <TableHead>Perishable</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.defaultUnit}</TableCell>
              <TableCell>{item.perishable ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <ItemActions item={item} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
