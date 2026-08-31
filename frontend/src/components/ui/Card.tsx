import { clsx } from 'clsx';
import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: 'primary' | 'secondary' | 'accent';
}

export function Card({ children, className, hover, glow, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        hover ? 'glass-card-hover' : 'glass-card',
        glow === 'primary' && 'shadow-primary-400/10 border-primary-200/30 dark:border-primary-400/20',
        glow === 'secondary' && 'shadow-secondary-400/10 border-secondary-200/30 dark:border-secondary-400/20',
        glow === 'accent' && 'shadow-accent-400/10 border-accent-200/30 dark:border-accent-400/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
