"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout";
import { ROUTES } from "@/constants/routes";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

const buildRedirectUrl = (pathname: string) => {
  const redirectUrl = new URL(ROUTES.signIn, window.location.origin);
  redirectUrl.searchParams.set("redirectedFrom", pathname);
  return redirectUrl.toString();
};

const shouldMockClerk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "test";

export default function ProtectedLayout(props: ProtectedLayoutProps) {
  if (shouldMockClerk) {
    return <MockProtectedLayout {...props} />;
  }

  return <ClerkProtectedLayout {...props} />;
}

function MockProtectedLayout({ children }: ProtectedLayoutProps) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}

function ClerkProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace(buildRedirectUrl(pathname));
    }
  }, [isLoaded, isSignedIn, pathname, router]);

  if (!isSignedIn) {
    return null;
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
