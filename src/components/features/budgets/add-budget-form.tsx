'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createBudget } from '@/lib/actions/budgets.actions';
import { useState } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "Period must be in YYYY-MM format"),
  limitAmount: z.coerce.number().positive("Limit amount must be positive"),
});

export function AddBudgetForm() {
  const [period, setPeriod] = useState(format(new Date(), 'yyyy-MM'));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      period: format(new Date(), 'yyyy-MM'),
      limitAmount: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData();
    for (const key in values) {
      if (values[key as keyof typeof values] !== undefined) {
        formData.append(key, String(values[key as keyof typeof values]));
      }
    }
    await createBudget(formData);
    form.reset();
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Set Budget</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Monthly Budget</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="period" className="text-right">
                Period (YYYY-MM)
              </Label>
              <Input id="period" className="col-span-3" {...form.register('period')} />
              {form.formState.errors.period && (
                <p className="col-span-4 text-red-500 text-sm">{form.formState.errors.period.message}</p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="limitAmount" className="text-right">
                Limit Amount
              </Label>
              <Input id="limitAmount" type="number" step="0.01" className="col-span-3" {...form.register('limitAmount')} />
              {form.formState.errors.limitAmount && (
                <p className="col-span-4 text-red-500 text-sm">{form.formState.errors.limitAmount.message}</p>
              )}
            </div>
          </div>
          <Button type="submit">Save Budget</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}