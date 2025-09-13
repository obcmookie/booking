// src/modules/booking/schemas.ts
import { z } from "zod";

const ymd = /^\d{4}-\d{2}-\d{2}$/;

const DateOnly = z.object({
  eventDate: z.string().regex(ymd, "Use YYYY-MM-DD"),
});

const DateRange = z
  .object({
    startDate: z.string().regex(ymd, "Use YYYY-MM-DD"),
    endDate: z.string().regex(ymd, "Use YYYY-MM-DD"),
  })
  .refine(({ startDate, endDate }) => endDate >= startDate, {
    path: ["endDate"],
    message: "End date must be on or after start date",
  });

export const InquiryInputSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email required"),
    phone: z.string().optional().default(""),
    eventType: z.string().min(1, "Event type required"),
    description: z.string().optional().default(""),
  })
  // Accept either legacy single date OR the new date range
  .and(z.union([DateRange, DateOnly]));

// 👇 This is what service.ts expects
export type InquiryInput = z.infer<typeof InquiryInputSchema>;
