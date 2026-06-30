-- =============================================================================
-- Supabase Schema for Namma Ride Monorepo
-- =============================================================================

-- Enable PostGIS extension for geospatial mapping (point geography)
create extension if not exists postgis;
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('rider', 'driver', 'admin');
create type public.duty_status as enum ('offline', 'online', 'busy');
create type public.vehicle_type as enum ('auto', 'mini', 'sedan', 'suv');
create type public.ride_status as enum ('requested', 'accepted', 'arrived', 'picked_up', 'completed', 'cancelled');

-- -----------------------------------------------------------------------------
-- 2. Tables
-- -----------------------------------------------------------------------------

-- public.users (Linked directly to Supabase Auth)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  phone_number text unique not null,
  full_name text not null,
  role public.user_role not null default 'rider',
  fcm_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- public.drivers (Driver profiles linked to users)
create table public.drivers (
  id uuid references public.users(id) on delete cascade primary key,
  is_active boolean not null default false,
  duty_status public.duty_status not null default 'offline',
  rating numeric(3,2) not null default 5.00,
  vehicle_type public.vehicle_type not null default 'auto',
  license_plate text unique not null,
  is_kyc_verified boolean not null default false,
  last_ping_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- public.rides (Ride bookings and status tracker)
create table public.rides (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.users(id) on delete restrict,
  driver_id uuid references public.drivers(id) on delete restrict,
  status public.ride_status not null default 'requested',
  pickup_address text not null,
  pickup_location geography(Point, 4326) not null,
  drop_address text not null,
  drop_location geography(Point, 4326) not null,
  fare_amount numeric(10,2) not null,
  distance_km numeric(6,2) not null,
  otp_code text not null,
  payment_method text not null default 'cash', -- cash, upi_direct, wallet
  payment_status text not null default 'pending', -- pending, completed, failed
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

-- public.locations (Live telemetry / tracking for real-time operations)
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null, -- references user_id or driver_id or ride_id
  coordinate geography(Point, 4326) not null,
  heading numeric(5,2),
  speed numeric(5,2),
  recorded_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. Indexes for Query Performance
-- -----------------------------------------------------------------------------
create index idx_drivers_duty on public.drivers(duty_status, is_active);
create index idx_rides_status on public.rides(status);
create index idx_locations_entity on public.locations(entity_id, recorded_at desc);

-- Spatial GIST indexes for coordinates
create index idx_rides_pickup_geom on public.rides using gist(pickup_location);
create index idx_rides_drop_geom on public.rides using gist(drop_location);
create index idx_locations_geom on public.locations using gist(coordinate);

-- -----------------------------------------------------------------------------
-- 4. Triggers to Automate updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_current_timestamp_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_users_updated_at
  before update on public.users
  for each row execute procedure public.set_current_timestamp_updated_at();

create trigger set_drivers_updated_at
  before update on public.drivers
  for each row execute procedure public.set_current_timestamp_updated_at();

create trigger set_rides_updated_at
  before update on public.rides
  for each row execute procedure public.set_current_timestamp_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Trigger to automatically sync auth.users with public.users
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, phone_number, full_name, role)
  values (
    new.id,
    coalesce(new.phone, ''),
    coalesce(new.raw_user_meta_data->>'full_name', 'Namma User'),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'rider'::public.user_role)
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger to automatically create driver profile in public.drivers when role is driver
create or replace function public.handle_new_driver()
returns trigger as $$
begin
  if new.role = 'driver'::public.user_role then
    insert into public.drivers (id, license_plate, vehicle_type)
    values (new.id, 'TEMP-' || substring(new.id::text, 1, 8), 'auto'::public.vehicle_type)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_public_user_created_driver
  after insert on public.users
  for each row execute procedure public.handle_new_driver();

-- -----------------------------------------------------------------------------
-- 6. Enable Realtime Publications
-- -----------------------------------------------------------------------------
-- Enable realtime updates on public.rides and public.locations tables
alter publication supabase_realtime add table public.rides;
alter publication supabase_realtime add table public.locations;

