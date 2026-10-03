# ADR 0002: Provider adapters and asynchronous work

- Status: Accepted
- Date: 2026-10-02

## Context

Showoff must retain control of customer data, approval policy, usage charging, and retry behavior as external services change. Provider calls can fail after a customer has edited work or after usage has been reserved.

## Decision

Product code depends on Showoff-owned provider interfaces. Provider-specific wire formats and credentials stay behind adapters and injected transports. Background work records an organization, state, attempt, and correlation ID. Before chargeable work starts, the server reserves usage with an idempotency key; it commits after provider acceptance and releases after a failure that was not chargeable. Draft persistence writes the local copy first and reports remote conflicts or outages without discarding user work. Consequential actions pass through the action registry and approval policy.

## Consequences

Adapters can be tested without provider credentials. Provider request events store identifiers, outcomes, durations, and error codes, not request or response bodies. Email and SMS remain independently gated and disabled until the provider and policy setup is approved.

## Alternatives considered

- Calling provider SDKs from feature code: rejected because it binds product behavior to replaceable services.
- Charging usage before provider outcome: rejected because failed or retried work can be billed incorrectly.
- Retrying by rerunning arbitrary action code: rejected because side effects require idempotency and explicit state transitions.
