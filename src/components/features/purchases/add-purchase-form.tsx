'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPurchase } from '@/lib/actions/purchases.actions';
import type { Item } from '@/lib/db/schema';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const purchaseItemSchema = z.object({
  itemId: z.string().uuid({ message: "Please select an item." }),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unit: z.string().optional(),
  lineTotal: z.coerce.number().min(0, "Line total cannot be negative"),
});

const formSchema = z.object({
  vendor: z.string().optional(),
  purchaseDate: z.date({ required_error: "Purchase date is required." }),
  totalAmount: z.coerce.number().min(0, "Total amount cannot be negative"),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "At least one purchase item is required"),
});

export function AddPurchaseForm({ items }: { items: Item[] }) {
  const [purchaseDate, setPurchaseDate] = useState<Date>();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vendor: '',
      totalAmount: 0,
      notes: '',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData();
    for (const key in values) {
      if (key === 'items') {
        formData.append(key, JSON.stringify(values[key]));
      } else if (values[key as keyof typeof values] !== undefined) {
        if (values[key as keyof typeof values] instanceof Date) {
          formData.append(key, (values[key as keyof typeof values] as Date).toISOString());
        } else {
          formData.append(key, String(values[key as keyof typeof values]));
        }
      }
    }
    await createPurchase(formData);
    form.reset();
    setPurchaseDate(undefined);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Purchase</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Purchase</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vendor" className="text-right">
                Vendor
              </Label>
              <Input id="vendor" className="col-span-3" {...form.register('vendor')} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="purchaseDate" className="text-right">
                Purchase Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !purchaseDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {purchaseDate ? format(purchaseDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={purchaseDate}
                    onSelect={(date) => {
                      setPurchaseDate(date || undefined);
                      form.setValue('purchaseDate', date as Date);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.purchaseDate && (
                <p className="col-span-4 text-red-500 text-sm">{form.formState.errors.purchaseDate.message}</p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="totalAmount" className="text-right">
                Total Amount
              </Label>
              <Input id="totalAmount" type="number" step="0.01" className="col-span-3" {...form.register('totalAmount')} />
              {form.formState.errors.totalAmount && (
                <p className="col-span-4 text-red-500 text-sm">{form.formState.errors.totalAmount.message}</p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Input id="notes" className="col-span-3" {...form.register('notes')} />
            </div>

            <h3 className="text-lg font-semibold col-span-4">Purchase Items</h3>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-4 items-center gap-4 border p-2 rounded-md">
                <Label htmlFor={`items.${index}.itemId`} className="text-right">Item</Label>
                <Select
                  onValueChange={(value) => form.setValue(`items.${index}.itemId`, value)}
                  defaultValue={field.itemId}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select an item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((catalogItem) => (
                      <SelectItem key={catalogItem.id} value={catalogItem.id}>
                        {catalogItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.items?.[index]?.itemId && (
                  <p className="col-span-4 text-red-500 text-sm">{form.formState.errors.items[index]?.itemId?.message}</p>
                )}

                <Label htmlFor={`items.${index}.quantity`} className="text-right">Quantity</Label>
                <Input
                  id={`items.${index}.quantity`}
                  type="number"
                  {...form.register(`items.${index}.quantity`)}
                  className="col-span-3"
                />
                {form.formState.errors.items?.[index]?.quantity && (
                  <p className="col-span-4 text-red-500 text-sm">{form.formState.errors.items[index]?.quantity?.message}</p>
                )}

                <Label htmlFor={`items.${index}.unit`} className="text-right">Unit</Label>
                <Input
                  id={`items.${index}.unit`}
                  {...form.register(`items.${index}.unit`)}
                  className="col-span-3"
                />

                <Label htmlFor={`items.${index}.lineTotal`} className="text-right">Line Total</Label>
                <Input
                  id={`items.${index}.lineTotal`}
                  type="number"
                  step="0.01"
                  {...form.register(`items.${index}.lineTotal`)}
                  className="col-span-3"
                />
                {form.formState.errors.items?.[index]?.lineTotal && (
                  <p className="col-span-4 text-red-500 text-sm">{form.formState.errors.items[index]?.lineTotal?.message}</p>
                )}

                <Button type="button" onClick={() => remove(index)} className="col-span-4">Remove Item</Button>
              </div>
            ))}
            <Button type="button" onClick={() => append({ itemId: '', quantity: 0, unit: '', lineTotal: 0 })} className="col-span-4">Add Item</Button>
            {form.formState.errors.items && (
              <p className="col-span-4 text-red-500 text-sm">{form.formState.errors.items.message}</p>
            )}
          </div>
          <Button type="submit">Save Purchase</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}