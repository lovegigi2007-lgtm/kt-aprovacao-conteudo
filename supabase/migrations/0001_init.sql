-- Esquema inicial do sistema de calendário e aprovação de conteúdo.
-- Rode isso no SQL Editor do Supabase (Project > SQL Editor > New query).

create extension if not exists "pgcrypto";

-- ===== Tipos =====
create type papel_projeto as enum ('administrador', 'editor', 'aprovador', 'leitor');
create type status_conteudo as enum ('rascunho', 'em_aprovacao', 'reprovado', 'aprovado', 'publicado');
create type rede_social as enum ('instagram', 'linkedin', 'tiktok');
create type formato_conteudo as enum ('estatico', 'reels', 'carrossel', 'story');
create type tipo_conteudo as enum ('conteudo', 'criativo');
create type decisao_aprovacao as enum ('aprovado', 'reprovado');
create type regra_aprovacao as enum ('um_aprovador', 'todos_aprovadores');

-- ===== Perfis (espelha auth.users com nome e foto) =====
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  foto_url text,
  criado_em timestamptz not null default now()
);

-- ===== Projetos (marcas/clientes) =====
create table projects (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  logo_url text,
  foto_perfil_url text,
  bio text,
  tema jsonb not null default '{}'::jsonb,
  redes_ativas rede_social[] not null default array['instagram']::rede_social[],
  regra_aprovacao regra_aprovacao not null default 'um_aprovador',
  metas_frequencia jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

create table project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  papel papel_projeto not null default 'leitor',
  criado_em timestamptz not null default now(),
  unique (project_id, user_id)
);

-- ===== Etiquetas opcionais por projeto =====
create table tags (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  nome text not null,
  cor text not null default '#39812C'
);

-- ===== Ideias de conteúdo =====
create table ideas (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  titulo text not null,
  link text,
  nota text,
  autor_id uuid references auth.users(id),
  convertida_em_conteudo_id uuid,
  criado_em timestamptz not null default now()
);

-- ===== Levas de criativos =====
create table batches (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  nome text not null,
  mes_referencia date not null,
  data_aprovacao date,
  criado_em timestamptz not null default now()
);

create table batch_folders (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references batches(id) on delete cascade,
  nome text not null,
  pasta_mae_id uuid references batch_folders(id) on delete cascade,
  ordem int not null default 0
);

-- ===== Conteúdos =====
create table contents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  titulo text not null,
  data_hora timestamptz not null,
  rede rede_social not null,
  formato formato_conteudo not null,
  tipo tipo_conteudo not null default 'conteudo',
  status status_conteudo not null default 'rascunho',
  legenda text,
  objetivo text,
  cta text,
  roteiro text,
  copy_link text,
  responsavel_id uuid references auth.users(id),
  link_publicado text,
  batch_id uuid references batches(id) on delete set null,
  batch_folder_id uuid references batch_folders(id) on delete set null,
  drive_folder_url text,
  posicao int not null default 0,
  publico_segmentacao text,
  periodo_veiculacao text,
  titulo_anuncio text,
  idea_id uuid references ideas(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table content_tags (
  content_id uuid not null references contents(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (content_id, tag_id)
);

-- ===== Arquivos =====
create table assets (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents(id) on delete cascade,
  tipo text not null, -- imagem | video | pdf
  caminho_storage text not null,
  versao int not null default 1,
  versao_atual boolean not null default true,
  ordem int not null default 0,
  e_capa boolean not null default false,
  largura int,
  altura int,
  duracao_segundos numeric,
  miniatura_url text,
  enviado_por uuid references auth.users(id),
  criado_em timestamptz not null default now()
);

-- ===== Aprovações =====
create table approvals (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents(id) on delete cascade,
  aprovador_id uuid not null references auth.users(id),
  decisao decisao_aprovacao not null,
  comentario text,
  versao_avaliada int,
  criado_em timestamptz not null default now()
);

-- ===== Comentários =====
create table comments (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents(id) on delete cascade,
  autor_id uuid not null references auth.users(id),
  texto text not null,
  slide int,
  criado_em timestamptz not null default now()
);

-- ===== Histórico =====
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents(id) on delete cascade,
  autor_id uuid references auth.users(id),
  tipo_evento text not null,
  detalhes jsonb default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

-- ===== Notificações =====
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  link text,
  lida boolean not null default false,
  criado_em timestamptz not null default now()
);

-- ===== Checklist por projeto =====
create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  texto text not null,
  ordem int not null default 0
);

create table checklist_responses (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents(id) on delete cascade,
  checklist_item_id uuid not null references checklist_items(id) on delete cascade,
  marcado boolean not null default false,
  unique (content_id, checklist_item_id)
);

-- ===== Função auxiliar: papel do usuário no projeto =====
create or replace function papel_no_projeto(p_project_id uuid)
returns papel_projeto
language sql
security definer
stable
as $$
  select papel from project_members
  where project_id = p_project_id and user_id = auth.uid()
  limit 1;
$$;

