create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_organization_creator(
  requested_organization_id uuid,
  requested_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and requested_user_id = (select auth.uid())
    and exists (
      select 1
      from public.organizations organization
      where organization.id = requested_organization_id
        and organization.created_by = (select auth.uid())
    );
$$;

revoke all on function private.is_organization_creator(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function private.is_organization_creator(uuid, uuid) to authenticated;

create table public.plan_catalog (
  plan_key text primary key check (plan_key ~ '^[a-z][a-z0-9_-]{1,63}$'),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 120),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plan_entitlements (
  plan_key text not null references public.plan_catalog (plan_key) on delete cascade,
  entitlement_key text not null check (entitlement_key ~ '^[a-z][a-z0-9_.-]{1,127}$'),
  enabled boolean not null default false,
  quantity_limit bigint check (quantity_limit is null or quantity_limit >= 0),
  limit_period text check (limit_period is null or limit_period in ('day', 'month', 'lifetime')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (plan_key, entitlement_key),
  check ((quantity_limit is null) = (limit_period is null))
);

create table public.subscriptions (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  plan_key text references public.plan_catalog (plan_key) on delete restrict,
  state text not null default 'trialing'
    check (state in ('trialing', 'active', 'pause_scheduled', 'paused', 'cancellation_scheduled', 'payment_required', 'cancelled', 'terminated')),
  billing_provider text not null default 'stripe' check (billing_provider in ('stripe')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_status text,
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (current_period_ends_at is null or current_period_starts_at is null or current_period_ends_at > current_period_starts_at),
  unique (organization_id, stripe_customer_id),
  unique (organization_id, stripe_subscription_id)
);

create unique index subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;
create unique index subscriptions_stripe_subscription_id_idx
  on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create table public.feature_flags (
  flag_key text primary key check (flag_key ~ '^[a-z][a-z0-9_.-]{1,127}$'),
  enabled boolean not null default false,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_feature_flags (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  flag_key text not null references public.feature_flags (flag_key) on delete cascade,
  enabled boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, flag_key)
);

insert into public.feature_flags (flag_key, enabled, description)
values
  ('feature.email.enabled', false, 'Master gate for email delivery.'),
  ('feature.email.marketing_enabled', false, 'Gate for marketing email delivery.'),
  ('feature.email.transactional_enabled', false, 'Gate for transactional email delivery.'),
  ('feature.sms.enabled', false, 'Master gate for SMS delivery.'),
  ('feature.sms.marketing_enabled', false, 'Gate for marketing SMS delivery.'),
  ('feature.sms.transactional_enabled', false, 'Gate for transactional SMS delivery.'),
  ('feature.support_chat.enabled', false, 'Gate for customer support chat.'),
  ('feature.support_ai.enabled', false, 'Gate for AI-assisted customer support.'),
  ('feature.social.enabled', false, 'Gate for social publishing.'),
  ('feature.ads.enabled', false, 'Gate for advertising integrations.');

create table public.usage_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  usage_key text not null check (usage_key ~ '^[a-z][a-z0-9_.-]{1,127}$'),
  period_starts_at timestamptz not null,
  period_ends_at timestamptz not null,
  allowance bigint check (allowance is null or allowance >= 0),
  consumed bigint not null default 0 check (consumed >= 0),
  reserved bigint not null default 0 check (reserved >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, usage_key, period_starts_at),
  unique (organization_id, id),
  check (period_ends_at > period_starts_at)
);

create index usage_accounts_current_period_idx
  on public.usage_accounts (organization_id, usage_key, period_ends_at desc);

create table public.usage_reservations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  usage_account_id uuid not null,
  usage_key text not null,
  quantity bigint not null check (quantity > 0),
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 128),
  status text not null default 'reserved' check (status in ('reserved', 'committed', 'released')),
  requested_by uuid not null references auth.users (id) on delete restrict,
  correlation_id text not null check (char_length(correlation_id) between 1 and 128),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, usage_account_id)
    references public.usage_accounts (organization_id, id) on delete restrict,
  unique (organization_id, idempotency_key),
  unique (organization_id, id),
  check (usage_key ~ '^[a-z][a-z0-9_.-]{1,127}$')
);

create index usage_reservations_organization_status_created_idx
  on public.usage_reservations (organization_id, status, created_at desc);

