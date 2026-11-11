BEGIN;

CREATE TABLE "login_rate_limits" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "attempts" INTEGER NOT NULL CHECK ("attempts" > 0)
);
CREATE INDEX "login_rate_limits_expires_at_idx" ON "login_rate_limits" ("expires_at");
ALTER TABLE "login_rate_limits" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "login_rate_limits" FROM PUBLIC;
DO $$
DECLARE
    browser_role text;
BEGIN
    FOR browser_role IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated')
    LOOP
        EXECUTE format('REVOKE ALL ON public.login_rate_limits FROM %I', browser_role);
    END LOOP;
END;
$$;

COMMIT;
