-- ============================================================================
-- SHOW TIME — verification for the event-sharing migration
-- Run AFTER 20260603_event_sharing.sql. Each query should return rows.
-- ============================================================================

-- 1) Table exists (expect 1 row: 'shared_events')
select table_name
from information_schema.tables
where table_schema = 'public' and table_name = 'shared_events';

-- 1b) Columns exist (expect: id, sender_user_id, recipient_user_id,
--     original_event_id, shared_event_data, poster_image_path, status, created_at)
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'shared_events'
order by ordinal_position;

-- 2) RPC exists (expect 1 row with args
--    "p_recipient_email text, p_event_data jsonb, p_poster_path text, p_original_event_id uuid")
select proname,
       pg_get_function_identity_arguments(oid) as args,
       prosecdef as is_security_definer
from pg_proc
where proname = 'share_event_with_user';

-- 3) Table policies exist (expect 4: select / insert / update / delete)
select policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'shared_events'
order by policyname;

-- 3b) Storage policy for recipient poster access (expect 1 row)
select policyname, cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname = 'event_photos_storage_select_shared';

-- 3c) RLS is enabled on the table (expect relrowsecurity = true)
select relname, relrowsecurity
from pg_class
where relname = 'shared_events';
