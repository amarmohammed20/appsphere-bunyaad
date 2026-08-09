'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';

// shadcn's dark variant is `.dark` on an ancestor, so something has to set that
// class. Without this every `dark:` utility in the app is inert.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      // The class swap would otherwise animate every colour on the page.
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
