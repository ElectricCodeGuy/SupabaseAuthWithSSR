'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, X } from 'lucide-react';
import { signup } from '../action';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

export default function SignInCard() {
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [confirmPasswordErrorMessage, setConfirmPasswordErrorMessage] =
    useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });
  const passwordRef = useRef<HTMLInputElement>(null);

  const [alertMessage, setAlertMessage] = useState<{
    type: 'error' | 'success' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleSubmit = async (formData: FormData) => {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (validateInputs(email, password, confirmPassword)) {
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

  const validateInputs = (
    email: string,
    password: string,
    confirmPassword: string
  ) => {
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

      if (passwordErrorMessage) {
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
  };

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password)
    };
    setPasswordRequirements(requirements);
  };

  // Show password requirements when password field is focused
  useEffect(() => {
    const handleFocus = () => setShowPasswordRequirements(true);
    const handleBlur = () => {
      // Only hide if password is empty
      const passwordInput = passwordRef.current;
      if (passwordInput && !passwordInput.value) {
        setShowPasswordRequirements(false);
      }
    };

    const passwordInput = passwordRef.current;
    if (passwordInput) {
      passwordInput.addEventListener('focus', handleFocus);
      passwordInput.addEventListener('blur', handleBlur);
    }

    return () => {
      if (passwordInput) {
        passwordInput.removeEventListener('focus', handleFocus);
        passwordInput.removeEventListener('blur', handleBlur);
      }
    };
  }, []);

  return (
    <div className="flex justify-center items-center">
      <div className="w-full sm:w-[350px] md:w-[400px]">
        <Card className="shadow-md">
          <CardContent className="p-4 pt-6 space-y-4">
            <h1 className="text-2xl font-semibold text-foreground">Sign Up</h1>

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
                  className={emailError ? 'border-destructive' : ''}
                />
                {emailError && (
                  <p className="text-sm text-destructive">
                    {emailErrorMessage}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="password">Password</Label>
                <Popover
                  open={showPasswordRequirements}
                  onOpenChange={setShowPasswordRequirements}
                >
                  <PopoverTrigger asChild>
                    <Input
                      name="password"
                      placeholder="••••••"
                      type="password"
                      id="password"
                      autoComplete="new-password"
                      required
                      ref={passwordRef}
                      className={passwordError ? 'border-destructive' : ''}
                      onChange={(e) => validatePassword(e.target.value)}
                    />
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[240px] p-2"
                    side="right"
                    align="start"
                    sideOffset={5}
                  >
                    <PasswordRequirements requirements={passwordRequirements} />
                  </PopoverContent>
                </Popover>
                {passwordError && (
                  <p className="text-sm text-destructive">
                    {passwordErrorMessage}
                  </p>
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
                  className={confirmPasswordError ? 'border-destructive' : ''}
                />
                {confirmPasswordError && (
                  <p className="text-sm text-destructive">
                    {confirmPasswordErrorMessage}
                  </p>
                )}
              </div>

              <SubmitButton />

              {alertMessage.type && (
                <Alert
                  variant={
                    alertMessage.type === 'error' ? 'destructive' : 'default'
                  }
                  className={
                    alertMessage.type === 'success'
                      ? 'border-green-600 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200 dark:border-green-800'
                      : ''
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
          </CardContent>
        </Card>
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
    <div>
      <p className="text-sm font-medium mb-1 text-foreground">
        Password Requirements:
      </p>
      <ul className="space-y-1 m-0">
        <li className="flex items-center gap-2 text-sm">
          {requirements.length ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-destructive" />
          )}
          <span
            className={
              requirements.length ? 'text-foreground' : 'text-muted-foreground'
            }
          >
            At least 6 characters
          </span>
        </li>
        <li className="flex items-center gap-2 text-sm">
          {requirements.number ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-destructive" />
          )}
          <span
            className={
              requirements.number ? 'text-foreground' : 'text-muted-foreground'
            }
          >
            At least one number
          </span>
        </li>
      </ul>
    </div>
  );
}
