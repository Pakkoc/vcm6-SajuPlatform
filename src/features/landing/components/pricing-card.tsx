"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PricingCardProps = {
  title: string;
  priceLabel: string;
  limitLabel: string;
  modelLabel: string;
  features: readonly string[];
  ctaLabel: string;
  onCtaClick: () => void;
  highlighted?: boolean;
  className?: string;
};

export function PricingCard({
  title,
  priceLabel,
  limitLabel,
  modelLabel,
  features,
  ctaLabel,
  onCtaClick,
  highlighted = false,
  className,
}: PricingCardProps) {
  const featureList = useMemo(() => [...features], [features]);

  return (
    <Card
      data-testid="pricing-card"
      className={cn(
        "flex h-full flex-col justify-between border-slate-200 bg-white/90 backdrop-blur transition hover:-translate-y-1 hover:shadow-lg",
        highlighted && "border-slate-900 shadow-lg",
        className
      )}
    >
      <CardHeader>
        <CardTitle className="flex flex-col gap-1 text-slate-900">
          <span className="text-base font-semibold">{title}</span>
          <span className="text-3xl font-bold tracking-tight">{priceLabel}</span>
        </CardTitle>
        <p className="text-sm text-slate-600">{limitLabel}</p>
        <p className="text-xs text-slate-500">{modelLabel}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="space-y-2 text-sm text-slate-600">
          {featureList.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <span aria-hidden className="pt-1 text-slate-900">
                ·
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          size="lg"
          onClick={onCtaClick}
          className={cn(
            "w-full",
            highlighted
              ? "bg-slate-900 text-white hover:bg-slate-800"
              : "bg-white text-slate-900 hover:bg-slate-100"
          )}
        >
          {ctaLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
