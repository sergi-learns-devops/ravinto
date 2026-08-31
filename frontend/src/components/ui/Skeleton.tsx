import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'card' | 'ring';
}

export function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  const baseClasses = 'relative overflow-hidden bg-primary-100/40 dark:bg-white/5 rounded-lg';
  const shimmer = 'after:absolute after:inset-0 after:translate-x-[-100%] after:animate-[shimmer_1.5s_infinite] after:bg-gradient-to-r after:from-transparent after:via-primary-200/30 after:dark:via-white/5 after:to-transparent';

  if (variant === 'ring') {
    return (
      <div className={clsx('flex flex-col items-center gap-4', className)}>
        <div className={clsx(baseClasses, shimmer, 'w-[240px] h-[240px] rounded-full')} />
        <div className="flex gap-8">
          <div className={clsx(baseClasses, shimmer, 'w-12 h-8 rounded-lg')} />
          <div className={clsx(baseClasses, shimmer, 'w-12 h-8 rounded-lg')} />
          <div className={clsx(baseClasses, shimmer, 'w-12 h-8 rounded-lg')} />
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={clsx('glass-card space-y-3', className)}>
        <div className={clsx(baseClasses, shimmer, 'h-4 w-2/3')} />
        <div className={clsx(baseClasses, shimmer, 'h-3 w-full')} />
        <div className={clsx(baseClasses, shimmer, 'h-3 w-4/5')} />
      </div>
    );
  }

  if (variant === 'circle') {
    return <div className={clsx(baseClasses, shimmer, 'rounded-full', className)} />;
  }

  return <div className={clsx(baseClasses, shimmer, className)} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Ring */}
      <div className="glass-card flex flex-col items-center py-10">
        <Skeleton variant="ring" />
      </div>

      {/* Meals grid */}
      <div>
        <Skeleton className="h-3 w-24 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card py-6">
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" variant="circle" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Streak */}
      <Skeleton variant="card" className="h-20" />
    </div>
  );
}
