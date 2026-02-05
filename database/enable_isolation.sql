-- Add user_id column to track ownership
ALTER TABLE public.videos_pecas 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing records to belong to the currently logged in user (optional, or leave null)
-- UPDATE public.videos_pecas SET user_id = auth.uid() WHERE user_id IS NULL;

-- Enable RLS (already enabled, but good to ensure)
ALTER TABLE public.videos_pecas ENABLE ROW LEVEL SECURITY;

-- DROP existing policies to replace them with user-specific ones
DROP POLICY IF EXISTS "Ver tudo equipe" ON public.videos_pecas;
DROP POLICY IF EXISTS "Inserir tudo equipe" ON public.videos_pecas;
DROP POLICY IF EXISTS "Editar tudo equipe" ON public.videos_pecas;
DROP POLICY IF EXISTS "Deletar tudo equipe" ON public.videos_pecas;

-- Create new policies for ISOLATION (User sees only their own)

-- SELECT: Users can only see rows where user_id matches their ID
CREATE POLICY "Ver apenas meus processos"
ON public.videos_pecas
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Users can insert, and we force user_id to be their ID
CREATE POLICY "Inserir meus processos"
ON public.videos_pecas
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own rows
CREATE POLICY "Editar apenas meus processos"
ON public.videos_pecas
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- DELETE: Users can only delete their own rows
CREATE POLICY "Deletar apenas meus processos"
ON public.videos_pecas
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Keep the PUBLIC policy for clients (view via slug)
-- (Already exists: "Ver publico anonimo")
