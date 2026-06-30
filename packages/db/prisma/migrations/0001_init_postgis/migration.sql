-- =============================================================================
-- Namma Ride — Initial migration (mirrors the canonical DDL exactly)
-- Generated: Supabase PostgreSQL 15 + PostGIS 3.
-- Run with:  psql "$DATABASE_URL" -f migration.sql
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
-- gen_random_uuid() is provided by pgcrypto (Supabase ships it by default).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------------ users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'kn',
    role VARCHAR(20) NOT NULL CHECK (role IN ('rider', 'driver', 'admin')),
    fcm_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------- drivers
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT FALSE,
    duty_status VARCHAR(20) DEFAULT 'offline' CHECK (duty_status IN ('offline', 'online', 'busy')),
    rating DECIMAL(3, 2) DEFAULT 5.0,
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    is_kyc_verified BOOLEAN DEFAULT FALSE,
    current_lat DECIMAL(9, 6),
    current_lng DECIMAL(9, 6),
    location_geog GEOGRAPHY(Point, 4326),
    last_ping_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------- vehicles
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('auto', 'mini', 'sedan', 'suv')),
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    model_name VARCHAR(50) NOT NULL,
    insurance_expiry DATE NOT NULL,
    rc_file_url TEXT NOT NULL
);

-- ------------------------------------------------------------------------ rides
CREATE TABLE rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES drivers(id) ON DELETE RESTRICT,
    status VARCHAR(30) DEFAULT 'requested' CHECK (status IN ('requested','accepted','arrived','picked_up','completed','cancelled')),
    pickup_address TEXT NOT NULL,
    pickup_landmark VARCHAR(100),
    pickup_location GEOGRAPHY(Point, 4326) NOT NULL,
    drop_address TEXT NOT NULL,
    drop_location GEOGRAPHY(Point, 4326) NOT NULL,
    fare_amount DECIMAL(10, 2) NOT NULL,
    distance_km DECIMAL(6, 2) NOT NULL,
    estimated_duration_mins INT NOT NULL,
    otp_code VARCHAR(4) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash','upi_direct','wallet')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending','completed','failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- --------------------------------------------------------------- ride_locations
CREATE TABLE ride_locations (
    id BIGSERIAL PRIMARY KEY,
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    coordinate GEOGRAPHY(Point, 4326) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------- driver_kyc
CREATE TABLE driver_kyc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    aadhar_number VARCHAR(12) UNIQUE NOT NULL,
    aadhar_front_url TEXT NOT NULL,
    aadhar_back_url TEXT NOT NULL,
    license_number VARCHAR(20) UNIQUE NOT NULL,
    license_front_url TEXT NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending','approved','rejected')),
    rejection_reason TEXT,
    verified_at TIMESTAMP WITH TIME ZONE
);

-- ------------------------------------------------------------- driver_wallets
CREATE TABLE driver_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------- wallet_transactions
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES driver_wallets(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('credit','debit')),
    description TEXT,
    reference_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------- surge_zones
CREATE TABLE surge_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_name VARCHAR(50) NOT NULL,
    zone_name VARCHAR(100) NOT NULL,
    boundary GEOMETRY(Polygon, 4326) NOT NULL,
    multiplier DECIMAL(3, 2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------- scheduled_bookings
CREATE TABLE scheduled_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pickup_address TEXT NOT NULL,
    pickup_location GEOGRAPHY(Point, 4326) NOT NULL,
    drop_address TEXT NOT NULL,
    drop_location GEOGRAPHY(Point, 4326) NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','dispatched','failed','cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------- support_tickets
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL,
    issue_description TEXT NOT NULL,
    ai_urgency VARCHAR(15) DEFAULT 'normal' CHECK (ai_urgency IN ('normal','high','sos')),
    ai_classification VARCHAR(100),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------- reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------- system_audit_logs
CREATE TABLE system_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------- updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_driver_wallets_updated_at
    BEFORE UPDATE ON driver_wallets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------- auto-populate location_geog
-- Keeps drivers.location_geog in sync with current_lat/current_lng so the
-- GIST index over location_geog is always queryable by the matching pipeline.
CREATE OR REPLACE FUNCTION sync_driver_geog()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_lat IS NOT NULL AND NEW.current_lng IS NOT NULL THEN
        NEW.location_geog := ST_SetSRID(ST_MakePoint(NEW.current_lng, NEW.current_lat), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_drivers_sync_geog
    BEFORE INSERT OR UPDATE OF current_lat, current_lng ON drivers
    FOR EACH ROW EXECUTE FUNCTION sync_driver_geog();

-- ----------------------------------------------------------------------- indexes
CREATE INDEX idx_drivers_location ON drivers USING gist(location_geog);
CREATE INDEX idx_rides_pickup ON rides USING gist(pickup_location);
CREATE INDEX idx_surge_boundary ON surge_zones USING gist(boundary);
CREATE INDEX idx_drivers_duty ON drivers(duty_status, is_kyc_verified);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_ride_locations_ride ON ride_locations(ride_id, recorded_at);
CREATE INDEX idx_wallet_tx_wallet ON wallet_transactions(wallet_id, created_at DESC);
CREATE INDEX idx_support_urgency ON support_tickets(ai_urgency, status);
