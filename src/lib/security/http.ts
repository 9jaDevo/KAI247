import { readRequestBytes } from "./body.ts";
import { z } from "zod";
import { AppError } from "./errors.ts";
import { validateEnv } from "./env.ts";
import { captureSafeError } from "../observability/telemetry.ts";

export function assertMutationOrigin(request: Request) {
  const env = validateEnv(process.env, ["auth"]);
  const origin = request.headers.get("origin");
  if (
    !origin ||
    origin !== new URL(env.APP_URL).origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new AppError(
      403,
      "ORIGIN_REJECTED",
      "This request must come from the configured app origin.",
    );
}
export async function readJson(request: Request) {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    throw new AppError(
      415,
      "JSON_REQUIRED",
      "Send an application/json request.",
    );
  const body = await readRequestBytes(
    request,
    32768,
    new AppError(413, "BODY_TOO_LARGE", "Request exceeds 32 KB."),
    new AppError(400, "INVALID_JSON", "A JSON body is required."),
  );
  try {
    return JSON.parse(body.toString("utf8")) as unknown;
  } catch {
    throw new AppError(400, "INVALID_JSON", "Send valid JSON.");
  }
}
export async function apiResponse(
  operation: () => Promise<unknown>,
  status = 200,
) {
  try {
    return Response.json(
      { success: true, data: await operation() },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof z.ZodError)
      return Response.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Check the entered values.",
            details: error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
          },
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    if (error instanceof AppError)
      return Response.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status, headers: { "Cache-Control": "no-store" } },
      );
    // Do not return/log raw database/configuration errors, connection strings or inputs.
    captureSafeError(error);
    return Response.json(
      {
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message:
            "The workspace service is unavailable. Check configuration and retry.",
        },
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
