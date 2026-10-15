export async function clientApi<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(path, {
    method,
    cache: "no-store",
    ...(body !== undefined
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(
      "The service returned an unreadable response. Please retry.",
    );
  }
  if (response.status === 401) {
    window.location.assign(new URL("/login", window.location.origin).href);
    throw new Error("Your session expired. Sign in again.");
  }
  if (!response.ok)
    throw new Error(
      result.error?.details
        ?.map(
          (item: { field: string; message: string }) =>
            `${item.field}: ${item.message}`,
        )
        .join(" ") ||
        result.error?.message ||
        "The request failed.",
    );
  return result.data as T;
}
