import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="flex min-h-[calc(100dvh-var(--grok-banner-h,0px))] items-center justify-center bg-[var(--color-bg)] px-4 py-12">
      <div className="w-full max-w-sm space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]"
        >
          <ArrowLeft className="size-3.5" />
          Back to analyzer
        </Link>

        <Card>
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-[var(--radius-sm)] bg-[color-mix(in_oklab,var(--color-primary)_18%,transparent)] text-[var(--color-primary)]">
              <FlaskConical className="size-5" />
            </div>
            <CardTitle>Sign in to ReceptorNet</CardTitle>
            <CardDescription>
              Optional account access via Google or X. Analysis works without signing in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {authEnabled ? (
              GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                >
                  Continue with {p.label}
                </Button>
              ))
            ) : (
              <p className="text-sm text-[var(--color-muted)]">
                Sign-in is disabled in this environment.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