create table public.usage_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  reservation_id uuid,
  usage_key text not null,
  quantity bigint not null check (quantity > 0),
  direction text not null check (direction in ('debit', 'credit')),
  correlation_id text not null check (char_length(correlation_id) between 1 and 128),
  created_at timestamptz not null default now(),
  foreign key (organization_id, reservation_id)
    references public.usage_reservations (organization_id, id) on delete restrict,
  unique (reservation_id),
  check (usage_key ~ '^[a-z][a-z0-9_.-]{1,127}$')
);

create index usage_ledger_organization_created_idx
  on public.usage_ledger_entries (organization_id, created_at desc);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  action_key text not null check (action_key ~ '^[a-z][a-z0-9_.-]{1,127}$'),
  subject_type text not null check (char_length(btrim(subject_type)) between 1 and 80),
  subject_id text,
  requested_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(requested_payload) = 'object'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  requested_by uuid not null references auth.users (id) on delete restrict,
  decided_by uuid references auth.users (id) on delete restrict,
  decision_reason text check (decision_reason is null or char_length(decision_reason) <= 2000),
  correlation_id text not null check (char_length(correlation_id) between 1 and 128),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  check (
    (status = 'pending' and decided_by is null and decided_at is null)
    or (status <> 'pending' and decided_by is not null and decided_at is not null)
  ),
  unique (organization_id, id)
);

create index approvals_organization_status_requested_idx
  on public.approvals (organization_id, status, requested_at desc);

create table public.provider_request_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  provider_key text not null check (char_length(btrim(provider_key)) between 1 and 80),
  operation text not null check (char_length(btrim(operation)) between 1 and 120),
  outcome text not null check (outcome in ('accepted', 'succeeded', 'failed', 'rate_limited')),
  provider_request_id text,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  retryable boolean not null default false,
  error_code text,
  correlation_id text not null check (char_length(correlation_id) between 1 and 128),
  occurred_at timestamptz not null default now()
);

create index provider_request_events_organization_occurred_idx
  on public.provider_request_events (organization_id, occurred_at desc);
create index provider_request_events_failures_idx
  on public.provider_request_events (occurred_at desc)
  where outcome in ('failed', 'rate_limited');

create table public.operational_alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  source text not null check (char_length(btrim(source)) between 1 and 80),
  alert_key text not null check (char_length(btrim(alert_key)) between 1 and 160),
  summary text not null check (char_length(btrim(summary)) between 1 and 2000),
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  correlation_id text check (correlation_id is null or char_length(correlation_id) between 1 and 128),
  occurrence_count bigint not null default 1 check (occurrence_count > 0),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index operational_alerts_status_severity_updated_idx
  on public.operational_alerts (status, severity, updated_at desc);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

revoke all on function private.touch_updated_at() from public, anon, authenticated, service_role;

create trigger plan_catalog_touch_updated_at
  before update on public.plan_catalog
  for each row execute function private.touch_updated_at();
create trigger plan_entitlements_touch_updated_at
  before update on public.plan_entitlements
  for each row execute function private.touch_updated_at();
create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function private.touch_updated_at();
create trigger feature_flags_touch_updated_at
  before update on public.feature_flags
  for each row execute function private.touch_updated_at();
create trigger organization_feature_flags_touch_updated_at
  before update on public.organization_feature_flags
  for each row execute function private.touch_updated_at();
create trigger usage_accounts_touch_updated_at
  before update on public.usage_accounts
  for each row execute function private.touch_updated_at();
create trigger usage_reservations_touch_updated_at
  before update on public.usage_reservations
  for each row execute function private.touch_updated_at();
create trigger operational_alerts_touch_updated_at
  before update on public.operational_alerts
  for each row execute function private.touch_updated_at();

alter table public.plan_catalog enable row level security;
alter table public.plan_entitlements enable row level security;
alter table public.subscriptions enable row level security;
alter table public.feature_flags enable row level security;
alter table public.organization_feature_flags enable row level security;
alter table public.usage_accounts enable row level security;
alter table public.usage_reservations enable row level security;
alter table public.usage_ledger_entries enable row level security;
alter table public.approvals enable row level security;
alter table public.provider_request_events enable row level security;
alter table public.operational_alerts enable row level security;

revoke all on table public.plan_catalog from public, anon, authenticated;
revoke all on table public.plan_entitlements from public, anon, authenticated;
revoke all on table public.subscriptions from public, anon, authenticated;
revoke all on table public.feature_flags from public, anon, authenticated;
revoke all on table public.organization_feature_flags from public, anon, authenticated;
revoke all on table public.usage_accounts from public, anon, authenticated;
revoke all on table public.usage_reservations from public, anon, authenticated;
revoke all on table public.usage_ledger_entries from public, anon, authenticated;
revoke all on table public.approvals from public, anon, authenticated;
revoke all on table public.provider_request_events from public, anon, authenticated;
revoke all on table public.operational_alerts from public, anon, authenticated;

