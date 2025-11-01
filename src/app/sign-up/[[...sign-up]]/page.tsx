"use client";

import { SignUp } from "@clerk/nextjs";
import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { ROUTES } from "@/constants/routes";

type SignUpPageProps = {
  params: Promise<Record<string, never>>;
};

export default function SignUpPage({ params }: SignUpPageProps) {
  void params;

  return (
    <AuthPageShell
      title="AI 사주 분석을 무료로 시작해 보세요"
      description="첫 가입 시 1회의 무료 분석 기회가 제공됩니다. 1분 안에 회원가입을 완료하고 맞춤형 결과를 받아보세요."
      illustrationSeed="saju-sign-up"
    >
      <SignUp
        signInUrl={ROUTES.signIn}
        afterSignUpUrl={ROUTES.dashboard}
        routing="path"
        path={ROUTES.signUp}
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
