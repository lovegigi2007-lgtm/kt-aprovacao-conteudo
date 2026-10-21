-- Faltava a permissão de apagar comentário no banco (RLS). Sem isso, o
-- botão "apagar" rodava sem erro mas não apagava nada de verdade.
-- Rode no SQL Editor do Supabase.

create policy "autor_ou_admin_apaga_comentario" on comments for delete
  using (
    autor_id = auth.uid()
    or papel_no_projeto((select project_id from contents where contents.id = content_id)) = 'administrador'
  );
