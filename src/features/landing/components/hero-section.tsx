"use client";

import { useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { HERO_CONTENT } from "../constants";

export function HeroSection() {
  const router = useRouter();

  const handlePrimaryClick = useCallback(() => {
    router.push(ROUTES.signUp);
  }, [router]);

  const handleSecondaryClick = useCallback(() => {
    const targetId = HERO_CONTENT.secondaryCta.anchor.replace("#", "");
    const element = document.getElementById(targetId);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <section
      id={HERO_CONTENT.title.toLowerCase()}
      className="relative isolate flex flex-col gap-12 overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-10 shadow-xl backdrop-blur md:flex-row"
    >
      <div className="flex flex-1 flex-col justify-center gap-6">
        <div className="space-y-3">
          <span className="inline-flex w-fit items-center rounded-full bg-slate-900/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {HERO_CONTENT.title}
          </span>
          <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">
            {HERO_CONTENT.tagline}
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-600 md:text-lg">
            {HERO_CONTENT.description}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            size="lg"
            className="w-full bg-slate-900 text-white hover:bg-slate-800 sm:w-auto"
            onClick={handlePrimaryClick}
          >
            {HERO_CONTENT.primaryCta.label}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full border-slate-300 text-slate-900 hover:bg-slate-100 sm:w-auto"
            onClick={handleSecondaryClick}
          >
            {HERO_CONTENT.secondaryCta.label}
          </Button>
        </div>
      </div>
      <figure className="relative flex flex-1 items-center justify-center">
        <Image
          src={HERO_CONTENT.heroImage.src}
          alt={HERO_CONTENT.heroImage.alt}
          width={HERO_CONTENT.heroImage.width}
          height={HERO_CONTENT.heroImage.height}
          className="h-auto w-full max-w-lg rounded-2xl border border-slate-200 object-cover shadow-xl"
          priority
        />
      </figure>
    </section>
  );
}
