import { z } from "zod";

export const SajuGenderSchema = z.enum(["male", "female"]);
export type SajuGender = z.infer<typeof SajuGenderSchema>;

export const SajuModelSchema = z.enum(["gemini-2.5-flash", "gemini-2.5-pro"]);
export type SajuModel = z.infer<typeof SajuModelSchema>;

export const CreateAnalysisBodySchema = z.object({
  name: z.string().min(1),
  birthDate: z.string().min(1),
  birthTime: z.string().nullable().optional(),
  gender: SajuGenderSchema,
});

export type CreateAnalysisBody = z.infer<typeof CreateAnalysisBodySchema>;

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

export const CreateAnalysisResponseSchema = z.object({
  data: z.object({
    id: z.string().uuid(),
    summary: z.string().min(1),
  }),
});

export type CreateAnalysisResponse = z.infer<typeof CreateAnalysisResponseSchema>;

export const ListAnalysesResponseSchema = z.object({
  data: z.array(SajuAnalysisSummarySchema),
});

export type ListAnalysesResponse = z.infer<typeof ListAnalysesResponseSchema>;

export const AnalysisDetailResponseSchema = z.object({
  data: SajuAnalysisDetailSchema,
});

export type AnalysisDetailResponse = z.infer<typeof AnalysisDetailResponseSchema>;
