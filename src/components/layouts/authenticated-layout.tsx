"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { LayoutDashboard, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { SubscriptionStatusCard } from "@/features/subscription/components/subscription-status-card";

type AuthenticatedLayoutProps = {
  children: React.ReactNode;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: "대시보드",
    href: ROUTES.dashboard,
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: "새 검사",
    href: ROUTES.newAnalysis,
    icon: <PlusCircle className="h-4 w-4" />,
  },
];

const shouldMockClerk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "test";

export function AuthenticatedLayout(props: AuthenticatedLayoutProps) {
  if (shouldMockClerk) {
    return <MockAuthenticatedLayout {...props} />;
  }

  return <ClerkAuthenticatedLayout {...props} />;
}

function MockAuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const activeHref = useMemo(
    () =>
      NAVIGATION_ITEMS.find((item) =>
        pathname.startsWith(item.href),
      )?.href ?? ROUTES.dashboard,
    [pathname],
  );

  return (
    <BaseLayout
      activeHref={activeHref}
      onNavigate={(href) => router.push(href)}
      userSection={<div className="h-10 w-10 rounded-full bg-slate-200" />}
    >
      {children}
    </BaseLayout>
  );
}

function ClerkAuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded } = useUser();

  const activeHref = useMemo(
    () =>
      NAVIGATION_ITEMS.find((item) =>
        pathname.startsWith(item.href),
      )?.href ?? ROUTES.dashboard,
    [pathname],
  );

  const userSection = isLoaded ? (
    <UserButton afterSignOutUrl={ROUTES.signIn} />
  ) : (
    <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
  );

  return (
    <BaseLayout
      activeHref={activeHref}
      onNavigate={(href) => router.push(href)}
      userSection={userSection}
    >
      {children}
    </BaseLayout>
  );
}

function BaseLayout({
  children,
  activeHref,
  onNavigate,
  userSection,
}: {
  children: React.ReactNode;
  activeHref: string;
  onNavigate: (href: string) => void;
  userSection: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-slate-100">
      <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white/80 p-6 backdrop-blur lg:flex">
        <Link
          href={ROUTES.dashboard}
          className="flex items-center justify-between gap-2"
        >
          <span className="text-lg font-semibold text-slate-900">
            Saju맛피아
          </span>
        </Link>
        <nav className="mt-8 flex flex-col gap-2">
          {NAVIGATION_ITEMS.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => onNavigate(item.href)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                activeHref === item.href
                  ? "bg-slate-900 text-white shadow-lg"
                  : "bg-transparent text-slate-600 hover:bg-slate-200 hover:text-slate-900",
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto">
          <SubscriptionStatusCard />
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <Link
              href={ROUTES.dashboard}
              className="text-lg font-semibold text-slate-900"
            >
              Saju맛피아
            </Link>
            <div className="flex items-center gap-4">
              <nav className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-sm md:flex">
                {NAVIGATION_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-full px-3 py-1 transition",
                      activeHref === item.href
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              {userSection}
            </div>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
