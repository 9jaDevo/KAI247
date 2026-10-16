import { AppError } from "../security/errors.ts";
import { validateEnv } from "../security/env.ts";
import { responseJsonSchema } from "./schema.ts";

export interface GemmaConfig {
  baseUrl: string;
  modelId: string;
  apiKey: string;
  timeoutMs: number;
}
export interface GemmaResult {
  content: string;
  /** Model identity reported by the provider response (not just what we requested). */
  modelId: string;
  provider: string;
  elapsedMs: number;
  usage?: { promptTokens?: number; completionTokens?: number };
}
export type ChatMessage = { role: "system" | "user"; content: string };

const MAX_RESPONSE_BYTES = 256 * 1024;
const stripPrefix = (id: string) => id.trim().replace(/^models\//, "");

/** Only Gemma-family identifiers may be configured for this extraction path. */
export function isGemmaModelId(id: string) {
  return /^gemma-[a-z0-9][a-z0-9.-]*$/i.test(stripPrefix(id));
}

/** Resolves configuration or fails visibly; there is no fallback model or regex substitute. */
export function gemmaConfig(
  input: Record<string, string | undefined> = process.env,
): GemmaConfig {
  let env: ReturnType<typeof validateEnv>;
  try {
    env = validateEnv(input, ["ai"]);
  } catch {
    throw new AppError(
      503,
      "AI_NOT_CONFIGURED",
      "Gemma extraction is not configured on this server (GEMMA_API_BASE_URL, GEMMA_MODEL_ID, GEMMA_API_KEY). Nothing was uploaded.",
    );
  }
  if (!isGemmaModelId(env.GEMMA_MODEL_ID!))
    throw new AppError(
      503,
      "AI_MODEL_NOT_GEMMA",
      "GEMMA_MODEL_ID must name an open-weight Gemma model. Closed-model substitutes are not allowed for extraction.",
    );
  return {
    baseUrl: env.GEMMA_API_BASE_URL!.replace(/\/+$/, ""),
    modelId: stripPrefix(env.GEMMA_MODEL_ID!),
    apiKey: env.GEMMA_API_KEY!,
    timeoutMs: 60_000,
  };
}

/** Safe, secret-free status for the UI: never includes the key or full URL path. */
export function gemmaStatus(
  input: Record<string, string | undefined> = process.env,
):
  | { configured: true; modelId: string; provider: string }
  | { configured: false; code: string; message: string } {
  try {
    const config = gemmaConfig(input);
    return {
      configured: true,
      modelId: config.modelId,
      provider: new URL(config.baseUrl).host,
    };
  } catch (error) {
    return error instanceof AppError
      ? { configured: false, code: error.code, message: error.message }
      : {
          configured: false,
          code: "AI_NOT_CONFIGURED",
          message: "Gemma extraction is not configured.",
        };
  }
}

async function readBoundedText(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new AppError(
        502,
        "MODEL_OUTPUT_INVALID",
        "Gemma returned an oversized response. Nothing was saved.",
      );
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

const unavailable = (message: string, code = "AI_UNAVAILABLE", status = 502) =>
  new AppError(status, code, message);

/**
 * OpenAI-compatible `/chat/completions` call to an endpoint serving Gemma (for example
 * Google AI Studio, vLLM, Ollama or llama.cpp). Never logs prompts, documents or keys.
 */
export async function callGemma(
  config: GemmaConfig,
  messages: ChatMessage[],
  fetchImpl: typeof fetch = fetch,
): Promise<GemmaResult> {
  const started = performance.now();
  let response: Response;
  try {
    response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.modelId,
        messages,
        temperature: 0,
        max_tokens: 1024,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "renewal_extraction",
            schema: responseJsonSchema,
          },
        },
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
      redirect: "error",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError")
      throw unavailable(
        "Gemma did not respond in time. Nothing was saved; retry shortly.",
        "AI_TIMEOUT",
        504,
      );
    throw unavailable(
      "The Gemma endpoint could not be reached. Nothing was saved; retry shortly.",
    );
  }
  const text = await readBoundedText(response).catch((error) => {
    if (error instanceof AppError) throw error;
    throw unavailable("The Gemma response was interrupted. Nothing was saved.");
  });
  const elapsedMs = Math.round(performance.now() - started);
  if (response.status === 401 || response.status === 403)
    throw unavailable(
      "The Gemma provider rejected the configured credentials.",
      "AI_NOT_CONFIGURED",
      503,
    );
  if (response.status === 429)
    throw unavailable(
      "The Gemma provider is rate limiting requests. Retry in a minute.",
      "AI_RATE_LIMITED",
      503,
    );
  if (!response.ok)
    throw unavailable(
      `The Gemma provider returned HTTP ${response.status}. Nothing was saved; retry shortly.`,
    );
  let body: {
    model?: unknown;
    choices?: { finish_reason?: string; message?: { content?: unknown } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  try {
    body = JSON.parse(text);
  } catch {
    throw unavailable("The Gemma provider returned unreadable data.");
  }
  const reported =
    typeof body.model === "string" ? stripPrefix(body.model) : "";
  // A provider silently routing to another model must never pass as Gemma.
  if (
    !reported ||
    !isGemmaModelId(reported) ||
    reported.toLowerCase() !== config.modelId.toLowerCase()
  )
    throw unavailable(
      "The provider did not confirm the configured Gemma model. Nothing was saved.",
      "AI_MODEL_MISMATCH",
    );
  const choice = body.choices?.[0];
  if (choice?.finish_reason === "length")
    throw unavailable(
      "Gemma's answer was cut off before it finished. Nothing was saved; retry.",
      "MODEL_OUTPUT_INVALID",
    );
  if (typeof choice?.message?.content !== "string")
    throw unavailable(
      "Gemma returned no answer. Nothing was saved; retry.",
      "MODEL_OUTPUT_INVALID",
    );
  const tokenCount = (value: unknown) =>
    typeof value === "number" && Number.isSafeInteger(value) && value >= 0
      ? value
      : undefined;
  const promptTokens = tokenCount(body.usage?.prompt_tokens);
  const completionTokens = tokenCount(body.usage?.completion_tokens);
  return {
    content: choice.message.content,
    modelId: reported,
    provider: new URL(config.baseUrl).host,
    elapsedMs,
    usage:
      promptTokens !== undefined || completionTokens !== undefined
        ? {
            promptTokens,
            completionTokens,
          }
        : undefined,
  };
}
