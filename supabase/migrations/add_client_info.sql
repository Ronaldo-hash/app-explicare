-- Migração para adicionar informações do cliente aos processos
-- Execute este SQL no SQL Editor do Supabase (https://app.supabase.com)

-- Adiciona novos campos para informações do cliente
ALTER TABLE videos_pecas 
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS client_address TEXT,
ADD COLUMN IF NOT EXISTS client_notes TEXT;

-- Cria índice para busca por email
CREATE INDEX IF NOT EXISTS idx_videos_pecas_client_email ON videos_pecas(client_email);

-- Comentários para documentação
COMMENT ON COLUMN videos_pecas.client_email IS 'Email de contato do cliente';
COMMENT ON COLUMN videos_pecas.client_phone IS 'Telefone de contato do cliente';
COMMENT ON COLUMN videos_pecas.client_address IS 'Endereço do cliente';
COMMENT ON COLUMN videos_pecas.client_notes IS 'Anotações sobre o cliente/processo';
