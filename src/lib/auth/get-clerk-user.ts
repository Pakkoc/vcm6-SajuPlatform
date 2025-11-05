import { NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

export const getAuthenticatedUserId = async (request: Request) => {
  const nextRequest = request instanceof NextRequest ? request : new NextRequest(request);
  const { userId } = await getAuth(nextRequest);

  if (!userId) {
    throw new Error("사용자 인증 정보가 없습니다.");
  }

  return userId;
};
