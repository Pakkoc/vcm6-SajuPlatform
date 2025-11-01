"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import { SajuAnalysisSummarySchema, type SajuAnalysisSummary } from "@/features/saju-analysis/lib/dto";

type DashboardState = {
  analyses: SajuAnalysisSummary[];
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
};

const initialState: DashboardState = {
  analyses: [],
  searchQuery: "",
  isLoading: true,
  error: null,
};

type DashboardAction =
  | { type: "FETCH_ANALYSES_START" }
  | { type: "FETCH_ANALYSES_SUCCESS"; payload: SajuAnalysisSummary[] }
  | { type: "FETCH_ANALYSES_ERROR"; payload: string }
  | { type: "SET_SEARCH_QUERY"; payload: string };

const reducer = (state: DashboardState, action: DashboardAction): DashboardState => {
  switch (action.type) {
    case "FETCH_ANALYSES_START":
      return { ...state, isLoading: true, error: null };
    case "FETCH_ANALYSES_SUCCESS":
      return { ...state, analyses: action.payload, isLoading: false, error: null };
    case "FETCH_ANALYSES_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    default:
      return state;
  }
};

const DashboardContext = createContext<
  (DashboardState & {
    filteredAnalyses: SajuAnalysisSummary[];
    setSearchQuery: (value: string) => void;
    refetch: () => Promise<unknown>;
    hasNoSearchResults: boolean;
    isEmpty: boolean;
  }) | null
>(null);

const DashboardQuerySchema = z.object({
  data: z.array(SajuAnalysisSummarySchema),
});

const fetchDashboardAnalyses = async (): Promise<SajuAnalysisSummary[]> => {
  const response = await apiClient.get("/saju-analyses");
  const parsed = DashboardQuerySchema.safeParse(response.data);

  if (!parsed.success) {
    throw new Error("분석 목록 응답 형식이 올바르지 않습니다.");
  }

  return parsed.data.data;
};

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const query = useQuery<SajuAnalysisSummary[], Error>({
    queryKey: ["saju-analyses"],
    queryFn: fetchDashboardAnalyses,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    dispatch({ type: "FETCH_ANALYSES_START" });
  }, []);

  useEffect(() => {
    if (query.isSuccess) {
      dispatch({ type: "FETCH_ANALYSES_SUCCESS", payload: query.data });
    }
  }, [query.data, query.isSuccess]);

  useEffect(() => {
    if (query.isError && query.error) {
      const message = extractApiErrorMessage(query.error, "분석 목록을 불러오지 못했습니다.");
      dispatch({ type: "FETCH_ANALYSES_ERROR", payload: message });
    }
  }, [query.error, query.isError]);

  const setSearchQuery = useCallback((value: string) => {
    dispatch({ type: "SET_SEARCH_QUERY", payload: value });
  }, []);

  const filteredAnalyses = useMemo(() => {
    if (!state.searchQuery) {
      return state.analyses;
    }

    const normalized = state.searchQuery.trim().toLowerCase();

    return state.analyses.filter((analysis) =>
      analysis.name.toLowerCase().includes(normalized),
    );
  }, [state.analyses, state.searchQuery]);

  const value = useMemo(
    () => ({
      analyses: state.analyses,
      searchQuery: state.searchQuery,
      isLoading: state.isLoading || query.isFetching,
      error: state.error,
      filteredAnalyses,
      setSearchQuery,
      refetch: query.refetch,
      hasNoSearchResults:
        !state.isLoading && state.searchQuery.length > 0 && filteredAnalyses.length === 0,
      isEmpty: !state.isLoading && state.analyses.length === 0,
    }),
    [
      filteredAnalyses,
      query.isFetching,
      query.refetch,
      setSearchQuery,
      state.analyses,
      state.error,
      state.isLoading,
      state.searchQuery,
    ],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error("DashboardProvider가 필요합니다.");
  }

  return context;
};
