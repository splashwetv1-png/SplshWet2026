import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import {
  createCategory,
  deleteContents,
  deleteCategory,
  fetchAlbumFromProvider,
  getAlbumPreviewDefaults,
  listAdminContent,
  listCategories,
  saveVideoNormal,
} from '../services/admin-service.js'

const router = Router()

router.use(requireAuth)

router.get('/categorias', async (_req: Request, res: Response) => {
  try {
    const categorias = await listCategories()
    res.json({ success: true, categorias })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'failed to load categories',
    })
  }
})

router.post('/categorias', async (req: Request, res: Response) => {
  try {
    const categoria = await createCategory(req.body.nome)
    res.status(201).json({ success: true, categoria })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'failed to create category',
    })
  }
})

router.delete('/categorias/:id', async (req: Request, res: Response) => {
  try {
    await deleteCategory(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'failed to delete category',
    })
  }
})

router.get('/conteudos', async (_req: Request, res: Response) => {
  try {
    const conteudos = await listAdminContent()
    res.json({ success: true, conteudos })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'failed to load content',
    })
  }
})

router.delete('/conteudos', async (req: Request, res: Response) => {
  try {
    await deleteContents(req.body.ids || [])
    res.json({ success: true })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'failed to delete content',
    })
  }
})

router.post('/fetch-album', async (req: Request, res: Response) => {
  try {
    const result = await fetchAlbumFromProvider(req.body.url)
    res.json({
      success: true,
      albumUrl: result.albumUrl,
      ...getAlbumPreviewDefaults(result.items),
      items: result.items,
      raw: result.raw,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'failed to fetch album',
    })
  }
})

router.post('/conteudos/video-normal', async (req: Request, res: Response) => {
  try {
    const conteudo = await saveVideoNormal(req.body)
    res.status(201).json({ success: true, conteudo })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'failed to save media item',
    })
  }
})



export default router
