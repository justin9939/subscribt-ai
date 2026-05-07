/**
 * Employee route group layout
 * Shared layout for all employee-facing pages
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Policy Assistant - Subscribt AI',
  description: 'Query your workplace policies in plain language',
};

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
