export const analysisErrorCodes = {
  subscriptionNotFound: "SUBSCRIPTION_NOT_FOUND",
  noRemainingCount: "NO_REMAINING_COUNT",
  analysisCreationFailed: "ANALYSIS_CREATION_FAILED",
  analysisFetchFailed: "ANALYSIS_FETCH_FAILED",
} as const;

export type AnalysisErrorCode = (typeof analysisErrorCodes)[keyof typeof analysisErrorCodes];
