"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ListChecks, Loader2 } from "lucide-react";

import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/hooks/use-auth";

/**
 * Shell for the sign-in / sign-up screens: a centered form column with a
 * decorative brand panel on wide viewports. Authenticated users are bounced
 * to the dashboard.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Decorative panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-indigo-700 lg:flex lg:flex-col lg:justify-between lg:p-12 text-primary-foreground">
        <Brand href="/" className="text-primary-foreground" />
        <div className="space-y-6">
          <ListChecks className="h-12 w-12 opacity-90" />
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Plan less.
            <br />
            Ship more.
          </h1>
          <p className="max-w-md text-lg text-primary-foreground/80">
            TaskFlow keeps your projects, tasks, and teammates in sync — from
            first idea to done.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">
          &copy; {new Date().getFullYear()} TaskFlow
        </p>
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Form column */}
      <div className="relative flex flex-col items-center justify-center px-4 py-12">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="mb-8 lg:hidden">
          <Brand href="/" />
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
