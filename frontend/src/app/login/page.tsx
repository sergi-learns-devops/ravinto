'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemeMiniToggle } from '@/components/ui/ThemeMiniToggle';
import { useTranslation } from '@/i18n';

export default function LoginPage() {
  const { login, loading, error, clearError } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <ThemeMiniToggle />
      {/* Animated background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary-400/10 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent-400/10 blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-secondary-400/8 blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
      </div>

      <div className="w-full max-w-sm animate-scale-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo-160.png" alt="Ravinto" className="h-16 w-auto mb-4 drop-shadow-lg" />
          <h1 className="text-3xl font-bold font-heading text-neutral-900 dark:text-white">
            {t.app_name}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {t.app_tagline}
          </p>
        </div>

        {/* Form */}
        <div className="glass-card p-7">
          <h2 className="text-lg font-semibold font-heading mb-6 text-neutral-900 dark:text-white">
            {t.login_title}
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm text-red-600 dark:text-red-400 text-sm border border-red-200/50 dark:border-red-800/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              required
              minLength={8}
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              {t.login_button}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-5">
          {t.no_account}{' '}
          <Link href="/register" className="text-primary-500 hover:text-primary-600 font-semibold">
            {t.register_link}
          </Link>
        </p>
      </div>
    </div>
  );
}
