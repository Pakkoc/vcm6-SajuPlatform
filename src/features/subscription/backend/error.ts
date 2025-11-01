export const subscriptionErrorCodes = {
  subscriptionNotFound: "SUBSCRIPTION_NOT_FOUND",
  subscriptionUpdateFailed: "SUBSCRIPTION_UPDATE_FAILED",
  paymentPreparationFailed: "PAYMENT_PREPARATION_FAILED",
  paymentConfirmationFailed: "PAYMENT_CONFIRMATION_FAILED",
} as const;

export type SubscriptionErrorCode = (typeof subscriptionErrorCodes)[keyof typeof subscriptionErrorCodes];
