import type { OrganizationId } from "./models";

export interface ProviderContext {
  organizationId: OrganizationId;
  correlationId: string;
  idempotencyKey?: string;
}

export interface ProviderResult<T> {
  providerRequestId: string | null;
  data: T;
}

export interface AIProvider {
  generateText(
    input: { prompt: string; instructions?: string },
    context: ProviderContext,
  ): Promise<ProviderResult<{ text: string }>>;
}

export interface MediaGenerationProvider {
  generate(
    input: { prompt: string; mediaType: "image" | "video" | "audio" },
    context: ProviderContext,
  ): Promise<ProviderResult<{ jobId: string }>>;
}

export interface VideoProject {
  id: string;
  organizationId: OrganizationId;
  specification: Record<string, unknown>;
  updatedAt: string;
}

export interface VideoRendererProvider {
  render(
    input: { project: VideoProject },
    context: ProviderContext,
  ): Promise<ProviderResult<{ jobId: string }>>;
}

export interface ContactInput {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  consent?: { email: boolean; sms: boolean };
}

export interface CRMProvider {
  upsertContact(
    input: ContactInput,
    context: ProviderContext,
  ): Promise<ProviderResult<{ contactId: string }>>;
}

export interface MarketingAutomationProvider {
  pauseContact(
    input: { contactId: string; reason: string },
    context: ProviderContext,
  ): Promise<ProviderResult<{ accepted: boolean }>>;
}

export interface SocialPublishingProvider {
  publish(
    input: { contentId: string; channel: string; scheduledAt?: string },
    context: ProviderContext,
  ): Promise<ProviderResult<{ externalPostId: string }>>;
}

export interface AdvertisingProvider {
  launch(
    input: { campaignId: string; approvedBudget: number; currency: string },
    context: ProviderContext,
  ): Promise<ProviderResult<{ externalCampaignId: string }>>;
}

export interface EmailProvider {
  send(
    input: { recipient: string; templateId: string; variables: Record<string, unknown> },
    context: ProviderContext,
  ): Promise<ProviderResult<{ messageId: string }>>;
}

export interface SmsProvider {
  send(
    input: { recipient: string; body: string },
    context: ProviderContext,
  ): Promise<ProviderResult<{ messageId: string }>>;
}

export interface WaitlistProvider {
  addInterest(
    input: { email: string; source: string },
    context: { correlationId: string },
  ): Promise<ProviderResult<{ accepted: boolean }>>;
}

export interface BillingProvider {
  createCheckoutSession(
    input: {
      organizationId: OrganizationId;
      planKey: string;
      successUrl: string;
      cancelUrl: string;
    },
    context: ProviderContext,
  ): Promise<ProviderResult<{ redirectUrl: string }>>;
  createCustomerPortalSession(
    input: { organizationId: OrganizationId; returnUrl: string },
    context: ProviderContext,
  ): Promise<ProviderResult<{ redirectUrl: string }>>;
}
