-- ============================================================================== 
-- SCRIPT COMPLETO DE CONFIGURAÇÃO - WHITE LABEL (NOVA INSTÂNCIA)
-- ============================================================================== 
-- Copie todo o conteúdo abaixo e execute no SQL Editor do Supabase.
-- Isso vai criar todas as tabelas, colunas, buckets e permissões necessárias.
-- ============================================================================== 

-- 1. TABELA DE PROCESSOS (VIDEOS)
CREATE TABLE IF NOT EXISTS public.videos_pecas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    titulo_peca TEXT NOT NULL,
    video_url TEXT NOT NULL,
    access_password TEXT,
    views BIGINT DEFAULT 0,
    slug TEXT NOT NULL UNIQUE,
    processo TEXT,          -- Adicionado para busca
    pdf_final_url TEXT      -- Adicionado para PDF
);

ALTER TABLE public.videos_pecas ENABLE ROW LEVEL SECURITY;

-- Limpeza de políticas antigas (caso existam)
DROP POLICY IF EXISTS "Ver tudo" ON public.videos_pecas;
DROP POLICY IF EXISTS "Inserir tudo" ON public.videos_pecas;
DROP POLICY IF EXISTS "Editar tudo" ON public.videos_pecas;
DROP POLICY IF EXISTS "Deletar tudo" ON public.videos_pecas;
DROP POLICY IF EXISTS "Ver tudo publico" ON public.videos_pecas;

-- Políticas
CREATE POLICY "Ver tudo equipe" ON public.videos_pecas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Inserir tudo equipe" ON public.videos_pecas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Editar tudo equipe" ON public.videos_pecas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Deletar tudo equipe" ON public.videos_pecas FOR DELETE TO authenticated USING (true);

-- Permitir que clientes (anon) busquem processos pelo slug
CREATE POLICY "Ver publico anonimo" ON public.videos_pecas FOR SELECT TO anon USING (true);


-- 2. TABELA DE LOGS (TRACKING)
CREATE TABLE IF NOT EXISTS public.view_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_slug TEXT NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ip TEXT,
    location TEXT,
    device TEXT
);

ALTER TABLE public.view_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert logs" ON public.view_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow team select logs" ON public.view_logs FOR SELECT TO authenticated USING (true);


-- 3. TABELA DE PERFIS (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "Public profiles viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own" ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- 4. BUCKETS DE STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('videos-final-v3', 'videos-final-v3', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('pecas-final-v3', 'pecas-final-v3', true) ON CONFLICT (id) DO NOTHING;

-- Policies de Storage
DROP POLICY IF EXISTS "Videos Public Access" ON storage.objects;
CREATE POLICY "Videos Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'videos-final-v3' );

DROP POLICY IF EXISTS "Videos Auth Upload" ON storage.objects;
CREATE POLICY "Videos Auth Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'videos-final-v3' );

DROP POLICY IF EXISTS "PDFs Public Access" ON storage.objects;
CREATE POLICY "PDFs Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'pecas-final-v3' );

DROP POLICY IF EXISTS "PDFs Auth Upload" ON storage.objects;
CREATE POLICY "PDFs Auth Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'pecas-final-v3' );
