-- ==============================================================================
-- MAHFAZA.CO — GÜVENLİK VE VERİTABANI MİMARİSİ MİGRASYONU
-- 1. IMMUTABLE USERNAME (DEĞİŞTİRİLEMEZ KULLANICI ADI) & FORMAT KISITLAMASI
-- 2. RESERVED USERNAMES (SİLİNEN & REZERVE KULLANICI ADLARI HAVUZU)
-- 3. SUPABASE AUTH + TOTP 2FA & RLS GÜVENLİK POLİTİKALARI
-- ==============================================================================

-- 1. RESERVED USERNAMES TABLOSU
-- Silinen veya sistem tarafından bloke edilmiş kullanıcı adlarını tutar.
CREATE TABLE IF NOT EXISTS public.reserved_usernames (
    username TEXT PRIMARY KEY,
    reason TEXT DEFAULT 'deleted_user',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Sistem tarafından rezerve edilen kritik isimlerin eklenmesi
INSERT INTO public.reserved_usernames (username, reason) VALUES
('admin', 'system_reserved'),
('administrator', 'system_reserved'),
('root', 'system_reserved'),
('system', 'system_reserved'),
('mahfaza', 'brand_reserved'),
('mahfazaco', 'brand_reserved'),
('destek', 'support_reserved'),
('support', 'support_reserved'),
('auth', 'system_reserved'),
('login', 'system_reserved'),
('register', 'system_reserved'),
('coach', 'system_reserved'),
('student', 'system_reserved'),
('parent', 'system_reserved'),
('moderator', 'system_reserved'),
('security', 'system_reserved'),
('official', 'system_reserved'),
('api', 'system_reserved')
ON CONFLICT (username) DO NOTHING;

-- 2. PROFILES TABLOSU GÜNCELLEMELERİ VE SÜTUN KONTROLLERİ
DO $$
BEGIN
    -- username sütunu yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'username') THEN
        ALTER TABLE public.profiles ADD COLUMN username TEXT;
    END IF;

    -- 2FA (TOTP) ve Kurtarma Kodları sütunları
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'two_factor_enabled') THEN
        ALTER TABLE public.profiles ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'backup_codes') THEN
        ALTER TABLE public.profiles ADD COLUMN backup_codes TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
END $$;

-- Var olan kayıtlarda username boş ise email'in kullanıcı kısmından üret
UPDATE public.profiles
SET username = LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-z0-9_]', '_', 'g'))
WHERE username IS NULL OR username = '';

-- Format Kuralı Kısıtlaması: Sadece küçük harf (a-z), rakam (0-9) ve alt çizgi (_) (3-30 karakter)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS valid_username_format;
ALTER TABLE public.profiles ADD CONSTRAINT valid_username_format CHECK (username ~ '^[a-z0-9_]{3,30}$');

-- UNIQUE & INDEX Yapılandırması
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique ON public.profiles (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_profiles_email_idx ON public.profiles (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_reserved_usernames_idx ON public.reserved_usernames (LOWER(username));

-- ==============================================================================
-- 3. TRIGGERS & FUNCTIONS (GÜVENLİK TETİKLEYİCİLERİ)
-- ==============================================================================

-- A) USERNAME IMMUTABILITY TRIGGER (Kullanıcı Adının Değiştirilmesini Engelleme)
-- full_name, avatar_url, bio, phone gibi alanların güncellenmesine İZİN VERİR.
-- Yalnızca OLD.username IS DISTINCT FROM NEW.username durumunda hata fırlatır.
CREATE OR REPLACE FUNCTION public.prevent_username_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.username IS NOT NULL AND OLD.username IS DISTINCT FROM NEW.username THEN
        RAISE EXCEPTION 'Kullanıcı adı (username) bir kez tanımlandıktan sonra kesinlikle değiştirilemez (IMMUTABLE).'
            USING ERRCODE = 'P0001';
    END IF;
    
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_username_update ON public.profiles;
CREATE TRIGGER trg_prevent_username_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_username_update();

-- B) RESERVED USERNAME AVAILABILITY TRIGGER (Yeni Kayıtta Rezerve Kontrolü)
-- Yeni eklenen kullanıcı adının reserved_usernames tablosunda olup olmadığını denetler.
CREATE OR REPLACE FUNCTION public.check_username_availability()
RETURNS TRIGGER AS $$
BEGIN
    NEW.username = LOWER(TRIM(NEW.username));
    
    IF EXISTS (SELECT 1 FROM public.reserved_usernames WHERE username = NEW.username) THEN
        RAISE EXCEPTION 'Bu kullanıcı adı (%s) rezerve edilmiş veya daha önce silinmiş bir hesaba aittir. Tekrar kullanılamaz.', NEW.username
            USING ERRCODE = 'P0002';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_username_availability ON public.profiles;
CREATE TRIGGER trg_check_username_availability
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.check_username_availability();

-- C) ARCHIVE DELETED USERNAME TRIGGER (Hesap Silindiğinde Kullanıcı Adını Rezerveye Alma)
-- Silinen bir kullanıcının kullanıcı adı kalıcı olarak rezerve tablosuna kilitlenir.
CREATE OR REPLACE FUNCTION public.archive_deleted_username()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.username IS NOT NULL AND OLD.username <> '' THEN
        INSERT INTO public.reserved_usernames (username, reason, created_at)
        VALUES (LOWER(OLD.username), 'account_deleted', TIMEZONE('utc'::text, NOW()))
        ON CONFLICT (username) DO NOTHING;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_archive_deleted_username ON public.profiles;
CREATE TRIGGER trg_archive_deleted_username
    AFTER DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.archive_deleted_username();

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserved_usernames ENABLE ROW LEVEL SECURITY;

-- Profilleri authenticated kullanıcılar görebilir
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are readable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Kullanıcı sadece kendi profilini güncelleyebilir (username trigger tarafından korunur)
DROP POLICY IF EXISTS "Users can update own profile only" ON public.profiles;
CREATE POLICY "Users can update own profile only"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Rezerve kullanıcı adları tablosu kontrol için okunabilir
DROP POLICY IF EXISTS "Reserved usernames are readable by all" ON public.reserved_usernames;
CREATE POLICY "Reserved usernames are readable by all"
    ON public.reserved_usernames FOR SELECT
    TO public
    USING (true);

-- ==============================================================================
-- 5. 2FA RECOVERY CODES VERIFICATION RPC (Kurtarma Kodu Doğrulama)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.verify_and_consume_backup_code(p_user_id UUID, p_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_codes TEXT[];
    v_found BOOLEAN := FALSE;
    v_clean_code TEXT := TRIM(p_code);
BEGIN
    SELECT backup_codes INTO v_codes FROM public.profiles WHERE id = p_user_id;
    
    IF v_codes IS NOT NULL AND v_clean_code = ANY(v_codes) THEN
        -- Kodu tüket (array'den çıkar)
        UPDATE public.profiles
        SET backup_codes = ARRAY_REMOVE(backup_codes, v_clean_code),
            updated_at = TIMEZONE('utc'::text, NOW())
        WHERE id = p_user_id;
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
