BEGIN;

CREATE TYPE "membership_role" AS ENUM ('colaborador', 'operacoes', 'admin');

CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "slug" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL
);

CREATE TABLE "memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "tenant_id" UUID NOT NULL REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    "user_id" UUID NOT NULL,
    "role" "membership_role" NOT NULL,
    UNIQUE ("tenant_id", "id"),
    UNIQUE ("tenant_id", "user_id")
);

CREATE TABLE "equipment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "tenant_id" UUID NOT NULL REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    "asset_tag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "details" TEXT,
    "in_maintenance" BOOLEAN NOT NULL DEFAULT false,
    "image_path" TEXT NOT NULL,
    UNIQUE ("tenant_id", "id"),
    UNIQUE ("tenant_id", "asset_tag")
);

CREATE TABLE "loans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "tenant_id" UUID NOT NULL REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    "equipment_id" UUID NOT NULL,
    "borrower_membership_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMPTZ(3) NOT NULL,
    "returned_at" TIMESTAMPTZ(3),
    "returned_by_membership_id" UUID,
    FOREIGN KEY ("tenant_id", "equipment_id")
        REFERENCES "equipment" ("tenant_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY ("tenant_id", "borrower_membership_id")
        REFERENCES "memberships" ("tenant_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY ("tenant_id", "returned_by_membership_id")
        REFERENCES "memberships" ("tenant_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "loans_dates_valid" CHECK (
        "due_at" > "started_at" AND ("returned_at" IS NULL OR "returned_at" >= "started_at")
    ),
    CONSTRAINT "loans_return_fields_paired" CHECK (
        ("returned_at" IS NULL) = ("returned_by_membership_id" IS NULL)
    )
);

CREATE TABLE "audit_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "tenant_id" UUID NOT NULL REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    "actor_membership_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("tenant_id", "actor_membership_id")
        REFERENCES "memberships" ("tenant_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX "memberships_user_id_idx" ON "memberships" ("user_id");
CREATE INDEX "loans_tenant_id_equipment_id_idx" ON "loans" ("tenant_id", "equipment_id");
CREATE INDEX "loans_tenant_id_borrower_membership_id_returned_at_idx"
    ON "loans" ("tenant_id", "borrower_membership_id", "returned_at");
CREATE INDEX "loans_tenant_id_returned_by_membership_id_idx"
    ON "loans" ("tenant_id", "returned_by_membership_id");
CREATE UNIQUE INDEX "loans_one_active_per_equipment"
    ON "loans" ("tenant_id", "equipment_id") WHERE "returned_at" IS NULL;
CREATE INDEX "audit_events_tenant_id_actor_membership_id_idx"
    ON "audit_events" ("tenant_id", "actor_membership_id");
CREATE INDEX "audit_events_tenant_id_created_at_idx" ON "audit_events" ("tenant_id", "created_at");

CREATE SCHEMA "emprestai_private";

-- The application sets both values from the verified session with transaction-local scope.
-- Read membership as the table owner to avoid recursion in the membership policy.
CREATE FUNCTION "emprestai_private"."session_membership"(target_tenant uuid)
RETURNS TABLE (membership_id uuid, membership_role public.membership_role)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
    SELECT m.id, m.role
    FROM public.memberships AS m
    WHERE m.tenant_id = target_tenant
      AND m.tenant_id::text = current_setting('emprestai.tenant_id', true)
      AND m.user_id::text = current_setting('emprestai.user_id', true);
$$;

ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "equipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "loans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_member_read" ON "tenants" FOR SELECT USING (
    EXISTS (SELECT 1 FROM emprestai_private.session_membership(id))
);
CREATE POLICY "memberships_self_or_staff_read" ON "memberships" FOR SELECT USING (
    EXISTS (SELECT 1 FROM emprestai_private.session_membership(tenant_id) AS member
        WHERE member.membership_id = id OR member.membership_role IN ('operacoes', 'admin'))
);
CREATE POLICY "equipment_member_read" ON "equipment" FOR SELECT USING (
    EXISTS (SELECT 1 FROM emprestai_private.session_membership(tenant_id))
);
CREATE POLICY "loans_self_or_staff_read" ON "loans" FOR SELECT USING (
    EXISTS (SELECT 1 FROM emprestai_private.session_membership(tenant_id) AS member
        WHERE member.membership_id = borrower_membership_id OR member.membership_role IN ('operacoes', 'admin'))
);
CREATE POLICY "audit_events_staff_read" ON "audit_events" FOR SELECT USING (
    EXISTS (SELECT 1 FROM emprestai_private.session_membership(tenant_id) AS member
        WHERE member.membership_role IN ('operacoes', 'admin'))
);
CREATE POLICY "audit_events_self_insert" ON "audit_events" FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM emprestai_private.session_membership(tenant_id) AS member
        WHERE member.membership_id = actor_membership_id)
);

CREATE FUNCTION "emprestai_private"."prevent_audit_mutation"()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
    RAISE EXCEPTION 'audit_events is append-only' USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "audit_events_append_only"
BEFORE UPDATE OR DELETE OR TRUNCATE ON "audit_events"
FOR EACH STATEMENT EXECUTE FUNCTION "emprestai_private"."prevent_audit_mutation"();

-- Supabase can grant direct access to new public tables through default privileges.
-- Domain access goes through the application server.
REVOKE ALL ON "tenants", "memberships", "equipment", "loans", "audit_events" FROM PUBLIC;
DO $$
DECLARE
    browser_role text;
BEGIN
    FOR browser_role IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated')
    LOOP
        EXECUTE format(
            'REVOKE ALL ON public.tenants, public.memberships, public.equipment, public.loans, public.audit_events FROM %I',
            browser_role
        );
    END LOOP;
END;
$$;

COMMIT;
