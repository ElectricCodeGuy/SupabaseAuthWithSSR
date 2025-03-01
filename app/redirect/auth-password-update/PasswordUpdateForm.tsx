'use client';
import React, { useState, type FC, Suspense } from 'react';
import { resetPassword } from './action';
import { Lock, Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import Message from './messages';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PasswordUpdateForm: FC = () => {
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password)
    };
    setPasswordRequirements(requirements);
  };

  const handleSubmit = async (formData: FormData) => {
    // Check if the passwords match
    if (newPassword !== confirmPassword) {
      alert('Passwords must match.');
      return;
    }
    await resetPassword(formData);
  };

  return (
    <div className="flex justify-center items-center w-full max-w-[800px] mx-auto">
      <Card className="flex flex-col self-center rounded-2xl w-full sm:w-[350px] md:w-[500px] shadow-[0px_5px_15px_0px_rgba(0,0,0,0.05),0px_15px_35px_-5px_rgba(25,28,33,0.05),0px_0px_0px_1px_rgba(0,0,0,0.05)]">
        <CardHeader className="pb-2">
          <CardTitle>Update Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={handleSubmit}
            noValidate
            className="flex flex-col w-full gap-y-2 md:gap-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Lock className="h-4 w-4" />
                </span>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    validatePassword(e.target.value);
                  }}
                  autoComplete="new-password"
                  className="pl-10 py-5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Lock className="h-4 w-4" />
                </span>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pl-10 py-5"
                />
              </div>
            </div>

            <Suspense fallback={null}>
              <Message />
            </Suspense>

            <SubmitButton />
          </form>
        </CardContent>
      </Card>

      <div className="hidden sm:flex justify-center items-center ml-2">
        <PasswordRequirements requirements={passwordRequirements} />
      </div>
    </div>
  );
};

export default PasswordUpdateForm;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <div className="flex justify-center mt-2">
      <Button type="submit" disabled={pending} className="w-[200px]">
        {pending ? (
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
        ) : (
          'Update Password'
        )}
      </Button>
    </div>
  );
}

interface PasswordRequirementsProps {
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
  };
}

function PasswordRequirements({ requirements }: PasswordRequirementsProps) {
  return (
    <div className="w-[240px] bg-white shadow-md rounded-2xl p-4 ml-2">
      <p className="text-sm font-semibold mb-2">Password Requirements:</p>
      <ul className="pl-5 m-0 space-y-1">
        <li className={requirements.length ? 'text-green-600' : 'text-red-600'}>
          Length (at least 6 characters)
        </li>
        <li
          className={requirements.uppercase ? 'text-green-600' : 'text-red-600'}
        >
          Uppercase letter
        </li>
        <li
          className={requirements.lowercase ? 'text-green-600' : 'text-red-600'}
        >
          Lowercase letter
        </li>
        <li className={requirements.number ? 'text-green-600' : 'text-red-600'}>
          Number
        </li>
      </ul>
    </div>
  );
}
