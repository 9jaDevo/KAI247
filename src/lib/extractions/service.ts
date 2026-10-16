import { traceStep } from "../observability/telemetry.ts";
import { ObjectId } from "mongodb";
import { collections, ensureIndexes, getClient } from "../db/client.ts";
import { AppError } from "../security/errors.ts";
import { consumeRateLimit } from "../security/rate-limit.ts";
import { readDocumentUpload } from "../documents/upload.ts";
import { extractDocumentText } from "../documents/text.ts";
import { buildExtractionPrompt, PROMPT_VERSION } from "../ai/prompt.ts";
import {
  gemmaConfig,
  type GemmaConfig,
  type GemmaResult,
  type ChatMessage,
} from "../ai/gemma.ts";
import { extractWithGemma } from "../ai/extract.ts";
import { evidenceBackedDates, validateExtraction } from "../ai/validate.ts";
import {
  planInitialReminders,
  type ReminderPlanResult,
} from "../notifications/hooks.ts";
import {
  audit,
  objectId,
  requireWorkspaceTimezone,
} from "../renewals/service.ts";
import { renewalView, todayInTimezone } from "../renewals/dates.ts";
import {
  confirmExtractionSchema,
  rejectExtractionSchema,
} from "../renewals/validation.ts";
import type {
  Extraction,
  ExtractionCandidate,
  ExtractionView,
  OwnerContext,
  Renewal,
} from "../../types/domain.ts";

export interface ExtractionDependencies {
  config?: () => GemmaConfig;
  callModel?: (
    config: GemmaConfig,
    messages: ChatMessage[],
  ) => Promise<GemmaResult>;
}

export function extractionView(item: Extraction): ExtractionView {
  const {
    _id,
    organizationId: _organizationId,
    createdAt,
    updatedAt,
    reviewedAt,
    renewalId,
    ...fields
  } = item;
  void _organizationId;
  return {
    ...fields,
    id: _id.toHexString(),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    ...(reviewedAt ? { reviewedAt: reviewedAt.toISOString() } : {}),
    ...(renewalId ? { renewalId: renewalId.toHexString() } : {}),
  };
}

/**
 * Upload → text layer → real Gemma call → schema + evidence validation → Extraction
 * persisted as `pending_review`. This function never creates a Renewal.
 */
export async function createExtraction(
  ctx: OwnerContext,
  request: Request,
  deps: ExtractionDependencies = {},
) {
  return traceStep("ai_workflow", { synthetic: ctx.user.isDemo }, async () => {
    // Fail visibly before reading the upload when the model path is not configured.
    const config = (deps.config ?? gemmaConfig)();
    await ensureIndexes();
    await consumeRateLimit(
      "extract-org",
      ctx.organization._id.toHexString(),
      20,
      60 * 60 * 1000,
      "Upload limit reached: 20 document extractions per hour. Try again later.",
    );
    await consumeRateLimit(
      "extract-global",
      "all",
      200,
      60 * 60 * 1000,
      "Document extraction is busy right now. Try again later.",
    );
    const upload = await readDocumentUpload(request);
    const text = await traceStep("parse_document", {}, async (annotate) => {
      const result = await extractDocumentText(upload);
      annotate({ text_method: result.method, page_count: result.pages.length });
      return result;
    });
    const prompt = buildExtractionPrompt(text);
    const { output, result, attempts, elapsedMs } = await extractWithGemma(
      config,
      prompt.messages,
      deps.callModel,
    );
    const validated = traceStep("validate_candidate", {}, () =>
      validateExtraction(output, {
        pages: prompt.analysedPages,
        paged: text.paged,
        truncated: prompt.truncated,
        today: todayInTimezone(ctx.organization.timezone),
      }),
    );
    const now = new Date();
    const item: Extraction = {
      _id: new ObjectId(),
      organizationId: ctx.organization._id,
      sourceHash: upload.sha256,
      originalFilename: upload.filename,
      modelId: result.modelId,
      provider: result.provider,
      promptVersion: PROMPT_VERSION,
      textExtractionMethod: text.method,
      pageCount: text.pages.length,
      textChars: text.pages.reduce((sum, page) => sum + page.length, 0),
      truncated: prompt.truncated,
      candidateFields: validated.candidate,
      verbatimEvidence: validated.verbatimEvidence,
      warnings: validated.warnings,
      validationStatus: "pending_review",
      elapsedMs,
      modelAttempts: attempts,
      ...(result.usage ? { usage: result.usage } : {}),
      createdAt: now,
      updatedAt: now,
    };
    await (
      await getClient()
    ).withSession(async (session) =>
      session.withTransaction(async () => {
        await (await collections()).extractions.insertOne(item, { session });
        await audit(
          ctx,
          item._id,
          "extraction_created",
          `Document ${upload.filename} (sha256 ${upload.sha256.slice(0, 12)}…) analysed by ${result.modelId} in ${elapsedMs} ms (${attempts} attempt${attempts === 1 ? "" : "s"}). Date candidate: ${validated.candidate.date.status}. Pending owner review; no renewal created.`,
          session,
          "extraction",
        );
      }),
    );
    return extractionView(item);
  });
}

