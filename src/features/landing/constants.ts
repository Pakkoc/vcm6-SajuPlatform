"use client";

import { ROUTES, ROUTE_ANCHORS } from "@/constants/routes";
import { PLAN_LIMITS, SUBSCRIPTION_PLANS } from "@/constants/subscription";

export const LANDING_SECTIONS = {
  hero: ROUTE_ANCHORS.home.replace("#", ""),
  features: ROUTE_ANCHORS.features.replace("#", ""),
  pricing: ROUTE_ANCHORS.pricing.replace("#", ""),
} as const;

export const HERO_CONTENT = {
  title: "Saju맛피아",
  tagline: "AI가 분석하는 당신의 사주팔자",
  description:
    "Google Gemini 기반 사주 분석으로 오늘의 운세부터 장기적인 흐름까지 명쾌하게 확인해 보세요.",
  primaryCta: {
    label: "무료로 시작하기",
    href: ROUTES.signUp,
  },
  secondaryCta: {
    label: "자세히 알아보기",
    anchor: ROUTE_ANCHORS.features,
  },
  heroImage: {
    src: "https://picsum.photos/seed/saju-landing/800/600",
    alt: "Saju맛피아 서비스 미리보기",
    width: 800,
    height: 600,
  },
} as const;

export const FEATURE_ITEMS = [
  {
    emoji: "🤖",
    title: "AI 기반 정확한 분석",
    description:
      "Google Gemini 모델이 명리학 원리를 바탕으로 세밀한 운세와 성향을 해석합니다.",
  },
  {
    emoji: "💰",
    title: "합리적인 가격",
    description:
      "무료 1회 체험 후 월 3,900원으로 10회의 심층 분석을 이용할 수 있습니다.",
  },
  {
    emoji: "📁",
    title: "검사 내역 영구 보관",
    description:
      "실행한 모든 분석 결과를 대시보드에서 언제든지 다시 확인하고 비교할 수 있습니다.",
  },
] as const;

const FREE_PLAN = SUBSCRIPTION_PLANS.free;
const PRO_PLAN = SUBSCRIPTION_PLANS.pro;

export const PRICING_PLANS = [
  {
    plan: FREE_PLAN,
    title: "Free 요금제",
    priceLabel: "₩0",
    limitLabel: `최초 ${PLAN_LIMITS[FREE_PLAN].monthlyLimit}회 무료 분석`,
    modelLabel: `분석 모델: ${PLAN_LIMITS[FREE_PLAN].model}`,
    features: [
      "간단한 기본 분석 결과 제공",
      "검사 내역 영구 보관",
      "AI 추천 가이드",
    ],
    ctaLabel: "시작하기",
    href: ROUTES.signUp,
  },
  {
    plan: PRO_PLAN,
    title: "Pro 요금제",
    priceLabel: `₩${PLAN_LIMITS[PRO_PLAN].price.toLocaleString()}/월`,
    limitLabel: `월 ${PLAN_LIMITS[PRO_PLAN].monthlyLimit}회 분석`,
    modelLabel: `분석 모델: ${PLAN_LIMITS[PRO_PLAN].model}`,
    features: [
      "세부 운세 및 관계 분석",
      "AI 기반 맞춤형 조언",
      "검사 내역 무제한 열람",
    ],
    ctaLabel: "Pro 시작하기",
    href: ROUTES.signUp,
  },
] as const;
