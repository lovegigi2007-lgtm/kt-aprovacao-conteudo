-- Campos extras na ideia (tipo e formato, pra saber em qual subpasta do
-- Drive a pasta do conteúdo deve cair) e link da pasta da leva de criativos.
-- Rode no SQL Editor do Supabase, depois do 0006.

alter table ideas add column if not exists tipo tipo_conteudo default 'conteudo';
alter table ideas add column if not exists formato formato_conteudo;
alter table batches add column if not exists drive_folder_url text;