grant select on table public.plan_catalog, public.plan_entitlements to authenticated;
grant select, insert (organization_id) on table public.subscriptions to authenticated;
grant select on table public.feature_flags, public.organization_feature_flags to authenticated;
grant select on table public.usage_accounts, public.usage_reservations, public.usage_ledger_entries to authenticated;
grant select, insert on table public.approvals to authenticated;
grant select on table public.provider_request_events, public.operational_alerts to authenticated;

grant select, insert, update, delete on table public.plan_catalog to service_role;
grant select, insert, update, delete on table public.plan_entitlements to service_role;
grant select, insert, update, delete on table public.subscriptions to service_role;
grant select, insert, update, delete on table public.feature_flags to service_role;
grant select, insert, update, delete on table public.organization_feature_flags to service_role;
grant select, insert, update, delete on table public.usage_accounts to service_role;
grant select, insert, update, delete on table public.usage_reservations to service_role;
grant select, insert, update, delete on table public.usage_ledger_entries to service_role;
grant select, insert, update, delete on table public.approvals to service_role;
grant select, insert on table public.provider_request_events to service_role;
grant select, insert, update, delete on table public.operational_alerts to service_role;

create policy "authenticated users can read active plans"
  on public.plan_catalog for select to authenticated using (active);
create policy "authenticated users can read entitlements for active plans"
  on public.plan_entitlements for select to authenticated using (
    exists (select 1 from public.plan_catalog plan where plan.plan_key = plan_entitlements.plan_key and plan.active)
  );
create policy "organization members can read subscriptions"
  on public.subscriptions for select to authenticated using (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = subscriptions.organization_id
      and membership.user_id = (select auth.uid())
  ));
create policy "organization owners can create an unconfigured trial subscription"
  on public.subscriptions for insert to authenticated with check (
    plan_key is null
    and state = 'trialing'
    and stripe_customer_id is null
    and stripe_subscription_id is null
    and exists (
      select 1 from public.organization_memberships membership
      where membership.organization_id = subscriptions.organization_id
        and membership.user_id = (select auth.uid())
        and membership.role = 'owner'
    )
  );

drop policy if exists "organization creators can add their initial owner membership"
  on public.organization_memberships;
create policy "organization creators can add their initial owner membership"
  on public.organization_memberships for insert to authenticated with check (
    user_id = (select auth.uid())
    and role = 'owner'
    and (select private.is_organization_creator(organization_id, user_id))
  );

create policy "authenticated users can read feature flags"
  on public.feature_flags for select to authenticated using (true);
create policy "organization members can read feature flag overrides"
  on public.organization_feature_flags for select to authenticated using (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = organization_feature_flags.organization_id
      and membership.user_id = (select auth.uid())
  ));
create policy "organization members can read usage accounts"
  on public.usage_accounts for select to authenticated using (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = usage_accounts.organization_id
      and membership.user_id = (select auth.uid())
  ));
create policy "organization members can read usage reservations"
  on public.usage_reservations for select to authenticated using (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = usage_reservations.organization_id
      and membership.user_id = (select auth.uid())
  ));
create policy "organization members can read usage ledger entries"
  on public.usage_ledger_entries for select to authenticated using (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = usage_ledger_entries.organization_id
      and membership.user_id = (select auth.uid())
  ));
create policy "organization members can read approvals"
  on public.approvals for select to authenticated using (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = approvals.organization_id
      and membership.user_id = (select auth.uid())
  ));
create policy "organization members can request approvals"
  on public.approvals for insert to authenticated with check (
    status = 'pending'
    and requested_by = (select auth.uid())
    and decided_by is null
    and decided_at is null
    and exists (
      select 1 from public.organization_memberships membership
      where membership.organization_id = approvals.organization_id
        and membership.user_id = (select auth.uid())
    )
  );
create policy "organization members and platform admins can read provider events"
  on public.provider_request_events for select to authenticated using (
    public.has_platform_admin_access()
    or (
      organization_id is not null
      and exists (
        select 1 from public.organization_memberships membership
        where membership.organization_id = provider_request_events.organization_id
          and membership.user_id = (select auth.uid())
      )
    )
  );
create policy "platform admins can read operational alerts"
  on public.operational_alerts for select to authenticated
  using (public.has_platform_admin_access());

