import { z } from "zod";

export const HubspotEventSchema = z.discriminatedUnion("event", [
    z.object({event: z.literal("PluginLoadedEventReceived")}),
]);
export type HubspotEvent = z.infer<typeof HubspotEventSchema>;