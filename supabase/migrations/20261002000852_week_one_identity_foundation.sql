create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_memberships (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_memberships_user_id_idx
  on public.organization_memberships (user_id, organization_id);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  correlation_id text not null,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object')
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text,
  phone text,
  first_name text,
  last_name text,
  email_consent boolean not null default false,
  sms_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, email)
);

create table public.lead_forms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id)
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  contact_id uuid not null,
  lead_form_id uuid,
  created_at timestamptz not null default now(),
  foreign key (organization_id, contact_id)
    references public.contacts (organization_id, id) on delete cascade,
  foreign key (organization_id, lead_form_id)
    references public.lead_forms (organization_id, id) on delete set null (lead_form_id),
  unique (organization_id, id)
);

create index contacts_organization_created_at_idx
  on public.contacts (organization_id, created_at desc);

create index leads_organization_created_at_idx
  on public.leads (organization_id, created_at desc);

create table public.background_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind text not null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  input jsonb not null default '{}'::jsonb check (jsonb_typeof(input) = 'object'),
  result jsonb check (result is null or jsonb_typeof(result) = 'object'),
  error_code text,
  correlation_id text not null,
  attempt integer not null default 0 check (attempt >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index background_jobs_organization_status_created_at_idx
  on public.background_jobs (organization_id, status, created_at);

create index audit_events_organization_occurred_at_idx
  on public.audit_events (organization_id, occurred_at desc);

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.audit_events enable row level security;
alter table public.contacts enable row level security;
alter table public.lead_forms enable row level security;
alter table public.leads enable row level security;
alter table public.background_jobs enable row level security;

revoke all on table public.organizations from public, anon, authenticated;
revoke all on table public.organization_memberships from public, anon, authenticated;
revoke all on table public.audit_events from public, anon, authenticated;
revoke all on table public.contacts from public, anon, authenticated;
revoke all on table public.lead_forms from public, anon, authenticated;
revoke all on table public.leads from public, anon, authenticated;
revoke all on table public.background_jobs from public, anon, authenticated;

grant select, insert, update on table public.organizations to authenticated;
grant select, insert on table public.organization_memberships to authenticated;
grant select, insert on table public.audit_events to authenticated;
grant select, insert, update, delete on table public.contacts to authenticated;
grant select, insert, update, delete on table public.lead_forms to authenticated;
grant select, insert, update, delete on table public.leads to authenticated;
grant select on table public.background_jobs to authenticated;

grant select, insert, update, delete on table public.organizations to service_role;
grant select, insert, update, delete on table public.organization_memberships to service_role;
grant select, insert on table public.audit_events to service_role;
grant select, insert, update, delete on table public.contacts to service_role;
grant select, insert, update, delete on table public.lead_forms to service_role;
grant select, insert, update, delete on table public.leads to service_role;
grant select, insert, update, delete on table public.background_jobs to service_role;

create policy "organization members can read their organizations"
  on public.organizations for select
  to authenticated
  using (
    created_by = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships membership
      where membership.organization_id = organizations.id
        and membership.user_id = (select auth.uid())
    )
  );

create policy "users can create organizations for themselves"
  on public.organizations for insert
  to authenticated
  with check (created_by = (select auth.uid()));

create policy "organization owners can update their organizations"
  on public.organizations for update
  to authenticated
  using (
    exists (
      select 1
      from public.organization_memberships membership
      where membership.organization_id = organizations.id
        and membership.user_id = (select auth.uid())
        and membership.role = 'owner'
    )
  )
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1
      from public.organization_memberships membership
      where membership.organization_id = organizations.id
        and membership.user_id = (select auth.uid())
        and membership.role = 'owner'
    )
  );

create policy "users can read their own organization memberships"
  on public.organization_memberships for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "organization creators can add their initial owner membership"
  on public.organization_memberships for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and role = 'owner'
    and exists (
      select 1
      from public.organizations organization_row
      where organization_row.id = organization_memberships.organization_id
        and organization_row.created_by = (select auth.uid())
    )
  );

create policy "organization members can read audit events"
  on public.audit_events for select
  to authenticated
  using (
    organization_id is not null
    and exists (
      select 1
      from public.organization_memberships membership
      where membership.organization_id = audit_events.organization_id
        and membership.user_id = (select auth.uid())
    )
  );

create policy "organization members can add their own audit events"
  on public.audit_events for insert
  to authenticated
  with check (
    actor_id = (select auth.uid())
    and organization_id is not null
    and exists (
      select 1
      from public.organization_memberships membership
      where membership.organization_id = audit_events.organization_id
        and membership.user_id = (select auth.uid())
    )
  );

create policy "organization members can read contacts"
  on public.contacts for select to authenticated
  using (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = contacts.organization_id
      and membership.user_id = (select auth.uid())
  ));

create policy "organization members can create contacts"
  on public.contacts for insert to authenticated
  with check (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = contacts.organization_id
      and membership.user_id = (select auth.uid())
  ));

create policy "organization members can update contacts"
  on public.contacts for update to authenticated
  using (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = contacts.organization_id
      and membership.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = contacts.organization_id
      and membership.user_id = (select auth.uid())
  ));

create policy "organization members can delete contacts"
  on public.contacts for delete to authenticated
  using (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = contacts.organization_id
      and membership.user_id = (select auth.uid())
  ));

create policy "organization members can read lead forms"
  on public.lead_forms for select to authenticated
  using (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = lead_forms.organization_id
      and membership.user_id = (select auth.uid())
  ));

create policy "organization members can create lead forms"
  on public.lead_forms for insert to authenticated
  with check (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = lead_forms.organization_id
      and membership.user_id = (select auth.uid())
  ));

create policy "organization members can update lead forms"
  on public.lead_forms for update to authenticated
  using (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = lead_forms.organization_id
      and membership.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = lead_forms.organization_id
      and membership.user_id = (select auth.uid())
  ));

create policy "organization members can delete lead forms"
  on public.lead_forms for delete to authenticated
  using (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = lead_forms.organization_id
      and membership.user_id = (select auth.uid())
  ));

create policy "organization members can read leads"
  on public.leads for select to authenticated
  using (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = leads.organization_id
      and membership.user_id = (select auth.uid())
  ));

create policy "organization members can create leads"
  on public.leads for insert to authenticated
  with check (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = leads.organization_id
      and membership.user_id = (select auth.uid())
  ));

create policy "organization members can update leads"
  on public.leads for update to authenticated
  using (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = leads.organization_id
      and membership.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = leads.organization_id
      and membership.user_id = (select auth.uid())
  ));

create policy "organization members can delete leads"
  on public.leads for delete to authenticated
  using (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = leads.organization_id
      and membership.user_id = (select auth.uid())
  ));

create policy "organization members can read background jobs"
  on public.background_jobs for select to authenticated
  using (exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = background_jobs.organization_id
      and membership.user_id = (select auth.uid())
  ));

create function public.create_organization(organization_name text)
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

  return new_organization_id;
end;
$$;

revoke all on function public.create_organization(text) from public, anon, authenticated;
grant execute on function public.create_organization(text) to authenticated;

create function public.has_platform_admin_access()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select auth.uid() is not null
    and coalesce(
      (auth.jwt() -> 'app_metadata' -> 'permissions') ? 'platform_admin',
      false
    );
$$;

revoke all on function public.has_platform_admin_access() from public, anon, authenticated;
grant execute on function public.has_platform_admin_access() to authenticated;
