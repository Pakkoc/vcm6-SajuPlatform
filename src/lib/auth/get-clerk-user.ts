import { auth } from "@clerk/nextjs/server";

export const getAuthenticatedUserId = async () => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("사용자 인증 정보가 없습니다.");
  }

  return userId;
};
