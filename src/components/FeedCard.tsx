import type { ContentRecord } from '../../shared/types'
import { proxiedMediaUrl } from '@/utils/media'

type FeedCardProps = {
  item: ContentRecord
}

export default function FeedCard({ item }: FeedCardProps) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(item.url_video)
  const typeLabel = 'standard media'
  const mediaUrl = proxiedMediaUrl(item.url_video)
  const posterUrl = proxiedMediaUrl(item.url_capa)

  return (
    <article className="border border-zinc-800 bg-zinc-950 p-3">
      <div className="border border-zinc-800 bg-black p-2">
        {isImage ? (
          <img src={mediaUrl} alt={item.descricao || 'splashwet content'} className="aspect-[9/16] w-full object-cover" />
        ) : (
          <video
            src={mediaUrl}
            poster={posterUrl}
            controls
            preload="metadata"
            className="aspect-[9/16] w-full bg-black object-cover"
          />
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.28em] text-[#00fff7]">{typeLabel}</p>
          <p className="mt-2 text-sm font-black tracking-[0.08em] text-white">
            {item.descricao || 'no description'}
          </p>
        </div>

        <div className="text-right text-[11px] tracking-[0.08em] text-zinc-500">
          <p>{item.visualizacoes} views</p>
          <p>{item.likes} likes</p>
        </div>
      </div>
    </article>
  )
}
