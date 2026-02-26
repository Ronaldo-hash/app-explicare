# Guia de Migração de Banco de Dados (SQL)

Este projeto recebeu atualizações que exigem a execução de scripts SQL no seu painel do Supabase (**SQL Editor**).

Siga a ordem abaixo para garantir que todas as funcionalidades (Designação de Advogados, Status e Histórico) funcionem corretamente.

### 1. Preparação de Perfis e Colunas de Responsável
Este script garante que a tabela de perfis exista e adiciona a possibilidade de designar um advogado responsável por cada processo.
- **Arquivo**: `add_responsible_column.sql`

### 2. Adição do E-mail do Cliente (Vínculo com Portal)
Este script adiciona a coluna `client_email` à tabela `videos_pecas`. Sem isso, o Portal do Cliente não saberá quais processos exibir para o usuário logado.
- **Arquivo**: `add_client_email.sql`

### 3. Configuração do Histórico de Atualizações (Logs)
Este script cria a tabela `process_history` e configura "triggers" automáticos. Isso significa que sempre que um status for alterado, o banco de dados registrará quem mudou e quando, de forma automática.
- **Arquivo**: `add_process_history.sql`

---

### Como Executar:
1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard).
2. Vá na seção **SQL Editor** (último ícone na barra lateral esquerda).
3. Clique em **New Query**.
4. Copie o conteúdo de cada arquivo mencionado acima e clique em **Run**.

> [!IMPORTANT]
> Se o seu banco de dados for novo, certifique-se de ter executado o `setup_database.sql` ou `full_setup_v2.sql` antes de aplicar estas migrações.