export async function listExtractions(ctx: OwnerContext) {
  const items = await (await collections()).extractions
    .find({ organizationId: ctx.organization._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();
  return items.map((item) => ({
    id: item._id.toHexString(),
    originalFilename: item.originalFilename,
    createdAt: item.createdAt.toISOString(),
    validationStatus: item.validationStatus,
    dateStatus: item.candidateFields.date.status,
    serviceTitle: item.candidateFields.serviceTitle,
    modelId: item.modelId,
    ...(item.renewalId ? { renewalId: item.renewalId.toHexString() } : {}),
  }));
}

export async function getExtraction(ctx: OwnerContext, id: string) {
  const item = await (
    await collections()
  ).extractions.findOne({
    _id: objectId(id),
    organizationId: ctx.organization._id,
  });
  if (!item) throw new AppError(404, "NOT_FOUND", "Extraction not found.");
  return extractionView(item);
}

function changedFields(
  candidate: ExtractionCandidate,
  data: {
    title: string;
    provider?: string;
    dueDate: string;
    dateType: string;
    amountMinor?: number;
    currency?: string;
  },
) {
  const changes: string[] = [];
  if (data.title !== candidate.serviceTitle) changes.push("title");
  if ((data.provider ?? null) !== candidate.provider) changes.push("provider");
  if (data.dueDate !== candidate.date.iso) changes.push("due date");
  if (data.dateType !== candidate.date.type) changes.push("date type");
  if ((data.amountMinor ?? null) !== candidate.amount.minor)
    changes.push("amount");
  if ((data.currency ?? null) !== candidate.amount.currency)
    changes.push("currency");
  return changes;
}

/**
 * The ONLY path from an extraction to a Renewal: an authenticated owner submits the
 * reviewed fields with an explicit evidence acknowledgement. Atomic and single-use.
 */
export async function confirmExtraction(
  ctx: OwnerContext,
  id: string,
  input: unknown,
) {
  return traceStep(
    "approve_renewal",
    { synthetic: ctx.user.isDemo },
    async () => {
      const {
        evidenceChecked: _checked,
        acknowledgeDateDiffers,
        ...data
      } = confirmExtractionSchema.parse(input);
      void _checked;
      requireWorkspaceTimezone(ctx, data.timezone);
      const extractionId = objectId(id);
      await ensureIndexes();
      let created: Renewal | null = null;
      let reminders: ReminderPlanResult | null = null;
      await (
        await getClient()
      ).withSession(async (session) =>
        session.withTransaction(async () => {
          const c = await collections();
          const existing = await c.extractions.findOne(
            { _id: extractionId, organizationId: ctx.organization._id },
            { session },
          );
          if (!existing)
            throw new AppError(404, "NOT_FOUND", "Extraction not found.");
          if (existing.validationStatus !== "pending_review")
            throw new AppError(
              409,
              "EXTRACTION_REVIEWED",
              "This extraction was already confirmed or declined.",
            );
          const candidate = existing.candidateFields;
          const backed = evidenceBackedDates(candidate);
          if (!backed.size)
            throw new AppError(
              422,
              "NO_EVIDENCE_BACKED_DATE",
              "This document has no evidence-backed date, so nothing can be confirmed from it. Add the renewal manually instead.",
            );
          const differs = !backed.has(data.dueDate);
          if (differs && !acknowledgeDateDiffers)
            throw new AppError(
              422,
              "DATE_NOT_IN_EVIDENCE",
              "The chosen due date is not one of the dates found in the document. Pick a document date or explicitly acknowledge the override.",
            );
          const evidence = differs
            ? null
            : candidate.date.interpretations.includes(data.dueDate)
              ? candidate.date.evidence
              : (candidate.otherDates.find((item) =>
                  item.interpretations.includes(data.dueDate),
                )?.evidence ?? null);
          const now = new Date();
          const renewal: Renewal = {
            ...data,
            _id: new ObjectId(),
            organizationId: ctx.organization._id,
            // An owner-typed date outside the evidence is a manual date, honestly labelled.
            dateSource: differs ? "manual" : "document_confirmed",
            ...(evidence
              ? { sourceExcerpt: evidence.match.slice(0, 600) }
              : {}),
            sourceFilename: existing.originalFilename,
            sourceHash: existing.sourceHash,
            status: "active",
            createdAt: now,
            updatedAt: now,
            version: 1,
          };
          const transition = await c.extractions.updateOne(
            {
              _id: extractionId,
              organizationId: ctx.organization._id,
              validationStatus: "pending_review",
            },
            {
              $set: {
                validationStatus: "confirmed",
                renewalId: renewal._id,
                reviewedAt: now,
                updatedAt: now,
              },
            },
            { session },
          );
          if (!transition.modifiedCount)
            throw new AppError(
              409,
              "EXTRACTION_REVIEWED",
              "This extraction was already confirmed or declined.",
            );
          await c.renewals.insertOne(renewal, { session });
          const edits = changedFields(candidate, data);
          await audit(
            ctx,
            renewal._id,
            "created_from_document",
            `Created after owner review of document extraction ${id} (${existing.modelId}). Due date ${data.dueDate} ${differs ? "was entered by the owner and is NOT an evidence-backed document date" : "matches verified document evidence"}. Owner-edited fields: ${edits.join(", ") || "none"}.`,
            session,
          );
          await audit(
            ctx,
            extractionId,
            "extraction_confirmed",
            `Owner confirmed the reviewed candidate; renewal ${renewal._id.toHexString()} created.`,
            session,
            "extraction",
          );
          reminders = await planInitialReminders(ctx, renewal, session);
          created = renewal;
        }),
      );
      return { renewal: renewalView(created!), reminders: reminders! };
    },
  );
}

export async function rejectExtraction(
  ctx: OwnerContext,
  id: string,
  input: unknown,
) {
  const { reason } = rejectExtractionSchema.parse(input);
  const extractionId = objectId(id);
  let rejected: Extraction | null = null;
  await (
    await getClient()
  ).withSession(async (session) =>
    session.withTransaction(async () => {
      const c = await collections();
      const now = new Date();
      rejected = await c.extractions.findOneAndUpdate(
        {
          _id: extractionId,
          organizationId: ctx.organization._id,
          validationStatus: "pending_review",
        },
        {
          $set: {
            validationStatus: "rejected",
            reviewedAt: now,
            updatedAt: now,
            ...(reason ? { rejectionReason: reason } : {}),
          },
        },
        { returnDocument: "after", session },
      );
      if (!rejected) {
        const exists = await c.extractions.findOne(
          { _id: extractionId, organizationId: ctx.organization._id },
          { session },
        );
        throw exists
          ? new AppError(
              409,
              "EXTRACTION_REVIEWED",
              "This extraction was already confirmed or declined.",
            )
          : new AppError(404, "NOT_FOUND", "Extraction not found.");
      }
      await audit(
        ctx,
        extractionId,
        "extraction_rejected",
        "Owner declined the candidate. No renewal was created.",
        session,
        "extraction",
      );
    }),
  );
  return extractionView(rejected!);
}
