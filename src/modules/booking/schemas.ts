// src/modules/booking/schemas.ts
import { z } from 'zod';


const DateRe = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD


export const InquirySingleDaySchema = z.object({
name: z.string().min(2, 'Please enter your full name'),
email: z.string().email(),
phone: z.string().min(7),
eventType: z.string().min(2),
eventDate: z.string().regex(DateRe, 'Use YYYY-MM-DD'),
description: z.string().optional(),
});


export const InquiryRangeSchema = z
.object({
name: z.string().min(2, 'Please enter your full name'),
email: z.string().email(),
phone: z.string().min(7),
eventType: z.string().min(2),
startDate: z.string().regex(DateRe, 'Use YYYY-MM-DD'),
endDate: z.string().regex(DateRe, 'Use YYYY-MM-DD'),
description: z.string().optional(),
})
.refine((v) => new Date(v.endDate) >= new Date(v.startDate), {
path: ['endDate'],
message: 'End date must be the same or after start date',
});


export const InquiryAnySchema = z.union([InquiryRangeSchema, InquirySingleDaySchema]);


export type InquirySingleDay = z.infer<typeof InquirySingleDaySchema>;
export type InquiryRange = z.infer<typeof InquiryRangeSchema>;
export type InquiryAny = z.infer<typeof InquiryAnySchema>;