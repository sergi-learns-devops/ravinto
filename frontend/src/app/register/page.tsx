'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Botanical } from '@/components/ui/Botanical';
import { ThemeMiniToggle } from '@/components/ui/ThemeMiniToggle';
import { useTranslation } from '@/i18n';

export default function RegisterPage() {
  const { register, loading, error, clearError } = useAuth();
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError(t.passwords_mismatch);
      return;
    }

    await register({ email, password, full_name: fullName });
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <ThemeMiniToggle />
      {/* Animated background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent-400/10 blur-3xl animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary-400/10 blur-3xl animate-pulse" style={{ animationDuration: '11s', animationDelay: '3s' }} />
        <div className="absolute top-[30%] left-[20%] w-[350px] h-[350px] rounded-full bg-secondary-400/8 blur-3xl animate-pulse" style={{ animationDuration: '13s', animationDelay: '1s' }} />
      </div>

      {/* Decorative botanicals */}
      <div className="absolute bottom-10 left-8 w-16 h-24 opacity-40 hidden md:block">
        <Botanical variant="fern" color="#5BB88A" />
      </div>
      <div className="absolute top-20 right-12 w-20 h-14 opacity-30 hidden md:block">
        <Botanical variant="branch" color="#A78BFA" />
      </div>

      <div className="w-full max-w-sm animate-scale-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img src="/logo-160.png" alt="Ravinto" className="h-16 w-auto mb-4 drop-shadow-lg" />
          <h1 className="text-3xl font-bold font-heading text-neutral-900 dark:text-white">
            {t.register_title}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {t.register_subtitle}
          </p>
        </div>

        {/* Form */}
        <div className="glass-card p-7">
          {displayError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm text-red-600 dark:text-red-400 text-sm border border-red-200/50 dark:border-red-800/30">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t.full_name}
              type="text"
              placeholder="María García"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); clearError(); }}
              required
              minLength={2}
            />
            <Input
              label={t.email}
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              required
            />
            <Input
              label={t.password}
              type="password"
              placeholder={t.password_placeholder}
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); setLocalError(''); }}
              required
              minLength={8}
            />
            <Input
              label={t.confirm_password}
              type="password"
              placeholder={t.confirm_password_placeholder}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setLocalError(''); }}
              required
              minLength={8}
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              {t.register_button}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-5">
          {t.has_account}{' '}
          <Link href="/login" className="text-primary-500 hover:text-primary-600 font-semibold">
            {t.login_link}
          </Link>
        </p>
      </div>
    </div>
  );
}
