import { z } from "zod";

export const OnReadyEventSchema = z.object({
    engagementId: z.number().optional(),
    hostUrl: z.string().optional(),
    iframeLocation: z.union([
      z.literal("widget"),
      z.literal("remote"),
      z.literal("window")
    ]),
    portalId: z.number(),
    userId: z.number()
});