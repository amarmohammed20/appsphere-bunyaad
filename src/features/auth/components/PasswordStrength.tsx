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

  // Raw colours: the theme has no success or warning token, and a meter needs
  // three distinct states. Indexed by score so weak/medium/strong stay adjacent.
  const filledColor =
    ['bg-red-400', 'bg-red-400', 'bg-amber-400', 'bg-emerald-500'][score] ?? 'bg-emerald-500';

  return (
    <div className="fade-up flex items-center gap-2" aria-live="polite">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              score >= segment ? filledColor : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <span className="text-muted-foreground text-xs tabular-nums">{STRENGTH_LABELS[score]}</span>
    </div>
  );
}
