'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createItem } from '@/lib/actions/items.actions';
import { useFormState } from 'react-dom';

const initialState = {
  error: ''
}

export function AddItemForm() {
  const [state, formAction] = useFormState(createItem, initialState)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Item</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new item</DialogTitle>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" name="name" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="defaultUnit" className="text-right">
                Default Unit
              </Label>
              <Input id="defaultUnit" name="defaultUnit" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="perishable" className="text-right">
                Perishable
              </Label>
              <Input id="perishable" name="perishable" type="checkbox" className="col-span-3" />
            </div>
          </div>
          <Button type="submit">Save</Button>
          {state?.error && <p>{state.error}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}
