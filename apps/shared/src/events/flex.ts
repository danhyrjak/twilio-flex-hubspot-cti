import { z } from "zod";

export const FlexEventSchema = z.discriminatedUnion("event", [
    z.object({event: z.literal("UserLoggedIn")}),
    z.object({event: z.literal("UserLoggedOut")}),
    z.object({event: z.literal("UserAvailable")}),
    z.object({event: z.literal("UserUnavailable")}),
    z.object({
        event: z.literal("IncomingCall"),
        createEngagement: z.boolean(),
        callDetails: z.object({
            callSid: z.string().regex(/^CA[0-9a-zA-Z]{32}$/),
            callStartTime: z.date(),
            fromNumber: z.string(),
            toNumber: z.string()
        })
    }),
    z.object({
        event: z.literal("CallEnded"), 
        callSid: z.string().regex(/^CA[09-a-fA-F]{32}$/), 
        endedReason: z.string()
    })
]);
export type FlexEvent = z.infer<typeof FlexEventSchema>;