import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { SEO } from '../components/SEO.tsx';
import { BrandLogo } from '../components/BrandLogo.tsx';
import { useAuth } from '../context/AuthContext.tsx';

function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder = '••••••••',
  autoComplete = 'current-password',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-zinc-400 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 pl-10 pr-11 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white placeholder:text-zinc-600 focus:border-[#D91E2A] focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      navigate(user.role === 'admin' ? '/admin' : '/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SEO
        title="Sign In | CHAND MOTORS"
        description="Sign in to your CHAND MOTORS account to manage saved motorcycles, view inquiry status, or access showroom tools."
        path="/login"
        noindex
      />

      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-[#141417] border border-zinc-800 rounded-lg p-7 sm:p-8 space-y-6">
          <div className="space-y-2">
            <BrandLogo size="sm" />
            <h1 className="font-display text-3xl font-bold text-white tracking-tight pt-2">
              Sign In to CHAND MOTORS
            </h1>
            <p className="text-sm text-zinc-400">
              Access your saved garage, inquiry history, or showroom administration.
            </p>
          </div>

          {error && (
            <div role="alert" className="p-3 rounded bg-red-950/60 border border-red-800 text-xs text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-11 pl-10 pr-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white placeholder:text-zinc-600 focus:border-[#D91E2A] focus:outline-none"
                />
              </div>
            </div>

            <PasswordInput id="login-password" label="Password" value={password} onChange={setPassword} />

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs font-medium text-zinc-400 hover:text-white">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-md bg-[#D91E2A] hover:bg-[#b91822] disabled:opacity-60 text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-400 pt-2 border-t border-zinc-800">
            New to CHAND MOTORS?{' '}
            <Link to="/register" className="text-white font-semibold hover:text-[#D91E2A]">
              Create an Account
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, phone: phone.trim(), city: city.trim() });
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SEO
        title="Create Account | CHAND MOTORS"
        description="Register a CHAND MOTORS account to save favorite motorcycles and track dealer inquiries."
        path="/register"
        noindex
      />

      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-[#141417] border border-zinc-800 rounded-lg p-7 sm:p-8 space-y-6">
          <div className="space-y-2">
            <BrandLogo size="sm" />
            <h1 className="font-display text-3xl font-bold text-white tracking-tight pt-2">
              Create Your Account
            </h1>
            <p className="text-sm text-zinc-400">
              Save motorcycles to your garage and manage your booking inquiries.
            </p>
          </div>

          {error && (
            <div role="alert" className="p-3 rounded bg-red-950/60 border border-red-800 text-xs text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ali Raza"
                  className="w-full h-11 pl-10 pr-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white placeholder:text-zinc-600 focus:border-[#D91E2A] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ali@example.com"
                  className="w-full h-11 pl-10 pr-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white placeholder:text-zinc-600 focus:border-[#D91E2A] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-phone" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Phone / WhatsApp
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03XX-XXXXXXX"
                  className="w-full h-11 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white placeholder:text-zinc-600 focus:border-[#D91E2A] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="reg-city" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  City
                </label>
                <input
                  id="reg-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-11 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
                />
              </div>
            </div>

            <PasswordInput
              id="reg-password"
              label="Password (min. 8 characters) *"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
            />
            <PasswordInput
              id="reg-confirm"
              label="Confirm Password *"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-md bg-[#D91E2A] hover:bg-[#b91822] disabled:opacity-60 text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              {submitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-400 pt-2 border-t border-zinc-800">
            Already have an account?{' '}
            <Link to="/login" className="text-white font-semibold hover:text-[#D91E2A]">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed.');
      setMessage(data.message);
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset code.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed.');
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SEO
        title="Reset Password | CHAND MOTORS"
        description="Reset your CHAND MOTORS account password securely."
        path="/forgot-password"
        noindex
      />

      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-[#141417] border border-zinc-800 rounded-lg p-7 sm:p-8 space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-white tracking-tight">
              Reset Your Password
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              {step === 'request'
                ? 'Enter your registered email to request a 6-digit reset code.'
                : 'Enter the 6-digit verification code and choose a new password.'}
            </p>
          </div>

          {error && (
            <div role="alert" className="p-3 rounded bg-red-950/60 border border-red-800 text-xs text-red-200">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 rounded bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 space-y-1">
              <p>{message}</p>
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-md bg-[#D91E2A] hover:bg-[#b91822] text-sm font-semibold text-white cursor-pointer"
              >
                {submitting ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label htmlFor="reset-code" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  6-Digit Verification Code
                </label>
                <input
                  id="reset-code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full h-11 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white font-mono focus:border-[#D91E2A] focus:outline-none"
                />
              </div>

              <PasswordInput
                id="reset-new-pw"
                label="New Password (min. 8 characters)"
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-md bg-[#D91E2A] hover:bg-[#b91822] text-sm font-semibold text-white cursor-pointer"
              >
                {submitting ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-zinc-400">
            <Link to="/login" className="hover:text-white">
              Return to Sign In
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
