import { AuthHeading } from '@/features/auth/components/AuthHeading';
import { SignInForm } from '@/features/auth/components/SignInForm';
import { authLabels } from '@/features/auth/data/labels';
import { toSafeReturnPath } from '@/lib/returnPath';

export const metadata = { title: 'Sign in' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = toSafeReturnPath(next);

  return (
    <div className="flex flex-col gap-8">
      <AuthHeading title={authLabels.signInHeading} lead={authLabels.signInLead} />
      <SignInForm next={safeNext} />
    </div>
  );
}
