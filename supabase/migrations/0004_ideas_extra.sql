-- Adiciona o link da copy/roteiro nas ideias de conteúdo.
-- Rode no SQL Editor do Supabase, depois dos arquivos anteriores.

alter table ideas add column if not exists copy_link text;
