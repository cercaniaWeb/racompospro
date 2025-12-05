create table if not exists public.reminders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  store_id uuid references public.stores(id) not null,
  title text not null,
  message text,
  due_date timestamp with time zone not null,
  is_completed boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.reminders enable row level security;

-- Policies
create policy "Users can view their own reminders"
  on public.reminders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own reminders"
  on public.reminders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reminders"
  on public.reminders for update
  using (auth.uid() = user_id);

create policy "Users can delete their own reminders"
  on public.reminders for delete
  using (auth.uid() = user_id);
