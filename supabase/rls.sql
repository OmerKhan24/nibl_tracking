-- Helper: get caller's role
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ── profiles ──────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_profiles_all" ON public.profiles
  FOR ALL USING (public.auth_role() = 'super_admin');

CREATE POLICY "mgr_profiles_select" ON public.profiles
  FOR SELECT USING (
    public.auth_role() = 'manager'
    AND (id = auth.uid() OR manager_id = auth.uid())
  );

CREATE POLICY "mgr_update_reps" ON public.profiles
  FOR UPDATE USING (public.auth_role() = 'manager' AND manager_id = auth.uid())
  WITH CHECK  (public.auth_role() = 'manager' AND manager_id = auth.uid());

CREATE POLICY "mgr_update_own" ON public.profiles
  FOR UPDATE USING (public.auth_role() = 'manager' AND id = auth.uid())
  WITH CHECK  (public.auth_role() = 'manager' AND id = auth.uid());

CREATE POLICY "rep_select_own" ON public.profiles
  FOR SELECT USING (public.auth_role() = 'rep' AND id = auth.uid());

CREATE POLICY "rep_update_own" ON public.profiles
  FOR UPDATE USING (public.auth_role() = 'rep' AND id = auth.uid())
  WITH CHECK  (public.auth_role() = 'rep' AND id = auth.uid());

-- ── gps_pings ─────────────────────────────────────────────
ALTER TABLE public.gps_pings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_pings_all" ON public.gps_pings
  FOR ALL USING (public.auth_role() = 'super_admin');

CREATE POLICY "mgr_pings_select" ON public.gps_pings
  FOR SELECT USING (
    public.auth_role() = 'manager'
    AND rep_id IN (SELECT id FROM public.profiles WHERE manager_id = auth.uid())
  );

CREATE POLICY "rep_pings_insert" ON public.gps_pings
  FOR INSERT WITH CHECK (public.auth_role() = 'rep' AND rep_id = auth.uid());

CREATE POLICY "rep_pings_select" ON public.gps_pings
  FOR SELECT USING (public.auth_role() = 'rep' AND rep_id = auth.uid());

-- ── routes ────────────────────────────────────────────────
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_routes_all"    ON public.routes FOR ALL USING (public.auth_role() = 'super_admin');
CREATE POLICY "mgr_routes_select" ON public.routes FOR SELECT USING (
  public.auth_role() = 'manager'
  AND rep_id IN (SELECT id FROM public.profiles WHERE manager_id = auth.uid())
);
CREATE POLICY "rep_routes_all" ON public.routes
  FOR ALL USING (public.auth_role() = 'rep' AND rep_id = auth.uid())
  WITH CHECK   (public.auth_role() = 'rep' AND rep_id = auth.uid());

-- ── stops ─────────────────────────────────────────────────
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_stops_all"     ON public.stops FOR ALL USING (public.auth_role() = 'super_admin');
CREATE POLICY "mgr_stops_select" ON public.stops FOR SELECT USING (
  public.auth_role() = 'manager'
  AND rep_id IN (SELECT id FROM public.profiles WHERE manager_id = auth.uid())
);
CREATE POLICY "rep_stops_all" ON public.stops
  FOR ALL USING (public.auth_role() = 'rep' AND rep_id = auth.uid())
  WITH CHECK   (public.auth_role() = 'rep' AND rep_id = auth.uid());

-- ── daily_summaries ───────────────────────────────────────
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_summaries_all"     ON public.daily_summaries FOR ALL USING (public.auth_role() = 'super_admin');
CREATE POLICY "mgr_summaries_select" ON public.daily_summaries FOR SELECT USING (
  public.auth_role() = 'manager'
  AND rep_id IN (SELECT id FROM public.profiles WHERE manager_id = auth.uid())
);
CREATE POLICY "rep_summaries_all" ON public.daily_summaries
  FOR ALL USING (public.auth_role() = 'rep' AND rep_id = auth.uid())
  WITH CHECK   (public.auth_role() = 'rep' AND rep_id = auth.uid());
