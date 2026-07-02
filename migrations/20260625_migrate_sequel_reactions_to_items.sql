insert into public.conteudos (titulo, descricao, url_video, url_capa, tipo, metadados, visualizacoes, likes, criado_em)
select
  null as titulo,
  case
    when nullif(trim(conteudo.descricao), '') is null then 'Sequel item ' || ordinality
    else trim(conteudo.descricao) || ' - Item ' || ordinality
  end as descricao,
  item ->> 'urlVideo' as url_video,
  nullif(item ->> 'urlCapa', '') as url_capa,
  case
    when coalesce(item ->> 'mediaType', 'video') = 'photo' then 'photo_normal'
    else 'video_normal'
  end as tipo,
  jsonb_build_object(
    'parentSequelId',
    conteudo.id,
    'sequelItemIndex',
    ordinality - 1,
    'hiddenFromFeeds',
    true,
    'source',
    'sequel_item',
    'mediaType',
    coalesce(item ->> 'mediaType', 'video')
  ) as metadados,
  0 as visualizacoes,
  0 as likes,
  conteudo.criado_em
from public.conteudos as conteudo
cross join lateral jsonb_array_elements(coalesce(conteudo.metadados -> 'items', '[]'::jsonb)) with ordinality as sequel_items(item, ordinality)
where conteudo.tipo = 'sequel'
  and coalesce(item ->> 'urlVideo', '') <> ''
  and not exists (
    select 1
    from public.conteudos as child
    where child.metadados @> jsonb_build_object(
      'parentSequelId',
      conteudo.id,
      'sequelItemIndex',
      ordinality - 1
    )
  );

create table if not exists public.sequel_album_like_legacy_backup (
  utilizador_id uuid not null,
  conteudo_id uuid not null,
  criado_em timestamptz not null,
  migrated_at timestamptz not null default now(),
  primary key (utilizador_id, conteudo_id)
);

insert into public.sequel_album_like_legacy_backup (utilizador_id, conteudo_id, criado_em)
select likes.utilizador_id, likes.conteudo_id, likes.criado_em
from public.likes_utilizadores as likes
inner join public.conteudos as conteudo on conteudo.id = likes.conteudo_id
where conteudo.tipo = 'sequel'
on conflict (utilizador_id, conteudo_id) do nothing;

create table if not exists public.sequel_album_playlist_legacy_backup (
  playlist_id uuid not null,
  conteudo_id uuid not null,
  migrated_at timestamptz not null default now(),
  primary key (playlist_id, conteudo_id)
);

insert into public.sequel_album_playlist_legacy_backup (playlist_id, conteudo_id)
select playlist_item.playlist_id, playlist_item.conteudo_id
from public.playlist_conteudos as playlist_item
inner join public.conteudos as conteudo on conteudo.id = playlist_item.conteudo_id
where conteudo.tipo = 'sequel'
on conflict (playlist_id, conteudo_id) do nothing;

delete from public.likes_utilizadores as likes
using public.conteudos as conteudo
where conteudo.id = likes.conteudo_id
  and conteudo.tipo = 'sequel';

delete from public.playlist_conteudos as playlist_item
using public.conteudos as conteudo
where conteudo.id = playlist_item.conteudo_id
  and conteudo.tipo = 'sequel';

update public.conteudos as conteudo
set likes = coalesce((
  select count(*)::integer
  from public.likes_utilizadores as likes
  where likes.conteudo_id = conteudo.id
), 0);
