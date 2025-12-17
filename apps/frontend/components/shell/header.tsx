import Link from 'next/link';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/catalog', label: 'Catalog' },
  { href: '/cart', label: 'Cart' },
  { href: '/checkout', label: 'Checkout' },
  { href: '/orders', label: 'Orders' },
  { href: '/profile', label: 'Profile' }
];

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur">
      <div className="container flex items-center justify-between gap-4 py-4">
        <Link className="text-lg font-bold tracking-tight" href="/">
          Atelier
        </Link>
        <nav className="hidden items-center gap-2 md:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/search">Search</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

