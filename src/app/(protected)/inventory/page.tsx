import { InventoryItemActions } from '@/components/features/inventory/inventory-item-actions';

export default async function InventoryPage() {
  const session = await auth();
  const householdId = session?.user?.householdId;

  if (!householdId) {
    return <div>Not in a household</div>;
  }

  const allInventoryItems = await db.query.inventory.findMany({
    where: eq(inventory.householdId, householdId),
    with: {
      item: true,
    },
  });

  const allItems = await db.query.items.findMany({
    where: eq(items.householdId, householdId),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <AddInventoryItemForm items={allItems} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Storage</TableHead>
            <TableHead>Purchase Date</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allInventoryItems.map((inventoryItem) => (
            <TableRow key={inventoryItem.id}>
              <TableCell>{inventoryItem.item.name}</TableCell>
              <TableCell>{inventoryItem.quantity}</TableCell>
              <TableCell>{inventoryItem.unit}</TableCell>
              <TableCell>{inventoryItem.storage}</TableCell>
              <TableCell>{inventoryItem.purchaseDate?.toLocaleDateString()}</TableCell>
              <TableCell>{inventoryItem.expiryDate?.toLocaleDateString()}</TableCell>
              <TableCell>{inventoryItem.costTotal}</TableCell>
              <TableCell>
                <InventoryItemActions inventoryItem={inventoryItem} items={allItems} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
