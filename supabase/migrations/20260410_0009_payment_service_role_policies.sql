-- Ensure webhook processing can manage payment tables via service_role when RLS is enabled.

drop policy if exists "payment_transactions_service_role_manage" on public.payment_transactions;
create policy "payment_transactions_service_role_manage"
on public.payment_transactions
for all
  to service_role
using (true)
with check (true);

drop policy if exists "payment_webhook_events_service_role_manage" on public.payment_webhook_events;
create policy "payment_webhook_events_service_role_manage"
on public.payment_webhook_events
for all
  to service_role
using (true)
with check (true);
