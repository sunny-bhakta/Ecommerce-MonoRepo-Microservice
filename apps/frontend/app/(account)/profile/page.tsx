import Link from 'next/link';
import { getProfile } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default async function ProfilePage() {
  const profile = await getProfile().catch(() => null);

  if (!profile) {
    return (
      <div className="container py-10">
        <Card className="p-6 space-y-3">
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-muted-foreground">Sign in to view your profile.</p>
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container space-y-4 py-10">
      <h1 className="text-3xl font-bold">Profile</h1>
      <Card className="p-6 space-y-4">
        <div>
          <div className="text-sm text-muted-foreground">Name</div>
          <div className="text-lg font-semibold">{profile.fullName ?? '—'}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Email</div>
          <div className="text-lg font-semibold">{profile.email ?? '—'}</div>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Roles</div>
          <div className="flex flex-wrap gap-2">
            {(profile.roles ?? ['customer']).map((role) => (
              <Badge key={role} variant="secondary">
                {role}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      <Button variant="secondary" asChild>
        <Link href="/logout">Sign out</Link>
      </Button>
    </div>
  );
}

