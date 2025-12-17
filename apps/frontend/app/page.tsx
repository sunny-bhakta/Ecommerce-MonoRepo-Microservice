import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const featureCards = [
  {
    title: 'Browse Catalog',
    body: 'Curated fashion catalog with variants, inventory visibility, and search.',
    href: '/catalog'
  },
  {
    title: 'Checkout & Orders',
    body: 'Seamless checkout through the gateway with payments and order tracking.',
    href: '/checkout'
  },
  {
    title: 'Account',
    body: 'Profile, addresses, and order history with returns/cancellations.',
    href: '/profile'
  }
];

export default function HomePage() {
  return (
    <div className="container space-y-10 py-10">
      <section className="grid gap-6 rounded-3xl border border-border bg-gradient-to-r from-slate-50 via-white to-slate-50 p-8 shadow-sm">
        <div className="space-y-4 max-w-3xl">
          <p className="text-sm font-semibold text-primary">Atelier</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
            World-class fashion ecommerce, powered by your microservices.
          </h1>
          <p className="text-lg text-muted-foreground">
            Next.js + Tailwind + shadcn/ui storefront that talks only to the NestJS gateway. Ready
            for catalog, payments, orders, and personalization.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <Link href="/catalog">
                Shop now <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground md:grid-cols-4">
          <div className="rounded-xl border border-border bg-background/70 p-3">
            <div className="text-foreground font-semibold">Performance</div>
            <div>Edge caching, image CDN ready, Core Web Vitals focused.</div>
          </div>
          <div className="rounded-xl border border-border bg-background/70 p-3">
            <div className="text-foreground font-semibold">Trusted checkout</div>
            <div>Gateway checkout, payment intents, order tracking.</div>
          </div>
          <div className="rounded-xl border border-border bg-background/70 p-3">
            <div className="text-foreground font-semibold">Personalization</div>
            <div>Search, recommendations, analytics hooks.</div>
          </div>
          <div className="rounded-xl border border-border bg-background/70 p-3">
            <div className="text-foreground font-semibold">Design system</div>
            <div>Tailwind + shadcn/ui components for rapid changes.</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {featureCards.map((card) => (
          <Card key={card.title} className="h-full">
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.body}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" asChild>
                <Link href={card.href}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

