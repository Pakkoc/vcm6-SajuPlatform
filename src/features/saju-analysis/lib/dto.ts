import { z } from "zod";

export const SajuGenderSchema = z.enum(["male", "female"]);
export type SajuGender = z.infer<typeof SajuGenderSchema>;

export const SajuModelSchema = z.enum(["gemini-2.5-flash", "gemini-2.5-pro"]);
export type SajuModel = z.infer<typeof SajuModelSchema>;

export const SajuAnalysisSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  birthDate: z.string(),
  createdAt: z.string(),
  summary: z.string(),
  gender: SajuGenderSchema,
  modelUsed: SajuModelSchema,
});

export type SajuAnalysisSummary = z.infer<typeof SajuAnalysisSummarySchema>;

export const SajuAnalysisDetailSchema = SajuAnalysisSummarySchema.extend({
  birthTime: z.string().nullable(),
  result: z.string().min(1),
});

export type SajuAnalysisDetail = z.infer<typeof SajuAnalysisDetailSchema>;
