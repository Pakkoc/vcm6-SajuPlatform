"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { z } from "zod";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import { SajuGenderSchema } from "@/features/saju-analysis/lib/dto";

type AnalysisFormData = {
  name: string;
  birthDate: string;
  birthTime: string;
  gender: z.infer<typeof SajuGenderSchema> | null;
  isBirthTimeUnknown: boolean;
};

type AnalysisResult = {
  id: string;
  summary: string;
};

type ModalState = "idle" | "analyzing" | "success" | "error";

type NewAnalysisState = {
  formData: AnalysisFormData;
  validationErrors: Partial<Record<keyof AnalysisFormData, string>>;
  modalState: ModalState;
  analysisResult: AnalysisResult | null;
  errorMessage: string | null;
};

const defaultFormData: AnalysisFormData = {
  name: "",
  birthDate: "",
  birthTime: "00:00",
  gender: null,
  isBirthTimeUnknown: false,
};

const initialState: NewAnalysisState = {
  formData: defaultFormData,
  validationErrors: {},
  modalState: "idle",
  analysisResult: null,
  errorMessage: null,
};

type NewAnalysisAction =
  | { type: "UPDATE_FIELD"; field: keyof AnalysisFormData; value: string | boolean | null }
  | { type: "SET_ERRORS"; payload: Partial<Record<keyof AnalysisFormData, string>> }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS"; payload: AnalysisResult }
  | { type: "SUBMIT_ERROR"; payload: string }
  | { type: "RESET" }
  | { type: "CLOSE_MODAL" };

const reducer = (state: NewAnalysisState, action: NewAnalysisAction): NewAnalysisState => {
  switch (action.type) {
    case "UPDATE_FIELD":
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.value,
        },
        validationErrors: {
          ...state.validationErrors,
          [action.field]: undefined,
        },
      };
    case "SET_ERRORS":
      return {
        ...state,
        validationErrors: Object.fromEntries(
          Object.entries(action.payload).filter(([, value]) => value !== undefined),
        ) as Partial<Record<keyof AnalysisFormData, string>>,
      };
    case "SUBMIT_START":
      return {
        ...state,
        modalState: "analyzing",
        errorMessage: null,
      };
    case "SUBMIT_SUCCESS":
      return {
        ...state,
        modalState: "success",
        analysisResult: action.payload,
      };
    case "SUBMIT_ERROR":
      return {
        ...state,
        modalState: "error",
        errorMessage: action.payload,
      };
    case "CLOSE_MODAL":
      return {
        ...state,
        modalState: "idle",
        analysisResult: null,
        errorMessage: null,
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

const AnalysisResponseSchema = z.object({
  data: z.object({
    id: z.string().uuid(),
    summary: z.string().min(1),
  }),
});

const ValidationSchema = z
  .object({
    name: z.string().min(1, "이름을 입력하세요."),
    birthDate: z.string().min(1, "생년월일을 선택하세요."),
    birthTime: z.string(),
    gender: SajuGenderSchema.nullable().refine((value) => value !== null, {
      message: "성별을 선택하세요.",
    }),
    isBirthTimeUnknown: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.isBirthTimeUnknown && !data.birthTime) {
      ctx.addIssue({
        path: ["birthTime"],
        code: z.ZodIssueCode.custom,
        message: "출생 시간을 입력하거나 모름을 선택하세요.",
      });
    }
  });

type NewAnalysisContextValue = NewAnalysisState & {
  setField: <K extends keyof AnalysisFormData>(field: K, value: AnalysisFormData[K]) => void;
  submit: () => Promise<void>;
  closeModal: () => void;
  resetForm: () => void;
};

const NewAnalysisContext = createContext<NewAnalysisContextValue | null>(null);

export function NewAnalysisProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setField = useCallback(
    <K extends keyof AnalysisFormData>(field: K, value: AnalysisFormData[K]) => {
      dispatch({ type: "UPDATE_FIELD", field, value });
    },
    [],
  );

  const submit = useCallback(async () => {
    const payload = {
      ...state.formData,
      birthTime: state.formData.isBirthTimeUnknown ? null : state.formData.birthTime,
    };

    const validation = ValidationSchema.safeParse(state.formData);

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;

      dispatch({
        type: "SET_ERRORS",
        payload: {
          name: errors.name?.[0],
          birthDate: errors.birthDate?.[0],
          birthTime: errors.birthTime?.[0],
          gender: errors.gender?.[0],
        },
      });

      return;
    }

    dispatch({ type: "SUBMIT_START" });

    try {
      const response = await apiClient.post("/saju-analyses", payload);
      const parsed = AnalysisResponseSchema.safeParse(response.data);

    if (!parsed.success) {
      throw new Error("분석 결과 응답 형식이 올바르지 않습니다.");
    }

    const resultData = parsed.data.data as AnalysisResult;

    dispatch({
      type: "SUBMIT_SUCCESS",
      payload: resultData,
    });
    } catch (error) {
      const message = extractApiErrorMessage(
        error,
        "사주 분석 요청 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      );
      dispatch({ type: "SUBMIT_ERROR", payload: message });
    }
  }, [state.formData]);

  const closeModal = useCallback(() => {
    dispatch({ type: "CLOSE_MODAL" });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const value = useMemo<NewAnalysisContextValue>(
    () => ({
      ...state,
      setField,
      submit,
      closeModal,
      resetForm,
    }),
    [closeModal, resetForm, setField, state, submit],
  );

  return (
    <NewAnalysisContext.Provider value={value}>
      {children}
    </NewAnalysisContext.Provider>
  );
}

export const useNewAnalysis = () => {
  const context = useContext(NewAnalysisContext);

  if (!context) {
    throw new Error("NewAnalysisProvider가 필요합니다.");
  }

  return context;
};

export type { AnalysisFormData, AnalysisResult, ModalState };
