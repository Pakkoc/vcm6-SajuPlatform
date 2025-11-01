"use client";

import Image from "next/image";
import { type ReactNode } from "react";

type AuthPageShellProps = {
  title: string;
  description: string;
  illustrationSeed: string;
  children: ReactNode;
};

export function AuthPageShell({
  title,
  description,
  illustrationSeed,
  children,
}: AuthPageShellProps) {
  const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(
    illustrationSeed,
  )}/640/640`;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-12 px-6 py-20 lg:flex-row lg:items-center">
      <section className="flex flex-1 flex-col gap-6 text-center lg:text-left">
        <header className="space-y-4">
          <span className="inline-flex w-fit items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Saju맛피아
          </span>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            {title}
          </h1>
          <p className="text-sm leading-6 text-slate-600 md:text-base">
            {description}
          </p>
        </header>
        <figure className="relative hidden overflow-hidden rounded-3xl border border-slate-200 shadow-2xl lg:block">
          <Image
            src={imageUrl}
            alt="Saju맛피아 소개 이미지"
            width={640}
            height={640}
            className="h-full w-full object-cover"
            priority
          />
        </figure>
      </section>
      <aside className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur">
          {children}
        </div>
      </aside>
    </div>
  );
}
