'use client';

import { Button } from '@/components/ui/button';
import { promoteShoppingListToPurchase } from '@/lib/actions/shopping-list.actions';
import { useFormState } from 'react-dom';

const initialState = {
  error: ''
}

export function PromoteShoppingListToPurchaseForm({ itemIds }: { itemIds: string[] }) {
  const [state, formAction] = useFormState(promoteShoppingListToPurchase, initialState)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append('itemIds', JSON.stringify(itemIds));
    formAction(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Button type="submit">Promote All Pending to Purchase</Button>
      {state?.error && <p>{state.error}</p>}
    </form>
  );
}
