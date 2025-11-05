import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerEnv } from "@/constants/env";

let client: GoogleGenerativeAI | null = null;

export const getGeminiClient = () => {
  if (!client) {
    const { GEMINI_API_KEY } = getServerEnv();
    client = new GoogleGenerativeAI(GEMINI_API_KEY);
  }

  return client;
};
