import { AuthHeading } from '@/features/auth/components/AuthHeading';
import { SignUpForm } from '@/features/auth/components/SignUpForm';
import { authLabels } from '@/features/auth/data/labels';

export const metadata = { title: 'Create account' };

export default function SignUpPage() {
  return (
    <div className="flex flex-col gap-8">
      <AuthHeading title={authLabels.signUpHeading} lead={authLabels.signUpLead} />
      <SignUpForm />
    </div>
  );
}
