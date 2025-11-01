"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { useSubscriptionInfo } from "@/features/subscription/hooks/use-subscription-info";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { SubscriptionInfo } from "@/features/subscription/lib/dto";

type ActionState =
  | "idle"
  | "upgrading"
  | "canceling"
  | "reactivating"
  | "terminating";

type ModalState =
  | { type: "none" }
  | { type: "confirm_cancel" }
  | { type: "confirm_terminate" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

type SubscriptionManagementState = {
  actionState: ActionState;
  modalState: ModalState;
};

const initialState: SubscriptionManagementState = {
  actionState: "idle",
  modalState: { type: "none" },
};

type SubscriptionManagementAction =
  | { type: "SET_ACTION_STATE"; payload: ActionState }
  | { type: "OPEN_MODAL"; payload: ModalState }
  | { type: "CLOSE_MODAL" };

const reducer = (
  state: SubscriptionManagementState,
  action: SubscriptionManagementAction,
): SubscriptionManagementState => {
  switch (action.type) {
    case "SET_ACTION_STATE":
      return { ...state, actionState: action.payload };
    case "OPEN_MODAL":
      return { ...state, modalState: action.payload };
    case "CLOSE_MODAL":
      return { ...state, modalState: { type: "none" } };
    default:
      return state;
  }
};

type SubscriptionManagementContextValue = {
  subscription: SubscriptionInfo | undefined;
  isLoading: boolean;
  error: Error | null;
  actionState: ActionState;
  modalState: ModalState;
  openCancelModal: () => void;
  openTerminateModal: () => void;
  closeModal: () => void;
  handleCancel: () => Promise<void>;
  handleReactivate: () => Promise<void>;
  handleTerminate: () => Promise<void>;
  refetch: () => Promise<unknown>;
  startUpgrade: () => void;
  finishUpgrade: () => void;
};

const SubscriptionManagementContext = createContext<SubscriptionManagementContextValue | null>(
  null,
);

const post = async (path: string) => {
  const response = await apiClient.post(path);
  return response.data;
};

export function SubscriptionManagementProvider({ children }: { children: ReactNode }) {
  const query = useSubscriptionInfo();
  const [state, dispatch] = useReducer(reducer, initialState);

  const resetAction = useCallback(() => {
    dispatch({ type: "SET_ACTION_STATE", payload: "idle" });
  }, []);

  const handleCancel = useCallback(async () => {
    dispatch({ type: "SET_ACTION_STATE", payload: "canceling" });
    try {
      await post("/subscription/cancel");
      await query.refetch();
      dispatch({
        type: "OPEN_MODAL",
        payload: { type: "success", message: "구독이 결제 주기 종료 시점에 취소됩니다." },
      });
    } catch (error) {
      dispatch({
        type: "OPEN_MODAL",
        payload: {
          type: "error",
          message: extractApiErrorMessage(error, "구독 취소 중 문제가 발생했습니다."),
        },
      });
    } finally {
      resetAction();
    }
  }, [query, resetAction]);

  const handleReactivate = useCallback(async () => {
    dispatch({ type: "SET_ACTION_STATE", payload: "reactivating" });
    try {
      await post("/subscription/reactivate");
      await query.refetch();
      dispatch({
        type: "OPEN_MODAL",
        payload: { type: "success", message: "구독 취소 요청이 철회되었습니다." },
      });
    } catch (error) {
      dispatch({
        type: "OPEN_MODAL",
        payload: {
          type: "error",
          message: extractApiErrorMessage(error, "구독 철회 중 문제가 발생했습니다."),
        },
      });
    } finally {
      resetAction();
    }
  }, [query, resetAction]);

  const handleTerminate = useCallback(async () => {
    dispatch({ type: "SET_ACTION_STATE", payload: "terminating" });
    try {
      await post("/subscription/terminate");
      await query.refetch();
      dispatch({
        type: "OPEN_MODAL",
        payload: { type: "success", message: "구독이 즉시 해지되었습니다." },
      });
    } catch (error) {
      dispatch({
        type: "OPEN_MODAL",
        payload: {
          type: "error",
          message: extractApiErrorMessage(error, "구독 해지 중 문제가 발생했습니다."),
        },
      });
    } finally {
      resetAction();
    }
  }, [query, resetAction]);

  const contextValue = useMemo<SubscriptionManagementContextValue>(() => ({
    subscription: query.data,
    isLoading: query.isLoading,
    error: query.error ?? null,
    actionState: state.actionState,
    modalState: state.modalState,
    openCancelModal: () => dispatch({ type: "OPEN_MODAL", payload: { type: "confirm_cancel" } }),
    openTerminateModal: () =>
      dispatch({ type: "OPEN_MODAL", payload: { type: "confirm_terminate" } }),
    closeModal: () => dispatch({ type: "CLOSE_MODAL" }),
    handleCancel,
    handleReactivate,
    handleTerminate,
    refetch: query.refetch,
    startUpgrade: () => dispatch({ type: "SET_ACTION_STATE", payload: "upgrading" }),
    finishUpgrade: () => dispatch({ type: "SET_ACTION_STATE", payload: "idle" }),
  }), [
    handleCancel,
    handleReactivate,
    handleTerminate,
    query.data,
    query.error,
    query.isLoading,
    query.refetch,
    state.actionState,
    state.modalState,
  ]);

  return (
    <SubscriptionManagementContext.Provider value={contextValue}>
      {children}
    </SubscriptionManagementContext.Provider>
  );
}

export const useSubscriptionManagement = () => {
  const context = useContext(SubscriptionManagementContext);

  if (!context) {
    throw new Error("SubscriptionManagementProvider가 필요합니다.");
  }

  return context;
};