create or replace function e_membro_do_projeto(p_project_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from project_members
    where project_id = p_project_id and user_id = auth.uid()
  );
$$;

-- ===== RLS =====
alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table tags enable row level security;
alter table ideas enable row level security;
alter table batches enable row level security;
alter table batch_folders enable row level security;
alter table contents enable row level security;
alter table content_tags enable row level security;
alter table assets enable row level security;
alter table approvals enable row level security;
alter table comments enable row level security;
alter table activity_log enable row level security;
alter table notifications enable row level security;
alter table checklist_items enable row level security;
alter table checklist_responses enable row level security;

create policy "ver_o_proprio_perfil" on profiles for select using (id = auth.uid());
create policy "editar_o_proprio_perfil" on profiles for update using (id = auth.uid());

create policy "ver_projetos_que_participa" on projects for select
  using (e_membro_do_projeto(id));
create policy "admin_edita_projeto" on projects for update
  using (papel_no_projeto(id) = 'administrador');

create policy "ver_membros_do_proprio_projeto" on project_members for select
  using (e_membro_do_projeto(project_id));
create policy "admin_gerencia_membros" on project_members for all
  using (papel_no_projeto(project_id) = 'administrador');

create policy "ver_tags_do_projeto" on tags for select using (e_membro_do_projeto(project_id));
create policy "editor_gerencia_tags" on tags for all
  using (papel_no_projeto(project_id) in ('administrador', 'editor'));

create policy "ver_ideias_do_projeto" on ideas for select using (e_membro_do_projeto(project_id));
create policy "membros_criam_ideias" on ideas for insert
  with check (e_membro_do_projeto(project_id));
create policy "editor_gerencia_ideias" on ideas for update
  using (papel_no_projeto(project_id) in ('administrador', 'editor'));
create policy "editor_apaga_ideias" on ideas for delete
  using (papel_no_projeto(project_id) in ('administrador', 'editor'));

create policy "ver_levas_do_projeto" on batches for select using (e_membro_do_projeto(project_id));
create policy "editor_gerencia_levas" on batches for all
  using (papel_no_projeto(project_id) in ('administrador', 'editor'));

create policy "ver_subpastas_da_leva" on batch_folders for select
  using (e_membro_do_projeto((select project_id from batches where batches.id = batch_id)));
create policy "editor_gerencia_subpastas" on batch_folders for all
  using (papel_no_projeto((select project_id from batches where batches.id = batch_id)) in ('administrador', 'editor'));

create policy "ver_conteudos_do_projeto" on contents for select using (e_membro_do_projeto(project_id));
create policy "editor_cria_conteudo" on contents for insert
  with check (papel_no_projeto(project_id) in ('administrador', 'editor'));
create policy "editor_edita_conteudo" on contents for update
  using (papel_no_projeto(project_id) in ('administrador', 'editor'));
create policy "admin_apaga_conteudo" on contents for delete
  using (papel_no_projeto(project_id) = 'administrador');

create policy "ver_content_tags" on content_tags for select
  using (e_membro_do_projeto((select project_id from contents where contents.id = content_id)));
create policy "editor_gerencia_content_tags" on content_tags for all
  using (papel_no_projeto((select project_id from contents where contents.id = content_id)) in ('administrador', 'editor'));

create policy "ver_assets_do_conteudo" on assets for select
  using (e_membro_do_projeto((select project_id from contents where contents.id = content_id)));
create policy "editor_gerencia_assets" on assets for all
  using (papel_no_projeto((select project_id from contents where contents.id = content_id)) in ('administrador', 'editor'));

create policy "ver_aprovacoes_do_conteudo" on approvals for select
  using (e_membro_do_projeto((select project_id from contents where contents.id = content_id)));
create policy "aprovador_registra_decisao" on approvals for insert
  with check (papel_no_projeto((select project_id from contents where contents.id = content_id)) in ('administrador', 'aprovador'));

create policy "ver_comentarios_do_conteudo" on comments for select
  using (e_membro_do_projeto((select project_id from contents where contents.id = content_id)));
create policy "membros_comentam" on comments for insert
  with check (e_membro_do_projeto((select project_id from contents where contents.id = content_id)));

create policy "ver_historico_do_conteudo" on activity_log for select
  using (e_membro_do_projeto((select project_id from contents where contents.id = content_id)));

create policy "ver_proprias_notificacoes" on notifications for select using (user_id = auth.uid());
create policy "marcar_proprias_notificacoes" on notifications for update using (user_id = auth.uid());

create policy "ver_checklist_do_projeto" on checklist_items for select using (e_membro_do_projeto(project_id));
create policy "admin_gerencia_checklist" on checklist_items for all
  using (papel_no_projeto(project_id) = 'administrador');

create policy "ver_respostas_checklist" on checklist_responses for select
  using (e_membro_do_projeto((select project_id from contents where contents.id = content_id)));
create policy "editor_responde_checklist" on checklist_responses for all
  using (papel_no_projeto((select project_id from contents where contents.id = content_id)) in ('administrador', 'editor'));

-- ===== Perfil criado automaticamente ao cadastrar usuário =====
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
