"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import {
  SajuAnalysisDetailSchema,
  type SajuAnalysisDetail,
} from "@/features/saju-analysis/lib/dto";

type AnalysisDetailState = {
  analysis: SajuAnalysisDetail | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: AnalysisDetailState = {
  analysis: null,
  isLoading: true,
  error: null,
};

type AnalysisDetailAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: SajuAnalysisDetail }
  | { type: "FETCH_ERROR"; payload: string };

const reducer = (state: AnalysisDetailState, action: AnalysisDetailAction): AnalysisDetailState => {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null };
    case "FETCH_SUCCESS":
      return { analysis: action.payload, isLoading: false, error: null };
    case "FETCH_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
};

type AnalysisDetailContextValue = AnalysisDetailState & {
  refetch: () => Promise<unknown>;
};

const AnalysisDetailContext = createContext<AnalysisDetailContextValue | null>(null);

const fetchAnalysisDetail = async (analysisId: string): Promise<SajuAnalysisDetail> => {
  const response = await apiClient.get(`/saju-analyses/${analysisId}`);
  const parsed = SajuAnalysisDetailSchema.safeParse(response.data?.data ?? response.data);

  if (!parsed.success) {
    throw new Error("분석 결과 응답 형식이 올바르지 않습니다.");
  }

  return parsed.data;
};

export function AnalysisDetailProvider({
  analysisId,
  children,
}: {
  analysisId: string;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const query = useQuery<SajuAnalysisDetail, Error>({
    queryKey: ["saju-analysis", analysisId],
    queryFn: () => fetchAnalysisDetail(analysisId),
    enabled: Boolean(analysisId),
  });

  useEffect(() => {
    dispatch({ type: "FETCH_START" });
  }, [analysisId]);

  useEffect(() => {
    if (query.isSuccess) {
      dispatch({ type: "FETCH_SUCCESS", payload: query.data });
    }
  }, [query.data, query.isSuccess]);

  useEffect(() => {
    if (query.isError) {
      const message = extractApiErrorMessage(query.error, "분석 정보를 불러오지 못했습니다.");
      dispatch({ type: "FETCH_ERROR", payload: message });
    }
  }, [query.error, query.isError]);

  const value = useMemo<AnalysisDetailContextValue>(
    () => ({
      analysis: state.analysis,
      isLoading: state.isLoading || query.isFetching,
      error: state.error,
      refetch: query.refetch,
    }),
    [query.isFetching, query.refetch, state.analysis, state.error, state.isLoading],
  );

  return (
    <AnalysisDetailContext.Provider value={value}>
      {children}
    </AnalysisDetailContext.Provider>
  );
}

export const useAnalysisDetail = () => {
  const context = useContext(AnalysisDetailContext);

  if (!context) {
    throw new Error("AnalysisDetailProvider가 필요합니다.");
  }

  return context;
};
