import { z } from "zod";

export const eventInputSchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(10).max(5000),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  timezone: z.string().min(1).max(64),
  addressText: z.string().min(1).max(300),
  lat: z.coerce.number().optional().nullable(),
  lng: z.coerce.number().optional().nullable(),
  capacity: z.coerce.number().int().min(1).max(10000),
  priceMinor: z.coerce.number().int().min(0).max(10_000_00),
  interestIds: z.array(z.string().cuid()).min(1).max(10),
  coverImagePath: z.string().max(400).optional().nullable(),
}).refine((d) => d.endsAt > d.startsAt, { message: "endsAt must be after startsAt", path: ["endsAt"] });

export type EventInput = z.infer<typeof eventInputSchema>;

export const feedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
