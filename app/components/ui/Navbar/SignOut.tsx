import React from 'react';
import { signout } from '@/app/(auth)/action';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut } from 'lucide-react';

export default function SignOut() {
  return (
    <div className="flex justify-center">
      <form action={signout}>
        <SubmitButton />
      </form>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      className="w-full rounded-full"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <>
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </>
      )}
    </Button>
  );
}
