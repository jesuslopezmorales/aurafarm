import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { LEGAL } from "@/lib/legal-info";

interface LegalLayoutProps {
  title: string;
  children: ReactNode;
}

interface LegalSectionProps {
  heading: string;
  children: ReactNode;
}

export function LegalLayout({ title, children }: LegalLayoutProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-2xl px-5 pb-20 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a {LEGAL.appName}
        </Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Última actualización: {LEGAL.lastUpdated}
        </p>
        {children}
      </div>
    </main>
  );
}

export function LegalSection({ heading, children }: LegalSectionProps) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}