import type {
  CRMProvider,
  BillingProvider,
  MarketingAutomationProvider,
  ProviderContext,
  ProviderResult,
} from "./providers";
import type { ContactInput } from "./providers";

export interface MauticTransport {
  upsertContact(
    input: ContactInput,
    context: ProviderContext,
  ): Promise<{ contactId: string; requestId?: string | null }>;
  pauseContact(
    input: { contactId: string; reason: string },
    context: ProviderContext,
  ): Promise<{ accepted: boolean; requestId?: string | null }>;
}

export interface MauticProviderAdapters {
  crm: CRMProvider;
  automation: MarketingAutomationProvider;
}

/** Keep Mautic's wire format and credentials inside the injected transport adapter. */
export function createMauticProviderAdapters(transport: MauticTransport): MauticProviderAdapters {
  const crm: CRMProvider = {
    async upsertContact(input, context): Promise<ProviderResult<{ contactId: string }>> {
      const result = await transport.upsertContact(input, context);
      return { providerRequestId: result.requestId ?? null, data: { contactId: result.contactId } };
    },
  };
  const automation: MarketingAutomationProvider = {
    async pauseContact(input, context): Promise<ProviderResult<{ accepted: boolean }>> {
      const result = await transport.pauseContact(input, context);
      return { providerRequestId: result.requestId ?? null, data: { accepted: result.accepted } };
    },
  };
  return { crm, automation };
}

export interface StripeBillingTransport {
  createCheckoutSession(
    input: Parameters<BillingProvider["createCheckoutSession"]>[0],
    context: ProviderContext,
  ): Promise<{ redirectUrl: string; requestId?: string | null }>;
  createCustomerPortalSession(
    input: Parameters<BillingProvider["createCustomerPortalSession"]>[0],
    context: ProviderContext,
  ): Promise<{ redirectUrl: string; requestId?: string | null }>;
}

/** Inject a server-only Stripe test-mode transport; browser code never receives Stripe secrets. */
export function createStripeBillingAdapter(transport: StripeBillingTransport): BillingProvider {
  return {
    async createCheckoutSession(input, context): Promise<ProviderResult<{ redirectUrl: string }>> {
      const result = await transport.createCheckoutSession(input, context);
      return {
        providerRequestId: result.requestId ?? null,
        data: { redirectUrl: result.redirectUrl },
      };
    },
    async createCustomerPortalSession(
      input,
      context,
    ): Promise<ProviderResult<{ redirectUrl: string }>> {
      const result = await transport.createCustomerPortalSession(input, context);
      return {
        providerRequestId: result.requestId ?? null,
        data: { redirectUrl: result.redirectUrl },
      };
    },
  };
}
