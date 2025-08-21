import { z } from "zod";
import { HubspotCTILocationSchema } from "./shared";

export const OnReadyEventSchema = z.object({
    engagementId: z.number().optional(),
    hostUrl: z.string().optional(),
    iframeLocation: HubspotCTILocationSchema,
    portalId: z.number(),
    userId: z.number()
});