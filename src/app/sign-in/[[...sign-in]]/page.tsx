"use client";

import { SignIn } from "@clerk/nextjs";
import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { ROUTES } from "@/constants/routes";

type SignInPageProps = {
  params: Promise<Record<string, never>>;
};

export default function SignInPage({ params }: SignInPageProps) {
  void params;

  return (
    <AuthPageShell
      title="Google 계정으로 빠르게 로그인하세요"
      description="Clerk 인증을 통해 안전하게 로그인하고, 나만의 사주 분석 기록을 확인하세요."
      illustrationSeed="saju-sign-in"
    >
      <SignIn
        signUpUrl={ROUTES.signUp}
        afterSignInUrl={ROUTES.dashboard}
        routing="path"
        path={ROUTES.signIn}
        appearance={{
          elements: {
            formButtonPrimary:
              "bg-slate-900 text-white hover:bg-slate-800 transition",
            footerActionText: "text-sm text-slate-600",
          },
        }}
      />
    </AuthPageShell>
  );
}
