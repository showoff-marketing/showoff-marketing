begin;
select no_plan();

insert into auth.users (id, email)
values
  ('30000000-0000-4000-8000-000000000003', 'owner-c@example.test'),
  ('40000000-0000-4000-8000-000000000004', 'member-c@example.test'),
  ('50000000-0000-4000-8000-000000000005', 'owner-d@example.test');

insert into public.organizations (id, name, created_by)
values
  ('c0000000-0000-4000-8000-000000000003', 'Organization C', '30000000-0000-4000-8000-000000000003'),
  ('d0000000-0000-4000-8000-000000000004', 'Organization D', '50000000-0000-4000-8000-000000000005');

insert into public.organization_memberships (organization_id, user_id, role)
values
  ('c0000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', 'owner'),
  ('c0000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000004', 'member'),
  ('d0000000-0000-4000-8000-000000000004', '50000000-0000-4000-8000-000000000005', 'owner');

insert into public.plan_catalog (plan_key, display_name, active)
values ('starter', 'Starter', true);
insert into public.subscriptions (organization_id, plan_key, state)
values ('c0000000-0000-4000-8000-000000000003', 'starter', 'active');
insert into public.subscriptions (organization_id)
values ('d0000000-0000-4000-8000-000000000004');
insert into public.plan_entitlements (plan_key, entitlement_key, enabled, quantity_limit, limit_period)
values ('starter', 'ai.text', true, 20, 'month');
insert into public.organization_feature_flags (organization_id, flag_key, enabled)
values ('c0000000-0000-4000-8000-000000000003', 'feature.email.enabled', true);
insert into public.usage_accounts (
  id, organization_id, usage_key, period_starts_at, period_ends_at, allowance, consumed
)
values (
  '61000000-0000-4000-8000-000000000006',
  'c0000000-0000-4000-8000-000000000003',
  'ai.text', pg_catalog.now() - interval '1 day', pg_catalog.now() + interval '1 day', 20, 1
);

select ok((select relrowsecurity from pg_class where oid = 'public.plan_catalog'::regclass), 'plan catalog has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.plan_entitlements'::regclass), 'plan entitlements have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.subscriptions'::regclass), 'subscriptions have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.feature_flags'::regclass), 'feature flags have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.organization_feature_flags'::regclass), 'organization feature overrides have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.usage_accounts'::regclass), 'usage accounts have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.usage_reservations'::regclass), 'usage reservations have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.usage_ledger_entries'::regclass), 'usage ledger has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.approvals'::regclass), 'approvals have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.provider_request_events'::regclass), 'provider request events have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.operational_alerts'::regclass), 'operational alerts have RLS enabled');

select ok(not has_table_privilege('anon', 'public.approvals', 'select,insert,update,delete'), 'anonymous users have no approval access');
select ok(not has_table_privilege('authenticated', 'public.usage_accounts', 'insert,update,delete'), 'authenticated users cannot change usage balances directly');
select ok(not has_table_privilege('authenticated', 'public.usage_ledger_entries', 'insert,update,delete'), 'authenticated users cannot change the credit ledger directly');
select ok(not has_table_privilege('authenticated', 'public.approvals', 'update,delete'), 'authenticated users must decide approvals through the policy function');
select ok(has_function_privilege('authenticated', 'public.reserve_usage(uuid,text,bigint,text,text)', 'execute'), 'authenticated users can reserve their own organization usage');
select ok(not has_function_privilege('authenticated', 'public.commit_usage_reservation(uuid)', 'execute'), 'authenticated users cannot commit server-managed usage');
select ok(has_function_privilege('service_role', 'public.commit_usage_reservation(uuid)', 'execute'), 'the service role can commit usage after provider acceptance');
select ok(not has_function_privilege('anon', 'public.decide_approval(uuid,text,text)', 'execute'), 'anonymous users cannot decide approvals');

set local role authenticated;
set local request.jwt.claim.sub = '30000000-0000-4000-8000-000000000003';
set local request.jwt.claims = '{"sub":"30000000-0000-4000-8000-000000000003","role":"authenticated","app_metadata":{}}';

select results_eq(
  $$select enabled, quantity_limit from public.resolve_entitlement('c0000000-0000-4000-8000-000000000003', 'ai.text')$$,
  $$values (true, 20::bigint)$$,
  'a member receives the enabled plan entitlement and its configured limit'
);
select results_eq(
  $$select count(*)::bigint from public.resolve_entitlement('d0000000-0000-4000-8000-000000000004', 'ai.text')$$,
  array[0::bigint],
  'a member cannot resolve another organization entitlement'
);
select ok(public.is_feature_enabled('c0000000-0000-4000-8000-000000000003', 'feature.email.enabled'), 'an organization feature override can enable a feature');
select ok(not public.is_feature_enabled('c0000000-0000-4000-8000-000000000003', 'feature.sms.enabled'), 'messaging flags remain disabled by default');
select results_eq(
  'select count(*)::bigint from public.subscriptions',
  array[1::bigint],
  'a user sees only their organization subscription'
);
select results_eq(
  'select count(*)::bigint from public.usage_accounts',
  array[1::bigint],
  'a user sees only their organization usage accounts'
);
select throws_ok(
  $$insert into public.approvals (organization_id, action_key, subject_type, requested_by, correlation_id) values ('d0000000-0000-4000-8000-000000000004', 'advertising.launch', 'campaign', auth.uid(), 'cross-tenant-approval')$$,
  '42501', null,
  'a user cannot request approval in another organization'
);

