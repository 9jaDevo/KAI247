import { z } from "zod";

export const categories = [
  "regulatory_or_filing",
  "digital_infrastructure",
  "vehicle",
  "contract_or_other",
] as const;
export function validDate(value: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value < "1900-01-01" ||
    value > "2199-12-31"
  )
    return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  );
}
export const dateOnly = z
  .string()
  .refine(
    validDate,
    "Use a real calendar date in YYYY-MM-DD format (1900–2199).",
  );
export const timezoneSchema = z
  .string()
  .max(80)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Choose a valid IANA timezone.");
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (value) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value),
      "Control characters are not allowed.",
    );
const optionalText = (max: number) => text(max).optional();
const fields = {
  title: text(120).min(1, "Enter a renewal title."),
  category: z.enum(categories),
  dueDate: dateOnly,
  dateType: z.enum(["expiry", "renewal", "filing", "payment", "service"]),
  timezone: timezoneSchema,
  provider: optionalText(120),
  assetIdentifier: optionalText(160),
  amountMinor: z.number().int().nonnegative().max(1_000_000_000_000).optional(),
  currency: z.enum(["NGN", "USD", "GBP"]).optional(),
  responsibleLabel: optionalText(120),
  notes: optionalText(2000),
};
export const createRenewalSchema = z
  .strictObject(fields)
  .refine((value) => value.amountMinor === undefined || !!value.currency, {
    message: "Select a currency when an amount is entered.",
    path: ["currency"],
  });
// Edits send the complete editable form and expected version to prevent lost updates.
export const updateRenewalSchema = z
  .strictObject({ ...fields, version: z.number().int().positive() })
  .refine((value) => value.amountMinor === undefined || !!value.currency, {
    message: "Select a currency when an amount is entered.",
    path: ["currency"],
  });
// Owner-reviewed fields from a document extraction. The literal `true` makes
// confirmation an explicit act; the override flag is required when the chosen date
// is not one of the evidence-backed readings.
export const confirmExtractionSchema = z
  .strictObject({
    ...fields,
    evidenceChecked: z.literal(true, {
      error: "Confirm that you checked the source evidence.",
    }),
    acknowledgeDateDiffers: z.boolean().optional(),
  })
  .refine((value) => value.amountMinor === undefined || !!value.currency, {
    message: "Select a currency when an amount is entered.",
    path: ["currency"],
  });
export const rejectExtractionSchema = z.strictObject({
  reason: optionalText(300),
});
export const renewSchema = z.strictObject({
  dueDate: dateOnly,
  notes: optionalText(2000),
  version: z.number().int().positive(),
});
export const archiveSchema = z.strictObject({
  version: z.number().int().positive(),
});
export const settingsSchema = z.strictObject({
  name: text(120).min(1),
  timezone: timezoneSchema,
  emailOptIn: z.boolean(),
  reminderOffsetsDays: z
    .array(z.number().int().min(0).max(365))
    .min(1)
    .max(12)
    .refine(
      (values) => new Set(values).size === values.length,
      "Offsets must be unique.",
    ),
  reminderLocalTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});
export const loginSchema = z.strictObject({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});
export type RenewalInput = z.infer<typeof createRenewalSchema>;
