'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteBill, updateBill, markBillAsPaid } from '@/lib/actions/bills.actions';
import type { Bill, Category } from '@/lib/db/schema';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  vendor: z.string().optional(),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  dueDate: z.date({ required_error: "Due date is required." }),
  recurringRule: z.string().optional(),
  categoryId: z.string().uuid({ message: "Please select a category." }).optional(),
  notes: z.string().optional(),
});

export function BillActions({ bill, categories }: { bill: Bill, categories: Category[] }) {
  const [dueDate, setDueDate] = useState<Date | undefined>(bill.dueDate || undefined);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: bill.name,
      vendor: bill.vendor || '',
      amount: parseFloat(bill.amount),
      dueDate: bill.dueDate || undefined,
      recurringRule: bill.recurringRule || '',
      categoryId: bill.categoryId || undefined,
      notes: bill.notes || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData();
    for (const key in values) {
      if (values[key as keyof typeof values] !== undefined) {
        if (values[key as keyof typeof values] instanceof Date) {
          formData.append(key, (values[key as keyof typeof values] as Date).toISOString());
        } else {
          formData.append(key, String(values[key as keyof typeof values]));
        }
      }
    }
    await updateBill(bill.id, formData);
    // Optionally close dialog or show toast
  }

  return (
    <div className="flex gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Edit</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bill</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" className="col-span-3" {...form.register('name')} />
                {form.formState.errors.name && (
                  <p className="col-span-4 text-red-500 text-sm">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vendor" className="text-right">
                  Vendor
                </Label>
                <Input id="vendor" className="col-span-3" {...form.register('vendor')} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input id="amount" type="number" step="0.01" className="col-span-3" {...form.register('amount')} />
                {form.formState.errors.amount && (
                  <p className="col-span-4 text-red-500 text-sm">{form.formState.errors.amount.message}</p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">
                  Due Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "col-span-3 justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => {
                        setDueDate(date || undefined);
                        form.setValue('dueDate', date || undefined);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.dueDate && (
                  <p className="col-span-4 text-red-500 text-sm">{form.formState.errors.dueDate.message}</p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="categoryId" className="text-right">
                  Category
                </Label>
                <Select name="categoryId" defaultValue={bill.categoryId || ''} onValueChange={(value) => form.setValue('categoryId', value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.categoryId && (
                  <p className="col-span-4 text-red-500 text-sm">{form.formState.errors.categoryId.message}</p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="recurringRule" className="text-right">
                  Recurring Rule (RRULE)
                </Label>
                <Input id="recurringRule" className="col-span-3" {...form.register('recurringRule')} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notes
                </Label>
                <Input id="notes" className="col-span-3" {...form.register('notes')} />
              </div>
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">Delete</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the bill.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <form action={deleteBill.bind(null, bill.id)}>
              <AlertDialogAction type="submit">Continue</AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {bill.status === 'pending' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Mark as Paid</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark Bill as Paid?</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark the bill as paid and create an expense record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <form action={markBillAsPaid.bind(null, bill.id, parseFloat(bill.amount))}>
                <AlertDialogAction type="submit">Confirm Paid</AlertDialogAction>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}