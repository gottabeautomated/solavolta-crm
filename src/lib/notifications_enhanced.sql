-- Enhance notifications table for Inbox + Snooze
alter table public.notifications add column if not exists priority text not null default 'normal' check (priority in ('low','normal','high','critical'));
alter table public.notifications add column if not exists action_data_json jsonb not null default '{}'::jsonb;
alter table public.notifications add column if not exists snoozed_until timestamptz;
alter table public.notifications add column if not exists category text not null default 'general';
alter table public.notifications add column if not exists archived_at timestamptz;

create index if not exists idx_notifications_user_tenant on public.notifications(user_id, tenant_id);
create index if not exists idx_notifications_snoozed_until on public.notifications(snoozed_until);
create index if not exists idx_notifications_category on public.notifications(category);
create index if not exists idx_notifications_archived on public.notifications(archived_at);

-- Function to archive old notifications (>30 days)
create or replace function public.archive_old_notifications()
returns integer language plpgsql security definer as $$
declare v_count integer; begin
  update public.notifications n set archived_at = now()
  where n.archived_at is null and n.created_at < now() - interval '30 days';
  get diagnostics v_count = row_count;
  return v_count;
end; $$;

-- Note: schedule this via Supabase Scheduled Jobs to run daily:
-- select cron.schedule('archive-notifications-daily', '0 3 * * *', $$select public.archive_old_notifications();$$);


