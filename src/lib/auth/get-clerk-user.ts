import { NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

const MOCK_MODE = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "test";

export const getAuthenticatedUserId = async (request: Request) => {
  // Mock 모드: 로컬 테스트용 고정 사용자 ID 반환
  if (MOCK_MODE) {
    return "test_clerk_user_id";
  }

  let nextRequest: NextRequest;
  
  if (request instanceof NextRequest) {
    nextRequest = request;
  } else {
    try {
      nextRequest = new NextRequest(request);
    } catch (error) {
      throw new Error(
        "Request 객체를 NextRequest로 변환할 수 없습니다. " +
        "Request body가 이미 사용되었을 가능성이 있습니다. " +
        "getAuthenticatedUserId는 req.json() 또는 req.text() 호출 전에 실행되어야 합니다."
      );
    }
  }

  const { userId } = await getAuth(nextRequest);

  if (!userId) {
    throw new Error("사용자 인증 정보가 없습니다.");
  }

  return userId;
};
