import { z } from "zod";
import { HubspotCTILocationSchema } from "./shared";

const BaseProps = {
    sourceLocation: HubspotCTILocationSchema,
    sourceId: z.string().ulid()
};

export const BroadcastEventSchema = z.discriminatedUnion("event", [
    z.object({...BaseProps, event: z.literal("READY")}),
    z.object({...BaseProps, event: z.literal("PING")}),
    z.object({...BaseProps, event: z.literal("PONG")})
]);
export type BroadcastEvent = z.infer<typeof BroadcastEventSchema>;