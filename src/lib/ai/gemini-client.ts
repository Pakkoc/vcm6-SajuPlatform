import { GoogleGenerativeAI } from "@google/generative-ai";
import { serverEnv } from "@/constants/env";

let client: GoogleGenerativeAI | null = null;

export const getGeminiClient = () => {
  if (!client) {
    client = new GoogleGenerativeAI(serverEnv.GEMINI_API_KEY);
  }

  return client;
};
