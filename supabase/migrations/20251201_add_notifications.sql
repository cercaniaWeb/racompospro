create table notifications (
  id uuid primary key default gen_random_uuid(),
  type varchar(20) not null,
  title text not null,
  message text not null,
  target_store_id uuid,
  created_at timestamp with time zone default now()
);

-- Enable realtime on the table (default publication is supabase_realtime)
alter publication supabase_realtime add table notifications;
