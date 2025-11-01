import { z } from "zod";

const emailAddressSchema = z.object({
  email_address: z.string().email(),
  id: z.string(),
});

const userBaseSchema = z.object({
  id: z.string(),
  email_addresses: z.array(emailAddressSchema),
  primary_email_address_id: z.string().nullable(),
});

export const ClerkWebhookEventSchema = z.object({
  type: z.string(),
  data: userBaseSchema,
});

export type ClerkWebhookEvent = z.infer<typeof ClerkWebhookEventSchema>;

export const extractPrimaryEmail = (event: ClerkWebhookEvent) => {
  if (!event.data.email_addresses.length) {
    return null;
  }

  const primary = event.data.primary_email_address_id
    ? event.data.email_addresses.find((email) => email.id === event.data.primary_email_address_id)
    : event.data.email_addresses[0];

  return primary?.email_address ?? null;
};
