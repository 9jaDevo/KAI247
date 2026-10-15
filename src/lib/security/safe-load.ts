import { AppError } from "./errors.ts";
export async function safeLoad<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new Error("Workspace data is temporarily unavailable.");
  }
}