create or replace function public.resolve_entitlement(
  requested_organization_id uuid,
  requested_entitlement_key text
)
returns table (enabled boolean, quantity_limit bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(entitlement.enabled, false), entitlement.quantity_limit
  from (select 1) as one_row
  left join lateral (
    select plan_entitlement.enabled, plan_entitlement.quantity_limit
    from public.subscriptions subscription
    left join public.plan_entitlements plan_entitlement
      on plan_entitlement.plan_key = subscription.plan_key
      and plan_entitlement.entitlement_key = requested_entitlement_key
    where subscription.organization_id = requested_organization_id
      and (
        subscription.state in ('trialing', 'active')
        or (
          subscription.state in ('pause_scheduled', 'cancellation_scheduled')
          and subscription.current_period_ends_at > pg_catalog.now()
        )
      )
  ) as entitlement on true
  where (select auth.uid()) is not null
    and exists (
      select 1 from public.organization_memberships membership
      where membership.organization_id = requested_organization_id
        and membership.user_id = (select auth.uid())
    );
$$;

revoke all on function public.resolve_entitlement(uuid, text) from public, anon, authenticated;
grant execute on function public.resolve_entitlement(uuid, text) to authenticated;

create or replace function public.is_feature_enabled(
  requested_organization_id uuid,
  requested_flag_key text
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (
      select organization_flag.enabled
      from public.organization_feature_flags organization_flag
      where organization_flag.organization_id = requested_organization_id
        and organization_flag.flag_key = requested_flag_key
    ),
    (
      select feature_flag.enabled
      from public.feature_flags feature_flag
      where feature_flag.flag_key = requested_flag_key
    ),
    false
  )
  and (select auth.uid()) is not null
  and exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = requested_organization_id
      and membership.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_feature_enabled(uuid, text) from public, anon, authenticated;
grant execute on function public.is_feature_enabled(uuid, text) to authenticated;

create or replace function private.reserve_usage(
  requested_organization_id uuid,
  requested_usage_key text,
  requested_quantity bigint,
  requested_idempotency_key text,
  requested_correlation_id text
)
returns public.usage_reservations
language plpgsql
security definer
set search_path = ''
as $$
declare
  calling_user_id uuid := (select auth.uid());
  account public.usage_accounts%rowtype;
  existing_reservation public.usage_reservations%rowtype;
  new_reservation public.usage_reservations%rowtype;
begin
  if calling_user_id is null then
    raise exception 'Authentication is required to reserve usage' using errcode = '42501';
  end if;
  if requested_quantity is null or requested_quantity <= 0 then
    raise exception 'Usage quantity must be positive' using errcode = '22023';
  end if;
  if requested_usage_key is null
     or requested_usage_key !~ '^[a-z][a-z0-9_.-]{1,127}$'
     or requested_idempotency_key is null
     or char_length(requested_idempotency_key) not between 8 and 128
     or requested_correlation_id is null
     or char_length(requested_correlation_id) not between 1 and 128 then
    raise exception 'Usage reservation metadata is invalid' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = requested_organization_id
      and membership.user_id = calling_user_id
  ) then
    raise exception 'Organization membership is required to reserve usage' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(requested_organization_id::text || ':' || requested_idempotency_key, 0)
  );

  select reservation.* into existing_reservation
  from public.usage_reservations reservation
  where reservation.organization_id = requested_organization_id
    and reservation.idempotency_key = requested_idempotency_key;
  if found then
    if existing_reservation.usage_key <> requested_usage_key
       or existing_reservation.quantity <> requested_quantity then
      raise exception 'Idempotency key was already used for a different reservation' using errcode = '23505';
    end if;
    return existing_reservation;
  end if;

  select usage_account.* into account
  from public.usage_accounts usage_account
  where usage_account.organization_id = requested_organization_id
    and usage_account.usage_key = requested_usage_key
    and usage_account.period_starts_at <= pg_catalog.now()
    and usage_account.period_ends_at > pg_catalog.now()
  order by usage_account.period_starts_at desc
  limit 1
  for update;
  if not found then
    raise exception 'No current usage account is configured for this organization and usage key' using errcode = 'P0002';
  end if;
  if account.allowance is not null
     and account.consumed + account.reserved + requested_quantity > account.allowance then
    raise exception 'Usage allowance would be exceeded' using errcode = '23514';
  end if;

  insert into public.usage_reservations (
    organization_id, usage_account_id, usage_key, quantity,
    idempotency_key, requested_by, correlation_id
  ) values (
    requested_organization_id, account.id, requested_usage_key, requested_quantity,
    requested_idempotency_key, calling_user_id, requested_correlation_id
  ) returning * into new_reservation;

  update public.usage_accounts
  set reserved = reserved + requested_quantity
  where id = account.id;

  insert into public.audit_events (
    organization_id, actor_id, action, entity_type, entity_id, correlation_id, metadata
  ) values (
    requested_organization_id, calling_user_id, 'usage.reserved', 'usage_reservation',
    new_reservation.id::text, requested_correlation_id,
    pg_catalog.jsonb_build_object('usage_key', requested_usage_key, 'quantity', requested_quantity)
  );

  return new_reservation;
