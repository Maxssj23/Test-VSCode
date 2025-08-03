import { db } from '@/lib/db';
import { shoppingList } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { format } from 'date-fns';
import { AddShoppingListItemForm } from '@/components/features/shopping-list/add-shopping-list-item-form';
import { MarkItemPurchasedForm } from '@/components/features/shopping-list/mark-item-purchased-form';
import { PromoteShoppingListToPurchaseForm } from '@/components/features/shopping-list/promote-shopping-list-to-purchase-form';

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

  const pendingItems = items.filter(item => item.purchasedAt === null);
  const purchasedItems = items.filter(item => item.purchasedAt !== null);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Shopping List</h1>

      <AddShoppingListItemForm />

      <h2 className="text-xl font-semibold mb-2">Pending Items</h2>
      <ul className="space-y-2 mb-8">
        {pendingItems.map((item) => (
          <li key={item.id} className="flex items-center justify-between bg-gray-100 p-3 rounded-md">
            <span>{item.itemName} (Added by {item.addedByUser?.name})</span>
            <div className="flex gap-2">
              <MarkItemPurchasedForm itemId={item.id} />
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
        <PromoteShoppingListToPurchaseForm itemIds={pendingItems.map(item => item.id)} />
      )}
    </div>
  );
}

