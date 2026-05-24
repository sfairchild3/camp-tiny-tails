-- ─────────────────────────────────────────────────────
-- CAMP TINY TAILS — SUPABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ─────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  phone text,
  emergency_contact text,
  emergency_phone text,
  created_at timestamp with time zone default now()
);

-- Dogs table
create table dogs (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references profiles(id) on delete cascade,
  name text not null,
  breed text,
  weight numeric,
  age numeric,
  vet_name text,
  vet_phone text,
  vaccinated boolean default false,
  spayed_neutered boolean default false,
  special_needs text,
  created_at timestamp with time zone default now()
);

-- Blocked dates (your vacation etc)
create table blocked_dates (
  id uuid default uuid_generate_v4() primary key,
  date date not null unique,
  reason text,
  created_at timestamp with time zone default now()
);

-- Bookings table
create table bookings (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references profiles(id) on delete cascade,
  dog_id uuid references dogs(id),
  check_in date not null,
  check_out date not null,
  nights integer not null,
  nightly_rate numeric default 70,
  discount_applied boolean default false,
  subtotal numeric not null,
  deposit_amount numeric default 50,
  deposit_paid boolean default false,
  stripe_payment_intent_id text,
  status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamp with time zone default now()
);

-- ─────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table dogs enable row level security;
alter table bookings enable row level security;
alter table blocked_dates enable row level security;

-- Profiles
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Dogs
create policy "Users can manage own dogs"
  on dogs for all using (auth.uid() = owner_id);

-- Bookings
create policy "Users can view own bookings"
  on bookings for select using (auth.uid() = client_id);
create policy "Users can create bookings"
  on bookings for insert with check (auth.uid() = client_id);
create policy "Users can cancel own bookings"
  on bookings for update using (auth.uid() = client_id);

-- Blocked dates: anyone can read
create policy "Anyone can view blocked dates"
  on blocked_dates for select using (true);

-- ─────────────────────────────────────────────────────
-- AUTO-CREATE PROFILE ON SIGNUP
-- ─────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
