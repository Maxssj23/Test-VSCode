import { db } from '@/lib/db';
import { shoppingList } from '@/lib/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addShoppingListItem, markShoppingListItemPurchased, promoteShoppingListToPurchase } from '@/lib/actions/shopping-list.actions';
import { auth } from '@/lib/auth';
import { format } from 'date-fns';

export default async function ShoppingListPage() {
  const session = await auth();
  const householdId = session?.user?.householdId;

  if (!householdId) {
    return <div>Not in a household</div>;
  }

  const items = await db.query.shoppingList.findMany({
    where: eq(shoppingList.householdId, householdId),
    with: {
      addedByUser: true,
    },
  });

  const pendingItems = items.filter(item => isNull(item.purchasedAt));
  const purchasedItems = items.filter(item => !isNull(item.purchasedAt));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Shopping List</h1>

      <form action={addShoppingListItem} className="flex gap-2 mb-8">
        <Label htmlFor="itemName" className="sr-only">Item Name</Label>
        <Input id="itemName" name="itemName" placeholder="Add new item" className="flex-1" />
        <Button type="submit">Add to List</Button>
      </form>

      <h2 className="text-xl font-semibold mb-2">Pending Items</h2>
      <ul className="space-y-2 mb-8">
        {pendingItems.map((item) => (
          <li key={item.id} className="flex items-center justify-between bg-gray-100 p-3 rounded-md">
            <span>{item.itemName} (Added by {item.addedByUser?.name})</span>
            <div className="flex gap-2">
              <form action={markShoppingListItemPurchased.bind(null, item.id)}>
                <Button type="submit" variant="outline">Mark as Purchased</Button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mb-2">Recently Purchased</h2>
      <ul className="space-y-2 mb-8">
        {purchasedItems.map((item) => (
          <li key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md text-gray-500 line-through">
            <span>{item.itemName} (Purchased on {format(item.purchasedAt!, 'PPP')})</span>
          </li>
        ))}
      </ul>

      {pendingItems.length > 0 && (
        <form action={promoteShoppingListToPurchase.bind(null, pendingItems.map(item => item.id))}>
          <Button type="submit">Promote All Pending to Purchase</Button>
        </form>
      )}
    </div>
  );
}
