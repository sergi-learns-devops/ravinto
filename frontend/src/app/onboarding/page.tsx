'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Check } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { emoji: '🌱', title: t.onboarding_1_title, description: t.onboarding_1_desc, bg: 'from-primary-400/10 to-primary-500/5' },
    { emoji: '🔍', title: t.onboarding_2_title, description: t.onboarding_2_desc, bg: 'from-secondary-400/10 to-secondary-500/5' },
    { emoji: '🌿', title: t.onboarding_3_title, description: t.onboarding_3_desc, bg: 'from-accent-400/10 to-accent-500/5' },
  ];

  const isLast = currentStep === steps.length - 1;
  const step = steps[currentStep];

  const handleNext = () => {
    if (isLast) {
      router.push('/dashboard');
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${step.bg} transition-all duration-700`} />

      {/* Progress dots */}
      <div className="absolute top-8 flex gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentStep ? 'w-8 bg-primary-400' : i < currentStep ? 'w-1.5 bg-primary-300' : 'w-1.5 bg-neutral-300 dark:bg-neutral-600'
            }`}
          />
        ))}
      </div>

      <button
        onClick={() => router.push('/dashboard')}
        className="absolute top-8 right-6 text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
      >
        {t.onboarding_skip}
      </button>

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm animate-fade-in" key={currentStep}>
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 flex items-center justify-center shadow-xl">
            <span className="text-6xl">{step.emoji}</span>
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary-200/40 dark:border-primary-700/30 animate-spin" style={{ animationDuration: '20s' }} />
        </div>

        <h1 className="text-2xl font-bold font-heading text-neutral-900 dark:text-white mb-3">
          {step.title}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed mb-10">
          {step.description}
        </p>

        <Button onClick={handleNext} size="lg" className="w-full max-w-xs">
          {isLast ? (
            <><Check className="w-5 h-5 mr-2" />{t.onboarding_start}</>
          ) : (
            <>{t.onboarding_next}<ArrowRight className="w-5 h-5 ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  );
}