select lives_ok(
  $$select public.reserve_usage('c0000000-0000-4000-8000-000000000003', 'ai.text', 3, 'reservation-key-0001', 'test-usage-0001')$$,
  'an organization member can reserve usage before provider work begins'
);
select lives_ok(
  $$select public.reserve_usage('c0000000-0000-4000-8000-000000000003', 'ai.text', 3, 'reservation-key-0001', 'test-usage-0001')$$,
  'repeating the same idempotent reservation returns successfully'
);
select throws_ok(
  $$select public.reserve_usage('c0000000-0000-4000-8000-000000000003', 'ai.text', 4, 'reservation-key-0001', 'test-usage-0001')$$,
  '23505', null,
  'an idempotency key cannot be reused for a different quantity'
);
select results_eq(
  $$select reserved, consumed from public.usage_accounts where id = '61000000-0000-4000-8000-000000000006'$$,
  $$values (3::bigint, 1::bigint)$$,
  'idempotent retries count usage only once'
);
select throws_ok(
  $$select public.reserve_usage('c0000000-0000-4000-8000-000000000003', 'ai.text', 17, 'reservation-key-0002', 'test-usage-0002')$$,
  '23514', null,
  'reservations stop before exceeding the configured allowance'
);

insert into public.approvals (
  id, organization_id, action_key, subject_type, requested_by, correlation_id
) values (
  '71000000-0000-4000-8000-000000000007',
  'c0000000-0000-4000-8000-000000000003',
  'advertising.launch', 'campaign', auth.uid(), 'test-approval-0001'
);
set local request.jwt.claim.sub = '40000000-0000-4000-8000-000000000004';
set local request.jwt.claims = '{"sub":"40000000-0000-4000-8000-000000000004","role":"authenticated","app_metadata":{}}';
select throws_ok(
  $$select public.decide_approval('71000000-0000-4000-8000-000000000007', 'approved', null)$$,
  '42501', null,
  'a non-owner organization member cannot approve consequential actions'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '30000000-0000-4000-8000-000000000003';
set local request.jwt.claims = '{"sub":"30000000-0000-4000-8000-000000000003","role":"authenticated","app_metadata":{}}';
select lives_ok(
  $$select public.decide_approval('71000000-0000-4000-8000-000000000007', 'approved', 'Budget verified by owner')$$,
  'an organization owner can approve a consequential action'
);
select results_eq(
  $$select status, decided_by from public.approvals where id = '71000000-0000-4000-8000-000000000007'$$,
  $$values ('approved'::text, '30000000-0000-4000-8000-000000000003'::uuid)$$,
  'the approval decision records the authenticated owner and final state'
);
reset role;

set local role service_role;
set local request.jwt.claim.sub = '';
set local request.jwt.claims = '{"role":"service_role"}';
select lives_ok(
  $$select public.commit_usage_reservation((select id from public.usage_reservations where idempotency_key = 'reservation-key-0001'))$$,
  'the service role can commit a reservation exactly once after accepted work'
);
select lives_ok(
  $$select public.commit_usage_reservation((select id from public.usage_reservations where idempotency_key = 'reservation-key-0001'))$$,
  'committing an already committed reservation is idempotent'
);
select results_eq(
  $$select reserved, consumed from public.usage_accounts where id = '61000000-0000-4000-8000-000000000006'$$,
  $$values (0::bigint, 4::bigint)$$,
  'commit atomically converts reserved units to consumed units'
);
select results_eq(
  $$select count(*)::bigint from public.usage_ledger_entries where reservation_id = (select id from public.usage_reservations where idempotency_key = 'reservation-key-0001') and direction = 'debit'$$,
  array[1::bigint],
  'commit writes a single correlated debit to the usage ledger'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '30000000-0000-4000-8000-000000000003';
set local request.jwt.claims = '{"sub":"30000000-0000-4000-8000-000000000003","role":"authenticated","app_metadata":{}}';
select lives_ok(
  $$select public.reserve_usage('c0000000-0000-4000-8000-000000000003', 'ai.text', 2, 'reservation-key-0003', 'test-usage-0003')$$,
  'an authenticated member can reserve another usage operation'
);
reset role;

set local role service_role;
set local request.jwt.claim.sub = '';
set local request.jwt.claims = '{"role":"service_role"}';
select lives_ok(
  $$select public.release_usage_reservation((select id from public.usage_reservations where idempotency_key = 'reservation-key-0003'))$$,
  'the service role can release usage after a failed operation'
);
select lives_ok(
  $$select public.release_usage_reservation((select id from public.usage_reservations where idempotency_key = 'reservation-key-0003'))$$,
  'releasing an already released reservation is idempotent'
);
select results_eq(
  $$select reserved, consumed from public.usage_accounts where id = '61000000-0000-4000-8000-000000000006'$$,
  $$values (0::bigint, 4::bigint)$$,
  'release frees reserved units without charging consumed usage'
);

select * from finish();
rollback;
