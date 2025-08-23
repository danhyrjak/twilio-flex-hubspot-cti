import { z } from "zod";

export const HubspotCTILocationSchema = z.literal("window").or(z.literal("remote"));
export type HubspotCTILocation = z.infer<typeof HubspotCTILocationSchema>;

export const EnvSchema = z.object({
  VITE_TWILIO_FLEX_ORIGIN: z.string().url()
});
