import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authenticate } from "./session.ts";
import { AppError } from "../security/errors.ts";

export const pageOwner = cache(async () => {
  try {
    return await authenticate(
      new Request("http://internal.invalid", { headers: await headers() }),
    );
  } catch (error) {
    if (error instanceof AppError && error.status === 401) redirect("/login");
    redirect("/login?state=unavailable");
  }
});