end;
$$;

create or replace function private.commit_usage_reservation(requested_reservation_id uuid)
returns public.usage_reservations
language plpgsql
security definer
set search_path = ''
as $$
declare
  reservation public.usage_reservations%rowtype;
  account public.usage_accounts%rowtype;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'Service role is required to commit usage' using errcode = '42501';
  end if;
  select usage_reservation.* into reservation
  from public.usage_reservations usage_reservation
  where usage_reservation.id = requested_reservation_id
  for update;
  if not found then
    raise exception 'Usage reservation was not found' using errcode = 'P0002';
  end if;
  if reservation.status = 'committed' then return reservation; end if;
  if reservation.status <> 'reserved' then
    raise exception 'Only reserved usage can be committed' using errcode = '23514';
  end if;
  select usage_account.* into account
  from public.usage_accounts usage_account
  where usage_account.id = reservation.usage_account_id
  for update;
  update public.usage_accounts
  set reserved = reserved - reservation.quantity,
      consumed = consumed + reservation.quantity
  where id = account.id;
  update public.usage_reservations
  set status = 'committed'
  where id = reservation.id
  returning * into reservation;
  insert into public.usage_ledger_entries (
    organization_id, reservation_id, usage_key, quantity, direction, correlation_id
  ) values (
    reservation.organization_id, reservation.id, reservation.usage_key,
    reservation.quantity, 'debit', reservation.correlation_id
  );
  insert into public.audit_events (
    organization_id, actor_id, action, entity_type, entity_id, correlation_id, metadata
  ) values (
    reservation.organization_id, reservation.requested_by, 'usage.committed', 'usage_reservation',
    reservation.id::text, reservation.correlation_id,
    pg_catalog.jsonb_build_object('usage_key', reservation.usage_key, 'quantity', reservation.quantity)
  );
  return reservation;
end;
$$;

create or replace function private.release_usage_reservation(requested_reservation_id uuid)
returns public.usage_reservations
language plpgsql
security definer
set search_path = ''
as $$
declare
  reservation public.usage_reservations%rowtype;
  account public.usage_accounts%rowtype;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'Service role is required to release usage' using errcode = '42501';
  end if;
  select usage_reservation.* into reservation
  from public.usage_reservations usage_reservation
  where usage_reservation.id = requested_reservation_id
  for update;
  if not found then
    raise exception 'Usage reservation was not found' using errcode = 'P0002';
  end if;
  if reservation.status = 'released' then return reservation; end if;
  if reservation.status <> 'reserved' then
    raise exception 'Only reserved usage can be released' using errcode = '23514';
  end if;
  select usage_account.* into account
  from public.usage_accounts usage_account
  where usage_account.id = reservation.usage_account_id
  for update;
  update public.usage_accounts
  set reserved = reserved - reservation.quantity
  where id = account.id;
  update public.usage_reservations
  set status = 'released'
  where id = reservation.id
  returning * into reservation;
  insert into public.audit_events (
    organization_id, actor_id, action, entity_type, entity_id, correlation_id, metadata
  ) values (
    reservation.organization_id, reservation.requested_by, 'usage.released', 'usage_reservation',
    reservation.id::text, reservation.correlation_id,
    pg_catalog.jsonb_build_object('usage_key', reservation.usage_key, 'quantity', reservation.quantity)
  );
  return reservation;
end;
$$;

create or replace function public.reserve_usage(
  requested_organization_id uuid,
  requested_usage_key text,
  requested_quantity bigint,
  requested_idempotency_key text,
  requested_correlation_id text
)
returns public.usage_reservations
language sql
security invoker
set search_path = ''
as $$
  select private.reserve_usage(
    requested_organization_id, requested_usage_key, requested_quantity,
    requested_idempotency_key, requested_correlation_id
  );
