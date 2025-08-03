'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addShoppingListItem } from '@/lib/actions/shopping-list.actions';
import { useFormState } from 'react-dom';

const initialState = {
  error: ''
}

export function AddShoppingListItemForm() {
  const [state, formAction] = useFormState(addShoppingListItem, initialState)

  return (
    <form action={formAction} className="flex gap-2 mb-8">
      <Label htmlFor="itemName" className="sr-only">Item Name</Label>
      <Input id="itemName" name="itemName" placeholder="Add new item" className="flex-1" />
      <Button type="submit">Add to List</Button>
      {state?.error && <p>{state.error}</p>}
    </form>
  );
}
