'use client';
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import ForgotPassword from '../ForgotPassword';
import { GoogleIcon } from '../CustomIcons';
import { signup } from '../action';
import { useFormStatus } from 'react-dom';
import { signInWithGoogle } from '../OAuth';
import Link from 'next/link';

export default function SignInCard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [confirmPasswordErrorMessage, setConfirmPasswordErrorMessage] =
    useState('');
  const [open, setOpen] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });
  const handleClose = () => {
    setOpen(false);
  };

  const [alertMessage, setAlertMessage] = useState<{
    type: 'error' | 'success' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleSubmit = async (formData: FormData) => {
    if (validateInputs()) {
      const result = await signup(formData);

      setAlertMessage({
        type: result.success ? 'success' : 'error',
        message: result.message
      });

      // Clear message after 5 seconds
      setTimeout(() => {
        setAlertMessage({ type: null, message: '' });
      }, 5000);
    }
  };

  const validateInputs = useCallback(() => {
    let isValid = true;

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password.trim()) {
      setPasswordError(true);
      setPasswordErrorMessage('Password cannot be empty.');
      isValid = false;
    } else {
      let passwordErrorMessage = '';

      if (password.length < 6) {
        passwordErrorMessage += 'Password must be at least 6 characters long. ';
        isValid = false;
      }

      if (!/\d/.test(password)) {
        passwordErrorMessage += 'Password must contain at least one number. ';
        isValid = false;
      }

      if (!isValid) {
        setPasswordError(true);
        setPasswordErrorMessage(passwordErrorMessage.trim());
      } else {
        setPasswordError(false);
        setPasswordErrorMessage('');
      }
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError(true);
      setConfirmPasswordErrorMessage('Passwords do not match.');
      isValid = false;
    } else {
      setConfirmPasswordError(false);
      setConfirmPasswordErrorMessage('');
    }

    return isValid;
  }, [email, password, confirmPassword]);

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password)
    };
    setPasswordRequirements(requirements);
  };

  return (
    <div className="flex justify-center items-center">
      <div className="w-full sm:w-[350px] md:w-[400px]">
        <Card className="shadow-md">
          <CardContent className="p-4 pt-6 space-y-4">
            <h1 className="text-2xl font-semibold">Sign Up</h1>

            <form action={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  autoComplete="email"
                  required
                  className={emailError ? 'border-red-500' : ''}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {emailError && (
                  <p className="text-sm text-red-500">{emailErrorMessage}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="John Doe"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  name="password"
                  placeholder="••••••"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  required
                  className={passwordError ? 'border-red-500' : ''}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    validatePassword(e.target.value);
                  }}
                />
                {passwordError && (
                  <p className="text-sm text-red-500">{passwordErrorMessage}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  name="confirmPassword"
                  placeholder="••••••"
                  type="password"
                  id="confirmPassword"
                  autoComplete="new-password"
                  required
                  className={confirmPasswordError ? 'border-red-500' : ''}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {confirmPasswordError && (
                  <p className="text-sm text-red-500">
                    {confirmPasswordErrorMessage}
                  </p>
                )}
              </div>

              <SubmitButton />

              {alertMessage.type && (
                <Alert
                  className={
                    alertMessage.type === 'error'
                      ? 'border-red-600 bg-red-50 text-red-800'
                      : 'border-green-600 bg-green-50 text-green-800'
                  }
                >
                  <AlertDescription>{alertMessage.message}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center">
                <Button asChild variant="outline" className="w-auto">
                  <Link href="/signin" replace>
                    Already have an account?
                  </Link>
                </Button>
              </div>
            </form>

            <div className="relative py-2">
              <Separator />
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-gray-500 text-sm">
                or
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => signInWithGoogle()}
            >
              <GoogleIcon />
              Sign up with Google
            </Button>

            <ForgotPassword open={open} handleClose={handleClose} />
          </CardContent>
        </Card>
      </div>

      <div className="hidden md:flex justify-center items-center ml-2">
        <PasswordRequirements requirements={passwordRequirements} />
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        'Create Account'
      )}
    </Button>
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
    <div className="w-[240px] bg-white shadow-md rounded-2xl p-2">
      <p className="text-sm font-medium mb-1">Password Requirements:</p>
      <ul className="pl-5 m-0">
        <li className={requirements.length ? 'text-green-600' : 'text-red-600'}>
          Length (at least 6 characters)
        </li>
        <li className={requirements.number ? 'text-green-600' : 'text-red-600'}>
          Number
        </li>
      </ul>
    </div>
  );
}
