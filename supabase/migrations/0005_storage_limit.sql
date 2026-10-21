-- Aumenta o limite de tamanho de arquivo do bucket para o máximo do plano gratuito (50MB).
-- Rode no SQL Editor do Supabase.

update storage.buckets
set file_size_limit = 52428800 -- 50MB em bytes
where id = 'content-assets';
