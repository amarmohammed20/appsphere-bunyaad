'use client';

import { MIN_PASSWORD_LENGTH } from '../data/constants';

const STRENGTH_LABELS = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'] as const;

// Bound to the real policy: below MIN_PASSWORD_LENGTH is the only state that
// blocks submission; everything above is guidance, not a gate.
function scorePassword(value: string): number {
  if (value.length < MIN_PASSWORD_LENGTH) {
    return 0;
  }

  let score = 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) score += 1;

  return score;
}

/** Four quiet segments. Confidence, not a lecture. */
export function PasswordStrength({ value }: { value: string }) {
  if (value.length === 0) {
    return null;
  }

  const score = scorePassword(value);

  let filledColor = 'bg-emerald-500';
  if (score <= 1) {
    filledColor = 'bg-red-400';
  } else if (score === 2) {
    filledColor = 'bg-amber-400';
  }

  return (
    <div className="fade-up flex items-center gap-2" aria-live="polite">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              score >= segment ? filledColor : 'bg-zinc-200 dark:bg-zinc-800'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
        {STRENGTH_LABELS[score]}
      </span>
    </div>
  );
}
