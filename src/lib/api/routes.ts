import {
  apiResponse,
  assertMutationOrigin,
  readJson,
} from "../security/http.ts";
import {
  authenticate,
  checkCredentials,
  issueSession,
  revokeSession,
} from "../auth/session.ts";
import {
  listRenewals,
  createRenewal,
  getRenewal,
  updateRenewal,
  archiveRenewal,
  renewRenewal,
  organizationView,
  updateSettings,
  dashboard,
} from "../renewals/service.ts";
import { collections } from "../db/client.ts";
import {
  confirmExtraction,
  createExtraction,
  getExtraction,
  listExtractions,
  rejectExtraction,
} from "../extractions/service.ts";

export async function login(request: Request) {
  let cookie: string | undefined;
  const response = await apiResponse(async () => {
    assertMutationOrigin(request);
    const user = await checkCredentials(await readJson(request));
    cookie = await issueSession(user);
    return { displayName: user.displayName, isDemo: user.isDemo };
  });
  if (cookie) response.headers.append("Set-Cookie", cookie);
  return response;
}
export async function logout(request: Request) {
  let cookie: string | undefined;
  const response = await apiResponse(async () => {
    assertMutationOrigin(request);
    cookie = await revokeSession(request);
    return { signedOut: true };
  });
  if (cookie) response.headers.append("Set-Cookie", cookie);
  return response;
}
export async function me(request: Request) {
  return apiResponse(async () => {
    const ctx = await authenticate(request);
    return {
      displayName: ctx.user.displayName,
      organization: organizationView(ctx),
    };
  });
}
export async function renewalsGet(request: Request) {
  return apiResponse(async () => {
    const ctx = await authenticate(request);
    const url = new URL(request.url);
    return listRenewals(ctx, {
      q: url.searchParams.get("q") ?? "",
      category: url.searchParams.get("category") ?? "all",
      status: url.searchParams.get("status") ?? "all",
    });
  });
}
export async function renewalsPost(request: Request) {
  return apiResponse(async () => {
    assertMutationOrigin(request);
    const ctx = await authenticate(request);
    return createRenewal(ctx, await readJson(request));
  }, 201);
}
export async function renewalGet(request: Request, id: string) {
  return apiResponse(async () => getRenewal(await authenticate(request), id));
}
export async function renewalPatch(request: Request, id: string) {
  return apiResponse(async () => {
    assertMutationOrigin(request);
    return updateRenewal(
      await authenticate(request),
      id,
      await readJson(request),
    );
  });
}
export async function renewalDelete(request: Request, id: string) {
  return apiResponse(async () => {
    assertMutationOrigin(request);
    return archiveRenewal(
      await authenticate(request),
      id,
      await readJson(request),
    );
  });
}
export async function renewalRenew(request: Request, id: string) {
  return apiResponse(async () => {
    assertMutationOrigin(request);
    return renewRenewal(
      await authenticate(request),
      id,
      await readJson(request),
    );
  });
}
export async function dashboardGet(request: Request) {
  return apiResponse(async () => dashboard(await authenticate(request)));
}
export async function settingsGet(request: Request) {
  return apiResponse(async () => {
    const ctx = await authenticate(request);
    return { organization: organizationView(ctx), ownerEmail: ctx.user.email };
  });
}
export async function settingsPatch(request: Request) {
  return apiResponse(async () => {
    assertMutationOrigin(request);
    return updateSettings(await authenticate(request), await readJson(request));
  });
}
export async function activityGet(request: Request) {
  return apiResponse(async () => {
    const ctx = await authenticate(request);
    const jobs = await (await collections()).reminderJobs
      .find({ organizationId: ctx.organization._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    return jobs.map((job) => ({
      id: job._id.toHexString(),
      renewalId: job.renewalId.toHexString(),
      status: job.status,
      channel: job.channel,
      scheduledForUtc: job.scheduledForUtc.toISOString(),
      attemptCount: job.attemptCount,
      lastErrorCode: job.lastErrorCode ?? null,
      kind: job.kind ?? "renewal",
      nextAttemptAt: job.nextAttemptAt.toISOString(),
      attempts: (job.attempts ?? []).map((a) => ({
        ...a,
        at: a.at.toISOString(),
      })),
    }));
  });
}
export async function extractionsGet(request: Request) {
  return apiResponse(async () => listExtractions(await authenticate(request)));
}
export async function extractionsPost(request: Request) {
  return apiResponse(async () => {
    assertMutationOrigin(request);
    return createExtraction(await authenticate(request), request);
  }, 201);
}
export async function extractionGet(request: Request, id: string) {
  return apiResponse(async () =>
    getExtraction(await authenticate(request), id),
  );
}
export async function extractionConfirm(request: Request, id: string) {
  return apiResponse(async () => {
    assertMutationOrigin(request);
    return confirmExtraction(
      await authenticate(request),
      id,
      await readJson(request),
    );
  }, 201);
}
export async function extractionReject(request: Request, id: string) {
  return apiResponse(async () => {
    assertMutationOrigin(request);
    return rejectExtraction(
      await authenticate(request),
      id,
      await readJson(request),
    );
  });
}
