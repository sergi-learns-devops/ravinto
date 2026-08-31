'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  variant?: 'meals' | 'history' | 'search' | 'favorites';
}

export function EmptyState({ variant = 'meals' }: EmptyStateProps) {
  const configs = {
    meals: {
      emoji: '🍽️',
      title: '¡Tu día está en blanco!',
      message: 'Registra tu primera comida y empieza a nutrir tu jardín interior.',
      cta: 'Añadir comida',
      href: '/add-meal',
    },
    history: {
      emoji: '📅',
      title: 'Aún no hay historial',
      message: 'Empieza a registrar tus comidas y aquí verás tu progreso semanal.',
      cta: 'Ir al dashboard',
      href: '/dashboard',
    },
    search: {
      emoji: '🔍',
      title: 'No se encontraron resultados',
      message: 'Intenta con otro nombre o crea el alimento manualmente.',
      cta: null,
      href: null,
    },
    favorites: {
      emoji: '⭐',
      title: 'Sin favoritos todavía',
      message: 'Guarda los alimentos que más usas para acceder rápido.',
      cta: 'Buscar alimentos',
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
