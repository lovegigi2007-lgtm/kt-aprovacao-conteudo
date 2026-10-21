-- Guarda a conexão com o Google Drive (um token por projeto) e o link da
-- pasta raiz onde as pastas de cada conteúdo/ideia vão ser criadas.
-- Rode no SQL Editor do Supabase.

create table google_drive_connections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade unique,
  access_token text not null,
  refresh_token text not null,
  expira_em timestamptz not null,
  pasta_raiz_id text, -- ID da pasta no Drive onde tudo é criado dentro
  conectado_por uuid references auth.users(id),
  criado_em timestamptz not null default now()
);

alter table google_drive_connections enable row level security;

create policy "admin_ve_conexao_drive" on google_drive_connections for select
  using (papel_no_projeto(project_id) = 'administrador');
create policy "admin_gerencia_conexao_drive" on google_drive_connections for all
  using (papel_no_projeto(project_id) = 'administrador');

-- Ideias também passam a poder ter uma pasta no Drive, desde a fase de ideia.
alter table ideas add column if not exists drive_folder_url text;
