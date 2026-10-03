export function requireStripeTestSecretKey(secretKey: string | undefined): string {
  if (!secretKey)
    throw new Error(
      "Stripe test billing is unavailable because STRIPE_SECRET_KEY is not configured.",
    );
  if (!secretKey.startsWith("sk_test_")) {
    throw new Error("Week 1 billing setup accepts Stripe test-mode secret keys only.");
  }
  return secretKey;
}
