'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from './Button';
import { useTranslation } from '@/i18n';

interface EmptyStateProps {
  variant?: 'meals' | 'history' | 'search' | 'favorites';
}

export function EmptyState({ variant = 'meals' }: EmptyStateProps) {
  const { t } = useTranslation();

  const configs = {
    meals: {
      emoji: '🍽️',
      title: t.empty_meals_title,
      message: t.empty_meals_msg,
      cta: t.empty_meals_cta,
      href: '/add-meal',
    },
    history: {
      emoji: '📅',
      title: t.empty_history_title,
      message: t.empty_history_msg,
      cta: t.nav_home,
      href: '/dashboard',
    },
    search: {
      emoji: '🔍',
      title: t.empty_search_title,
      message: t.empty_search_msg,
      cta: null,
      href: null,
    },
    favorites: {
      emoji: '⭐',
      title: t.empty_search_title,
      message: t.empty_search_msg,
      cta: t.search_food,
      href: '/add-meal',
    },
  };

  const config = configs[variant];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Decorative illustration */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-primary-50/80 dark:bg-primary-900/10 flex items-center justify-center">
          <span className="text-4xl">{config.emoji}</span>
        </div>
        {/* Decorative dots */}
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary-300/40 animate-pulse" />
        <div className="absolute -bottom-2 -left-2 w-2 h-2 rounded-full bg-accent-300/40 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 -right-4 w-1.5 h-1.5 rounded-full bg-secondary-300/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Text */}
      <h3 className="text-lg font-semibold font-heading text-neutral-800 dark:text-white mb-2">
        {config.title}
      </h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mb-6">
        {config.message}
      </p>

      {/* CTA */}
      {config.cta && config.href && (
        <Link href={config.href}>
          <Button>
            <Plus className="w-4 h-4 mr-1.5" />
            {config.cta}
          </Button>
        </Link>
      )}
    </div>
  );
}
