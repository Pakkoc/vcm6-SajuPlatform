import { z } from "zod";
import { SajuGenderSchema, SajuAnalysisSummarySchema, SajuAnalysisDetailSchema } from "@/features/saju-analysis/lib/dto";

export const CreateAnalysisBodySchema = z.object({
  name: z.string().min(1),
  birthDate: z.string().min(1),
  birthTime: z.string().nullable().optional(),
  gender: SajuGenderSchema,
});

export type CreateAnalysisBody = z.infer<typeof CreateAnalysisBodySchema>;

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
