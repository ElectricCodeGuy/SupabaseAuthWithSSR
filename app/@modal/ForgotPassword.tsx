'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useFormStatus } from 'react-dom';
import { resetPasswordForEmail } from './action';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ForgotPassword() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const currentPathname = usePathname();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
  };

  const handleSubmit = async (formData: FormData) => {
    formData.append('currentPathname', currentPathname);
    const email = formData.get('email') as string;
    if (email.trim() === '') {
      setError('Email address is required');
      return;
    }
    await resetPasswordForEmail(formData);
    setError('');
  };

  return (
    <>
      <Button
        type="button"
        variant="link"
        onClick={handleClickOpen}
        className="p-0 h-auto"
      >
        Forgot your password?
      </Button>

      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleClose();
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>

          <form action={handleSubmit} noValidate className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your account&apos;s email address, and we&apos;ll send you a
              link to reset your password.
            </p>

            <Input
              required
              id="email"
              name="email"
              placeholder="Email address"
              type="email"
              autoComplete="email"
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <SubmitButton />

            <div className="flex justify-end mt-2">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Continue'}
    </Button>
  );
}
