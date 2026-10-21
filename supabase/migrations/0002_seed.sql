-- Dados de exemplo (seed) da Kruger Toledo Consultoria.
-- Rode DEPOIS do 0001_init.sql, também no SQL Editor do Supabase.

insert into projects (nome, slug, bio, tema, redes_ativas, regra_aprovacao, metas_frequencia)
values (
  'Kruger Toledo Consultoria',
  'kruger-toledo-consultoria',
  'Consultoria técnica agronômica · laudos para o produtor rural',
  '{
    "principal": "#0B3D23",
    "apoio": "#39812C",
    "destaque": "#97CC0E",
    "fundo": "#F5EFE3",
    "texto": "#1F2A24",
    "terra": "#A8742A",
    "fonteTitulo": "Archivo",
    "fonteTexto": "Lato"
  }'::jsonb,
  array['instagram']::rede_social[],
  'um_aprovador',
  '{"instagram": {"feed_por_semana": 3, "stories_por_dia": 1}}'::jsonb
);

insert into tags (project_id, nome, cor)
select projects.id, t.nome, t.cor from projects, (values
  ('Educação', '#39812C'),
  ('Raio-X da Lavoura', '#0B3D23'),
  ('Laudo de frustração', '#A8742A'),
  ('Serviços', '#97CC0E')
) as t(nome, cor)
where projects.slug = 'kruger-toledo-consultoria';

insert into checklist_items (project_id, texto, ordem)
select projects.id, c.texto, c.ordem from projects, (values
  ('Fala só de técnica? Sem menção à advocacia nem CTA jurídico?', 1),
  ('Livre de promessa de resultado?', 2),
  ('Linguagem que o produtor entende, com os termos técnicos explicados?', 3),
  ('Dados com data e fonte, e regras (MP, CMN, prazos) conferidas?', 4),
  ('Caso real autorizado e anonimizado?', 5),
  ('CTA para o WhatsApp?', 6),
  ('Imagem real da região, dentro da identidade visual?', 7),
  ('Nome e registro do responsável técnico quando o post falar de laudo?', 8)
) as c(texto, ordem)
where projects.slug = 'kruger-toledo-consultoria';
