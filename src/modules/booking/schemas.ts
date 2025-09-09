import { z } from "zod";

export const InquiryInputSchema = z.object({
  name: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7, "Enter a valid phone").max(30),
  eventType: z.string().min(2, "Event type required"),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  description: z.string().max(2000).optional().or(z.literal("")),
});

export type InquiryInput = z.infer<typeof InquiryInputSchema>;
