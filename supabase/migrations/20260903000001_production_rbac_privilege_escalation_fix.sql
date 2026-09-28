-- ==============================================================================
-- MAHFAZA.CO — PRODUCTION RBAC & PRIVILEGE ESCALATION HARDENING
-- 1. SECURE HANDLE_NEW_USER TRIGGER (PREVENTS CLIENT METADATA PRIVILEGE ESCALATION)
-- 2. ROLE IMMUTABILITY VIA CLIENT UPDATE (PREVENT ROLE ESCALATION VIA PROFILES UPDATE)
-- 3. MESSAGES REALTIME & ISOLATION POLICIES
-- ==============================================================================

-- 1. SECURE AUTH.USERS -> PUBLIC.PROFILES PROVISIONING TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_raw_role TEXT;
    v_assigned_role public.user_role := 'student'::public.user_role;
    v_raw_username TEXT;
    v_sanitized_username TEXT;
    v_clean_email TEXT;
    v_name TEXT;
    v_phone TEXT;
BEGIN
    v_clean_email := LOWER(TRIM(COALESCE(NEW.email, '')));
    v_raw_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', 'student')));
    v_name := TRIM(COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(v_clean_email, '@', 1)));
    v_phone := TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', ''));

    -- PREVENT PRIVILEGE ESCALATION:
    -- 'admin' and 'org_admin' cannot be provisioned via client-supplied raw_user_meta_data
    -- unless it is the verified system founder or admin email
    IF v_clean_email = 'mahfaza.co@gmail.com' OR v_clean_email = 'yonetim@mahfaza.co' THEN
        v_assigned_role := 'admin'::public.user_role;
    ELSIF v_clean_email = 'serkankocak551@gmail.com' THEN
        v_assigned_role := 'coach'::public.user_role;
    ELSIF v_raw_role = 'coach' AND (NEW.raw_user_meta_data->>'institutionKey' = 'mahfaza' OR NEW.raw_user_meta_data->>'institution_key' = 'mahfaza') THEN
        v_assigned_role := 'coach'::public.user_role;
    ELSIF v_raw_role = 'parent' THEN
        v_assigned_role := 'parent'::public.user_role;
    ELSE
        -- Default strictly to student for all public signups
        v_assigned_role := 'student'::public.user_role;
    END IF;

    -- Username sanitization
    v_raw_username := LOWER(REGEXP_REPLACE(SPLIT_PART(v_clean_email, '@', 1), '[^a-z0-9_]', '_', 'g'));
    IF LENGTH(v_raw_username) < 3 THEN
        v_raw_username := v_raw_username || '_user';
    END IF;
    v_sanitized_username := SUBSTRING(v_raw_username FROM 1 FOR 30);

    -- Insert profile safely if not exists
    INSERT INTO public.profiles (
        id,
        user_id,
        email,
        name,
        username,
        role,
        phone,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.id,
        v_clean_email,
        v_name,
        v_sanitized_username,
        v_assigned_role,
        NULLIF(v_phone, ''),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-bind trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 2. PREVENT ROLE AND PRIVILEGE ESCALATION VIA DIRECT PROFILES UPDATE
-- Users should never be able to change their role from 'student' to 'admin' or 'coach' via client UPDATE
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- If role is changing, only allow if executed by service_role or admin
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        -- Allow founders/admin
        IF OLD.email = 'mahfaza.co@gmail.com' OR OLD.email = 'yonetim@mahfaza.co' THEN
            -- allowed
            NULL;
        ELSIF auth.jwt()->>'role' != 'service_role' AND (auth.jwt()->>'email' != 'mahfaza.co@gmail.com' AND auth.jwt()->>'email' != 'yonetim@mahfaza.co') THEN
            RAISE EXCEPTION 'Kullanıcı rolü istemci tarafından doğrudan değiştirilemez.'
                USING ERRCODE = 'P0003';
        END IF;
    END IF;

    -- Also prevent tampering with is_founder
    IF OLD.is_founder IS DISTINCT FROM NEW.is_founder AND auth.jwt()->>'role' != 'service_role' THEN
        RAISE EXCEPTION 'Yetki seviyesi değiştirilemez.'
            USING ERRCODE = 'P0004';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_role_escalation();

-- ==============================================================================
-- 3. 2FA BACKUP CODES ISOLATION & SECURE ACCESS
-- Prevent any authenticated user from reading another user's backup_codes via SELECT *
-- ==============================================================================

-- Revoke direct column SELECT on backup_codes from general roles
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'backup_codes') THEN
        REVOKE SELECT (backup_codes) ON public.profiles FROM authenticated;
        REVOKE SELECT (backup_codes) ON public.profiles FROM anon;
        REVOKE SELECT (backup_codes) ON public.profiles FROM public;
    END IF;
