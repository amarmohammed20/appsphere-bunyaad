import { AuthHeading } from '@/features/auth/components/fields';
import { SignInForm } from '@/features/auth/components/SignInForm';
import { authLabels } from '@/features/auth/data/labels';

export const metadata = { title: 'Sign in' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Only ever redirect within this app — an absolute URL here would let a
  // crafted link bounce a signed-in user to another site.
  const safeNext = next?.startsWith('/') === true ? next : '/';

  return (
    <div className="flex flex-col gap-8">
      <AuthHeading title={authLabels.signInHeading} lead={authLabels.signInLead} />
      <SignInForm next={safeNext} />
    </div>
  );
}
