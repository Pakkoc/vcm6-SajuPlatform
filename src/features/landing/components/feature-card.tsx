"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FeatureCardProps = {
  emoji: string;
  title: string;
  description: string;
  className?: string;
};

export function FeatureCard({
  emoji,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <Card
      data-testid="feature-card"
      className={cn(
        "h-full border-slate-200 bg-white/90 backdrop-blur transition hover:-translate-y-1 hover:shadow-lg",
        className
      )}
    >
      <CardHeader>
        <span className="text-3xl" aria-hidden>
          {emoji}
        </span>
        <CardTitle className="text-lg font-semibold text-slate-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </CardContent>
    </Card>
  );
}
