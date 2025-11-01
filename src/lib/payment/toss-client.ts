import { Buffer } from "buffer";
import { serverEnv } from "@/constants/env";

const TOSS_BASE_URL = "https://api.tosspayments.com/v1";

const getAuthHeader = () => {
  const encoded = Buffer.from(`${serverEnv.TOSS_SECRET_KEY}:`).toString("base64");
  return `Basic ${encoded}`;
};

type TossBillingKeyResponse = {
  billingKey: string;
};

type TossPaymentResponse = {
  orderId: string;
  approvedAt: string;
};

export const issueBillingKey = async (authKey: string, customerKey: string) => {
  const response = await fetch(`${TOSS_BASE_URL}/billing/authorizations/issue`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ authKey, customerKey }),
  });

  if (!response.ok) {
    throw new Error(`토스 결제 인증에 실패했습니다. [${response.status}]`);
  }

  return (await response.json()) as TossBillingKeyResponse;
};

export const payWithBillingKey = async (
  billingKey: string,
  {
    amount,
    orderId,
    orderName,
    customerEmail,
  }: { amount: number; orderId: string; orderName: string; customerEmail: string },
) => {
  const response = await fetch(
    `${TOSS_BASE_URL}/billing/authorizations/${billingKey}/payments`,
    {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount, orderId, orderName, customerEmail }),
    },
  );

  if (!response.ok) {
    throw new Error(`토스 결제에 실패했습니다. [${response.status}]`);
  }

  return (await response.json()) as TossPaymentResponse;
};
