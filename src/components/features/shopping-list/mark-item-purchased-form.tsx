'use client';

import { Button } from '@/components/ui/button';
import { markShoppingListItemPurchased } from '@/lib/actions/shopping-list.actions';
import { useFormState } from 'react-dom';

const initialState = {
  error: ''
}

export function MarkItemPurchasedForm({ itemId }: { itemId: string }) {
  const [state, formAction] = useFormState(markShoppingListItemPurchased, initialState)

  return (
    <form action={formAction}>
      <input type="hidden" name="itemId" value={itemId} />
      <Button type="submit" variant="outline">Mark as Purchased</Button>
      {state?.error && <p>{state.error}</p>}
    </form>
  );
}
