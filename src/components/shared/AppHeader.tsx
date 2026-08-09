import Link from 'next/link';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { initialsOf } from '@/lib/initialsOf';

export function AppHeader({
  fullName,
  email,
  role,
  nav,
  actions,
}: {
  fullName: string;
  email: string;
  role: string;
  nav?: React.ReactNode;
  // A slot, not an import: shared components may not reach into a feature.
  actions?: React.ReactNode;
}) {
  return (
    <header className="bg-background/80 border-border sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="bg-foreground text-background flex size-7 items-center justify-center rounded-lg text-xs font-bold">
            B
          </span>
          <span className="hidden text-sm font-semibold tracking-tight sm:block">Bunyaad</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">{nav}</nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-medium">{fullName}</p>
            <p className="text-muted-foreground text-xs">{email}</p>
          </div>
          <Avatar className="size-9">
            <AvatarFallback className="text-xs font-semibold">
              {initialsOf(fullName)}
            </AvatarFallback>
          </Avatar>
          <Badge variant="secondary" className="hidden capitalize md:inline-flex">
            {role}
          </Badge>
          {actions}
        </div>
      </div>
    </header>
  );
}
