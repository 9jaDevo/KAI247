import { AppError } from "../security/errors.ts";
import {
  callGemma,
  type ChatMessage,
  type GemmaConfig,
  type GemmaResult,
} from "./gemma.ts";
import { parseModelContent, type ModelOutput } from "./schema.ts";

/** One retry: measured JSON-schema runs occasionally degenerate into invalid JSON. */
export const MAX_MODEL_ATTEMPTS = 2;

export interface GemmaExtraction {
  output: ModelOutput;
  result: GemmaResult;
  attempts: number;
  /** Total measured model time across attempts. */
  elapsedMs: number;
}

/**
 * Calls Gemma and parses its answer, retrying once only when the answer is malformed.
 * Transport, credential, rate-limit and model-identity failures are never retried here.
 */
export async function extractWithGemma(
  config: GemmaConfig,
  messages: ChatMessage[],
  callModel: (
    config: GemmaConfig,
    messages: ChatMessage[],
  ) => Promise<GemmaResult> = callGemma,
): Promise<GemmaExtraction> {
  let elapsedMs = 0;
  for (let attempt = 1; ; attempt++) {
    const started = performance.now();
    try {
      const result = await callModel(config, messages);
      const output = parseModelContent(result.content);
      elapsedMs += performance.now() - started;
      return {
        output,
        result,
        attempts: attempt,
        elapsedMs: Math.round(elapsedMs),
      };
    } catch (error) {
      elapsedMs += performance.now() - started;
      if (
        !(error instanceof AppError) ||
        error.code !== "MODEL_OUTPUT_INVALID" ||
        attempt >= MAX_MODEL_ATTEMPTS
      )
        throw error;
    }
  }
}
