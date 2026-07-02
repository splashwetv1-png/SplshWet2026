alter table public.conteudos
  drop constraint if exists conteudos_tipo_check;

alter table public.conteudos
  add constraint conteudos_tipo_check
  check (tipo in ('video_normal', 'photo_normal', 'sequel'));
