export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container flex flex-wrap items-center justify-between gap-3 py-6 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} Atelier</span>
        <span>Powered by NestJS gateway + microservices</span>
      </div>
    </footer>
  );
}