END $$;

-- Secure function to retrieve only the caller's own backup codes
CREATE OR REPLACE FUNCTION public.get_my_backup_codes()
RETURNS TEXT[] AS $$
DECLARE
    v_codes TEXT[];
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN ARRAY[]::TEXT[];
    END IF;
    SELECT backup_codes INTO v_codes FROM public.profiles WHERE id = auth.uid();
    RETURN COALESCE(v_codes, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure 2FA verification RPC with caller verification (Prevents IDOR on backup codes)
CREATE OR REPLACE FUNCTION public.verify_and_consume_backup_code(p_user_id UUID, p_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_codes TEXT[];
    v_clean_code TEXT := TRIM(p_code);
BEGIN
    -- Check caller authentication: caller must be verifying their own code or be service_role
    IF auth.jwt()->>'role' != 'service_role' AND auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Yetkisiz kurtarma kodu doğrulama isteği.'
            USING ERRCODE = '42501';
    END IF;

    SELECT backup_codes INTO v_codes FROM public.profiles WHERE id = p_user_id;
    
    IF v_codes IS NOT NULL AND v_clean_code = ANY(v_codes) THEN
        UPDATE public.profiles
        SET backup_codes = ARRAY_REMOVE(backup_codes, v_clean_code),
            updated_at = TIMEZONE('utc'::text, NOW())
        WHERE id = p_user_id;
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 4. MESSAGES TABLE CREATION & RLS POLICIES (ISOLATION & IDOR PROTECTION)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL DEFAULT 'student',
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    attachment_url TEXT,
    attachment_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Users can only read messages where they are sender or receiver
DROP POLICY IF EXISTS "Users can read own messages" ON public.messages;
CREATE POLICY "Users can read own messages"
    ON public.messages FOR SELECT
    TO authenticated
    USING (
        sender_id = auth.uid()::text 
        OR receiver_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.students s
            WHERE (s.user_id = auth.uid() OR s.id::text = auth.uid()::text)
              AND (s.id::text = messages.sender_id OR s.id::text = messages.receiver_id)
        )
        OR EXISTS (
            SELECT 1 FROM public.parent_student_links psl
            JOIN public.students s ON s.id = psl.student_id
            WHERE psl.parent_id = auth.uid()
              AND (s.id::text = messages.sender_id OR s.id::text = messages.receiver_id OR s.user_id::text = messages.sender_id OR s.user_id::text = messages.receiver_id)
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.is_founder = true)
        )
    );

-- 2. INSERT: Users can only send messages as themselves
DROP POLICY IF EXISTS "Users can send messages as self" ON public.messages;
CREATE POLICY "Users can send messages as self"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.user_id = auth.uid() AND s.id::text = messages.sender_id
        )
    );

-- 3. UPDATE: Receiver can mark messages as read
DROP POLICY IF EXISTS "Receiver can mark messages as read" ON public.messages;
CREATE POLICY "Receiver can mark messages as read"
    ON public.messages FOR UPDATE
    TO authenticated
    USING (
        receiver_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.user_id = auth.uid() AND s.id::text = messages.receiver_id
        )
    )
    WITH CHECK (
        receiver_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.user_id = auth.uid() AND s.id::text = messages.receiver_id
        )
    );

-- 4. DELETE: Sender can delete their own message
DROP POLICY IF EXISTS "Sender can delete own message" ON public.messages;
CREATE POLICY "Sender can delete own message"
    ON public.messages FOR DELETE
    TO authenticated
    USING (
        sender_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.is_founder = true)
        )
    );

-- Enable Supabase Realtime for messages if publication exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Table already added or publication handled
    NULL;
END $$;

