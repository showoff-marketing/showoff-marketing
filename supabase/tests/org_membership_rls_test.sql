BEGIN;
select plan(30);

insert into auth.users (id, email)
values
  ('10000000-0000-4000-8000-000000000001', 'owner-a@example.test'),
  ('20000000-0000-4000-8000-000000000002', 'owner-b@example.test');

insert into public.organizations (id, name, created_by)
values
  ('a0000000-0000-4000-8000-000000000001', 'Organization A', '10000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000002', 'Organization B', '20000000-0000-4000-8000-000000000002');

insert into public.organization_memberships (organization_id, user_id, role)
values
  ('a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'owner'),
  ('b0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'owner');

insert into public.audit_events (organization_id, actor_id, action, entity_type, correlation_id)
values
  ('a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'organization.created', 'organization', 'test-org-a'),
  ('b0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'organization.created', 'organization', 'test-org-b');

insert into public.contacts (id, organization_id, email)
values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'contact-a@example.test'),
  ('d0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'contact-b@example.test');

insert into public.lead_forms (id, organization_id, name)
values
  ('f0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Form A'),
  ('e0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'Form B');

insert into public.leads (id, organization_id, contact_id, lead_form_id)
values
  ('a1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001'),
  ('b1000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000002');

insert into public.background_jobs (organization_id, kind, correlation_id)
values
  ('a0000000-0000-4000-8000-000000000001', 'test.job', 'test-job-a'),
  ('b0000000-0000-4000-8000-000000000002', 'test.job', 'test-job-b');

select ok((select relrowsecurity from pg_class where oid = 'public.organizations'::regclass), 'organizations has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.organization_memberships'::regclass), 'organization_memberships has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.audit_events'::regclass), 'audit_events has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.contacts'::regclass), 'contacts has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.lead_forms'::regclass), 'lead_forms has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.leads'::regclass), 'leads has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.background_jobs'::regclass), 'background_jobs has RLS enabled');

select ok(not has_table_privilege('anon', 'public.organizations', 'select'), 'anon has no organization table access');
select ok(has_table_privilege('authenticated', 'public.organizations', 'select,insert,update'), 'authenticated has only the declared organization operations');
select ok(not has_table_privilege('authenticated', 'public.organization_memberships', 'update'), 'memberships cannot be changed directly by authenticated clients');
select ok(not has_table_privilege('anon', 'public.contacts', 'select,insert,update,delete'), 'anon has no lead or contact table access');
select ok(has_table_privilege('service_role', 'public.background_jobs', 'select,insert,update,delete'), 'server-only service role can operate background jobs');
select ok(not has_function_privilege('anon', 'public.has_platform_admin_access()', 'execute'), 'anonymous users cannot check admin access');
select ok(has_function_privilege('authenticated', 'public.has_platform_admin_access()', 'execute'), 'signed-in users can request the server-side admin check');

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';

set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000001","app_metadata":{"permissions":["platform_admin"]}}';
select ok(public.has_platform_admin_access(), 'the signed app_metadata platform_admin permission is accepted');
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000001","app_metadata":{},"user_metadata":{"permissions":["platform_admin"]}}';
select ok(not public.has_platform_admin_access(), 'user-editable metadata cannot grant admin access');

select results_eq(
  'select count(*)::bigint from public.organizations',
  array[1::bigint],
  'a user sees only organizations where they are a member'
);
select results_eq(
  $$select count(*)::bigint from public.organization_memberships where organization_id = 'b0000000-0000-4000-8000-000000000002'$$,
  array[0::bigint],
  'a user cannot read another organization membership'
);
select results_eq(
  $$select count(*)::bigint from public.audit_events where organization_id = 'b0000000-0000-4000-8000-000000000002'$$,
  array[0::bigint],
  'a user cannot read another organization audit events'
);
select results_eq(
  'select count(*)::bigint from public.contacts',
  array[1::bigint],
  'a user sees only contacts in their organization'
);
select results_eq(
  'select count(*)::bigint from public.lead_forms',
  array[1::bigint],
  'a user sees only lead forms in their organization'
);
select results_eq(
  'select count(*)::bigint from public.leads',
  array[1::bigint],
  'a user sees only leads in their organization'
);
select results_eq(
  'select count(*)::bigint from public.background_jobs',
  array[1::bigint],
  'a user sees only background jobs in their organization'
);
select throws_ok(
  $$insert into public.organizations (name, created_by) values ('Impersonated', '20000000-0000-4000-8000-000000000002')$$,
  '42501',
  null,
  'a user cannot create an organization for another account'
);
select throws_ok(
  $$insert into public.organization_memberships (organization_id, user_id, role) values ('b0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'owner')$$,
  '42501',
  null,
  'a user cannot add themselves to another organization'
);
select throws_ok(
  $$insert into public.contacts (organization_id, email) values ('b0000000-0000-4000-8000-000000000002', 'cross-tenant@example.test')$$,
  '42501',
  null,
  'a user cannot create a contact in another organization'
);
select throws_ok(
  $$insert into public.background_jobs (organization_id, kind, correlation_id) values ('a0000000-0000-4000-8000-000000000001', 'client.job', 'not-allowed')$$,
  '42501',
  null,
  'authenticated clients cannot create server-managed jobs directly'
);
select lives_ok(
  $$select public.create_organization('Organization C')$$,
  'an authenticated user can create an organization with an owner membership atomically'
);
select results_eq(
  $$select count(*)::bigint from public.organization_memberships membership join public.organizations organization_row on organization_row.id = membership.organization_id where organization_row.name = 'Organization C' and membership.user_id = auth.uid() and membership.role = 'owner'$$,
  array[1::bigint],
  'organization creation assigns the creator as owner'
);
select throws_ok(
  $$insert into public.audit_events (organization_id, actor_id, action, entity_type, correlation_id) values ('b0000000-0000-4000-8000-000000000002', auth.uid(), 'test.denied', 'organization', 'test-cross-tenant')$$,
  '42501',
  null,
  'a user cannot write audit events to another organization'
);

SELECT * FROM finish();
ROLLBACK;
