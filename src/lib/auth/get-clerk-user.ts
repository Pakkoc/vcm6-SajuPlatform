import { NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

const MOCK_MODE = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "test";

export const getAuthenticatedUserId = async (request: Request) => {
  // Mock 모드: 로컬 테스트용 고정 사용자 ID 반환
  if (MOCK_MODE) {
    return "test_clerk_user_id";
  }

  const nextRequest = request instanceof NextRequest ? request : new NextRequest(request);
  const { userId } = await getAuth(nextRequest);

  if (!userId) {
    throw new Error("사용자 인증 정보가 없습니다.");
  }

  return userId;
};
