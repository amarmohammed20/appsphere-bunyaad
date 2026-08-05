import { AuthHeading } from '@/features/auth/components/fields';
import { UpdatePasswordForm } from '@/features/auth/components/UpdatePasswordForm';
import { authLabels } from '@/features/auth/data/labels';

export const metadata = { title: 'New password' };

export default function UpdatePasswordPage() {
  return (
    <div className="flex flex-col gap-8">
      <AuthHeading title={authLabels.updatePasswordHeading} lead={authLabels.updatePasswordLead} />
      <UpdatePasswordForm />
    </div>
  );
}
