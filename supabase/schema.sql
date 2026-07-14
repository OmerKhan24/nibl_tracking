-- ============================================================
-- NIBL Foods Field Sales Tracker — Database Schema
-- Run this first in Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

-- ── profiles ──────────────────────────────────────────────
CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL,
  role        text NOT NULL CHECK (role IN ('super_admin','manager','rep')),
  manager_id  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-create a profile stub when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Profile rows are inserted explicitly by server API routes.
  -- This trigger is intentionally a no-op; the API route creates
  -- the profile immediately after auth.admin.createUser().
  RETURN NEW;
END;
$$;

-- ── gps_pings ─────────────────────────────────────────────
CREATE TABLE public.gps_pings (
  id           bigserial PRIMARY KEY,
  rep_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lat          double precision NOT NULL,
  lng          double precision NOT NULL,
  accuracy_m   real,
  recorded_at  timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX gps_pings_rep_time_idx ON public.gps_pings (rep_id, recorded_at DESC);
CREATE INDEX gps_pings_time_idx     ON public.gps_pings (recorded_at DESC);

-- ── routes ────────────────────────────────────────────────
CREATE TABLE public.routes (
  id               bigserial PRIMARY KEY,
  rep_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date             date NOT NULL,
  waypoints        jsonb NOT NULL DEFAULT '[]',   -- [{lat,lng,label,address}] optimized order
  osrm_geometry    text,                           -- ORS encoded polyline
  total_distance_m integer,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rep_id, date)
);

CREATE INDEX routes_rep_date_idx ON public.routes (rep_id, date DESC);

-- ── stops ─────────────────────────────────────────────────
CREATE TABLE public.stops (
  id               bigserial PRIMARY KEY,
  rep_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  route_id         bigint REFERENCES public.routes(id) ON DELETE SET NULL,
  label            text NOT NULL,
  lat              double precision NOT NULL,
  lng              double precision NOT NULL,
  arrived_at       timestamptz NOT NULL,
  departed_at      timestamptz,
  duration_seconds integer
);

CREATE INDEX stops_rep_arrived_idx ON public.stops (rep_id, arrived_at DESC);

-- ── daily_summaries ───────────────────────────────────────
CREATE TABLE public.daily_summaries (
  rep_id                uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date                  date NOT NULL,
  total_distance_m      integer NOT NULL DEFAULT 0,
  total_active_seconds  integer NOT NULL DEFAULT 0,
  stops_completed       integer NOT NULL DEFAULT 0,
  PRIMARY KEY (rep_id, date)
);

-- ── Realtime publication ──────────────────────────────────
-- Enable Realtime for gps_pings so manager dashboard gets live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.gps_pings;
