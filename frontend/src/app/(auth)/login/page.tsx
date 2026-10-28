'use client';

import { useState } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertDialog } from '@/components/ui/Modal';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle, User, Mail, Lock, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { LoginRequest } from '@/types/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/cases';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    setError(null);
    try {
      await login(data);
      router.push(callbackUrl);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(message);
      setShowErrorDialog(true);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-forensic-text">Sign In</h1>
        <p className="text-forensic-muted mt-2">Enter your credentials to access the investigation platform</p>
      </div>

      <AlertDialog
        isOpen={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        title="Login Failed"
        message={error || 'An error occurred during login'}
        actionText="OK"
      />

      <div className="space-y-4">
        <Input
          label="Username"
          placeholder="Enter your username"
          type="text"
          autoComplete="username"
          {...register('username', {
            required: 'Username is required',
            minLength: { value: 3, message: 'Username must be at least 3 characters' },
          })}
          error={errors.username?.message}
          leftIcon={<User className="w-5 h-5" />}
          disabled={isSubmitting || authLoading}
        />

        <div className="relative">
          <Input
            label="Password"
            placeholder="Create a strong password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                message: 'Password must contain uppercase, lowercase, number, and special character',
              },
            })}
            error={errors.password?.message}
            leftIcon={<Lock className="w-5 h-5" />}
            disabled={isSubmitting || authLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-forensic-muted hover:text-forensic-text transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="relative">
          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
            })}
            error={errors.confirmPassword?.message}
            leftIcon={<Lock className="w-5 h-5" />}
            disabled={isSubmitting || authLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-[38px] text-forensic-muted hover:text-forensic-text transition-colors"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
</div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="terms"
            required
            {...register('terms', { required: 'You must accept the terms and conditions' })}
            className="mt-1 w-4 h-4 rounded border-forensic-border bg-forensic-bg text-forensic-accent focus:ring-forensic-accent"
          />
          <label htmlFor="terms" className="text-sm text-forensic-muted">
            I agree to the{' '}
            <Link href="/terms" className="text-forensic-accent hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-forensic-accent hover:underline">Privacy Policy</Link>
          </label>
        </div>
        {errors.terms && (
          <p className="text-sm text-red-400">{errors.terms.message}</p>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isSubmitting || authLoading}
          leftIcon={isSubmitting ? <Loader2 className="w-5 h-5" /> : null}
        >
          Create Account
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-forensic-border/50" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-forensic-surface text-forensic-muted">
            Password Requirements
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-forensic-muted">
        <div className="flex items-center gap-2 p-2 bg-forensic-bg rounded-lg border border-forensic-border/50">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span>At least 8 characters</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-forensic-bg rounded-lg border border-forensic-border/50">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span>Uppercase & lowercase</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-forensic-bg rounded-lg border border-forensic-border/50">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span>At least one number</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-forensic-bg rounded-lg border border-forensic-border/50">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span>Special character (@$!%*?&)</span>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-forensic-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-forensic-accent hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-forensic-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-forensic-accent/20 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-forensic-accent animate-spin" />
        </div>
        <p className="text-forensic-muted">Loading...</p>
      </div>
    </div>}>
      <LoginForm />
    </Suspense>
  );
}