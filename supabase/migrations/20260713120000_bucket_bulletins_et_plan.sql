-- 1) Bucket Storage des PDF de bulletins (créé à la main en prod le 13/07 —
--    cette migration le rend reproductible sur tout environnement neuf).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bulletins', 'bulletins', true, 5242880, array['application/pdf'])
on conflict (id) do nothing;

-- 2) Plan des organisations : vocabulaire unifié (standard | premium).
--    Historique : le défaut était 'starter' et le commentaire parlait de 'pro'.
update organisations set plan = 'standard' where plan is null or plan not in ('standard', 'premium', 'pro');
update organisations set plan = 'premium' where plan = 'pro';
alter table organisations alter column plan set default 'standard';
alter table organisations drop constraint if exists organisations_plan_check;
alter table organisations add constraint organisations_plan_check
  check (plan in ('standard', 'premium'));
