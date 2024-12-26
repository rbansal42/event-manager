import Link from 'next/link';
import { useRouter } from 'next/router';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';

export function Header() {
  const router = useRouter();

  const isActive = (path: string) => router.pathname === path;

  return (
    <header className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <nav className="flex items-center space-x-1">
            <Button
              variant={isActive('/') ? "secondary" : "ghost"}
              asChild
            >
              <Link href="/">Dashboard</Link>
            </Button>
            <Button
              variant={isActive('/check-in') ? "secondary" : "ghost"}
              asChild
            >
              <Link href="/check-in">Check-in</Link>
            </Button>
            <Button
              variant={isActive('/import-registrants') ? "secondary" : "ghost"}
              asChild
            >
              <Link href="/import-registrants">Import</Link>
            </Button>
            <Button
              variant={isActive('/export') ? "secondary" : "ghost"}
              asChild
            >
              <Link href="/export">Export</Link>
            </Button>
          </nav>
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
} 