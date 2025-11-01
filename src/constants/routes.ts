"use client";

export const ROUTES = {
  landing: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  dashboard: "/dashboard",
  newAnalysis: "/new-analysis",
  analysisDetail: (id: string) => `/analysis/${id}`,
  subscription: "/subscription",
} as const;

export const ROUTE_ANCHORS = {
  home: "#home",
  features: "#features",
  pricing: "#pricing",
} as const;
