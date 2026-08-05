import { AuthHeading } from '@/features/auth/components/fields';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { authLabels } from '@/features/auth/data/labels';

export const metadata = { title: 'Reset password' };

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col gap-8">
      <AuthHeading title={authLabels.resetHeading} lead={authLabels.resetLead} />
      <ResetPasswordForm />
    </div>
  );
}
