export const subscriptionErrorCodes = {
  subscriptionNotFound: "SUBSCRIPTION_NOT_FOUND",
  subscriptionFetchFailed: "SUBSCRIPTION_FETCH_FAILED",
  subscriptionCreationFailed: "SUBSCRIPTION_CREATION_FAILED",
  subscriptionUpdateFailed: "SUBSCRIPTION_UPDATE_FAILED",
  paymentPreparationFailed: "PAYMENT_PREPARATION_FAILED",
  paymentConfirmationFailed: "PAYMENT_CONFIRMATION_FAILED",
  invalidState: "SUBSCRIPTION_INVALID_STATE",
  billingKeyRemovalFailed: "BILLING_KEY_REMOVAL_FAILED",
} as const;

export type SubscriptionErrorCode = (typeof subscriptionErrorCodes)[keyof typeof subscriptionErrorCodes];
