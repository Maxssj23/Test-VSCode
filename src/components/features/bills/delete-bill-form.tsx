'use client';


import { deleteBill } from '@/lib/actions/bills.actions';
import { useFormState } from 'react-dom';
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"

const initialState = undefined

export function DeleteBillForm({ billId }: { billId: string }) {
  const [_, formAction] = useFormState(deleteBill, initialState)

  return (
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <form action={formAction}>
        <input type="hidden" name="billId" value={billId} />
        <AlertDialogAction type="submit">Continue</AlertDialogAction>
      </form>
      
    </AlertDialogFooter>
  );
}