$$;

create or replace function public.commit_usage_reservation(requested_reservation_id uuid)
returns public.usage_reservations
language sql
security invoker
set search_path = ''
as $$ select private.commit_usage_reservation(requested_reservation_id); $$;

create or replace function public.release_usage_reservation(requested_reservation_id uuid)
returns public.usage_reservations
language sql
security invoker
set search_path = ''
as $$ select private.release_usage_reservation(requested_reservation_id); $$;

revoke all on function private.reserve_usage(uuid, text, bigint, text, text) from public, anon, authenticated, service_role;
revoke all on function private.commit_usage_reservation(uuid) from public, anon, authenticated, service_role;
revoke all on function private.release_usage_reservation(uuid) from public, anon, authenticated, service_role;
grant execute on function private.reserve_usage(uuid, text, bigint, text, text) to authenticated;
grant execute on function private.commit_usage_reservation(uuid) to service_role;
grant execute on function private.release_usage_reservation(uuid) to service_role;
revoke all on function public.reserve_usage(uuid, text, bigint, text, text) from public, anon, authenticated;
revoke all on function public.commit_usage_reservation(uuid) from public, anon, authenticated, service_role;
revoke all on function public.release_usage_reservation(uuid) from public, anon, authenticated, service_role;
grant execute on function public.reserve_usage(uuid, text, bigint, text, text) to authenticated;
grant execute on function public.commit_usage_reservation(uuid) to service_role;
grant execute on function public.release_usage_reservation(uuid) to service_role;

create or replace function private.decide_approval(
  requested_approval_id uuid,
  requested_decision text,
  requested_reason text default null
)
returns public.approvals
language plpgsql
security definer
set search_path = ''
as $$
declare
  calling_user_id uuid := (select auth.uid());
  approval public.approvals%rowtype;
begin
  if calling_user_id is null then
    raise exception 'Authentication is required to decide an approval' using errcode = '42501';
  end if;
  if requested_decision is null or requested_decision not in ('approved', 'rejected') then
    raise exception 'Approval decision must be approved or rejected' using errcode = '22023';
  end if;
  select approval_row.* into approval
  from public.approvals approval_row
  where approval_row.id = requested_approval_id
  for update;
  if not found then
    raise exception 'Approval request was not found' using errcode = 'P0002';
  end if;
  if not exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = approval.organization_id
      and membership.user_id = calling_user_id
      and membership.role = 'owner'
  ) then
    raise exception 'Organization owner permission is required to decide an approval' using errcode = '42501';
  end if;
  if approval.status <> 'pending' then
    raise exception 'Only pending approvals can be decided' using errcode = '23514';
  end if;
  update public.approvals
  set status = requested_decision,
      decided_by = calling_user_id,
      decision_reason = nullif(pg_catalog.btrim(requested_reason), ''),
      decided_at = pg_catalog.now()
  where id = approval.id
  returning * into approval;
  insert into public.audit_events (
    organization_id, actor_id, action, entity_type, entity_id, correlation_id, metadata
  ) values (
    approval.organization_id, calling_user_id, 'approval.decided', 'approval',
    approval.id::text, approval.correlation_id,
    pg_catalog.jsonb_build_object('action_key', approval.action_key, 'status', approval.status)
  );
  return approval;
end;
$$;

create or replace function public.decide_approval(
  requested_approval_id uuid,
  requested_decision text,
  requested_reason text default null
)
returns public.approvals
language sql
security invoker
set search_path = ''
as $$ select private.decide_approval(requested_approval_id, requested_decision, requested_reason); $$;

revoke all on function private.decide_approval(uuid, text, text) from public, anon, authenticated, service_role;
grant execute on function private.decide_approval(uuid, text, text) to authenticated;
revoke all on function public.decide_approval(uuid, text, text) from public, anon, authenticated;
grant execute on function public.decide_approval(uuid, text, text) to authenticated;

create or replace function public.create_organization(organization_name text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_organization_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to create an organization'
      using errcode = '42501';
  end if;

  insert into public.organizations (name, created_by)
  values (pg_catalog.btrim(organization_name), auth.uid())
  returning id into new_organization_id;

  insert into public.organization_memberships (organization_id, user_id, role)
  values (new_organization_id, auth.uid(), 'owner');

  insert into public.subscriptions (organization_id)
  values (new_organization_id);

  return new_organization_id;
end;
$$;

insert into public.subscriptions (organization_id)
select organization.id
from public.organizations organization
on conflict (organization_id) do nothing;
