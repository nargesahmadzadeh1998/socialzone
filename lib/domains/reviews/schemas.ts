import { z } from "zod";

export const reviewSchema = z.object({
  eventId: z.string().cuid(),
  stars: z.coerce.number().int().min(1).max(5),
  text: z.string().min(1).max(2000),
});
export type ReviewInput = z.infer<typeof reviewSchema>;
