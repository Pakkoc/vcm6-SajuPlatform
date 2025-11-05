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
      // Request body를 읽지 않고 NextRequest를 생성하기 위해
      // URL과 헤더만 복사하여 새로운 Request 생성
      const clonedRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
      });
      nextRequest = new NextRequest(clonedRequest);
    } catch (error) {
      throw new Error(
        "Request 객체를 NextRequest로 변환할 수 없습니다. " +
        "인증 처리 중 오류가 발생했습니다."
      );
    }
  }

  const { userId } = await getAuth(nextRequest);

  if (!userId) {
    throw new Error("사용자 인증 정보가 없습니다.");
  }

  return userId;
};
