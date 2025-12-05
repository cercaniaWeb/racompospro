create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default now()
);

-- Enable realtime on the table if needed
alter publication supabase_realtime add table push_subscriptions;
