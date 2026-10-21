-- Configura o armazenamento de arquivos (fotos e vídeos dos conteúdos).
-- Rode no SQL Editor do Supabase, depois do 0001 e 0002.

insert into storage.buckets (id, name, public)
values ('content-assets', 'content-assets', false)
on conflict (id) do nothing;

-- Os arquivos são guardados com o caminho: <project_id>/<content_id>/<arquivo>
-- Então dá pra checar se a pessoa é membro do projeto olhando o primeiro
-- pedaço do caminho.

create policy "membros_veem_arquivos_do_projeto"
on storage.objects for select
using (
  bucket_id = 'content-assets'
  and e_membro_do_projeto((storage.foldername(name))[1]::uuid)
);

create policy "editor_envia_arquivos"
on storage.objects for insert
with check (
  bucket_id = 'content-assets'
  and papel_no_projeto((storage.foldername(name))[1]::uuid) in ('administrador', 'editor')
);

create policy "editor_substitui_arquivos"
on storage.objects for update
using (
  bucket_id = 'content-assets'
  and papel_no_projeto((storage.foldername(name))[1]::uuid) in ('administrador', 'editor')
);

create policy "editor_apaga_arquivos"
on storage.objects for delete
using (
  bucket_id = 'content-assets'
  and papel_no_projeto((storage.foldername(name))[1]::uuid) in ('administrador', 'editor')
);
