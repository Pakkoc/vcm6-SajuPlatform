"use client";

import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export const formatDate = (value: string | Date, template = "yyyy년 MM월 dd일") =>
  format(new Date(value), template, { locale: ko });

export const formatRelativeToNow = (value: string | Date) =>
  formatDistanceToNow(new Date(value), { locale: ko, addSuffix: true });
