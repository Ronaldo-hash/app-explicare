-- ============================================================
-- WHITELABEL CONFIG TABLE + ASSETS BUCKET
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Criar tabela de configuração whitelabel
CREATE TABLE IF NOT EXISTS public.whitelabel_config (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Singleton: only 1 row
    company_name TEXT DEFAULT 'Tecnologia & Estratégia Jurídica',
    logo_url TEXT,
    background_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir registro padrão (se não existir)
INSERT INTO public.whitelabel_config (id, company_name)
VALUES (1, 'Tecnologia & Estratégia Jurídica')
ON CONFLICT (id) DO NOTHING;

-- RLS: permitir leitura pública + escrita por autenticados
ALTER TABLE public.whitelabel_config ENABLE ROW LEVEL SECURITY;

-- Todos podem ler (a config é pública para login page, etc.)
CREATE POLICY "Anyone can read whitelabel config"
    ON public.whitelabel_config
    FOR SELECT
    USING (true);

-- Apenas autenticados podem atualizar
CREATE POLICY "Authenticated can update whitelabel config"
    ON public.whitelabel_config
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Apenas autenticados podem inserir (upsert)
CREATE POLICY "Authenticated can insert whitelabel config"
    ON public.whitelabel_config
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 2. Criar bucket 'assets' para uploads de logo/background
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'assets',
    'assets',
    true,
    5242880, -- 5 MB max
    ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas do bucket: leitura pública, upload por autenticados
CREATE POLICY "Public can view asset files"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'assets');

CREATE POLICY "Authenticated can upload assets"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update assets"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete assets"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'assets' AND auth.role() = 'authenticated');
