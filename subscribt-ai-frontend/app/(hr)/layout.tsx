import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HR Manager - Subscribt AI',
  description: 'Policy management and analytics for HR managers',
};

export default function HRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Subscribt AI</h1>
              <p className="text-sm text-muted-foreground">HR Manager Portal</p>
            </div>
            <nav className="flex gap-4">
              <a href="/hr/upload" className="text-sm hover:underline">
                Upload Documents
              </a>
              <a href="/hr/documents" className="text-sm hover:underline">
                Manage Documents
              </a>
              <a href="/hr/analytics" className="text-sm hover:underline">
                Analytics
              </a>
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
