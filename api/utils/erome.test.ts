import { describe, expect, it } from 'vitest'
import { keepVideoItems, normalizeAlbumPayload } from './erome.js'

describe('normalizeAlbumPayload', () => {
  it('extracts media from nested API payloads', () => {
    const payload = {
      response: {
        media: [
          {
            id: 'abc',
            download_url: 'https://cdn.example.com/video.mp4',
            thumbnail: 'https://cdn.example.com/thumb.jpg',
            width: '1080',
            height: 1920,
          },
        ],
      },
    }

    expect(normalizeAlbumPayload(payload)).toEqual([
      {
        sourceUrl: 'https://cdn.example.com/video.mp4',
        coverUrl: 'https://cdn.example.com/thumb.jpg',
        mediaType: 'video',
        width: 1080,
        height: 1920,
        providerId: 'abc',
      },
    ])
  })

  it('detects image payloads by extension when type is absent', () => {
    const payload = [
      {
        src: 'https://cdn.example.com/photo.jpg',
      },
    ]

    expect(normalizeAlbumPayload(payload)[0]?.mediaType).toBe('photo')
  })

  it('extracts every media entry from album containers', () => {
    const payload = {
      data: [
        {
          url: 'https://www.erome.com/a/example-album',
          media: [
            {
              id: 'first',
              download_url: 'https://cdn.example.com/first.mp4',
              thumbnail: 'https://cdn.example.com/first.jpg',
            },
            {
              id: 'second',
              download_url: 'https://cdn.example.com/second.mp4',
              thumbnail: 'https://cdn.example.com/second.jpg',
            },
          ],
        },
      ],
    }

    expect(normalizeAlbumPayload(payload)).toEqual([
      {
        sourceUrl: 'https://cdn.example.com/first.mp4',
        coverUrl: 'https://cdn.example.com/first.jpg',
        mediaType: 'video',
        width: null,
        height: null,
        providerId: 'first',
      },
      {
        sourceUrl: 'https://cdn.example.com/second.mp4',
        coverUrl: 'https://cdn.example.com/second.jpg',
        mediaType: 'video',
        width: null,
        height: null,
        providerId: 'second',
      },
    ])
  })

  it('prefers direct media urls over album urls', () => {
    const payload = [
      {
        id: 'direct',
        url: 'https://www.erome.com/a/example-album',
        download_url: 'https://cdn.example.com/direct-video.mp4',
        thumbnail: 'https://cdn.example.com/direct-thumb.jpg',
      },
    ]

    expect(normalizeAlbumPayload(payload)).toEqual([
      {
        sourceUrl: 'https://cdn.example.com/direct-video.mp4',
        coverUrl: 'https://cdn.example.com/direct-thumb.jpg',
        mediaType: 'video',
        width: null,
        height: null,
        providerId: 'direct',
      },
    ])
  })

  it('extracts post content items from the provider posts payload', () => {
    const payload = {
      posts: [
        {
          status: 'success',
          link: 'https://www.erome.com/a/Me5vkR0b',
          thumbnail: 'https://s56.erome.com/3825/Me5vkR0b/oN32mSkD.jpeg?v=1775709255',
          content: [
            {
              type: 'image',
              url: 'https://s56.erome.com/3825/Me5vkR0b/oN32mSkD.jpeg?v=1775709255',
              thumbnail: 'https://s56.erome.com/3825/Me5vkR0b/oN32mSkD.jpeg?v=1775709255',
            },
            {
              type: 'video',
              url: 'https://v56.erome.com/3825/Me5vkR0b/esLcr6Vd_720p.mp4',
              thumbnail: 'https://s56.erome.com/3825/Me5vkR0b/esLcr6Vd.jpg',
            },
          ],
        },
      ],
    }

    expect(normalizeAlbumPayload(payload)).toEqual([
      {
        sourceUrl: 'https://s56.erome.com/3825/Me5vkR0b/oN32mSkD.jpeg?v=1775709255',
        coverUrl: 'https://s56.erome.com/3825/Me5vkR0b/oN32mSkD.jpeg?v=1775709255',
        mediaType: 'photo',
        width: null,
        height: null,
        providerId: null,
      },
      {
        sourceUrl: 'https://v56.erome.com/3825/Me5vkR0b/esLcr6Vd_720p.mp4',
        coverUrl: 'https://s56.erome.com/3825/Me5vkR0b/esLcr6Vd.jpg',
        mediaType: 'video',
        width: null,
        height: null,
        providerId: null,
      },
    ])
  })

  it('keeps only videos when requested', () => {
    const items = normalizeAlbumPayload({
      posts: [
        {
          content: [
            {
              type: 'image',
              url: 'https://cdn.example.com/frame.jpg',
              thumbnail: 'https://cdn.example.com/frame.jpg',
            },
            {
              type: 'video',
              url: 'https://cdn.example.com/clip.mp4',
              thumbnail: 'https://cdn.example.com/clip.jpg',
            },
          ],
        },
      ],
    })

    expect(keepVideoItems(items)).toEqual([
      {
        sourceUrl: 'https://cdn.example.com/clip.mp4',
        coverUrl: 'https://cdn.example.com/clip.jpg',
        mediaType: 'video',
        width: null,
        height: null,
        providerId: null,
      },
    ])
  })
})
