-- ============================================
-- DADOS DE DEMONSTRAÇÃO - EXPLICARE
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Limpar dados de exemplo anteriores (opcional)
-- DELETE FROM videos_pecas WHERE processo LIKE 'DEMO-%';

-- Inserir processos fictícios para demonstração
INSERT INTO videos_pecas (
    slug,
    processo,
    titulo_peca,
    nome_cliente,
    tipo_acao,
    status_processo,
    video_url,
    pdf_final_url,
    created_at
) VALUES 
(
    'demo-trabalhista-001',
    '0001234-56.2024.5.03.0001',
    'Petição Inicial - Reclamação Trabalhista',
    'João da Silva',
    'Trabalhista',
    'Em Andamento',
    'https://zrssvsfxxtjieoyurzms.supabase.co/storage/v1/object/public/videos/demo/video-trabalhista.mp4',
    'https://zrssvsfxxtjieoyurzms.supabase.co/storage/v1/object/public/pdfs/demo/peticao-trabalhista.pdf',
    NOW() - INTERVAL '2 days'
),
(
    'demo-civil-002',
    '0005678-90.2024.8.13.0024',
    'Contestação - Ação de Cobrança',
    'Maria Oliveira Santos',
    'Cível',
    'Concluído',
    'https://zrssvsfxxtjieoyurzms.supabase.co/storage/v1/object/public/videos/demo/video-civil.mp4',
    'https://zrssvsfxxtjieoyurzms.supabase.co/storage/v1/object/public/pdfs/demo/contestacao-civil.pdf',
    NOW() - INTERVAL '5 days'
),
(
    'demo-familia-003',
    '0009876-54.2024.8.13.0145',
    'Acordo - Divórcio Consensual',
    'Carlos e Ana Ferreira',
    'Família',
    'Concluído',
    'https://zrssvsfxxtjieoyurzms.supabase.co/storage/v1/object/public/videos/demo/video-familia.mp4',
    'https://zrssvsfxxtjieoyurzms.supabase.co/storage/v1/object/public/pdfs/demo/acordo-divorcio.pdf',
    NOW() - INTERVAL '1 week'
);

-- Verificar inserção
SELECT slug, processo, nome_cliente, tipo_acao, status_processo FROM videos_pecas ORDER BY created_at DESC LIMIT 5;
