-- ==============================================================================
-- MIGRATION: DYNAMIC LAWYER ASSIGNMENT
-- Run this in Supabase SQL Editor
-- ==============================================================================

-- 1. Criar tabela 'profiles' para listar advogados/usuários
-- Isso é necessário porque não podemos listar 'auth.users' diretamente no frontend
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user', -- 'admin', 'member', 'user'
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS (Segurança)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (ignora se já existirem)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone') THEN
    CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- 3. Trigger para criar perfil automaticamente ao cadastrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove a trigger se já existir para recriar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Adicionar coluna 'responsible_id' na tabela de processos
ALTER TABLE videos_pecas 
ADD COLUMN IF NOT EXISTS responsible_id UUID REFERENCES public.profiles(id);

-- 5. (Opcional) Popular profiles com usuários existentes
-- ATENÇÃO: Isso pode falhar se você não tiver permissão de ler auth.users aqui.
-- Se falhar, os usuários antigos não aparecerão na lista até logarem ou serem recriados.
INSERT INTO public.profiles (id, email, role)
SELECT id, email, raw_user_meta_data->>'role'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
